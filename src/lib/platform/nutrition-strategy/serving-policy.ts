import { SERVING_LIMITS } from "./constants";
import { scaleMacros } from "../nutrition-assignment";
import type { MealLibraryRecord } from "../meal-library";
import type { MacroTotals, ServingPolicy } from "./types";

export function servingPolicyForMealType(mealType: string): ServingPolicy {
  return SERVING_LIMITS[mealType]?.policy ?? "LIMITED_SCALING";
}

export function servingStepsForMealType(mealType: string): number[] {
  const limits = SERVING_LIMITS[mealType];
  if (!limits) return [1];
  const steps: number[] = [];
  for (let s = limits.min; s <= limits.max + 0.001; s += 0.25) {
    steps.push(Math.round(s * 100) / 100);
  }
  return [...new Set(steps)];
}

export function scaleMealMacros(meal: MealLibraryRecord, servings: number): MacroTotals {
  const scaled = scaleMacros({
    calories: meal.calories,
    protein_g: meal.protein_g,
    carbs_g: meal.carbs_g,
    fat_g: meal.fat_g,
    servings,
  });
  return {
    calories: scaled.calories,
    protein_g: scaled.protein,
    carbs_g: scaled.carbs,
    fat_g: scaled.fat,
  };
}

export function isServingWithinLimits(mealType: string, servings: number): boolean {
  const limits = SERVING_LIMITS[mealType];
  if (!limits) return servings > 0;
  return servings >= limits.min && servings <= limits.max;
}

export function clampServingToLimits(mealType: string, servings: number): number | null {
  const limits = SERVING_LIMITS[mealType];
  if (!limits || servings <= 0) return null;
  const clamped = Math.min(limits.max, Math.max(limits.min, servings));
  return Math.round(clamped * 100) / 100;
}
