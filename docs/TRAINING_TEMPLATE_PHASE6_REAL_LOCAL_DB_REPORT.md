# TRAINING TEMPLATE SYSTEM V1 — PHASE 6 REPORT

## PHASE
6/10

## PHASE_NAME
REAL_LOCAL_DB_CLIENT_PREVIEW_AND_MANUAL_ASSIGNMENT_WORKFLOW

## PHASE_STATUS
PASS_WITH_GAPS

## EXECUTION_ENVIRONMENT
LOCAL only (Vite `--mode phase6` + local Supabase Docker). Staging/Production untouched.

## LOCAL_SUPABASE_STATUS
YES — Docker local API `127.0.0.1:54321`, DB `127.0.0.1:54322`

---

### FILES_CREATED
- `src/lib/platform/training-templates/pilot-4/import-db.ts`
- `src/lib/platform/training-templates/pilot-4/phase6-db.test.ts`
- `scripts/import-pilot-4-to-local-db.mts`
- `src/routes/dev/template-phase6-local-db.tsx`
- `supabase/migrations/20260912190000_phase6_activity_role_snapshot_and_progression.sql`
- `supabase/migrations/20260912191000_phase6_grant_has_role_execute.sql`
- `docs/phase6-visual-evidence/*`
- `docs/TRAINING_TEMPLATE_PHASE6_REAL_LOCAL_DB_REPORT.md`

### FILES_CHANGED
- `src/lib/admin/admin-template-ui.ts` — DB catalog default; pilots opt-in only
- `src/components/admin/ClientTrainingWorkspace.tsx` — real DB catalog; fixtures off for pilots
- `src/components/admin/programs/TemplateRecommendationPanel.tsx` — coach context for level/days; HOME equipment defaults; no auto-assign
- `src/lib/platform/training-templates/pilot-4/definitions.ts` — Athletic equipment/review fix for resolver
- `src/components/admin/libraries/ProgramLibraryManager.tsx` — prefer DB contract rows; `activity_role` in save path
- `docs/README.md` — index entry for Phase 6

### MIGRATIONS_CREATED
1. `20260912190000_phase6_activity_role_snapshot_and_progression.sql`
2. `20260912191000_phase6_grant_has_role_execute.sql`  
(+ Phase 5 `20260912180000_admin_list_program_templates_contract_metadata.sql` applied locally in this phase)

### MIGRATIONS_APPLIED_LOCAL
YES — `20260912180000`, `20260912190000`, `20260912191000`

### MIGRATIONS_APPLIED_STAGING
NO

### MIGRATIONS_APPLIED_PRODUCTION
NO

---

### PILOT_DB_IMPORT_RESULT
4/4 published in `program_templates`  
IDs: Fat `1625d224-…`, Muscle `71d8a4fc-…`, Strength `83126726-…`, Athletic `c63ac2f6-…`

### EXERCISE_UUID_RESOLUTION
PASS — resolved via `exercises.external_id` after local `sync-exercises` (321 rows)

### BROKEN_EXERCISE_REFERENCES
0

### IDEMPOTENT_IMPORT_RESULT
PASS — second run `created_count=0`, `duplicates=0`, same UUIDs

### TEMPLATE_CONTRACT_DB_RESULT
4/4 VALID (`metadata.template_contract`; library readiness READY; not LEGACY)

### LIST_RPC_RESULT
PASS — `admin_list_program_templates` returns `template_contract` / strategy / readiness

### ADMIN_LIBRARY_RESULT
PASS — `/admin/programs` shows Pilot 4 from real DB

### ADMIN_DETAIL_RESULT
PASS_WITH_GAP — detail via Admin get RPC + evidence route + assignment preview works; **ProgramLibraryManager “عرض القالب” editor can crash** (error boundary) on open — preview/recommendation path unaffected

### REAL_RESOLVER_RESULT
4/4 PASS (`phase6-db.test.ts`)

### FIXTURE_DEPENDENCY_RESULT
NO fixtures required for Pilot recommendation (`includeInMemoryPilots=false`, `catalogIncludesFixtures=false`)

### CLIENT_RECOMMENDATION_RESULT
PASS — e.g. muscle/HOME/3D → `MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D` (MATCHED_WITH_REVIEW: home load signals)

### PREVIEW_RESULT
PASS — real DB template; read-only

### PREVIEW_READ_ONLY_RESULT
PASS — preview creates no assignment/session

### MANUAL_ASSIGNMENT_RESULT
PASS — `admin_assign_client_program` only on explicit coach confirm

### AUTO_ASSIGNMENT_PERFORMED
NO

### SNAPSHOT_RESULT
PASS — `client_program_assignments` + weeks/days/exercises

### SOURCE_TEMPLATE_VERSION_RESULT
PASS — `source_template_id` + `template_version` correct; `progression_strategy=SMART_PROGRESSION_EXERCISE_LOCKED` separate

### SNAPSHOT_IMMUTABILITY_RESULT
PASS — master edit does not mutate active client snapshot

### CLIENT_RUNTIME_RPC_RESULT
PASS — `client_get_my_training_runtime` reason=`ok` with `activity_role`

### FAT_LOSS_RUNTIME_RESULT
PASS — treadmill start/finish + warmups + 6 mains (client UI shows `10 min`)

### MUSCLE_HOME_RUNTIME_RESULT
PASS — structural snapshot + assign path

### STRENGTH_RUNTIME_RESULT
PASS — ramp-up roles survive snapshot/RPC

### ATHLETIC_RUNTIME_RESULT
PASS — power block roles survive snapshot/RPC

### SMART_PROGRESSION_RESULT
PASS — SMART boundaries unchanged (AUTO weight/reps; coach-only sets/rest/exercise/days/cardio)

### COACH_OVERRIDE_RESULT
PASS — existing override UI remains; recommendation vs coach selection still distinct

### RLS_AUTH_RESULT
PASS — Admin RPCs via authenticated staff; client runtime as owner; import via script/DB only  
Local fix: grant `EXECUTE` on `has_role` so `user_roles` RLS policies do not 403 Admin portal checks

---

### SCREENSHOTS_CREATED
`docs/phase6-visual-evidence/` (see README there)

### TESTS_RUN
- `src/lib/platform/training-templates/pilot-4/phase6-db.test.ts`
- `src/lib/admin/admin-template-ui.test.ts`
- Idempotent re-import script

### TEST_RESULT
PASS

### BUILD_RESULT
Focused module tests PASS. Full `tsc` / unrelated `supabase/types.ts` issues remain pre-existing if present — not expanded in Phase 6.

### TEMPLATES_IMPORTED_TOTAL
4

### TEMPLATE_5_PLUS_IMPORTED
0

### STAGING_CHANGED
NO

### PRODUCTION_CHANGED
NO

---

### KNOWN_GAPS
1. **Admin library editor crash** when opening some Pilot rows via “عرض القالب” (error boundary). Detail still available via Admin get RPC, Phase 6 evidence route, and recommendation Preview.
2. **Client workout UI** surfaces duration correctly (`10 min`) but may label cardio/power with generic activity chips rather than dedicated role copy — structural RPC data is correct.
3. Recommendation uses **coach context defaults** (level/days + HOME equipment) when profile has no assignment snapshot fields — required for exact Pilot routes in Admin UI.

### RISKS
- `has_role` EXECUTE grant must ship with migrations before remote apply (local-only for now).
- Local Vite must use `--mode phase6` / local keys; default `.env.local` still points at Production ref — do not confuse environments.

### BLOCKERS
None for Phase 6 STOP (local DB path proven).

### COMPLETION_CRITERIA_STATUS
Met for real local DB import, resolver, preview, manual assign, snapshot, runtime RPC, tests, and visual evidence — with gaps above.

### PHASE_7_READY
YES (history/version UX next) — do not start until PM/architect handoff.

### NEXT_HANDOFF
Platform Architect / Project Manager per HAKIM routing protocol.

---

## EXPECTED FINAL STATE
`PHASE_6_REAL_LOCAL_DB_FLOW_COMPLETE` + Pilot 4 persisted + real resolver catalog + read-only preview + manual assignment + real snapshot + client runtime RPC + zero auto-assignment + zero remote changes
