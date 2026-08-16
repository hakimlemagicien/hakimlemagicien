import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  auditMealLibrary,
  findContractAlternatives,
  getMealByExternalId,
  listMealLibrary,
  mealDeliveryPath,
  mealStorageObjectPath,
  MEAL_LIBRARY_PILOT_END,
  MEAL_LIBRARY_PILOT_START,
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

  assertEqual(meals.length, 20, "pilot meal count");
  assertEqual(ids[0], MEAL_LIBRARY_PILOT_START, "first external_id");
  assertEqual(ids[ids.length - 1], MEAL_LIBRARY_PILOT_END, "last external_id");
  assertEqual(new Set(ids).size, 20, "unique external_id");
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
  assertEqual(snackAlts.length, 0, "MEAL-015 has no in-band snack alternative in the pilot");

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
