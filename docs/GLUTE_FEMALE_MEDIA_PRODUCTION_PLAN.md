# GLUTE FEMALE MEDIA — Production Plan

**SCOPE:** Glute GYM release only (`FOUNDATION_3D` + `PROGRESS_4D`)  
**DO NOT:** generate media in this audit wave · change sequences · create female exercise IDs  
**PACK:** [`data/glute-female-media-manifest-v1.json`](./data/glute-female-media-manifest-v1.json) → `assets[]`

## Exact production load

| Item | Count |
|------|------:|
| Unique exercises | 40 |
| Female images to create | 40 |
| Female videos to create | 40 |
| Total assets | **80** |
| Reusable existing FEMALE assets | **0** |
| STANDARD assets usable as pose/equipment reference | 30 images (+ 1 video `BI-002`) |

## Production order (recommended)

1. **P0 (34 assets)** — shared across both templates (unblocks both gates fastest)
2. **P1 (22 assets)** — primary glute/leg/back mains on one template
3. **P2 (16 assets)** — accessories (arms/shoulders/chest extras)
4. **P3 (8 assets)** — remaining single-template warm-ups

Gate rule: all 80 must be `FEMALE_*_READY` before `GLUTE_RELEASE_READY = YES`.

## Image spec (every FEMALE_IMAGE_REQUIRED)

| Field | Requirement |
|-------|-------------|
| Demonstrator | Female |
| Clothing | Athletic, non-branded |
| Environment | Clean gym / approved solid or subtle background |
| Identity | Exact `external_id` exercise (equipment must match) |
| Technique | Anatomically plausible, correct representation |
| Camera | 3/4 front or side showing working joint/limb |
| Text / logos | None embedded |
| Misleading equipment | Forbidden |
| Variant label | `FEMALE` on same exercise record — not a new exercise |

Use STANDARD stage stills under `public/exercises/<ID>/stages/` as **reference only** when present.

## Video spec (every FEMALE_VIDEO_REQUIRED)

| Field | Requirement |
|-------|-------------|
| Demonstrator | Female |
| Start → path → end | Full controlled rep |
| Camera | Locked tripod; prefer full body |
| Loop | Seamless 1–2 rep loop preferred |
| Duration | ~4–12 s guidance |
| Unsafe errors to avoid | Lumbar rounding under load, knee collapse, neck strain, momentum swing |
| Text / logos | None |

Do not ship broken `<video>` / broken `<img>` — Client must omit or fall back to STANDARD only when variant missing (runtime), without claiming release readiness.

## Warm-up / cardio / mobility

In current Glute sequences:

- Warm-ups **are in scope** (10 WU IDs; roles `GENERAL_WARM_UP` / `TARGETED_DYNAMIC_WARM_UP`)
- No cardio / mobility activities present → nothing marked `NOT_REQUIRED`

## Reuse opportunity (later — out of scope)

Once FEMALE variants exist for this 40-set, many IDs (`LE-*`, `BA-*`, `GL-*`, core WU) can feed Body Recomposition / Fat Loss / General Fitness / Strength / Healthy Aging **without** expanding this production wave to all 37 templates.

## Validation before marking READY

Per asset in JSON `validation_requirements`:

1. Female demonstrator visible  
2. Matches exercise identity + equipment  
3. Technique-correct pose/path  
4. No embedded text/logos  
5. Video loop-safe  

Training owner signs content QA. Developer wires storage/display only.

## Stop line

After this plan + JSON pack: **STOP** media generation until PM schedules production.
