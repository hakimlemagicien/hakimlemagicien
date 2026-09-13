# Phase 5 — Visual Evidence (Pilot 4)

Captured from live React route:

`/dev/template-phase5-pilots`

Source: `src/lib/platform/training-templates/pilot-4/` (real Pilot definitions — not Phase 4 fixtures).

| File | Content |
|------|---------|
| `01-pilot-library-cards.png` | All 4 Pilot cards in library grid |
| `02-fat-loss-detail.png` | Fat Loss Pilot full page (detail + preview + resolver) |
| `03-muscle-home-detail.png` | Muscle Gain HOME full page |
| `04-strength-ramp-up.png` | Strength Pilot full page (Upper/Lower ×2 + ramp-up) |
| `04b-strength-preview-roles.png` | Strength read-only preview crop (ramp-up role visible) |
| `05-athletic-power-block.png` | Athletic Pilot full page |
| `05b-athletic-preview-power.png` | Athletic preview crop (Power Skill Block visible) |
| `06-resolver-exact-match.png` | Real resolver exact-match panels (4/4) |
| `07-readonly-preview.png` | Fat Loss read-only preview (10+15 treadmill, 6 mains) |

**Import storage:** LOCAL_CATALOG (Docker local DB unavailable; Staging/Production not touched)  
**List RPC migration:** created locally only — `20260912180000_admin_list_program_templates_contract_metadata.sql` (not applied)  
**TEMPLATES beyond Pilot 4:** 0  
**AUTO_ASSIGNMENT:** No  
**Fixture boundary:** `mergeResolverCatalogPreferringPilots` — real pilots win overlapping routes; fixtures remain for tests/gaps only
