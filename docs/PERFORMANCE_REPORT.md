# Performance Implementation Report

**Date:** 2026-07-13  
**Decision:** CEO Performance & Loading Strategy — approved for execution  
**Phase:** 1 (Infrastructure + Landing Page)

---

## Executive Summary

Phase 1 establishes the mandatory performance infrastructure and applies it to the highest-traffic entry points. The landing page now loads above-fold content immediately while deferring six heavy below-fold sections via code splitting. Platform exercise and home screens use skeleton loading instead of spinners.

---

## Baseline (Before)

| Area | Finding |
|------|---------|
| **Assets** | ~101 images, ~54 MB (75 JPG, 40 PNG, 1 WebP) |
| **Code splitting** | None — all routes statically imported |
| **Lazy loading** | Partial — ~12 `<img>` tags with `loading="lazy"` |
| **Skeletons** | `SkeletonBlock` defined but unused; spinners everywhere |
| **React Query** | Default options (no global `staleTime`) |
| **LCP** | Coach photo PNG, no `fetchPriority`, no preload |
| **Vite chunks** | No `manualChunks` — single large vendor bundle risk |

### Estimated Impact Areas

| Screen | Risk |
|--------|------|
| `/` Landing | 40+ eager image imports, all sections bundled together |
| `/quiz` | 5,886 lines, 59 asset imports — largest single chunk |
| `/app/exercises` | Full catalog fetch, spinner-only loading |
| `/app` home | Featured images without lazy loading |

---

## Changes Implemented (Phase 1)

### 1. Performance Infrastructure

| File | Change |
|------|--------|
| `src/components/ui/optimized-image.tsx` | Standard image component: lazy load, shimmer, CLS-safe dimensions, `priority` for LCP |
| `src/components/ui/section-skeleton.tsx` | Section placeholders for code-split boundaries |
| `src/lib/performance/query-client.ts` | Global React Query defaults (`staleTime: 60s`, `refetchOnWindowFocus: false`) |
| `scripts/optimize-images.mjs` | WebP conversion pipeline for `src/assets/` |
| `docs/PERFORMANCE.md` | Official developer reference |

### 2. Build Optimization

**`vite.config.ts`** — vendor chunk splitting:
- `vendor-motion` (framer-motion)
- `vendor-swiper` (swiper)
- `vendor-charts` (recharts)
- `vendor-radix`, `vendor-supabase`, `vendor-tanstack`
- Generic `vendor` fallback

### 3. Landing Page (`/`)

| Optimization | Detail |
|-------------|--------|
| Code splitting | 6 below-fold sections lazy-loaded via `React.lazy` + `Suspense` |
| LCP preload | `<link rel="preload">` for coach photo in route head |
| LCP hints | `fetchPriority="high"` + `decoding="async"` on hero coach images |
| Skeleton fallbacks | `SectionSkeleton` per section type during chunk load |

**Sections now split:** ProblemSection, HowItWorks, SuccessStories, PricingTransparency, FAQ, FinalCTA

### 4. Platform Screens

| Screen | Change |
|--------|--------|
| `/app/exercises` | `SectionSkeleton` list instead of centered spinner |
| Exercise thumbnails | `Skeleton` shimmer instead of `LoaderCircle` |
| `/app` home | `OptimizedImage` on featured cards + user avatar |
| Premium preview grid | `OptimizedImage` with lazy loading |

### 5. Router

- `createAppQueryClient()` replaces bare `new QueryClient()` — reduces unnecessary refetches

---

## Expected Improvements

| Metric | Expected Direction |
|--------|-------------------|
| **Initial JS (landing)** | ↓ Smaller first chunk — 6 sections deferred |
| **FCP** | ↓ Less JS to parse before first paint |
| **LCP** | ↓ Coach image preloaded with high priority |
| **CLS** | ↓ Skeleton placeholders maintain layout |
| **TTI** | ↓ Vendor chunks cached independently |
| **Perceived speed** | ↑ Content visible while images load |

> **Note:** Exact Lighthouse scores require a production deployment measurement. Run Lighthouse on `/` and `/app` after deploy to capture before/after numbers.

---

## Remaining Work (Phases 2–4)

### Phase 2 — Platform (In Progress)
- [ ] Workout session: skeleton layout for exercise list
- [ ] Exercise detail: skeleton for video areas
- [ ] Batch signed URL fetching in `useTodayWorkout`
- [ ] Review `useMembership` 20s polling impact

### Phase 3 — Quiz Route
- [ ] Split `quiz.tsx` (5,886 lines) into lazy step components
- [ ] Apply `OptimizedImage` to all 59 quiz asset imports
- [ ] Remove `/quiz` from SW precache until chunk size reduced

### Phase 4 — Asset Pipeline
- [ ] Run `node scripts/optimize-images.mjs` on full corpus
- [ ] Migrate imports from JPG/PNG → WebP
- [ ] Remove original uncompressed files
- [ ] Target: ~54 MB → ~8–12 MB estimated

### Phase 5 — Advanced
- [ ] `@tanstack/react-virtual` for exercise library when catalog > 100
- [ ] TanStack Router `.lazy.tsx` for admin and studio routes
- [ ] Font subsetting (Tajawal/Cairo — currently full weight range from Google)
- [ ] CI Lighthouse budget gate

---

## How to Measure

```bash
# Local production build
npm run build && npm run preview

# Lighthouse CLI (if installed)
npx lighthouse http://localhost:4173 --only-categories=performance --view
npx lighthouse http://localhost:4173/app --only-categories=performance --view
```

### Acceptance Criteria (CEO Policy)

- [x] Core content appears immediately on landing
- [x] Lazy loading infrastructure in place
- [x] Skeleton/placeholder on async platform UI
- [x] Code splitting on landing page
- [x] Build-time vendor chunk splitting
- [x] Performance policy documented
- [ ] Lighthouse ≥ 90 (requires production measurement)
- [ ] Full image corpus compressed to WebP
- [ ] Quiz route split and optimized

---

## Sign-Off

| Role | Status |
|------|--------|
| CEO Decision | ✅ Approved |
| Phase 1 Implementation | ✅ Complete |
| Phase 2–4 | ⏳ Scheduled |
