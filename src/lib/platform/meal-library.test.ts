import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  auditMealLibrary,
  dbMealCatalogIsV2,
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

  assert(dbMealCatalogIsV2(meals), "current seed is recognized as Nutrition V2");
  assert(
    !dbMealCatalogIsV2([{ external_id: "MEAL-186", meal_type: "breakfast" }]),
    "V1 type layout is not treated as V2",
  );
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

  const snack = getMealByExternalId("MEAL-186");
  assert(snack, "MEAL-186 exists");
  assertEqual(snack.meal_type, "snack", "MEAL-186 is snack");
  const snackAlts = findContractAlternatives(snack);
  assert(
    snackAlts.every((item) => item.meal_type === "snack"),
    "snack alternatives stay on snack",
  );

  const meal021 = getMealByExternalId("MEAL-021");
  assert(meal021, "MEAL-021 exists");
  assertEqual(meal021.meal_type, "breakfast", "MEAL-021 is breakfast");
  const meal056 = getMealByExternalId("MEAL-056");
  assert(meal056, "MEAL-056 exists");
  assertEqual(meal056.meal_type, "lunch", "MEAL-056 is lunch");
  const meal061 = getMealByExternalId("MEAL-061");
  assert(meal061, "MEAL-061 exists");
  assertEqual(meal061.meal_type, "lunch", "MEAL-061 is lunch");
  const meal126 = getMealByExternalId("MEAL-126");
  assert(meal126, "MEAL-126 exists");
  assertEqual(meal126.meal_type, "dinner", "MEAL-126 is dinner");
  const meal281 = getMealByExternalId("MEAL-281");
  assert(meal281, "MEAL-281 exists");
  assertEqual(meal281.meal_type, "drinks", "MEAL-281 is drinks");
  const meal300 = getMealByExternalId("MEAL-300");
  assert(meal300, "MEAL-300 exists");
  assertEqual(meal300.meal_type, "drinks", "MEAL-300 is drinks");
  assertEqual(listMealsByType("breakfast").length, 55, "v2 breakfast count");
  assertEqual(listMealsByType("lunch").length, 70, "v2 lunch count");
  assertEqual(listMealsByType("dinner").length, 60, "v2 dinner count");
  assertEqual(listMealsByType("snack").length, 40, "v2 snack count");
  assertEqual(listMealsByType("pre_workout").length, 25, "v2 pre_workout count");
  assertEqual(listMealsByType("post_workout").length, 30, "v2 post_workout count");
  assertEqual(listMealsByType("drinks").length, 20, "v2 drinks count");

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

  const glutenMeal = getMealByExternalId("MEAL-019");
  assert(glutenMeal, "MEAL-019 exists");
  assert(glutenMeal.allergens.includes("gluten"), "wheat/gluten meals stay tagged gluten");

  assertEqual(NUTRITION_MEAL_SLOTS.length, 4, "dashboard keeps four plan slots");
  assertEqual(NUTRITION_MEAL_SLOTS[0]?.defaultMeal.id, "MEAL-001", "breakfast default");
  assertEqual(NUTRITION_MEAL_SLOTS[1]?.defaultMeal.id, "MEAL-186", "snack default");
  assertEqual(NUTRITION_MEAL_SLOTS[2]?.defaultMeal.id, "MEAL-056", "lunch default");
  assertEqual(NUTRITION_MEAL_SLOTS[3]?.defaultMeal.id, "MEAL-126", "dinner default");
  assertEqual(NUTRITION_MEAL_SLOTS[0]?.defaultMeal.calories, meal001.calories, "slot calories follow V2");

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
