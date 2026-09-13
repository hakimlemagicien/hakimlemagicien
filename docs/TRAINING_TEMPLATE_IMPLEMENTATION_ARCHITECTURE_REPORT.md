# MAAKFIT — Training Template Implementation Architecture Report

**Phase:** 1/10 — TRAINING_TEMPLATE_ARCHITECTURE_AND_CURRENT_STATE_AUDIT  
**Date:** 2026-09-12  
**Environment:** LOCAL repository inspection only  
**Production changed:** NO  
**Staging changed:** NO  
**Templates imported:** 0  

> Audit / discovery only. No Phase 2 implementation. No migrations. No deploys.

---

## 1. EXECUTIVE SUMMARY

MAAKFIT already has a **usable Program Template stack** and a **separate Strategy Matrix → Assignment Orchestrator** path. The product decision to ship **36 Program Templates** + **12 Quiz Goal routing** can be implemented as an **extension of existing architecture**, not a parallel Training Engine.

| Verdict | Detail |
|---------|--------|
| **Reuse first** | `program_templates` + Admin builder + snapshot assignment + client runtime are production-capable foundations |
| **Do not duplicate** | Strategy Matrix, Orchestrator, Core 100, Smart Progression, Coach Override must stay single-source |
| **Largest schema gap** | `program_goal` enum is only `cut\|bulk\|fitness\|recomp` — too narrow for 36-template families (Glute Focus, Athletic, Endurance, Mobility, Healthy Aging, Strength, …) |
| **Largest product gap** | No Template Resolver (Quiz Goal → strategy → context → recommended template) |
| **Naming divergence** | Product brief uses labels like `MUSCLE_GAIN` / `GLUTE_FOCUS` / `GENERAL_FITNESS`; code Training V2 uses `MUSCLE_GROWTH` / `GLUTE_GROWTH` / `FITNESS_ENERGY` / etc. Phase 2 needs an explicit bridge — do not silently rename V2 contracts |
| **Phase 2 ready** | YES, with documented gaps — after product/architect approval of this report |

**Principle preserved:**

```
PROGRAM TEMPLATE  ≠  CLIENT TRAINING ASSIGNMENT
PROGRAM SOURCE    ≠  PROGRESSION STRATEGY
```

---

## 2. CURRENT ARCHITECTURE MAP

```
Quiz / Profile answers
        │
        ▼
┌───────────────────────┐     ┌────────────────────────────┐
│ Strategy Matrix       │     │ Program Templates (Admin)  │
│ resolve goal/level/   │     │ program_templates + weeks/ │
│ days/location/equip   │     │ days/exercises + metadata  │
│ → program-generation  │     │ draft → publish → archive  │
└──────────┬────────────┘     └─────────────┬──────────────┘
           │                                │
           ▼                                ▼
┌───────────────────────┐     ┌────────────────────────────┐
│ Assignment            │     │ admin_assign_client_program│
│ Orchestrator          │     │ (template → snapshot)      │
│ prepareTraining…      │     └─────────────┬──────────────┘
│ admin/client_assign_  │                   │
│ generated_v2_program  │◄──────────────────┘
└──────────┬────────────┘
           ▼
┌───────────────────────┐
│ client_program_       │  ← VERSIONED SNAPSHOT (immutable source_template_id + template_version)
│ assignments + weeks/  │
│ days/exercises        │
└──────────┬────────────┘
           ▼
┌───────────────────────┐     ┌────────────────────────────┐
│ client_get_my_        │     │ Progression Strategy       │
│ training_runtime      │     │ (separate column/policy)   │
│ → /app workout UI     │     │ SMART / MATRIX / COACH     │
└───────────────────────┘     └────────────────────────────┘

FREE path (no assignment): free-training-strategy-preview → structure preview only (FREE Membership V1)
```

**Admin dual assign (already live):**

1. **Strategy Matrix** — generate candidate → coach review → `admin_assign_generated_v2_program`
2. **Program Template** — pick published template → compatibility check → `admin_assign_client_program`

---

## 3. CURRENT DATA MODEL

### 3.1 Program Templates

| Object | Role |
|--------|------|
| `program_templates` | Master reusable definition |
| `program_template_weeks` | Week structure |
| `program_template_days` | Day type: `workout\|rest\|active_recovery` |
| `program_template_exercises` | Exercise rows linked to `exercises` |

**First-class columns today:** `slug`, `name_ar/en`, `description_ar`, `goal` (`program_goal`), `level` (`beginner\|intermediate\|advanced`), `duration_weeks`, `days_per_week`, `is_published`, `version`, `archived_at`, `metadata` JSONB.

**Lifecycle:** draft → `admin_publish_program_template` → optional `admin_clone_program_template` (`duplicate` \| `new_version`) → `admin_archive_program_template`. Published week structure is immutable (`published_template_immutable`).

**Metadata keys used today (not exhaustive):** `training_location`, `session_minutes`, `equipment`, `target_gender`, `version_group_id`, `cloned_from`, `clone_mode`, builder extras (`role`, `rir`, `tempo`, `pattern`, `alternatives`, notes, cover).

### 3.2 Client Assignment Snapshot

| Object | Role |
|--------|------|
| `client_program_assignments` | Client-owned assignment row |
| `client_program_weeks/days/exercises` | Frozen copy of structure |

**Immutability:** trigger protects `source_template_id`, `template_version`, `client_id`. Editing master template must not mutate live client trees.

**Progression:** `progression_strategy` lives on the assignment (separate from program source).

### 3.3 Training V2 supporting tables

`workout_sessions`, `workout_set_logs`, `client_training_levels`, `client_exercise_experience`, `training_goal_profiles`, `training_goal_legacy_map`, `client_goal_history`, `client_training_safety_signals`, `adaptive_decision_logs`.

---

## 4. TRAINING FLOW TODAY

1. Client completes Quiz (gender + goal + environment + body metrics…).
2. Paid path: Strategy Matrix builds context → generates Core-100-filtered program → Orchestrator yields reviewable candidate → admin/auto-assisted assign → snapshot → runtime.
3. Template path: Admin selects published template → compatibility vs client context → snapshot assign → runtime.
4. Free path: Strategy preview in-memory; structure only; no playable exercise content (FREE Membership V1).
5. During sessions: Workout Runtime + Continuity + (optional) Smart Progression apply load/reps only when strategy allows.

---

## 5. ADMIN FLOW TODAY

| Surface | Path / component |
|---------|------------------|
| Programs library | `/admin/programs` → `ProgramLibraryManager` + `AdminProgramBuilder` |
| Client training | `ClientTrainingWorkspace` — Matrix vs Template source picker |
| Compatibility | `assessTemplateCompatibility` → SAFE / REVIEW / HIGH_IMPACT |
| Coach override | `coach-override` + `MatrixImpactCard` |
| Progression strategy | Admin API on assignment (`SMART_PROGRESSION_EXERCISE_LOCKED` / `MATRIX_MANAGED` / `COACH_MANAGED`) |

**Missing for 36-template product UX:** auto “Recommended Template”, `target_audience` / `template_purpose` / `admin_summary` as first-class admin fields, rich eligibility/review metadata panels.

---

## 6. CLIENT RUNTIME FLOW TODAY

| Piece | Implementation |
|-------|----------------|
| RPC | `client_get_my_training_runtime` |
| Hook | `useAssignedTrainingRuntime` |
| Adapter | `assigned-program-api.ts` → weekday plans |
| Calendar overlay | `strategy-matrix/calendar-runtime.ts` + `weekly-workout-schedule.ts` |
| Reasons | `ok \| no_program \| scheduled \| ended \| legacy_incomplete` |

Client reads **assignment snapshot**, not live template rows.

---

## 7. GOAL ROUTING TODAY

### 7.1 Quiz IDs (locked product surface)

**Male:** `fat`, `muscle`, `fitness`, `athletic`, `shape`, `gain`  
**Female:** `fat`, `glutes`, `waist`, `body`, `fit`, `tone`

Source: `src/routes/quiz.tsx`.

### 7.2 Training V2 mapping (code today)

| Quiz ID | Canonical Training V2 ID |
|---------|--------------------------|
| fat | `FAT_LOSS` |
| muscle | `MUSCLE_GROWTH` |
| fitness | `FITNESS_ENERGY` |
| athletic | `ATHLETIC_PHYSIQUE` |
| shape | `BODY_RESHAPE` |
| gain | `HEALTHY_WEIGHT_GAIN` |
| glutes | `GLUTE_GROWTH` |
| waist | `SLIM_TONED_WAIST` |
| body | `FEMININE_BALANCED_BODY` |
| fit | `POSTURE_TONED_BACK` |
| tone | `TONED_ARMS_UPPER_BODY` |

Source: `LEGACY_GOAL_MAP` in `src/lib/platform/training-v2-contracts.ts` via `mapLegacyGoalId` / `resolveCanonicalGoal` / `resolveStrategyGoal` (fail-closed).

### 7.3 Product brief primary strategies (reference — not yet a code enum)

Brief uses: `FAT_LOSS`, `MUSCLE_GAIN`, `GENERAL_FITNESS`, `ATHLETIC_PERFORMANCE`, `BODY_RECOMPOSITION`, `GLUTE_FOCUS`, with context switches for `waist`/`tone`.

**Phase 1 finding:** These are **conceptually aligned** but **not identically named** to Training V2. Phase 2 Template Resolver must introduce an explicit **Primary Training Strategy** layer (or mapping table) between Quiz → V2 Goal → Template Family — without breaking Matrix generation that depends on V2 IDs.

### 7.4 Nutrition divergence

Nutrition uses separate `ClientGoalId` via `mapQuizGoalToClientGoalId` (`nutrition-strategy/goal-profile-resolver.ts`). Do not assume shared canonicals with training.

### 7.5 Template goal column mismatch

DB `program_goal` = `cut|bulk|fitness|recomp` only. Admin template filters today are coarse vs 12 quiz goals / 36 templates.

---

## 8. EXERCISE LIBRARY ARCHITECTURE

| Layer | Status | Notes |
|-------|--------|-------|
| Authored catalog | EXISTS | `scripts/exercise-library.json` (~320) |
| V2 metadata | EXISTS | `scripts/exercise-library-v2-metadata.json` + `exercise-library-v2.ts` |
| Runtime DB | EXISTS | `public.exercises` |
| Media | EXISTS | Core 100 packs → `public/exercises/{EXTERNAL_ID}/…` |
| Identity | EXISTS | `external_id` is canonical (e.g. `CH-001`) — **never invent IDs** |

**Policy for later phases:** Core 100 → Full approved library → `EXERCISE_LIBRARY_ADDITION_REQUIRED`. Matrix generation currently **hard-filters to Core 100** (`resolveExercisePoolVersion` always `MAAKFIT_V1_CORE_100`).

---

## 9. TEMPLATE / ASSIGNMENT SEPARATION STATUS

**STATUS: EXISTS — CORRECT**

- Template = master reusable definition.
- Assignment = versioned client snapshot with denormalized exercise rows.
- Template edits do not silently rewrite active clients.
- Dual sources (Matrix-generated vs Template) both land in the same snapshot trees.

**Gap:** Rich builder metadata (role/RIR/tempo/alternatives) may not fully round-trip into snapshot columns — verify copy path before relying on those fields in client UI for template-sourced programs.

---

## 10. VERSIONING STATUS

**STATUS: EXISTS (core) / PARTIAL (product history UX)**

| Capability | Status |
|------------|--------|
| Template `version` + clone `new_version` | EXISTS |
| Assignment stores `template_version` at assign | EXISTS |
| Immutable `source_template_id` / `template_version` | EXISTS |
| Assignment status lifecycle | EXISTS (`scheduled\|active\|completed\|replaced\|cancelled\|archived`) |
| Replace with new assignment | EXISTS |
| Full rollback UI / history browser | PARTIAL — status history present; dedicated rollback product UX not first-class |
| Master change auto-push to clients | Correctly **absent** (desired) |

---

## 11. SMART PROGRESSION STATUS

**STATUS: EXISTS — BOUNDARIES ALIGN WITH PRODUCT**

| Variable | Auto (Smart / Exercise Locked) | Coach |
|----------|--------------------------------|-------|
| Weight / Load | YES | may override |
| Reps | YES | may override |
| Sets | NO | YES |
| Rest | NO | YES |
| Exercise identity / replace | NO (locked) | YES |
| Training days / structure | NO | YES (override / reassign) |

Sources: `progression-strategy/scope.ts`, `apply.ts`, assignment `progression_strategy` column.

**Engine can propose** duration/variation/plateau reviews, but **product apply path** for Smart Exercise Locked is load+reps-centric — preserve this; do not expand Smart Progression to sets/rest/exercise/days/cardio.

---

## 12. COACH CONTROL STATUS

**STATUS: EXISTS**

- Coach Override module: days, preferred weekdays, duration, exercise replace/exclude/lock, location, equipment, frequency, temporary constraints.
- Admin Matrix path defaults to ASSISTED → `COACH_REVIEW_REQUIRED`.
- Durable override ledger / idempotency flagged as incomplete in module comments (`COACH_OVERRIDE_DURABLE_IDEMPOTENCY`) — **PARTIAL** for long-term audit trail.

Extra coach-controlled variables called out in the product brief (power progression, mobility progression, carry distance, band resistance, ROM, movement complexity) are **not first-class assignment fields today** — store later in template/assignment metadata or structured coach notes (Phase 2+ design).

---

## 13. HOME CONTEXT STATUS

| Concept | Status |
|---------|--------|
| Quiz `trainingEnvironment` (home/gym/anywhere) | EXISTS |
| Strategy location resolve HOME/GYM/BOTH | EXISTS |
| `availableEquipment` on strategy input | PARTIAL — field exists; **not collected in quiz** |
| HOME_EQUIPMENT_PROFILE | MISSING |
| HOME_TRAINING_SPACE_PROFILE | MISSING |
| TRAINING_ENVIRONMENT_CAPABILITY | MISSING as product type |
| AVAILABLE_LOAD / LOAD_INCREMENT_GRANULARITY | MISSING as client profile |
| SAFE_BAND_ANCHOR / ELEVATED_SURFACE_SAFETY / SPACE_LIMIT | MISSING |

Days default often **5** without re-ask; duration fallback **50** min. Client setup only re-asks unmapped goal.

---

## 14. MEDIA VARIANT STATUS

| Policy | Status |
|--------|--------|
| One canonical Exercise Library | EXISTS (correct — do not fork female library) |
| PREFERRED_DEMONSTRATOR = FEMALE | MISSING |
| PREFERRED_MEDIA_VARIANT = FEMALE | MISSING |
| Fallback FEMALE → STANDARD → MEDIA_MISSING | MISSING |
| Marketing / hero gender assets | EXISTS (separate from exercise library) |
| Template `target_gender` metadata | PARTIAL |

---

## 15. REUSABLE COMPONENTS

| Component | Reuse in Templates V1 |
|-----------|------------------------|
| `program_templates` schema + publish/clone/archive RPCs | **Primary storage** — extend, don’t replace |
| `AdminProgramBuilder` / `ProgramLibraryManager` | Admin authoring UX |
| `admin_assign_client_program` + snapshot trees | Client delivery |
| `assessTemplateCompatibility` | Seed for resolver + admin “why this template” |
| Strategy Matrix resolvers (level, days, location, equipment) | Inputs to future Template Resolver |
| `LEGACY_GOAL_MAP` / `resolveStrategyGoal` | Quiz → training identity (bridge to primary strategy) |
| Progression strategy column + scope | Keep separate from template selection |
| Coach Override + MatrixImpactCard | Coach Custom / override UX |
| Core 100 + eligibility/safety | Library readiness + validation |
| `client_get_my_training_runtime` | Unchanged client delivery |
| Orchestrator fingerprint / stale_update | Keep for assign safety |
| Review signal enums (assignment / generation / goal intelligence) | Extend — don’t invent parallel system |

---

## 16. GAPS

### Critical for 36-template system

1. **`program_goal` enum too narrow** for template families (Glute, Athletic, Endurance, Mobility, Healthy Aging, Strength, …).
2. **No Template Resolver** (Quiz → Primary Strategy → Context → Level → Environment → Days → Equipment → Template).
3. **No first-class** `target_audience`, `template_purpose`, `admin_summary`, eligibility, transition policy, library readiness, cardio/power policy fields.
4. **Product Primary Strategy labels ≠ Training V2 canonical IDs** — needs explicit bridge.
5. **No auto recommended-template** ranking in Admin.

### Important (can Phase after storage)

6. HOME equipment/space/capability profiles incomplete.
7. Female preferred demonstrator / media variant not modeled.
8. Warm-up role exists in metadata; **cardio/power blocks** not first-class prescription models.
9. Snapshot round-trip of builder metadata extras needs verification.
10. Coach override durable history PARTIAL.

### Non-goals / already OK

- Do not create a second Training Engine.
- Do not create a second Exercise Library.
- Do not merge Program Source with Progression Strategy.

---

## 17. RISKS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Hardcoding 36 templates into UI | Unmaintainable | Resolver + DB metadata |
| Expanding Smart Progression beyond load/reps | Product contract break | Keep `scope.ts` boundaries |
| Renaming Training V2 goals to match brief casually | Breaks Matrix/tests | Add mapping layer |
| Template goal enum expand without migration plan | Blocks publish filters | Phase 2 schema design |
| Mixing Matrix-generated programs with Template catalog without provenance | Ops confusion | Keep `source_template_id` / generation provenance clear |
| Importing exercises outside approved library | Identity corruption | Core 100 → approved library gate |
| Assuming quiz collects equipment | Wrong HOME templates | Collect or fail to REVIEW |
| Female media fork as second library | Policy violation | Variant on same `external_id` |

---

## 18. MINIMAL-DIFF IMPLEMENTATION RECOMMENDATION

**Do not build a parallel system.** Sequence:

1. **Phase 2 — Schema & contract extension** on existing `program_templates.metadata` (and/or carefully extended columns/enums): family, primary strategy, audience, purpose, admin_summary, environment, days variant, equipment eligibility, progression/coach control declarations, review signals, library readiness, version labels.
2. **Phase 2/3 — Goal→Primary Strategy→Template Family bridge** as pure TS module (reuse Matrix inputs; do not replace Matrix).
3. **Phase 3 — Template Resolver** consuming Strategy Input + published templates (compatibility already started in `assessTemplateCompatibility`).
4. **Phase 4 — Admin UX** on existing Program Library + ClientTrainingWorkspace (recommended template, audience/purpose panels).
5. **Phase 5+ — Content import of 36 templates** via Admin/RPCs only after schema ready; Core 100 first.
6. Keep assignment snapshot + progression strategy untouched in meaning.
7. HOME/media/cardio/power deepen in later phases without blocking template storage.

---

## 19. PHASE 2 READINESS

**PHASE_2_READY: YES**

Phase 2 should be a **design + schema/contract** phase, not template content import:

- Extend template metadata/contract for 36-family dimensions
- Define Primary Training Strategy bridge vs Training V2 IDs
- Define Template Resolver interface (no hardcoding)
- Document required Admin fields
- Still: **0 template content imports** until contract approved

---

## 20. BLOCKERS

| Blocker | Severity | Notes |
|---------|----------|-------|
| Product approval of Primary Strategy naming bridge vs existing V2 IDs | HIGH | Must decide: alias layer vs new enum |
| Decision: extend `program_goal` enum vs metadata `template_family` | HIGH | Affects filters/RPCs |
| Official 36-template content pack not in repo yet | MEDIUM | Architecture ready; content is later phase |
| None blocking **architecture audit completion** | — | This phase is complete |

No production/staging blockers for Phase 1 (local audit only).

---

## 21. NEXT HANDOFF

**To:** Platform Architect / Project Manager  

**Ask for approval of:**

1. This Phase 1 audit (reuse existing template + snapshot architecture).
2. Primary Strategy bridge approach (product labels ↔ Training V2 IDs).
3. Schema strategy: metadata-first vs enum expansion for 36 families.
4. Authorization to start **Phase 2 only** (contracts/schema design — still no 36 imports).

**STOP — do not start Phase 2 until approved.**

---

## APPENDIX A — AUDIT MATRIX (24 areas)

| # | Area | Status | Current implementation | Key files / DB | Gaps | Recommended action | Target phase |
|---|------|--------|------------------------|----------------|------|--------------------|--------------|
| 1 | Strategy Matrix | EXISTS | Goal/level/days/location/equipment → generation | `src/lib/platform/strategy-matrix/` | Not a template picker | Keep; feed Resolver inputs | 2–3 |
| 2 | Training Engine | EXISTS | Prescription, progression, volume, continuity, workout-runtime | `prescription/`, `progression/`, `volume/`, `continuity/`, `workout-runtime/` | Do not replace | Reuse as-is | — |
| 3 | Template storage | EXISTS | Tables + draft/publish/archive/clone | `program_templates*`, `20260710170100_*`, `20260904120000_*` | Narrow `program_goal`; missing audience/purpose | Extend metadata/enum | 2 |
| 4 | Assignment Orchestrator | EXISTS | `prepareTrainingProgramAssignment` | `training-assignment-orchestrator/` | Matrix-oriented | Keep parallel to Template assign | — |
| 5 | Client Assignment | EXISTS | Snapshot trees + RPCs | `client_program_*`, `admin_assign_client_program` | Metadata round-trip check | Verify copy path | 2–3 |
| 6 | Assignment versioning/history | EXISTS / PARTIAL | version freeze + statuses | snapshot migration | Rollback UX | Keep freeze; enhance UX later | 4+ |
| 7 | Weekly Calendar | EXISTS | Calendar resolver + weekday plans | `calendar-resolver.ts`, `weekly-workout-schedule.ts` | Provenance edge cases | Reuse | — |
| 8 | Client Runtime | EXISTS | `client_get_my_training_runtime` | `assigned-program-api.ts`, hooks, workout routes | Free vs paid paths distinct | No change for templates | — |
| 9 | Admin Training Workspace | EXISTS | Matrix + Template assign | `ClientTrainingWorkspace.tsx` | No recommended template | Extend UI | 4 |
| 10 | Goal routing | EXISTS / PARTIAL | Quiz → V2 map fail-closed | `quiz.tsx`, `training-v2-contracts.ts`, `resolve-goal.ts` | Brief strategy labels diverge; no template family map | Bridge module | 2 |
| 11 | Exercise Library | EXISTS | JSON + V2 + DB | `scripts/exercise-library*.json`, `exercise-library-v2.ts` | — | No invent IDs | 5+ content |
| 12 | Core 100 | EXISTS | Hard generation filter | `core-100-external-ids.ts`, `core-100.ts` | Full catalog unused in Matrix gen | Prefer Core 100 for templates first | 5 |
| 13 | Warm-Up model | PARTIAL | Warmup sets + role metadata | `prescription/sets.ts`, builder roles | Not full GENERAL/TARGETED/RAMP taxonomy | Model in template contract | 2–6 |
| 14 | Cardio model | PARTIAL | `exercise_type=cardio` only | library typing | No post-workout / interval block model | Contract later | 6+ |
| 15 | Power model | MISSING | — | — | No power skill block | Later phase | 6+ |
| 16 | Smart Progression | EXISTS | Load+reps AUTO; sets/rest/ex COACH | `progression-strategy/` | Do not expand | Preserve boundaries | — |
| 17 | Coach Controls | EXISTS / PARTIAL | Override + strategy | `coach-override/`, admin APIs | Extra variables not typed | Metadata + durable history | 2–4 |
| 18 | Review Signals | EXISTS | Multiple enums | orchestrator, program-generation, goal-intelligence | Not all product signal names | Map/extend; keep ≠ auto-change | 2–3 |
| 19 | HOME equipment context | PARTIAL | Env exists; equipment field empty from quiz | `resolve-location/equipment.ts` | Profiles missing | Collect or REVIEW | 2–7 |
| 20 | HOME space/capability | MISSING | — | — | All space/load/band fields | Later | 7 |
| 21 | Female media variants | MISSING | Single media pack | Core 100 media | Prefer demonstrator | Variant on same ID | 8 |
| 22 | Template preview | EXISTS | Admin builder + weekly preview + client structure | AdminProgramBuilder, WeeklySchedulePreview | Audience/purpose panels | Extend | 4 |
| 23 | Tests | EXISTS | Broad suite | See Appendix B | Resolver tests TBD | Add with Phase 2–3 | 2+ |
| 24 | Validation/Safety | EXISTS | validate program, Core 100, eligibility, compatibility | `program-generation/validate.ts`, `exercise-safety-rules.ts`, `admin-program-ops.ts` | Template-family rules TBD | Extend gates | 2–3 |

---

## APPENDIX B — KEY TESTS INSPECTED (not executed as gate)

- `strategy-matrix/strategy-matrix.test.ts`, `calendar-resolver.test.ts`, `quiz-strategy-bridge.test.ts`, `core-100-*.test.ts`
- `training-assignment-orchestrator/training-assignment-orchestrator.test.ts`
- `program-generation/program-generation.test.ts`, `client-loop/client-loop.test.ts`
- `progression-strategy/progression-strategy.test.ts`, `progression/progression-engine.test.ts`
- `coach-override/coach-override.test.ts`
- `admin-program-ops.test.ts`, `admin-program-builder.test.ts`, `program-assignment-snapshot.test.ts`, `admin-client-training.test.ts`
- `client-program-runtime.test.ts`, `free-training-strategy-preview.test.ts`
- SQL plans: `supabase/tests/client_program_assignment_rls_test_plan.sql`, `training_engine_v2_rls_test_plan.sql`

**TEST_RESULT (this phase):** INSPECTED ONLY — no required suite run for audit gate.  
**BUILD_RESULT (this phase):** NOT REQUIRED — docs-only deliverable.

---

## APPENDIX C — COMPLETION CRITERIA CHECKLIST

| Criterion | Status |
|-----------|--------|
| ARCHITECTURE_TRACED | YES |
| EXISTING_TEMPLATE_SYSTEM_IDENTIFIED | YES |
| STRATEGY_MATRIX_IDENTIFIED | YES |
| ASSIGNMENT_ORCHESTRATOR_IDENTIFIED | YES |
| CLIENT_RUNTIME_IDENTIFIED | YES |
| ADMIN_TRAINING_UI_IDENTIFIED | YES |
| EXERCISE_LIBRARY_IDENTIFIED | YES |
| CORE_100_INTEGRATION_IDENTIFIED | YES |
| GOAL_ROUTING_IDENTIFIED | YES |
| SMART_PROGRESSION_BOUNDARIES_IDENTIFIED | YES |
| COACH_CONTROL_BOUNDARIES_IDENTIFIED | YES |
| ASSIGNMENT_VERSIONING_STATUS_IDENTIFIED | YES |
| HOME_CONTEXT_STATUS_IDENTIFIED | YES |
| MEDIA_VARIANT_STATUS_IDENTIFIED | YES |
| REUSE_PLAN_DEFINED | YES |
| GAPS_DOCUMENTED | YES |
| RISKS_DOCUMENTED | YES |
| PHASE_2_RECOMMENDATION_DEFINED | YES |
| PRODUCTION_CHANGED | NO |
| STAGING_CHANGED | NO |
| TEMPLATES_IMPORTED | 0 |

---

## FINAL EXECUTION SUMMARY

```
PHASE:
1/10

PHASE_NAME:
TRAINING_TEMPLATE_ARCHITECTURE_AND_CURRENT_STATE_AUDIT

PHASE_STATUS:
PASS_WITH_GAPS

EXECUTION_ENVIRONMENT:
LOCAL

FILES_CREATED:
docs/TRAINING_TEMPLATE_IMPLEMENTATION_ARCHITECTURE_REPORT.md

FILES_CHANGED:
(none — report only)

MIGRATIONS_CREATED:
0

MIGRATIONS_APPLIED:
0

CURRENT_ARCHITECTURE_REUSED:
Strategy Matrix; Training Engine V2 modules; Assignment Orchestrator; program_templates + Admin builder; client snapshot assignment; client_get_my_training_runtime; Coach Override; Progression Strategy (separate); Core 100; Goal LEGACY_GOAL_MAP; Template compatibility

DUPLICATE_SYSTEMS_FOUND:
NONE required — dual assign paths (Matrix vs Template) are intentional sources into one snapshot model. Nutrition goal map is parallel (do not merge casually).

TEMPLATE_SYSTEM_STATUS:
EXISTS — draft/publish/archive/clone + snapshot assign; schema goal enum too narrow for 36 families

GOAL_ROUTING_STATUS:
EXISTS for Quiz→Training V2; PARTIAL for Product Primary Strategy / Template Family bridge

ASSIGNMENT_VERSIONING_STATUS:
EXISTS (template_version freeze + status lifecycle); PARTIAL (rollback UX)

ADMIN_STATUS:
EXISTS (Program Library + ClientTrainingWorkspace dual assign); MISSING recommended-template + audience/purpose panels

CLIENT_RUNTIME_STATUS:
EXISTS — reads assignment snapshot

EXERCISE_LIBRARY_STATUS:
EXISTS — single library; external_id identity

CORE_100_STATUS:
EXISTS — preferred + hard filter for Matrix generation

SMART_PROGRESSION_STATUS:
EXISTS — AUTO load+reps; COACH sets/rest/exercises

COACH_CONTROL_STATUS:
EXISTS — override + review; PARTIAL durable history / typed extra variables

HOME_CONTEXT_STATUS:
PARTIAL — environment exists; equipment/space/load profiles missing

MEDIA_VARIANT_STATUS:
MISSING preferred demonstrator/variant; single pack per exercise (policy-compatible base)

TESTS_INSPECTED:
YES (platform + admin + SQL plans listed)

TEST_RESULT:
NOT_RUN_AS_GATE (audit phase)

BUILD_RESULT:
NOT_REQUIRED

GAPS:
program_goal too narrow; no Template Resolver; missing audience/purpose/admin_summary; Primary Strategy naming ≠ V2 IDs; HOME/media/cardio/power depth; metadata snapshot round-trip verification

RISKS:
hardcoding 36 templates; expanding Smart Progression; casual V2 goal renames; female library fork; empty equipment → wrong HOME match

BLOCKERS:
None for Phase 1 completion. Phase 2 blocked only on architect/PM approval of strategy-bridge + schema approach.

COMPLETION_CRITERIA_STATUS:
ALL_MET

PHASE_2_READY:
YES

NEXT_HANDOFF:
Platform Architect / Project Manager — approve Phase 1 report and Primary Strategy/schema approach before any Phase 2 work. STOP.
```

**EXPECTED FINAL STATE ACHIEVED:**

`PHASE_1_ARCHITECTURE_AUDIT_COMPLETE`  
+ `ZERO_PRODUCTION_CHANGES`  
+ `ZERO_TEMPLATE_IMPORTS`  
+ `PHASE_2_IMPLEMENTATION_PATH_DEFINED`
