import { computeBmr } from "../calorie-calculator";
import {
  ACTIVITY_MULTIPLIERS,
  CALORIE_ADJUSTMENT_PCT,
  FAT_FLOOR_G_PER_KG,
  FAT_PCT_OF_CALORIES,
  NUTRITION_STRATEGY_VERSION,
  PROTEIN_CAP_G_PER_KG,
  PROTEIN_G_PER_KG,
} from "./constants";
import type {
  ClientNutritionProfile,
  NutritionObjective,
  NutritionTarget,
  NutritionTargetSource,
} from "./types";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function computeNutritionTarget(input: {
  profile: ClientNutritionProfile;
  nutrition_objective: NutritionObjective;
  goal_context: string;
  target_source?: NutritionTargetSource;
  target_reason?: string;
  version?: number;
  previous_target_id?: string;
  id?: string;
}): NutritionTarget | { code: "NUTRITION_TARGET_REVIEW_REQUIRED"; protein_g_per_kg: number } {
  const { profile, nutrition_objective } = input;
  const bmr = computeBmr({
    gender: profile.gender,
    age: profile.age,
    weightKg: profile.weight_kg,
    heightCm: profile.height_cm,
  });
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activity_level] ?? 1.55;
  const tdee = Math.round(bmr * multiplier);
  const adjPct = CALORIE_ADJUSTMENT_PCT[nutrition_objective] ?? 0;
  const calories = Math.max(1200, Math.round(tdee * (1 + adjPct)));

  const proteinGPerKg = PROTEIN_G_PER_KG[nutrition_objective] ?? 1.6;
  let review_required = false;
  if (proteinGPerKg > PROTEIN_CAP_G_PER_KG) {
    review_required = true;
  }
  const cappedProteinGPerKg = Math.min(proteinGPerKg, PROTEIN_CAP_G_PER_KG);
  const protein_g = round1(profile.weight_kg * cappedProteinGPerKg);

  const fatFromPct = Math.round((calories * FAT_PCT_OF_CALORIES) / 9);
  const fatFloor = Math.round(profile.weight_kg * FAT_FLOOR_G_PER_KG);
  const fat_g = Math.max(fatFromPct, fatFloor);

  const proteinKcal = protein_g * 4;
  const fatKcal = fat_g * 9;
  const carbsKcal = calories - proteinKcal - fatKcal;
  if (carbsKcal < 0) {
    return { code: "NUTRITION_TARGET_REVIEW_REQUIRED", protein_g_per_kg: proteinGPerKg };
  }
  const carbs_g = round1(carbsKcal / 4);

  const target: NutritionTarget = {
    id: input.id ?? `target-${Date.now()}`,
    version: input.version ?? 1,
    calories,
    protein_g,
    fat_g,
    carbs_g,
    reference_weight_kg: profile.weight_kg,
    nutrition_objective,
    goal_context: input.goal_context as NutritionTarget["goal_context"],
    target_source: input.target_source ?? "ENGINE_APPROVED",
    strategy_version: NUTRITION_STRATEGY_VERSION,
    target_created_at: new Date().toISOString(),
    target_reason: input.target_reason ?? "ENGINE_INITIAL_TARGET",
    previous_target_id: input.previous_target_id,
    review_required,
  };

  return target;
}
