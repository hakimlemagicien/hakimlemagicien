# GOAL-BASED ADAPTIVE TRAINING ENGINE V2
# PHASE 3/12 — EXERCISE LIBRARY V2 COMPATIBILITY REPORT

**Date:** 2026-08-21  
**Executor:** Cursor — Platform Development  
**Final status:** `PHASE_3_IMPLEMENTED_READY_FOR_QA`  
**Phase 4:** not started.

---

## A. EXECUTIVE SUMMARY

The existing exercise library (`public.exercises` + `scripts/exercise-library.json`) was upgraded in place. No `exercises_v2` table, no parallel catalog, no new admin manager, and no change to Sets/Reps/Load/goals/progression.

All **320** catalog identities (`CH-001` …) were audited and kept. V2 metadata was authored into `scripts/exercise-library-v2-metadata.json` and seeded onto the same rows. **313** exercises are `V2_ELIGIBLE`. **7** remain `REVIEW_REQUIRED` and are excluded from V2 candidate queries. Legacy/free programs still resolve.

## B. SOURCE OF TRUTH CONFIRMATION

| Key | Value |
|-----|--------|
| AUTHORING_SOURCE | `scripts/exercise-library.json` + `scripts/exercise-library-v2-metadata.json` |
| RUNTIME_SOURCE | `public.exercises` |
| SYNC_DIRECTION | catalog → DB by `external_id` (`scripts/sync-exercises.sh`) |
| ADMIN_EDIT_PATH | `src/components/admin/libraries/ExerciseLibraryManager.tsx` → `admin_save_exercise` |
| CONFLICT_RESOLUTION | empty JSON equipment/level cannot wipe DB; V2 columns apply from the V2 file; `external_id` immutable after insert |

Evidence: comments at top of `scripts/sync-exercises.sh`; `EXERCISE_LIBRARY_AUTHORING` in `src/lib/platform/exercise-library-v2.ts`.

## C. EXTERNAL_ID INTEGRITY

| Metric | Count |
|--------|------:|
| TOTAL_EXERCISES | 320 |
| ACTIVE_EXERCISES | 320 |
| MISSING_EXTERNAL_ID | 0 |
| DUPLICATE_EXTERNAL_ID | 0 |
| INVALID_EXTERNAL_ID | 0 |
| PROGRAM_REFERENCES_WITHOUT_MATCH | 0 |

Protection: trigger `trg_exercises_protect_external_id` + `admin_save_exercise` raises `external_id_immutable`. Format `^[A-Z]{2}-[0-9]{3}$`. `CH-001` remains `CH-001`.

## D. EXERCISE METADATA MODEL

Additive columns on `public.exercises` (legacy `equipment`, `primary_muscle`, `difficulty`, `exercise_type` kept):

`v2_metadata_status`, `primary_muscle_canonical`, `secondary_muscles_canonical`, `muscle_contributions`, `primary_movement_role`, `secondary_movement_roles`, `substitution_group`, `mechanics`, `loading_type`, `required_equipment`, `equipment_state`, `location_compatibility`, `is_bodyweight`, `is_unilateral`, `execution_sides`, `supports_timed_prescription`, `prescription_mode`, `conditioning_class`, `complexity`, `beginner_eligible`.

Read contract: `ExerciseV2Metadata` in `src/lib/platform/exercise-library-v2.ts`.  
Candidate filter: `listV2ExerciseCandidates` in `src/lib/platform/exercise-library-v2-api.ts`.  
Workout list payload in `exercise-library.ts` stays lean (no V2 bulk download on Sets).

## E. MUSCLE TAXONOMY

Canonical keys in `CANONICAL_MUSCLES`. Legacy aliases (`Pecs` → `CHEST`, `DB` → `DUMBBELLS`) in `MUSCLE_LEGACY_ALIASES` / `EQUIPMENT_ALIASES`. Display labels (`name_ar` / muscle group names) unchanged. `FULL_BODY` is used only for cardio/warmup/mobility where no hypertrophy target applies.

## F. MOVEMENT ROLE MODEL

`MOVEMENT_ROLES` includes the approved list plus `SCAPULAR_CONTROL` (justified by scapular push-up / wall-slide content). Primary role + optional secondary roles. Plank = `ANTI_EXTENSION`. Side plank = `LATERAL_STABILITY`. Core is a muscle target, not a dump role.

## G. EXERCISE TYPE / MECHANICS MODEL

Legacy `exercise_type` kept (`strength|cardio|mobility|warmup|other`). Independent `mechanics` = `COMPOUND | ISOLATION | NOT_APPLICABLE`. Independent `loading_type` (barbell/dumbbell/machine/cable/bodyweight/…).

## H. EQUIPMENT MODEL

`equipment_state`: `NO_EQUIPMENT | HAS_EQUIPMENT | UNKNOWN`.  
`required_equipment` text[] (empty iff `NO_EQUIPMENT`).  
`location_compatibility`: `GYM | HOME | NO_EQUIPMENT`.  
Empty string is not used as “no equipment”.

## I. BODYWEIGHT / UNILATERAL / TIMED MODEL

`is_bodyweight`, `is_unilateral`, `execution_sides`, `supports_timed_prescription`, `prescription_mode` (`REPS | DURATION | DISTANCE | INTERVAL | OTHER`). Duration requires timed support (DB trigger + TS validator). Bodyweight is an implementation property, not `load = 0`.

## J. DIRECT / INDIRECT CONTRIBUTION MODEL

`muscle_contributions` JSON array: `DIRECT_PRIMARY | DIRECT_SECONDARY | INDIRECT_MEANINGFUL | MINOR_STABILIZER`. No `0.5` / `0.33` coefficients.

## K. SUBSTITUTION MODEL

Semantic `substitution_group` (example `HORIZONTAL_CHEST_PRESS`, `BICEPS_CURL`) plus runtime ranking later via `substitutionCandidates()` (same movement role, optional equipment/location). Curl is not equivalent to row. No arbitrary `alternative_exercise_ids` lists.

## L. METADATA REVIEW WORKFLOW

`v2_metadata_status`: `UNREVIEWED | REVIEW_REQUIRED | APPROVED | BLOCKED`. Separate from `video_status`. `V2_ELIGIBLE` = active + valid `external_id` + complete critical metadata + `APPROVED`. Unverified rows are excluded from candidate reads only.

## M. ADMIN MANAGER CHANGES

Same surface: `ExerciseLibraryManager.tsx`. Added V2 fieldset (role, mechanics, loading, equipment state, bodyweight, unilateral, prescription, review status). `external_id` locked after create. Validation via `validateExerciseV2Draft` + RPC. No parallel “V2 Manager”.

## N. DATABASE / SOURCE CATALOG CHANGES

- `supabase/migrations/20260821140000_exercise_library_v2_compatibility.sql` — columns, checks, indexes, identity trigger, eligibility helper, `admin_save_exercise` / `admin_list_exercises`
- `supabase/migrations/20260821140100_exercise_library_v2_metadata_seed.sql` — UPDATE 320 rows by `external_id` (no INSERT)
- `scripts/exercise-library.json` — 320 rows now have canonical `equipment` + `level` (were empty)
- `scripts/exercise-library-v2-metadata.json` — 320 authored records
- `scripts/sync-exercises.sh` — empty-value protection + V2 apply

Migrations are in-repo only; not applied to production in this phase.

## O. EXERCISE COVERAGE COUNTS

320 catalog / 320 unique IDs / 313 V2 eligible / 7 review required / 0 blocked / 320 placeholder media.

## P. MOVEMENT ROLE COVERAGE

See `docs/EXERCISE_LIBRARY_V2_QA_REPORT.md`. Required roles for later program generation all have ≥1 eligible candidate. Low-count but non-zero: `SCAPULAR_CONTROL` (1), `LOADED_CARRY` (1), `HIP_ADDUCTION` (1).

## Q. MUSCLE COVERAGE

Goal muscles (glutes, arms, shoulders, upper back, lats, core-via-abs, quads, hamstrings, chest, calves) all have ≥3 eligible primaries after CORE aggregation. No fake exercises added to fill counts.

## R. EQUIPMENT COVERAGE

GYM 313 / HOME 177 / NO_EQUIPMENT 88 of V2-eligible. Future 2–5 day generation is not implemented; this is coverage only.

## S. SUBSTITUTION COVERAGE

Required-role substitution gaps: none. Same-equipment and home-compatible alternatives exist for the required roles at filter level (not ranked).

## T. MEDIA COVERAGE

320 placeholder. Shared placeholder intact (`SHARED_EXERCISE_PLACEHOLDER_PATH`). Video path remains `exercises/{external_id}/…`. No Storage deletion.

## U. DUPLICATE QA

POSSIBLE_DUPLICATE_PAIRS (exact name + role + muscle + loading): 0. Variations kept separate.

## V. PROGRAM REFERENCE QA

Hardcoded free IDs in `today-workout.ts` / `weekly-workout-schedule.ts` all resolve (`CH-001`, `CH-007`, `CH-010`, `BI-002`, `BI-003`, `TR-001`). ORPHAN_ACTIVE_PROGRAM_REFERENCE = 0. Template/snapshot tables are unchanged; they still join on `external_id`. No silent deletes.

## W. V2 ELIGIBLE COUNT

**313**

## X. REVIEW_REQUIRED COUNT

**7** (listed in the QA report)

## Y. TESTS ADDED

- `src/lib/platform/exercise-library-v2.test.ts` — identity, roles, equipment NO vs UNKNOWN, contribution semantics, substitution safety, eligibility, media, program refs, coverage
- `src/lib/platform/exercise-library-v2-validator.ts` — reusable catalog/program auditor
- extensions in `src/lib/admin/admin-libraries.test.ts` — V2 draft validation, identity lock, no `exercises_v2`
- `supabase/tests/exercise_library_v2_rls_test_plan.sql`

## Z. TEST RESULTS

`npx tsx src/lib/platform/exercise-library-v2.test.ts` — passed  
`npx tsx src/lib/admin/admin-libraries.test.ts` — passed  
`npm test` — see section AA

## AA. BUILD / TYPECHECK RESULT

`npm test` — passed (includes `exercise-library-v2.test.ts`).  
`npm run build` — passed.  
Pre-existing `tsc --noEmit` errors outside this phase were not used as the product gate (same as Phase 2).

## AB. FILES MODIFIED

See section N plus:

- `src/lib/platform/exercise-library-v2.ts`
- `src/lib/platform/exercise-library-v2-api.ts`
- `src/lib/platform/exercise-library-v2-validator.ts`
- `src/lib/platform/exercise-library-v2.test.ts`
- `src/lib/platform/exercise-library.ts` (lean-payload comment)
- `src/lib/admin/admin-exercises-api.ts`
- `src/lib/admin/admin-libraries.ts`
- `src/components/admin/libraries/ExerciseLibraryManager.tsx`
- `src/integrations/supabase/types.ts`
- `package.json`
- `scripts/generate-exercise-library-v2-metadata.py`
- `docs/EXERCISE_LIBRARY_V2_QA_REPORT.md`
- this report

## AC. OPEN LIBRARY GAPS

- 7 REVIEW_REQUIRED names need coach confirmation before V2 auto-selection.
- All 320 videos are still placeholder (unchanged product policy).
- `SCAPULAR_CONTROL` / `LOADED_CARRY` / `HIP_ADDUCTION` have only 1 eligible primary each.
- Catalog authoring used library names + `external_id` prefixes; low-confidence names were not auto-APPROVED.

## AD. DEFERRED ITEMS FOR PHASE 4+

- Phase 4: calibration, automatic training level, selection ranking, sets/reps/duration, starting prescription, effort/rest
- Phase 5/6: `PENDING_PHASE_5_6_CRITICAL_CONFLICT` (+10% intra-set load) — untouched
- Phase 4: `PENDING_PHASE_4_CRITICAL_CONFLICT` (fixed starting loads) — untouched
- Phase 7: numeric volume coefficients
- Phase 9: goal ranking / regional response
- Timer/sounds/hydration (Phase 5)
- Nutrition coupling: none
- Production apply of these migrations: not done here

## AE. BLOCKERS / NEEDS_DECISION

None blocking Phase 3 QA. Optional later: coach review of the 7 REVIEW_REQUIRED IDs; whether `SCAPULAR_CONTROL` should be a primary role on more mobility drills.

## AF. FINAL STATUS

**PHASE_3_IMPLEMENTED_READY_FOR_QA**
