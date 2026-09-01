# MAAKFIT Training Calendar & Muscle Mapping Fix Report

**Status:** `TRAINING_CALENDAR_AND_MUSCLE_VISUAL_FIXED_READY_FOR_QA`  
**Environment:** STAGING ONLY (local verification)  
**Date:** 2026-09-01  
**Training Strategy:** NOT MODIFIED

---

## Issue 1 — Weekly strip showed all days as training

### Root cause

**Presentation + integration layer (UI/runtime mapping), not Strategy Matrix.**

1. **Free preview path** in `resolveWeekdayPlan()` forced `isRestDay: false` on every weekday (including catalog rest days Sun/Sat) so the strip rendered **7/7 as تمرين**.
2. **`buildWeeklySchedule()`** preferred `freeMember` over `assignedPlans`, so even assigned clients in preview entitlement mode ignored runtime calendar plans.
3. **`buildWeekdayPlansForAssignedRuntime()`** returned early to legacy `day_number` mapping when `strategy === null`, even though `buildWeeklyScheduleForRuntime()` can place sessions using `assignment.days_per_week` alone. That skipped Weekly Calendar placement whenever profile strategy was still loading or unresolved.

### Runtime vs UI

| Layer | Verdict |
|-------|---------|
| Strategy Matrix / `calendar-resolver` | Correct — produces N workout + (7−N) rest days |
| Runtime mapping | **Bug** — calendar skipped when strategy null |
| UI strip | **Bug** — free preview flattened rest days |

### Fix

- `buildWeekdayPlansForAssignedRuntime()` always attempts Weekly Calendar via `assignment.days_per_week` before legacy fallback.
- `buildWeeklySchedule()` uses `assignedPlans` whenever present (paid runtime wins over preview catalog).
- `resolveWeekdayPlan()` preserves catalog rest days for free preview; only workout days get preview prescriptions.

### Training/Rest source after fix

```
Client Training Profile
  → Strategy Matrix (when resolved) OR assignment.days_per_week fallback
  → Weekly Calendar (`resolveWeeklyTrainingSchedule`)
  → `applyWeeklyScheduleToWeekdayPlans`
  → `useProgramContinuity().assignedPlans`
  → `buildWeeklySchedule()` → WeekDayButton (تمرين / راحة)
```

For `training_days_per_week = 3`: **exactly 3 training days + 4 rest days** (verified in tests).

---

## Issue 2 — Session muscle visual mismatch

### Root cause

**UI-only static asset.**

`TodayWorkoutBriefCard` always rendered `muscle-anatomy-chest-biceps.png` regardless of session muscles. Free catalog leg day also used chest exercise IDs in prescriptions (secondary data bug).

### Fix

- New `session-muscle-presentation.ts` derives muscles from session exercises + focus text.
- New `SessionAnatomyVisual` component:
  - Primary: per-exercise anatomy WebP (`/exercises/{id}/anatomy/anatomy.webp`) when available
  - Fallback: highlighted SVG overlay + filtered base anatomy image
- Free catalog `LEG_DAY` now uses `LE-001`, `LE-004`, `GL-001`.

### Muscle mapping source

```
Assigned Session prescriptions
  → exercise external_ids (+ loaded primary_muscle when available)
  → summarizeSessionMuscles()
  → SessionMuscleSummary { regions, visualKey, displayNameAr, dominantExternalId }
  → SessionAnatomyVisual
```

---

## Issue 3 — Session display name

### Source after fix

```
Session exercises + muscle_focus
  → summarizeSessionMuscles()
  → buildSessionDisplayName()  (Arabic: أرجل، صدر وترايسبس، ظهر وبايسبس، الجزء العلوي، الجسم كامل)
  → applied in runtimeDayToPlan / runtimeToWeekdayPlans
  → reinforced in workout UI via resolveSessionPresentation()
```

Names are no longer taken from a static card image or a single hardcoded PNG.

---

## Files modified

| File | Change |
|------|--------|
| `src/lib/platform/weekly-workout-schedule.ts` | Rest-day preservation, strip data source, leg catalog exercises |
| `src/lib/platform/strategy-matrix/calendar-runtime.ts` | Calendar without strategy; أرجل focus |
| `src/lib/platform/assigned-program-api.ts` | Session display names from muscles |
| `src/lib/platform/continuity/apply.ts` | Session display names from muscles |
| `src/lib/platform/session-muscle-presentation.ts` | **New** muscle summary + naming + visual key |
| `src/components/platform/workout/SessionAnatomyVisual.tsx` | **New** anatomy visual component |
| `src/routes/_platform/app/program/workout/index.tsx` | Wire presentation layer |
| `src/lib/platform/training-calendar-muscle-fix.test.ts` | **New** regression tests |
| `src/lib/platform/strategy-matrix/calendar-resolver.test.ts` | Updated calendar-without-strategy expectation |
| `package.json` | Added new test to `npm test` |

---

## Tests

```bash
npx tsx src/lib/platform/training-calendar-muscle-fix.test.ts
npx tsx src/lib/platform/strategy-matrix/calendar-resolver.test.ts
npm run build
```

Coverage:

- Calendar frequencies **2 / 3 / 4 / 5** → exact training + rest counts
- Weekly strip reflects assigned plans (3 training / 4 rest)
- Free preview keeps Sun/Sat as rest
- Muscle visual: Push, Pull, Legs, Upper, Full Body
- Legs session → `LEGS` visual + `أرجل` label

---

## Screenshots (before / after)

| Area | Before | After |
|------|--------|-------|
| Weekly strip (3-day client) | 7× تمرين | 3× تمرين + 4× راحة |
| Legs session card | Chest/biceps PNG + title «رجل» | Leg anatomy / LEGS highlight + «أرجل» |
| Push session card | Same static PNG | PUSH visual + «صدر» / «صدر وترايسبس» |

> Staging visual QA: deploy to `staging.hakimlemagicien.com` and capture CLIENT A (3-day) + CLIENT FREE (catalog rest days) after deploy.

---

## Production

**Untouched.** No Production Supabase or `main` deploy in this fix.

---

## FINAL STATUS

`TRAINING_CALENDAR_AND_MUSCLE_VISUAL_FIXED_READY_FOR_QA`
