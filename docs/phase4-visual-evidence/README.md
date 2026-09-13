# Phase 4 — Visual Evidence (LOCAL)

Captured from the live React components at:

`http://127.0.0.1:5173/dev/template-phase4-ui`

Same components wired into:

- `/admin/programs` (`ProgramLibraryManager` + QA demo toggle)
- Client Training Workspace recommendation panel

| # | File | Shows |
|---|------|--------|
| 1 | `01-library-card-and-detail.png` | Template card + detail sections (audience/purpose/readiness) |
| 2 | `02-template-preview.png` | Structure preview (read-only) + QA strip |
| 3 | `03-exact-match-panel.png` / `03-exact-match-recommendation.png` | Exact match recommendation UI |
| 4 | `04-no-exact-match-panel.png` / `04-no-exact-match-glute-home.png` | Glute HOME gap — NO_EXACT_MATCH + NEW_TEMPLATE_RECOMMENDED |
| 5 | `05-review-required-panel.png` | Unknown HOME capability → review |
| 6 | `06-insufficient-context-panel.png` | BOTH/ANYWHERE clarification |
| 7 | `07-coach-override-panel.png` | Coach override vs auto recommendation |

**Preview approach:** safe read-only `TemplateStructurePreview` using existing presentation components. Does **not** create assignment/runtime records. Builder “معاينة كعميل” remains available for phone-style preview.

**TEMPLATES_IMPORTED:** 0  
**AUTO_ASSIGNMENT:** No
