# MAAKFIT Training Program Strategy Matrix V1
# Phase 1 — Implementation Report

**Document:** `docs/MAAKFIT_TRAINING_STRATEGY_PHASE_1_REPORT.md`  
**Status:** `PHASE_1_IMPLEMENTATION_PASSED_WITH_OPEN_DECISIONS`  
**Depends on:** `PHASE_0_CLOSED_APPROVED`  
**Date:** 2026-08-30  
**Repository commit (local):** `88d6346e0d0b833c4e7990bcbc6d0bbb7ac5cffb` (Phase 1 changes uncommitted on top)

---

## 1. Executive Summary

Phase 1 delivers the **authoritative Strategy Matrix contract layer** and a single **Profile → `ProgramGenerationContext`** bridge for Training Engine V2.

A new domain module `src/lib/platform/strategy-matrix/` resolves client training context deterministically, **fails closed** on unmapped goals (no silent `FAT_LOSS`), wires training level / frequency / duration / location / equipment / injuries into generator input, and refactors the admin V2 generation path to use the resolver instead of UI hardcoding.

**No parallel training engine was created.** Existing `generateTrainingProgram`, validation, prescription, progression, volume, and client loop remain unchanged in responsibility.

**No database migrations** were applied.

---

## 2. Repository State / Commit

| Item | Value |
|------|-------|
| Base commit | `88d6346e0d0b833c4e7990bcbc6d0bbb7ac5cffb` |
| Phase 0 closure | `docs/MAAKFIT_TRAINING_STRATEGY_PHASE_0_CLOSURE.md` |
| Phase 0 audit | `docs/تقارير/MAAKFIT_TRAINING_STRATEGY_PHASE_0_AUDIT.md` |
| Production | **Not modified** |
| Staging | **Not modified** |

Pre-implementation inspection confirmed Phase 0 paths still match (admin `FAT_LOSS` fallback, `UNASSESSED`, `availableMinutes: 50` in `ClientTrainingWorkspace.tsx`).

---

## 3. Scope Implemented

| Responsibility | Status |
|----------------|--------|
| A. Strategy Matrix domain contracts | ✅ |
| B. Profile → Strategy Context resolution | ✅ |
| C. Canonical goal resolution hardening (fail-closed) | ✅ |
| D. Level / duration / frequency / location wiring | ✅ |
| E. Integration with `ProgramGenerationContext` | ✅ |

**Out of scope (not implemented):** Core 100 filtering, weekly calendar scheduling, coach override workflow, automated assignment, nutrition changes, workout UI redesign, production deploy.

---

## 4. Phase 0 Decisions Applied

| Decision | Application |
|----------|-------------|
| `EXTEND_EXISTING_TRAINING_ENGINE_V2` | Reused `generateTrainingProgram` + `ProgramGenerationContext` |
| Strategy Matrix = orchestration only | No prescription/progression/volume duplication |
| No silent `FAT_LOSS` | `resolveStrategyGoal` fails closed |
| `GYM` / `HOME` / `BOTH` | `TrainingStrategyLocation`; `anywhere` → `BOTH` |
| BOTH = union not intersection | `permittedLocations` + eligibility OR semantics |
| Equipment ≠ location | Separate fields in contracts |
| Injuries → strategy safety | `safety.injuryIds` + `injuryIds` on context |
| `training_days_per_week` ≠ `preferred_training_days` | Separate fields |
| No DB migration in Phase 1 | Used existing `training_profiles`, `client_training_levels` |
| Admin must not own strategy | `ClientTrainingWorkspace` refactored |

---

## 5. Strategy Input Contract

**Type:** `TrainingStrategyInput`  
**File:** `src/lib/platform/strategy-matrix/types.ts`

Represents raw client context without inventing missing values:

- `userId`, `rawGoalId`, `profileGoal`, `gender`
- `assessedTrainingLevel`
- `trainingDaysPerWeek`, `preferredTrainingDays`
- `sessionDurationMinutes`
- `trainingEnvironment`, `trainingType`, `locationPreference`
- `availableEquipment`, `injuryIds`
- `lockedExternalIds`, `excludedExternalIds`, `coachProtected`

Parser: `parseTrainingProfileAnswers()` in `profile-source.ts` normalizes `training_profiles.answers` JSONB.

---

## 6. Resolved Strategy Contract

**Type:** `ResolvedTrainingStrategy`  
**File:** `src/lib/platform/strategy-matrix/types.ts`

Deterministic output of `resolveTrainingStrategy()` including:

- `canonicalGoal`, `trainingLevel`, `trainingDaysPerWeek`
- `preferredTrainingDays` (calendar — not used by generator in Phase 1)
- `sessionDurationMinutes` + `sessionDurationSource`
- `trainingLocation`, `permittedLocations`
- `availableEquipment`, `equipmentSource`
- `safety` (`injuryIds`, `restrictedMuscles`, `warnings`)
- `exercisePoolVersion: "FULL_CATALOG"` (Core 100 hook for Phase 3)

---

## 7. Strategy Version

```typescript
// src/lib/platform/strategy-matrix/version.ts
export const MAAKFIT_TRAINING_STRATEGY_V1 = "MAAKFIT_TRAINING_STRATEGY_V1";
```

Present on every `ResolvedTrainingStrategy.strategyVersion`.

---

## 8. Profile Resolver

**Authoritative entry:** `buildProgramGenerationContextFromProfile()`  
**File:** `src/lib/platform/strategy-matrix/build-from-profile.ts`

Pipeline:

```
TrainingStrategyInput
  → resolveTrainingStrategy()
  → ResolvedTrainingStrategy
  → toProgramGenerationContext()
  → ProgramGenerationContext
```

Internal resolvers:

| Function | File |
|----------|------|
| `resolveStrategyGoal` | `resolve-goal.ts` |
| `resolveStrategyTrainingLevel` | `resolve-level.ts` |
| `resolveStrategyFrequency` | `resolve-frequency.ts` |
| `resolveStrategySessionDuration` | `resolve-duration.ts` |
| `resolveStrategyTrainingLocation` | `resolve-location.ts` |
| `resolveStrategyEquipment` / `resolveStrategySafetyConstraints` | `resolve-equipment.ts` |

Admin profile loader: `loadAdminClientTrainingStrategyInput()` in `admin-profile.ts` reads `training_profiles` + `client_training_levels` via existing RLS.

---

## 9. Goal Resolution

**Fail-closed.** Unknown/unmapped goals return `UNMAPPED_LEGACY_GOAL` or `MISSING_GOAL` — **never** `FAT_LOSS`.

| Raw goal | Result |
|----------|--------|
| `glutes`, `fat`, `waist`, `body` | Maps to canonical (existing `resolveCanonicalGoal`) |
| `FAT_LOSS`, etc. | Canonical passthrough |
| `muscle`, `fitness`, `athletic`, `shape`, `gain`, `tone`, `fit` | **BLOCKED** — `OPEN_GOAL_MAPPING_DECISIONS` |
| empty | `MISSING_GOAL` |

Exported list: `OPEN_GOAL_MAPPING_DECISIONS` in `resolve-goal.ts`.

---

## 10. Training Level Wiring

Priority: `assessedTrainingLevel` from `client_training_levels` → else `UNASSESSED`.

- Admin path: `fetchAdminClientTrainingLevel(userId)`  
- No new assessment algorithm introduced

---

## 11. Frequency Wiring

- Client: `trainingDaysPerWeek` from profile answers when present
- Coach override: admin `pickerDays` → `StrategyResolutionOverrides.trainingDaysPerWeek`
- Supported: **2–5** (`STRATEGY_SUPPORTED_DAYS_PER_WEEK`)
- Missing frequency: `MISSING_TRAINING_FREQUENCY` (blocks resolution)

---

## 12. Preferred Days Contract

- Field: `preferredTrainingDays: PreferredWeekdayId[]`
- Stored on `ResolvedTrainingStrategy` only
- **Not** consumed by program generator in Phase 1 (Phase 2 calendar)

---

## 13. Session Duration Wiring

- Client value when present → `sessionDurationSource: "CLIENT"`
- Missing → `STRATEGY_FALLBACK_SESSION_DURATION_MINUTES` (50) with `sessionDurationSource: "FALLBACK_DEFAULT"`
- Invalid (≤0, NaN) → `INVALID_SESSION_DURATION`

Domain owns the decision; admin no longer hardcodes `availableMinutes: 50`.

---

## 14. Location Semantics

| Input | Resolved |
|-------|----------|
| `trainingEnvironment: "gym"` | `GYM` |
| `trainingEnvironment: "home"` | `HOME` |
| `trainingEnvironment: "anywhere"` | `BOTH` |
| `training_type` / `location_preference` hints | Heuristic fallback |
| Unresolvable | `UNKNOWN_TRAINING_LOCATION` |

**BOTH:** `permittedLocations: ["GYM", "HOME"]` — exercises eligible if compatible with **any** permitted environment (union).

Extended `explainEligibility` + `filterProgramCandidates` to accept `permittedLocations`.

---

## 15. Equipment Handling

- Preserved from profile `availableEquipment` when present
- **Not** inferred from `HOME` or `GYM`
- `equipmentSource: "CLIENT" | "UNKNOWN"`

---

## 16. Injury / Restriction Handling

- `injuryIds` normalized (filters `"none"`)
- `safety.injuryIds` on resolved strategy
- `injuryIds` + `restrictedMuscles` passed to `ProgramGenerationContext`
- Warning: `INJURY_CONSTRAINTS_PENDING_PHASE_3` when injuries present
- Full exercise exclusion matrix deferred to Phase 3

---

## 17. ProgramGenerationContext Integration

**Extended** (not replaced) `ProgramGenerationContext` in `program-generation/types.ts`:

- `permittedLocations?: LocationCompatibility[]`
- `injuryIds?: string[]`

`toProgramGenerationContext()` maps resolved strategy → existing generator input.

---

## 18. Admin Generation Integration

**File:** `src/components/admin/ClientTrainingWorkspace.tsx` → `generateV2()`

Before:

```typescript
const goalId = mapped.canonicalId ?? "FAT_LOSS"; // REMOVED
trainingLevel: "UNASSESSED", availableMinutes: 50 // REMOVED
```

After:

```typescript
const strategyInput = await loadAdminClientTrainingStrategyInput(clientId, overview);
const built = buildProgramGenerationContextFromProfile(strategyInput, { exercises: catalog, overrides });
if (!built.ok) { /* fail-closed UI */ }
generateAuthorizedProgramCandidate(built.context);
```

---

## 19. Entitlement Boundary

No changes to `membership.ts` or tier features. Strategy resolver does not duplicate package logic.

---

## 20. Training/Nutrition Boundary

No nutrition tables, RPCs, or meal logic modified. Strategy module has no nutrition imports.

---

## 21. Legacy/V2 Isolation

- Free preview lane (`today-workout.ts`, `getSetProgression`) untouched
- V2 generator path unchanged except location OR filter extension
- Legacy `+10%` not introduced into paid lane

---

## 22. Files Changed

### New

| Path |
|------|
| `src/lib/platform/strategy-matrix/version.ts` |
| `src/lib/platform/strategy-matrix/constants.ts` |
| `src/lib/platform/strategy-matrix/types.ts` |
| `src/lib/platform/strategy-matrix/resolve-goal.ts` |
| `src/lib/platform/strategy-matrix/resolve-level.ts` |
| `src/lib/platform/strategy-matrix/resolve-frequency.ts` |
| `src/lib/platform/strategy-matrix/resolve-duration.ts` |
| `src/lib/platform/strategy-matrix/resolve-location.ts` |
| `src/lib/platform/strategy-matrix/resolve-equipment.ts` |
| `src/lib/platform/strategy-matrix/resolve.ts` |
| `src/lib/platform/strategy-matrix/to-program-context.ts` |
| `src/lib/platform/strategy-matrix/profile-source.ts` |
| `src/lib/platform/strategy-matrix/build-from-profile.ts` |
| `src/lib/platform/strategy-matrix/admin-profile.ts` |
| `src/lib/platform/strategy-matrix/index.ts` |
| `src/lib/platform/strategy-matrix/strategy-matrix.test.ts` |

### Modified (Phase 1)

| Path | Change |
|------|--------|
| `src/components/admin/ClientTrainingWorkspace.tsx` | Use strategy resolver |
| `src/lib/platform/program-generation/types.ts` | `permittedLocations`, `injuryIds` |
| `src/lib/platform/program-generation/generate.ts` | Pass `permittedLocations` to filter |
| `src/lib/platform/program-generation/selection.ts` | Filter supports `permittedLocations` |
| `src/lib/platform/prescription/eligibility.ts` | BOTH union semantics |
| `package.json` | Add strategy-matrix test to `npm test` |

---

## 23. Database Changes

**None.**

Uses existing:

- `training_profiles` (admin read via `training_profiles_admin_select` RLS)
- `client_training_levels` (admin read via `client_training_levels_admin_select` RLS)

---

## 24. Tests Added/Updated

| File | Coverage |
|------|----------|
| `strategy-matrix.test.ts` | 16+ unit scenarios + 5 integration scenarios (A–E) |
| `package.json` | Wired into `npm test` |

Existing suites re-run unchanged (program-generation, client-loop, training-v2-release, etc.).

---

## 25. Test Results

```bash
npm run test
# Exit code: 0 — all suites PASS including strategy-matrix.test.ts
```

Key assertions:

- `muscle` goal does **not** resolve to `FAT_LOSS`
- BOTH uses union eligibility
- Profile → context → `generateTrainingProgram` for known goals
- Admin static audit: no `canonicalId ?? "FAT_LOSS"`

---

## 26. Build Result

```bash
npm run build
# Exit code: 0 — PASS
# postbuild verify-vercel-build: OK
```

---

## 27. Hard-Code Audit

| Location | Value | Classification | Action |
|----------|-------|----------------|--------|
| `ClientTrainingWorkspace.tsx` (before) | `FAT_LOSS` fallback | **UNSAFE HARDCODE** | **Removed** |
| `ClientTrainingWorkspace.tsx` (before) | `availableMinutes: 50` | **UNSAFE HARDCODE** | **Removed** |
| `ClientTrainingWorkspace.tsx` (before) | `trainingLevel: UNASSESSED` | **UNSAFE HARDCODE** | **Removed** |
| `constants.ts` | `STRATEGY_FALLBACK_SESSION_DURATION_MINUTES = 50` | **VALID DOMAIN DEFAULT** | Kept — explicit fallback when client duration unknown |
| `resolve-level.ts` | `UNASSESSED` when no assessed level | **VALID DOMAIN DEFAULT** | Kept — engine contract |
| `client-loop.test.ts` | `availableMinutes: 50` | **TEST FIXTURE** | Unchanged |
| `training-v2-release.test.ts` | `FAT_LOSS` fixtures | **TEST FIXTURE** | Unchanged |
| `prescription-engine.test.ts` | `UNASSESSED` fixtures | **TEST FIXTURE** | Unchanged |

---

## 28. Regression Results

| Suite | Result |
|-------|--------|
| `program-generation.test.ts` | PASS |
| `client-loop.test.ts` | PASS |
| `training-v2-release.test.ts` | PASS |
| `prescription-engine.test.ts` | PASS |
| `volume-engine.test.ts` | PASS |
| `continuity-engine.test.ts` | PASS |
| `goal-intelligence.test.ts` | PASS |
| `workout-runtime.test.ts` | PASS |

Client loop and assignment snapshot behavior unchanged.

---

## 29. Security / RLS Impact

- Admin profile reads use existing authenticated admin RLS policies
- No new RPCs or policies
- No service-role exposure in client code
- No weakening of member data boundaries

---

## 30. Known Risks

| Risk | Mitigation |
|------|------------|
| Male quiz goals block admin generation until mapped | Documented `OPEN_GOAL_MAPPING_DECISIONS`; fail-closed UI messages |
| `trainingEnvironment` not always in `training_profiles.answers` JSON | Location may fail with `UNKNOWN_TRAINING_LOCATION` until quiz payload extended |
| Injuries wired but not enforced in generator | Phase 3 safety matrix; warning flag in Phase 1 |
| Coach must set `pickerDays` when profile lacks frequency | Explicit `MISSING_TRAINING_FREQUENCY` error |

---

## 31. Open Decisions

### OPEN_GOAL_MAPPING_DECISIONS

| ID | Goal IDs | Why required | Current safe behavior |
|----|----------|--------------|------------------------|
| OGM-001 | `muscle`, `fitness`, `athletic`, `shape`, `gain` | CEO: no invented mappings | Generation blocked |
| OGM-002 | `tone`, `fit` | Documented unmapped in Phase 2 contracts | Generation blocked |

### OPEN_DECISION_ID: OD-QUIZ-ENV-001

| Field | Detail |
|-------|--------|
| Description | `trainingEnvironment` collected in quiz localStorage but not in `buildQuizAnswersPayload()` |
| Why required | Reliable HOME/GYM/BOTH without `training_type` heuristics |
| Current safe behavior | Resolver uses `trainingEnvironment` when present in answers; else heuristic; else fail |
| Recommendation | Add `trainingEnvironment` to quiz answers payload in a controlled quiz phase (not Phase 1 scope) |

---

## 32. Acceptance Criteria Matrix

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Strategy Input Contract | **PASS** | `strategy-matrix/types.ts` → `TrainingStrategyInput` |
| Resolved Strategy Contract | **PASS** | `strategy-matrix/types.ts` → `ResolvedTrainingStrategy` |
| Strategy Version | **PASS** | `version.ts` → `MAAKFIT_TRAINING_STRATEGY_V1` |
| Profile Resolver | **PASS** | `build-from-profile.ts` → `buildProgramGenerationContextFromProfile` |
| Goal fail-closed | **PASS** | `strategy-matrix.test.ts` — `muscle` blocked |
| Level wiring | **PASS** | `admin-profile.ts` + `resolve-level.ts` |
| Frequency wiring | **PASS** | `resolve-frequency.ts` + admin `pickerDays` override |
| Duration wiring | **PASS** | `resolve-duration.ts` |
| HOME/GYM/BOTH | **PASS** | `resolve-location.ts` + eligibility tests |
| Equipment separation | **PASS** | `resolve-equipment.ts` + test |
| Injury propagation | **PASS** | `injuryIds` on context — test scenario E |
| Existing generator reused | **PASS** | `generateTrainingProgram(built.context)` |
| No parallel engine | **PASS** | No new generator module |
| Tests | **PASS** | `npm run test` exit 0 |
| Build | **PASS** | `npm run build` exit 0 |
| Production untouched | **PASS** | No deploy/migration |

---

## 33. Final Verdict

### `PHASE_1_IMPLEMENTATION_PASSED_WITH_OPEN_DECISIONS`

**OPEN DECISIONS:**

- OGM-001 / OGM-002: Male and ambiguous quiz goal → canonical mappings (CEO/product)
- OD-QUIZ-ENV-001: Persist `trainingEnvironment` in `training_profiles.answers`

**BLOCKERS:**

- None for Phase 1 closure — male goals intentionally block until mapping approved

**KNOWN RISKS:**

- See §30

**RECOMMENDED NEXT PHASE:**

- **Phase 2 — Weekly Calendar & Location Semantics** (preferred days scheduling, quiz environment persistence)
- Parallel track: approve **OGM-001** goal mappings before enabling automated onboarding generation for male clients

---

## 34. Recommended Next Phase

**Phase 2 — Weekly Calendar & Location Semantics**

1. Persist `trainingEnvironment` in onboarding answers
2. Map `preferredTrainingDays` to calendar / continuity overlays
3. Optional rest-day insertion in snapshot builder

**Do not start Phase 2 until this report is reviewed and approved.**

---

*End of Phase 1 report.*
