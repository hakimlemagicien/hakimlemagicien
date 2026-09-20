import {
  findContractAlternatives,
  getMealLibraryCatalog,
  type MealLibraryRecord,
} from "../meal-library";
import { allergenOverlap } from "../nutrition-assignment";
import { BEAM_WIDTH_PER_SLOT } from "./constants";
import {
  scaleMealMacros,
  servingPolicyForMealType,
  servingStepsForMealType,
} from "./serving-policy";
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
import { isMealSafeForNutritionSlot } from "./nutrition-template-contract";

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

function restrictionSafe(meal: MealLibraryRecord, restrictions: string[]): boolean {
  if (restrictions.length === 0) return true;
  const searchable = [
    meal.external_id,
    meal.name_ar,
    meal.name_en,
    ...meal.dietary_tags,
    ...meal.ingredients.flatMap((ingredient) => [
      ingredient.ingredient_key,
      ingredient.name_ar,
      ingredient.name_en,
    ]),
  ]
    .join(" ")
    .toLocaleLowerCase("ar");
  return restrictions.every((restriction) => {
    const value = restriction.trim().toLocaleLowerCase("ar");
    return !value || !searchable.includes(value);
  });
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
    .filter((meal) => meal.image_status === "ready" && meal.status === "published")
    .filter((meal) => isMealSafeForNutritionSlot(input.slot_key, meal))
    .filter((meal) => allergenSafe(meal, input.allergy))
    .filter((meal) => restrictionSafe(meal, input.restrictions))
    .filter((meal) => goalCompatible(meal, input.goal_profile))
    .sort((a, b) => a.external_id.localeCompare(b.external_id));
}

function addTotals(a: MacroTotals, b: MacroTotals): MacroTotals {
  return {
    calories: a.calories + b.calories,
    protein_g: a.protein_g + b.protein_g,
    carbs_g: a.carbs_g + b.carbs_g,
    fat_g: a.fat_g + b.fat_g,
  };
}

const EMPTY_TOTALS: MacroTotals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

function relativeDistance(actual: number, expected: number): number {
  return (Math.abs(actual - expected) / Math.max(expected, 1)) * 100;
}

function wholeDayScore(totals: MacroTotals, target: NutritionTarget, varietyPen: number): number {
  const proteinPct = (totals.protein_g / Math.max(target.protein_g, 1)) * 100;
  const proteinBandPenalty = proteinPct < 95 || proteinPct > 110 ? 1000 : 0;
  return (
    proteinBandPenalty +
    relativeDistance(totals.protein_g, target.protein_g) * 3 +
    relativeDistance(totals.calories, target.calories) * 8 +
    relativeDistance(totals.carbs_g, target.carbs_g) * 5 +
    relativeDistance(totals.fat_g, target.fat_g) * 8 +
    varietyPen * 0.1
  );
}

type CandidateOption = { meal: MealLibraryRecord; servings: number; macros: MacroTotals; variety: number };
type MacroRange = { min: MacroTotals; max: MacroTotals };

function rangeBoundScore(
  totals: MacroTotals,
  target: NutritionTarget,
  remaining: MacroRange,
  varietyPen: number,
  completedSlots: number,
  totalSlots: number,
): number {
  const keys = ["calories", "protein_g", "carbs_g", "fat_g"] as const;
  const weights: Record<(typeof keys)[number], number> = {
    calories: 8,
    protein_g: 3,
    carbs_g: 5,
    fat_g: 8,
  };
  let score = varietyPen * 0.1;
  for (const key of keys) {
    const min = totals[key] + remaining.min[key];
    const max = totals[key] + remaining.max[key];
    const desired = target[key];
    const nearest = desired < min ? min : desired > max ? max : desired;
    score += relativeDistance(nearest, desired) * weights[key];
    const progressTarget = desired * (completedSlots / Math.max(totalSlots, 1));
    score += relativeDistance(totals[key], progressTarget) * weights[key] * 0.15;
  }
  return score;
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
  const catalog = input.catalog ?? getMealLibraryCatalog();

  const candidateCounts: Partial<Record<NutritionSlotKey, number>> = {};
  const slotOptions = activeSlots.map((slot) => {
    const pool = buildMealCandidatePool({
      slot_key: slot.slot_key,
      goal_profile: input.goal_profile,
      allergy: input.allergy,
      restrictions: input.restrictions,
      catalog,
    });
    candidateCounts[slot.slot_key] = pool.length;
    return {
      slot,
      options: pool.flatMap((meal) =>
        servingStepsForMealType(meal.meal_type).map((servings) => ({
          meal,
          servings,
          macros: scaleMealMacros(meal, servings),
          variety: varietyPenalty(meal.meal_type, meal.external_id, input.history),
        })),
      ),
    };
  });

  if (slotOptions.some(({ options }) => options.length === 0)) return null;

  const suffixRanges: MacroRange[] = Array.from({ length: slotOptions.length + 1 }, () => ({
    min: { ...EMPTY_TOTALS },
    max: { ...EMPTY_TOTALS },
  }));
  for (let index = slotOptions.length - 1; index >= 0; index -= 1) {
    const options = slotOptions[index]!.options;
    const next = suffixRanges[index + 1]!;
    const optionRange = (key: keyof MacroTotals, mode: "min" | "max") => {
      const values = options.map((option) => option.macros[key]);
      return mode === "min" ? Math.min(...values) : Math.max(...values);
    };
    suffixRanges[index] = {
      min: {
        calories: optionRange("calories", "min") + next.min.calories,
        protein_g: optionRange("protein_g", "min") + next.min.protein_g,
        carbs_g: optionRange("carbs_g", "min") + next.min.carbs_g,
        fat_g: optionRange("fat_g", "min") + next.min.fat_g,
      },
      max: {
        calories: optionRange("calories", "max") + next.max.calories,
        protein_g: optionRange("protein_g", "max") + next.max.protein_g,
        carbs_g: optionRange("carbs_g", "max") + next.max.carbs_g,
        fat_g: optionRange("fat_g", "max") + next.max.fat_g,
      },
    };
  }

  type PartialDay = {
    meals: AssignedMeal[];
    totals: MacroTotals;
    variety: number;
    score: number;
  };
  let beam: PartialDay[] = [{ meals: [], totals: EMPTY_TOTALS, variety: 0, score: 0 }];

  for (let slotIndex = 0; slotIndex < slotOptions.length; slotIndex += 1) {
    const { slot, options } = slotOptions[slotIndex]!;
    const remaining = suffixRanges[slotIndex + 1]!;

    const nextBeam: PartialDay[] = [];
    for (const partial of beam) {
      for (const option of options) {
        const totals = addTotals(partial.totals, option.macros);
        const variety = partial.variety + option.variety;
        const score =
          slotIndex === slotOptions.length - 1
            ? wholeDayScore(totals, input.target, variety)
            : rangeBoundScore(
                totals,
                input.target,
                remaining,
                variety,
                slotIndex + 1,
                slotOptions.length,
              );
        nextBeam.push({
          score,
          totals,
          variety,
          meals: [
            ...partial.meals,
            {
              slot_key: slot.slot_key,
              external_id: option.meal.external_id,
              meal: option.meal,
              servings: option.servings,
              serving_policy: servingPolicyForMealType(option.meal.meal_type),
              macros: option.macros,
            },
          ],
        });
      }
    }

    beam = nextBeam
      .sort(
        (a, b) =>
          a.score - b.score ||
          (a.meals.at(-1)?.external_id ?? "").localeCompare(b.meals.at(-1)?.external_id ?? ""),
      )
      .slice(0, BEAM_WIDTH_PER_SLOT);
    if (beam.length === 0) return null;
  }

  const best = beam[0];
  if (!best) return null;
  const planned_totals = best.totals;
  const diagnostics = {
    candidate_counts: candidateCounts,
    serving_adjustment_used: best.meals.some((meal) => meal.servings !== 1),
    constrained_slots: activeSlots
      .filter((slot) => (candidateCounts[slot.slot_key] ?? 0) < 3)
      .map((slot) => slot.slot_key),
  };

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
      return (
        validateNutritionPlan({ target: input.target, planned_totals: totals }).status !== "INVALID"
      );
    });
    if (!relaxed) return { assigned_meals: best.meals, planned_totals, score: best.score, diagnostics };
    const totals = relaxed.meals.reduce(
      (sum, m) => ({
        calories: sum.calories + m.macros.calories,
        protein_g: sum.protein_g + m.macros.protein_g,
        carbs_g: sum.carbs_g + m.macros.carbs_g,
        fat_g: sum.fat_g + m.macros.fat_g,
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    );
    return { assigned_meals: relaxed.meals, planned_totals: totals, score: relaxed.score, diagnostics };
  }

  return { assigned_meals: best.meals, planned_totals, score: best.score, diagnostics };
}

export function topDeterministicAlternatives(
  meal: MealLibraryRecord,
  count: number,
  userAllergens: string[] = [],
): MealLibraryRecord[] {
  return findContractAlternatives(meal, undefined, userAllergens).slice(0, count);
}
