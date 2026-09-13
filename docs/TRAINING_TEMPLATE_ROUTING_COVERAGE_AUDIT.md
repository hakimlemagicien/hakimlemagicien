# MAAKFIT — Training Template Routing Coverage Audit (Phase 3)

**Status:** Phase 3 resolver complete (LOCAL)  
**Date:** 2026-09-12  
**Depends on:** [`TRAINING_TEMPLATE_UNIFIED_CONTRACT.md`](./TRAINING_TEMPLATE_UNIFIED_CONTRACT.md)  
**Code:** `src/lib/platform/training-templates/template-coverage-audit.ts`

> This audit uses the **Phase 3 fixture catalog** (synthetic / conceptual variants).  
> It does **not** claim production has 36 templates imported.  
> `TEMPLATES_IMPORTED = 0`. Gaps stay visible — no silent fallbacks.

---

## 1. Primary Strategies (10)

| # | Primary Strategy | Quiz / product surfaces |
|---|------------------|-------------------------|
| 1 | `FAT_LOSS` | `fat` |
| 2 | `MUSCLE_GAIN` | `muscle`, `gain` |
| 3 | `GENERAL_FITNESS` | `fitness`, `fit` |
| 4 | `ATHLETIC_PERFORMANCE` | `athletic` |
| 5 | `BODY_RECOMPOSITION` | `shape`, `waist` (default), `body`, `tone` |
| 6 | `GLUTE_FOCUS` | `glutes` |
| 7 | `STRENGTH` | (no Quiz surface V1 — PRODUCT_RULE_NEEDED) |
| 8 | `ENDURANCE` | (no Quiz surface V1 — PRODUCT_RULE_NEEDED) |
| 9 | `MOBILITY_FUNCTIONAL` | (no Quiz surface V1 — PRODUCT_RULE_NEEDED) |
| 10 | `HEALTHY_AGING_ACTIVE_LIFE` | (no Quiz surface V1 — PRODUCT_RULE_NEEDED) |

---

## 2. Audit matrix dimensions

| Dimension | Values audited |
|-----------|----------------|
| Level | `BEGINNER`, `INTERMEDIATE` |
| Environment | `GYM`, `HOME` |
| Days | `3`, `4`, `5` |

**Total cells:** 10 strategies × 2 levels × 2 environments × 3 day options = **120**

`ADVANCED` is out of V1 client auto-route audit (Coach Custom / future).  
`BOTH` / `ANYWHERE` are **not** matrix cells — resolver returns `INSUFFICIENT_CONTEXT` until coach/product picks GYM or HOME (see §9).

---

## 3. Known approved fixture variants (exact cells)

Fixture catalog = conceptual coverage for resolver QA. Assignable published fixtures with exact Strategy×Level×Env×Days:

| Strategy | Level | Env | Days | Slug(s) |
|----------|-------|-----|------|---------|
| FAT_LOSS | BEGINNER | GYM | 3 | `FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D` |
| FAT_LOSS | BEGINNER | HOME | 3 | `FAT_LOSS_FOUNDATION_BEGINNER_HOME_3D` |
| FAT_LOSS | INTERMEDIATE | GYM | 4 | `FAT_LOSS_PROGRESS_INTERMEDIATE_GYM_4D` |
| MUSCLE_GAIN | BEGINNER | GYM | 3 | `MUSCLE_GAIN_FOUNDATION_BEGINNER_GYM_3D` |
| MUSCLE_GAIN | BEGINNER | HOME | 3 | Foundation + V2 + legacy + band-anchor fixture |
| MUSCLE_GAIN | INTERMEDIATE | HOME | 4 | `MUSCLE_GAIN_PROGRESS_INTERMEDIATE_HOME_4D` |
| MUSCLE_GAIN | INTERMEDIATE | GYM | 5 | `MUSCLE_GAIN_PROGRESS_INTERMEDIATE_GYM_5D` |
| GENERAL_FITNESS | BEGINNER | GYM | 3 | `GENERAL_FITNESS_FOUNDATION_BEGINNER_GYM_3D` |
| ATHLETIC_PERFORMANCE | BEGINNER | HOME | 3 | `ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_HOME_3D` |
| BODY_RECOMPOSITION | BEGINNER | GYM | 3 | `BODY_RECOMPOSITION_FOUNDATION_BEGINNER_GYM_3D` |
| BODY_RECOMPOSITION | BEGINNER | HOME | 3 | `BODY_RECOMPOSITION_FOUNDATION_BEGINNER_HOME_3D` |
| GLUTE_FOCUS | BEGINNER | GYM | 3 | `GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D` |

**Exact route coverage (fixture):** **12 / 120** cells (`EXACT_TEMPLATE_AVAILABLE`)  
**Gaps:** **108 / 120** cells (`NO_EXACT_TEMPLATE`)

Draft / archived / `MISSING_EXERCISE` fixtures are **not** counted as coverage.

---

## 4. Level coverage (fixture)

| Strategy | BEGINNER exact? | INTERMEDIATE exact? |
|----------|-----------------|---------------------|
| FAT_LOSS | Yes (GYM 3, HOME 3) | Partial (GYM 4 only) |
| MUSCLE_GAIN | Yes (GYM 3, HOME 3) | Partial (HOME 4, GYM 5) |
| GENERAL_FITNESS | Partial (GYM 3 only) | **No** — gap |
| ATHLETIC_PERFORMANCE | Partial (HOME 3 only) | **No** |
| BODY_RECOMPOSITION | Partial (GYM/HOME 3) | **No** |
| GLUTE_FOCUS | Partial (GYM 3 only) | **No** |
| STRENGTH / ENDURANCE / MOBILITY / HEALTHY_AGING | **No** | **No** |

---

## 5. Environment coverage (fixture)

| Strategy | GYM | HOME |
|----------|-----|------|
| FAT_LOSS | Yes (some days) | Yes (BEGINNER 3 only) |
| MUSCLE_GAIN | Yes | Yes |
| GENERAL_FITNESS | Yes (BEGINNER 3) | **No** |
| ATHLETIC_PERFORMANCE | **No** | Yes (BEGINNER 3) |
| BODY_RECOMPOSITION | Yes (BEGINNER 3) | Yes (BEGINNER 3) |
| GLUTE_FOCUS | Yes (BEGINNER 3) | **No — intentional gap** |

---

## 6. Day coverage (fixture)

Most strategies only cover **one** day frequency per level/env combo.  
Missing day frequencies return `NO_EXACT_MATCH` + `TRAINING_FREQUENCY_REVIEW_RECOMMENDED`.  
**No silent day downgrade** (5→4, 4→3, etc.).

---

## 7. Exact route coverage summary

```
EXACT_TEMPLATE_AVAILABLE : 12
NO_EXACT_TEMPLATE        : 108
```

36 production templates (future import) will **not** fill 120 cells.  
Expect many `NO_EXACT_MATCH` / Coach Custom routes even after import.

---

## 8. Priority gaps (must stay visible)

### 8.1 GLUTE_FOCUS + HOME (all levels × days)

| Cell | Status | Action |
|------|--------|--------|
| GLUTE_FOCUS × BEGINNER × HOME × 3/4/5 | NO_EXACT_TEMPLATE | **NEW_TEMPLATE_RECOMMENDED** |
| GLUTE_FOCUS × INTERMEDIATE × HOME × * | NO_EXACT_TEMPLATE | **NEW_TEMPLATE_RECOMMENDED** |

**Resolver behavior (verified):**

```
CLIENT: glutes + BEGINNER + HOME + 3D
RESULT: NO_EXACT_MATCH
WHY: No approved GLUTE_FOCUS / BEGINNER / HOME / 3D template
REVIEW: NEW_TEMPLATE_RECOMMENDED + COACH_REVIEW_REQUIRED
```

Do **not** silently recommend `MUSCLE_GAIN_*` as exact.

### 8.2 GENERAL_FITNESS + INTERMEDIATE (all env × days)

| Cell | Status | Action |
|------|--------|--------|
| GENERAL_FITNESS × INTERMEDIATE × GYM/HOME × 3/4/5 | NO_EXACT_TEMPLATE | **NEW_TEMPLATE_RECOMMENDED** |

### 8.3 FAT_LOSS + HOME (beyond BEGINNER 3)

| Cell | Status | Action |
|------|--------|--------|
| FAT_LOSS × BEGINNER × HOME × 4/5 | NO_EXACT_TEMPLATE | NEW_TEMPLATE_RECOMMENDED |
| FAT_LOSS × INTERMEDIATE × HOME × 3/4/5 | NO_EXACT_TEMPLATE | NEW_TEMPLATE_RECOMMENDED |

BEGINNER HOME 3 **is** covered in fixtures.

### 8.4 Strategies without Quiz auto-route

`STRENGTH`, `ENDURANCE`, `MOBILITY_FUNCTIONAL`, `HEALTHY_AGING_ACTIVE_LIFE`  
→ all cells: **PRODUCT_RULE_NEEDED** (or ACCEPTABLE_COACH_CUSTOM until product defines Quiz/V2 entry).

---

## 9. BOTH / ANYWHERE environment policy (Phase 3)

Client environment `BOTH` / `ANYWHERE` / `HYBRID`:

- Resolver does **not** silently map to HOME or GYM.
- Status: `INSUFFICIENT_CONTEXT`
- Trace note: `CLIENT_ENVIRONMENT_AMBIGUOUS_BOTH_ANYWHERE`
- Coach / Phase 4 UI must choose an environment before exact match is possible.

Evaluating both catalogs without an explicit selection would hide which environment was chosen; Phase 3 fails closed instead.

---

## 10. Gap action legend

| Action | Meaning |
|--------|---------|
| `NEW_TEMPLATE_RECOMMENDED` | Add a published variant (e.g. Glute HOME) |
| `ACCEPTABLE_COACH_CUSTOM` | Coach Custom assignment is OK for rare routes |
| `PRODUCT_RULE_NEEDED` | Need product entry path (Quiz/V2) before templates matter |
| `CONTEXT_DATA_MISSING` | Client context incomplete (level/env/days/equipment) |

---

## 11. Example resolver inspections (Phase 3)

### Exact match

```
CLIENT CONTEXT:
Goal: Muscle Gain
Level: Beginner
Environment: HOME
Days: 3

RESOLVER RESULT: MATCHED
RECOMMENDED: MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D_V2 (tie-break: higher version)
WHY: Exact goal + level + environment + days; published + READY
```

### Visible gap

```
CLIENT CONTEXT:
Goal: Glute Focus
Level: Beginner
Environment: HOME
Days: 3

RESOLVER RESULT: NO_EXACT_MATCH
WHY: No approved GLUTE_FOCUS / BEGINNER / HOME / 3D template
REVIEW: NEW_TEMPLATE_RECOMMENDED
```

---

## 12. Regenerating the matrix

```ts
import { auditTemplateCoverage, summarizeCoverageGaps } from "@/lib/platform/training-templates";

const cells = auditTemplateCoverage();
const gaps = summarizeCoverageGaps(cells);
```

Replace fixture catalog with production `program_templates` + `metadata.template_contract` in a later phase — **do not** invent coverage by fallback.

---

## 13. Phase boundary

| Item | Status |
|------|--------|
| Template Resolver | Done |
| Coverage audit | Done |
| Template import | **0** |
| Admin UI (Phase 4) | Not started |
| Auto-assign | **No** |
| Staging / Production DB | Unchanged |
