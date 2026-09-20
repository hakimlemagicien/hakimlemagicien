import assert from "node:assert/strict";
import { getMealByExternalId } from "../meal-library";
import { isMealSafeForNutritionSlot } from "./nutrition-template-contract";
import { resolveNutritionDay } from "./resolve-nutrition-day";
import { isFailClosed } from "./index";
import { computeNutritionTarget } from "./target-engine";
import type { ClientNutritionProfile, NutritionTarget } from "./types";

const profile: ClientNutritionProfile = {
  gender: "male",
  age: 28,
  weight_kg: 72,
  height_cm: 180,
  activity_level: "very_active",
};
const target: NutritionTarget = {
  id: "fitmaak-production-target",
  version: 1,
  calories: 3488,
  protein_g: 129.6,
  carbs_g: 501.7,
  fat_g: 107,
  reference_weight_kg: 72,
  nutrition_objective: "MUSCLE_GAIN",
  goal_context: "MUSCLE_GAIN",
  target_source: "ENGINE_APPROVED",
  strategy_version: "nutrition-strategy-v1",
  target_created_at: "2026-09-20T00:00:00.000Z",
  target_reason: "ENGINE_INITIAL_TARGET",
  review_required: false,
};

function generate() {
  return resolveNutritionDay({
    client_goal: "MUSCLE_GAIN",
    profile,
    approved_target: target,
    day_context: {
      day_type: "TRAINING_DAY",
      training_time: "EVENING",
      session_time: "18:00",
      force_six_meals: true,
    },
    allergies: { status: "CONFIRMED_NONE", confirmed_at: "2026-09-20T00:00:00Z" },
  });
}

const first = generate();
assert(!isFailClosed(first), "Muscle Gain day generates");
if (isFailClosed(first)) throw new Error(first.message);
assert.equal(first.assigned_meals.length, 6, "exactly six assigned meals");
console.log("macro-quality candidate", first.planned_totals, first.validation_result);
assert(first.validation_result.calories.delta_pct <= 10, "calories within official review band");
assert(first.validation_result.protein.band === "PASS", "protein within official band");
assert(first.validation_result.carbs.delta_pct <= 10, "carbs within official macro tolerance");
assert(first.validation_result.fats.delta_pct <= 10, "fat within official macro tolerance");

for (const assigned of first.assigned_meals) {
  const meal = getMealByExternalId(assigned.external_id);
  assert(meal, `${assigned.external_id} exists`);
  assert(isMealSafeForNutritionSlot(assigned.slot_key, assigned.meal), `${assigned.slot_key} remains slot-safe`);
}

const second = generate();
assert(!isFailClosed(second), "repeat generation succeeds");
if (isFailClosed(second)) throw new Error(second.message);
assert.deepEqual(
  second.assigned_meals.map((meal) => [meal.slot_key, meal.external_id, meal.servings]),
  first.assigned_meals.map((meal) => [meal.slot_key, meal.external_id, meal.servings]),
  "selection is deterministic and does not randomize",
);

for (const strategy of ["FAT_LOSS", "MAINTENANCE"] as const) {
  const representativeProfile: ClientNutritionProfile = {
    gender: strategy === "FAT_LOSS" ? "female" : "male",
    age: 34,
    weight_kg: strategy === "FAT_LOSS" ? 74 : 79,
    height_cm: strategy === "FAT_LOSS" ? 166 : 178,
    activity_level: "moderate",
  };
  const representativeTarget = computeNutritionTarget({
    profile: representativeProfile,
    nutrition_objective: strategy,
    goal_context: strategy === "FAT_LOSS" ? "FAT_LOSS" : "GENERAL_HEALTH_FITNESS",
  });
  assert(!("code" in representativeTarget), `${strategy} target computes`);
  if ("code" in representativeTarget) continue;
  const representative = resolveNutritionDay({
    client_goal: strategy === "FAT_LOSS" ? "FAT_LOSS" : "GENERAL_HEALTH_FITNESS",
    profile: representativeProfile,
    approved_target: representativeTarget,
    day_context: {
      day_type: "TRAINING_DAY",
      training_time: "EVENING",
      session_time: "18:00",
      force_six_meals: true,
    },
    allergies: { status: "CONFIRMED_NONE", confirmed_at: "2026-09-20T00:00:00Z" },
  });
  assert(!isFailClosed(representative), `${strategy} assignment succeeds`);
  if (isFailClosed(representative)) continue;
  assert.notEqual(representative.validation_result.status, "INVALID", `${strategy} has no severe macro regression`);
  assert.equal(representative.assigned_meals.length, 6, `${strategy} keeps six slots`);
  assert(
    representative.assigned_meals.every((meal) =>
      isMealSafeForNutritionSlot(meal.slot_key, meal.meal),
    ),
    `${strategy} keeps slot safety`,
  );
}

console.log(
  JSON.stringify({
    target: {
      calories: target.calories,
      protein_g: target.protein_g,
      carbs_g: target.carbs_g,
      fat_g: target.fat_g,
    },
    actual: first.planned_totals,
    validation: first.validation_result,
    meals: first.assigned_meals.map((meal) => ({
      slot: meal.slot_key,
      external_id: meal.external_id,
      servings: meal.servings,
    })),
  }, null, 2),
);
console.log("nutrition-macro-quality.test.ts: PASS");
