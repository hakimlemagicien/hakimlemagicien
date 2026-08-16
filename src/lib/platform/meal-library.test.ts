import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  auditMealLibrary,
  findContractAlternatives,
  getMealByExternalId,
  listMealLibrary,
  mealDeliveryPath,
  mealStorageObjectPath,
  MEAL_LIBRARY_PILOT_START,
  MEAL_LIBRARY_EXTENDED_END,
  listMealsByGoal,
  listMealsByType,
} from "./meal-library";
import { NUTRITION_MEAL_SLOTS } from "./nutrition-experience";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    throw new Error(
      `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

export function runMealLibraryTests() {
  const meals = listMealLibrary();
  const ids = meals.map((meal) => meal.external_id);
  const audit = auditMealLibrary(meals);
  const publicRoot = join(process.cwd(), "public/nutrition/meals");

  assertEqual(meals.length, 300, "full library MEAL-001–MEAL-300 catalog count");
  assertEqual(ids[0], MEAL_LIBRARY_PILOT_START, "first external_id");
  assertEqual(ids[ids.length - 1], MEAL_LIBRARY_EXTENDED_END, "last external_id");
  assertEqual(new Set(ids).size, 300, "unique external_id");
  assertEqual(
    ids,
    Array.from({ length: 300 }, (_, index) => `MEAL-${String(index + 1).padStart(3, "0")}`),
    "continuous external_id sequence",
  );
  assertEqual(audit.duplicateExternalIds, [], "no duplicate meals");
  assertEqual(audit.brokenImageRefs, [], "image refs match external_id");
  assertEqual(audit.duplicateImageRefs, [], "no duplicate image assignment");
  assertEqual(audit.orphanImageRefs, [], "no orphan image refs");
  assertEqual(audit.imageStatusNotReady, [], "all images ready");

  for (const meal of meals) {
    assert(getMealByExternalId(meal.external_id), `readable ${meal.external_id}`);
    assert(
      meal.image.reference === `images/${meal.external_id}.png`,
      `${meal.external_id} image maps to its external_id`,
    );
    assert(
      !("completed" in meal) && !("skipped" in meal) && !("current" in meal),
      `${meal.external_id} must not carry user meal status`,
    );
    assert(
      meal.ingredients.every((ingredient) => ingredient.name_ar !== ingredient.name_en),
      `${meal.external_id} ingredients need Arabic names`,
    );
    assert(
      meal.preparation_steps_en.length > 0 &&
        meal.preparation_steps_en[0] !==
          "Prepare the listed ingredients using the stated cooking method; combine and serve.",
      `${meal.external_id} needs meal-specific English preparation`,
    );
    assert(meal.preparation_steps_ar.length > 0, `${meal.external_id} needs Arabic preparation`);
    const cover = join(publicRoot, meal.external_id, "cover.webp");
    const thumb = join(publicRoot, meal.external_id, "cover-thumb.webp");
    assert(existsSync(cover), `cover exists for ${meal.external_id}`);
    assert(existsSync(thumb), `thumb exists for ${meal.external_id}`);
    assertEqual(
      mealDeliveryPath(meal.external_id, "cover"),
      `/nutrition/meals/${meal.external_id}/cover.webp`,
      `${meal.external_id} cover url`,
    );
    assertEqual(
      mealStorageObjectPath(meal.external_id),
      `meals/${meal.external_id}/cover.webp`,
      `${meal.external_id} storage path uses external_id`,
    );
  }

  const meal001 = getMealByExternalId("MEAL-001");
  assert(meal001, "MEAL-001 exists");
  const breakfastAlts = findContractAlternatives(meal001);
  assert(
    breakfastAlts.every((item) => item.meal_type === "breakfast"),
    "alternatives stay on the same meal_type",
  );
  assert(
    breakfastAlts.every((item) => item.external_id !== "MEAL-001"),
    "alternatives exclude the source meal",
  );
  assert(
    breakfastAlts.every((item) => item.external_id.startsWith("MEAL-")),
    "alternatives come from the library",
  );

  const snack = getMealByExternalId("MEAL-015");
  assert(snack, "MEAL-015 exists");
  const snackAlts = findContractAlternatives(snack);
  assert(
    snackAlts.every((item) => item.meal_type === "snack"),
    "snack alternatives stay on snack",
  );

  const meal021 = getMealByExternalId("MEAL-021");
  assert(meal021, "MEAL-021 exists");
  assertEqual(meal021.meal_type, "breakfast", "MEAL-021 is breakfast");
  const meal061 = getMealByExternalId("MEAL-061");
  assert(meal061, "MEAL-061 exists");
  const meal098 = getMealByExternalId("MEAL-098");
  assert(meal098, "MEAL-098 exists");
  assertEqual(meal098.meal_type, "drinks", "MEAL-098 is drinks");
  const meal101 = getMealByExternalId("MEAL-101");
  assert(meal101, "MEAL-101 exists");
  assertEqual(meal101.meal_type, "breakfast", "MEAL-101 is breakfast");
  const meal300 = getMealByExternalId("MEAL-300");
  assert(meal300, "MEAL-300 exists");
  assertEqual(meal300.meal_type, "drinks", "MEAL-300 is drinks");

  const fatLossBreakfast = listMealsByType("breakfast").filter((meal) =>
    meal.suitable_goals.includes("fat_loss"),
  );
  const muscleGainLunch = listMealsByType("lunch").filter((meal) =>
    meal.suitable_goals.includes("muscle_gain"),
  );
  assert(fatLossBreakfast.length > 0, "breakfasts are ranked for fat_loss");
  assert(muscleGainLunch.length > 0, "lunches are ranked for muscle_gain");
  const fatLossOrdered = listMealsByGoal("fat_loss");
  assert(
    fatLossOrdered.every((meal, index) => {
      if (index === 0) return true;
      return fatLossOrdered[index - 1].calories <= meal.calories;
    }),
    "fat_loss list is ordered by calories",
  );

  const beefBowl = getMealByExternalId("MEAL-007");
  assert(beefBowl, "MEAL-007 exists");
  assert(beefBowl.allergens.includes("gluten"), "bulgur must be tagged gluten");

  assertEqual(NUTRITION_MEAL_SLOTS.length, 4, "dashboard keeps four plan slots");
  assertEqual(NUTRITION_MEAL_SLOTS[0]?.defaultMeal.id, "MEAL-001", "breakfast default");
  assertEqual(NUTRITION_MEAL_SLOTS[1]?.defaultMeal.id, "MEAL-015", "snack default");
  assertEqual(NUTRITION_MEAL_SLOTS[2]?.defaultMeal.id, "MEAL-005", "lunch default");
  assertEqual(NUTRITION_MEAL_SLOTS[3]?.defaultMeal.id, "MEAL-011", "dinner default");

  for (const slot of NUTRITION_MEAL_SLOTS) {
    const allowed = new Set([
      slot.defaultMeal.id,
      ...slot.alternatives.map((item) => item.id),
    ]);
    for (const option of [slot.defaultMeal, ...slot.alternatives]) {
      assert(allowed.has(option.id), `${slot.id} option ${option.id} is contract-approved`);
      const record = getMealByExternalId(option.id);
      assert(record, `plan option ${option.id} exists in library`);
      assertEqual(option.calories, record.calories, `${option.id} calories unchanged`);
      assertEqual(option.protein, record.protein_g, `${option.id} protein unchanged`);
      assertEqual(option.carbs, record.carbs_g, `${option.id} carbs unchanged`);
      assertEqual(option.fat, record.fat_g, `${option.id} fat unchanged`);
    }
  }
}

runMealLibraryTests();
console.log("meal library tests passed");
