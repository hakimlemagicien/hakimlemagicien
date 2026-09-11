# MAAKFIT V1 — Closure Checklist

**Authority:** [`CEO_V1_LAUNCH_DECISION.md`](./CEO_V1_LAUNCH_DECISION.md) (2026-09-11)  
**Launch mode:** `MANUAL_MEMBERSHIP_ONLY`  
**Goal:** Close every remaining gate until V1 is publicly operable under manual membership.

---

## Gate 0 — CEO (closed)

| Item | Status |
|------|--------|
| CEO production launch gate | ✅ `APPROVED` — 2026-09-11 |
| Launch mode recorded | ✅ `MANUAL_MEMBERSHIP_ONLY` |
| Live Paddle | ❌ still `NOT_APPROVED` (by design) |

---

## Gate 1 — Staging product loop (P0 — next)

| Item | Status | Notes |
|------|--------|-------|
| Staging migration `client_v1_auto_assign_training` present | ☐ | Confirm RPC on `dxerwrdpcflpnjvsnrjq` |
| Free: personalized preview, 1 exercise/day, no assignment row | ☐ | Staging E2E |
| Paid (admin grant): auto-assign → workout runtime | ☐ | Staging E2E |
| Exception / validation blocked → review queue | ☐ | Staging E2E |
| Failure states (no catalog / blocked) | ☐ | Staging E2E |
| Mobile 390px smoke (home, workout, nutrition) | ☐ | Staging |

**Exit:** `STAGING_V1_LOOP_PASS`

---

## Gate 2 — Production smoke (P0)

| Item | Status | Notes |
|------|--------|-------|
| Required Production migrations present | ☐ | See [`MAAKFIT_V1_PRODUCTION_RELEASE_EXECUTION.md`](./MAAKFIT_V1_PRODUCTION_RELEASE_EXECUTION.md) |
| Free preview smoke on Production | ☐ | |
| Paid manual grant → auto-assign smoke | ☐ | |
| Nutrition Strategy V1 + one swap | ☐ | |
| Coach inbox `/admin/messages` phone + desktop | ☐ | |
| Member billing `/app/billing` readable | ☐ | migration + QA |

**Exit:** `PRODUCTION_SMOKE_PASS`

---

## Gate 3 — Legal for self-serve marketing (P1)

| Item | Status |
|------|--------|
| Legal entity name | ☐ CEO supply |
| Governing law | ☐ CEO supply |
| Policy effective date | ☐ CEO supply |
| `policy-catalog.ts` updated | ☐ |

**Exit:** `LEGAL_FIELDS_COMPLETE` — required before checkout marketing, not before manual-membership ops.

---

## Gate 4 — Payments (P1)

| Item | Status |
|------|--------|
| Paddle sandbox E2E (pay → entitlement → assign) | ☐ |
| `PADDLE = APPROVED` CEO decision | ☐ |
| Flip off `MANUAL_MEMBERSHIP_ONLY` | ☐ only after above |

**Exit:** `SELF_SERVE_CHECKOUT_READY`

---

## Gate 5 — Platform hygiene (P2)

| Item | Status |
|------|--------|
| Canonical Staging URL (PF-4) | ☐ |
| Domain cutover `maakfit.com` complete / dual-host retired | ☐ when ready |
| OS push notifications | ☐ post-V1 |

---

## Current focus

**Done:** Gate 0 — CEO.  
**Now:** Gate 1 — Staging product loop.  
**Agent note (2026-09-11):** this Cloud Agent VM has no `.env.staging.local` / Staging service-role secrets, so live Staging migration + E2E cannot be executed here yet. Provide Staging credentials (or run the scripts from a machine that has them) to continue Gate 1.

**Blocked on CEO:** nothing for Gate 0.  
**Still needs CEO input later:** Gate 3 legal fields (when starting self-serve marketing).
