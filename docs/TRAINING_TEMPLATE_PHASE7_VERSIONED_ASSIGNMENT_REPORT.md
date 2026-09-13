# TRAINING TEMPLATE SYSTEM V1 — PHASE 7 REPORT

## PHASE
7/10

## PHASE_NAME
VERSIONED_CLIENT_ASSIGNMENT_SNAPSHOT_AND_HISTORY

## PHASE_STATUS
PASS_WITH_GAPS

## EXECUTION_ENVIRONMENT
LOCAL (Supabase Docker + Vite `--mode phase6`)

---

### FILES_CREATED
- `supabase/migrations/20260913120000_phase7_assignment_history_list_provenance.sql`
- `src/lib/admin/admin-assignment-history.ts`
- `src/lib/admin/admin-assignment-history.test.ts`
- `src/lib/platform/training-templates/pilot-4/phase7-db.test.ts`
- `docs/phase7-visual-evidence/*`
- `docs/TRAINING_TEMPLATE_PHASE7_VERSIONED_ASSIGNMENT_REPORT.md`
- `.tmp/phase7-snapshot-evidence.txt` / `.tmp/phase7-db-test.log`

### FILES_CHANGED
- `src/lib/admin/admin-client-training-api.ts` — history list maps `generation_source` + `progression_strategy`
- `src/components/admin/ClientTrainingWorkspace.tsx` — current/history UI, replace confirmation copy, version labels
- `src/styles.css` — history list / current-assignment styling
- `docs/README.md` — Phase 7 index entries

### MIGRATIONS_CREATED
1 — `20260913120000_phase7_assignment_history_list_provenance.sql`  
**Why:** `admin_list_client_assignments` lacked `generation_source` / `progression_strategy` for Admin history without N+1 detail fetches. Prefer extending existing RPC over a second history system.

### MIGRATIONS_APPLIED_LOCAL
YES

### MIGRATIONS_APPLIED_STAGING
NO

### MIGRATIONS_APPLIED_PRODUCTION
NO

---

### TEMPLATE_V1_TEST
PASS — Muscle Gain HOME v1 assigned to Client A; `template_version=1` frozen

### TEMPLATE_V2_TEST
PASS — `admin_clone_program_template(..., 'new_version')` → published v2 with distinct slug + `version=2`

### VERSION_LINEAGE_RESULT
PASS — `version_group_id`, `cloned_from`, `clone_mode=new_version`

### V1_SNAPSHOT_RESULT
PASS — weeks/days/exercises frozen; count unchanged after v2 create

### V2_SNAPSHOT_RESULT
PASS — Client B / reassigned Client A hold `template_version=2`

### V1_V2_COEXIST_RESULT
PASS

### MASTER_CHANGE_RESULT
MASTER_V2_MUTATES_V1_CLIENT: **NO**; further master edit does not mutate active snapshots

### REASSIGNMENT_RESULT
PASS — explicit `admin_assign_client_program(..., replace=true)` creates new snapshot

### OLD_ASSIGNMENT_HISTORY_RESULT
PASS — previous row `status=replaced`, `ended_at` set, exercises preserved

### NEW_ASSIGNMENT_CURRENT_RESULT
PASS — `status=active`

### CURRENT_ASSIGNMENT_RESOLUTION
PASS — runtime prefers active over historical

### CLIENT_RUNTIME_RESULT
PASS — `client_get_my_training_runtime` returns new assignment (`template_version=2`)

### PROGRESSION_STRATEGY_RESULT
PASS — `SMART_PROGRESSION_EXERCISE_LOCKED` remains assignment-scoped / separate from template version

### PROGRAM_SOURCE_RESULT
YES — `generation_source=template` → Program Template in history UI

### COACH_OVERRIDE_HISTORY_RESULT
GAP — override *reason* is not a dedicated historical column on `client_program_assignments`; reassignment does not invent override history. System recommendation remains separate from current assignment in UI. Audit events may exist for high-impact assigns.

### SCHEDULED_ASSIGNMENT_RESULT
DOCUMENTED — existing RPC: if new assignment is scheduled and another scheduled exists, replace cancels the prior scheduled row; active runtime prefers `active` over `scheduled` (`ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END`). No redesign.

### ACTIVE_SESSION_REPLACEMENT_RESULT
GAP — Phase 7 did not redesign workout-session freeze. Existing assignment snapshot remains immutable; in-progress local workout UI may still hold a started session prescription independently. No silent rewrite of historical assignment rows observed.

### ADMIN_HISTORY_UI_RESULT
PASS — filters + current highlight + version/source/progression/dates

### CURRENT_ASSIGNMENT_UI_RESULT
PASS — source, version (`vN`), assigned_at, status

### VERSION_LABEL_RESULT
YES — `v1` / `v2` in history and confirmation copy

### REPLACE_CONFIRMATION_RESULT
PASS — Arabic copy states new snapshot + prior remains replaced; preview alone does not replace

### RLS_AUTH_RESULT
PASS — list/assign/runtime via existing admin/client ownership paths; no browser service-role

---

### SCREENSHOTS_CREATED
`docs/phase7-visual-evidence/`

### TESTS_RUN
- `src/lib/admin/admin-assignment-history.test.ts`
- `src/lib/platform/training-templates/pilot-4/phase7-db.test.ts`
- `src/lib/admin/admin-client-training.test.ts`
- `src/lib/admin/admin-template-ui.test.ts`

### TEST_RESULT
PASS

### BUILD_RESULT
Focused tests PASS (no full `tsc` expansion)

### TEMPLATES_IMPORTED_TOTAL
4 (Pilot base) + local version clones only (not catalog templates 5–36)

### TEMPLATE_5_PLUS_IMPORTED
0

### STAGING_CHANGED
NO

### PRODUCTION_CHANGED
NO

---

### KNOWN_GAPS
1. Coach override **reason** not fully persisted as assignment history fields (report only; no fabrication).
2. Active in-progress workout session safety not newly hardened (snapshot rows stay immutable).
3. Phase 6 gaps preserved: Admin «عرض القالب» editor crash risk; generic cardio/power chips; recommendation defaults when level/days missing — not worsened by Phase 7.
4. Rollback = explicit reassignment of an older assignable template/version as a **new** snapshot (not magical DB rollback).

### RISKS
- Local-only migration must be applied on Staging later via normal migration process before relying on history provenance columns remotely.
- Multiple local test reassignments produce several `replaced` rows — expected for test clients.

### BLOCKERS
None for Phase 7 STOP.

### COMPLETION_CRITERIA_STATUS
Met for version freeze, coexist, explicit reassignment, history UI, runtime current resolution, no auto-upgrade, zero remote changes — with gaps above.

### PHASE_8_READY
YES

### NEXT_HANDOFF
Platform Architect / Project Manager per HAKIM routing protocol.

---

## Product rules confirmed

- PROGRAM TEMPLATE ≠ CLIENT ASSIGNMENT  
- MASTER TEMPLATE CHANGE ≠ CLIENT PROGRAM CHANGE  
- NEW TEMPLATE VERSION ≠ AUTOMATIC CLIENT UPGRADE  
- RECOMMENDATION ≠ ASSIGNMENT  
- REASSIGNMENT ≠ MUTATING OLD SNAPSHOT  

## EXPECTED FINAL STATE
`PHASE_7_VERSIONED_ASSIGNMENT_COMPLETE` + master changes do not mutate clients + v1/v2 snapshots coexist + explicit reassignment + history visible + runtime current correct + zero auto-upgrade + zero remote changes
