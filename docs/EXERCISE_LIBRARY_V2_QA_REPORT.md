# EXERCISE_LIBRARY_V2_QA_REPORT

**Date:** 2026-08-21  
**Phase:** 3/12 — Exercise Library V2 Compatibility  
**Catalog source:** `scripts/exercise-library.json` + `scripts/exercise-library-v2-metadata.json`  
**Runtime source:** `public.exercises`

## Identity

| Metric | Count |
|--------|------:|
| TOTAL_EXERCISES | 320 |
| ACTIVE_EXERCISES | 320 |
| MISSING_EXTERNAL_ID | 0 |
| DUPLICATE_EXTERNAL_ID | 0 |
| INVALID_EXTERNAL_ID | 0 |
| PROGRAM_REFERENCES_WITHOUT_MATCH | 0 |
| ORPHAN_ACTIVE_PROGRAM_REFERENCE | 0 |

`external_id` format: `{AA}-{NNN}` (example `CH-001`). Identity is not the display name and is not the video filename.

## V2 review

| Metric | Count |
|--------|------:|
| V2_ELIGIBLE | 313 |
| REVIEW_REQUIRED | 7 |
| BLOCKED | 0 |
| UNREVIEWED (after seed) | 0 |

REVIEW_REQUIRED (excluded from V2 candidate reads, still usable in V1/legacy programs):

- `SH-021` Bus Driver
- `SH-024` Lu Raise
- `SH-025` Powell Raise
- `TR-010` JM Press
- `TR-020` California Press
- `CR-014` HIIT Circuit
- `CR-020` Tabata

## Critical metadata gaps (catalog after authoring)

| Metric | Count |
|--------|------:|
| missing primary muscle | 0 |
| missing movement role | 0 |
| missing equipment state | 0 |
| unknown mechanics | 0 |
| unknown prescription mode | 0 |

## Media

| Metric | Count |
|--------|------:|
| TOTAL | 320 |
| READY | 0 |
| PLACEHOLDER | 320 |
| MISSING | 0 |
| REVIEW_REQUIRED | 0 |

Shared placeholder policy remains: `exercises/placeholders/default-exercise.mp4`. Missing/placeholder media does not invalidate training identity. No Storage files were deleted.

## Movement role coverage (V2 eligible)

| Role | Count |
|------|------:|
| SQUAT | 39 |
| ELBOW_FLEXION | 34 |
| MOBILITY | 25 |
| ELBOW_EXTENSION | 19 |
| WARMUP | 19 |
| HIP_EXTENSION | 16 |
| CALF_RAISE | 15 |
| HORIZONTAL_PULL | 14 |
| TRUNK_FLEXION | 14 |
| HORIZONTAL_PUSH | 13 |
| VERTICAL_PUSH | 13 |
| VERTICAL_PULL | 12 |
| LOCOMOTION | 12 |
| ANTI_EXTENSION | 8 |
| SHOULDER_ABDUCTION | 8 |
| STEADY_CARDIO | 8 |
| HINGE | 7 |
| INTERVAL_CONDITIONING | 7 |
| KNEE_FLEXION | 6 |
| HIP_ABDUCTION | 6 |
| ANTI_ROTATION | 5 |
| KNEE_EXTENSION | 3 |
| LATERAL_STABILITY | 3 |
| SHOULDER_EXTERNAL_ROTATION | 2 |
| SHOULDER_FLEXION | 2 |
| SCAPULAR_CONTROL | 1 |
| LOADED_CARRY | 1 |
| HIP_ADDUCTION | 1 |

ROLE_WITH_ZERO_ELIGIBLE_EXERCISES (required program roles): none.

## Muscle coverage (V2 eligible primaries)

Primary counts are canonical keys. Abs are classified as `RECTUS_ABDOMINIS` / `OBLIQUES`, not a generic `CORE` role. CORE coverage via those two groups is sufficient for later goal engines.

GOAL_REQUIRED_MUSCLE_WITH_LOW_COVERAGE: none (< 3 eligible primaries, CORE counted via rectus + obliques).

## Equipment / location

| Environment | Eligible exercises |
|-------------|-------------------:|
| GYM | 313 |
| HOME | 177 |
| NO_EQUIPMENT | 88 |

`NO_EQUIPMENT` is an explicit state. It is not an empty string and is not `UNKNOWN`.

## Substitution

Same-role candidate queries are available (`substitutionCandidates` / `filterV2Candidates`). Curl ≠ row. SUBSTITUTION_GAPS for required roles with no alternative or no home option: none.

POSSIBLE_DUPLICATE_PAIRS (same role + muscle + loading + exact name): none. Variations remain separate on purpose.

## Arabic / English names

missing_name_ar: 0  
missing_name_en: 0  
placeholder names: 0  
ID-as-name: 0

## Source of truth

| Key | Value |
|-----|--------|
| AUTHORING_SOURCE | `scripts/exercise-library.json` (names/media) + `scripts/exercise-library-v2-metadata.json` (V2 fields) |
| RUNTIME_SOURCE | `public.exercises` |
| SYNC_DIRECTION | JSON → DB upsert by `external_id`. Never deletes. Empty catalog equipment/level cannot wipe populated DB values. V2 columns applied from the V2 metadata file. |
| ADMIN_EDIT_PATH | Exercise Library Manager → `admin_save_exercise` |
| CONFLICT_RESOLUTION | Admin DB writes win until the next explicit V2 apply. `external_id` is immutable after insert. |
