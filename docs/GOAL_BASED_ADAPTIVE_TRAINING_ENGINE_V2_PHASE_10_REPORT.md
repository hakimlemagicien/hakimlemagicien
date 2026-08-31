# GOAL-BASED ADAPTIVE TRAINING ENGINE V2
# PHASE 10/12 — PROGRAM GENERATION + SESSION ORDERING + PROGRAM VALIDATION ENGINE REPORT

**Date:** 2026-08-21  
**Executor:** Cursor — Platform Development  
**Status:** `PHASE_10_IMPLEMENTED_READY_FOR_QA`  
**Phase 11:** closed — see `GOAL_BASED_ADAPTIVE_TRAINING_ENGINE_V2_PHASE_11_REPORT.md`

---

## A. EXECUTIVE SUMMARY

Phase 10 adds the **materialization layer**: given canonical outputs from Phases 1–9, it generates a complete candidate program, orders sessions and exercises, estimates duration, and validates before any activation.

It does **not** start from “which exercises look good.” Hierarchy:

CLIENT CONTEXT → GOAL PROFILE → DAYS/CAPACITY → REGIONAL PRIORITIES → VOLUME TARGETS → SESSION DISTRIBUTION → MOVEMENT ROLES → CANDIDATES → SELECTION → ORDER → SET/REP CONTRACT → RECOVERY VALIDATION → PROGRAM VALIDATION.

Services:

- `generateTrainingProgram` — `src/lib/platform/program-generation/generate.ts`
- `validateTrainingProgram` — `src/lib/platform/program-generation/validate.ts`

Invalid candidates cannot activate (`canActivateProgram`). No React generator. No nutrition writes. No Phase 11 progress UX. No parallel `v2_programs` table.

---

## B. EXISTING PROGRAM ARCHITECTURE AUDIT

| Layer | Source | Phase 10 use |
|---|---|---|
| Coach templates | `public.program_templates` | unchanged global templates |
| Client snapshots | `client_program_assignments` / `client_program_days` / `client_program_exercises` (`20260820240000_client_program_assignment_snapshots.sql`) | activation path remains this snapshot lifecycle |
| Runtime | `client_get_my_training_runtime`, `src/lib/platform/assigned-program-api.ts` | not called during generation |
| Continuity | `src/lib/platform/continuity/` | mapper `toContinuityProgramDays` exposes `programDayId` + `sequenceIndex` (not weekday) |
| Eligibility | `src/lib/platform/prescription/eligibility.ts` | hard equipment/location/level filters |
| Exercise library | `public.exercises` + authored JSON (`loadAuthoredV2Metadata`) | only canonical `external_id` |
| Admin assign | `admin_assign_client_program` (admin-only, atomic copy) | still the only persistence/activation API |

**Product frequency note (not silently extended):** admin template draft validation allows `days_per_week` 1–7 (`admin-libraries.ts` `validateProgramDraft`). Phase 10 generator supports **2–5 only**. 1/6/7 remain template-assignment territory.

Legacy `/app` workout routes do **not** call `generateTrainingProgram` (asserted in tests).

---

## C. GENERATOR ARCHITECTURE

```
ProgramGenerationContext
  → resolveCanonicalGoal (Phase 4)
  → buildSessionBlueprints(goal × days)     roles.ts
  → filterProgramCandidates (eligibility)  selection.ts
  → pickForSlot (deterministic rank)
  → prescribeWorkingSets / rest / reps     Phase 4 contracts
  → orderSessionExercises                  order.ts
  → trimSessionToDuration                  duration.ts
  → summarizeRegionalVolume                Phase 3/7 weights
  → validateTrainingProgram
  → READY | PROGRAM_REVIEW_REQUIRED | PROGRAM_GENERATION_BLOCKED | COACH_OVERRIDE_CONFLICT
```

Finite retries: `MAX_ATTEMPTS = 3`. No randomness. Tie-break: `external_id` lexicographic.

---

## D. GENERATOR INPUT CONTRACT

`ProgramGenerationContext` (`types.ts`): `goalId`, `trainingLevel` (`UNASSESSED|BEGINNER|INTERMEDIATE` — no new ADVANCED), `daysPerWeek`, `availableMinutes`, `location`, `availableEquipment`, exclusions, coach locks, experience map, previous program/ids, optional Phase 7 `regionalTargets`, Phase 9 `reallocation`, Phase 7 `recoveryState`, Phase 8 `reconditioningActive` / `scheduleCapacityMismatch`, `waistStagnationSpotReduction`, `exercises[]`.

Missing attributes are not invented.

---

## E. GENERATOR OUTPUT CONTRACT

`ProgramGenerationResult`: `status`, `candidate` (`program_days` as `sessions[]` with `program_day_id`, `sequence_index`, `role`, prescriptions), `validation`, `regional_volume`, `movement_roles`, `generation_reason`, `client_explanation`, `diff`.

Prescriptions include sets, rep/duration range, rest, priority, role, `calibration_required`. **`suggested_weight_kg` is always `null`** (Phase 6 owns load).

---

## F. GENERATION PIPELINE

Implemented in `generate.ts` `buildCandidate` + `generateTrainingProgram`. Constraint priority matches the handoff: safety/equipment → data validity → recovery → primary goal → protected outcomes → volume → movement coverage → duration → stability → preferences.

---

## G. GOAL PROFILE INTEGRATION

Consumes `GOAL_MUSCLE_PROFILES` / `musclePriorityFor` / `resolveCanonicalGoal` from `src/lib/platform/prescription/goal-profile.ts`. Intelligence protected outcomes from `GOAL_INTELLIGENCE_PROFILES` (`goal-intelligence/profiles.ts`). Six canonical Goal IDs only.

---

## H. REGIONAL PRIORITY MATERIALIZATION

Blueprints assign PRIMARY/SECONDARY/MAINTENANCE slots from the Goal profile. Lead volume families (`leadVolumeRegions` in `volume.ts`):

| Goal | Lead volume families |
|---|---|
| GLUTE_GROWTH | GLUTES |
| TONED_ARMS_UPPER_BODY | BICEPS, TRICEPS |
| FEMININE_BALANCED_BODY | GLUTES |
| POSTURE_TONED_BACK | UPPER_BACK |
| SLIM_TONED_WAIST | CORE (functional, min 3, max 6) |
| FAT_LOSS | none (balanced resistance) |

---

## I. 2-DAY GENERATION

Efficient compounds + primary work. Example GLUTE: `FULL_BODY` + `FULL_BODY` (A/B slots differ: hip extension vs hinge/squat). Not a 5-day program crushed into two giant sessions (exercise count ≤ 6 asserted).

---

## J. 3-DAY GENERATION

Goal-specific, not universal PPL. GLUTE: `LOWER_GLUTE_PRIORITY` / `UPPER_SUPPORT` / `LOWER_GLUTE_SUPPORT`.

---

## K. 4-DAY GENERATION

Greater specialization without forcing Upper/Lower/Upper/Lower for every Goal. FAT_LOSS 4-day: `LOWER_SUPPORT` / `UPPER_PRIORITY` / `LOWER_POSTERIOR` / `UPPER_SUPPORT`.

---

## L. 5-DAY GENERATION

More distribution, not max volume. GLUTE 5-day glute effective volume stays well below 2.5× the 3-day program (test). Session durations 24–34 minutes in the gym 60-minute fixture.

---

## M. WEEKLY/MICROCYCLE VOLUME MATERIALIZATION

Phase 7 remains the volume **decision** engine. Phase 10 materializes targets into exercises × working sets. Default targets (`defaultRegionalTargets`) are conservative materialization bounds; caller-supplied Phase 7 targets win.

Reconditioning / recovery POOR: lower set counts via Phase 4 `prescribeWorkingSets` with BEGINNER **set table only** (training level field unchanged).

---

## N. DIRECT/INDIRECT VOLUME ACCOUNTING

`summarizeRegionalVolume` uses `exerciseContributions` + `CONTRIBUTION_WEIGHT` (1.0 / 0.5 / 0.25 / 0). Compound GL-001: 1 set ≠ 1 full set for GLUTES+HAMSTRINGS. Test asserts `DIRECT_PRIMARY=1`, `DIRECT_SECONDARY=0.5`.

---

## O. SESSION ROLE GENERATION

Taxonomy in `SESSION_ROLES` / `roles.ts`. Roles emerge from Goal × frequency. Session identity = `program-day-{index}` + `sequence_index`, not weekday.

---

## P. SESSION DISTRIBUTION

Primary volume is split across sessions (e.g. GLUTE 3-day lower / upper / lower-support). No dump of all weekly primary work into one day unless the 2-day full-body strategy requires shared coverage.

---

## Q. RECOVERY SPACING

Validator flags consecutive **HIGH** demand with overlapping `primary_regions` as `RECOVERY_SPACING_INVALID`. Adjacent HIGH+MODERATE overlap is `HIGH_REGIONAL_OVERLAP` warning. Consecutive different regions remain valid. No universal 48-hour rule.

---

## R. MOVEMENT ROLE COVERAGE

Phase 3 `MOVEMENT_ROLES` only. Required: GLUTE `HIP_EXTENSION`; ARMS `ELBOW_FLEXION`+`ELBOW_EXTENSION`; POSTURE `HORIZONTAL_PULL`; WAIST `ANTI_EXTENSION`; FAT_LOSS/BALANCED/WAIST also need push+pull (`HORIZONTAL|VERTICAL`). Conditioning roles (`INTERVAL_CONDITIONING`, `STEADY_CARDIO`, …) are filtered out of the resistance pool.

---

## S. EXERCISE CANDIDATE FILTERING

`filterProgramCandidates` → `explainEligibility` + resistance filter + `excludedExternalIds`. Unknown IDs cannot be invented (`EXERCISE_EXTERNAL_ID_PATTERN` library only).

---

## T. EXERCISE RANKING

`rankCandidates`: movement-role match, contribution weight, compound bonus, previous-program stability, ESTABLISHED experience, reallocation ±, locked +100, then `external_id`. Deterministic.

---

## U. EXERCISE STABILITY / RETENTION

Previous IDs and ESTABLISHED experience are ranked higher. Test: `GL-001` retained when established. Novelty is not a scoring goal.

---

## V. SESSION ORDERING

`order.ts`: high complexity / compounds first, then exercise priority, then muscle priority, then `external_id`. Not alphabetical by name.

---

## W. PRIMARY EXERCISE PLACEMENT

PRIMARY/REQUIRED/HIGH IDs are protected from duration trim. Validator warns if ≥2 OPTIONAL/MAINTENANCE exercises precede the first primary.

---

## X. SESSION DURATION ENGINE

`estimateSessionMinutes`: overhead 180s + per exercise `sets × (40s work + rest)` + 45s transition + 60s if calibrating. Rest comes from Phase 4 `prescribeRest` and is **not** shortened to fit. Trim drops lowest priority unprotected work first.

Evidence (GLUTE gym 60 min fixture): 2-day 37/34 min; 5-day 31/34/29/26/24 min.

---

## Y. CALIBRATION / EXERCISE EXPERIENCE INTEGRATION

NEW → `calibration_required: true`, conservative sets, no fabricated load. ESTABLISHED `GL-001` → `calibration_required: false`.

---

## Z. RECONDITIONING INTEGRATION

`reconditioningActive` reduces sets; Goal/level preserved; copy `PROGRAM_COPY.RECONDITIONING`. Does not rewrite history to BEGINNER.

---

## AA. PHASE 7 VOLUME INTEGRATION

Effective volume uses Phase 7 contribution module. Optional `regionalTargets` + `recoveryState`. No second weekly volume decision engine.

---

## AB. PHASE 8 CONTINUITY INTEGRATION

`toContinuityProgramDays` maps to `ContinuityProgramDay` (`programDayId`, `sequenceIndex`). Schedule mismatch without `allowFrequencyAdaptation` → `PROGRAM_REVIEW_REQUIRED`, no candidate. Reschedule does not require regeneration (identity is sequence, not weekday).

---

## AC. PHASE 9 REGIONAL RESPONSE INTEGRATION

Consumes `reallocation: { from_region, to_region }` only (action/limiter already decided in Phase 9). FAST ≠ auto reduce; SLOW ≠ auto increase unless a reallocation request is present.

---

## AD. REGIONAL REALLOCATION MATERIALIZATION

`applyReallocation` in `roles.ts`: QUAD→GLUTE replaces `SQUAT` slots with `HIP_EXTENSION`; SHOULDER→ARM replaces vertical-push/abduction with `ELBOW_FLEXION`. Ranking also penalizes `from_region` DIRECT_PRIMARY. Tests: total lower (glute+quad) does not rise; total upper (shoulder+arms) does not blindly rise.

---

## AE. GLUTE_GROWTH GENERATION

Primary HIP_EXTENSION + hinge/abduction diversity. Protected outcome: quad effective > 1.5× glute → `PROTECTED_OUTCOME_CONFLICT`.

---

## AF. SLIM_TONED_WAIST GENERATION

Full-body resistance + `ANTI_EXTENSION`/`ANTI_ROTATION`. Not abs fat-burn. Spot-reduction flag blocks generation.

---

## AG. TONED_ARMS_UPPER_BODY GENERATION

Upper priority + required lower maintenance (validator). 2-day: `UPPER_PRIORITY` + `FULL_BODY`.

---

## AH. FEMININE_BALANCED_BODY GENERATION

Moderate glute lead (target 6, not glute-max). Balanced full body at 2 days; more split at 4–5 without single-region maximization.

---

## AI. FAT_LOSS GENERATION

Recoverable resistance. Interval/HIIT filtered. Validator rejects interval prescriptions on a FAT_LOSS candidate. No high-rep/short-rest requirement.

---

## AJ. POSTURE_TONED_BACK GENERATION

Pull/posterior/core roles. Copy states training, not clinical correction. No medical diagnosis fields.

---

## AK. PROGRAM VALIDATOR ARCHITECTURE

`validateTrainingProgram(candidate, context, extras)` in `validate.ts`. Runs before READY. Status: `VALID` | `VALID_WITH_WARNINGS` | `INVALID`.

---

## AL. VALIDATION ERRORS

Typed in `VALIDATION_ERROR_CODES`: `MISSING_PRIMARY_REGION`, `REGIONAL_VOLUME_BELOW_MIN`/`ABOVE_MAX`, `RECOVERY_SPACING_INVALID`, `SESSION_DURATION_EXCEEDED`, `MISSING_MOVEMENT_ROLE`, `REDUNDANT_STIMULUS_EXCESS`, `EQUIPMENT_MISMATCH`, `LOCATION_MISMATCH`, `UNKNOWN_EXERCISE`, `SAFETY_RESTRICTION_VIOLATION`, `INVALID_SEQUENCE`, `DUPLICATE_SESSION_INDEX`, `NO_VALID_EXERCISE_CANDIDATE`, `SPOT_REDUCTION_LOGIC_INVALID`, `PROTECTED_OUTCOME_CONFLICT`, `PROGRAM_CAPACITY_EXCEEDED`, `UNSUPPORTED_FREQUENCY`, `PROGRAM_GENERATION_BLOCKED`.

---

## AM. VALIDATION WARNINGS

`SESSION_NEAR_DURATION_LIMIT`, `PRIMARY_VOLUME_NEAR_MAX`, `HIGH_REGIONAL_OVERLAP`, `NEW_EXERCISE_CALIBRATION_REQUIRED`, variety flags, `BODY_COMPOSITION_REVIEW_PENDING`, `COACH_REVIEW_RECOMMENDED`, `SCHEDULE_CAPACITY_MISMATCH`.

First-generation fixtures return `VALID_WITH_WARNINGS` primarily because exercises default to NEW → calibration warning.

---

## AN. GOAL COVERAGE VALIDATION

Lead families must have effective volume > 0. ARMS also requires lower-body maintenance volume.

---

## AO. VOLUME VALIDATION

Compares materialized effective volume to Phase 7/default min/max for **lead** regions only (not every listed primary alias).

---

## AP. MOVEMENT COVERAGE VALIDATION

Required roles + push/pull where applicable.

---

## AQ. REDUNDANCY VALIDATION

Same movement role ≥3 in one session = error; ≥2 = warning. Duplicate `external_id` in one session = error. Cross-session repeats allowed.

---

## AR. RECOVERY VALIDATION

Sequence + demand + overlap. Global set reduction when recovery POOR.

---

## AS. SESSION DURATION VALIDATION

`estimated_minutes > availableMinutes` → error. ≥90% → warning.

---

## AT. EQUIPMENT / LOCATION VALIDATION

Every selected ID re-checked with `explainEligibility`. HOME fixture: no CABLE; only HOME-compatible IDs.

---

## AU. SAFETY VALIDATION

`excludedExternalIds` is a hard filter and a validator error if present on a candidate.

---

## AV. SPOT-REDUCTION GUARDRAIL

`waistStagnationSpotReduction` → `PROGRAM_GENERATION_BLOCKED` + `SPOT_REDUCTION_LOGIC_INVALID`. Excess `TRUNK_FLEXION` on waist/fat-loss candidates also invalid.

---

## AW. NUTRITION OWNERSHIP BOUNDARY

Generator/validator/volume/selection sources contain no calories/macros/meal writes (grep test). No `from("` Supabase writes in the domain engine.

---

## AX. PROGRAM VERSIONING / SNAPSHOTS

Candidate `version` = previous + 1. `context_version` = `v2-phase10-1`. Historical snapshots remain `client_program_*`. Generator does not overwrite templates or live assignments.

---

## AY. PROGRAM REGENERATION TRIGGERS

`GENERATION_REASON_CODES`: initial, goal/days/location/equipment change, reallocation, review, schedule/duration adjustment, reconditioning, coach, safety. Not invoked per workout (workout routes do not import the generator).

---

## AZ. MINIMAL-CHANGE / DIFF STRATEGY

`programDiff`: retained / added / removed IDs. Ranking prefers previous IDs.

---

## BA. COACH OVERRIDE

`lockedExternalIds` score +100 and are trim-protected. Lock + safety exclusion → `COACH_OVERRIDE_CONFLICT`.

---

## BB. LEGACY COMPATIBILITY

Assigned programs continue via existing runtime. No V2 regeneration on page load. Free preview isolation unchanged.

---

## BC. DATABASE / RLS

**No new migration.** No `v2_programs`. Activation remains admin RPC `admin_assign_client_program` (clients cannot assign — existing snapshot RLS tests). Domain generate is pure.

---

## BD. TESTS ADDED

`src/lib/platform/program-generation/program-generation.test.ts` wired in `package.json` `npm test`.

---

## BE. TEST RESULTS

`npx tsx src/lib/platform/program-generation/program-generation.test.ts` → **passed** (2026-08-21). 24 Goal×frequency scenarios READY and not INVALID.

---

## BF. GOAL × DAYS/WEEK TEST MATRIX

All gym / 60 min / INTERMEDIATE / authored V2 library. Validation: `VALID_WITH_WARNINGS` (calibration of NEW exercises).

| GOAL_ID | DAYS | SESSION ROLES | PRIMARY | MINUTES |
|---|---|---|---|---|
| GLUTE_GROWTH | 2 | FULL_BODY, FULL_BODY | GLUTES family | 37, 34 |
| GLUTE_GROWTH | 3 | LOWER_GLUTE_PRIORITY, UPPER_SUPPORT, LOWER_GLUTE_SUPPORT | GLUTES family | 31, 28, 29 |
| GLUTE_GROWTH | 4 | LOWER_GLUTE_PRIORITY, UPPER_PRIORITY, LOWER_POSTERIOR, UPPER_SUPPORT | GLUTES family | 31, 34, 31, 28 |
| GLUTE_GROWTH | 5 | LOWER_GLUTE_PRIORITY, UPPER_PRIORITY, LOWER_GLUTE_SUPPORT, PULL_POSTERIOR, CORE_SUPPORT | GLUTES family | 31, 34, 29, 26, 24 |
| SLIM_TONED_WAIST | 2 | BALANCED_FULL_BODY ×2 | (none; CORE support) | 34, 36 |
| SLIM_TONED_WAIST | 3 | BALANCED_FULL_BODY, UPPER_SUPPORT, LOWER_SUPPORT | — | 34, 28, 28 |
| SLIM_TONED_WAIST | 4 | BALANCED_FULL_BODY, UPPER_SUPPORT, LOWER_SUPPORT, CORE_SUPPORT | — | (see test log) |
| SLIM_TONED_WAIST | 5 | BALANCED_FULL_BODY, UPPER_SUPPORT, LOWER_SUPPORT, PULL_POSTERIOR, CORE_SUPPORT | — | (see test log) |
| TONED_ARMS_UPPER_BODY | 2 | UPPER_PRIORITY, FULL_BODY | BICEPS/TRICEPS/SHOULDERS/UPPER_BACK | (see test log) |
| TONED_ARMS_UPPER_BODY | 3 | UPPER_PRIORITY, LOWER_SUPPORT, UPPER_SUPPORT | same | |
| TONED_ARMS_UPPER_BODY | 4 | UPPER_PRIORITY, LOWER_SUPPORT, UPPER_SUPPORT, PULL_POSTERIOR | same | |
| TONED_ARMS_UPPER_BODY | 5 | UPPER_PRIORITY, LOWER_SUPPORT, UPPER_SUPPORT, PULL_POSTERIOR, CORE_SUPPORT | same | |
| FEMININE_BALANCED_BODY | 2 | BALANCED_FULL_BODY ×2 | GLUTES | |
| FEMININE_BALANCED_BODY | 3 | LOWER_GLUTE_SUPPORT, UPPER_PRIORITY, BALANCED_FULL_BODY | GLUTES | |
| FEMININE_BALANCED_BODY | 4 | LOWER_GLUTE_SUPPORT, UPPER_PRIORITY, LOWER_POSTERIOR, UPPER_SUPPORT | GLUTES | |
| FEMININE_BALANCED_BODY | 5 | LOWER_GLUTE_SUPPORT, UPPER_PRIORITY, LOWER_POSTERIOR, UPPER_SUPPORT, CORE_SUPPORT | GLUTES | |
| FAT_LOSS | 2 | BALANCED_FULL_BODY ×2 | (balanced) | |
| FAT_LOSS | 3 | BALANCED_FULL_BODY, UPPER_SUPPORT, LOWER_SUPPORT | | |
| FAT_LOSS | 4 | LOWER_SUPPORT, UPPER_PRIORITY, LOWER_POSTERIOR, UPPER_SUPPORT | | |
| FAT_LOSS | 5 | LOWER_SUPPORT, UPPER_PRIORITY, BALANCED_FULL_BODY, PULL_POSTERIOR, CORE_SUPPORT | | |
| POSTURE_TONED_BACK | 2 | PULL_POSTERIOR, BALANCED_FULL_BODY | UPPER_BACK/LATS/POSTERIOR_DELTOID | |
| POSTURE_TONED_BACK | 3 | PULL_POSTERIOR, LOWER_SUPPORT, UPPER_SUPPORT | same | |
| POSTURE_TONED_BACK | 4 | PULL_POSTERIOR, LOWER_SUPPORT, UPPER_PRIORITY, CORE_SUPPORT | same | |
| POSTURE_TONED_BACK | 5 | PULL_POSTERIOR, LOWER_SUPPORT, UPPER_PRIORITY, CORE_SUPPORT, POSTERIOR_CHAIN | same | |

Same Goal does **not** share one role list across frequencies (asserted).

---

## BG. VALIDATOR TEST MATRIX

| INPUT | RESULT | CODE | HANDLING |
|---|---|---|---|
| Generated GLUTE 3-day | VALID_WITH_WARNINGS | NEW_EXERCISE_CALIBRATION_REQUIRED | may activate |
| Strip primary/hip-extension work | INVALID | MISSING_PRIMARY_REGION / MISSING_MOVEMENT_ROLE | no activate |
| GLUTES effective 0.5 vs min 6 | INVALID | REGIONAL_VOLUME_BELOW_MIN | no activate |
| GLUTES effective 40 vs max 14 | INVALID | REGIONAL_VOLUME_ABOVE_MAX | no activate |
| Replace IDs with CA-001 | INVALID | MISSING_MOVEMENT_ROLE | no activate |
| Duplicate same exercise ×4 | INVALID | REDUNDANT_STIMULUS_EXCESS | no activate |
| Two consecutive HIGH GLUTE roles | INVALID | RECOVERY_SPACING_INVALID | no activate |
| UPPER then LOWER | valid (no spacing error) | — | consecutive different regions OK |
| estimated 90 min | INVALID | SESSION_DURATION_EXCEEDED | no activate |
| HOME empty equipment vs gym IDs | INVALID | EQUIPMENT_MISMATCH / LOCATION_MISMATCH | no activate |
| ZZ-999 | INVALID | UNKNOWN_EXERCISE | no activate |
| excludedExternalIds on selected ID | INVALID | SAFETY_RESTRICTION_VIOLATION | no activate |
| duplicate sequence index | INVALID | DUPLICATE_SESSION_INDEX / INVALID_SEQUENCE | no activate |
| waist stagnation flag | BLOCKED | SPOT_REDUCTION_LOGIC_INVALID | no activate |
| empty eligible library | BLOCKED | NO_VALID_EXERCISE_CANDIDATE / MISSING_* | no activate |
| quads 12 vs glutes 4 | INVALID | PROTECTED_OUTCOME_CONFLICT | no activate |

---

## BH. NO-NUTRITION-WRITE TEST

Grep on `generate.ts`, `validate.ts`, `volume.ts`, `selection.ts`: no calories/macros/meals/Supabase writes.

---

## BI. NO-SPOT-REDUCTION TEST

`waistStagnationSpotReduction: true` → blocked. SLIM_TONED_WAIST programs are not TRUNK_FLEXION sessions.

---

## BJ. PERFORMANCE

Generator receives the exercise catalog in-memory (no N+1). No lifetime workout-history scan. Ranking is per slot over the filtered pool. Domain tests ~50s dominated by tsx + 24 full generations over ~313 approved IDs — acceptable for unit evidence, not a page-load path.

---

## BK. BUILD / TYPECHECK / LINT

- `npm test` (includes Phases 1–10 unit files): **exit 0**
- `npm run build`: **exit 0**
- Full `tsc` is not the product gate (pre-existing unrelated errors remain out of scope).

---

## BL. FILES MODIFIED

See section grouped list below.

---

## BM. DATABASE / MIGRATIONS

None. RLS unchanged.

---

## BN. OPEN GAPS

1. No coach/admin UI yet to call `generateTrainingProgram` then `admin_assign_client_program` atomically.  
2. Activation RPC does not yet accept a Phase 10 candidate payload (still template-copy). Wiring is explicit future work — not page-load.  
3. First-gen always warns calibration because experience defaults to NEW.  
4. `sessionDurationMismatch` is a context flag; realistic cap is `availableMinutes` (caller must pass it).  
5. Admin templates still allow 1 and 6–7 days; generator does not.

---

## BO. DEFERRED ITEMS

Phase 11: progress UX, explanations UI, observability, notifications, analytics. Substitution UX remains the existing assignment substitution RPC.

---

## BP. BLOCKERS / NEEDS_DECISION

None blocking QA. Decision for later: whether generated candidates persist via extended snapshot RPC or stay coach-assigned templates until an explicit generate-and-assign flow.

---

## BQ. FINAL STATUS

`PHASE_10_IMPLEMENTED_READY_FOR_QA`

---

## FILES MODIFIED (grouped)

| Group | File | Why |
|---|---|---|
| PROGRAM GENERATOR | `src/lib/platform/program-generation/generate.ts` | `generateTrainingProgram` |
| | `src/lib/platform/program-generation/index.ts` | public API |
| PROGRAM VALIDATOR | `src/lib/platform/program-generation/validate.ts` | `validateTrainingProgram` |
| GOAL PROFILES | consumed, not duplicated | Phase 4 `goal-profile.ts` + Phase 9 `profiles.ts` |
| SESSION STRUCTURE | `src/lib/platform/program-generation/roles.ts` | Goal × frequency blueprints |
| EXERCISE SELECTION | `src/lib/platform/program-generation/selection.ts` | filter + rank + pick |
| EXERCISE RANKING | same | deterministic scores |
| MOVEMENT ROLES | Phase 3 metadata; `requiredMovementRoles` | no second taxonomy |
| REGIONAL VOLUME | `src/lib/platform/program-generation/volume.ts` | materialize Phase 3/7 weights |
| SESSION ORDERING | `src/lib/platform/program-generation/order.ts` | safety/compound/priority |
| SESSION DURATION | `src/lib/platform/program-generation/duration.ts` | estimate + trim |
| RECOVERY SPACING | `validate.ts` | HIGH overlap consecutive |
| REGIONAL REALLOCATION | `roles.ts` `applyReallocation` + ranking | Phase 9 consume |
| PHASE 6 INTEGRATION | prescriptions without load | `suggested_weight_kg: null` |
| PHASE 7 INTEGRATION | contribution + recoveryState | `volume.ts` / generate sets |
| PHASE 8 INTEGRATION | `apply.ts` `toContinuityProgramDays` | sequence IDs |
| PHASE 9 INTEGRATION | reallocation + protected outcomes | generate + validate |
| PROGRAM VERSIONING | candidate.version / context_version | no DB rewrite |
| DATABASE / RLS | none | existing snapshots |
| TYPES | `src/lib/platform/program-generation/types.ts` | contracts + codes |
| TESTS | `program-generation.test.ts` + `package.json` | 24× matrix + validator + adaptation |
| DOCS | this report + `docs/README.md` | Phase 10 index |
| LEGACY COMPATIBILITY | no workout-route wiring | no auto regen |

---

## ACCEPTANCE (summary)

Centralized generate + validate; consumes Goal profiles, Exercise Library, Phase 7 volume semantics, Phase 8 sequence, Phase 9 reallocation; 2–5 days; six Goals; no one template per Goal; INVALID never activates; no nutrition mutation; no Phase 11 UI.

**Next:** Phase 11 only after explicit approval.
