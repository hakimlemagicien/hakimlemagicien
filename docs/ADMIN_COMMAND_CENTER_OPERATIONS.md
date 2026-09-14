# MAAKFIT Admin Command Center — Operational Control Plane

**Status:** Living architecture contract  
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

## 4. Draft ≠ Published (product intent)

| Layer | Draft | Published / Active |
|-------|-------|--------------------|
| Program templates | `is_published = false` | `admin_publish_program_template` |
| Client training assignment | Prefer edit → confirm → active/scheduled | Client runtime reads active assignment |
| Client nutrition | Assign / Strategy generate with confirm | Active assignment visible in `/app` |

**Auto-save (if enabled) must never equal Publish.**

---

## 5. Mobile Admin shell

On viewports ≤960px:

- **Bottom navigation:** الرئيسية · العملاء · التدريب · التغذية · المزيد
- Desktop **sidebar is not** shown as a shrunk drawer
- «المزيد» sheet holds memberships, payments, messages, content, settings, …

Desktop keeps the full Command Center sidebar.

---

## 6. Security

`/admin` remains role-protected (`checkAdminAccess` + staff permissions). Mutations go through **SECURITY DEFINER RPCs + RLS**, not UI hiding alone.

---

## 7. Acceptance gate (content without deploy)

**PASS** when:

1. Phone → `/admin` → Client → Training → replace exercise / edit sets → save → client sees update **without** git/deploy  
2. Same for Nutrition meal replace / serving → client sees update **without** git/deploy  

If either fails, Mobile Admin Command Center V1 is **not** closed.
