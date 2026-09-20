import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const lockedExerciseCard = readFileSync(
  resolve(root, "src/components/platform/workout/ExerciseLockedCard.tsx"),
  "utf8",
);
const freeTrainingPreview = readFileSync(
  resolve(root, "src/components/platform/workout/FreeTrainingMembershipPreview.tsx"),
  "utf8",
);
const workoutRoute = readFileSync(
  resolve(root, "src/routes/_platform/app/program/workout/index.tsx"),
  "utf8",
);
const nutritionRoute = readFileSync(
  resolve(root, "src/routes/_platform/app/nutrition/index.tsx"),
  "utf8",
);
const mealRoute = readFileSync(
  resolve(root, "src/routes/_platform/app/nutrition/meal.tsx"),
  "utf8",
);
const alternativesRoute = readFileSync(
  resolve(root, "src/routes/_platform/app/nutrition/alternatives.tsx"),
  "utf8",
);

assert(!lockedExerciseCard.includes("name: string"), "locked card receives no exercise name");
assert(!lockedExerciseCard.includes("sets: number"), "locked card receives no set prescription");
assert(!lockedExerciseCard.includes("restLabel"), "locked card receives no rest prescription");
assert(!lockedExerciseCard.includes("thumbnail:"), "locked card receives no exercise media");
assert(
  freeTrainingPreview.includes("Array.from({ length: Math.max(exerciseCount, 1) }"),
  "FREE preview renders the real number/order of protected exercise cards",
);

const lockedExerciseInvocation = workoutRoute.slice(
  workoutRoute.indexOf("<ExerciseLockedCard"),
  workoutRoute.indexOf("/>", workoutRoute.indexOf("<ExerciseLockedCard")) + 2,
);
assert(!lockedExerciseInvocation.includes("exercise.name"), "exercise name is not passed to lock UI");
assert(!lockedExerciseInvocation.includes("exercise.sets"), "sets are not passed to lock UI");
assert(!lockedExerciseInvocation.includes("exercise.rest"), "rest is not passed to lock UI");

const lockedMealBranch = nutritionRoute.slice(
  nutritionRoute.indexOf("if (locked)"),
  nutritionRoute.indexOf("const body =", nutritionRoute.indexOf("if (locked)")),
);
assert(!lockedMealBranch.includes("src={image}"), "locked meal does not load the real meal image");
assert(!lockedMealBranch.includes("mealName"), "locked meal does not render the real meal name");
assert(!lockedMealBranch.includes("calories"), "locked meal does not render meal calories");
assert(!lockedMealBranch.includes("protein"), "locked meal does not render meal protein");

for (const [surface, source] of [
  ["meal details", mealRoute],
  ["meal alternatives", alternativesRoute],
] as const) {
  assert(
    source.includes("useFreeNutritionPreviewOptions"),
    `${surface} uses the shared server-backed FREE resolver`,
  );
  assert(source.includes("breakfastGoalKey"), `${surface} keeps goal-matched breakfast`);
  assert(source.includes("trainingMealWindow:"), `${surface} keeps the same slot order`);
  assert(source.includes("allergens:"), `${surface} keeps allergy filters`);
  assert(source.includes("dislikedFoods:"), `${surface} keeps dislike filters`);
}

console.log("free-content-protection.test.ts: PASS");
