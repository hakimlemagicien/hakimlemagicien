<!-- PROJECT:BEGIN -->
> [!IMPORTANT]
> **Source of truth:** GitHub (`main`) + official Supabase project (`ufgrbpakuemamggwypdh`).
>
> - All migrations, schema changes, and RPCs land in this repository first.
> - Apply database changes via `supabase/migrations/` and test on staging before production.
> - Avoid rewriting published git history on `main` (no force-push, no rebasing/amending pushed commits).
> - Keep `main` deployable: run `npm run build` before merging significant changes.
> - **Performance is mandatory** — follow [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) for all screens. Use `OptimizedImage`, skeletons, and code splitting. Lighthouse Performance ≥ 90 on main pages.
<!-- PROJECT:END -->
