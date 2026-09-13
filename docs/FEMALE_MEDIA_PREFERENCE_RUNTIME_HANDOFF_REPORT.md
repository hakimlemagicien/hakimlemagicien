# FEMALE MEDIA PREFERENCE — Runtime Handoff Report

**TASK:** `FEMALE_MEDIA_PREFERENCE_RUNTIME_HANDOFF`  
**STATUS:** `PASS`  
**ENVIRONMENT:** `LOCAL_ONLY`  
**DATE:** 2026-09-13  
**PARENT:** `FEMALE_EXERCISE_MEDIA_VARIANT_TECHNICAL_FOUNDATION` — APPROVED

## Root cause

`preferred_media_variant` lived on `program_templates.metadata.template_contract.media_preference` and was documented as `PROVENANCE_RECORD`, but:

1. `admin_assign_client_program` never froze it onto `client_program_assignments`
2. `client_get_my_training_runtime` therefore never returned it (`to_jsonb` of assignment row)
3. `runtimeToWeekdayPlans` / `runtimeDayToPlan` never set `WeekdayWorkoutPlan.preferredMediaVariant`

Workout UI already consumed `preferredMediaVariant` when present — the value never arrived.

## Fix (minimal)

| Layer | Change |
|-------|--------|
| DB | Column `client_program_assignments.preferred_media_variant` DEFAULT `'STANDARD'` |
| Assign RPC | Freeze from `template_contract.media_preference.preferred_media_variant` (`FEMALE` else `STANDARD`) |
| Runtime | Assignment JSON includes column automatically |
| TS | Parse + hydrate into weekday plans |
| Preview | Admin «معاينة كعميل» uses template contract preference (no assignment) |

**Migration:** `supabase/migrations/20260913140000_freeze_preferred_media_variant_on_assignment.sql`  
**Applied Local:** YES  
**Staging/Production:** NO

Historical assignments: DEFAULT `STANDARD` (no silent FEMALE backfill).

## Verification (Local smoke)

| Check | Result |
|-------|--------|
| Glute template preference | FEMALE |
| Glute new assignment freeze | FEMALE |
| Master mutated after assign | assignment stays FEMALE |
| Runtime preference | FEMALE |
| Weekday plan preference | FEMALE |
| Resolver without female asset | STANDARD still fallback |
| Reassign Fat Loss control | new STANDARD; old FEMALE replaced unchanged |
| Media generated | 0 |

## Files

- `supabase/migrations/20260913140000_freeze_preferred_media_variant_on_assignment.sql`
- `src/lib/platform/assigned-program-api.ts`
- `src/lib/platform/continuity/apply.ts`
- `src/lib/platform/exercise-media-variants/preference.ts`
- Admin preview: `AdminProgramBuilder.tsx`, `AdminClientExercisePreview.tsx`
- Tests: `female-media-preference-handoff.test.ts`, `female-media-preference-local-smoke.mts`

## MEDIA_PRODUCTION_P0_READY

**YES** — preference propagates; completeness still 0% until P0 assets exist.

## STOP

No media generation. No Staging. No Production apply of this migration in this wave unless separately approved.
