/** Closed domain contract values — MAAKFIT Nutrition Domain Contract V1 + Architecture V1. */

export const NUTRITION_STRATEGY_VERSION = "nutrition-strategy-v1";

export const CALORIE_ADJUSTMENT_PCT: Record<string, number> = {
  FAT_LOSS: -0.15,
  MUSCLE_GAIN: 0.07,
  BODY_RECOMPOSITION: -0.05,
  PERFORMANCE_MAINTENANCE: 0,
  MAINTENANCE: 0,
};

export const PROTEIN_G_PER_KG: Record<string, number> = {
  FAT_LOSS: 2.0,
  MUSCLE_GAIN: 1.8,
  BODY_RECOMPOSITION: 2.2,
  PERFORMANCE_MAINTENANCE: 1.8,
  MAINTENANCE: 1.6,
};

export const PROTEIN_CAP_G_PER_KG = 2.2;

export const FAT_PCT_OF_CALORIES = 0.275;
export const FAT_FLOOR_G_PER_KG = 0.6;

export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const CALORIE_TOLERANCE = { passPct: 5, reviewPct: 10 };
export const PROTEIN_TOLERANCE = { minPct: 95, maxPct: 110 };
export const MACRO_TOLERANCE_PCT = 10;

export const SERVING_LIMITS: Record<
  string,
  { min: number; max: number; policy: "FIXED_SERVING" | "LIMITED_SCALING" | "FLEXIBLE_SCALING" }
> = {
  breakfast: { min: 0.75, max: 1.5, policy: "LIMITED_SCALING" },
  lunch: { min: 0.75, max: 1.5, policy: "LIMITED_SCALING" },
  dinner: { min: 0.75, max: 1.5, policy: "LIMITED_SCALING" },
  snack: { min: 0.75, max: 1.25, policy: "LIMITED_SCALING" },
  pre_workout: { min: 0.75, max: 1.25, policy: "LIMITED_SCALING" },
  post_workout: { min: 0.75, max: 1.25, policy: "LIMITED_SCALING" },
  drinks: { min: 0.75, max: 1.5, policy: "FLEXIBLE_SCALING" },
};

export const VARIETY_AVOID_REPEAT_DAYS: Record<string, number> = {
  breakfast: 3,
  lunch: 4,
  dinner: 4,
  snack: 2,
  pre_workout: 2,
  post_workout: 2,
  drinks: 2,
};

export const MAX_PRIMARY_REPEAT_PER_7_DAYS = 2;

export const PRE_POST_TIMING_HOURS = {
  satisfiedByWindow: 2,
  optionalWindow: 4,
};

export const SWAP_MAX_CALORIE_DELTA_PCT = 10;
export const SWAP_MAX_PROTEIN_DELTA_G = 8;

export const BEAM_WIDTH_PER_SLOT = 8;
