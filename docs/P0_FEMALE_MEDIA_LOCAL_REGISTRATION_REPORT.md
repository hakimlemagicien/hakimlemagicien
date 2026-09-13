# P0 FEMALE MEDIA — Local Registration Report

**TASK:** `P0_FEMALE_MEDIA_LOCAL_REGISTRATION`  
**STATUS:** `PASS`  
**DATE:** 2026-09-13  
**ENVIRONMENT:** `LOCAL_ONLY` (`127.0.0.1:54321` / DB `127.0.0.1:54322`)

## Executive

P0 Female media registered on the **existing 17 exercises** (no new exercise rows).

| Gate | Result |
|------|--------|
| FEMALE images READY | **17/17** |
| TEMPORARY_STILL_AS_VIDEO registered | **17/17** |
| REAL female videos READY | **0/17** |
| P0_DISPLAY_READY | **YES** |
| REAL_VIDEO_UPGRADE_PENDING | **YES** |
| Duplicate exercises created | **0** |

## Registration contract

- Variant: `FEMALE`
- IMAGE: `READY` → `/exercises/<ID>/female/stages/stage-b-thumb.webp`
- VIDEO: `TEMPORARY_STILL_AS_VIDEO` → `/exercises/<ID>/female/video/exercise.mp4`
- Flags: `real_video_required=true`, `replacement_pending=true`
- Temporary video is **never** stored as `READY`

## Completeness (P0 set)

| Metric | Value |
|--------|------:|
| IMAGE | 17/17 = 100% |
| DISPLAY | 17/17 = 100% |
| REAL VIDEO | 0/17 = 0% |

Full Glute set (40) remains image-incomplete until P1 — expected.

## V1 Glute release policy

- Female **image/display** required for V1 readiness
- Real female video = **POST-LAUNCH_MEDIA_UPGRADE**
- `REAL_VIDEO_COMPLETENESS < 100%` does **not** block V1 display readiness
- Admin shows: images / display / real videos / upgrade pending (not “17/17 videos ready”)

## Runtime

- Session loads `exercises.metadata` and prefers FEMALE stills/video playback when preference is FEMALE
- Temporary MP4 is playable via public path (`/exercises/.../female/video/exercise.mp4`)
- P0 FEMALE resolve does **not** fall back to STANDARD when female image is registered
- Control templates remain STANDARD

## Replacement contract

- Final real video path unchanged: `public/exercises/<ID>/female/video/exercise.mp4`
- Simulation: status flip TEMPORARY → READY on same path then rollback — **PASS**
- Final DB: all 17 videos remain `TEMPORARY_STILL_AS_VIDEO`

## Tests

- `exercise-media-variants.test.ts` — PASS
- `female-media-preference-handoff.test.ts` — PASS
- `p0-female-media-local-registration.mts` — PASS (idempotent second pass)

## Safety

| Flag | Value |
|------|------:|
| DB_WRITES | LOCAL_ONLY |
| STAGING_CHANGED | NO |
| PRODUCTION_CHANGED | NO |
| TEMPLATES_CHANGED | 0 |
| EXERCISE_SEQUENCES_CHANGED | 0 |
| P1 started | NO |

## Next

**STOP.** Hand off to PM / Media Production for **P1 image production** (not auto-started).  
Later: replace temporary MP4s with real videos → status `READY` only.
