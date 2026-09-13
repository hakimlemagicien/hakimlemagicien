# Phase 6 — Visual Evidence (Real Local DB)

Captured against **local Supabase** (`127.0.0.1:54321`) with Pilot 4 rows in `program_templates` and Admin/client sessions on Vite `--mode phase6`.

| File | Content |
|------|---------|
| `01-admin-programs-pilot4.png` | `/admin/programs` — 4 published Pilot cards from real DB |
| `01b-phase6-route-library.png` | Same Pilot cards via Admin list RPC (evidence route) |
| `02-admin-pilot-detail.png` | Real Pilot detail (Admin RPC / Phase 6 evidence route) |
| `03-client-recommendation.png` | Client training recommendation from real DB catalog |
| `04-preview-before-assign.png` | Read-only preview before assign |
| `04b-phase6-route-preview.png` | Fat Loss structure preview (roles / treadmill) |
| `05-assignment-confirmation.png` | Manual assign confirmation context |
| `06-assignment-success.png` | Post-assign active program state |
| `07-client-runtime-admin-fat.png` | Admin view of Fat Loss assigned client |
| `08-client-training-runtime.png` | Client `/app/program/workout` consuming real assignment |
| `08b-fat-loss-workout.png` | Fat Loss session (10 min treadmill + warmups + mains) |
| `09-strength-runtime.png` | Strength Intermediate assigned client (admin) |
| `09b-athletic-runtime.png` | Athletic HOME assigned client (admin) |

**Storage:** LOCAL_DB (`database_applied=true`)  
**Templates beyond Pilot 4:** 0  
**AUTO_ASSIGNMENT:** No  
**STAGING / PRODUCTION:** not touched  
**Fixture dependency for Pilot recommendation:** No (`includeInMemoryPilots=false`, `catalogIncludesFixtures=false`)
