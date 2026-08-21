# GOAL-BASED ADAPTIVE TRAINING ENGINE V2
# PHASE 6/12 — DOUBLE PROGRESSION & ADAPTIVE LOAD ENGINE REPORT

**Date:** 2026-08-21  
**Executor:** Cursor — Platform Development  
**Final status:** `PHASE_6_IMPLEMENTED_READY_FOR_QA`  
**Phase 7:** not started.

---

## A. EXECUTIVE SUMMARY

Phase 6 converts Phase 5 actual performance history into **next-session** prescription decisions. The default model for load + rep resistance work is **Double Progression: reps first, then the smallest valid load increment**.

The engine is a pure domain function (`getNextSessionProgression`). It is separate from Phase 4 intra-session calibration and from Phase 5 runtime UI. It does not add weekly volume, recovery/deload logic, missed-session continuity, regional response, program generation, or nutrition adaptation.

KEEP is a first-class outcome. Hitting numbers at VERY_HARD/FAILURE, missing data, safety, recovery hold, large isolation jumps, and partial sessions do not produce aggressive load increases.

---

## B. PROGRESSION ENGINE ARCHITECTURE

```
HISTORY (Phase 2 listExerciseSetHistory)
  → exclude current session (next-session only)
  → getNextSessionProgression (Phase 6 domain)
  → applyProgressionToLoad / getCoreExercisePrescription (Phase 4)
  → Workout Runtime (Phase 5) for the next visit
```

Single decision source: `src/lib/platform/progression/`. Not in React state, not in SQL triggers, not duplicated in Progress UI / Admin / Program Generator.

Entry points:

| Function | File | Role |
|----------|------|------|
| `getNextSessionProgression` | `progression/engine.ts` | Deterministic next-session action |
| `applyProgressionToLoad` | `progression/apply.ts` | Merge decision into prescribed load |
| `nextValidLoad` | `progression/increments.ts` | Equipment-aware increment |
| `groupExposures` | `progression/exposures.ts` | Valid working-set exposures (not calendar days) |
| `excludeCurrentSession` | `progression/engine.ts` | Prevent intra-session rewrite |

---

## C. INPUT CONTRACT

`ProgressionContext` (`progression/types.ts`):

- `externalId` + `exercise` metadata (identity is `external_id`)
- `history: ExerciseSetHistoryItem[]` (targeted, not full user history)
- `trainingLevel`, `exerciseExperience`, `prescriptionState`
- `recoveryHold`: `NORMAL` \| `RECOVERY_LIMITED` \| `DELOAD_ACTIVE` \| `PROGRESSION_HOLD` (input only; Phase 7 owns the recovery engine)
- `safetyReview`, `techniqueDegraded` (technique not fabricated if missing)
- `goalId` (does not override gates)
- `requiredWorkingSets`, `repMin`/`repMax`, optional duration range
- `availableIncrementKg` / `validLoads` (no universal %)
- `coachProtected` / `coachLoad`
- `prescribedLoad` (to evaluate client manual override)

---

## D. ACTION CONTRACT

Canonical `ProgressionAction` union (`PROGRESSION_ACTIONS`):

`INCREASE_REPS` · `KEEP_LOAD` · `INCREASE_LOAD` · `DECREASE_LOAD` · `HOLD_PROGRESSION` · `RECALIBRATE` · `PROGRESS_VARIATION` · `REGRESS_VARIATION` · `INCREASE_DURATION` · `KEEP_DURATION` · `PLATEAU_REVIEW` · `RECOVERY_REVIEW` · `INSUFFICIENT_DATA` · `SAFETY_REVIEW`

`NextSessionProgression` fields: `exercise_external_id`, current/next load, current/next rep range, current/next duration, `progression_action`, `reason_code`, `confidence`, `client_explanation`, `created_from_session_id`.

There is no `ADD_VOLUME` action.

---

## E. DOUBLE PROGRESSION RULES

For standard resistance contracts (example 8–12, 3 working sets):

1. Stay at current valid load while climbing the rep range.
2. Increase load only after **all required working sets** reach `rep_max` **and** effort/safety/recovery/data gates pass.
3. After a successful load increase, a drop toward the low end of the range (e.g. 9/9/8) is **NEW_LOAD_TOLERATED** / `KEEP_LOAD`.

Evidence: `decideResistance` in `engine.ts`; tests 9/9/8 → `INCREASE_REPS`, 12/11/10 → `KEEP_LOAD`, 12/12/12 IDEAL → `INCREASE_LOAD`.

---

## F. KEEP_LOAD RULES

KEEP (or `INCREASE_REPS` without load change) when:

- in range but not all sets at `rep_max` (12/11/10)
- new load still in range (9/9/8 after 12s)
- one weak last set (9/8/7)
- one slightly weaker session still in range
- missing effort at top range (conservative, not IDEAL)
- large equipment jump
- coach lock

---

## G. INCREASE_REPS RULES

When all working sets are inside the range **and all are below `rep_max`** (9/9/8), action is `INCREASE_REPS` with `REP_RANGE_NOT_MAXED`. Next load unchanged. No +1-rep-every-set requirement.

---

## H. INCREASE_LOAD RULES

All of:

- required working sets completed (no skip, no warmup counted)
- every working set `actual_reps >= rep_max`
- effort IDEAL or EASY (missing effort ≠ IDEAL; VERY_HARD/FAILURE block)
- no safety / recovery / deload / reconditioning / technique block
- smallest valid increment exists and is not too large for the mechanic

Easy top-end uses `TOP_RANGE_EASY` but still the **smallest** increment.

---

## I. DECREASE_LOAD RULES

- New load below `rep_min` on a majority of sets with VERY_HARD/FAILURE → `NEW_LOAD_NOT_TOLERATED`
- Repeated below-min + hard effort on loaded work → `BELOW_REP_MIN`
- Client-chosen higher load that fails → `MANUAL_HIGH_LOAD_REJECTED` (do not adopt 30 kg as baseline)
- One last set below min with earlier sets valid → **not** decrease (`ONE_WEAK_SET`)
- One weaker in-range session → **not** decrease (`SINGLE_SESSION_VARIANCE`)

---

## J. LOAD INCREMENT STRATEGY

`nextValidLoad` uses `validLoads` (stack/plates) or `availableIncrementKg`. No +5% / +10% / upper-vs-lower percentage.

Examples:

- 20 → next in `[20, 22, 24]` = **22** (not 21 or 22.5)
- machine `[40, 45, 50]` from 40 → **45** (not 42.5)
- unknown increment → `KEEP_LOAD` / `EQUIPMENT_INCREMENT_LIMITED` (does not invent hardware)

---

## K. COMPOUND VS ISOLATION HANDLING

Relative jump caps: isolation `0.15`, compound `0.25` (`ISOLATION_RELATIVE_JUMP_LIMIT` / `COMPOUND_RELATIVE_JUMP_LIMIT`). Lateral raise 5 → 7.5 is held. Body region is not used as a universal law.

---

## L. NEW LOAD TOLERANCE

| Pattern | Action |
|---------|--------|
| 12/12/12 then 9/9/8 in range | `KEEP_LOAD` / `NEW_LOAD_TOLERATED` |
| 6/5 FAILURE after jump | `DECREASE_LOAD` / `NEW_LOAD_NOT_TOLERATED` |
| 9/8/7 last set only | `KEEP_LOAD` / `ONE_WEAK_SET` |

---

## M. BODYWEIGHT PROGRESSION

No kg requirement. Reps first; at practical ceiling (`min(rep_max, 15)`) with EASY/acceptable effort → `PROGRESS_VARIATION` (`BODYWEIGHT_REP_CEILING`). Below min + FAILURE → `REGRESS_VARIATION` (does not `DECREASE_LOAD`). Does not pick a substitute exercise ID (no auto-substitution).

---

## N. TIMED PROGRESSION

`DURATION` (and timed `INTERVAL` when `supports_timed_prescription`): duration first. 30s in 20–40 → `INCREASE_DURATION`. Top of range with EASY/IDEAL → `PROGRESS_VARIATION`. Does not convert duration to reps. Full conditioning engine is not built; unsupported interval contracts return `CONDITIONING_DEFERRED`.

---

## O. UNILATERAL HANDLING

If `executionSide` LEFT/RIGHT exists on history rows, mastery uses the **limiting side**. If side data is absent (Phase 5 `SIDE_SPECIFIC_LOGGING_DEFERRED`), aggregated working-set reps are used. No fabricated asymmetry.

---

## P. EFFORT GATES

| Effort | Top-range 12/12/12 |
|--------|---------------------|
| IDEAL / EASY | may `INCREASE_LOAD` |
| VERY_HARD / FAILURE | `HOLD_PROGRESSION` / `EFFORT_TOO_HIGH` |
| missing | `KEEP_LOAD` / `MISSING_EFFORT` / LOW confidence |

Missing effort is never treated as IDEAL.

---

## Q. SAFETY GATES

`safetyReview` or `prescriptionState = SAFETY_REVIEW` → `SAFETY_REVIEW` / `SAFETY_BLOCK` even on 12/12/12. Highest priority. Technique degraded (only if provided) → `HOLD_PROGRESSION`. Missing technique is not invented.

---

## R. RECOVERY HOLD COMPATIBILITY

Phase 6 **accepts** recovery input; it does **not** compute fatigue/deload.

- `RECOVERY_LIMITED` / `PROGRESSION_HOLD` → `HOLD_PROGRESSION`
- `DELOAD_ACTIVE` (future Phase 7) → `HOLD_PROGRESSION` / `DELOAD_HOLD`
- `RECONDITIONING` → `RECALIBRATE` (no aggressive reuse of old peak)

---

## S. DATA VALIDITY

- Missing reps on a working set → `INSUFFICIENT_DATA` / `MISSING_REPS` (no increase from completion alone)
- Missing load on loaded exercise → `MISSING_LOAD`
- Warm-up excluded (`isWorkingSetHistoryRow`)
- Skipped sets excluded; 2 top + 1 skip ≠ 3-set mastery (`PARTIAL_SESSION`)
- Partial required sets → KEEP + LOW confidence
- Legacy V1 rows used only if actual fields exist

---

## T. PROGRESSION CONFIDENCE

`LOW` | `MODERATE` | `HIGH` (no fake percentages).

- Repeated/clear top-range + valid effort → HIGH (or MODERATE on first qualifying exposure)
- Missing effort / partial session / insufficient history → LOW
- Deterministic: same evidence → same action (`progression-engine.test.ts`)

---

## U. PLATEAU DETECTION

Plateau ≠ “load did not increase this week.”

`PLATEAU_SUSPECTED` when no meaningful rep progress at the same load across a valid exposure window (4 exposures INTERMEDIATE, 6 BEGINNER) and the range is not being mastered. One flat session is not plateau. Action is `PLATEAU_REVIEW`, **not** add sets, **not** auto-substitute.

Conceptual downstream order (not implemented here): verify data → rest → recovery → load/rep fit → technique → volume → exercise response.

---

## V. DECISION REASONS

Every action has `reason_code` (`PROGRESSION_REASON_CODES`) and Arabic `client_explanation` (`explanations.ts`) without exposing the rule tree. Decrease copy is coaching language, not shame.

---

## W. COACH OVERRIDE PRECEDENCE

Documented in `LOAD_SOURCE_PRECEDENCE` (`apply.ts`):

1. `COACH_OVERRIDE` if `coachProtected`
2. `PROGRESSION_DECISION`
3. `RECENT_HISTORY`
4. `CALIBRATION`
5. `LEGACY_FALLBACK`

Phase 6 does **not** overwrite coach-authored program structure (sets/exercise tree). It only suggests effective load/duration on allowed fields. There is **no DB coach-lock column** yet — see AJ.

---

## X. NEXT-PRESCRIPTION INTEGRATION

- Phase 4 `getCoreExercisePrescription` accepts `progression` and applies load via `applyProgressionToLoad` when not calibrating / not reconditioning.
- Phase 5 `useWorkoutPlayer` computes progression from **prior** history (`excludeCurrentSession`) so today’s completed sets are not rewritten and load is not increased mid-session.
- History rows remain immutable.

---

## Y. LEGACY HISTORY HANDLING

History RPC still prefers `COALESCE(actual_*, legacy)`. Missing actual reps/load/effort are not invented. Insufficient fields → HOLD / INSUFFICIENT / low confidence. Phase 6 migration only **adds duration columns** to the existing targeted RPC.

---

## Z. TESTS ADDED

`src/lib/platform/progression/progression-engine.test.ts` (wired in `package.json` `npm test`).

Covers handoff cases 97–132 including: 9/9/8, 12/11/10, 12/12/12, VERY_HARD, FAILURE, increment 22 not 21, large isolation hold, new-load success/failure, one weak set, single bad session, repeated decline → recovery review, recovery hold, safety, missing effort/reps, bodyweight ceiling/regress, timed mid/top, warmup exclusion, skip exclusion, partial session, no +10% / no upper-lower %, no ADD_VOLUME, plateau vs one-flat, beginner no mandatory load jump, GLUTE does not override, FAT_LOSS still progresses, arms small increment, client override, reason + confidence, engine error fallback, coach lock, reconditioning, deload input, limiting side, substitute isolation, Phase 4 consumption.

---

## AA. TEST RESULTS

```
npm test → exit 0
  … Phase 1–5 suites green …
  core prescription engine tests passed
  workout runtime v2 tests passed
  progression engine tests passed
```

---

## AB. NO +10% REGRESSION RESULT

`src/lib/platform/progression/engine.ts` does not contain `SET_WEIGHT_INCREMENT`. V2 progression never uses `SET_WEIGHT_INCREMENT = 0.1`. Free-preview `legacy_free` path remains isolated in Phase 5.

---

## AC. NO UNIVERSAL PERCENTAGE CHECK

No “upper body +2–5% / lower body +5–10%” path. Increments are equipment lists or caller-supplied steps. Isolation vs compound uses a **relative jump safety cap**, not a body-region percentage law.

---

## AD. NO AUTO-VOLUME CHECK

No `ADD_VOLUME`, no `working_sets + 1`. Plateau → `PLATEAU_REVIEW`.

---

## AE. PERFORMANCE / QUERY NOTES

- Engine is pure; no DB inside the decision loop.
- Runtime fetches **one exercise** via existing `client_list_exercise_set_history` (limit cap 50).
- Does not recompute all 320 catalog IDs on page load.
- Current session is excluded so today’s logs are not a second progression path.
- Batch: caller may map `getNextSessionProgression` over already-fetched histories (no N+1 inside the engine).

---

## AF. FILES MODIFIED

**New**

- `src/lib/platform/progression/types.ts`
- `src/lib/platform/progression/engine.ts`
- `src/lib/platform/progression/exposures.ts`
- `src/lib/platform/progression/increments.ts`
- `src/lib/platform/progression/explanations.ts`
- `src/lib/platform/progression/apply.ts`
- `src/lib/platform/progression/index.ts`
- `src/lib/platform/progression/progression-engine.test.ts`
- `supabase/migrations/20260821160000_progression_history_duration.sql`
- `docs/GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_6_REPORT.md`

**Updated**

- `src/lib/platform/prescription/engine.ts` — consume Phase 6 next load/duration
- `src/lib/platform/prescription/types.ts` — `PROGRESSION_DECISION`, `progression` on context
- `src/hooks/useWorkoutPlayer.ts` — next-session only (prior history)
- `src/lib/platform/training-v2-contracts.ts` — optional duration/side on history; `PHASE_6_PROGRESSION_ENGINE`
- `src/lib/platform/training-v2-api.ts` — map duration fields
- `package.json` — add progression tests
- `docs/README.md` — Phase 6 index

No destructive history deletion. No parallel progression product.

---

## AG. BUILD / TYPECHECK / LINT RESULT

| Check | Result |
|-------|--------|
| `npm test` | pass (exit 0) |
| `npm run build` | pass (exit 0) |
| ESLint + Prettier on Phase 6 touched files | pass |
| Full `tsc` | not the product gate (pre-existing unrelated errors remain) |

---

## AH. OPEN GAPS

- `adaptive_decision_logs` remains **SELECT-only** for clients (Phase 2). Phase 6 returns an audit-shaped decision object but does not INSERT from the browser (service_role / later job).
- Unknown gym increment still requires caller-supplied `validLoads` / `availableIncrementKg`.
- Variation progression is an **action flag**, not an automatic substitute picker.
- Conditioning (unsupported INTERVAL) is deferred with `CONDITIONING_DEFERRED`.
- Unilateral logging UI still not in Phase 5 runtime.

---

## AI. DEFERRED ITEMS FOR PHASE 7+

Weekly volume, primary/secondary/maintenance allocation, direct/indirect contribution, `KEEP_VOLUME` / `ADD_SMALL_VOLUME` / `REDUCE_VOLUME` / `REALLOCATE_VOLUME`, local/global fatigue, recovery budget, deload **engine**, reconditioning load management, conditioning interference, missed-session continuity, regional response, goal conflict, program generator, nutrition adaptation, full Progress UX (Phase 11).

---

## AJ. BLOCKERS / NEEDS_DECISION

1. **Coach lock policy:** no explicit `coach_locked` field on assignments. V2 applies effective load unless `coachProtected: true` is passed. Product must decide whether `suggested_weight_kg` on the coach snapshot is always protected.
2. **Decision log writes:** keep engine-owned (service_role) vs add a narrow client RPC. Not implemented in Phase 6 to avoid expanding INSERT policy.
3. **Default increment when equipment unknown:** Phase 6 holds rather than inventing 2.5 kg. Confirm this vs gym-default plates.

None of these block QA of the domain engine.

---

## AK. FINAL STATUS

**PHASE_6_IMPLEMENTED_READY_FOR_QA**

Do not start Phase 7 without explicit approval.
