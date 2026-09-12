import assert from "node:assert/strict";
import {
  FREE_ENTITLEMENTS,
  isExerciseUnlockedByEntitlements,
  isMealSlotUnlockedByEntitlements,
  isTrainingPreviewMode,
  normalizeEntitlements,
} from "@/lib/platform/entitlements";
import { countVisibleSessionExercises } from "@/lib/platform/training-preview-access";
import {
  getNutritionMealSlots,
  resolveFreeBreakfastGoalKey,
} from "@/lib/platform/nutrition-experience";
import { TRAINING_PRODUCT_COPY, NUTRITION_PRODUCT_COPY } from "@/lib/platform/training-product-copy";
import {
  FREE_MEMBERSHIP_V1_CONTRACT,
  FREE_TRAINING_PROMO_VIDEO_SRC,
} from "@/lib/platform/free-membership-v1";

assert(isTrainingPreviewMode(FREE_ENTITLEMENTS), "FREE training preview mode");
assert(FREE_ENTITLEMENTS.training.allowedExercisesPerSession === 0, "allowed exercises = 0");
assert(FREE_ENTITLEMENTS.training.previewExercises === true, "structure preview on");
assert(FREE_ENTITLEMENTS.training.fullSession === false, "full session off");
assert(!isExerciseUnlockedByEntitlements(FREE_ENTITLEMENTS, 0, { isToday: true }), "no free exercise");
assert(countVisibleSessionExercises(FREE_ENTITLEMENTS, 6) === 0, "visible exercises = 0");

assert(
  isMealSlotUnlockedByEntitlements(FREE_ENTITLEMENTS, {
    slotId: "breakfast",
    slotIndex: 0,
    dateKey: "2026-09-12",
    todayKey: "2026-09-12",
  }),
  "breakfast unlocked",
);
assert(
  !isMealSlotUnlockedByEntitlements(FREE_ENTITLEMENTS, {
    slotId: "lunch",
    slotIndex: 2,
    dateKey: "2026-09-12",
    todayKey: "2026-09-12",
  }),
  "lunch locked",
);

assert.equal(resolveFreeBreakfastGoalKey("fat"), "fat_loss");
assert.equal(resolveFreeBreakfastGoalKey("muscle"), "muscle_gain");
assert.equal(resolveFreeBreakfastGoalKey("athletic"), "maintenance");

const fatBreakfast = getNutritionMealSlots({ breakfastGoalKey: "fat_loss" })[0]!.defaultMeal;
const muscleBreakfast = getNutritionMealSlots({ breakfastGoalKey: "muscle_gain" })[0]!.defaultMeal;
assert(fatBreakfast.id.startsWith("MEAL-"), "fat breakfast from library");
assert(muscleBreakfast.id.startsWith("MEAL-"), "muscle breakfast from library");
assert(fatBreakfast.ingredients.length > 0, "breakfast has ingredients");
assert(fatBreakfast.calories > 0, "breakfast has calories");

const paid = normalizeEntitlements({
  tier: "essential",
  is_paid: true,
  training: { full_session: true, allowed_exercises_per_session: null },
  nutrition: { full_day: true, allowed_meals_per_day: null },
});
assert(paid.training.fullSession, "PLUS full training");
assert(isExerciseUnlockedByEntitlements(paid, 5, { isToday: true }), "PLUS exercises unlocked");
assert(paid.nutrition.fullDay, "PLUS full nutrition");

assert(TRAINING_PRODUCT_COPY.upgradeCta.includes("افتح برنامجك"), "training CTA");
assert(NUTRITION_PRODUCT_COPY.freeUpgradeCta.includes("غذائية"), "nutrition CTA");
assert(!TRAINING_PRODUCT_COPY.freePreviewFooter(6).includes("تمرين واحد"), "no one-exercise copy");
assert(FREE_TRAINING_PROMO_VIDEO_SRC.includes("training-promo"), "promo video path");
assert(FREE_MEMBERSHIP_V1_CONTRACT.training.exercise_content === false, "exercise content off");
assert(FREE_MEMBERSHIP_V1_CONTRACT.nutrition.breakfast === true, "breakfast on");

console.log("free-membership-v1 tests passed");
