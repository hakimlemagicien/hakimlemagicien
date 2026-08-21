# GOAL-BASED ADAPTIVE TRAINING ENGINE V2
# PHASE 4/12 — CORE PRESCRIPTION ENGINE REPORT

**Date:** 2026-08-21  
**Executor:** Cursor — Platform Development  
**Final status:** `PHASE_4_IMPLEMENTED_READY_FOR_QA`  
**Phase 5:** not started.

---

## A. EXECUTIVE SUMMARY

Phase 4 adds a **pure domain Core Prescription Engine** that answers “what should this client do now?” from Goal + Level + Exercise Experience + Phase 3 metadata + history. It does **not** replace coach snapshots, rewrite the workout player, or inherit free-preview `CH-001 = 40 kg` / `+10%` intra-set rules.

Entry points:

- `getCoreExercisePrescription` — current prescription
- `getCalibrationAdjustment` — next-set KEEP / SMALL_INCREASE / REDUCE / RECALIBRATE / SAFETY_REVIEW
- `selectEligibleExercise` — deterministic candidate choice

Module: `src/lib/platform/prescription/`

## B. ENGINE ARCHITECTURE

```
goal-profile → eligibility → selection (optional)
           ↘ load-source + sets + ranges + effort/rest
             → engine.getCoreExercisePrescription
calibration.getCalibrationAdjustment  (Phase 5 caller)
```

DB remains facts/history (Phase 2 tables/RPCs). SQL is not the prescription brain. UI is not the brain. Workout player still uses `getSetProgression` until Phase 5.

## C. INPUT CONTRACT

`CorePrescriptionContext` in `src/lib/platform/prescription/types.ts`:

`goalId`, `trainingLevel`, `prescriptionState`, `exerciseExperience`, `exercise` (Phase 3 `ExerciseV2Metadata`), `recentHistory` (Phase 2 `ExerciseSetHistoryItem[]`), optional `assigned` snapshot, `location`, `availableEquipment`, `safetyReview`, `severeReadiness`, `now`, `equipmentIncrementKg`.

No full-history dump. Caller can use existing `listExerciseSetHistory(externalId, limit)`.

## D. OUTPUT CONTRACT

`CoreExercisePrescription`: `external_id`, `goal_id`, `muscle_priority`, `exercise_priority`, `movement_role`, `mechanics`, `prescription_mode`, `training_level`, `exercise_experience`, `prescription_state`, `working_sets`, `warmup_sets`, `rep_min/max`, `duration_min/max`, `target_effort`, `failure_allowed/required`, `recommended_rest_seconds`, `rest_reason`, `load_source`, `prescribed_load` (nullable), `history_reference_load`, `confidence`, `prescription_reason`, `status`, `assigned`, `used_legacy_fallback`.

Statuses: `READY | CALIBRATION_REQUIRED | RECALIBRATION_REQUIRED | INSUFFICIENT_DATA | EQUIPMENT_CONTEXT_REQUIRED | SAFETY_REVIEW_REQUIRED | GOAL_MAPPING_REQUIRED | EXERCISE_METADATA_REQUIRED`.

## E. GOAL PROFILE INTEGRATION

`src/lib/platform/prescription/goal-profile.ts` uses Phase 2 `mapLegacyGoalId` + `TRAINING_V2_CANONICAL_GOALS`.

- Canonical IDs accepted directly.
- `tone` / `fit` / unknown → `GOAL_MAPPING_REQUIRED` / `GOAL_UNMAPPED`. No silent remap.
- Muscle priorities: Glute PRIMARY glutes only; Arms elevates upper body and keeps lower body MAINTENANCE; Posture posterior/core without medical language; Waist does **not** mark abs PRIMARY; Fat Loss balanced SECONDARY; Feminine balanced with moderate glute PRIMARY.

## F. TRAINING LEVEL BEHAVIOR

UNASSESSED / BEGINNER → conservative sets, IDEAL effort, no 3–6 strength range, no compound failure target. INTERMEDIATE may use 2–4 working sets and optional 3–6 only if `ESTABLISHED` compound.

`deriveTrainingLevel`: UNASSESSED may become BEGINNER after 2 established exercises + 6 working sets. **Never auto-INTERMEDIATE.** Time/kg/workout-count rules are not implemented.

## G. EXERCISE EXPERIENCE BEHAVIOR

Independent of global level. `INTERMEDIATE + NEW` still `CALIBRATION_REQUIRED`.

`deriveExerciseExperienceState` from distinct session dates: 0 NEW, 1–2 CALIBRATING, 3–5 FAMILIAR, 6+ ESTABLISHED. Persistence stays on Phase 2 SELECT-only tables; Phase 5 can write via future RPC. Engine is compute-only.

## H. EXERCISE ELIGIBILITY

`src/lib/platform/prescription/eligibility.ts` uses Phase 3 `isV2EligibleExercise`. Unapproved (`REVIEW_REQUIRED`) excluded from V2 auto-selection. Filters: role, muscle, location, equipment list, complexity vs beginner.

Missing location/equipment → `EQUIPMENT_CONTEXT_REQUIRED` (no gym guess). HOME cannot select gym-only machines.

## I. EXERCISE SELECTION

`selectEligibleExercise`: filter then rank — existing valid ID first, then history count, then simpler complexity for non-intermediate, then `external_id` sort. **No random.** Identity is `external_id`.

## J. EXERCISE STABILITY

If `existingExternalId` remains eligible → `EXISTING_EXERCISE_STABILITY`. Coach snapshots are never overwritten; they sit on `assigned`.

## K. CALIBRATION ENGINE

`getCalibrationAdjustment` (`calibration.ts`):

- IDEAL + at-least min → KEEP
- EASY + at/above max + known increment ≤ 15% relative → SMALL_INCREASE
- EASY without increment → KEEP (no guess, no +10%)
- below min + FAILURE/VERY_HARD → REDUCE or RECALIBRATE
- safety → SAFETY_REVIEW
- VERY_HARD + target met → KEEP (no increase)

This is **not** Phase 6 next-session progression.

## L. LOAD SOURCE STRATEGY

`load-source.ts`: DURATION/INTERVAL → `NO_LOAD`; bodyweight → `BODYWEIGHT` (kg null); recent ≤21 days working actual load → `RECENT_HISTORY`; stale → reference only + calibration; `RECONDITIONING` → `RECONDITIONING_HISTORY` with null prescribed load; otherwise `UNKNOWN_REQUIRES_CALIBRATION`.

Never invents 40/20/10 kg. Goal does not set kg.

## M. BASELINE ESTABLISHMENT

`baselineEstablished`: ≥2 completed working sets with non-FAILURE effort. Opening an exercise is not a baseline. Experience promotion is derived from performed sessions.

## N. SET COUNT RULES

Warm-up (`WARMUP`) separate from working (`WORKING`). Isolation/bodyweight: 0 warmup. Loaded compounds: 1 warmup.

UNASSESSED/NEW: 2 working sets, 3 if HIGH/REQUIRED. Never default 4. INTERMEDIATE: 2–4 by priority. No TOP/DROP/REST-PAUSE.

## O. REP / DURATION RULES

Compound hypertrophy 6–12. Isolation 8–15. Abduction/lateral 12–20. Strength 3–6 only INTERMEDIATE+ESTABLISHED compound. FAT_LOSS does not force 15–20. Timed: `duration_min/max`, reps null. Dual contradictory reps+duration prevented by mode.

## P. EFFORT CONTRACT

`EASY | IDEAL | VERY_HARD | FAILURE`. No numeric RIR from client. Conceptual mapping documented in Phase 2 contracts; not persisted as fake precision. Default target `IDEAL`.

## Q. FAILURE POLICY

`failure_required = false` always. Beginner/unassessed compound: `failure_allowed = false`. Isolation may allow later, never require.

## R. REST PRESCRIPTION

Compound ~150s (`COMPOUND_HIGH_DEMAND`), isolation ~90s, strength ~180s, timed ~60s, calibration uses demand rest not shortened rest. FAT_LOSS does not force 30s.

## S. SAFETY GATES

`safetyReview` or `prescriptionState = SAFETY_REVIEW` → `SAFETY_REVIEW_REQUIRED`, no load. `severeReadiness` lowers confidence only (no full recovery engine).

## T. INSUFFICIENT DATA HANDLING

Unmapped goal, unapproved metadata, missing equipment/location, engine exception → explicit status. No silent adaptive prescription.

## U. DECISION CONFIDENCE

LOW (new/calibration/safety), MODERATE (bodyweight/timed calibrating), HIGH (recent history). No numeric %.

## V. PRESCRIPTION REASONS

Machine-readable `PrescriptionReason` on every output (`NEW_EXERCISE_CALIBRATION`, `RECENT_HISTORY_REUSED`, `V2_FALLBACK_LEGACY_PRESCRIPTION`, `GOAL_UNMAPPED`, `SAFETY_REVIEW`, …).

## W. LEGACY FALLBACK

If assigned snapshot exists but exercise is not V2-eligible: `used_legacy_fallback = true`, reason `V2_FALLBACK_LEGACY_PRESCRIPTION`, assigned fields preserved, **V2 `prescribed_load` stays null** so snapshot kg is not a fake adaptive baseline. Free preview `today-workout.ts` 40 kg left in place for the legacy path.

## X. GOAL-SPECIFIC TEST RESULTS

Covered in `prescription-engine.test.ts`: all six canonical goals; `tone` unmapped; FAT_LOSS not 15–20 / not short rest; GLUTE_GROWTH primary + split compound vs accessory ranges; waist abs not PRIMARY; arms not tiny-load toning; posture HORIZONTAL_PULL without diagnosis text.

## Y. CALIBRATION TEST RESULTS

KEEP / SMALL_INCREMENT 2.5 kg / KEEP when increment missing / KEEP when 10 kg on 20 kg (large jump) / REDUCE on FAILURE / SAFETY_REVIEW. Not +10%.

## Z. V2 FIXED-LOAD REGRESSION TEST

New UNASSESSED + `CH-001` + no history → `CALIBRATION_REQUIRED`, `prescribed_load == null`, not 40.

## AA. +10% RULE ISOLATION TEST

Engine/calibration sources do not import `SET_WEIGHT_INCREMENT` or `getSetProgression`. Player still uses +10% until Phase 5. `SET_WEIGHT_INCREMENT` remains 0.1 in `workout-session.ts`.

## AB. PERFORMANCE / QUERY NOTES

Engine is synchronous and allocation-light. No cache. Does not query all exercises, all history, or all programs. Optional later caller: `listExerciseSetHistory(external_id, 20)` only.

## AC. FILES MODIFIED / ADDED

Added: `src/lib/platform/prescription/{types,goal-profile,eligibility,selection,load-source,sets,ranges,effort-rest,calibration,experience,engine,index,prescription-engine.test.ts}.ts`

Updated: `package.json`, `training-v2-contracts.ts`, `today-workout.ts` (boundary comment), `workout-session.ts` (do-not-call comment), `docs/README.md`, this report.

No new tables. No player/runtime redesign.

## AD. TESTS ADDED

`src/lib/platform/prescription/prescription-engine.test.ts` (wired in `npm test`). Phase 1–3 tests remain.

## AE. BUILD / TYPECHECK RESULT

- `npm test`: passed (including Phase 2–3 + `prescription-engine.test.ts`)
- `npm run build`: passed
- Full `tsc` not used as the product gate (pre-existing unrelated errors remain out of scope)

## AF. DEFERRED ITEMS FOR PHASE 5+

- Phase 5: player wiring, actual reps/load/duration logging, rest timer/sounds, skip/substitution UX, side-specific unilateral logs
- Phase 6: next-session progression / double progression / plateau
- Phase 7: weekly volume + recovery/deload
- Phase 9: regional response
- Phase 10: 2–5 day generator
- Free-preview rewrite
- Removal of `getSetProgression` +10%
- Experience/level DB writes (tables are client SELECT-only today)
- Nutrition coupling

## AG. OPEN GAPS

Unilateral L/R logging not in runtime (documented for Phase 5). Equipment increment must be supplied by caller; unknown → KEEP. Preference system: only optional `dislikedExternalIds` if caller already has them.

## AH. BLOCKERS / NEEDS_DECISION

None blocking QA. Optional: whether coach snapshot sets/reps should become the *effective* working_sets when V2 also computes a suggestion (currently V2 computes independently and snapshot is nested in `assigned`).

## AI. FINAL STATUS

**PHASE_4_IMPLEMENTED_READY_FOR_QA**
