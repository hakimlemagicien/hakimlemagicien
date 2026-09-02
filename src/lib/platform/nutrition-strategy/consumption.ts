import type { ConsumptionStatus, MacroTotals, NutritionConsumptionEvent } from "./types";

export function consumptionStatusFromLog(input: {
  status?: string | null;
  planned_servings?: number;
  consumed_servings?: number;
  has_log_row: boolean;
}): ConsumptionStatus {
  if (!input.has_log_row) return "NOT_LOGGED";
  const status = input.status ?? "";
  if (status === "skipped") return "SKIPPED";
  if (status === "swapped") return "SWAPPED";
  if (status === "partial") return "PARTIAL";
  if (status === "completed") return "COMPLETED";
  return "PLANNED";
}

export function computeConsumedTotals(events: NutritionConsumptionEvent[]): MacroTotals {
  return events.reduce(
    (sum, e) => {
      if (e.status !== "COMPLETED" && e.status !== "PARTIAL") return sum;
      return {
        calories: sum.calories + e.macros_consumed.calories,
        protein_g: sum.protein_g + e.macros_consumed.protein_g,
        carbs_g: sum.carbs_g + e.macros_consumed.carbs_g,
        fat_g: sum.fat_g + e.macros_consumed.fat_g,
      };
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

export function buildPartialConsumptionEvent(input: {
  slot_key: NutritionConsumptionEvent["slot_key"];
  source_external_id: string;
  planned_servings: number;
  consumed_servings: number;
  macros_per_serving: MacroTotals;
  session_date: string;
}): NutritionConsumptionEvent {
  const ratio = input.consumed_servings / input.planned_servings;
  return {
    slot_key: input.slot_key,
    status: input.consumed_servings <= 0 ? "SKIPPED" : input.consumed_servings < input.planned_servings ? "PARTIAL" : "COMPLETED",
    planned_servings: input.planned_servings,
    consumed_servings: input.consumed_servings,
    source_external_id: input.source_external_id,
    session_date: input.session_date,
    macros_consumed: {
      calories: Math.round(input.macros_per_serving.calories * ratio),
      protein_g: Math.round(input.macros_per_serving.protein_g * ratio * 10) / 10,
      carbs_g: Math.round(input.macros_per_serving.carbs_g * ratio * 10) / 10,
      fat_g: Math.round(input.macros_per_serving.fat_g * ratio * 10) / 10,
    },
  };
}
