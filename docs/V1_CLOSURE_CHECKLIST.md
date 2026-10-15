# MAAKFIT V1 — Closure Checklist

**Authority:** [`CEO_V1_LAUNCH_DECISION.md`](./CEO_V1_LAUNCH_DECISION.md) (2026-09-11)  
**Launch mode:** `MANUAL_MEMBERSHIP_ONLY`  
**Verify path:** `LOCAL_THEN_PRODUCTION` (Staging deferred post-V1)  
**Goal:** Close every remaining gate until V1 is publicly operable under manual membership.

---

## Gate 0 — CEO (closed)

| Item | Status |
|------|--------|
| CEO production launch gate | ✅ `APPROVED` — 2026-09-11 |
| Launch mode recorded | ✅ `MANUAL_MEMBERSHIP_ONLY` |
| Staging required for V1 | ✅ `DEFERRED` — not required |
| Live Paddle | ❌ still `NOT_APPROVED` (by design) |

---

## Gate 1 — Staging product loop (deferred)

| Item | Status | Notes |
|------|--------|-------|
| Staging E2E / Staging migration gate | ⏭️ `DEFERRED_POST_V1` | CEO: introduce Staging in later releases |

**Exit for V1:** N/A — skipped by CEO decision.

---

## Gate 1b — Local verification (P0 — next)

| Item | Status | Notes |
|------|--------|-------|
| `npm run build` | ☐ | Must pass before Production deploy |
| Targeted contract/unit tests (training/nutrition/billing as touched) | ☐ | `npm test` or scoped suite |
| Local Free preview smoke (if local/dev DB available) | ☐ | 1 exercise/day preview behaviour |
| Local Paid/manual path smoke (if feasible) | ☐ | else cover on Production smoke only |

**Exit:** `LOCAL_V1_VERIFY_PASS`

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

## Gate 5 — Platform hygiene (P2 / post-V1)

| Item | Status |
|------|--------|
| Introduce durable Staging environment | ☐ post-V1 when project scales |
| Canonical Staging URL (PF-4) | ☐ post-V1 |
| Domain cutover `maakfit.com` complete / dual-host retired | ☐ when ready |
| OS push notifications | ☐ post-V1 |

---

## Current focus

**Done:** Gate 0 — CEO (including Staging deferred for V1).  
**Now:** Gate 1b — Local verification → then Gate 2 Production smoke.  

**Blocked on CEO:** nothing for V1 path.  
**Still needs CEO input later:** Gate 3 legal fields (when starting self-serve marketing).
