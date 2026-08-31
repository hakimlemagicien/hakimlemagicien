# MAAKFIT Training Strategy Matrix — Phase 3 Implementation Report

**Phase:** 3 — Core 100 & Exercise Safety Constraints  
**Status:** `PHASE_3_IMPLEMENTATION_BLOCKED`  
**Date:** 2026-08-30  
**Production:** NOT deployed

---

## 1. Executive Summary

Phase 3 implemented the **safety constraint layer** and **Core 100 infrastructure** (validation, pool filter hooks, eligibility extensions). The CEO-approved **`EXERCISE_LIBRARY_V1_CORE_100` list of 100 `external_id` values is not present in the repository**, so Core 100 activation remains blocked per spec (`PHASE_3_BLOCKED_CORE_100_LIST_REQUIRED`).

Until the list is supplied, Strategy Matrix falls back to `FULL_CATALOG` for generation while safety rules are operational.

All `npm test` and `npm run build` pass. No database changes. Full 320-exercise catalog preserved.

---

## 2. Repository State / Commit

| Item | Value |
|------|-------|
| Base HEAD | `88d6346e0d0b833c4e7990bcbc6d0bbb7ac5cffb` |
| Phase 3 commit | **Not created** (per user commit policy) |
| Working tree | **Not isolated** — training Phases 1–3 mixed with unrelated media/auth/nutrition changes |

---

## 3. Git Isolation

| Check | Result |
|-------|--------|
| Training files identifiable | PASS |
| Isolated training-only commit | **NOT CREATED** |
| Unrelated changes present | FAIL |

**Verdict:** `PHASE_3_BLOCKED_GIT_ISOLATION` (documented; implementation proceeded in training domain files only).

---

## 4. Scope Implemented

| Area | Status |
|------|--------|
| Core 100 config artifact (structure) | PASS (empty — awaiting list) |
| Core 100 validation | PASS |
| Pool filter integration hooks | PASS |
| Injury → safety rules | PASS |
| Eligibility pipeline extension | PASS |
| Validator integration | PASS |
| Locked vs safety conflict | PASS |
| QA matrix (goals × days × locations) | **BLOCKED** (no Core 100 list) |
| Full catalog preservation | PASS |

---

## 5. Core 100 Source of Truth

**Artifact:** `src/lib/platform/strategy-matrix/config/core-100-external-ids.ts`

```typescript
export const CORE_100_EXTERNAL_IDS = [] as const;
```

**Status:** Empty — product-approved list required (OD-002).

---

## 6. Core 100 Version

**Identifier:** `EXERCISE_POOL_MAAKFIT_V1_CORE_100` (`MAAKFIT_V1_CORE_100`)

Exposed via `resolveExercisePoolVersion()` and `ResolvedTrainingStrategy.exercisePoolVersion`.

---

## 7. Core 100 Validation

**Function:** `validateCore100Config(catalog)` in `core-100.ts`

Checks: exactly 100 IDs, unique, exist in catalog, V2 eligible, no `REVIEW_REQUIRED`.

**Current result:** `CORE_100_LIST_EMPTY` — blocks pool activation.

---

## 8. Full Catalog Preservation

No exercise rows deleted, renumbered, or disabled. `FULL_CATALOG` path unchanged when Core 100 inactive.

---

## 9. Generation Pool Integration

**Flow:**

```
exercises (full catalog)
  → exercisesForPoolVersion(version)   [Core 100 filter when active]
  → filterProgramCandidates()          [location, equipment, level, safety, pool]
  → pickForSlot() / rankCandidates()   [unchanged]
```

**Context fields added:** `exercisePoolVersion`, safety inputs on `filterProgramCandidates`.

---

## 10. Movement Coverage

**Status:** NOT VERIFIED — requires populated Core 100 list + QA matrix.

---

## 11. Muscle Coverage

**Status:** NOT VERIFIED — blocked on Core 100 list.

---

## 12. Level Coverage

Safety rules respect existing `COMPLEXITY_INAPPROPRIATE` eligibility. Core 100 level matrix **not run** (list missing).

---

## 13. Location Coverage

Existing BOTH union semantics preserved. Core 100 HOME/GYM/BOTH matrix **not run** (list missing).

---

## 14. Equipment Coverage

Existing equipment eligibility unchanged. Core 100 equipment matrix **not run** (list missing).

---

## 15. Substitution Coverage

Uses existing `substitution_group` / movement role metadata via unchanged selection engine. Core 100 substitution audit **not run** (list missing).

---

## 16. Injury Taxonomy Audit

| INJURY_ID | DISPLAY (AR) | STORAGE | CONSUMERS | SAFETY SUPPORT |
|-----------|--------------|---------|-----------|----------------|
| `none` | لا إصابة | Quiz → `injuryIds` → `training_profiles.answers` | Strategy Matrix | Filtered (no constraint) |
| `knee` | إصابة الركبة | same | Strategy → safety rules | BLOCK: SQUAT, KNEE_EXTENSION, QUADRICEPS |
| `shoulder` | إصابة الكتف | same | Strategy → safety rules | BLOCK: VERTICAL_PUSH, shoulder muscles |
| `lower_back` | آلام أسفل الظهر | same | Strategy → safety rules | BLOCK: HINGE |
| `ankle` | إصابة الكاحل | same | Strategy → safety rules | BLOCK: LOCOMOTION, CALF_RAISE |
| `elbow` | إصابة المرفق | same | Strategy → safety rules | BLOCK: ELBOW_FLEXION/EXTENSION, arms |

**Source:** `src/components/quiz/InjuriesScreen.tsx`

---

## 17. Safety Rule Model

**Module:** `exercise-safety-rules.ts`  
**Version:** `MAAKFIT_EXERCISE_SAFETY_V1`

**Classifications:** `ALLOWED` | `CAUTION` | `BLOCKED`  
**Auto-generation:** `CAUTION` treated as `BLOCKED` (fail-closed).

---

## 18. Safety Eligibility Integration

Extended `explainEligibility()` with:

- `SAFETY_RESTRICTION`
- `NOT_IN_CORE_100` (when pool active)

Wired through `filterProgramCandidates`, `toProgramGenerationContext`, `validateTrainingProgram`.

---

## 19. Hard Safety vs Preferences

**Priority order enforced:**

```
Safety → Core 100 pool → Location/Equipment → Level → Selection ranking
```

- `lockedExternalIds` cannot override safety → `COACH_OVERRIDE_CONFLICT` with `SAFETY_RESTRICTION_VIOLATION`
- Client preferences cannot re-enable blocked exercises

---

## 20. Validator Integration

Reused `validateTrainingProgram()` — extended for:

- `NOT_IN_CORE_100`
- `SAFETY_RESTRICTION_VIOLATION` via eligibility pipeline

No second validator created.

---

## 21. Assignment Compatibility

Assignment RPC behavior unchanged. When Core 100 activates, validator rejects out-of-pool exercises in candidates.

---

## 22. History / Pool Versioning

`exercisePoolVersion` on strategy + generation context supports future provenance. Historical assignments not mutated.

---

## 23. Files Changed

### New

| File | Purpose |
|------|---------|
| `strategy-matrix/config/core-100-external-ids.ts` | Core 100 ID list (empty pending OD-002) |
| `strategy-matrix/core-100.ts` | Pool version, validation, filter |
| `strategy-matrix/exercise-safety-rules.ts` | Injury safety config |
| `strategy-matrix/core-100-safety.test.ts` | Safety + scaffold tests |
| `docs/MAAKFIT_TRAINING_STRATEGY_PHASE_3_REPORT.md` | This report |

### Modified

| File | Change |
|------|--------|
| `strategy-matrix/types.ts` | Safety fields, `ExercisePoolVersion` |
| `strategy-matrix/resolve-equipment.ts` | Operational safety resolver |
| `strategy-matrix/resolve.ts` | Pool version + safety exclusions |
| `strategy-matrix/to-program-context.ts` | Pool filter + dynamic safety blocks |
| `strategy-matrix/index.ts` | Exports |
| `strategy-matrix/strategy-matrix.test.ts` | Injury assertions |
| `prescription/eligibility.ts` | Safety + Core 100 codes |
| `program-generation/selection.ts` | Pass safety/pool to eligibility |
| `program-generation/generate.ts` | Safety-aware locked conflict |
| `program-generation/validate.ts` | Pool + safety validation |
| `program-generation/types.ts` | `exercisePoolVersion`, error codes |
| `package.json` | Test script |

---

## 24. Database Changes

**None.** No migrations. No RLS changes.

---

## 25. Tests Added / Updated

**New:** `core-100-safety.test.ts` — validation blocked state, injury rules, eligibility, locked/safety conflict, determinism, fail-closed goals.

**Updated:** `strategy-matrix.test.ts` — injury role blocking.

---

## 26. Core 100 QA Matrix

**Status:** NOT RUN — `PHASE_3_BLOCKED_CORE_100_LIST_REQUIRED`

Planned matrix: 6 canonical goals × 2–5 days × HOME/GYM/BOTH × BEGINNER/INTERMEDIATE.

---

## 27. Safety Test Matrix

| Test | Result |
|------|--------|
| Injury ID → safety resolver | PASS |
| Blocked movement filtered | PASS |
| Eligibility `SAFETY_RESTRICTION` | PASS |
| Safety overrides locked exercise | PASS |
| No injury → normal path | PASS |
| Unknown injury fail-closed warning | PASS |
| Deterministic rules | PASS |
| No medical inference in code | PASS |

---

## 28. Test Results

```
npm test → PASS (all suites including core-100-safety)
```

---

## 29. Build Result

```
npm run build → PASS
```

---

## 30. Regression Results

| Suite | Result |
|-------|--------|
| strategy-matrix | PASS |
| calendar-resolver | PASS |
| program-generation | PASS |
| continuity | PASS |
| client-loop | PASS |
| training-v2-release | PASS |
| exercise-library-v2 | PASS |
| prescription | PASS |

---

## 31. Hard-Code Audit

| Location | Classification | Action |
|----------|----------------|--------|
| `today-workout.ts` prescriptions | LEGACY_FREE | Kept |
| `weekly-workout-schedule.ts` | LEGACY_FREE | Kept |
| `exercise-safety-rules.ts` | DOMAIN CONFIG | New |
| `core-100-external-ids.ts` | CORE_V1_CONFIG (pending) | Awaiting list |
| Generator selection ranking | DOMAIN | Unchanged |

---

## 32. Performance Impact

Safety filtering is in-memory over already-loaded catalog. No N+1 DB queries added.

---

## 33. Security / RLS

**None.** Domain/config only.

---

## 34. Training/Nutrition Boundary

No nutrition changes.

---

## 35. Known Risks

1. **Core 100 list missing** — V1 launch pool cannot activate.
2. **Git isolation** — Phases 1–3 not committed separately.
3. **Safety rules are conservative heuristics** — not medical advice; coach review may be needed for edge cases.
4. **FULL_CATALOG fallback** — generation still uses full catalog until list populated.

---

## 36. Open Decisions

| ID | Topic |
|----|-------|
| **OD-002** | Authoritative Core 100 `external_id` list (100 IDs) — **BLOCKER** |
| OGM-001/002 | Male goal mapping |
| OD-SAFETY-001 | Product review of conservative injury → movement blocks |

---

## 37. Acceptance Criteria Matrix

| Requirement | Status | Evidence |
|---|---|---|
| Core 100 exactly 100 | **FAIL** | Empty config — `CORE_100_LIST_EMPTY` |
| Unique IDs | N/A | List missing |
| IDs exist | N/A | List missing |
| V2 eligible | N/A | List missing |
| Full catalog preserved | PASS | No deletions |
| Generator Core 100 only | **FAIL** | Falls back to FULL_CATALOG |
| All canonical goals | **FAIL** | QA matrix not run |
| HOME | **FAIL** | QA matrix not run |
| GYM | **FAIL** | QA matrix not run |
| BOTH | **FAIL** | QA matrix not run |
| 2–5 days | **FAIL** | QA matrix not run |
| Beginner | **FAIL** | QA matrix not run |
| Intermediate | **FAIL** | QA matrix not run |
| Movement coverage | **FAIL** | List missing |
| Muscle coverage | **FAIL** | List missing |
| Substitutions | **FAIL** | List missing |
| Injury propagation | PASS | `resolveStrategySafetyConstraints` |
| Safety exclusion | PASS | `core-100-safety.test.ts` |
| Safety fail-closed | PASS | Unknown injury + CAUTION=blocked |
| Validator reused | PASS | `validate.ts` |
| Tests | PASS | `npm test` |
| Build | PASS | `npm run build` |
| Production untouched | PASS | No deploy/migration |

---

## 38. Final Verdict

`PHASE_3_IMPLEMENTATION_BLOCKED`

**Primary blocker:** `PHASE_3_BLOCKED_CORE_100_LIST_REQUIRED`

Safety infrastructure is implemented and tested. Core 100 cannot be activated until the product supplies exactly 100 approved `external_id` values in `config/core-100-external-ids.ts`.

---

## 39. Recommended Next Phase

1. **Unblock:** Provide `EXERCISE_LIBRARY_V1_CORE_100` list (100 `external_id` values).
2. Re-run `validateCore100Config()` + full QA matrix.
3. Then proceed to **Phase 4 — Assisted / Automated Program Assignment Flow**.

---

## Final Status Block

```
PHASE_3_IMPLEMENTATION_BLOCKED

OPEN DECISIONS:
- OD-002: Authoritative Core 100 external_id list (100 exercises)
- OGM-001/002: Male/unmapped quiz goals
- OD-SAFETY-001: Product sign-off on injury → movement blocks

BLOCKERS:
- PHASE_3_BLOCKED_CORE_100_LIST_REQUIRED — no approved 100-ID list in repository
- PHASE_3_BLOCKED_GIT_ISOLATION — training changes not in isolated commit

KNOWN RISKS:
- FULL_CATALOG fallback active until Core 100 list populated
- Safety rules are training restrictions, not medical guidance

RECOMMENDED NEXT PHASE:
- Supply Core 100 list → re-validate → Phase 4 — Assisted / Automated Program Assignment Flow
```
