import { MEAL_LIBRARY_SCHEMA_VERSION } from "../meal-library";
import { NUTRITION_STRATEGY_VERSION } from "./constants";
import { resolveNutritionGoalProfile } from "./goal-profile-resolver";
import { resolveNutritionDay } from "./resolve-nutrition-day";
import { computeNutritionTarget } from "./target-engine";
import { applySwapWithWholeDayValidation } from "./swap-service";
import type {
  AllergyState,
  ClientGoalId,
  ClientNutritionProfile,
  MacroTotals,
  NutritionDayContext,
  NutritionFailClosedOutcome,
  NutritionTarget,
  ResolvedNutritionDay,
} from "./types";
import { isFailClosed } from "./index";

const SLOT_LABELS: Record<string, { ar: string; time: string }> = {
  breakfast: { ar: "الفطور", time: "8:00 ص" },
  snack: { ar: "سناك", time: "11:00 ص" },
  lunch: { ar: "الغداء", time: "2:00 م" },
  pre_workout: { ar: "قبل التمرين", time: "5:00 م" },
  post_workout: { ar: "بعد التمرين", time: "7:00 م" },
  dinner: { ar: "العشاء", time: "8:00 م" },
};

export type StrategyAssignmentSlotPayload = {
  slot_key: string;
  slot_state: string;
  slot_role: string;
  satisfied_by_slot_key?: string | null;
  source_external_id: string;
  servings: number;
  planned_servings: number;
  serving_policy: string;
  counts_toward_day_totals: boolean;
  display_order: number;
  hour: number;
  minute: number;
  slot_label: string;
  time_label: string;
  sort_order: number;
};

export type StrategyAssignmentPersistPayload = {
  name_ar: string;
  strategy_version: string;
  library_version: string;
  day_type: string;
  training_time?: string | null;
  session_time?: string | null;
  validation_status: string;
  target: {
    nutrition_objective: string;
    goal_context: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    reference_weight_kg: number;
    reference_weight_source: string;
    target_source: string;
    target_reason: string;
  };
  decision_trace: {
    reason: string;
    summary: string;
    metadata: Record<string, unknown>;
  };
  resolved_snapshot: Record<string, unknown>;
  slots: StrategyAssignmentSlotPayload[];
};

export type StrategySwapPersistPayload = {
  slot_key: string;
  to_external_id: string;
  servings: number;
  validation_status: string;
  planned_totals: MacroTotals;
  resolved_snapshot: Record<string, unknown>;
  decision_trace: {
    reason: string;
    summary: string;
    metadata: Record<string, unknown>;
  };
  slots: StrategyAssignmentSlotPayload[];
};

export function buildResolvedSnapshot(input: {
  day: ResolvedNutritionDay;
  target: NutritionTarget;
  dayContext: NutritionDayContext;
}): Record<string, unknown> {
  return {
    strategy_version: NUTRITION_STRATEGY_VERSION,
    date_template: input.dayContext.day_type,
    ordered_slot_keys: input.day.ordered_slots.map((s) => s.slot_key),
    slot_states: input.day.slot_states,
    slot_roles: input.day.slot_roles,
    planned_totals: input.day.planned_totals,
    validation_result: input.day.validation_result,
    target_snapshot: {
      id: input.target.id,
      calories: input.target.calories,
      protein_g: input.target.protein_g,
      carbs_g: input.target.carbs_g,
      fat_g: input.target.fat_g,
    },
    training_context: {
      day_type: input.dayContext.day_type,
      session_time: input.dayContext.session_time ?? null,
      training_time: input.dayContext.training_time ?? null,
    },
  };
}

function slotsToPersistPayload(day: ResolvedNutritionDay): StrategyAssignmentSlotPayload[] {
  const mealBySlot = new Map(day.assigned_meals.map((m) => [m.slot_key, m]));
  return day.ordered_slots
    .filter((slot) => slot.slot_state !== "NOT_REQUIRED" || slot.satisfied_by_slot_key)
    .map((slot) => {
      const meal = mealBySlot.get(slot.slot_key);
      const labels = SLOT_LABELS[slot.slot_key] ?? { ar: slot.slot_key, time: "" };
      const satisfiedMeal = slot.satisfied_by_slot_key
        ? mealBySlot.get(slot.satisfied_by_slot_key)
        : null;
      const externalId =
        meal?.external_id ?? satisfiedMeal?.external_id ?? day.assigned_meals[0]?.external_id ?? "MEAL-001";
      const servings = meal?.servings ?? 1;
      return {
        slot_key: slot.slot_key,
        slot_state: slot.slot_state,
        slot_role: slot.slot_role,
        satisfied_by_slot_key: slot.satisfied_by_slot_key ?? null,
        source_external_id: externalId,
        servings: slot.counts_toward_day_totals ? servings : 1,
        planned_servings: slot.counts_toward_day_totals ? servings : 0,
        serving_policy: meal?.serving_policy ?? "LIMITED_SCALING",
        counts_toward_day_totals: slot.counts_toward_day_totals,
        display_order: slot.display_order,
        hour: slot.hour,
        minute: slot.minute,
        slot_label: labels.ar,
        time_label: labels.time,
        sort_order: slot.display_order,
      };
    });
}

export function buildStrategyAssignmentPayload(input: {
  client_goal: ClientGoalId;
  profile: ClientNutritionProfile;
  day_context: NutritionDayContext;
  allergies: AllergyState;
  name_ar?: string;
  restrictions?: string[];
}): StrategyAssignmentPersistPayload | NutritionFailClosedOutcome {
  const resolved = resolveNutritionDay({
    client_goal: input.client_goal,
    profile: input.profile,
    day_context: input.day_context,
    allergies: input.allergies,
    restrictions: input.restrictions,
    membership_tier: "essential",
  });

  if (isFailClosed(resolved)) return resolved;

  const goalProfile = resolved.decision_trace[0]?.data?.goal;
  void goalProfile;

  const targetFromEngine = computeTargetFromDay(input, resolved);
  if (isFailClosed(targetFromEngine)) return targetFromEngine;

  const target = targetFromEngine;
  const snapshot = buildResolvedSnapshot({
    day: resolved,
    target,
    dayContext: input.day_context,
  });

  return {
    name_ar: input.name_ar ?? "خطة تغذية Strategy V1",
    strategy_version: NUTRITION_STRATEGY_VERSION,
    library_version: MEAL_LIBRARY_SCHEMA_VERSION,
    day_type: input.day_context.day_type,
    training_time: input.day_context.training_time ?? null,
    session_time: input.day_context.session_time ?? null,
    validation_status: resolved.validation_result.status,
    target: {
      nutrition_objective: target.nutrition_objective,
      goal_context: target.goal_context,
      calories: target.calories,
      protein_g: target.protein_g,
      carbs_g: target.carbs_g,
      fat_g: target.fat_g,
      reference_weight_kg: target.reference_weight_kg,
      reference_weight_source: "profile_measurement",
      target_source: target.target_source,
      target_reason: target.target_reason,
    },
    decision_trace: {
      reason: "INITIAL_ASSIGNMENT",
      summary: `Strategy V1 assignment for ${input.client_goal}`,
      metadata: {
        validation_status: resolved.validation_result.status,
        slot_count: resolved.ordered_slots.length,
        codes: resolved.decision_trace.map((e) => e.code),
      },
    },
    resolved_snapshot: snapshot,
    slots: slotsToPersistPayload(resolved),
  };
}

function computeTargetFromDay(
  input: { client_goal: ClientGoalId; profile: ClientNutritionProfile },
  resolved: ResolvedNutritionDay,
): NutritionTarget | NutritionFailClosedOutcome {
  void resolved;
  const profile = resolveNutritionGoalProfile({
    clientGoal: input.client_goal,
    profile: input.profile,
  });
  if ("code" in profile) {
    return { code: "NUTRITION_PROFILE_RESOLUTION_REQUIRED", message: "Goal profile unresolved", missing: profile.missing };
  }
  const target = computeNutritionTarget({
    profile: input.profile,
    nutrition_objective: profile.nutrition_objective,
    goal_context: profile.goal_context,
  });
  if ("code" in target) {
    return { code: "NUTRITION_TARGET_REVIEW_REQUIRED", message: "Target requires review" };
  }
  return target;
}

export function buildStrategySwapPayload(input: {
  day: ResolvedNutritionDay;
  target: NutritionTarget;
  slot_key: ResolvedNutritionDay["ordered_slots"][number]["slot_key"];
  to_external_id: string;
  allergy: AllergyState;
  day_context: NutritionDayContext;
}): StrategySwapPersistPayload | NutritionFailClosedOutcome {
  const swapped = applySwapWithWholeDayValidation({
    day: input.day,
    target: input.target,
    slot_key: input.slot_key,
    to_external_id: input.to_external_id,
    allergy: input.allergy,
  });
  if (isFailClosed(swapped)) return swapped;

  return {
    slot_key: input.slot_key,
    to_external_id: input.to_external_id,
    servings: swapped.servings[input.slot_key] ?? 1,
    validation_status: swapped.validation_result.status,
    planned_totals: swapped.planned_totals,
    resolved_snapshot: buildResolvedSnapshot({
      day: swapped,
      target: input.target,
      dayContext: input.day_context,
    }),
    decision_trace: {
      reason: "SWAP_REQUEST",
      summary: `Swap ${input.slot_key} → ${input.to_external_id}`,
      metadata: { validation_status: swapped.validation_result.status },
    },
    slots: slotsToPersistPayload(swapped),
  };
}

export function buildStrategyReplacementPayload(input: {
  client_goal: ClientGoalId;
  profile: ClientNutritionProfile;
  day_context: NutritionDayContext;
  allergies: AllergyState;
  name_ar?: string;
  previous_assignment_id: string;
}): (StrategyAssignmentPersistPayload & { replaces_assignment_id: string }) | NutritionFailClosedOutcome {
  const base = buildStrategyAssignmentPayload(input);
  if (isFailClosed(base)) return base;
  return { ...base, replaces_assignment_id: input.previous_assignment_id };
}
