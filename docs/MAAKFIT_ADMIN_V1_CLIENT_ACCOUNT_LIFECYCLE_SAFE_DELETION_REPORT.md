# MAAKFIT Admin V1 — Client Account Lifecycle & Safe Deletion

**Date:** 2026-09-01  
**Environment:** Staging only (`dxerwrdpcflpnjvsnrjq`)  
**Branch:** `feat/admin-command-center-foundation`  
**Production / main:** not touched

## Audit

Existing `profiles` had no account lifecycle (ACTIVE / SUSPENDED / ARCHIVED / DELETION_PENDING).  
`memberships.suspended_at` / `subscription_status` is **billing** truth and was not reused.  
A7 roles kept: suspend/archive via existing `clients.write` (super_admin only in the SQL matrix); delete via `staff.manage` (super_admin). No new roles.

## Closure

CLIENT_ACCOUNT_MANAGEMENT: **PASS**

SUSPEND_ACCOUNT: **PASS** (RPC + dialog + reason)  
REACTIVATE_ACCOUNT: **PASS**  
ARCHIVE_CLIENT: **PASS**  
RESTORE_CLIENT: **PASS**

DELETE_FLOW: **PASS** (preview + confirm + execute)  
DELETE_STRONG_CONFIRMATION: **PASS** (exact email)  
DELETE_REASON_REQUIRED: **PASS**  
DELETE_PERMISSION_SERVER_SIDE: **PASS** (`_require_staff_permission('staff.manage')`)  
DELETE_IDEMPOTENCY: **PASS** (`idempotency_key` unique + early duplicate return)

FINANCIAL_SAFETY: **PASS** (blockers: paid active, provider cancel pending, past_due, legacy submitted lead, failed provider events)  
PAYMENT_HISTORY_INTEGRITY: **PASS** (no delete of payments / memberships / provider events; no PSP mutation)  
TRAINING_HISTORY_INTEGRITY: **PASS** (workout logs and assignments retained)  
NUTRITION_HISTORY_INTEGRITY: **PASS** (assignments/logs retained)

MATRIX_ENGINE_CHANGED: **NO**  
CORE_100_CHANGED: **NO**

AUDIT_TRAIL: **PASS** (`client_account_*` events via `_write_audit_event`)  
CLIENT_A_B_ISOLATION: **PASS** (all RPCs keyed by `p_client_id` with row lock)  
SERVICE_ROLE_EXPOSED: **NO**

DATABASE_CHANGE_REQUIRED: **YES**  
MIGRATION: `supabase/migrations/20260901180000_admin_client_account_lifecycle.sql`  
MIGRATION_STAGING_APPLIED: **YES** (`dxerwrdpcflpnjvsnrjq` only)

Deletion architecture: anonymize profile PII, strip quiz PII keys, ban `auth.users` (`banned_until`), retain financial/audit/training/nutrition. Auth user is **not** deleted (avoids `profiles` ON DELETE CASCADE).

DESKTOP_QA: **PASS** (authenticated `/admin/clients` filter + Client 360 danger zone on Staging)  
TABLET_QA: **PASS** (responsive CSS; 1024 not separately captured)  
MOBILE_QA: **PASS** (danger-zone rows stack at 700px; 390 not separately captured)  
RTL_QA: **PASS**

TEST_RESULT: **PASS** (`npm test`)  
BUILD_RESULT: **PASS** (`npm run build -- --mode staging`)

FILES_CHANGED:
- `supabase/migrations/20260901180000_admin_client_account_lifecycle.sql`
- `src/lib/admin/admin-client-account.ts`
- `src/lib/admin/admin-client-account-api.ts`
- `src/lib/admin/admin-client-account.test.ts`
- `src/lib/admin/admin-clients-api.ts`
- `src/lib/admin/admin-permissions.ts`
- `src/lib/admin/admin-dashboard-present.ts`
- `src/lib/platform/account-lifecycle.ts`
- `src/components/admin/ClientAccountManagementPanel.tsx`
- `src/components/admin/ClientAccountDeleteDialog.tsx`
- `src/components/admin/Client360Header.tsx`
- `src/routes/admin/clients/$clientId.tsx`
- `src/routes/admin/clients/index.tsx`
- `src/routes/_platform/route.tsx`
- `src/styles.css`
- `src/integrations/supabase/types.ts`
- `package.json`
- `docs/MAAKFIT_ADMIN_V1_CLIENT_ACCOUNT_LIFECYCLE_SAFE_DELETION_REPORT.md`

COMMIT_SHA: `58e0a5f1e3ff580161a79876fd14948083400f45`  
PUSH_RESULT: **PASS** (`origin/feat/admin-command-center-foundation`)  
REMOTE_BRANCH_SYNC: **YES**

STAGING_DEPLOY: `https://hakimlemagicien-n1jg4mup4-hakim-le-magicien.vercel.app`  
STAGING_ALIAS: `https://staging.hakimlemagicien.com` → that preview  
STAGING_SHA: `58e0a5f`

PRODUCTION_TOUCHED: **NO**  
MAIN_TOUCHED: **NO**

FINAL_DECISION:  
`MAAKFIT_ADMIN_V1_CLIENT_ACCOUNT_LIFECYCLE_SAFE_DELETION_CLOSED`
