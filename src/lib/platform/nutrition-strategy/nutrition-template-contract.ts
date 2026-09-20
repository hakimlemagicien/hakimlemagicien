import type { MealLibraryRecord } from "../meal-library";
import type {
  ClientGoalId,
  NutritionDayContext,
  NutritionObjective,
  NutritionSlotKey,
} from "./types";

export const NUTRITION_TEMPLATE_BUCKETS = ["FAT_LOSS", "MUSCLE_GAIN", "MAINTENANCE"] as const;
export type NutritionTemplateBucket = (typeof NUTRITION_TEMPLATE_BUCKETS)[number];

export const NUTRITION_TEMPLATE_GOAL_OPTIONS: Record<ClientGoalId, NutritionTemplateBucket[]> = {
  FAT_LOSS: ["FAT_LOSS"],
  WAIST_DEFINITION: ["FAT_LOSS", "MAINTENANCE"],
  MUSCLE_GAIN: ["MUSCLE_GAIN"],
  GLUTE_GROWTH: ["MUSCLE_GAIN"],
  BODY_RECOMPOSITION: ["MAINTENANCE"],
  UPPER_BODY_DEFINITION: ["MAINTENANCE", "MUSCLE_GAIN"],
  FEMININE_BALANCED_BODY: ["MAINTENANCE", "MUSCLE_GAIN"],
  STRENGTH_PERFORMANCE: ["MAINTENANCE", "MUSCLE_GAIN"],
  FITNESS_ENDURANCE: ["MAINTENANCE", "FAT_LOSS"],
  MOBILITY_RECOVERY: ["MAINTENANCE"],
  POSTURE_BACK_HEALTH: ["MAINTENANCE"],
  GENERAL_HEALTH_FITNESS: ["MAINTENANCE", "FAT_LOSS"],
};

export function templateBucketFromObjective(
  objective: NutritionObjective,
): NutritionTemplateBucket {
  if (objective === "FAT_LOSS") return "FAT_LOSS";
  if (objective === "MUSCLE_GAIN") return "MUSCLE_GAIN";
  return "MAINTENANCE";
}

export function isConservativePreWorkoutMeal(meal: MealLibraryRecord): boolean {
  const fiber = meal.qa?.derived_fiber_g;
  // Production's managed catalog does not yet store fiber for every meal.
  // Apply the ceiling when the value exists; never invent a value or empty the
  // entire pre-workout pool solely because this optional field is unavailable.
  const fiberIsManageable = typeof fiber !== "number" || fiber <= 10;
  return (
    meal.meal_type === "pre_workout" &&
    meal.carbs_g >= 20 &&
    meal.fat_g <= 15 &&
    fiberIsManageable &&
    meal.calories <= 500 &&
    meal.serving_size <= 600
  );
}

export function isConservativePostWorkoutMeal(meal: MealLibraryRecord): boolean {
  return (
    meal.meal_type === "post_workout" &&
    meal.protein_g >= 20 &&
    meal.carbs_g >= 20 &&
    meal.fat_g <= 20 &&
    meal.calories <= 700 &&
    meal.serving_size <= 700
  );
}

export function isMealSafeForNutritionSlot(
  slot: NutritionSlotKey,
  meal: MealLibraryRecord,
): boolean {
  if (slot === "breakfast") return meal.meal_type === "breakfast";
  if (slot === "lunch") return meal.meal_type === "lunch";
  if (slot === "dinner") return meal.meal_type === "dinner";
  if (slot === "snack") return meal.meal_type === "snack";
  if (slot === "pre_workout") return isConservativePreWorkoutMeal(meal);
  if (slot === "post_workout") return isConservativePostWorkoutMeal(meal);
  return false;
}

export const TRAINING_MEAL_WINDOWS = [
  "before_breakfast",
  "after_breakfast",
  "before_lunch",
  "after_lunch",
  "before_evening_meal",
  "after_evening_meal",
  "before_dinner",
  "after_dinner",
] as const;
export type TrainingMealWindow = (typeof TRAINING_MEAL_WINDOWS)[number];

const WINDOW_ORDER: Record<TrainingMealWindow, NutritionSlotKey[]> = {
  before_breakfast: ["pre_workout", "post_workout", "breakfast", "lunch", "snack", "dinner"],
  after_breakfast: ["breakfast", "pre_workout", "post_workout", "lunch", "snack", "dinner"],
  before_lunch: ["breakfast", "pre_workout", "post_workout", "lunch", "snack", "dinner"],
  after_lunch: ["breakfast", "lunch", "pre_workout", "post_workout", "snack", "dinner"],
  before_evening_meal: ["breakfast", "lunch", "pre_workout", "post_workout", "snack", "dinner"],
  after_evening_meal: ["breakfast", "lunch", "snack", "pre_workout", "post_workout", "dinner"],
  before_dinner: ["breakfast", "lunch", "snack", "pre_workout", "post_workout", "dinner"],
  after_dinner: ["breakfast", "lunch", "snack", "dinner", "pre_workout", "post_workout"],
};

export function isTrainingMealWindow(
  value: string | null | undefined,
): value is TrainingMealWindow {
  return TRAINING_MEAL_WINDOWS.includes(value as TrainingMealWindow);
}

export function slotOrderForTrainingMealWindow(window: TrainingMealWindow): NutritionSlotKey[] {
  return [...WINDOW_ORDER[window]];
}

export function dayContextForTrainingMealWindow(window: TrainingMealWindow): NutritionDayContext {
  const map: Record<
    TrainingMealWindow,
    { training_time: NutritionDayContext["training_time"]; session_time: string }
  > = {
    before_breakfast: { training_time: "MORNING", session_time: "06:30" },
    after_breakfast: { training_time: "MORNING", session_time: "09:30" },
    before_lunch: { training_time: "MIDDAY", session_time: "12:30" },
    after_lunch: { training_time: "AFTERNOON", session_time: "15:00" },
    before_evening_meal: { training_time: "AFTERNOON", session_time: "16:30" },
    after_evening_meal: { training_time: "EVENING", session_time: "18:00" },
    before_dinner: { training_time: "EVENING", session_time: "18:30" },
    after_dinner: { training_time: "EVENING", session_time: "21:00" },
  };
  return {
    day_type: "TRAINING_DAY",
    ...map[window],
    training_meal_window: window,
    force_six_meals: true,
  };
}
