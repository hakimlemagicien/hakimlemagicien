# Training Engine V2 — Staging cohort + merge path

**CEO decision:** `STAGING_COHORT_APPROVED` / `PRODUCTION_RELEASE_NOT_APPROVED`  
**Date:** 2026-08-22  
**Approved artifact:** `4d80f8d366909a2a6cf9217803c9c62277b66954`  
**Approved database:** Staging only — `dxerwrdpcflpnjvsnrjq` (`hakim-coaching-staging`)  
**Forbidden:** Production deploy, Production migrations, global V2 enablement, Production client migration

Companion: [`TRAINING_ENGINE_V2_PRODUCTION_MIGRATION_AND_ROLLBACK.md`](./TRAINING_ENGINE_V2_PRODUCTION_MIGRATION_AND_ROLLBACK.md) · [`ENVIRONMENTS.md`](./ENVIRONMENTS.md)

---

## 1. What is approved now

| Item | Status |
|------|--------|
| Staging app at pinned SHA `4d80f8d` | Approved for QA clients + Coach/Admin |
| Staging Supabase `dxerwrdpcflpnjvsnrjq` | Approved |
| 2–3 week monitored cohort | Approved |
| Remaining live goal scenarios during cohort | Required (QA + Coach) |
| Decision-trace + RLS monitoring | Required (QA + Architect) |
| Merge `4d80f8d` into `main` | **Prepared, not executed** |
| Production (`hakimlemagicien.com` / `ufgrbpakuemamggwypdh`) | **Not approved** |

Working-tree files after `4d80f8d` (nutrition V2 images, uncommitted `20260820250000`, etc.) are **out of cohort scope**. Do not ship them with this pin.

---

## 2. Production freeze gates (must all close before Production)

| ID | Gate | Owner | Status |
|----|------|--------|--------|
| **PF-1** | Reviewed merge path for `4d80f8d` toward `main` | Platform Developer | **PREPARED — DO NOT MERGE** |
| **PF-2** | Migration dry-run on a production-like copy | Database Architect | Prepared on paper — **not executed** |
| **PF-3** | Production migration apply + rollback plan | Database Architect + CEO | Plan documented — **do not apply** |
| **PF-4** | Canonical durable Staging URL | Platform Developer / Vercel login | **PENDING_VERCEL_CLAIM** |

Soft cohort items (non-blocking for Staging, still required during the 2–3 weeks): Recovery-limited, WAIST guardrail, FAT_LOSS boundary, Low Adherence, refresh/logout/login, media-failure resilience, Admin UI generator path.

---

## 3. Why `main` must not receive `4d80f8d` yet

`.github/workflows/deploy.yml` deploys **production** on every push to `main` (`vercel deploy --prod`).

Paid `/app` on this SHA calls `client_get_my_training_runtime`. That RPC **does not exist** on Production `ufgrbpakuemamggwypdh` (latest recorded migration there: `20260816180000`). Merging now would ship V2 frontend against a pre-V2 database and break paid workout/nutrition the same way unassigned Staging did before the Staging gate.

**Rule:** PF-1 merge is allowed only after PF-2 is executed and CEO closes PF-3 (Production migrations applied or an explicit compatibility fallback is approved). Draft review is allowed. Merge is not.

---

## 4. Reviewed merge path (PF-1)

Local pin branch (exact approved SHA, no extra commits):

```bash
git fetch origin
git branch release/training-v2-4d80f8d 4d80f8d366909a2a6cf9217803c9c62277b66954
```

| Step | Action | Allowed now? |
|------|--------|----------------|
| 1 | Keep `release/training-v2-4d80f8d` at `4d80f8d` | Yes |
| 2 | `git log --oneline origin/main..4d80f8d` — 9 commits (brand → legal/billing → Command Center → client loop) | Yes — review |
| 3 | Rehearse merge: `git merge --no-commit --no-ff origin/main` **on a throwaway worktree**, then abort | Yes |
| 4 | Open a **draft** PR into `main` titled `DO NOT MERGE — Training V2 4d80f8d (PF-1 hold)` | Yes, after push of the pin branch |
| 5 | Merge the PR | **No** — Production deploy would follow |
| 6 | Push to `main` / `vercel deploy --prod` | **No** |

Commits on the pin (oldest → newest):

1. `f5f3b29` Rename the product brand to MAAKFIT  
2. `16d479f` Replace remaining H monogram surfaces  
3. `1f878ff` Legal, pricing, billing, privacy and support V1  
4. `3c8073f` Refresh live docs + profile achievements  
5. `1b4b63e` Command Center Phases 1–3  
6. `587f35c` Command Center Phase 4  
7. `684f541` Command Center Phase 5  
8. `1cfe192` Command Center Phase 6 — assignment snapshots + workout runtime  
9. `4d80f8d` Connect Training Engine V2 client loop for staging QA  

`origin/main` unique commits since merge-base `6a57d1c`: three coaching-messaging merge PRs (`#6` `#7` `#8`). Overlapping file set vs `4d80f8d` at last check: **empty**. Rehearse anyway immediately before any future real merge.

Draft PR body (copy when opening):

```
DO NOT MERGE.

Pinned artifact: 4d80f8d366909a2a6cf9217803c9c62277b66954
CEO: STAGING_COHORT_APPROVED / PRODUCTION_RELEASE_NOT_APPROVED

Merging main triggers production deploy.yml. Production DB lacks
client_get_my_training_runtime. Hold until PF-2, PF-3, PF-4 and
Staging cohort review are closed.
```

---

## 5. Canonical Staging URL (PF-4)

| Role | URL | Status |
|------|-----|--------|
| **Canonical (target)** | `https://staging.hakimlemagicien.com` | **Not live** — needs Vercel login + DNS CNAME. Must never point at Production Supabase. |
| **Interim (non-durable)** | `https://temporary-brisk-gorge-e447l9k.vercel.app` | Anonymous Vercel `--temporary` preview. Claim required to survive ~1 hour. **Not** the canonical URL. |
| Production | `https://hakimlemagicien.com` | Out of scope |

CLI is currently **logged out** (`vercel whoami` → Logged out). This environment cannot claim the preview or bind DNS.

Owner steps to close PF-4 (no Production flags):

1. `vercel login` on the official team.  
2. Claim or recreate a **Preview** deployment of `4d80f8d` — never `--prod`.  
3. Preview env only: `VITE_APP_ENV=staging`, `VITE_SUPABASE_URL=https://dxerwrdpcflpnjvsnrjq.supabase.co`, matching Staging publishable key.  
4. Confirm `assertEnvironmentIsolation()` would throw if that build resolved `ufgrbpakuemamggwypdh`.  
5. Alias to `staging.hakimlemagicien.com` (CNAME → Vercel). Update Staging Auth Site URL + redirects on `dxerwrdpcflpnjvsnrjq` only.  
6. Replace the interim URL in [`ENVIRONMENTS.md`](./ENVIRONMENTS.md).

Workflow scaffold (does not run on `main`, never `--prod`): `.github/workflows/deploy-staging.yml`. It stays unused until Vercel secrets exist and a `staging` ref is pushed.

Until PF-4 closes, cohort traffic may use the interim URL **only if it still resolves**. If it expires, redeploy Preview of `4d80f8d` against Staging Supabase — do not fall back to Production.

---

## 6. Cohort execution (QA + Coach)

Duration: 2–3 weeks. Actors: Staging QA clients + Coach/Admin only.

Required live coverage:

- Recovery-limited  
- WAIST guardrail (`SLIM_TONED_WAIST` — no spot reduction)  
- FAT_LOSS boundary (no auto resistance add / no HIIT shortcut)  
- Low Adherence  
- refresh / logout / login persistence of decisions  
- media-failure resilience  
- Admin UI path: generate → validate → assign V2 program  

Continue: decision-trace review (`adaptive_decision_logs`) and RLS monitoring on Staging only.

---

## 7. Explicit non-actions

- No `vercel deploy --prod`  
- No GitHub `deploy.yml` on `main`  
- No `supabase db push` / migration apply to `ufgrbpakuemamggwypdh`  
- No global V2 flag  
- No Production client migration  
- No treating Production as Staging  
