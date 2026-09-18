# MAAKFIT Admin Command Center — Operational Control Plane

> عقد قوالب التغذية ودورة النشر موثّقان تفصيليًا في [NUTRITION_TEMPLATE_CATALOG_V1.md](./NUTRITION_TEMPLATE_CATALOG_V1.md).

**Status:** Mobile Admin Command Center V1 contract
**Audience:** Platform + Admin implementers  
**Related:** [`APP_ARCHITECTURE.md`](./APP_ARCHITECTURE.md), [`ENVIRONMENTS.md`](./ENVIRONMENTS.md)

---

## 1. Role

`/admin` is the **operational control plane** for MAAKFIT:

| Controls | Does not control |
|----------|------------------|
| Clients | Marketing Landing (`/coaching`) design |
| Training assignments (client snapshots) | Quiz UI redesign |
| Nutrition assignments | Software feature shipping |
| Membership operational state | Production env secrets |
| Content publish state (Discover CMS) | Force-push / history rewrite |

Coach/admin daily work happens **runtime** against Supabase. Clients see updates according to assignment / publish state — **not** after a Vercel deploy.

---

## 2. CODE DEPLOY ≠ CONTENT PUBLISH (P0)

| Change class | Examples | Required path |
|--------------|----------|---------------|
| **ADMIN CONTENT CHANGE** | Replace exercise on client program, edit sets/reps, swap meal, assign nutrition, activate membership | Admin UI → RPC → DB. **No code deploy.** |
| **SOFTWARE FEATURE CHANGE** | New admin screen, bottom nav, bug in editor UI | PR → build → deploy |
| **DATABASE SCHEMA CHANGE** | New tables/RPCs/RLS | `supabase/migrations/` → Staging → Production |

**Forbidden for operational content:**

```
Admin change → edit TypeScript seed → commit → push → Vercel deploy
```

**Allowed:**

```
Admin UI → Supabase (assignment / library / membership RPCs) → Client /app runtime
```

Constants: `ADMIN_CHANGE_CLASSES` in `src/lib/admin/admin-architecture.ts`.

---

## 3. Template ≠ Assignment

| Boundary | Meaning |
|----------|---------|
| `PROGRAM_TEMPLATE` | Catalog / builder source |
| `CLIENT_ASSIGNED_PROGRAM` | Immutable-at-assign snapshot for one client (editable via client assignment RPCs) |
| `MEAL_LIBRARY_RECORD` | Nutrition library source |
| `CLIENT_ASSIGNED_MEAL` / `CLIENT_NUTRITION_ASSIGNMENT` | Client nutrition snapshot |

Editing a **template** must not rewrite historical client assignments unless an explicit re-assign / new version flow is chosen.

---

## 4. Draft ≠ Published

| Layer | Draft | Published / Active |
|-------|-------|--------------------|
| Program templates | `is_published = false` | `admin_publish_program_template` |
| Client training assignment | `admin_create_client_program_draft` + draft tree | `admin_publish_client_program_draft`; العميل يقرأ active/scheduled فقط |
| Client nutrition | `admin_create_client_nutrition_draft` + draft slots | `admin_publish_client_nutrition_draft`; العميل يقرأ active/scheduled فقط |

**Auto-save (if enabled) must never equal Publish.**

The official lifecycle is:

```
Master Template → Auto Assign → Client Copy → Client Override
```

- A master edit never silently rewrites existing client copies.
- Client override creates/edits that client’s draft only.
- Published V1 stays live while Draft V2 is edited.
- Preview is read-only and never promotes a draft.

### Deterministic automation rules

`program_automation_rules` maps `goal + gender + level + training days` to a
published training template. Once the owner publishes rules for a demographic,
auto-assignment accepts only an exact-day rule or an explicitly marked fallback
within the **same goal, gender and level**. A missing managed mapping fails
closed and surfaces in Alerts; it never crosses gender or goal.

The versioned Nutrition Template catalog is the source used to create a
client-specific nutrition copy. The admin assignment flow saves the client's
calculation inputs, allergy status, disliked foods and training-meal window,
then creates either a draft or an explicitly published assignment. Admin reads
of another client's protected journey data use admin-only RPCs; direct client
RLS reads must not be used as a shortcut.

### Nutrition operating rules

- A published meal-library record can be created or edited from Admin, uploaded
  with its image, previewed as the client will see it, and selected in a
  template without a code deploy.
- Client setup order is: **allergy status → disliked foods → training time**.
- Known allergens and disliked-food terms filter generated choices and meal
  replacements. If no safe choice exists, generation fails closed.
- `Save` creates a draft. `Publish` alone makes the assignment client-visible.
- Template edits never rewrite an existing client assignment. Reassignment or
  a new client version is always explicit.
- Nutrition profile inputs and the training-meal window can be completed by an
  authorized admin in the assignment sheet; each mutation is audited.

---

## 5. Pricing, promotions and promo codes

`product_prices` is the versioned base-price source of truth. `product_promotions`
contains time-bounded global campaigns. `promo_codes` contains eligibility and
usage rules; redemptions are recorded separately.

Both UI and checkout must call `resolve_public_offer(plan, term, code)`. The
response uses server time and the stored `ends_at`; countdowns may not restart
on refresh. A client-provided UI price is never authoritative.

Lifecycle:

- Draft: editable, not customer-visible.
- Active/published: server-eligible inside its real time window.
- Paused: stored but not applicable.
- Ended/expired: cannot apply.

Provider-specific discounts still require a matching PSP price/coupon binding.
Until that binding exists, the UI must fail closed rather than charge a
different amount.

---

## 6. View as client

`/admin/client-preview/$clientId` uses
`admin_get_client_experience_preview`. It is read-only and shows the selected
client’s Home, Training, Nutrition and lock/membership state from latest
published/active assignments. Drafts are intentionally excluded. This is the
pre-release check for goal, gender, media, template and membership mistakes.

---

## 7. Alerts, audit and notification expectations

- Alerts are grounded queries (missing assignment, failed journey, bad campaign)
  and deep-link to the repair screen.
- Every price, campaign, code, automation and runtime-setting mutation writes an
  audit event with actor, entity, time and relevant before/after metadata where
  practical.
- CRITICAL notifications may use a strong professional sound; IMPORTANT uses a
  subtle sound; INFO is silent by default.
- Sound requires browser/PWA permission and user interaction. Quiet hours and
  per-operator preferences must be respected.
- Client, membership-segment and all-client messages are delivered through
  `client_list_product_notifications`; eligibility and read state are checked
  server-side. Client notifications may deep-link only inside `/app`, while
  admin notifications may deep-link only inside `/admin`.

---

## 8. Safe product settings boundary

Allowed: preparation timer, completion window, FREE promo media URL, safe CTA
copy, checkout/promotion/signup emergency toggles when runtime enforcement
exists.

Never expose through Admin UI: RLS, secrets, database schema, migrations, Git,
Vercel or architecture-sensitive configuration.

---

## 9. Mobile Admin shell

On viewports ≤960px:

- **Bottom navigation:** الرئيسية · العملاء · التدريب · التغذية · المزيد
- Desktop **sidebar is not** shown as a shrunk drawer
- «المزيد» sheet holds memberships, payments, messages, content, settings, …

Desktop keeps the full Command Center sidebar.

---

## 10. Security

`/admin` remains role-protected (`checkAdminAccess` + staff permissions). Mutations go through **SECURITY DEFINER RPCs + RLS**, not UI hiding alone.

---

## 11. Acceptance gate (content without deploy)

**PASS** when:

1. Phone → `/admin` → Client → Training → replace exercise / edit sets → save → client sees update **without** git/deploy  
2. Same for Nutrition meal replace / serving → client sees update **without** git/deploy  

If either fails, Mobile Admin Command Center V1 is **not** closed.
