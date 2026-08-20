<!-- PROJECT:BEGIN -->
> [!IMPORTANT]
> **Source of truth:** GitHub (`main`) + official Supabase project (`ufgrbpakuemamggwypdh`).
>
> - The **product** is the authenticated app (`/app`). `/coaching` is marketing only.
> - All migrations, schema changes, and RPCs land in this repository first.
> - Apply database changes via `supabase/migrations/` and test on staging before production.
> - Avoid rewriting published git history on `main` (no force-push, no rebasing/amending pushed commits).
> - Keep `main` deployable: run `npm run build` before merging significant changes.
> - **Performance is mandatory** — follow [`docs/v1/PERFORMANCE.md`](docs/v1/PERFORMANCE.md) for all screens. Use `OptimizedImage`, skeletons, and code splitting. Lighthouse Performance ≥ 90 on main pages.

## Documentation for AI Agents & Developers

Read in this order:

1. [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) — **current project state** (where we are)
2. [`docs/APP_ARCHITECTURE.md`](docs/APP_ARCHITECTURE.md) — app vs marketing architecture
3. [`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md) — UX review of the live product
4. [`docs/README.md`](docs/README.md) — documentation index
5. [`README.md`](README.md) — repo entry
6. [`docs/v1/PROJECT_HANDBOOK.md`](docs/v1/PROJECT_HANDBOOK.md) — company constitution (archive, still binding)

Older technical snapshots live in [`docs/v1/`](docs/v1/README.md). Do not treat them as the current product map.


## App-First Entry

| Route | Role |
|-------|------|
| `/` | Product gateway — Quiz if anonymous; redirect to `/app` if session |
| `/coaching` | Marketing Landing only (protected design — not the product) |
| `/quiz` | Legacy — keep for deep links, `?step=`, OTP callbacks |
| `/app` | **The product** — authenticated daily app |
| `/privacy` · `/terms` · `/refund` · `/contact` | Legal V1 — policies & general support (not coaching chat) |
| `/app/billing` | Member subscription & renewal management |

**Do not** assume `/` is the Landing page. **Do not** treat `/coaching` as client value.

**Protected areas (do not modify without explicit owner approval):** Landing Page design (`/coaching`), Quiz UI, Admin flows. Onboarding runs **inside Quiz** (`/` and `/quiz` share `QuizPage`) — there is no `/onboarding` route.
<!-- PROJECT:END -->
