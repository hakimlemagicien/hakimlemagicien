# Profile & Account Center — Delivery Report

> Status: **Phase 1 implemented**  
> Date: 2026-07-18

## Summary

Profile is now a unified **Account Center** at `/app/profile` with 13 sections in the approved order. Sensitive actions open in bottom sheets and confirmation dialogs — not inline in the main scroll.

## Section Order (spec-compliant)

1. Header — الملف الشخصي (no back button from bottom nav)
2. Profile Hero — avatar, name, email, join date, tier badge, member code
3. Membership Card — backend RPC status, features, days ring, upgrade/manage CTA
4. Personal Information — summary grid + edit sheet
5. Goals & Program — from training profile (read-only summary)
6. Activity Summary — 5 stats from Progress sources (links to Progress/Achievements)
7. Account & Security — email, password, sessions, sign-out-all, delete account
8. App Settings — sounds, haptics, Wi-Fi video, quality
9. Notifications — category toggles (marketing off by default)
10. Privacy & Data — photo consent + legal links
11. Support Center — coach WhatsApp (if entitled), help, contact, suggest feature
12. About Platform — build version, legal links, social
13. Logout — confirmation dialog

## Architecture

| Layer | Path |
|-------|------|
| Experience / aggregation | `src/lib/platform/profile-experience.ts` |
| Settings (local) | `src/lib/platform/profile-settings-storage.ts` |
| API / auth | `src/lib/platform/profile-api.ts` (extended) |
| Hook | `src/hooks/useProfileExperience.ts` |
| UI shared | `src/components/platform/profile/ProfileShared.tsx` |
| Sections | `src/components/platform/profile/ProfileSections.tsx` |
| Sheets / dialogs | `src/components/platform/profile/ProfileSheets.tsx` |
| Route | `src/routes/_platform/app/profile.tsx` |

## Data Sources

| Section | Source |
|---------|--------|
| Hero | `profiles` + `useMembership` avatar |
| Membership | `get_my_membership` RPC (raw query — **no Free fallback on error**) |
| Personal info | `profiles` + `training_profiles.answers` + body weight from progress storage |
| Goals & program | `profiles` + `training_profiles` |
| Activity | `buildProgressDashboard()` (same as Progress) |
| Avatar upload | Supabase Storage `avatars` + signed URLs |
| App settings | localStorage |
| Notifications | localStorage |
| Photo consent | `progress-storage` marketing consent |
| App version | `VITE_APP_VERSION` or `1.0.0` |
| Legal docs | `/privacy`, `/terms`, `/refund` routes |

## Security Flows

- **Email change:** Supabase `updateUser({ email })` + verification message shown
- **Password change:** re-auth with current password, then update
- **Sign out all:** `signOut({ scope: 'global' })`
- **Delete account:** 3-step confirmation (request logged — full backend deletion TBD)
- **Avatar:** type/size validation, private bucket, no update until upload succeeds

## Membership Error Handling

When `getMyMembership` fails, the membership card shows **«تعذر التحقق من حالة العضوية»** — not Free.

## Performance

- Section-level skeletons on first load
- Partial refresh via React Query invalidation
- Settings update without full page reload
- `OptimizedImage` for avatar (priority LCP)
- `npm run build` ✅

## QA Checklist

- [ ] Section order matches design
- [ ] Avatar sheet: camera, gallery, delete
- [ ] Edit info validation (height/weight bounds)
- [ ] Membership error state (not Free)
- [ ] Free user sees upgrade CTA
- [ ] Paid user sees active status + days ring
- [ ] Activity stats link to Progress
- [ ] No water tracker / no Discover content on page
- [ ] Logout confirmation
- [ ] Delete account 3-step flow
- [ ] Offline banner
- [ ] Reduce Motion on sheets

## Next Steps

1. Backend account deletion RPC + legal retention policy
2. Sync app/notification settings to Supabase user preferences
3. Push notification permission bridge (system settings deep link)
4. FAQ CMS for help center
5. Biometrics (Face ID) when native wrapper supports secure session storage
