# Performance & Loading Strategy

> **Status:** CEO-approved mandatory standard for all Hakim Coaching Platform development.

## Core Principles

1. **Content first** — UI, text, buttons, cards, and essential data render immediately.
2. **Images never block** — images and secondary data load after the page shell.
3. **No layout shift** — every async element uses skeleton/placeholder with fixed dimensions.
4. **Lazy by default** — off-screen images and below-fold sections load on demand.
5. **Measure before merge** — Lighthouse Performance ≥ 90 on main pages.

## Mandatory Patterns

### Images

Use `OptimizedImage` from `@/components/ui/optimized-image` for all new image usage:

```tsx
import { OptimizedImage } from "@/components/ui/optimized-image";

// Above-the-fold / LCP
<OptimizedImage src={hero} alt="..." priority width={1024} height={1024} />

// Below-the-fold
<OptimizedImage src={thumb} alt="..." width={200} height={200} />
```

Rules:
- Compress all assets before commit (`node scripts/optimize-images.mjs`)
- Prefer WebP/AVIF over JPG/PNG
- Set explicit `width` and `height` to prevent CLS
- `priority` only for LCP candidates (one per page)
- Never load full-resolution images when a thumbnail suffices

### Code Splitting

- Below-fold landing sections: `React.lazy` + `Suspense` (see `src/routes/index.tsx`)
- Heavy vendor libs: split via `manualChunks` in `vite.config.ts`
- New routes: prefer TanStack `.lazy.tsx` files for large pages (e.g. `/quiz`)

### Loading States

| Context | Component |
|---------|-----------|
| Landing sections | `SectionSkeleton` |
| Platform lists | `SectionSkeleton variant="list"` |
| Media thumbnails | `Skeleton` from `@/components/ui/skeleton` |
| General images | Shimmer built into `OptimizedImage` |

**Never** show empty boxes or spinners without layout placeholders.

### Data Loading

- Essential data first, secondary after paint
- React Query defaults: `src/lib/performance/query-client.ts`
- Lists: pagination or infinite scroll when > 50 items
- Never fetch thousands of records in one request

### Caching

- Static assets: stale-while-revalidate via `public/sw.js`
- API data: React Query `staleTime` per query
- Signed media URLs: 50 min client cache (60 min server TTL)

## Performance Budgets (Production)

| Metric | Target |
|--------|--------|
| FCP | < 1.8s |
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| TTI | < 3s |
| Lighthouse Performance | ≥ 90 |

## Pre-Merge Checklist

- [ ] Core content visible without waiting for images
- [ ] Lazy loading on all below-fold images
- [ ] Skeleton/placeholder on async UI
- [ ] No unnecessary requests on page load
- [ ] Code splitting for heavy sections
- [ ] Images compressed and appropriately sized
- [ ] Smooth navigation, no flicker
- [ ] Works on mid-range mobile devices

## Tools

```bash
# Convert assets to WebP (requires sharp)
npm install -D sharp
node scripts/optimize-images.mjs --dry-run   # preview
node scripts/optimize-images.mjs             # convert

# Build verification
npm run build
```

## Phased Rollout

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Infrastructure + landing page | ✅ Done |
| 2 | Platform screens (home, exercises, workout) | 🔄 In progress |
| 3 | Quiz route lazy splitting + image WebP migration | ⏳ Planned |
| 4 | Full asset corpus compression (~54MB → WebP) | ⏳ Planned |
