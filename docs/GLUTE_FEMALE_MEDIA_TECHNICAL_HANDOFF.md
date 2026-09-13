# GLUTE FEMALE MEDIA — Technical Handoff (Developer)

**FROM:** Training (Cursor) — content ownership  
**TO:** Developer (Cursor) — storage / binding / display only  
**CONSTRAINT:** Do not change exercise selection, sequences, IDs, or Glute template content to “fix” media gaps.

## Finding (historical)

`FEMALE_MEDIA_VARIANT_DATA_MODEL_REQUIRED` — **resolved in code** via EXISTING_METADATA (see [`FEMALE_EXERCISE_MEDIA_VARIANT_TECHNICAL_REPORT.md`](./FEMALE_EXERCISE_MEDIA_VARIANT_TECHNICAL_REPORT.md)).

Current exercise media is dual-path STANDARD + optional FEMALE:

- DB: `thumbnail_path`, `video_path`, `instructions_video_path`, `video_status`, `metadata.media_variants`
- Public pack: `public/exercises/<external_id>/{stages,video,…}` + optional `female/`
- Client: `resolveExerciseMedia` / `resolvePreferredExerciseStillThumb`

## Minimal extension (proposal — do not invent full schema in Training docs as shipped DB)

Prefer extending **existing** `exercises.metadata` (or parallel typed columns later) **without new exercise rows**:

```json
{
  "media_variants": {
    "STANDARD": {
      "image_path": "...",
      "thumbnail_path": "...",
      "video_path": "...",
      "status": "READY|PLACEHOLDER|MISSING"
    },
    "FEMALE": {
      "image_path": "...",
      "thumbnail_path": "...",
      "video_path": "...",
      "status": "READY|PLACEHOLDER|MISSING",
      "version": 1
    }
  }
}
```

Filesystem convention (optional mirror):

```
public/exercises/<EXTERNAL_ID>/female/stages/...
public/exercises/<EXTERNAL_ID>/female/video/exercise.mp4
```

**Do not** create `Female Hip Thrust` as a second exercise ID.

## Client runtime (target behavior)

```
if preference === FEMALE:
  use FEMALE if status READY and URL resolves
  else STANDARD if READY
  else MEDIA_MISSING (no broken media)
```

Glute **product release** stays blocked until Training completeness = 100%, even if runtime fallback works.

## Admin readiness (later — no redesign now)

Needed eventually:

- Female Media Coverage %
- Missing female images / videos lists
- Template release readiness for Glute (`FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE`)

Current admin/library flags are insufficient for coverage %. Document only; no Admin UI work in this task.

## Boundary

| Owner | Owns |
|-------|------|
| Training | Which exercises need media + production specs + QA of assets |
| Developer | How variants are stored, resolved, rendered, admin metrics |

## Inputs for implementation

- [`data/glute-female-media-manifest-v1.json`](./data/glute-female-media-manifest-v1.json)
- [`GLUTE_FEMALE_MEDIA_RELEASE_AUDIT.md`](./GLUTE_FEMALE_MEDIA_RELEASE_AUDIT.md)
- Policy in sequence packs: `female_media_policy: FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE`

## Non-goals this handoff

- DB writes / migrations application in this audit wave  
- Media generation  
- Staging / Production changes  
- Phase 11
