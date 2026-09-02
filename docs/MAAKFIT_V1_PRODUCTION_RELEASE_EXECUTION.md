# MAAKFIT V1 — Production Release Execution

**Date:** 2026-09-02  
**Mode:** Staging verified → Production apply → smoke  
**Branch:** `feat/admin-command-center-foundation`

---

## CEO / Owner sign-off (required)

| Gate | Status | Notes |
|------|--------|-------|
| Production DB migration approval | ☑ | Applied 2026-09-02 — M1–M4 + training auto-assign |
| Public launch with manual membership only | ☑ | Paddle not approved — `MANUAL_MEMBERSHIP_ONLY` |
| Legal entity / governing law / effective date | ☐ | `policy-catalog.ts` TBD — owner must supply before self-serve checkout marketing |
| Deploy `main` to hakimlemagicien.com | ☐ | After merge + CI |

**Recorded launch mode:** `MANUAL_MEMBERSHIP_ONLY` — new paid clients via admin membership override until Paddle sandbox/production validation completes.

---

## Staging verification (prerequisite)

```bash
npx tsx scripts/v1-staging-go-live-e2e.mjs
npx tsx scripts/nutrition-v1-staging-e2e.mjs
npm run build
```

---

## Production migrations (order)

Apply on `ufgrbpakuemamggwypdh` only:

1. `20260901190000_admin_membership_override.sql`
2. `20260901194000_founder_review_premium_membership.sql`
3. `20260902100000_nutrition_v1_foundation_enums_tables.sql` (M1)
4. `20260902110000_nutrition_v1_extend_assignments_slots.sql` (M2)
5. `20260902120000_nutrition_v1_consumption_events_extend_logs.sql` (M3)
6. `20260902130000_nutrition_v1_strategy_rpcs.sql` (M4)
7. `20260902131000_client_v1_auto_assign_training.sql`

```bash
supabase link --project-ref ufgrbpakuemamggwypdh -p "$SUPABASE_DB_PASSWORD"
supabase db push --linked --yes
supabase migration list --linked
```

Verify RPCs:

```sql
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN (
    'client_assign_generated_v2_program',
    'client_get_my_training_runtime',
    'client_get_my_nutrition_runtime',
    'nutrition_apply_swap'
  );
```

---

## Production smoke (post-deploy)

1. **Free:** Quiz goal → `/app/program/workout` — preview visible, one exercise/day, no assignment row.
2. **Paid (manual grant):** Admin override Essential → auto-assign → runtime `ok`.
3. **Nutrition:** Admin generate Strategy V1 → client runtime + one swap.
4. **Mobile 390px:** Home, workout, nutrition — no horizontal scroll, CTAs tappable.

---

## Rollback

- App: revert Vercel deployment to previous production build.
- DB: migrations additive — disable V1 RPC paths in app if critical issue; no automatic down migration.

---

## Paddle

- **Decision:** Do not enable live checkout until `PADDLE = APPROVED` with sandbox E2E documented.
- **Interim:** `V1_LAUNCH_MODE = MANUAL_MEMBERSHIP_ONLY`.
