# Environments — PRODUCTION vs STAGING vs LOCAL

**Classification:** infrastructure identity  
**Secrets:** never documented here  
**Rule:** Production is not a test environment.

| Environment | App origin | Supabase project | Project ref | Supabase URL identity |
|-------------|------------|------------------|-------------|------------------------|
| **PRODUCTION** | https://hakimlemagicien.com | `hakim-coaching` | `ufgrbpakuemamggwypdh` | `https://ufgrbpakuemamggwypdh.supabase.co` |
| **STAGING** | **Canonical (target):** https://staging.hakimlemagicien.com — `PF-4 PENDING_VERCEL_CLAIM`.<br>**Interim (non-durable):** https://temporary-brisk-gorge-e447l9k.vercel.app | `hakim-coaching-staging` | `dxerwrdpcflpnjvsnrjq` | `https://dxerwrdpcflpnjvsnrjq.supabase.co` |
| **LOCAL / DEVELOPMENT** | `http://localhost:5173` (Vite) | use `.env.local` only | must not silently default to Production for Staging work | local or explicit env file |

Dashboard (Staging): https://supabase.com/dashboard/project/dxerwrdpcflpnjvsnrjq  
Dashboard (Production): https://supabase.com/dashboard/project/ufgrbpakuemamggwypdh

## Isolation

```
STAGING APP  →  dxerwrdpcflpnjvsnrjq
PRODUCTION APP  →  ufgrbpakuemamggwypdh
```

A Staging frontend pointed at Production Supabase is **forbidden**.  
If a Staging build (`VITE_APP_ENV=staging`) resolves Production ref `ufgrbpakuemamggwypdh`, the app throws `STAGING_ISOLATION_FAILED`.

## Hosting

| Environment | Provider | How it deploys |
|-------------|----------|----------------|
| PRODUCTION | Vercel project `hakimlemagicien` | GitHub Actions `.github/workflows/deploy.yml` on `main` only (`vercel deploy --prod`) |
| STAGING | Vercel **Preview** only (never `--prod`). Canonical host `staging.hakimlemagicien.com` is **not live** until Vercel login + DNS (PF-4). | Pin `4d80f8d`. Workflow: `.github/workflows/deploy-staging.yml` (branch `staging` / `workflow_dispatch`). Interim URL expires unless claimed. See [`TRAINING_ENGINE_V2_STAGING_COHORT.md`](./TRAINING_ENGINE_V2_STAGING_COHORT.md). |
| LOCAL | Vite `npm run dev` | `.env.local` / `.env.staging.local` (`*.local` is gitignored) |

CLI link in this repo (`supabase/config.toml` `project_id`) remains **PRODUCTION** `ufgrbpakuemamggwypdh`. Do not `supabase link` Staging over that default.

## Environment variables

Names (no values):

| Name | Role |
|------|------|
| `VITE_APP_ENV` | `production` \| `staging` \| `development` |
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` | Browser key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only |
| `SITE_URL` | Auth/email links (Edge Functions) |
| `VITE_PADDLE_*` | Payments — do not put live Paddle tokens on Staging |

Staging credentials live in gitignored `.env.staging.local` and must be copied into **Vercel Preview/Staging scope only**, never Production scope.

## Database / migrations

- Do **not** apply migrations to Production as a Staging substitute.
- Staging schema baseline is the committed migration history on `dxerwrdpcflpnjvsnrjq` (Database Architect: `STAGING_DATABASE_GATE_PASSED_WITH_EXTERNAL_APP_GATE`). Do **not** apply that chain to Production.
- Do **not** apply `20260820250000_client_nutrition_assignments.sql` unless that file is in the approved commit.
- Target commit for V2 Staging QA: `4d80f8d366909a2a6cf9217803c9c62277b66954` on `feat/admin-command-center-foundation`.

Production-like dry-run chain (clone only — **not** live Production). Do not re-apply blindly to Staging if that gate already passed:

`20260820120000` → `20260820210000` → `20260820220000` → `20260820230000` → `20260820240000` → `20260821120000` → `20260821140000` → `20260821140100` → `20260821160000` → `20260821180000`

## Auth

Production Auth (`ufgrbpakuemamggwypdh`) must not be modified for this work.  
Staging Auth belongs to `dxerwrdpcflpnjvsnrjq`.

Staging Auth Site URL must match the **canonical** Staging origin once PF-4 is claimed (`https://staging.hakimlemagicien.com`).  
Until then the interim Preview origin may be listed as an additional redirect. Production domain is **not** a Staging redirect.

CEO 2026-08-22: Staging cohort approved on `4d80f8d` + `dxerwrdpcflpnjvsnrjq`. Production release is **not** approved. Merge/dry-run/rollback: [`TRAINING_ENGINE_V2_STAGING_COHORT.md`](./TRAINING_ENGINE_V2_STAGING_COHORT.md), [`TRAINING_ENGINE_V2_PRODUCTION_MIGRATION_AND_ROLLBACK.md`](./TRAINING_ENGINE_V2_PRODUCTION_MIGRATION_AND_ROLLBACK.md).

QA accounts are Staging-only (`staging-client-a@qa.test`, `staging-client-b@qa.test`, `staging-admin@qa.test`). Passwords are not documented here.

## Accounts

QA users (CLIENT A, CLIENT B, COACH/ADMIN) are created in **Staging Auth only**.
