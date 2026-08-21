# GOAL-BASED ADAPTIVE TRAINING ENGINE V2
# PHASE 9/12 — REGIONAL RESPONSE + GOAL INTELLIGENCE ENGINE REPORT

**Date:** 2026-08-21  
**Executor:** Cursor — Platform Development  
**Status:** `PHASE_9_IMPLEMENTED_READY_FOR_QA`  
**Phase 10:** closed in `docs/GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_10_REPORT.md`

---

## A. EXECUTIVE SUMMARY

Phase 9 adds a domain engine that separates **exercise progress**, **regional training response**, and **goal response**. It classifies what is limiting the goal (adherence, recovery, program, progression, body composition, safety) and emits **signals** only: keep, reallocate emphasis, hold, or request nutrition/body-composition/program review.

It does **not** generate programs, edit set counts in UI, modify calories/macros/meals, diagnose posture, or claim that Hip Thrust +10 kg means glute growth.

Services:

- `evaluateRegionalResponse` — `src/lib/platform/goal-intelligence/regional.ts`
- `evaluateGoalResponse` — `src/lib/platform/goal-intelligence/goal.ts`
- Goal strategy profiles — `src/lib/platform/goal-intelligence/profiles.ts` (canonical IDs only)

---

## B. ENGINE ARCHITECTURE

```
Phase 6 exercise summaries     ─┐
Phase 7 volume/recovery        ─┼→ evaluateRegionalResponse(region)
Phase 8 adherence/continuity   ─┘        ↓
Optional body trends / nutrition inputs ─┐
Goal intelligence profiles               ┼→ evaluateGoalResponse
                                         ↓
GOAL ADAPTATION SIGNAL
  KEEP | REALLOCATE_REQUEST | HOLD | *_REVIEW
  → Phase 7 consumes reallocation (net-zero volume)
  → Phase 10 will consume program_review
  → Phase 11 will consume client_explanation
```

No React progress dashboard. No parallel goal engine.

---

## C. REGIONAL RESPONSE INPUT CONTRACT

`RegionalResponseInput` (`types.ts`):

| Field | Source |
|---|---|
| `region`, `priority` | Phase 3/4 anatomy + goal profile |
| `validMicrocycles` | Phase 7 week aggregates (not one session) |
| `prescribedVolume` / `completedVolume` / `effectiveVolume` | Phase 7 |
| `directPrimaryShare` | Phase 3 DIRECT_PRIMARY share |
| `performanceTrend` | Phase 7 `PerformanceTrend` |
| `localFatigue` / `globalRecovery` | Phase 7 |
| `progressionActions` | Phase 6 |
| `exerciseResponse` | Phase 6 layer (kept distinct) |
| `lastReallocationWeeksAgo` | anti-oscillation |
| `safetyActive` | safety signals |

---

## D. REGIONAL RESPONSE OUTPUT CONTRACT

`RegionalResponseDecision`: `response_state`, `limiting_factor`, `confidence`, `recommended_signal`, `reason_code`, `exercise_response`, `observation_microcycles`.

---

## E. GOAL RESPONSE INPUT CONTRACT

`GoalResponseInput`: `goalId` (canonical/legacy mapped via Phase 4), `regions[]`, `globalRecovery`, `adherenceShare`, `safetyActive`, `coachProtected`, last action + weeks ago, optional `body` trends, optional `nutrition` side inputs.

---

## F. GOAL RESPONSE OUTPUT CONTRACT

`GoalResponseDecision`: `goal_id`, `goal_response`, `action`, limiter, reason, **two confidences** (`training_confidence` vs `full_goal_confidence`), `reallocation`, protected-outcome / nutrition / body-composition flags, `nutrition_contract_status`, `training_demand`, `client_explanation`, `goal_id_unchanged: true`.

Phase 10 fields: `program_review` via action `PROGRAM_REVIEW_REQUIRED`, `reallocation`, `protected_outcome_conflict`.  
Phase 11: `client_explanation` (Arabic, non-punitive).

---

## G. RESPONSE STATES

**Regional:** `INSUFFICIENT_DATA | POSITIVE_FAST | POSITIVE_NORMAL | POSITIVE_SLOW | STAGNANT | RECOVERY_LIMITED | ADHERENCE_LIMITED | PROGRAM_LIMITED`

**Goal:** `ON_TRACK | PARTIAL_RESPONSE | REGIONAL_UNDER_RESPONSE | STAGNANT_REVIEW | ADHERENCE_LIMITED | RECOVERY_LIMITED | PROGRAM_LIMITED | BODY_COMPOSITION_LIMITED | NUTRITION_REVIEW_REQUIRED | TRADEOFF_DETECTED | SAFETY_REVIEW | INSUFFICIENT_DATA | COACH_REVIEW_REQUIRED`

FAST/SLOW are observed current response, not genetic identity.

---

## H. LIMITING FACTORS

`NONE | INSUFFICIENT_DATA | ADHERENCE | RECOVERY | TRAINING_VOLUME | EXERCISE_SELECTION | EXERCISE_PROGRESSION | SCHEDULE | BODY_COMPOSITION | NUTRITION_REVIEW_REQUIRED | SAFETY | PROGRAM_STRUCTURE | UNKNOWN`

Order of checks (regional): Safety → data window → adherence → recovery → exercise selection/coverage → progression calibration → then speed labels.

---

## I. OBSERVATION WINDOWS

| Classification | Minimum |
|---|---|
| FAST / NORMAL / SLOW | `validMicrocycles >= 2` (`MIN_MICROCYCLES_FOR_SPEED`) |
| STAGNANT | `>= 3` + high completion + recovery not limited |
| Post-reallocation cooldown | `< 2` microcycles → `HOLD` / `POST_ADAPTATION_OBSERVATION` |

One session cannot produce FAST/SLOW (`hipThrustOnly` test).

---

## J. RESPONSE CONFIDENCE

Regional: LOW if `< 2` cycles; MODERATE at 2; HIGH at 3+ when data complete.  
Goal: `training_confidence` can be HIGH while `full_goal_confidence` is LOW without measurements. Major reallocation uses at least MODERATE. KEEP can run at MODERATE.

---

## K. EXERCISE → REGIONAL SEPARATION

`exercise_response` is an input passthrough. One Hip Thrust progression with 1 microcycle → exercise POSITIVE, regional `INSUFFICIENT_DATA`, goal not achieved (`EXERCISE_PROGRESS_NOT_GOAL_SUCCESS` path via insufficient regional data).

---

## L. REGIONAL → GOAL SEPARATION

Goal aggregates primary-family regions using Phase 4 profiles. A FAST shoulder does not make TONED_ARMS fully ON_TRACK if biceps/triceps under-respond (`PARTIAL_RESPONSE`).

---

## M. PRIMARY / SECONDARY / MAINTENANCE INTEGRATION

`GOAL_INTELLIGENCE_PROFILES` copy `GOAL_MUSCLE_PROFILES` primary/secondary/maintenance. `isPrimaryRegion` / `regionFamily` roll GLUTEUS_* → GLUTES, deltoids → SHOULDERS. No new Goal IDs.

---

## N. GLUTE_GROWTH LOGIC

Training-side: glute progression + volume + adherence + coverage.  
Not judged by scale.  
Quads FAST + Glutes SLOW → `REGIONAL_UNDER_RESPONSE` + `REALLOCATE QUAD→GLUTE` (not add total lower).  
Slow + recovery poor → `RECOVERY_LIMITED`.  
Slow + low completion → `ADHERENCE_LIMITED`.  
Training positive, no hip trend → ON_TRACK training-side + `body_composition_data_required`.

---

## O. SLIM_TONED_WAIST LOGIC

Core performance ≠ waist outcome. Stable waist + positive core → `BODY_COMPOSITION_LIMITED` / review. Forbidden: spot reduction, add abs for fat. Phase 4 already keeps abs off extreme primary.

---

## P. TONED_ARMS_UPPER_BODY LOGIC

Shoulders FAST + arms SLOW → reallocate, not total upper add. Improving training + flat arm measurement → body-composition review, not endless curls.

---

## Q. FEMININE_BALANCED_BODY LOGIC

Balance of glute/leg vs upper support. Lower FAST + upper OK → ON_TRACK without suppressing lower. Scale is not success.

---

## R. FAT_LOSS LOGIC

Training success = performance preserved. Flat weight with good training → `NUTRITION_REVIEW_REQUIRED`, no added resistance sets. Fast weight drop + poor recovery → recovery/tradeoff, not celebration of the scale. Workout calories unused.

---

## S. POSTURE_TONED_BACK LOGIC

Training-side pulling/posterior response only. Copy: «هذا ليس تصحيحاً طبياً للقوام.» No diagnosis.

---

## T. PROTECTED OUTCOMES

Per profile (`protected_outcomes`): recovery, lower-body balance, waist/body-composition boundary, resistance quality, non-medical scope. Glute positive + aggressive weight loss → `TRADEOFF_DETECTED` + `protected_outcome_conflict`.

---

## U. GOAL CONFLICT / TRADE-OFF

Detected conflicts: aggressive fat loss vs glute development; scale speed vs performance preservation; shoulder vs arm; quad vs glute. Action `GOAL_TRADEOFF_REVIEW`. No silent preference that ignores recovery/safety.

---

## V. BODY-COMPOSITION BOUNDARY

Training may be adequate while body outcomes are not. Then `BODY_COMPOSITION_REVIEW_REQUIRED` / `NUTRITION_REVIEW_REQUIRED`. Trends via `classifyMeasurementTrend` (min 3 points, 14-day span). One reading is `INSUFFICIENT`. Photos: `photosAreNotBodyTruth` → never inferred.

Existing keys reused from `progress-storage.ts`: `weight`, `waist`, `arm`, `thigh` — no new measurement types.

---

## W. NO-SPOT-REDUCTION GUARDRAILS

Waist/arm appearance stagnation never emits add-local-fat-burn or +abs/+curls volume. Profile `forbidden_shortcuts` include `spot_reduction`. Tests assert no extra core reallocation for waist.

---

## X. TRAINING ↔ NUTRITION BOUNDARY

Engine has no calories/protein/carb/fat/meal mutation (`goal.ts` source scan in tests).  
Outputs: `nutrition_review_required`, `training_demand`, `recovery_state`, `goal_response`.  
Inputs optional: `NutritionSideInput`. If absent: `nutrition_contract_status = PENDING_SHARED_CONTRACT`.

---

## Y. REALLOCATION SIGNALS

`ReallocationRequest`: `from_region`, `to_region`, reason, priority, confidence.  
`toVolumeReallocationHint` for Phase 7. Net program delta 0 when consumed.

---

## Z. PHASE 7 INTEGRATION

`WeeklyVolumeContext.goalReallocationRequest` optional. When present and recovery not POOR, `getWeeklyVolumeDecision` sets `REALLOCATE_VOLUME` with from −1 / to +1, **program `recommended_delta = 0`**. Existing Phase 7 tests unchanged when the field is omitted.

---

## AA. PHASE 8 INTEGRATION

Consumes `adherenceShare` and continuity-informed recovery; does not re-implement missed-session logic. `SCHEDULE` limiter reserved; capacity mismatch remains Phase 8 `SCHEDULE_REVIEW_REQUIRED`.

---

## AB. PHASE 10 CONTRACT

Stable: `goal_id`, primary/secondary regions (profiles), `regional_responses`, limiters, `goal_response`, `reallocation`, `protected_outcomes`, `PROGRAM_REVIEW_REQUIRED`. No 2–5 day generator.

---

## AC. PHASE 11 EXPLAINABILITY CONTRACT

`client_explanation` Arabic strings in `explanations.ts`. Internal enums not required in UI. No progress dashboard.

---

## AD. DECISION REASON CODES

`GOAL_REASON_CODES` in `types.ts` (finite). Snapshot helper `toAdaptiveDecisionSnapshot` maps to existing `adaptive_decision_logs` shape (`decision_type`, `reason_code`, `confidence`, `input_snapshot`). No new table. Engine does not auto-insert logs (callers/Phase 11).

---

## AE. RESPONSE HISTORY

Snapshots are derived objects (region/goal/state/limiter/confidence/period/decision). Goal change: new evaluation context; previous snapshots remain caller-owned (`previousGoalId` does not wipe). Test: GLUTE snapshot remains after FAT_LOSS evaluation.

---

## AF. COACH OVERRIDE

`coachProtected` + major action → `COACH_REVIEW_REQUIRED`, `reallocation: null`. Evaluation still runs.

---

## AG. DATA QUALITY / INSUFFICIENT DATA

Unmapped goal, `< 2` microcycles, or no primary-region evidence → `INSUFFICIENT_DATA`. Legacy users without V2 summaries get the same safe state. No fabricated history.

---

## AH. TESTS ADDED

`src/lib/platform/goal-intelligence/goal-intelligence.test.ts`  
Included in `npm test`.

---

## AI. TEST RESULTS

Phase 7+8+9 targeted tests: pass. Full `npm test` + `npm run build` run as product gate (see AO).

---

## AJ. GOAL-BY-GOAL TEST MATRIX

| Goal | Case | Result |
|---|---|---|
| GLUTE_GROWTH | 1-cycle hip thrust | not goal success |
| GLUTE_GROWTH | Glute slow / Quad fast | REALLOCATE QUAD→GLUTE |
| GLUTE_GROWTH | slow + poor recovery | RECOVERY_LIMITED |
| GLUTE_GROWTH | 50% completion | ADHERENCE_LIMITED |
| GLUTE_GROWTH | training + no measures | ON_TRACK + data required |
| GLUTE_GROWTH | rapid weight loss | TRADEOFF |
| SLIM_TONED_WAIST | core+ / waist flat | BODY_COMPOSITION review |
| TONED_ARMS | arms slow / shoulders fast | REALLOCATE |
| FEMININE_BALANCED | lower+upper positive | ON_TRACK KEEP |
| FAT_LOSS | training+ / weight stable | NUTRITION review |
| FAT_LOSS | fast loss + poor recovery | RECOVERY first |
| POSTURE_TONED_BACK | back improving | training positive, non-medical |

---

## AK. NO-NUTRITION-WRITE TEST RESULT

`goal.ts` source must not contain calorie/macro/meal writes — asserted. Action is signal-only.

---

## AL. NO-SPOT-REDUCTION TEST RESULT

Waist case does not reallocate to more core volume. Profile forbids `spot_reduction` / `add_abs_for_waist_fat`.

---

## AM. PERFORMANCE / QUERY NOTES

Engine is pure over **summaries** (microcycle counts, trends, Phase 6 action lists). No lifetime set-log scan. Measurement trend uses existing local progress entries when the caller supplies them.

---

## AN. RLS / SECURITY IF AFFECTED

No new tables. Optional future writes go to existing `adaptive_decision_logs` (own SELECT only; insert remains service_role per Phase 2). No RLS change.

---

## AO. BUILD / TYPECHECK / LINT

- Targeted Phase 7–9 tests: pass  
- IDE lints on new modules: none  
- Full `npm test` / `npm run build`: product gate (executed with this phase)

---

## AP. FILES MODIFIED

See grouped list below.

---

## AQ. DATABASE / MIGRATIONS IF ANY

**None.**

---

## AR. OPEN GAPS

- Skip/user check-in “do you see progress?” not wired (product has no approved survey contract used here).
- `adaptive_decision_logs` insert RPC not added; snapshot helper only.
- Subregional glute (max vs medius) classified only if separate region rows are supplied — no invented anatomy.

---

## AS. PENDING SHARED NUTRITION CONTRACTS

`nutrition_contract_status = PENDING_SHARED_CONTRACT` when `nutrition` input omitted. Optional fields ready: `bodyCompositionResponse`, `energyRecoveryConstraint`, `nutritionAdherenceLimited`.

---

## AT. DEFERRED ITEMS

Phase 10 program generation/validation. Phase 11 dashboard/notifications. Nutrition calorie adaptation. Computer vision on photos. Medical posture assessment.

---

## AU. BLOCKERS / NEEDS_DECISION

None blocking QA. Nutrition Strategy should confirm the optional signal names when the shared Goal layer is approved.

---

## AV. FINAL STATUS

**PHASE_9_IMPLEMENTED_READY_FOR_QA**

---

## GOAL MATRIX (handoff §160)

| GOAL_ID | PRIMARY | SECONDARY | MAINTENANCE | TRAINING_SUCCESS | BODY_COMP_DEP | PROTECTED | UNDER_RESPONSE | PROGRAM_LIMITER | BODY_LIMITER | NUTRITION_REVIEW | CONFLICTS | ALLOWED | FORBIDDEN |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GLUTE_GROWTH | Glutes family | Hams, quads | Upper/core/calves | progression+volume+adherence+coverage | OPTIONAL_CONFIRMATION | recovery, lower balance, waist boundary | Quad FAST / Glute SLOW → reallocate | low direct glute share | weight ≠ growth | rapid loss + decline | fat-loss vs glute; quad dominance | KEEP_SET | scale-only, claim growth from load, add total lower, auto goal change |
| SLIM_TONED_WAIST | (none extreme) | Core + support | rest | core control + resistance consistency | REQUIRED_FOR_FULL | recovery, no spot reduction | core ≠ waist | no fat-burn abs | waist trend | training ok + body stall | core vs waist | KEEP_SET | spot reduction, +abs for fat |
| TONED_ARMS_UPPER_BODY | Bi/Tri/Shoulders/Upper back | Chest/lats | Lower | regional progression | OPTIONAL_CONFIRMATION | recovery, upper balance | shoulders FAST / arms SLOW | missing arm-direct | soft look ≠ training fail | visual vs stimulus | shoulder dominance | KEEP_SET | spot arm fat, +total upper |
| FEMININE_BALANCED_BODY | Glutes | Legs/upper/core | isolation | balanced progression | OPTIONAL_CONFIRMATION | regional balance | one-region lag → partial/hold | missing coverage | scale ≠ success | protected waist/glute | single-region dominance | KEEP_SET | one-region max, female-only reps |
| FAT_LOSS | (balanced secondary all) | all resistance | — | performance preserved | REQUIRED_FOR_FULL | strength, recovery | n/a add sets | coverage for preservation | body trend | stall or aggressive loss | aggressive loss vs performance | KEEP_SET | workout calories, +sets for scale |
| POSTURE_TONED_BACK | Upper back, rear delts, lats | Core/posterior chain | push/quads | pulling/posterior/core | NONE | non-medical | n/a diagnosis | missing pull roles | photos not truth | not posture-nutrition | no medical claim | KEEP_SET | posture corrected, medical diagnosis |

Exact arrays: `GOAL_INTELLIGENCE_PROFILES` in `profiles.ts`.

---

## REGIONAL RESPONSE MATRIX (handoff §161)

| State | Inputs | Output | Limiter | Action | Confidence |
|---|---|---|---|---|---|
| POSITIVE_FAST | 3 cycles, improving, 2+ load/rep increases, recovery OK | POSITIVE_FAST | NONE | KEEP | HIGH |
| POSITIVE_NORMAL | 2+ cycles improving, fewer jumps | POSITIVE_NORMAL | NONE | KEEP | MODERATE/HIGH |
| POSITIVE_SLOW | 2 cycles stable/declining, executed | POSITIVE_SLOW | TRAINING_VOLUME | HOLD | MODERATE |
| STAGNANT | 3 cycles stable, high adherence, recovery normal | STAGNANT | TRAINING_VOLUME | HOLD/review | HIGH |
| RECOVERY_LIMITED | high local fatigue or poor global | RECOVERY_LIMITED | RECOVERY | RECOVERY_REVIEW | HIGH |
| ADHERENCE_LIMITED | completed/prescribed < 0.75 | ADHERENCE_LIMITED | ADHERENCE | INSUFFICIENT_DATA | MODERATE |
| PROGRAM_LIMITED | directPrimaryShare < 0.35 | PROGRAM_LIMITED | EXERCISE_SELECTION | PROGRAM_REVIEW | MODERATE |
| INSUFFICIENT_DATA | < 2 microcycles | INSUFFICIENT_DATA | INSUFFICIENT_DATA | INSUFFICIENT_DATA | LOW |

---

## GOAL CONFLICT MATRIX (handoff §162)

| Conflict | Protected | Expected |
|---|---|---|
| GLUTE_GROWTH vs aggressive weight DECLINING_FAST | waist/body-comp boundary | TRADEOFF_DETECTED + NUTRITION_REVIEW signal |
| FAT_LOSS vs performance/recovery drop | strength preservation | RECOVERY first if POOR; else TRADEOFF + nutrition review |
| Primary specialization vs recovery POOR | recovery | RECOVERY_LIMITED, no add |
| Balanced vs one fast region | regional balance | ON_TRACK if others OK; PARTIAL if other lags; do not auto-suppress lower |

---

## FILES BY GROUP

### REGIONAL RESPONSE ENGINE
- `src/lib/platform/goal-intelligence/regional.ts` — `evaluateRegionalResponse`
- `src/lib/platform/goal-intelligence/types.ts` — contracts

### GOAL INTELLIGENCE ENGINE
- `src/lib/platform/goal-intelligence/goal.ts` — `evaluateGoalResponse`
- `src/lib/platform/goal-intelligence/index.ts` — public API
- `src/lib/platform/goal-intelligence/explanations.ts` — Arabic copy

### GOAL PROFILES / PROTECTED OUTCOMES / TRADE-OFF
- `src/lib/platform/goal-intelligence/profiles.ts` — six canonical strategies

### BODY-COMPOSITION BOUNDARY
- `src/lib/platform/goal-intelligence/trends.ts` — measurement trends; photos not inferred

### TRAINING ↔ NUTRITION CONTRACT
- Optional `NutritionSideInput`; outputs review flags only

### PHASE 6 INTEGRATION
- Consumes `progressionActions` / `exerciseResponse` summaries (no player rewrite)

### PHASE 7 INTEGRATION
- `src/lib/platform/volume/types.ts` — optional `goalReallocationRequest`
- `src/lib/platform/volume/engine.ts` — net-zero reallocate consume

### PHASE 8 INTEGRATION
- `adherenceShare` input on goal context

### TYPES / TESTS / DOCS
- `goal-intelligence.test.ts`
- `package.json` test script
- this report; `docs/README.md`

### DATABASE / RLS
- none

### LEGACY COMPATIBILITY
- Unmapped/insufficient V2 data → INSUFFICIENT_DATA. Free preview untouched. No unofficial Goal IDs.

---

Phase 10 was not started.
