<!-- PROJECT:BEGIN -->
> [!IMPORTANT]
> **Source of truth:** GitHub (`main`) + official Supabase project (`ufgrbpakuemamggwypdh`).
>
> - All migrations, schema changes, and RPCs land in this repository first.
> - Apply database changes via `supabase/migrations/` and test on staging before production.
> - Avoid rewriting published git history on `main` (no force-push, no rebasing/amending pushed commits).
> - Keep `main` deployable: run `npm run build` before merging significant changes.
> - **Performance is mandatory** — follow [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) for all screens. Use `OptimizedImage`, skeletons, and code splitting. Lighthouse Performance ≥ 90 on main pages.

## Documentation for AI Agents & Developers

Read in this order:

1. [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) — **current project state** (where we are)
2. [`docs/PROJECT_HANDBOOK.md`](docs/PROJECT_HANDBOOK.md) — company constitution & decisions
3. [`docs/MASTER_PROJECT_DOCUMENTATION.md`](docs/MASTER_PROJECT_DOCUMENTATION.md) — full technical reference
4. [`README.md`](README.md) — quick entry point


## App-First Entry (2026-08-14)

| Route | Role |
|-------|------|
| `/` | Product entry — Quiz if anonymous; redirect to `/app` if session |
| `/coaching` | Marketing Landing (protected design) |
| `/quiz` | Legacy — keep for deep links, `?step=`, OTP callbacks |
| `/app` | Authenticated platform |

**Do not** assume `/` is the Landing page.

**Protected areas (do not modify without explicit owner approval):** Landing Page design (`/coaching`), Quiz UI, Admin flows. Onboarding runs **inside Quiz** (`/` and `/quiz` share `QuizPage`) — there is no `/onboarding` route yet.
<!-- PROJECT:END -->
