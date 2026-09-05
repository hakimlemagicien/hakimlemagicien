# MAAKFIT Admin Training Program Management V1 — Implementation Report

**Date:** 2026-09-04  
**Branch:** `feat/admin-training-program-management-v1`  
**Environment:** LOCAL ONLY  
**Staging deploy:** not performed  
**Production deploy:** not performed  
**Main merge:** not performed

This document records what was implemented in the local repository. It is not a proposal.

---

## 1. Executive Summary

Coach/Admin can now operate training from Admin as a product workflow:

- **Program Templates** — create, edit draft structure, duplicate, version, archive, preview, activate
- **Client 360 → Training** — choose Strategy Matrix or Program Template, compatibility-check templates, assign a snapshot, edit **this client only**, save through authorized RPCs with stale-update protection, keep history

Strategy Matrix is unchanged as a domain engine. Templates are a second source. Client runtime still reads the assigned snapshot, not a mutable template row.

`PROGRAM_VERSIONING_COMPLETION_REQUIRED` remains `true` (catalog freeze is not claimed complete).

---

## 2. Existing Architecture Reused

| Area | Reuse |
|------|--------|
| `program_templates` + weeks/days/exercises | KEEP / EXTEND metadata + clone RPC |
| `client_program_assignments` snapshots | KEEP — assign still copies template into client tree |
| `admin_assign_client_program` | KEEP — template → snapshot |
| `admin_assign_generated_v2_program` + orchestrator | KEEP — Matrix path |
| `admin_save_client_assignment_exercises` | EXTEND — add/remove + reason audit |
| `prepareTrainingProgramAssignment` | KEEP |
| Coach Override + `MatrixImpactCard` | KEEP |
| `session-muscle-presentation` | KEEP — session names/visual keys |
| Core 100 / exercise library RPCs | KEEP — picker is library-only |
| `_require_admin` + `training.manage` | KEEP |
| `_write_audit_event` | KEEP / EXTEND event names |
| Optimistic `p_expected_updated_at` / `stale_update` | KEEP |
| `active_workout_in_progress` on assignment replace | KEEP |
| Weekly calendar weekday order | KEEP (`WEEKDAY_CALENDAR_ORDER`) |

No parallel Training Engine. No Core 100 pool expansion. No membership/entitlement change.

---

## 3. Files Created

- `src/lib/admin/admin-program-ops.ts`
- `src/lib/admin/admin-program-ops.test.ts`
- `src/components/admin/AdminExercisePicker.tsx`
- `supabase/migrations/20260904120000_admin_program_template_ops.sql`
- `supabase/migrations/20260904121000_admin_client_program_exercise_edit.sql`
- `docs/MAAKFIT_ADMIN_TRAINING_PROGRAM_MANAGEMENT_V1_IMPLEMENTATION_REPORT.md` (this file)

---

## 4. Files Modified

- `src/components/admin/libraries/ProgramLibraryManager.tsx`
- `src/components/admin/ClientTrainingWorkspace.tsx`
- `src/components/admin/AdminLibraryKit.tsx`
- `src/lib/admin/admin-programs-api.ts`
- `src/lib/admin/admin-client-training-api.ts`
- `src/lib/admin/admin-libraries.ts`
- `src/lib/admin/admin-client-training.test.ts`
- `src/integrations/supabase/types.ts`
- `src/styles.css`

---

## 5. Template Architecture

Template = reusable master in `program_templates`.

Client program = `client_program_assignments` snapshot (`PROGRAM_TEMPLATE ≠ CLIENT_ASSIGNED_PROGRAM`).

Location, session minutes, and equipment live in existing `metadata` JSONB (`HOME` / `GYM` / `BOTH`). No new enum.

Status mapping (no new enum):

| Product | Existing columns |
|---------|------------------|
| DRAFT | `is_published = false`, `archived_at IS NULL` |
| ACTIVE | `is_published = true`, `archived_at IS NULL` |
| ARCHIVED | `archived_at IS NOT NULL` |

---

## 6. Template Library

Route: `/admin/programs` (`ProgramLibraryManager`).

Search + filters: Goal, Level, Days (2–5), Location, Status.

Row fields: Name, Goal, Level, Days, Location, Version, Status, Last Updated.

Actions: Open, Preview, Duplicate (`نسخ القالب`), Create New Version, Archive.

Assign is performed from Client 360 (template must be published). Library does not silently assign.

Empty state: no matching templates.

---

## 7. Template Builder

Workflow in one editor: basic info → week structure → sessions → exercises → validation → preview → Save / Activate.

Sticky action bar: unsaved indicator, Preview, Save, Activate (drafts), Create New Version (published).

Published templates: structure save is blocked (`published_template_immutable` if `weeks` sent). Metadata-only save still allowed. Coach must clone a new version to change sessions.

---

## 8. Week Builder

Seven-day visual grid (Sunday-first, existing calendar order).

Each day is Training or Rest. Workout-day count must match `days_per_week` before save/activate.

Changing days/week rebuilds the week while keeping existing workout exercises (`rebuildWeekKeepingWorkouts`).

No 7/7 training default. Caps 2–5 training days.

---

## 9. Session Builder

Session card shows derived name, exercise count, estimated minutes when present.

Name/visual key come from `sessionPresentationForDay` → `summarizeSessionMuscles` (existing). Rest days labeled راحة.

Add / replace / remove / move up / move down. No second presentation engine.

Exact-6 exercise rule is not enforced in the builder.

---

## 10. Exercise Picker

`AdminExercisePicker` — library RPC only (`listAdminExercises`, active). No free-text exercise names.

Search + filters: muscle, equipment, level (difficulty), HOME/GYM heuristic on available list fields.

Result: thumbnail (Core 100 stage thumb), name, primary muscle, equipment, `external_id` as secondary.

---

## 11. Template Versioning

`admin_clone_program_template(p_id, p_mode)`:

- `duplicate` — independent draft, name suffix ` — نسخة`, version 1
- `new_version` — version+1, `version_group_id` in metadata, copies weeks/days/exercises

Editing a published template does not mutate assigned client snapshots. New assignments can use the new version.

`PROGRAM_VERSIONING_COMPLETION_REQUIRED` still disclosed in UI.

---

## 12. Template Validation

`validateProgramDraft` (existing) + week/day-count match.

Activate (`admin_publish_program_template`) blocked in UI if training days ≠ week workout days.

---

## 13. Strategy Matrix Assignment

Unchanged path:

Client profile → `prepareTrainingProgramAssignment` → preview/review → `assignGeneratedV2Program`.

Source selector **Strategy Matrix** starts this workflow; it does not assign on click.

---

## 14. Template Assignment

Source selector **Program Template** → published list → preview + `assessTemplateCompatibility` (`SAFE` / `REVIEW` / `HIGH_IMPACT`) → confirm → `admin_assign_client_program` snapshot.

HIGH_IMPACT requires reason + adaptive-decision record, then assign.

Days/location mismatch is HIGH_IMPACT (no silent assign).

---

## 15. Client Direct Editing

Client 360 → Training → تعديل البرنامج.

Header: client name, source (Matrix or template name), badge `CLIENT-SPECIFIC EDIT`.

Editor title remains `محرر نسخة العميل` (existing contract).

Edits apply to the client snapshot only. Master template is not written.

Add / replace / remove / reorder / sets / reps / rest.

---

## 16. Save Architecture

Path: draft → local impact (`assessClientProgramEditImpact`) → existing prescription validation → `admin_save_client_assignment_exercises` → server write → `updated_at` bump → audit → UI confirmation.

No fake success. Failure shows تعذر حفظ التعديلات + إعادة المحاولة; draft is kept.

HIGH_IMPACT (empty workout, large add/remove) requires confirmation + reason.

Empty workout day cannot save.

Sticky save bar on long edit.

Unsaved navigation: «لديك تعديلات غير محفوظة» + discard / stay (close). Save stays on the sticky bar.

---

## 17. Assignment Versioning

Program source change (Matrix or Template assign, with replace) still creates a new assignment and marks the previous one replaced — this is the existing history model.

Direct exercise/prescription edits update the **active snapshot in place** with audit events (`client_program_exercise_replaced` / `_added` / `_removed` / `client_program_prescription_updated`) and `updated_at` as the version token. A new assignment row is **not** inserted per prescription save, so in-progress workouts keep their assignment id and completed logs stay attached.

---

## 18. Runtime Update

Client runtime already reads the latest active assignment tree. After save, the next refetch/load sees `updated_at` and new exercises. No new realtime channel. No deploy per client.

---

## 19. Active Workout Protection

Assignment **replace** RPCs still raise `active_workout_in_progress` (existing).

In-place prescription save does not swap the assignment id, so a started workout keeps the same snapshot row. Future sessions see the updated tree on refetch.

---

## 20. History Protection

Completed workouts and set logs are not rewritten. Logs remain tied to `assignment_id` / exercise identity. Removing an exercise from the current snapshot does not delete historical set logs.

---

## 21. Matrix Impact

Template assign: `assessTemplateCompatibility` before snapshot.

Client edit: `assessClientProgramEditImpact` (SAFE / REVIEW / HIGH_IMPACT) + before/after replacements.

Structured strategy overrides (frequency, location, etc.) still go through existing Coach Override + `MatrixImpactCard` (SAFE / SAFE_WITH_IMPACT / ALTERNATIVE_RECOMMENDED / BLOCKED). No second override engine.

---

## 22. Safety

Exercise identity must exist in `exercises`. Invalid sets/rest rejected by RPC.

No random replacement if picker has no match — empty picker state: لا توجد تمارين مطابقة.

Core 100 pool not expanded.

---

## 23. Coach Override

Existing `ClientTrainingWorkspace` override card + `reviewCoachOverride` / `applyCoachOverride` unchanged.

HIGH_IMPACT template assign uses confirmation + reason + `admin_record_adaptive_decision`.

---

## 24. Audit

| Event | When |
|-------|------|
| `program_template_duplicated` / `program_template_versioned` | clone RPC |
| existing template save/publish/archive audits | unchanged |
| `client_program_exercise_replaced` / `_added` / `_removed` | client edit RPC |
| `client_program_prescription_updated` | client edit save |
| adaptive decision snapshot | HIGH_IMPACT template assign |

Notes tab remains human context, not audit.

---

## 25. Permissions

Server: `_require_admin()` on all training RPCs.

UI: `/admin/programs` and training ops already require `training.manage` (coach / super_admin). `read_only` cannot operate.

Clients cannot call these RPCs.

---

## 26. Concurrency

Template save and client save both use `p_expected_updated_at`. Stale second save returns `stale_update` → «تم تعديل هذا العنصر من جلسة أخرى. أعد التحميل قبل الحفظ.»

---

## 27. UI/UX

Arabic-first, RTL admin design system (`cc-*`). Cards, badges, sticky bars, source selector. No RPC/table names in coach UX except the existing `PROGRAM_TEMPLATE ≠ CLIENT_ASSIGNED_PROGRAM` contract line and the versioning-completion disclosure.

---

## 28. Responsive

Desktop: full builder + client editor.

Tablet: card/grid week.

Mobile: cards, picker dialog, prescription fields, save bar. Complex 7-day builder uses stacked cards rather than a packed spreadsheet.

---

## 29. Arabic/RTL

Weekdays use `WEEKDAY_LABELS_AR`. Exercise names mixed AR/EN with `dir="ltr"` on English/external id. Filters and save bar inherit admin RTL.

Authenticated browser RTL pass was not run in this session (no admin session in the IDE browser).

---

## 30. Database Impact

No new tables.

Uses `program_templates.metadata` for location/session/equipment/version group.

Client exercise add/remove writes `client_program_exercises` on the existing assignment.

---

## 31. Migrations

Created locally, **not applied**:

1. `supabase/migrations/20260904120000_admin_program_template_ops.sql`  
   - published structure immutability  
   - metadata merge  
   - `admin_clone_program_template`  
   - list returns `training_location`

2. `supabase/migrations/20260904121000_admin_client_program_exercise_edit.sql`  
   - add/remove exercises  
   - optional `reason` on audit payload  

**MIGRATIONS_APPLIED:** NO (local/staging/production)

---

## 32. RPC / Server Contract Impact

| RPC | Change |
|-----|--------|
| `admin_save_program_template` | metadata merge; `weeks` key on published → `published_template_immutable` |
| `admin_clone_program_template` | NEW |
| `admin_list_program_templates` | + `training_location` |
| `admin_save_client_assignment_exercises` | insert without id + `day_id`; `remove_ids`; `reason` |

No direct client-side table writes for these operations.

---

## 33. RLS / Security Impact

No RLS policy rewrite. Functions remain `SECURITY DEFINER` + `_require_admin`. Grants unchanged pattern: authenticated/service_role, revoked from anon/public.

Clients still cannot mutate assignments.

---

## 34. Focused Tests

Passed:

- `src/lib/admin/admin-program-ops.test.ts` — week builder, compatibility SAFE/HIGH_IMPACT, session presentation, edit impact
- `src/lib/admin/admin-client-training.test.ts` — workspace contracts including source selector, CLIENT-SPECIFIC EDIT, save label, orchestrator
- `src/lib/admin/admin-libraries.test.ts` — template ≠ assignment, versioning disclosure, picker copy
- `src/lib/admin/program-assignment-snapshot.test.ts`
- `src/lib/platform/training-assignment-orchestrator/training-assignment-orchestrator.test.ts`
- `src/lib/platform/coach-override/coach-override.test.ts`

---

## 35. Regression Results

Matrix orchestrator and coach-override suites passed.

Full repository test suite and production build were **not** run (policy: focused verification).

---

## 36. Known Issues

1. Local/staging/production databases do not have the new RPCs until migrations are applied. UI clone/add-exercise will fail against current remote DBs.
2. Direct client edits do not create a new `client_program_assignments` row; versioning is `updated_at` + audit.
3. `PROGRAM_VERSIONING_COMPLETION_REQUIRED` still true.
4. Exercise picker HOME/GYM filter is a list-field heuristic, not `location_compatibility` from exercise detail.
5. No authenticated admin browser E2E in this session.
6. Drag-and-drop not added; move up/down is the accessible control.

---

## 37. Deferred Items

- AI program builder / marketplace / bulk assignment
- Real-time client push
- New assignment row per prescription edit
- Applying migrations to Staging/Production
- Merge to `main`

---

## 38. Final Status

**MAAKFIT_ADMIN_TRAINING_PROGRAM_MANAGEMENT_V1_IMPLEMENTATION_COMPLETE** (local code + local migrations + focused tests)

Operational completeness against a live database requires applying the two migrations on the target environment (out of scope for this order).

---

## 39. NEXT HANDOFF

**NEXT_EMPLOYEE:** QA / Local Operator Verification  

**HANDOFF_REASON:** Platform Developer finished local implementation. Next work is operator verification after local migration apply — not strategy redesign and not production deploy.

**FILES_TO_REVIEW:**

- `src/components/admin/libraries/ProgramLibraryManager.tsx`
- `src/components/admin/ClientTrainingWorkspace.tsx`
- `src/components/admin/AdminExercisePicker.tsx`
- `src/lib/admin/admin-program-ops.ts`
- `supabase/migrations/20260904120000_admin_program_template_ops.sql`
- `supabase/migrations/20260904121000_admin_client_program_exercise_edit.sql`

**WHAT_TO_VERIFY:**

1. Create draft template, 7-day week, library exercises, save, activate
2. Duplicate + new version; assigned client snapshot does not change when master is versioned
3. Client 360: Matrix generate/review/assign still works
4. Template assign with SAFE vs HIGH_IMPACT (days/location mismatch)
5. Client-only edit, picker replace, save success/failure, stale second session
6. History list still shows previous assignments; set logs unchanged
7. RTL on week grid, picker, sticky save

**COMPLETION_CRITERIA:** Coach can assign Matrix or Template and edit a client program from Admin without a code change per client, against a database that has the new RPCs.
