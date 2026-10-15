# CEO Decision — MAAKFIT V1 Public Launch Gate

**Date:** 2026-09-11  
**Decided by:** CEO / Owner (Hakim)  
**Supersedes for V1 launch gating:** `PRODUCTION_RELEASE_NOT_APPROVED` (2026-08-22 Training V2 cohort hold)

---

## Decision

| Code | Value |
|------|--------|
| **V1_PUBLIC_LAUNCH_GATE** | `APPROVED` |
| **V1_LAUNCH_MODE** | `MANUAL_MEMBERSHIP_ONLY` |
| **V1_STAGING_GATE** | `DEFERRED` — **not required for V1** |
| **V1_VERIFY_PATH** | `LOCAL_THEN_PRODUCTION` |
| **PADDLE_LIVE_CHECKOUT** | `NOT_APPROVED` |
| **SELF_SERVE_CHECKOUT_MARKETING** | `NOT_APPROVED` until legal entity fields + Paddle E2E are closed |

### Meaning

1. **CEO production gate is closed** for a controlled V1 public presence under **manual membership grant** (admin override).
2. **Staging is not mandatory for V1.** CEO chose speed and simplicity: **test locally → ship to Production** after local pass. A dedicated Staging environment will be introduced in **later releases** when the project and team grow.
3. **Self-serve card checkout stays off** until Paddle sandbox/production validation is explicitly approved.
4. **Legal entity / governing law / effective date** remain TBD in `policy-catalog` — required before any public marketing of self-serve checkout; not required to finish manual-membership technical closure.
5. The 2026-08-22 Training Engine V2 Staging-cohort note remains historical; it no longer blocks V1 manual-membership launch work after this decision.

### Accepted risk (honest)

Skipping Staging removes a second buffer before Production. Mitigation for V1:

- Run local build + targeted tests before every Production push.
- Prefer **additive** migrations; never use Production as a playground.
- Keep audience small via `MANUAL_MEMBERSHIP_ONLY` (no self-serve flood).
- Production smoke checklist is mandatory after deploy (Gate 2).

---

## What this unlocks next (ordered)

1. **P0 — Local verification** — `npm run build` + relevant unit/contract tests + local app smoke (Free preview, Paid manual path if local DB available).
2. **P0 — Production smoke** — Free preview + Paid manual grant + nutrition path on live Production after deploy.
3. **P1 — Legal fields** — CEO supplies entity / law / effective date before self-serve marketing.
4. **P1 — Paddle** — sandbox E2E → `PADDLE = APPROVED` → only then flip launch mode off `MANUAL_MEMBERSHIP_ONLY`.
5. **P2 — Staging (post-V1)** — introduce durable Staging when the project scales; not a V1 blocker.
6. **P2 — Domain cutover** — finish dual-host hygiene when ready.

Tracker: [`V1_CLOSURE_CHECKLIST.md`](./V1_CLOSURE_CHECKLIST.md)

---

## Explicit non-goals of this decision

- Enabling live Paddle/checkout
- Claiming legal entity completeness
- Requiring Staging E2E before V1
- Using Production Supabase as an exploratory test environment (smoke after intentional deploy only)
