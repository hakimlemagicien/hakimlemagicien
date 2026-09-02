import { getMealByExternalId } from "../meal-library";
import { SWAP_MAX_CALORIE_DELTA_PCT, SWAP_MAX_PROTEIN_DELTA_G } from "./constants";
import { scaleMealMacros } from "./serving-policy";
import { validateNutritionPlan } from "./validate-nutrition-plan";
import type {
  AllergyState,
  AssignedMeal,
  MacroTotals,
  NutritionFailClosedOutcome,
  NutritionSlotKey,
  NutritionTarget,
  ResolvedNutritionDay,
} from "./types";

export function mealLevelSwapEligible(
  from: AssignedMeal,
  toExternalId: string,
  allergy: AllergyState,
): boolean {
  const toMeal = getMealByExternalId(toExternalId);
  if (!toMeal) return false;
  if (toMeal.meal_type !== from.meal.meal_type) return false;
  if (allergy.status === "KNOWN_ALLERGIES") {
    const overlap = toMeal.allergens.filter((a) => allergy.allergens.includes(a));
    if (overlap.length > 0) return false;
  }
  const calDelta = (Math.abs(toMeal.calories - from.meal.calories) / from.meal.calories) * 100;
  if (calDelta > SWAP_MAX_CALORIE_DELTA_PCT) return false;
  const proteinDelta = Math.abs(toMeal.protein_g - from.meal.protein_g);
  if (proteinDelta > SWAP_MAX_PROTEIN_DELTA_G) return false;
  return true;
}

function sumCountableTotals(
  day: ResolvedNutritionDay,
  meals: AssignedMeal[],
): MacroTotals {
  return meals.reduce(
    (sum, m) => {
      const slot = day.ordered_slots.find((s) => s.slot_key === m.slot_key);
      if (!slot?.counts_toward_day_totals) return sum;
      if (slot.slot_state === "NOT_REQUIRED" || slot.slot_state === "SATISFIED_BY_OTHER_MEAL") {
        return sum;
      }
      return {
        calories: sum.calories + m.macros.calories,
        protein_g: sum.protein_g + m.macros.protein_g,
        carbs_g: sum.carbs_g + m.macros.carbs_g,
        fat_g: sum.fat_g + m.macros.fat_g,
      };
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

export function applySwapWithWholeDayValidation(input: {
  day: ResolvedNutritionDay;
  target: NutritionTarget;
  slot_key: NutritionSlotKey;
  to_external_id: string;
  allergy: AllergyState;
}): ResolvedNutritionDay | NutritionFailClosedOutcome {
  const from = input.day.assigned_meals.find((m) => m.slot_key === input.slot_key);
  if (!from) {
    return { code: "SWAP_NOT_ALLOWED", message: "Slot has no assigned meal" };
  }

  if (!mealLevelSwapEligible(from, input.to_external_id, input.allergy)) {
    return { code: "SWAP_NOT_ALLOWED", message: "Meal-level swap contract failed" };
  }

  const toMeal = getMealByExternalId(input.to_external_id)!;
  const macros = scaleMealMacros(toMeal, from.servings);
  const swappedMeals = input.day.assigned_meals.map((m) =>
    m.slot_key === input.slot_key
      ? { ...m, external_id: input.to_external_id, meal: toMeal, macros }
      : m,
  );

  const planned_totals = sumCountableTotals(input.day, swappedMeals);
  const validation = validateNutritionPlan({
    target: input.target,
    planned_totals,
    allergy_safe: true,
  });

  if (validation.status === "INVALID") {
    return { code: "SWAP_NOT_ALLOWED", message: "Whole-day validation failed after swap" };
  }

  return {
    ...input.day,
    assigned_meals: swappedMeals,
    planned_totals,
    validation_result: validation,
    decision_trace: [
      ...input.day.decision_trace,
      { code: "SWAP_REQUEST", message: `Swapped ${from.external_id} → ${input.to_external_id}` },
    ],
  };
}
