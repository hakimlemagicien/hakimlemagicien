# MAAKFIT NUTRITION V1 — STAGING QA REPORT

**Date:** 2026-09-02  
**Mode:** STAGING ONLY — STOP BEFORE PRODUCTION  
**Branch:** `feat/admin-command-center-foundation`

---

## EXECUTING_EMPLOYEE

Platform Developer / Release Engineer (Cursor Agent)

## STAGING_PROJECT

`dxerwrdpcflpnjvsnrjq` (`hakim-coaching-staging`)

## STAGING_TARGET_VERIFIED

| Check | Result |
|-------|--------|
| `supabase/.temp/project-ref` | `dxerwrdpcflpnjvsnrjq` |
| `.env.staging.local` `SUPABASE_PROJECT_ID` | `dxerwrdpcflpnjvsnrjq` |
| `SUPABASE_URL` contains staging ref | YES |
| Production ref `ufgrbpakuemamggwypdh` touched | **NO** |

CLI linked via pooler (`supabase link --project-ref dxerwrdpcflpnjvsnrjq -p …`).

---

## MIGRATIONS_APPLIED

Applied via `supabase db push --linked --yes` (no reset).

| ID | Migration | Status |
|----|-----------|--------|
| **M1** | `20260902100000_nutrition_v1_foundation_enums_tables.sql` | **PASS** |
| **M2** | `20260902110000_nutrition_v1_extend_assignments_slots.sql` | **PASS** |
| **M3** | `20260902120000_nutrition_v1_consumption_events_extend_logs.sql` | **PASS** |
| **M4** | `20260902130000_nutrition_v1_strategy_rpcs.sql` | **PASS** |

**Also applied (prerequisite, not Nutrition):** `20260901120000`, `20260901180000` (idempotent fix: `CREATE OR REPLACE` for `admin_list_clients`), `20260901190000`, `20260901194000`, `20260902131000` (training auto-assign — separate V1 track).

**MIGRATION_HISTORY:** Local ↔ remote aligned for all migrations through `20260902131000`.

---

## RPC_ORCHESTRATOR

**PASS** — Staging E2E + contract verification:

- `admin_generate_client_nutrition`
- `client_get_my_nutrition_runtime`
- `nutrition_apply_swap`
- `client_log_nutrition_meal(uuid,text,date,numeric)`
- `nutrition_create_target`

---

## RLS / SECURITY

| Gate | Result |
|------|--------|
| **RLS_OWN_DATA** | **PASS** — client reads own assignment |
| **RLS_CROSS_CLIENT** | **PASS** — no assignment/trace leak across clients |
| **ADMIN_SECURITY** | **PASS** — client RPC `admin_generate_client_nutrition` → `forbidden` |
| **DECISION_TRACE_SECURITY** | **PASS** — cross-client trace reads empty; admin via service role |

---

## ADMIN_GENERATE → ASSIGNMENT

| Gate | Result |
|------|--------|
| **ADMIN_GENERATE** | **PASS** — Strategy V1 `STRATEGY_V1_DYNAMIC` |
| **ASSIGNMENT_CREATION** | **PASS** |
| **ASSIGNMENT_VERSIONING** | **PASS** — v2 replaces v1 (`replaced`) |
| **SLOT_CREATION** | **PASS** — 6 strategy slots |

---

## CLIENT_RUNTIME

| Gate | Result |
|------|--------|
| **CLIENT_RUNTIME** | **PASS** — `reason=ok`, schema `STRATEGY_V1_DYNAMIC` |
| **MEAL_RENDERING** | **PASS** (API) — slots resolved with `source_external_id` |
| **TARGET_RENDERING** | **PASS** (API) — target + planned macros present |

---

## SWAP

| Gate | Result |
|------|--------|
| **SWAP_RUNTIME** | **PASS** |
| **SWAP_PERSISTENCE** | **PASS** — runtime stable after swap + refresh |

Note: `daily_meal_swap_limit_reached` enforced on repeat same-day swap (expected entitlement behavior).

---

## CONSUMPTION / LOG

| Gate | Result |
|------|--------|
| **CONSUMPTION_LOG** | **PASS** — partial log persisted |
| **PARTIAL_LOG** | **PASS** — `consumed=200`, `planned=1900` |
| **REFRESH_PERSISTENCE** | **PASS** — re-fetch matches |

---

## ALLERGEN_SAFETY

**PASS** — `UNKNOWN` allergy → `allergy_status_required` on generate (no silent assignment).

---

## ENTITLEMENT_QA

| Tier | Result |
|------|--------|
| **FREE_NUTRITION_ACCESS** | **PASS** — `nutrition.full_day=false` |
| **PAID_NUTRITION_ACCESS** (Essential) | **PASS** — `nutrition.full_day=true` |
| **ENTITLEMENT_ENFORCEMENT** | **PASS** — swap blocked when not entitled (contract) |

---

## ERROR / EMPTY / LOADING (API)

| State | Result |
|-------|--------|
| **ERROR_STATES** | **PASS** — invalid swap → `swap_not_allowed` |
| **EMPTY_STATES** | **PASS** — no assignment → `no_program` (contract) |
| **LOADING_STATES** | Not UI-tested — API paths respond |

---

## MOBILE / RTL SMOKE

| Viewport | Result |
|----------|--------|
| **MOBILE_390** | **NOT_RUN** — staging preview not re-deployed in this task |
| **TABLET** | **NOT_RUN** |
| **DESKTOP** | **NOT_RUN** |
| **RTL** | **NOT_RUN** |

Runtime/API QA covers Nutrition V1 contracts. UI smoke requires staging app deploy with current branch + manual login — **P2** unless CEO requests deploy-first UI gate.

---

## TYPES / TESTS / BUILD

| Item | Result |
|------|--------|
| **TYPES_GENERATED** | **PASS** — `supabase gen types typescript --linked` → `src/integrations/supabase/types.ts` (includes Nutrition V1 RPCs) |
| **TARGETED_TESTS** | **PASS** — `nutrition-strategy.test.ts`, `nutrition-integration.test.ts`, `admin-client-nutrition.test.ts` |
| **BUILD_RESULT** | **PASS** |

---

## FILES_CHANGED (local, not committed)

- `supabase/migrations/20260901180000_admin_client_account_lifecycle.sql` — `CREATE OR REPLACE` for staging idempotency
- `supabase/migrations/20260902130000_nutrition_v1_strategy_rpcs.sql` — swap slot FK fix (from local gate)
- `supabase/migrations/20260902131000_client_v1_auto_assign_training.sql` — renamed version
- `scripts/nutrition-v1-staging-e2e.mjs` — new Staging QA runner
- `scripts/nutrition-v1-local-e2e.mjs` — local seed fixes
- `src/integrations/supabase/types.ts` — regenerated from Staging

**COMMIT_SHA:** Not committed in this execution  
**PUSH_RESULT:** Not pushed

---

## PRODUCTION PROTECTION

| Item | Status |
|------|--------|
| **PRODUCTION_TOUCHED** | **NO** |
| **PRODUCTION_DB_TOUCHED** | **NO** |
| **PRODUCTION_DEPLOYED** | **NO** |

---

## P0_BLOCKERS

None for API/DB Staging gate.

## P1_BLOCKERS

1. **UI/Mobile smoke not executed** — staging preview deploy + manual browser QA pending.

## P2_AFTER_LAUNCH

- Pixel-perfect Nutrition UI polish
- Staging canonical hostname PF-4

---

## PRODUCTION RELEASE PLAN (DO NOT EXECUTE)

### MIGRATIONS_REQUIRED (order)

1. `20260901120000_onboarding_goal_persistence_fix.sql` (if not already on Production)
2. `20260901180000_admin_client_account_lifecycle.sql`
3. `20260901190000_admin_membership_override.sql`
4. `20260901194000_founder_review_premium_membership.sql`
5. `20260902100000_nutrition_v1_foundation_enums_tables.sql` **M1**
6. `20260902110000_nutrition_v1_extend_assignments_slots.sql` **M2**
7. `20260902120000_nutrition_v1_consumption_events_extend_logs.sql` **M3**
8. `20260902130000_nutrition_v1_strategy_rpcs.sql` **M4**
9. `20260902131000_client_v1_auto_assign_training.sql` (training V1 — coordinate with training release)

### DEPLOY_COMMIT

Branch `feat/admin-command-center-foundation` (or merged `main`) including Nutrition V1 frontend + regenerated `types.ts`.

### SMOKE_TEST_PLAN

1. Admin: generate Strategy V1 assignment for QA client
2. Client: runtime shows target + slots
3. Swap one meal → persists after refresh
4. Partial log → consumed macros update
5. Free tier: limited nutrition entitlement
6. Cross-client RLS spot check

### ROLLBACK_PLAN

- Revert app deploy to prior Vercel deployment
- DB: migrations are additive; rollback = disable new RPC paths in app + coach manual legacy assign if needed (no automatic down migration)

### DATA_LOSS_RISK

**LOW** — additive schema + new RPCs; existing legacy nutrition assignments preserved.

### DOWNTIME_EXPECTED

**NONE** — migrations additive; brief RPC deploy window only.

---

## FINAL DECISION

# **NUTRITION_V1_STAGING_QA_PASS**

**READY_FOR_PRODUCTION_APPROVAL** — API/DB/RLS/entitlement gates pass on Staging `dxerwrdpcflpnjvsnrjq`.

**STOP** — awaiting CEO Production approval. UI mobile smoke recommended after staging app deploy (P1, not blocking API contract).
