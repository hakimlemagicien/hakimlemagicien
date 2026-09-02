import { supabase } from "@/integrations/supabase/client";
import { findContractAlternatives, getMealByExternalId } from "@/lib/platform/meal-library";
import { scaleMacros } from "@/lib/platform/nutrition-assignment";
import {
  detectAssignmentSchema,
  legacyPlannedTotalsFromSlots,
  type NutritionAssignmentSchema,
  type NutritionDayContext,
  type NutritionSlotKey,
  type NutritionTarget,
  type ResolvedNutritionDay,
  type ServingPolicy,
} from "@/lib/platform/nutrition-strategy";
import type { MealAlternative, MealSlot, MacroTotals } from "@/lib/platform/nutrition-experience";
import { mealDeliveryPath } from "@/lib/platform/meal-library";

export type NutritionTargetSnapshot = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type ClientNutritionRuntime = {
  reason: "ok" | "no_program" | "scheduled" | "legacy_incomplete";
  schema: NutritionAssignmentSchema;
  assignment: {
    id: string;
    status: string;
    name_ar: string | null;
    starts_on: string | null;
    watch_allergens: string[];
    schema_version?: string | null;
    strategy_version?: string | null;
    library_version?: string | null;
    target_id?: string | null;
    assignment_version?: number | null;
    validation_status?: string | null;
    resolved_snapshot?: Record<string, unknown> | null;
  } | null;
  target: NutritionTargetSnapshot | null;
  planned_totals: NutritionTargetSnapshot | null;
  consumed_totals: NutritionTargetSnapshot | null;
  day_type: string | null;
  ordered_slot_keys: string[] | null;
  slot_states: Record<string, string> | null;
  slot_roles: Record<string, string> | null;
  validation_result: Record<string, unknown> | null;
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
    slot_state?: string | null;
    counts_toward_day_totals?: boolean | null;
  }>;
  todayLogs: Array<{
    slot_key: string;
    status: string;
    assignment_id: string | null;
    consumed_servings?: number | null;
    planned_servings?: number | null;
  }>;
};

function num(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseMacroSnapshot(source: Record<string, unknown> | null | undefined): NutritionTargetSnapshot | null {
  if (!source) return null;
  const calories = num(source.calories);
  if (calories <= 0 && num(source.protein_g) <= 0) return null;
  return {
    calories,
    protein_g: num(source.protein_g),
    carbs_g: num(source.carbs_g),
    fat_g: num(source.fat_g),
  };
}

function parseTargetSnapshot(row: Record<string, unknown>): NutritionTargetSnapshot | null {
  const direct = parseMacroSnapshot(row.target as Record<string, unknown> | undefined);
  if (direct) return direct;
  const snapshot = row.resolved_snapshot as Record<string, unknown> | null | undefined;
  const fromSnapshot = snapshot?.target_snapshot as Record<string, unknown> | undefined;
  return parseMacroSnapshot(fromSnapshot);
}

function plannedTotalsFromRuntime(slots: ClientNutritionRuntime["slots"]): MacroTotals {
  const countable = slots.filter((slot) => slot.counts_toward_day_totals !== false);
  const legacy = legacyPlannedTotalsFromSlots(
    countable.map((s) => ({
      calories: s.calories,
      protein_g: s.protein_g,
      carbs_g: s.carbs_g,
      fat_g: s.fat_g,
      servings: s.servings,
    })),
  );
  return {
    calories: legacy.calories,
    protein: legacy.protein_g,
    carbs: legacy.carbs_g,
    fat: legacy.fat_g,
  };
}

export async function fetchMyNutritionRuntime(): Promise<ClientNutritionRuntime> {
  const { data, error } = await supabase.rpc("client_get_my_nutrition_runtime");
  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  const assignment = row.assignment as Record<string, unknown> | null;
  const slots = ((row.slots as Record<string, unknown>[]) ?? []).map((slot) => ({
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
    slot_state: (slot.slot_state as string | null) ?? null,
    counts_toward_day_totals: slot.counts_toward_day_totals as boolean | null | undefined,
  }));
  const schema = detectAssignmentSchema({
    schema_version: (assignment?.schema_version as string | null) ?? null,
    target_id: (assignment?.target_id as string | null) ?? null,
    slot_keys: slots.map((s) => s.slot_key),
  });
  return {
    reason: (row.reason as ClientNutritionRuntime["reason"]) || "no_program",
    schema,
    assignment: assignment
      ? {
          id: String(assignment.id),
          status: String(assignment.status),
          name_ar: (assignment.name_ar as string | null) ?? null,
          starts_on: (assignment.starts_on as string | null) ?? null,
          watch_allergens: (assignment.watch_allergens as string[]) ?? [],
          schema_version: (assignment.schema_version as string | null) ?? null,
          strategy_version: (assignment.strategy_version as string | null) ?? null,
          library_version: (assignment.library_version as string | null) ?? null,
          target_id: (assignment.target_id as string | null) ?? null,
          assignment_version: assignment.assignment_version == null ? null : num(assignment.assignment_version),
          validation_status: (assignment.validation_status as string | null) ?? null,
          resolved_snapshot: (assignment.resolved_snapshot as Record<string, unknown> | null) ?? null,
        }
      : null,
    target: parseTargetSnapshot(row),
    planned_totals: parseMacroSnapshot(row.planned as Record<string, unknown> | undefined),
    consumed_totals: parseMacroSnapshot(row.consumed as Record<string, unknown> | undefined),
    day_type: (row.day_type as string | null) ?? null,
    ordered_slot_keys: (row.ordered_slot_keys as string[] | null) ?? null,
    slot_states: (row.slot_states as Record<string, string> | null) ?? null,
    slot_roles: (row.slot_roles as Record<string, string> | null) ?? null,
    validation_result: (row.validation_result as Record<string, unknown> | null) ?? null,
    slots,
    todayLogs: ((row.today_logs as Record<string, unknown>[]) ?? []).map((log) => ({
      slot_key: String(log.slot_key),
      status: String(log.status),
      assignment_id: (log.assignment_id as string | null) ?? null,
      consumed_servings: log.consumed_servings == null ? null : num(log.consumed_servings),
      planned_servings: log.planned_servings == null ? null : num(log.planned_servings),
    })),
  };
}

export function runtimeDayContext(runtime: ClientNutritionRuntime): NutritionDayContext {
  const snapshot = runtime.assignment?.resolved_snapshot;
  const training = snapshot?.training_context as Record<string, unknown> | undefined;
  return {
    day_type: (runtime.day_type ?? training?.day_type ?? "REST_DAY") as NutritionDayContext["day_type"],
    training_time: training?.training_time as NutritionDayContext["training_time"],
    session_time: (training?.session_time as string | undefined) ?? undefined,
  };
}

export function runtimeToNutritionTarget(runtime: ClientNutritionRuntime): NutritionTarget | null {
  const target = runtime.target;
  if (!target) return null;
  const snapshot = runtime.assignment?.resolved_snapshot?.target_snapshot as Record<string, unknown> | undefined;
  return {
    id: runtime.assignment?.target_id ?? "runtime-target",
    version: runtime.assignment?.assignment_version ?? 1,
    calories: target.calories,
    protein_g: target.protein_g,
    carbs_g: target.carbs_g,
    fat_g: target.fat_g,
    reference_weight_kg: Number(snapshot?.reference_weight_kg ?? 0),
    nutrition_objective: (snapshot?.nutrition_objective as NutritionTarget["nutrition_objective"]) ?? "MAINTENANCE",
    goal_context: (snapshot?.goal_context as NutritionTarget["goal_context"]) ?? "GENERAL_HEALTH_FITNESS",
    target_source: "COACH_APPROVED",
    strategy_version: runtime.assignment?.strategy_version ?? "v1",
    target_created_at: new Date().toISOString(),
    target_reason: "active_assignment",
  };
}

export function runtimeToResolvedNutritionDay(runtime: ClientNutritionRuntime): ResolvedNutritionDay | null {
  if (runtime.reason !== "ok" || runtime.schema !== "STRATEGY_V1_DYNAMIC") return null;

  const slotStates = (runtime.slot_states ?? {}) as ResolvedNutritionDay["slot_states"];
  const slotRoles = (runtime.slot_roles ?? {}) as ResolvedNutritionDay["slot_roles"];
  const orderedSlots = runtime.slots.map((slot, index) => ({
    slot_key: slot.slot_key as NutritionSlotKey,
    slot_state: (slot.slot_state ?? slotStates[slot.slot_key as NutritionSlotKey] ?? "ACTIVE") as ResolvedNutritionDay["ordered_slots"][number]["slot_state"],
    slot_role: (slotRoles[slot.slot_key as NutritionSlotKey] ?? "PRIMARY_MEAL") as ResolvedNutritionDay["ordered_slots"][number]["slot_role"],
    counts_toward_day_totals: slot.counts_toward_day_totals !== false,
    display_order: index,
    hour: slot.hour,
    minute: slot.minute,
  }));

  const assignedMeals = runtime.slots
    .filter((slot) => {
      const state = slot.slot_state ?? slotStates[slot.slot_key as NutritionSlotKey] ?? "ACTIVE";
      return state !== "NOT_REQUIRED" && state !== "SATISFIED_BY_OTHER_MEAL";
    })
    .map((slot) => {
      const meal = getMealByExternalId(slot.source_external_id);
      if (!meal) throw new Error(`meal_not_found:${slot.source_external_id}`);
      return {
        slot_key: slot.slot_key as NutritionSlotKey,
        external_id: slot.source_external_id,
        meal,
        servings: slot.servings,
        serving_policy: "LIMITED_SCALING" as ServingPolicy,
        macros: {
          calories: slot.calories,
          protein_g: slot.protein_g,
          carbs_g: slot.carbs_g,
          fat_g: slot.fat_g,
        },
      };
    });

  const planned = runtime.planned_totals ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const validation = runtime.validation_result as ResolvedNutritionDay["validation_result"] | null;

  return {
    ordered_slots: orderedSlots,
    slot_states: slotStates,
    slot_roles: slotRoles,
    assigned_meals: assignedMeals,
    servings: Object.fromEntries(runtime.slots.map((slot) => [slot.slot_key, slot.servings])) as ResolvedNutritionDay["servings"],
    alternatives: {},
    planned_totals: {
      calories: planned.calories,
      protein_g: planned.protein_g,
      carbs_g: planned.carbs_g,
      fat_g: planned.fat_g,
    },
    validation_result: validation ?? {
      status: "VALID",
      calories: { delta_pct: 0, band: "PASS" },
      protein: { pct_of_target: 100, band: "PASS" },
      carbs: { delta_pct: 0, band: "PASS" },
      fats: { delta_pct: 0, band: "PASS" },
      issues: [],
    },
    decision_trace: [],
  };
}

export function runtimeMacroLayers(runtime: ClientNutritionRuntime): {
  target: MacroTotals | null;
  planned: MacroTotals;
  consumed: MacroTotals;
} {
  const plannedServer = runtime.planned_totals;
  const planned = plannedServer
    ? {
        calories: plannedServer.calories,
        protein: plannedServer.protein_g,
        carbs: plannedServer.carbs_g,
        fat: plannedServer.fat_g,
      }
    : plannedTotalsFromRuntime(runtime.slots);
  const targetSnap = runtime.target;
  const target = targetSnap
    ? {
        calories: targetSnap.calories,
        protein: targetSnap.protein_g,
        carbs: targetSnap.carbs_g,
        fat: targetSnap.fat_g,
      }
    : null;
  const consumedSnap = runtime.consumed_totals;
  const consumed = consumedSnap
    ? {
        calories: consumedSnap.calories,
        protein: consumedSnap.protein_g,
        carbs: consumedSnap.carbs_g,
        fat: consumedSnap.fat_g,
      }
    : { calories: 0, protein: 0, carbs: 0, fat: 0 };
  return { target, planned, consumed };
}

export async function logMyNutritionMeal(
  slotId: string,
  status: "completed" | "skipped" | "partial",
  sessionDate?: string,
  consumedServings?: number,
) {
  const { error } = await supabase.rpc("client_log_nutrition_meal", {
    p_slot_id: slotId,
    p_status: status,
    p_session_date: sessionDate ?? new Date().toISOString().slice(0, 10),
    p_consumed_servings: consumedServings ?? null,
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
