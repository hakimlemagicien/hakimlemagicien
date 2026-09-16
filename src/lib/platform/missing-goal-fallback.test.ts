import assert from "node:assert/strict";
import {
  buildMissingGoalFallbackWorkoutPlans,
  hasClientGoal,
  MISSING_GOAL_FALLBACK_DAYS,
  MISSING_GOAL_FALLBACK_NUTRITION_GOAL,
} from "./missing-goal-fallback";
import { getNutritionMealSlots } from "./nutrition-experience";

const first = buildMissingGoalFallbackWorkoutPlans();
const second = buildMissingGoalFallbackWorkoutPlans();
const workoutDays = Object.values(first).filter((day) => !day.isRestDay);

assert.equal(workoutDays.length, MISSING_GOAL_FALLBACK_DAYS);
assert.deepEqual(first, second, "missing-goal fallback must be deterministic");
assert(workoutDays.every((day) => day.prescriptions.length > 0));
assert(workoutDays.every((day) => day.safeExerciseCount === day.prescriptions.length));
assert.equal(hasClientGoal({ goal: null, goalId: null }), false);
assert.equal(hasClientGoal({ goal: " ", goalId: "" }), false);
assert.equal(hasClientGoal({ goal: null, goalId: "MUSCLE_GROWTH" }), true);

const starterMeals = getNutritionMealSlots({
  breakfastGoalKey: MISSING_GOAL_FALLBACK_NUTRITION_GOAL,
  trainingMealWindow: "after_lunch",
});
const repeatedStarterMeals = getNutritionMealSlots({
  breakfastGoalKey: MISSING_GOAL_FALLBACK_NUTRITION_GOAL,
  trainingMealWindow: "after_lunch",
});
assert.equal(starterMeals.length, 6);
assert.deepEqual(
  starterMeals.map((slot) => [slot.id, slot.defaultMeal.id]),
  repeatedStarterMeals.map((slot) => [slot.id, slot.defaultMeal.id]),
  "starter nutrition must be stable, not random",
);

console.log("missing-goal-fallback.test.ts: PASS");
