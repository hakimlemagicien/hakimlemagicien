import { findContractAlternatives, getMealLibraryCatalog, type MealLibraryRecord } from "../meal-library";
import { allergenOverlap } from "../nutrition-assignment";
import { BEAM_WIDTH_PER_SLOT } from "./constants";
import { scaleMealMacros, servingPolicyForMealType, servingStepsForMealType } from "./serving-policy";
import type {
  AllergyState,
  AssignedMeal,
  MacroTotals,
  MealHistoryWindow,
  NutritionGoalProfile,
  NutritionPlanCandidate,
  NutritionSlot,
  NutritionSlotKey,
  NutritionTarget,
} from "./types";
import { varietyPenalty } from "./variety-policy";
import { validateNutritionPlan } from "./validate-nutrition-plan";

const SLOT_MEAL_TYPE: Record<NutritionSlotKey, string> = {
  breakfast: "breakfast",
  snack: "snack",
  lunch: "lunch",
  pre_workout: "pre_workout",
  post_workout: "post_workout",
  dinner: "dinner",
};

function allergenSafe(meal: MealLibraryRecord, allergy: AllergyState): boolean {
  if (allergy.status === "CONFIRMED_NONE") return true;
  if (allergy.status === "KNOWN_ALLERGIES") {
    return allergenOverlap(meal.allergens, allergy.allergens).length === 0;
  }
  return false;
}

function goalCompatible(meal: MealLibraryRecord, profile: NutritionGoalProfile): boolean {
  return meal.suitable_goals.some((g) => profile.suitable_goals_filter.includes(g));
}

export function buildMealCandidatePool(input: {
  slot_key: NutritionSlotKey;
  goal_profile: NutritionGoalProfile;
  allergy: AllergyState;
  restrictions: string[];
  catalog?: MealLibraryRecord[];
}): MealLibraryRecord[] {
  const catalog = input.catalog ?? getMealLibraryCatalog();
  const mealType = SLOT_MEAL_TYPE[input.slot_key];
  return catalog
    .filter((meal) => meal.meal_type === mealType)
    .filter((meal) => meal.image_status === "ready" || meal.status === "published")
    .filter((meal) => allergenSafe(meal, input.allergy))
    .filter((meal) => goalCompatible(meal, input.goal_profile))
    .sort((a, b) => a.external_id.localeCompare(b.external_id));
}

function scoreCandidate(
  macros: MacroTotals,
  target: NutritionTarget,
  slotBudget: MacroTotals,
  varietyPen: number,
): number {
  const calDist = Math.abs(macros.calories - slotBudget.calories);
  const proDist = Math.abs(macros.protein_g - slotBudget.protein_g);
  return calDist + proDist * 2 + varietyPen;
}

function slotBudget(target: NutritionTarget, activeSlots: number): MacroTotals {
  const n = Math.max(activeSlots, 1);
  return {
    calories: Math.round(target.calories / n),
    protein_g: Math.round((target.protein_g / n) * 10) / 10,
    carbs_g: Math.round((target.carbs_g / n) * 10) / 10,
    fat_g: Math.round((target.fat_g / n) * 10) / 10,
  };
}

export function optimizeWholeDay(input: {
  slots: NutritionSlot[];
  target: NutritionTarget;
  goal_profile: NutritionGoalProfile;
  allergy: AllergyState;
  restrictions: string[];
  history: MealHistoryWindow;
  catalog?: MealLibraryRecord[];
}): NutritionPlanCandidate | null {
  const activeSlots = input.slots.filter(
    (s) => s.slot_state === "ACTIVE" || s.slot_state === "OPTIONAL",
  );
  const budget = slotBudget(input.target, activeSlots.length);
  const catalog = input.catalog ?? getMealLibraryCatalog();

  type PartialDay = { meals: AssignedMeal[]; score: number };
  let beam: PartialDay[] = [{ meals: [], score: 0 }];

  for (const slot of input.slots) {
    if (slot.slot_state === "NOT_REQUIRED" || slot.slot_state === "SATISFIED_BY_OTHER_MEAL") {
      continue;
    }

    const pool = buildMealCandidatePool({
      slot_key: slot.slot_key,
      goal_profile: input.goal_profile,
      allergy: input.allergy,
      restrictions: input.restrictions,
      catalog,
    }).slice(0, BEAM_WIDTH_PER_SLOT * 3);

    const nextBeam: PartialDay[] = [];
    for (const partial of beam) {
      for (const meal of pool) {
        for (const servings of servingStepsForMealType(meal.meal_type)) {
          const macros = scaleMealMacros(meal, servings);
          const pen = varietyPenalty(meal.meal_type, meal.external_id, input.history);
          const score =
            partial.score + scoreCandidate(macros, input.target, budget, pen);
          nextBeam.push({
            score,
            meals: [
              ...partial.meals,
              {
                slot_key: slot.slot_key,
                external_id: meal.external_id,
                meal,
                servings,
                serving_policy: servingPolicyForMealType(meal.meal_type),
                macros,
              },
            ],
          });
        }
      }
    }

    beam = nextBeam
      .sort((a, b) => a.score - b.score || a.meals.at(-1)?.external_id.localeCompare(b.meals.at(-1)?.external_id ?? "")!)
      .slice(0, BEAM_WIDTH_PER_SLOT);
    if (beam.length === 0) return null;
  }

  const best = beam[0];
  if (!best) return null;

  const planned_totals = best.meals.reduce(
    (sum, m) => ({
      calories: sum.calories + m.macros.calories,
      protein_g: sum.protein_g + m.macros.protein_g,
      carbs_g: sum.carbs_g + m.macros.carbs_g,
      fat_g: sum.fat_g + m.macros.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );

  const validation = validateNutritionPlan({
    target: input.target,
    planned_totals,
    allergy_safe: true,
  });

  if (validation.status === "INVALID") {
    const relaxed = beam.find((c) => {
      const totals = c.meals.reduce(
        (sum, m) => ({
          calories: sum.calories + m.macros.calories,
          protein_g: sum.protein_g + m.macros.protein_g,
          carbs_g: sum.carbs_g + m.macros.carbs_g,
          fat_g: sum.fat_g + m.macros.fat_g,
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      );
      return validateNutritionPlan({ target: input.target, planned_totals: totals }).status !== "INVALID";
    });
    if (!relaxed) return null;
    const totals = relaxed.meals.reduce(
      (sum, m) => ({
        calories: sum.calories + m.macros.calories,
        protein_g: sum.protein_g + m.macros.protein_g,
        carbs_g: sum.carbs_g + m.macros.carbs_g,
        fat_g: sum.fat_g + m.macros.fat_g,
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    );
    return { assigned_meals: relaxed.meals, planned_totals: totals, score: relaxed.score };
  }

  return { assigned_meals: best.meals, planned_totals, score: best.score };
}

export function topDeterministicAlternatives(
  meal: MealLibraryRecord,
  count: number,
  userAllergens: string[] = [],
): MealLibraryRecord[] {
  return findContractAlternatives(meal, undefined, userAllergens).slice(0, count);
}
