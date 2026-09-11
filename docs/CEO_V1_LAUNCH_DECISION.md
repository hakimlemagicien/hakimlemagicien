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
| **PADDLE_LIVE_CHECKOUT** | `NOT_APPROVED` |
| **SELF_SERVE_CHECKOUT_MARKETING** | `NOT_APPROVED` until legal entity fields + Paddle E2E are closed |

### Meaning

1. **CEO production gate is closed** for a controlled V1 public presence: the product may proceed through remaining technical closure (Staging QA → Production smoke) under **manual membership grant** (admin override).
2. **Self-serve card checkout stays off** until Paddle sandbox/production validation is explicitly approved.
3. **Legal entity / governing law / effective date** remain TBD in `policy-catalog` — required before any public marketing of self-serve checkout; not required to finish manual-membership technical closure.
4. The 2026-08-22 Training Engine V2 note (`STAGING_COHORT_APPROVED`) remains historical context for the V2 pin; it no longer blocks V1 manual-membership launch work after this decision.

---

## What this unlocks next (ordered)

1. **P0 — Staging live verification** — apply/confirm auto-assign migration on Staging; run Free / Paid / Exception / Failure + 390px smoke.
2. **P0 — Production smoke** — Free preview + Paid manual grant + nutrition path after Staging sign-off.
3. **P1 — Legal fields** — CEO supplies entity / law / effective date before self-serve marketing.
4. **P1 — Paddle** — sandbox E2E → `PADDLE = APPROVED` → only then flip launch mode off `MANUAL_MEMBERSHIP_ONLY`.
5. **P2 — Domain cutover + Staging canonical URL (PF-4)** — finish dual-host / staging hostname hygiene.

Tracker: [`V1_CLOSURE_CHECKLIST.md`](./V1_CLOSURE_CHECKLIST.md)

---

## Explicit non-goals of this decision

- Enabling live Paddle/checkout
- Claiming legal entity completeness
- Skipping Staging E2E
- Using Production Supabase as a test environment
