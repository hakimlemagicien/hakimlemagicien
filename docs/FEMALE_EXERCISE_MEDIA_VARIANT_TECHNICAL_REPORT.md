# FEMALE EXERCISE MEDIA VARIANT — Technical Foundation Report

**TASK:** `FEMALE_EXERCISE_MEDIA_VARIANT_TECHNICAL_FOUNDATION`  
**STATUS:** `PASS`  
**ENVIRONMENT:** `LOCAL_ONLY`  
**DATE:** 2026-09-13  
**PARENT:** `GLUTE_FEMALE_MEDIA_RELEASE_READINESS_AUDIT` — APPROVED

## Decision: data model

| Choice | Value |
|--------|--------|
| Approach | **EXISTING_METADATA** (`exercises.metadata.media_variants`) |
| Migration | **NO** — JSONB column already exists; no Staging/Production schema change |
| Duplicate exercises | **0** — one canonical `external_id` |

### Contract

```
variant: STANDARD | FEMALE
media_type: IMAGE | VIDEO
status: READY | MISSING | PROCESSING | PLACEHOLDER
path / url
```

PLACEHOLDER never counts as READY for completeness or resolver selection.

### Filesystem convention

```
public/exercises/<EXTERNAL_ID>/…                 → STANDARD
public/exercises/<EXTERNAL_ID>/female/…          → FEMALE
Storage: exercises/<EXTERNAL_ID>/female/…        → FEMALE (bucket exercise-media)
```

Existing STANDARD stage packs and `BI-002` video remain untouched.

## Modules

| Module | Role |
|--------|------|
| `src/lib/platform/exercise-media-variants/*` | Contract, paths, metadata R/W, resolver, completeness, register, Admin presenters, still helper |
| `resolveExerciseMedia` | FEMALE → STANDARD → MEDIA_MISSING |
| `registerExerciseMediaAsset` | Future import — idempotent, validated |
| `calculateGluteFemaleMediaCompleteness` | 40-set counters |
| `evaluateGluteReleaseReadiness` | Independent of runtime fallback |

Manifest JSON remains **production handoff only** — not runtime SoT.

## Client / Admin wiring

- Workout list + player stills use `resolvePreferredExerciseStillThumb` (no broken img on MEDIA_MISSING).
- `WeekdayWorkoutPlan.preferredMediaVariant` + session field thread preference (default STANDARD).
- Preference resolved from template **contract** (`preferred_media_variant`), not `if goal === glute` in UI.
- Admin template detail (Glute): Female Media full / images / videos + release blocked label.

## Completeness now (expected)

```
40 required · 0 female images · 0 female videos · 0 full · 0%
GLUTE_RELEASE = BLOCKED_BY_FEMALE_MEDIA
```

Runtime may fall back to STANDARD; release gate stays blocked.

## Tests run

- `exercise-media-variants.test.ts` — PASS  
- `exercise-stage-media.test.ts` — PASS (STANDARD regression)  
- `admin-exercise-media.test.ts` — PASS  
- `phase8-audit.test.ts` — PASS  

Local: `40/40` external IDs resolve; `VITE_SUPABASE_URL` → `127.0.0.1:54321`; no female files generated.

## Safety

| Flag | Value |
|------|------:|
| DB_WRITES | 0 (no migration applied; no metadata writes) |
| MEDIA_GENERATED | 0 |
| TEMPLATES_CHANGED | 0 |
| EXERCISE_SEQUENCES_CHANGED | 0 |
| STAGING_CHANGED | NO |
| PRODUCTION_CHANGED | NO |

## Known gap (resolved)

Assignment RPC now freezes `preferred_media_variant` onto `client_program_assignments` and runtime/weekday plans hydrate it. See [`FEMALE_MEDIA_PREFERENCE_RUNTIME_HANDOFF_REPORT.md`](./FEMALE_MEDIA_PREFERENCE_RUNTIME_HANDOFF_REPORT.md).

## Next

**STOP** — Media Production P0 after PM approval. Do not reopen Training Template System V1.
