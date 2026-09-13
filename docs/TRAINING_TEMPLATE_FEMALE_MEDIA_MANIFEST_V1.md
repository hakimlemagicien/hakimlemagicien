# TRAINING TEMPLATE — Female Media Manifest V1

**TASK:** `GLUTE_FEMALE_MEDIA_RELEASE_READINESS_AUDIT`  
**SOURCE OF TRUTH:** Local DB — actual activities on Glute GYM templates (not historical guess)  
**Machine pack:** [`data/glute-female-media-manifest-v1.json`](./data/glute-female-media-manifest-v1.json)

## Policy (locked)

| Rule | Value |
|------|-------|
| Exercise Library | **ONE** canonical exercise record |
| Media variants | `STANDARD` + `FEMALE` (no duplicate female exercise IDs) |
| Preferred demonstrator | `FEMALE` |
| Preferred media variant | `FEMALE` |
| Runtime fallback | `FEMALE` → `STANDARD` → `MEDIA_MISSING` |
| Glute release gate | `FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE` — fallback does **not** make Glute `RELEASE_READY` |

## Scope templates (2/2 — no HOME)

1. `GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D`
2. `GLUTE_FOCUS_PROGRESS_INTERMEDIATE_GYM_4D`

`GLUTE_*_HOME_*` = not in product master / not audited as release targets.

## Counts (recomputed from Local DB)

| Metric | Value |
|--------|------:|
| UNIQUE_FEMALE_MEDIA_EXERCISE_SET | **40** |
| Activity rows across both templates | **63** |
| Used in both templates (deduped once) | **17** |
| Diff vs prior 40-ID list | **0** (exact match) |
| FEMALE images ready | **0** |
| FEMALE videos ready | **0** |
| FULL_FEMALE_MEDIA_READY | **0** |
| PLACEHOLDERS counted as ready | **0** (never) |

### Completeness formula

```
FEMALE_IMAGE_% = FEMALE_IMAGES_READY / 40 × 100
FEMALE_VIDEO_% = FEMALE_VIDEOS_READY / 40 × 100
FULL_%         = exercises with BOTH female image + female video ready / 40 × 100
```

Current: **0.00% / 0.00% / 0.00%**

## UNIQUE_FEMALE_MEDIA_EXERCISE_SET

| # | external_id | name_en | roles | templates | priority | female overall | standard on disk |
|--:|-------------|-----------|-------|-----------|----------|----------------|------------------|
| 1 | `AB-006` | Plank | MAIN_RESISTANCE | F | P2 | STANDARD_ONLY | image stages |
| 2 | `AB-011` | Dead Bug | MAIN_RESISTANCE | F+P | P0 | STANDARD_ONLY | image stages |
| 3 | `BA-006` | Lat Pulldown | MAIN_RESISTANCE | P | P1 | STANDARD_ONLY | image stages |
| 4 | `BA-010` | Barbell Row | MAIN_RESISTANCE | P | P1 | STANDARD_ONLY | image stages |
| 5 | `BA-016` | Seated Cable Row | MAIN_RESISTANCE | F+P | P0 | STANDARD_ONLY | image stages |
| 6 | `BA-017` | Chest Supported Row | MAIN_RESISTANCE | P | P1 | STANDARD_ONLY | image stages |
| 7 | `BA-023` | Romanian Deadlift | MAIN_RESISTANCE | F+P | P0 | STANDARD_ONLY | image stages |
| 8 | `BI-001` | Barbell Curl | MAIN_RESISTANCE | P | P2 | STANDARD_ONLY | image stages |
| 9 | `BI-002` | Dumbbell Curl | MAIN_RESISTANCE | P | P2 | STANDARD_ONLY | image + video |
| 10 | `CH-003` | Dumbbell Bench Press | MAIN_RESISTANCE | P | P2 | STANDARD_ONLY | image stages |
| 11 | `CH-012` | Machine Chest Press | MAIN_RESISTANCE | F+P | P0 | STANDARD_ONLY | image stages |
| 12 | `GL-001` | Hip Thrust | MAIN_RESISTANCE | F+P | P0 | STANDARD_ONLY | image stages |
| 13 | `GL-002` | Glute Bridge | MAIN_RESISTANCE | F | P1 | STANDARD_ONLY | image stages |
| 14 | `GL-003` | Cable Kickback | MAIN_RESISTANCE | F+P | P0 | STANDARD_ONLY | image stages |
| 15 | `GL-004` | Frog Pump | MAIN_RESISTANCE | F+P | P0 | STANDARD_ONLY | image stages |
| 16 | `GL-006` | Single Leg Hip Thrust | MAIN_RESISTANCE | F+P | P0 | STANDARD_ONLY | image stages |
| 17 | `GL-007` | Hip Abduction Machine | MAIN_RESISTANCE | F+P | P0 | STANDARD_ONLY | image stages |
| 18 | `GL-009` | Fire Hydrant | MAIN_RESISTANCE | F | P1 | STANDARD_ONLY | image stages |
| 19 | `GL-015` | Banded Lateral Walk | MAIN_RESISTANCE | F+P | P0 | STANDARD_ONLY | image stages |
| 20 | `LE-001` | Back Squat | MAIN_RESISTANCE | P | P1 | STANDARD_ONLY | image stages |
| 21 | `LE-003` | Goblet Squat | MAIN_RESISTANCE | F | P1 | STANDARD_ONLY | image stages |
| 22 | `LE-004` | Leg Press | MAIN_RESISTANCE | F | P1 | STANDARD_ONLY | image stages |
| 23 | `LE-005` | Hack Squat | MAIN_RESISTANCE | P | P1 | STANDARD_ONLY | image stages |
| 24 | `LE-007` | Walking Lunge | MAIN_RESISTANCE | F+P | P0 | STANDARD_ONLY | image stages |
| 25 | `LE-008` | Reverse Lunge | MAIN_RESISTANCE | F | P1 | STANDARD_ONLY | image stages |
| 26 | `LE-009` | Leg Extension | MAIN_RESISTANCE | P | P1 | STANDARD_ONLY | image stages |
| 27 | `SH-002` | Dumbbell Shoulder Press | MAIN_RESISTANCE | P | P2 | STANDARD_ONLY | image stages |
| 28 | `SH-005` | Lateral Raise | MAIN_RESISTANCE | P | P2 | STANDARD_ONLY | image stages |
| 29 | `TR-001` | Tricep Pushdown | MAIN_RESISTANCE | P | P2 | STANDARD_ONLY | image stages |
| 30 | `TR-002` | Rope Pushdown | MAIN_RESISTANCE | P | P2 | STANDARD_ONLY | image stages |
| 31 | `WU-001` | Arm Circles | WARM_UP | F+P | P0 | MEDIA_MISSING | none |
| 32 | `WU-002` | Leg Swings | WARM_UP | F+P | P0 | MEDIA_MISSING | none |
| 33 | `WU-003` | Hip Circles | WARM_UP | F+P | P0 | MEDIA_MISSING | none |
| 34 | `WU-010` | Band Pull Apart | WARM_UP | P | P3 | MEDIA_MISSING | none |
| 35 | `WU-013` | Shoulder Rolls | WARM_UP | P | P3 | MEDIA_MISSING | none |
| 36 | `WU-017` | Bodyweight Squat | WARM_UP | F+P | P0 | MEDIA_MISSING | none |
| 37 | `WU-019` | Arm Swings | WARM_UP | P | P3 | MEDIA_MISSING | none |
| 38 | `WU-020` | Hip Openers | WARM_UP | F+P | P0 | MEDIA_MISSING | none |
| 39 | `WU-021` | Scapular Push Up | WARM_UP | P | P3 | MEDIA_MISSING | none |
| 40 | `WU-022` | Glute Bridge March | WARM_UP | F+P | P0 | MEDIA_MISSING | none |

`F` = Foundation · `P` = Progress · WARM_UP = `GENERAL_WARM_UP` and/or `TARGETED_DYNAMIC_WARM_UP`

## Status vocabulary (no fake READY)

Per exercise image/video:

- `FEMALE_IMAGE_READY` / `FEMALE_VIDEO_READY`
- `FEMALE_IMAGE_REQUIRED` / `FEMALE_VIDEO_REQUIRED`
- Overall: `FEMALE_MEDIA_READY` | `STANDARD_ONLY` | `MEDIA_MISSING` | `NOT_REQUIRED`

Placeholders (`video_status = placeholder`) are **never** `MEDIA_READY`.

## Activity-role policy for Glute

All client-visible activities in these two templates require female image **and** female video before Glute release:

- `MAIN_RESISTANCE` → required
- `GENERAL_WARM_UP` → required
- `TARGETED_DYNAMIC_WARM_UP` → required

No `POST_WORKOUT_CARDIO` / `MOBILITY_ACTIVITY` rows appear in the current Glute GYM sequences.  
No exercise was marked `NOT_REQUIRED` for Glute release (requirement not lowered to inflate %).

## External ID validation

All **40** IDs resolve to live `exercises` rows via Local DB join. No synthetic IDs.

## Related docs

- [`GLUTE_FEMALE_MEDIA_RELEASE_AUDIT.md`](./GLUTE_FEMALE_MEDIA_RELEASE_AUDIT.md)
- [`GLUTE_FEMALE_MEDIA_PRODUCTION_PLAN.md`](./GLUTE_FEMALE_MEDIA_PRODUCTION_PLAN.md)
- [`GLUTE_FEMALE_MEDIA_TECHNICAL_HANDOFF.md`](./GLUTE_FEMALE_MEDIA_TECHNICAL_HANDOFF.md)

**FEMALE_MEDIA_AVAILABLE:** 0  
**MEDIA_GENERATED:** 0  
**DB_WRITES:** 0  
**TEMPLATES_CHANGED:** 0
