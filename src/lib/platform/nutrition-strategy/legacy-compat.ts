import { NUTRITION_SLOT_KEYS } from "../nutrition-assignment";
import type { NutritionAssignmentSchema } from "./types";

export function detectAssignmentSchema(input: {
  schema_version?: string | null;
  target_id?: string | null;
  slot_keys: string[];
}): NutritionAssignmentSchema {
  if (input.schema_version === "STRATEGY_V1_DYNAMIC") return "STRATEGY_V1_DYNAMIC";
  if (input.target_id) return "STRATEGY_V1_DYNAMIC";
  const keys = new Set(input.slot_keys);
  const isLegacy4 =
    keys.size === 4 && NUTRITION_SLOT_KEYS.every((k) => keys.has(k));
  return isLegacy4 ? "LEGACY_4_SLOT" : "LEGACY_4_SLOT";
}

export function isLegacy4SlotAssignment(schema: NutritionAssignmentSchema): boolean {
  return schema === "LEGACY_4_SLOT";
}

export function legacyPlannedTotalsFromSlots(
  slots: Array<{
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    servings: number;
  }>,
): { calories: number; protein_g: number; carbs_g: number; fat_g: number } {
  return slots.reduce(
    (sum, s) => ({
      calories: sum.calories + s.calories * s.servings,
      protein_g: sum.protein_g + s.protein_g * s.servings,
      carbs_g: sum.carbs_g + s.carbs_g * s.servings,
      fat_g: sum.fat_g + s.fat_g * s.servings,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}
