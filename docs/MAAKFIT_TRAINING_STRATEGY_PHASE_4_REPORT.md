# MAAKFIT Training Strategy Matrix V1 — Phase 4 Implementation Report

**Phase:** 4 — Assisted / Automated Program Assignment Flow  
**Status:** `PHASE_4_IMPLEMENTATION_PASSED`  
**Branch:** `feat/admin-command-center-foundation`  
**Base commit:** `af93b4e40e34251cfceba55eaa3767530159c8aa`  
**Precondition:** `PHASE_3_CLOSED_APPROVED` (QA report `PHASE_3_QA_PASSED` at `5d92b3e`)  
**Production:** NOT modified  

---

## 1. Executive Summary

Phase 4 adds a centralized **Training Assignment Orchestrator** that connects client Strategy Context → Strategy Matrix → Weekly Calendar → Core 100 + Safety → Program Generation → Validation → structured recommendation → coach review / automation eligibility → assignment payload — without rebuilding Training Engine V2.

**ASSISTED** mode is the V1 default (coach review required before assign). **AUTOMATED** capability is implemented and tested but **globally disabled** by default (`automatedGloballyDisabled: true`).

No database migrations were required. Existing `admin_assign_generated_v2_program` RPC and immutable snapshot architecture are reused.

---

## 2. Exact Base Commit

```
af93b4e40e34251cfceba55eaa3767530159c8aa
docs(training): add Phase 3 independent QA report with final retest pass.
```

Phase 3 domain closure SHA: `5d92b3e32353629d70894bc526c5434e757fd3ae`

---

## 3. Git Isolation

Phase 4 commit includes **only**:

- `src/lib/platform/training-assignment-orchestrator/*` (new module)
- `src/components/admin/ClientTrainingWorkspace.tsx` (orchestrator integration)
- Test updates: `admin-client-training.test.ts`, `client-loop.test.ts`, `strategy-matrix.test.ts`
- `package.json` (test gate entry)
- This report

Excluded from commit: nutrition, exercise media, auth, payments, Supabase migrations, unrelated UI.

---

## 4. Existing Assignment Architecture Audit

| Layer | Existing artifact | Phase 4 reuse |
|---|---|---|
| Generation | `generateTrainingProgram()` | Reused via `generateAuthorizedProgramCandidate()` |
| Validation | `validateTrainingProgram()`, `canActivateProgram()` | Reused — INVALID never assignable |
| Strategy bridge | `buildProgramGenerationContextFromProfile()` | Reused inside orchestrator |
| Calendar | `resolveWeeklyTrainingSchedule()` | Reused — provenance on candidate |
| Core 100 | `MAAKFIT_V1_CORE_100` pool | Enforced — no FULL_CATALOG fallback |
| Safety | `exercise-safety-rules.ts`, eligibility | Reused unchanged |
| Assignment RPC | `admin_assign_generated_v2_program` | Reused — no new RPC |
| Snapshots | `client_program_assignment_snapshots` migration | Reused — history preserved |
| Client runtime | `client_get_my_training_runtime` | Unchanged |
| Admin UI | `ClientTrainingWorkspace.tsx` | Refactored to call orchestrator |

**No `generateTrainingProgramV3()` or parallel engine created.**

---

## 5. Scope Implemented

- Central orchestrator: `prepareTrainingProgramAssignment()`
- Typed assignment modes: `ASSISTED` | `AUTOMATED`
- Assignment candidate model with provenance, recommendation, coach review
- Automation eligibility: `evaluateAutomaticAssignmentEligibility()`
- Coach actions: approve, reject, regenerate (domain + UI)
- Stale candidate detection via context fingerprint
- Free-tier automated assignment block
- Admin workspace integration with review summary UI
- Parameterized assignment test matrix (A–L)
- Full regression gates: `npm test`, `npm run build`, 144/144, Core 100 safety

**Not implemented (by design):** Full Coach Overrides engine, global automated rollout, VIP chat, multi-coach product, nutrition mutation.

---

## 6. Assignment Modes

```typescript
export const ASSIGNMENT_MODES = ["ASSISTED", "AUTOMATED"] as const;
```

- **ASSISTED (default):** Valid candidate → `REVIEW_REQUIRED` → coach approves → `READY_TO_ASSIGN` → RPC assign.
- **AUTOMATED:** Same pipeline; `evaluateAutomaticAssignmentEligibility()` must return `ELIGIBLE`. V1 default: `automatedGloballyDisabled: true`.

Mode is explicit in `PrepareTrainingProgramAssignmentInput.assignmentMode` — never inferred from UI alone.

---

## 7. Assignment Orchestrator

**Module:** `src/lib/platform/training-assignment-orchestrator/`

**Entry point:** `prepareTrainingProgramAssignment(input)`

**Pipeline:**

1. Build context fingerprint (stale detection)
2. `buildProgramGenerationContextFromProfile()` — Strategy + Core 100 gate
3. `generateAuthorizedProgramCandidate()` — generate + validate + fixed-load block
4. `resolveWeeklyTrainingSchedule()` — calendar provenance
5. `buildAssignmentRecommendation()` — deterministic explainability
6. `evaluateAutomaticAssignmentEligibility()` — automation gate
7. Resolve candidate state + assignment payload

**Also exported:** `approveAssignmentCandidate()`, `rejectAssignmentCandidate()`, `isAssignmentCandidateStale()`, `buildStrategyContextFingerprint()`

---

## 8. Candidate Model

`TrainingAssignmentCandidate` includes:

- `clientId`, `assignmentMode`, `state`
- `provenance` (strategy version, Core 100 version, goal, level, frequency, location, fingerprint)
- `weeklySchedule`, `strategy`, `generation`
- `automationEligibility`, `automationBlockReasons`, `blockingReasons`
- `reviewRequired`, `assignable`
- `recommendation[]`, `coachReview`, `clientExplanation`
- `assignmentPayload` (RPC-ready, only when assignable)
- `rejectionReason`

No unnecessary persistence before coach approval.

---

## 9. Assignment States

```typescript
"GENERATED" | "REVIEW_REQUIRED" | "READY_TO_ASSIGN" | "ASSIGNED" | "BLOCKED" | "REJECTED"
```

Distinct from program `validation.status` (`VALID` / `VALID_WITH_WARNINGS` / `INVALID`).

| Scenario | State |
|---|---|
| Assisted + valid program | `REVIEW_REQUIRED` |
| Assisted + invalid | `BLOCKED` |
| Automated + eligible (when enabled) | `READY_TO_ASSIGN` |
| Automated + disabled/blocked | `BLOCKED` or `REVIEW_REQUIRED` |
| Coach reject | `REJECTED` |
| Post-RPC assign | Existing `ASSIGNMENT_STATUSES` (`active`, `scheduled`, etc.) |

---

## 10. Strategy Matrix Integration

Orchestrator calls `buildProgramGenerationContextFromProfile()` which runs full `resolveTrainingStrategy()` chain. Unresolved male goal mappings remain fail-closed (`UNMAPPED_LEGACY_GOAL` → `BLOCKED`).

---

## 11. Weekly Calendar Integration

`resolveWeeklyTrainingSchedule()` attached to candidate when generation succeeds. Phase 2 calendar semantics preserved — no redesign.

---

## 12. Core 100 Integration

`exercisePoolVersion` on provenance is always `MAAKFIT_V1_CORE_100` when config valid. `CORE_100_POOL_UNAVAILABLE` → `BLOCKED`. No silent `FULL_CATALOG` fallback.

---

## 13. Safety Gate

Safety constraints flow through existing `exercise-safety-rules` + eligibility. `SAFETY_RESTRICTION_VIOLATION` / `INSUFFICIENT_SAFE_EXERCISE_COVERAGE` → `BLOCKED` or automation `SAFETY_REVIEW_REQUIRED`. Never silently removed.

---

## 14. Validation Gate

`generateAuthorizedProgramCandidate()` uses `canActivateProgram()`. INVALID programs → `assignable: false`, state `BLOCKED`. Assign CTA disabled in admin UI.

---

## 15. Automation Eligibility

`evaluateAutomaticAssignmentEligibility()` centralized in `eligibility.ts`.

Reason codes: `UNRESOLVED_GOAL`, `SAFETY_REVIEW_REQUIRED`, `MISSING_PROFILE_DATA`, `PROGRAM_INVALID`, `CORE_100_UNAVAILABLE`, `COACH_REVIEW_REQUIRED`, `AUTOMATED_DISABLED`, `FREE_ENTITLEMENT_BLOCKED`, `FIXED_LOAD_FORBIDDEN`, `GENERATION_BLOCKED`.

---

## 16. System Recommendation

`buildAssignmentRecommendation()` produces deterministic items:

`GOAL_ALIGNMENT`, `FREQUENCY_ALIGNMENT`, `LOCATION_ALIGNMENT`, `LEVEL_ALIGNMENT`, `RECOVERY_ALIGNMENT`, `SAFETY_ALIGNMENT`, `VALIDATION_ALIGNMENT`

No LLM prose.

---

## 17. Coach Review Flow

`CoachReviewSummary` on candidate: goal, level, days/week, location, session count, main emphasis, restrictions, warnings, blocking reasons, why generated.

Admin UI displays summary + recommendation list + reject / regenerate / assign actions.

---

## 18. Admin Workspace Integration

`ClientTrainingWorkspace.tsx`:

- `prepareTrainingProgramAssignment()` replaces inline generate chain
- Shows candidate state, coach review, recommendations
- Regenerate, Reject, Assign (with confirm dialog)
- `assignGeneratedV2Program()` unchanged for persistence

---

## 19. Client Runtime Integration

Assignment still flows: Admin RPC → snapshot → `client_get_my_training_runtime` → `/app` workout. No parallel viewer.

---

## 20. Missing Data Handling

Strategy resolution errors (`MISSING_GOAL`, `MISSING_TRAINING_FREQUENCY`, etc.) → `BLOCKED` with typed `blockingReasons`. No silent defaults invented.

---

## 21. Rejection / Regeneration

- `rejectAssignmentCandidate()` → `REJECTED`, not assignable
- Regenerate re-runs full orchestrator pipeline with same gates
- Deterministic: identical context fingerprint → identical generation

---

## 22. Assignment / Reassignment

Existing `assignGeneratedV2Program({ replace: true })` preserves history (`replaced` status). Orchestrator does not destroy prior assignments.

---

## 23. History Preservation

Immutable snapshot architecture unchanged. Completed sessions, set logs, progression data unaffected by orchestrator (read-only generation path).

---

## 24. Idempotency

- Domain: same fingerprint → deterministic candidate
- RPC: existing `admin_assign_generated_v2_program` idempotency (migration-level) unchanged
- UI: assign button disabled while pending / when not assignable

---

## 25. Concurrency / Stale Candidate Handling

`buildStrategyContextFingerprint()` + `isAssignmentCandidateStale()` + `priorContextFingerprint` input detect profile changes between generate and assign. Stale → `STALE_STRATEGY_CONTEXT` block.

---

## 26. Security / RLS

No new RPCs. Existing `_require_admin()` on assign functions. Client paths cannot call admin assign (verified in `program-assignment-snapshot.test.ts`, `client-program-runtime.test.ts`).

---

## 27. Entitlement Boundary

`membershipTier: "free"` blocks **automated** assignment (`FREE_ENTITLEMENT_BLOCKED`). Assisted coach path remains available for coach-managed review. Free preview path (`FREE_MEMBER_UNLOCKED_EXTERNAL_ID`) untouched.

---

## 28. Training / Nutrition Boundary

No nutrition files modified. Orchestrator does not touch calories, macros, or meals.

---

## 29. Future Coach Override Compatibility

Orchestrator returns structured candidate + provenance — extension point for future:

`Strategy Matrix → Base Recommendation → Coach Override Request → Engine Impact Analysis → Validated Override → Final Candidate`

`COACH_OVERRIDE_CONFLICT` already exists in generation status enum. Full override engine not implemented.

---

## 30. Future Multi-Coach Compatibility

`clientId` + `assigned_by` on existing snapshots support future multi-coach. No hardcoded global coach ID in orchestrator. **Current assumption:** single admin/coach pool via `_require_admin()`.

---

## 31. Files Changed

| File | Action |
|---|---|
| `src/lib/platform/training-assignment-orchestrator/types.ts` | Added |
| `src/lib/platform/training-assignment-orchestrator/eligibility.ts` | Added |
| `src/lib/platform/training-assignment-orchestrator/recommendation.ts` | Added |
| `src/lib/platform/training-assignment-orchestrator/orchestrator.ts` | Added |
| `src/lib/platform/training-assignment-orchestrator/index.ts` | Added |
| `src/lib/platform/training-assignment-orchestrator/training-assignment-orchestrator.test.ts` | Added |
| `src/components/admin/ClientTrainingWorkspace.tsx` | Modified |
| `src/lib/admin/admin-client-training.test.ts` | Modified |
| `src/lib/platform/client-loop/client-loop.test.ts` | Modified |
| `src/lib/platform/strategy-matrix/strategy-matrix.test.ts` | Modified |
| `package.json` | Modified (test gate) |
| `docs/MAAKFIT_TRAINING_STRATEGY_PHASE_4_REPORT.md` | Added |

---

## 32. Database Changes

**None.** Existing schema supports Phase 4. No `PHASE_4_DB_CHANGE_REQUIRES_APPROVAL`.

---

## 33. Tests Added / Updated

**New:** `training-assignment-orchestrator.test.ts` — matrix A–L (assisted, automated, invalid, safety, Core 100, missing data, HOME/GYM/BOTH, idempotency, reject, regenerate, security, randomness audit)

**Updated:** `admin-client-training.test.ts`, `client-loop.test.ts`, `strategy-matrix.test.ts` — orchestrator wiring assertions

---

## 34. Assignment QA Matrix

| Case | Result |
|---|---|
| A — Assisted valid → review → approve | PASS |
| B — Automated capability (disabled by default) | PASS |
| C — Invalid program → BLOCKED | PASS |
| D — Safety conflict | PASS |
| E — Core 100 enforced | PASS |
| F — Missing profile → BLOCKED | PASS |
| G — HOME compatible | PASS |
| H — GYM compatible | PASS |
| I — BOTH union | PASS |
| J — Deterministic duplicate | PASS |
| K — Rejected not assigned | PASS |
| L — Regenerate same gates | PASS |
| N — Client cannot admin-assign | PASS (existing tests) |

---

## 35. Core 100 Regression

`core-100-safety.test.ts`: **PASS**  
`validateCore100Config()`: **100/100**

---

## 36. Strategy Matrix 144/144 Regression

`core-100-qa.test.ts`: **144/144 PASS**

---

## 37. Training Engine Regression

All suites in `npm test` chain: **PASS** (strategy-matrix, calendar-resolver, program-generation, client-loop, training-v2-release, progression, volume, continuity, goal-intelligence, etc.)

---

## 38. npm test

**PASS** (including `training-assignment-orchestrator.test.ts: all tests passed`)

---

## 39. Build

**PASS** — `[verify-vercel-build] OK`

---

## 40. Hard-Code Audit

Phase 4 path audited:

- No fixed client/program/goal IDs in orchestrator
- No FULL_CATALOG fallback
- No admin bypass
- No hardcoded kg loads (fixed-load forbidden gate preserved)
- Test client ID `client-phase4-test` — test-only

---

## 41. Randomness Audit

No `Math.random()` in `training-assignment-orchestrator/` or program-generation path. Exercise selection remains deterministic (`external_id` tie-break).

---

## 42. Performance

Generation runs on explicit coach action (`generateV2` / regenerate), not on React render. No repeated full catalog reads per render.

---

## 43. Production Isolation

- Not merged to `main`
- Not deployed to Production
- No Production Supabase changes

---

## 44. Known Risks

1. **Single-coach admin model** — multi-coach assignment ownership not yet productized.
2. **Template assign path** — legacy template picker remains alongside V2 orchestrator (intentional V1 coexistence).
3. **Automated rollout** — capability exists but requires explicit product approval to enable globally.

---

## 45. Open Decisions

1. **CEO formal Phase 3 sign-off** — QA recommends `PHASE_3_CLOSED_APPROVED`; Phase 4 proceeded per authorization `APPROVED_FOR_IMPLEMENTATION_AFTER_PHASE_3_CLOSURE`.
2. **When to enable AUTOMATED globally** — product/release decision, not Phase 4.
3. **Male goal mappings (OGM-001/002)** — remain fail-closed; unchanged from Phase 3.

---

## 46. Acceptance Matrix

| Requirement | Status | Evidence |
|---|---|---|
| Existing Engine reused | PASS | `generateAuthorizedProgramCandidate` inside orchestrator |
| ASSISTED implemented | PASS | Default mode → `REVIEW_REQUIRED` |
| AUTOMATED capability implemented | PASS | `evaluateAutomaticAssignmentEligibility` |
| Automated globally disabled | PASS | `automatedGloballyDisabled` default true |
| Central orchestrator | PASS | `prepareTrainingProgramAssignment` |
| Strategy Matrix reused | PASS | `buildProgramGenerationContextFromProfile` |
| Calendar reused | PASS | `resolveWeeklyTrainingSchedule` on candidate |
| Core 100 enforced | PASS | Provenance + existing pool gate |
| No Full Catalog fallback | PASS | Static audit |
| Safety enforced | PASS | Existing rules + validation codes |
| Validation enforced | PASS | `canActivateProgram` |
| Invalid cannot assign | PASS | UI disabled + domain `assignable: false` |
| Missing data handled | PASS | Typed `blockingReasons` |
| Recommendation explainable | PASS | `buildAssignmentRecommendation` |
| Coach review functional | PASS | Admin UI + `CoachReviewSummary` |
| Admin path functional | PASS | `ClientTrainingWorkspace` |
| Client runtime functional | PASS | Unchanged RPC path |
| Reject functional | PASS | `rejectAssignmentCandidate` + UI |
| Regenerate functional | PASS | Re-run orchestrator |
| History preserved | PASS | Existing replace semantics |
| Idempotency | PASS | Fingerprint determinism + RPC |
| Client cannot Admin-assign | PASS | Existing RLS tests |
| Free entitlement protected | PASS | `FREE_ENTITLEMENT_BLOCKED` |
| Nutrition untouched | PASS | No nutrition files in commit |
| Coach Override compatible | PASS | Extension point documented |
| Multi-coach compatible | PASS | No hardcoded coach; documented assumption |
| 144/144 regression | PASS | `core-100-qa.test.ts` |
| Core 100 regression | PASS | `core-100-safety.test.ts` |
| npm test | PASS | Full suite |
| npm run build | PASS | verify-vercel-build OK |
| Clean commit | PASS | Isolated file set |
| Production untouched | PASS | No deploy |

---

## 47. Final Verdict

**`PHASE_4_IMPLEMENTATION_PASSED`**

---

## 48. Recommended Next Phase

**Phase 5** — Independent QA closure retest of assignment matrix + formal Phase 4 sign-off before any Production release consideration.

Do **not** globally enable AUTOMATED assignment without separate product approval.

---

**OPEN DECISIONS:**
- Global AUTOMATED enablement timing
- Male goal mapping policy (OGM-001/002) — remains blocked
- CEO Phase 3/4 formal closure signatures

**BLOCKERS:**
- None for implementation; QA retest pending

**KNOWN RISKS:**
- Template + V2 dual assign paths coexist
- Single-coach admin assumption

**RECOMMENDED NEXT PHASE:**
- Phase 5 independent QA after commit SHA handoff
