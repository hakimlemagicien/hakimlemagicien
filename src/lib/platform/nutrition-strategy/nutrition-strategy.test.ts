import assert from "node:assert/strict";
import {
  allClientGoals,
  applySwapWithWholeDayValidation,
  buildPartialConsumptionEvent,
  canAccessFullNutritionPlan,
  canSwapMeal,
  CLIENT_GOAL_IDS,
  computeConsumedTotals,
  computeNutritionTarget,
  consumptionStatusFromLog,
  detectAssignmentSchema,
  isFailClosed,
  isLegacy4SlotAssignment,
  isServingWithinLimits,
  mapQuizGoalToClientGoalId,
  resolveNutritionDay,
  resolveNutritionGoalProfile,
  resolvePostWorkoutState,
  resolvePreWorkoutState,
  trainingTimeBucket,
  validateNutritionPlan,
} from "./index";

const FEMALE_PROFILE = {
  gender: "female" as const,
  age: 30,
  weight_kg: 68,
  height_cm: 165,
  activity_level: "moderate" as const,
  body_fat_category: "moderate" as const,
  lean_mass_focus: false,
  recomposition_signal: true,
};

const MALE_PROFILE = {
  gender: "male" as const,
  age: 28,
  weight_kg: 82,
  height_cm: 178,
  activity_level: "moderate" as const,
};

// --- 12 goals ---
for (const goal of CLIENT_GOAL_IDS) {
  const profile =
    goal === "WAIST_DEFINITION" ||
    goal === "UPPER_BODY_DEFINITION" ||
    goal === "FEMININE_BALANCED_BODY"
      ? FEMALE_PROFILE
      : MALE_PROFILE;
  const resolved = resolveNutritionGoalProfile({ clientGoal: goal, profile });
  assert(!("code" in resolved), `goal ${goal} should resolve`);
  assert.equal(resolved.goal_context, goal, `goal context preserved for ${goal}`);
}
assert.equal(allClientGoals().length, 12, "12 goals supported");

// Profile-dependent fail-closed
const waistUnresolved = resolveNutritionGoalProfile({
  clientGoal: "WAIST_DEFINITION",
  profile: { ...FEMALE_PROFILE, body_fat_category: null },
});
assert("code" in waistUnresolved, "WAIST_DEFINITION requires body_fat_category");

// Target engine + provenance
const fatProfile = resolveNutritionGoalProfile({
  clientGoal: "FAT_LOSS",
  profile: MALE_PROFILE,
});
assert(!("code" in fatProfile));
const target = computeNutritionTarget({
  profile: MALE_PROFILE,
  nutrition_objective: fatProfile.nutrition_objective,
  goal_context: fatProfile.goal_context,
});
assert(!("code" in target));
assert.equal(target.target_source, "ENGINE_APPROVED");
assert.ok(target.calories > 0 && target.protein_g > 0);
assert.ok(target.strategy_version.includes("nutrition-strategy"));

// TARGET separated from PLANNED conceptually
const planned = { calories: target.calories - 50, protein_g: target.protein_g, carbs_g: target.carbs_g, fat_g: target.fat_g };
const validation = validateNutritionPlan({ target, planned_totals: planned });
assert.ok(["VALID", "REVIEW_REQUIRED"].includes(validation.status));

// Day resolver — TRAINING / REST × time buckets
for (const day_type of ["TRAINING_DAY", "REST_DAY"] as const) {
  for (const training_time of ["MORNING", "MIDDAY", "AFTERNOON", "EVENING"] as const) {
    const day = resolveNutritionDay({
      client_goal: "FAT_LOSS",
      profile: MALE_PROFILE,
      approved_target: "code" in target ? undefined : target,
      day_context: { day_type, training_time, session_time: "18:00" },
      allergies: { status: "CONFIRMED_NONE", confirmed_at: new Date().toISOString() },
    });
    if (isFailClosed(day)) {
      assert.notEqual(day.code, "ALLERGY_STATUS_REQUIRED", `${day_type}/${training_time} allergy ok`);
    } else {
      assert.ok(day.ordered_slots.length >= 4, "dynamic slots");
      if (day_type === "REST_DAY") {
        assert.equal(day.slot_states.pre_workout, "NOT_REQUIRED");
        assert.equal(day.slot_states.post_workout, "NOT_REQUIRED");
      }
    }
  }
}

// Pre/Post satisfied-by
const preMorning = resolvePreWorkoutState({
  context: { day_type: "TRAINING_DAY", training_time: "MORNING" },
});
assert.equal(preMorning.state, "OPTIONAL");
const postRest = resolvePostWorkoutState({ context: { day_type: "REST_DAY" } });
assert.equal(postRest.state, "NOT_REQUIRED");
assert.equal(trainingTimeBucket("07:30"), "MORNING");

// Allergy fail-closed
const allergyBlock = resolveNutritionDay({
  client_goal: "FAT_LOSS",
  profile: MALE_PROFILE,
  day_context: { day_type: "REST_DAY" },
  allergies: { status: "UNKNOWN" },
});
assert("code" in allergyBlock && allergyBlock.code === "ALLERGY_STATUS_REQUIRED");

// Serving limits
assert.equal(isServingWithinLimits("snack", 1.25), true);
assert.equal(isServingWithinLimits("snack", 2), false);

// Partial consumption
const partial = buildPartialConsumptionEvent({
  slot_key: "lunch",
  source_external_id: "MEAL-056",
  planned_servings: 1,
  consumed_servings: 0.5,
  macros_per_serving: { calories: 400, protein_g: 30, carbs_g: 40, fat_g: 10 },
  session_date: "2026-09-02",
});
assert.equal(partial.status, "PARTIAL");
assert.equal(consumptionStatusFromLog({ has_log_row: false }), "NOT_LOGGED");
assert.equal(consumptionStatusFromLog({ has_log_row: true, status: "skipped" }), "SKIPPED");
const consumedTotal = computeConsumedTotals([partial]);
assert.ok(consumedTotal.calories > 0 && consumedTotal.calories < 400);

// Entitlements
assert.equal(canAccessFullNutritionPlan("free"), false);
assert.equal(canAccessFullNutritionPlan("essential"), true);
assert.equal(canSwapMeal("essential", 0), true);
assert.equal(canSwapMeal("essential", 1), false);
assert.equal(canSwapMeal("premium", 5), true);

// Legacy compatibility
assert.equal(
  detectAssignmentSchema({ slot_keys: ["breakfast", "snack", "lunch", "dinner"] }),
  "LEGACY_4_SLOT",
);
assert.ok(isLegacy4SlotAssignment("LEGACY_4_SLOT"));

// Deterministic — same inputs should yield same first meal ids
const dayA = resolveNutritionDay({
  client_goal: "MUSCLE_GAIN",
  profile: MALE_PROFILE,
  day_context: { day_type: "TRAINING_DAY", training_time: "EVENING", session_time: "18:00" },
  allergies: { status: "CONFIRMED_NONE", confirmed_at: new Date().toISOString() },
});
const dayB = resolveNutritionDay({
  client_goal: "MUSCLE_GAIN",
  profile: MALE_PROFILE,
  day_context: { day_type: "TRAINING_DAY", training_time: "EVENING", session_time: "18:00" },
  allergies: { status: "CONFIRMED_NONE", confirmed_at: new Date().toISOString() },
});
if (!isFailClosed(dayA) && !isFailClosed(dayB)) {
  const idsA = dayA.assigned_meals.map((m) => m.external_id).join(",");
  const idsB = dayB.assigned_meals.map((m) => m.external_id).join(",");
  assert.equal(idsA, idsB, "deterministic meal selection");
}

// Swap revalidation path (smoke)
if (!isFailClosed(dayA) && !("code" in target)) {
  const lunch = dayA.assigned_meals.find((m) => m.slot_key === "lunch");
  if (lunch) {
    const alt = lunch.meal;
    const swapped = applySwapWithWholeDayValidation({
      day: dayA,
      target,
      slot_key: "lunch",
      to_external_id: alt.external_id,
      allergy: { status: "CONFIRMED_NONE", confirmed_at: new Date().toISOString() },
    });
    assert(!isFailClosed(swapped) || swapped.code === "SWAP_NOT_ALLOWED");
  }
}

// Quiz mapping
assert.equal(mapQuizGoalToClientGoalId("fat"), "FAT_LOSS");
assert.equal(mapQuizGoalToClientGoalId("glutes"), "GLUTE_GROWTH");

console.log("nutrition-strategy.test.ts: all assertions passed");
