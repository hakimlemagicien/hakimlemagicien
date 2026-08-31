# MAAKFIT Training Strategy Matrix — Phase 2 Implementation Report

**Phase:** 2 — Weekly Calendar & Location Semantics  
**Status:** `PHASE_2_IMPLEMENTATION_PASSED_WITH_OPEN_DECISIONS`  
**Date:** 2026-08-30  
**Production:** NOT deployed (local/staging-ready only)

---

## 1. Executive Summary

Phase 2 adds weekly calendar orchestration on top of the Phase 1 Strategy Matrix without replacing Program Generation, Continuity, or Validator. Implemented:

- Quiz `trainingEnvironment` persistence into onboarding/profile answers payload
- Canonical weekday contract aligned with `training-assignment` `WeekdayId`
- Domain-level `resolveWeeklyTrainingSchedule()` calendar resolver
- Runtime bridge (`buildWeekdayPlansForAssignedRuntime`) with legacy fallback
- BOTH → union semantics preserved; session location uses `FLEXIBLE` when no per-day preference
- Continuity hook integration via resolved strategy from training profile
- Profile weekly-days display correction (removed hardcoded `4 أيام`)

All `npm test` and `npm run build` pass. No database migrations applied.

---

## 2. Repository State / Commit

| Item | Value |
|------|-------|
| Base HEAD | `88d6346e0d0b833c4e7990bcbc6d0bbb7ac5cffb` |
| Phase 2 commit | **Not created** (per user commit policy — changes uncommitted) |
| Working tree | **Not isolated** — Phase 1 + Phase 2 training files coexist with unrelated media, auth, nutrition, and audit changes |

**Note:** Phase 1 precondition isolation was not fully met. Phase 2 proceeded per explicit authorization; training changes are logically separable in `src/lib/platform/strategy-matrix/` and related hooks.

---

## 3. Phase 1 Precondition Verification

| Check | Result |
|-------|--------|
| Phase 1 strategy-matrix module present | PASS |
| Phase 1 tests pass | PASS (`strategy-matrix.test.ts`) |
| Unrelated work mixed in git tree | FAIL (documented, not blocking) |
| Phase 1 isolated commit | NOT CREATED |

**Precondition verdict:** `PHASE_2_BLOCKED_PHASE_1_NOT_ISOLATED` at git level only; implementation authorized and completed in training domain files.

---

## 4. Scope Implemented

| In scope | Status |
|----------|--------|
| A. Persist training environment | PASS |
| B. HOME/GYM/BOTH normalization | PASS (reused Phase 1) |
| C. Canonical weekday contract | PASS |
| D. Map sessions → calendar days | PASS |
| E. Rest day semantics | PASS (computed calendar layer) |
| F. Continuity integration | PASS |
| G. Deterministic behavior | PASS |

**Not implemented (by design):** Core 100, injury matrix, coach overrides, nutrition, pricing, Quiz UI changes, DB migrations.

---

## 5. Training Environment Persistence

**Fix:** `buildQuizAnswersPayload()` now includes `trainingEnvironment`.

**Flow:**

```
Quiz selection (localStorage)
  → buildQuizAnswersPayload({ ...quizAnswers, trainingEnvironment })
  → onboarding draft / training_profiles.answers
  → parseTrainingProfileAnswers()
  → TrainingStrategyInput.trainingEnvironment
  → resolveStrategyTrainingLocation()
  → TrainingStrategyLocation + permittedLocations
```

**Quiz UI:** unchanged (serialization only).

---

## 6. Location Normalization

Reused Phase 1 `resolveStrategyTrainingLocation()`:

| Input | Output |
|-------|--------|
| `gym` | `GYM` |
| `home` | `HOME` |
| `anywhere` | `BOTH` |

Legacy `trainingType` / `locationPreference` paths unchanged.

---

## 7. BOTH Semantics

- `BOTH` → `permittedLocations = ["GYM", "HOME"]` (union)
- Session placement uses `sessionLocation: FLEXIBLE` when client is BOTH
- No invented Mon=Gym / Wed=Home assignments

---

## 8. Equipment / Location Separation

Equipment resolution remains in `resolve-equipment.ts`. Calendar layer does not assume home gym equipment or zero home equipment. Exercise eligibility unchanged (Phase 1 BOTH union in `eligibility.ts`).

---

## 9. Weekday Contract

**Canonical type:** `WeekdayId` from `training-assignment.ts` (`sun`–`sat`).

**Strategy module:** `weekdays.ts` re-exports `WeekdayId`, defines `WEEKDAY_CALENDAR_ORDER` (Sunday-first internal order), `normalizePreferredTrainingDays()`, `sortWeekdays()`.

**ISO mapping:** `WEEKDAY_TO_ISO` / `ISO_DAY_TO_WEEKDAY` in `training-assignment.ts` (unchanged).

RTL display remains in `weekly-workout-schedule.ts` `WEEKDAY_NAMES` — display-only.

---

## 10. Preferred Training Days

- Contract field: `preferredTrainingDays: PreferredWeekdayId[]`
- Normalization: invalid rejected with warnings; duplicates removed; deterministic calendar sort
- No quiz collection of preferred days yet (not in current Quiz) — contract + parser ready
- Strategy resolver stores normalized preferred days

---

## 11. Schedule Fallback

**Centralized policy** (`SCHEDULE_FALLBACK_WEEKDAYS` in `calendar-resolver.ts`):

| Frequency | Fallback weekdays |
|-----------|-------------------|
| 2 | Tue, Fri |
| 3 | Mon, Wed, Fri |
| 4 | Mon, Tue, Thu, Sat |
| 5 | Mon–Fri |

Warning code: `SCHEDULE_FALLBACK_NO_PREFERRED_DAYS`.

When preferred days are fewer than frequency: stated preferences kept; remainder filled from fallback anchors (`MIXED` placement source).

---

## 12. Calendar Resolver

**Function:** `resolveWeeklyTrainingSchedule()` in `calendar-resolver.ts`

**Input:** abstract sessions, `trainingDaysPerWeek`, `preferredTrainingDays`, `trainingLocation`

**Output:** 7-day calendar (`WORKOUT` / `REST`), session sequence, placement source, session location, warnings

**Recovery:** adjacent HIGH-demand sessions with overlapping regions trigger swap or `RECOVERY_SPACING_WARNING`.

---

## 13. Session Placement

**Bridge:** `applyWeeklyScheduleToWeekdayPlans()` maps resolver output → `WeekdayWorkoutPlan` via existing `runtimeDayToPlan()`.

**Entry point:** `buildWeekdayPlansForAssignedRuntime(runtime, strategy)`:

- `strategy === null` → legacy `runtimeToWeekdayPlans()` (day_number ISO mapping)
- `strategy` resolved → calendar resolver path

---

## 14. Rest Day Semantics

- Calendar `dayKind: REST` = no scheduled session
- Computed at calendar layer (no DB `day_type=rest` rows added)
- `isRestDay: true` on weekday plans for non-workout days
- Rest days are not session records → not counted as missed by continuity adherence

---

## 15. Continuity Integration

- `useProgramContinuity` loads training profile → resolves strategy → `buildWeekdayPlansForAssignedRuntime()`
- Continuity engine (`getProgramContinuityDecision`, `overlayTodayPlan`) unchanged
- `programDaysFromRuntime()` still drives sequence/disruption logic
- Calendar layer schedules; continuity handles missed/shifted sessions

---

## 16. Recovery Spacing

- Resolver checks consecutive HIGH + regional overlap between placed sessions
- Attempts swap to non-consecutive weekday; emits warning if not possible
- Full program validation (`RECOVERY_SPACING_INVALID`) unchanged in generator

---

## 17. Timezone Handling

- Client timezone: `getUserTimeZone()` from readiness module (used by continuity)
- Weekly calendar uses weekday IDs, not server UTC date for placement
- **Gap:** no per-client timezone stored in training profile; relies on browser/local storage

---

## 18. Snapshot / History Compatibility

- No mutation of historical assignment snapshots
- Legacy assignments without strategy metadata continue via `runtimeToWeekdayPlans()`
- V2 snapshots still use `day_number = sequence_index + 1` at DB level; calendar is overlay

---

## 19. Legacy Compatibility

| Scenario | Behavior |
|----------|----------|
| No training profile / strategy fails | Legacy `runtimeToWeekdayPlans` |
| Free tier `WEEKDAY_WORKOUT_PLANS` | Unchanged (`LEGACY_FREE`) |
| Active assignment without preferred days | Legacy path until strategy resolves |

---

## 20. Profile Display Corrections

`buildProgramSummary()` `weeklyDays` now reads `trainingDaysPerWeek` from parsed profile answers; falls back to `"حسب خطتك"` instead of hardcoded `"4 أيام"`.

---

## 21. Files Changed

### New

| File | Purpose |
|------|---------|
| `src/lib/platform/strategy-matrix/weekdays.ts` | Canonical weekday helpers |
| `src/lib/platform/strategy-matrix/calendar-resolver.ts` | Weekly schedule resolver |
| `src/lib/platform/strategy-matrix/calendar-runtime.ts` | Runtime ↔ calendar bridge |
| `src/lib/platform/strategy-matrix/resolve-session-location.ts` | Session location semantics |
| `src/lib/platform/strategy-matrix/calendar-resolver.test.ts` | Phase 2 tests |
| `src/hooks/useWeeklyTrainingSchedule.ts` | Hook: strategy + schedule |
| `docs/MAAKFIT_TRAINING_STRATEGY_PHASE_2_REPORT.md` | This report |

### Modified

| File | Change |
|------|--------|
| `src/lib/quiz-answers-builder.ts` | Persist `trainingEnvironment` |
| `src/lib/platform/strategy-matrix/constants.ts` | Re-export weekdays |
| `src/lib/platform/strategy-matrix/resolve.ts` | Use `normalizePreferredTrainingDays` |
| `src/lib/platform/strategy-matrix/index.ts` | Export calendar APIs |
| `src/hooks/useProgramContinuity.ts` | Calendar-aware weekday plans |
| `src/lib/platform/profile-experience.ts` | Dynamic weekly days display |
| `package.json` | Add calendar test to `npm test` |

---

## 22. Database Changes

**None applied.**

No migration, no RLS changes, no production data changes.

---

## 23. Tests Added / Updated

**New:** `calendar-resolver.test.ts` covering:

1. Frequencies 2–5
2. Preferred weekdays honored
3. Duplicate/invalid weekday normalization
4. Missing preferred → fallback
5. Rest ≠ workout
6. Determinism
7. HOME/GYM/BOTH session location
8. Partial preferences (Scenario B)
9. Quiz payload persistence (gym/home/anywhere)
10. Legacy runtime compatibility
11. Continuity integration smoke
12. Fail-closed goal unchanged

**Updated:** `package.json` test script includes calendar test.

---

## 24. Test Results

```
npm test → PASS (all suites including strategy-matrix + calendar-resolver)
```

---

## 25. Build Result

```
npm run build → PASS
```

---

## 26. Hard-Code Audit

| Location | Classification | Action |
|----------|----------------|--------|
| `weekly-workout-schedule.ts` `WEEKDAY_WORKOUT_PLANS` | LEGACY_FREE | Kept |
| `resolveWeekdayPlan()` free path | LEGACY_FREE | Kept |
| `assigned-program-api.ts` `runtimeToWeekdayPlans` | DOMAIN (legacy compat) | Kept |
| `calendar-resolver.ts` `SCHEDULE_FALLBACK_WEEKDAYS` | DOMAIN CONFIG | New authoritative fallback |
| `profile-experience.ts` `4 أيام` | UNSAFE HARDCODE | **Fixed** |
| Workout routes `WEEKDAY_IDS` duplicate | DISPLAY_ONLY | Kept (display order) |
| `home-hub.ts` `resolveWeekdayPlan` | LEGACY_FREE / display | Kept |

---

## 27. Regression Results

| Suite | Result |
|-------|--------|
| strategy-matrix | PASS |
| program-generation | PASS |
| continuity-engine | PASS |
| client-loop | PASS |
| training-v2-release | PASS |
| progression / volume / goal-intelligence | PASS |
| assigned runtime | PASS |

---

## 28. Security / RLS Impact

**None.** No database changes; no RLS policy modifications.

---

## 29. Training/Nutrition Boundary

No nutrition, calorie, macro, or meal changes.

---

## 30. Known Risks

1. **Git isolation:** Phase 1/2 training work not committed separately from unrelated changes.
2. **Calendar shift on strategy load:** Clients with resolved strategy but no preferred days get fallback anchors (Mon/Wed/Fri for 3d) instead of legacy day_number→consecutive weekday mapping.
3. **Preferred days not collected in Quiz yet** — parser ready; UI collection deferred.
4. **Timezone:** browser-dependent; no authoritative client TZ in profile.

---

## 31. Open Decisions

| ID | Topic | Status |
|----|-------|--------|
| OD-PREF-DAYS-001 | Collect `preferredTrainingDays` in Quiz/onboarding | OPEN — no approved UI |
| OD-CAL-LEGACY-001 | When to migrate all clients from day_number mapping to calendar fallback | OPEN |
| OGM-001/002 | Male goal mapping | OPEN (Phase 1 carryover) |
| OD-TZ-001 | Authoritative client timezone source | OPEN |

---

## 32. Acceptance Criteria Matrix

| Requirement | Status | Evidence |
|---|---|---|
| environment persistence | PASS | `quiz-answers-builder.ts`, calendar test quiz payload section |
| GYM mapping | PASS | `strategy-matrix.test.ts`, calendar test |
| HOME mapping | PASS | same |
| BOTH mapping | PASS | `anywhere` → BOTH |
| BOTH union semantics | PASS | Phase 1 `eligibility.ts` unchanged |
| weekday contract | PASS | `weekdays.ts` + `training-assignment.ts` |
| frequency separate from preference | PASS | resolver + calendar resolver |
| preferred days scheduling | PASS | calendar-resolver.test.ts |
| fallback scheduling | PASS | `SCHEDULE_FALLBACK_WEEKDAYS` |
| rest days | PASS | `dayKind: REST` |
| rest ≠ missed | PASS | continuity uses workout days only |
| continuity reused | PASS | `useProgramContinuity` |
| recovery spacing | PASS | resolver adjustment + validator regression |
| legacy assignments compatible | PASS | `buildWeekdayPlansForAssignedRuntime(null)` |
| tests | PASS | `npm test` |
| build | PASS | `npm run build` |
| Production untouched | PASS | no deploy/migration |

---

## 33. Final Verdict

`PHASE_2_IMPLEMENTATION_PASSED_WITH_OPEN_DECISIONS`

---

## 34. Recommended Next Phase

**Phase 3 — Core 100 & Exercise Safety Constraints**

- Implement Core 100 exercise pool filtering
- Expand injury → exercise contraindication matrix
- Resolve OGM-001/002 male goal mappings (product decision)
- Consider Quiz collection of `preferredTrainingDays` when approved

---

## Final Status Block

```
PHASE_2_IMPLEMENTATION_PASSED_WITH_OPEN_DECISIONS

OPEN DECISIONS:
- OD-PREF-DAYS-001: preferred training days UI collection
- OD-CAL-LEGACY-001: full migration from day_number legacy mapping
- OGM-001/002: male/unmapped quiz goals (fail-closed)
- OD-TZ-001: authoritative client timezone

BLOCKERS:
- None for staging review (git isolation recommended before merge)

KNOWN RISKS:
- Mixed git working tree
- Calendar placement may differ from legacy when strategy profile loads without preferred days
- Browser timezone only

RECOMMENDED NEXT PHASE:
- Phase 3 — Core 100 & Exercise Safety Constraints
```
