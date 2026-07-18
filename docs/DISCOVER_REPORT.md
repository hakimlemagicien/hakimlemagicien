# Discover & Content Experience — Delivery Report

> Status: **Phase 1 implemented** (frontend + seed CMS layer + Supabase schema).  
> Date: 2026-07-18

## Summary

Discover is now a standalone magazine feed at `/app/discover`, separated from the user's personal workout/nutrition/progress data. Content is driven by a unified content model with seed data and a Supabase CMS schema ready for admin publishing without app redeploys.

## Content Architecture

### Unified content model

File: `src/lib/platform/discover-content.ts`

Each item includes: `id`, `type`, `title`, `slug`, `shortDescription`, `body`, `categoryId`, `coverImage`, `authorName`, `publishDate`, `tags`, `featured`, `accessLevel`, `status`, plus type-specific payloads (`recipe`, `challenge`, `successStory`).

### Content types implemented

| Type | Status |
|------|--------|
| Article | ✅ |
| Video | ✅ (thumbnail in feed; no autoplay) |
| Recipe | ✅ |
| Success Story | ✅ (consent gate) |
| Challenge | ✅ (optional join) |
| Daily Tip | ✅ |
| Platform Update | ✅ |
| Promotional | ✅ (model ready) |

### Publishing states

Logic in `isDiscoverPublished()`:

- **Draft** / **Unpublished** / **Archived** → hidden from users
- **Scheduled** → visible only after `publishDate`
- **Published** → visible per access level

Backend enforcement is defined in Supabase RLS (`discover_content_public_read` policy).

## CMS System

### Current runtime

- **Seed layer**: `DISCOVER_CONTENT_SEED` powers the UI immediately
- **Fetch layer**: `fetchDiscoverFeed()` / `fetchDiscoverContent()` — swap internals to Supabase when tables are populated

### Database (migration)

`supabase/migrations/20260718100000_discover_content_cms.sql`

Tables:

- `discover_categories`
- `discover_content` (+ `type_payload` JSONB)
- `discover_content_saves`
- `discover_content_likes`
- `discover_success_consents`

Admin CRUD via `has_role(auth.uid(), 'admin')`. Public read limited to published/scheduled content.

### Admin roles (planned workflow)

| Role | Capability |
|------|------------|
| Content Editor | Create/edit drafts |
| Content Reviewer | Review drafts |
| Content Publisher | Publish / schedule |
| Admin | Full access + consent management |

Audit fields on `discover_content`: `created_by`, `updated_by`, `published_by`.

## Routes & UX

| Route | Purpose |
|-------|---------|
| `/app/discover` | Main feed (fixed section order) |
| `/app/discover/search` | Search + filters + recent queries |
| `/app/discover/saved` | Saved content library |
| `/app/discover/category/$slug` | Unified category listing |
| `/app/discover/$slug` | Content details (type-adaptive) |

### Feed section order (spec-compliant)

1. Header  
2. Search bar  
3. Featured carousel  
4. Categories  
5. Daily tip  
6. Videos  
7. Articles  
8. Success stories  
9. Challenges  
10. Healthy recipes  
11. Recent content  

Empty sections are hidden (no placeholder gaps).

## Premium Protection

- `accessLevel: premium` on content items
- `useDiscoverAccess()` + membership tier check (`isPaidMembershipTier`)
- Locked detail view shows summary + upgrade CTA via `MembershipUpgradeSheet`
- Backend RLS + membership RPC remain source of truth (no frontend-only hiding)

## Search & Filters

- Debounce: **400ms** (`useDebouncedValue`)
- Search fields: title, description, body, tags, category, author, type
- Filters: all, videos, articles, recipes, success stories, challenges, tips
- Recent searches stored locally (`discover-storage.ts`), clearable
- Empty/error states per spec

## Save & Like

- Local optimistic saves/likes: `src/lib/platform/discover-storage.ts`
- Supabase tables ready for cross-device sync (`discover_content_saves`, `discover_content_likes`)
- Duplicate save/like prevented by Set semantics

## Success Story Consent

- Stories only render when `successStory.consentApproved === true`
- `discover_success_consents` table for documented approvals
- Disclaimer shown on cards and detail pages
- Before/after images only when consent includes them

## Performance

- `OptimizedImage` on all cards and hero
- Featured carousel: manual + optional auto-scroll, pauses on interaction / off-screen / `prefers-reduced-motion`
- Section-level skeletons (`DiscoverFeedSkeleton`)
- React Query caching (`staleTime: 60s`) + pull-to-refresh equivalent (update button)
- No full-screen spinner; no video preload in feed
- Build verified: `npm run build` ✅

## Accessibility & Motion

- Touch targets ≥ 44px on primary actions
- ARIA labels on carousel, save, search
- `useReducedMotion` on section animations and carousel auto-scroll
- RTL + Cairo typography via existing platform styles

## Offline

- Banner when offline (`DiscoverOfflineBanner`)
- Cached feed via React Query placeholderData
- Unavailable content state on detail when offline/missing

## Analytics (hooks ready)

Events to wire in Phase 2: open Discover, search, category select, content open, save, share, like, premium gate, challenge join.

## QA Checklist (for 🧪 QA Manager)

- [ ] Feed section order matches spec
- [ ] Empty sections hidden
- [ ] Search debounce + filters
- [ ] Premium lock on detail
- [ ] Save/remove from saved
- [ ] Challenge join (no duplicate)
- [ ] Success stories show disclaimer
- [ ] Carousel reduce-motion
- [ ] No personal program data on Discover
- [ ] Performance ≥ 90 Lighthouse on `/app/discover`

## Next Steps

1. Populate Supabase tables + admin UI (or Supabase Studio)  
2. Replace seed fetch with Supabase queries  
3. Sync saves/likes to backend for multi-device  
4. Video player integration with view-count RPC  
5. Public SEO pages (when web indexable routes are approved)
