# Smart Calorie Calculator — Delivery Report

## Overview

The Smart Calorie Calculator opens as a **Large Bottom Sheet** from the Tools hub. It reads profile and training data automatically — no duplicate onboarding forms — and computes BMR, TDEE, goal calories, and macro guidance locally.

## Data Sources

| Field | Source |
|-------|--------|
| Gender | Training profile answers (`gender`) |
| Age | Training profile `birthDate` → computed age |
| Height | Training profile `heightCm` |
| Weight | Progress body measurements, fallback training `weightKg` |
| Activity | Training profile `activityLevel` |
| Goal | Training `goalId` / profile goal |
| Active nutrition plan | Membership feature `nutrition_plan` |

Edit links route to `/app/profile` only — the calculator never writes profile data.

## Calculation (v1.0.0)

**BMR — Mifflin-St Jeor**

- Male: `10×kg + 6.25×cm − 5×age + 5`
- Female: `10×kg + 6.25×cm − 5×age − 161`

**TDEE:** `BMR × activity multiplier`

| Activity | Multiplier |
|----------|------------|
| قليل الحركة (sedentary) | 1.2 |
| نشاط خفيف (light) | 1.375 |
| نشاط متوسط (moderate) | 1.55 |
| نشاط مرتفع (active) | 1.725 |
| نشاط مرتفع جداً (very_active) | 1.9 |

**Goal adjustments**

| Goal | Adjustment |
|------|------------|
| خسارة الدهون (cut) | TDEE − 300 |
| الحفاظ على الوزن (maintain) | TDEE |
| بناء العضلات (bulk) | TDEE + 300 |

Minimum target calories: **1200 kcal**.

## Macros

- Protein: **2 g/kg** body weight
- Fat: **25%** of target calories
- Carbs: remaining calories
- kcal/g: protein 4, carbs 4, fat 9
- Grams and percentages rounded to nearest integer

If macros are invalid (negative carbs), only calorie results are shown.

## Goal Preview

Preview goals update calories and macros only. The user's actual goal and programs are **never** modified. A preview badge and disclaimer are shown when the selected goal differs from the stored goal.

## Save Behavior

**حفظ النتيجة كمرجع** stores an estimate in `localStorage` (`hakim.calorie-calculator.refs.v1:{userId}`). Does not update profile, training, or nutrition programs. Preview saves are flagged with `isPreviewSave`.

## Active Nutrition Program

When `features.nutrition_plan` is true, an informational notice explains that the personal meal plan takes precedence.

## Offline

Calculation runs locally once cached profile/training data exists (React Query). Save requires localStorage; no offline queue in v1.

## Files

| File | Role |
|------|------|
| `src/lib/platform/calorie-calculator.ts` | Shared calculation logic + self-checks |
| `src/lib/platform/calorie-calculator-storage.ts` | Reference save/list |
| `src/hooks/useCalorieCalculator.ts` | Data fetch + compute hook |
| `src/components/platform/tools/CalorieCalculatorSheet.tsx` | Bottom sheet UI |
| `src/components/platform/tools/ToolsContext.tsx` | Global open/close |
| `src/components/platform/shared/ToolsHubOverlay.tsx` | Tools hub entry |
| `src/routes/_platform/app/tools/calories.tsx` | Deep link → opens sheet |

## Unit Checks

Run in browser console or a script:

```ts
import { calorieCalculatorSelfChecks } from "@/lib/platform/calorie-calculator";
console.table(calorieCalculatorSelfChecks());
```

Sample male (28y, 82kg, 178cm, moderate, cut): BMR **1720**, TDEE **2666**, target **2366** (before min clamp) — verify with self-checks.

## Performance

- Local math after profile load (< 1ms)
- Fixed-dimension skeletons, no full-screen spinner
- Sheet mounted globally; content loads only when `open`

## Accessibility

- RTL layout, 44px touch targets, `aria` on dialog/progress
- `useReducedMotion` disables drag, count-up, and tap scale

## QA Checklist

- [ ] Open from Tools hub (mobile) and sidebar (desktop)
- [ ] Missing profile fields → blocked calculation + CTA to profile
- [ ] Preview goal changes numbers without changing stored goal
- [ ] Save reference persists locally; no program changes
- [ ] Active nutrition plan notice when premium nutrition enabled
- [ ] Return from profile edit refreshes results
- [ ] Deep link `/app/tools/calories` opens sheet on home
