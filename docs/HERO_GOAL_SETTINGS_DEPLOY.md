# Hero Goal Settings — Staging → Production Deploy Runbook

**Migrations**

- Framing / card themes: `20260902140000_platform_hero_goal_settings.sql`
- Goal card images (upload/replace/delete): `20260905170000_hero_goal_image_overrides.sql`

**Risk:** Additive only (tables + RPCs + public bucket `hero-goal-covers`). Failure mode = admin image save / client override read broken — not full app outage. Bundled assets remain the fallback when no CMS images exist for a goal.

---

## Before you start

| Item | Staging | Production |
|------|---------|------------|
| Project ref | `dxerwrdpcflpnjvsnrjq` | `ufgrbpakuemamggwypdh` |
| Dashboard | [Staging](https://supabase.com/dashboard/project/dxerwrdpcflpnjvsnrjq) | [Production](https://supabase.com/dashboard/project/ufgrbpakuemamggwypdh) |

**Rules**

- Never point Staging app env at Production Supabase.
- `supabase/config.toml` defaults to **Production** — always verify `project-ref` before `db push`.
- Frontend on `main` is already deployed; this runbook is **database only**.

---

## Phase A — Staging DB (recommended, ~10 min)

You do **not** need to deploy the Staging Vercel app. Test from **local** against Staging DB.

### A1. Point local env at Staging

Copy `.env.staging` → `.env.local` (or use `.env.staging.local`) with:

- `VITE_APP_ENV=staging`
- `VITE_SUPABASE_URL=https://dxerwrdpcflpnjvsnrjq.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<staging anon key>`

### A2. Link CLI to Staging

```bash
cd /path/to/hakimlemagicien
supabase link --project-ref dxerwrdpcflpnjvsnrjq -p "$STAGING_DB_PASSWORD"
cat supabase/.temp/project-ref   # MUST print: dxerwrdpcflpnjvsnrjq
```

Pooler host (if needed): `aws-0-eu-west-2`, user `postgres.dxerwrdpcflpnjvsnrjq`.

### A3. Apply migration

```bash
supabase db push --linked --yes
supabase migration list --linked
```

Confirm `20260902140000` appears on remote.

### A4. Verify RPCs (SQL Editor or psql)

```sql
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN (
    'client_get_hero_goal_settings',
    'admin_save_hero_goal_framing',
    'admin_save_hero_goal_card_theme',
    'admin_reset_hero_goal_setting'
  )
ORDER BY 1;
-- Expect 4 rows

SELECT to_regclass('public.platform_hero_goal_settings');
-- Expect: platform_hero_goal_settings
```

### A5. Smoke test (local + Staging DB)

```bash
npm run dev
```

1. Sign in as **Staging admin** (`content.manage` / super_admin).
2. Open `/admin/studio` → tab **بطاقة الهيرو**.
3. Adjust framing → **حفظ التعديل** → message success (no «تعذر الحفظ»).
4. Open `/app` (same browser) → hero reflects saved framing/color.
5. Optional: second browser / incognito member session → same hero settings visible.

### A6. Confirm row persisted

```sql
SELECT setting_kind, gender, goal_id, asset_file_name, payload, updated_at
FROM public.platform_hero_goal_settings
ORDER BY updated_at DESC
LIMIT 10;
```

---

## Phase B — Production DB

**Only after Phase A passes** (or you accept skipping Staging with known risk).

### B1. Re-link CLI to Production

```bash
supabase link --project-ref ufgrbpakuemamggwypdh -p "$PRODUCTION_DB_PASSWORD"
cat supabase/.temp/project-ref   # MUST print: ufgrbpakuemamggwypdh
```

### B2. Apply migration

```bash
supabase db push --linked --yes
supabase migration list --linked
```

### B3. Repeat verification SQL (section A4)

Run on **Production** SQL Editor.

### B4. Production smoke (live site)

1. https://hakimlemagicien.com/admin/studio — save one hero adjustment.
2. https://hakimlemagicien.com/app — confirm hero matches (any authenticated member).
3. Hard refresh / new device optional — settings come from server, not localStorage.

---

## Alternative: Dashboard SQL (if CLI blocked)

1. Open target project → **SQL Editor**.
2. Paste full contents of `supabase/migrations/20260902140000_platform_hero_goal_settings.sql`.
3. Run once.
4. Re-run verification queries from A4.

---

## Rollback

| Layer | Action |
|-------|--------|
| **App** | Revert Vercel deployment to previous build (optional — old app ignores missing RPCs gracefully for reads; save would fail) |
| **DB** | `DROP TABLE IF EXISTS public.platform_hero_goal_settings CASCADE;` then drop the four RPCs if needed. No automatic down migration in repo. |

Saved hero settings are lost on table drop. App falls back to default framing/colors.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| «تعذر الحفظ» | Migration not applied on that Supabase project | Run Phase A or B |
| Save works locally but not on live site | Local `.env.local` points to Staging; Production DB missing migration | Apply B2 |
| `42501 forbidden` on save | Admin lacks `content.manage` | Check staff permissions / super_admin |
| `function does not exist` | Wrong project or partial apply | Re-run migration SQL; check A4 |
| Staging isolation error in browser | `VITE_APP_ENV=staging` with Production URL | Fix env vars per `docs/ENVIRONMENTS.md` |

---

## Quick reference — project isolation

```
STAGING  APP/LOCAL  →  dxerwrdpcflpnjvsnrjq
PRODUCTION APP     →  ufgrbpakuemamggwypdh
```
