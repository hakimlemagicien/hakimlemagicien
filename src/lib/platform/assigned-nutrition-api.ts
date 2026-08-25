import { supabase } from "@/integrations/supabase/client";
import { findContractAlternatives, getMealByExternalId } from "@/lib/platform/meal-library";
import { scaleMacros } from "@/lib/platform/nutrition-assignment";
import type { MealAlternative, MealSlot } from "@/lib/platform/nutrition-experience";
import { mealDeliveryPath } from "@/lib/platform/meal-library";

export type ClientNutritionRuntime = {
  reason: "ok" | "no_program" | "scheduled" | "legacy_incomplete";
  assignment: {
    id: string;
    status: string;
    name_ar: string | null;
    starts_on: string | null;
    watch_allergens: string[];
  } | null;
  slots: Array<{
    id: string;
    slot_key: string;
    slot_label: string;
    time_label: string;
    hour: number;
    minute: number;
    source_external_id: string;
    name_ar: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    servings: number;
    allergens: string[];
    notes_ar: string | null;
    serving_size: number | null;
    serving_unit: string | null;
  }>;
  todayLogs: Array<{ slot_key: string; status: string; assignment_id: string | null }>;
};

function num(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function fetchMyNutritionRuntime(): Promise<ClientNutritionRuntime> {
  const { data, error } = await supabase.rpc("client_get_my_nutrition_runtime");
  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  const assignment = row.assignment as Record<string, unknown> | null;
  return {
    reason: (row.reason as ClientNutritionRuntime["reason"]) || "no_program",
    assignment: assignment
      ? {
          id: String(assignment.id),
          status: String(assignment.status),
          name_ar: (assignment.name_ar as string | null) ?? null,
          starts_on: (assignment.starts_on as string | null) ?? null,
          watch_allergens: (assignment.watch_allergens as string[]) ?? [],
        }
      : null,
    slots: ((row.slots as Record<string, unknown>[]) ?? []).map((slot) => ({
      id: String(slot.id),
      slot_key: String(slot.slot_key),
      slot_label: String(slot.slot_label),
      time_label: String(slot.time_label),
      hour: num(slot.hour),
      minute: num(slot.minute),
      source_external_id: String(slot.source_external_id),
      name_ar: String(slot.name_ar),
      calories: num(slot.calories),
      protein_g: num(slot.protein_g),
      carbs_g: num(slot.carbs_g),
      fat_g: num(slot.fat_g),
      servings: num(slot.servings) || 1,
      allergens: (slot.allergens as string[]) ?? [],
      notes_ar: (slot.notes_ar as string | null) ?? null,
      serving_size: slot.serving_size == null ? null : num(slot.serving_size),
      serving_unit: (slot.serving_unit as string | null) ?? null,
    })),
    todayLogs: ((row.today_logs as Record<string, unknown>[]) ?? []).map((log) => ({
      slot_key: String(log.slot_key),
      status: String(log.status),
      assignment_id: (log.assignment_id as string | null) ?? null,
    })),
  };
}

export async function logMyNutritionMeal(slotId: string, status: "completed" | "skipped", sessionDate?: string) {
  const { error } = await supabase.rpc("client_log_nutrition_meal", {
    p_slot_id: slotId,
    p_status: status,
    p_session_date: sessionDate ?? new Date().toISOString().slice(0, 10),
  });
  if (error) throw error;
}

function toAlternativeFromSnapshot(slot: ClientNutritionRuntime["slots"][number]): MealAlternative {
  const macros = scaleMacros(slot);
  const library = getMealByExternalId(slot.source_external_id);
  return {
    id: slot.source_external_id,
    name: slot.name_ar,
    image: mealDeliveryPath(slot.source_external_id, "thumb"),
    coverImage: mealDeliveryPath(slot.source_external_id, "cover"),
    calories: macros.calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
    ingredients: library?.ingredients.map((ingredient) => ({
      id: `${slot.source_external_id}-${ingredient.ingredient_order}-${ingredient.ingredient_key}`,
      name: ingredient.name_ar,
      amount: `${ingredient.quantity * slot.servings} ${ingredient.unit}`,
    })) ?? [],
    steps: library?.preparation_steps_ar ?? [],
    allergens: slot.allergens,
    servingSize: slot.serving_size ?? undefined,
    servingUnit: slot.serving_unit ?? undefined,
    description: slot.notes_ar ?? library?.description_ar,
  };
}

export function runtimeToMealSlots(runtime: ClientNutritionRuntime): MealSlot[] {
  if (runtime.reason !== "ok") return [];
  return runtime.slots.map((slot) => {
    const library = getMealByExternalId(slot.source_external_id);
    const alternatives = library
      ? findContractAlternatives(library, undefined, runtime.assignment?.watch_allergens ?? []).map((meal) => {
          const macros = scaleMacros({
            calories: meal.calories,
            protein_g: meal.protein_g,
            carbs_g: meal.carbs_g,
            fat_g: meal.fat_g,
            servings: slot.servings,
          });
          return {
            id: meal.external_id,
            name: meal.name_ar,
            image: mealDeliveryPath(meal.external_id, "thumb"),
            coverImage: mealDeliveryPath(meal.external_id, "cover"),
            calories: macros.calories,
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat,
            ingredients: meal.ingredients.map((ingredient) => ({
              id: `${meal.external_id}-${ingredient.ingredient_order}-${ingredient.ingredient_key}`,
              name: ingredient.name_ar,
              amount: `${ingredient.quantity * slot.servings} ${ingredient.unit}`,
            })),
            steps: meal.preparation_steps_ar,
            allergens: meal.allergens,
            servingSize: meal.serving_size,
            servingUnit: meal.serving_unit,
            description: meal.description_ar,
          };
        })
      : [];
    return {
      id: slot.slot_key,
      slotLabel: slot.slot_label,
      timeLabel: slot.time_label,
      hour: slot.hour,
      minute: slot.minute,
      defaultMeal: toAlternativeFromSnapshot(slot),
      alternatives,
      assignmentSlotId: slot.id,
    };
  });
}
