# Training Engine V2 — Production-like migration dry-run + rollback

**CEO:** `PRODUCTION_RELEASE_NOT_APPROVED`  
**Date:** 2026-08-22  
**Pinned SHA:** `4d80f8d366909a2a6cf9217803c9c62277b66954`  
**This document does not authorize applying anything to Production `ufgrbpakuemamggwypdh`.**

Staging (`dxerwrdpcflpnjvsnrjq`) already has its own gate. Do not re-apply that chain to Production as a shortcut.

---

## 1. Purpose

Prepare PF-2 (dry-run on a **copy** of Production) and PF-3 (rollback / forward-recovery) so Production apply can happen later under a separate CEO order.

| Action | Allowed |
|--------|---------|
| Document the `4d80f8d` migration chain | Yes |
| Dry-run on a disposable clone / branch of Production | Yes, when the clone exists |
| Apply to Staging `dxerwrdpcflpnjvsnrjq` | Already gated — do not redo blindly |
| Apply to Production `ufgrbpakuemamggwypdh` | **No** |
| Drop Production tables to “roll back” | **No** without CEO + backup restore plan executed |

---

## 2. Source of truth chain (`4d80f8d` only)

Do **not** include uncommitted `20260820250000_client_nutrition_assignments.sql` (not in the approved SHA).

Prerequisite Command Center + legal (needed because `workout_sessions.assignment_id` references `client_program_assignments`):

| Order | File |
|------:|------|
| 1 | `20260820120000_legal_billing_privacy_v1.sql` |
| 2 | `20260820210000_admin_command_center_data_contracts.sql` |
| 3 | `20260820220000_admin_ops_read_extensions.sql` |
| 4 | `20260820230000_admin_library_management.sql` |
| 5 | `20260820240000_client_program_assignment_snapshots.sql` |

Training Engine V2 (`V2_MIGRATIONS` in `src/lib/platform/training-v2-release/audits.ts`):

| Order | File |
|------:|------|
| 6 | `20260821120000_training_engine_v2_data_contracts.sql` |
| 7 | `20260821140000_exercise_library_v2_compatibility.sql` |
| 8 | `20260821140100_exercise_library_v2_metadata_seed.sql` |
| 9 | `20260821160000_progression_history_duration.sql` |
| 10 | `20260821180000_client_loop_integration.sql` |

Production recorded migrations last checked: newest `20260816180000`. Everything above is **pending** on Production.

Also pending on Production (not in this pin, do not sneak in): later files such as coaching-messaging / readiness if they were applied out-of-band as functions only. Dry-run must start from a **true dump of current Production**, not from repo history alone.

---

## 3. PF-2 — production-like dry-run (procedure)

**Target:** a new Supabase project or a restore of a Production backup. **Never** the live Production ref.

1. Snapshot Production (dashboard backup or `pg_dump` of schema + data needed for RLS). Record backup id / timestamp.  
2. Restore into a throwaway project. Confirm `project_id` ≠ `ufgrbpakuemamggwypdh` and ≠ `dxerwrdpcflpnjvsnrjq` if you need a third copy.  
3. Record `SELECT version FROM supabase_migrations.schema_migrations ORDER BY version`.  
4. Apply files 1→10 **one at a time** with timing:

   ```bash
   # Example only — pointed at the CLONE database URL, never Production
   /usr/bin/time -p psql "$CLONE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/<file>.sql
   ```

5. After each file: `\df *client_get_my_training_runtime*` (appears after file 5), V2 session RPCs (after file 6), `client_upsert_adaptive_decision` (after file 10).  
6. Run the SQL plans (clone only):  
   - `supabase/tests/client_program_assignment_rls_test_plan.sql`  
   - `supabase/tests/training_engine_v2_rls_test_plan.sql`  
   - `supabase/tests/exercise_library_v2_rls_test_plan.sql`  
7. Capture: wall-clock per file, lock waits, failed statements, table sizes (`workout_set_logs`, `exercises`).  
8. Destroy the clone when finished. Do not keep a shadow of Production data longer than the dry-run.

**Pass criteria:** all ten files apply with `ON_ERROR_STOP`; `client_get_my_training_runtime` and `client_get_my_nutrition_runtime` are **not** required together — nutrition RPC is out of pin; training runtime **is** required; RLS plan items for two members + admin do not leak cross-client rows.

**Fail criteria:** any file errors; long exclusive locks on hot tables (`workout_set_logs`, `exercises`) beyond an agreed window; need to rewrite history.

Until a clone exists, PF-2 stays **PREPARED_NOT_EXECUTED**.

---

## 4. PF-3 — rollback / forward-recovery (do not run on Production)

Migrations are largely **additive** (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, new RPCs). They are not a clean `DOWN` migration set. Treat rollback as **restore backup**, not as DROP improvisation on live Production.

### 4.1 Preferred rollback (forward-safe)

1. Keep a pre-apply Production backup (PF-3 cannot start without it).  
2. If apply fails mid-chain: **stop**. Do not continue to file N+1.  
3. Restore the pre-apply backup onto Production only under CEO order.  
4. Re-run dry-run on a clone using the failed file as the first investigation.

### 4.2 Forward-recovery (if apply succeeded but app misbehaves)

1. Do **not** drop `workout_sessions` / `adaptive_decision_logs` on Production to “undo V2”. Historical set logs must remain.  
2. App rollback: revert frontend to the last Production SHA (currently `main` / `0a3e784` lineage) so paid clients stop calling missing/new RPCs.  
3. Leave additive tables in place if the schema apply already landed; unused RPCs are inert if the old app does not call them.  
4. New assignment snapshots (`client_program_*`) stay; old template data is not rewritten in place (`replaced` / `ended_at` model).

### 4.3 What not to do

- `DROP TABLE workout_sessions CASCADE` on Production  
- Point Staging app at Production to “test rollback”  
- Apply file 10 before 6  
- Include `20260820250000` because it is sitting uncommitted on disk  

### 4.4 Function-level undo (clone / Staging only)

If a clone needs to simulate “app old / schema new”:

- `REVOKE EXECUTE` on `client_get_my_training_runtime`, `client_upsert_adaptive_decision`, `admin_assign_generated_v2_program` from `authenticated`  
- Do not revoke `get_my_membership`

This is an experiment on a clone, not a Production runbook step without CEO.

---

## 5. Production apply checklist (future CEO order only)

When Production is actually approved, in this order:

1. PF-2 dry-run report attached (timings + RLS).  
2. Pre-apply backup id recorded.  
3. Maintenance window.  
4. Apply files 1→10 to `ufgrbpakuemamggwypdh`.  
5. Smoke: `SELECT proname FROM pg_proc WHERE proname = 'client_get_my_training_runtime'`.  
6. Then — and only then — merge `4d80f8d` to `main` (PF-1) so `deploy.yml` ships a frontend that matches the database.  
7. Cohort-equivalent smoke on a single Production volunteer is a **separate** CEO decision (`PRODUCTION_CLIENT_MIGRATION` is still not approved by the 2026-08-22 order).

---

## 6. Status

| Gate | Status |
|------|--------|
| PF-2 dry-run | `PREPARED_NOT_EXECUTED` — needs a Production clone |
| PF-3 rollback plan | `DOCUMENTED` — restore-backup primary; no Production apply |
| Production migrations | **Not applied** |
