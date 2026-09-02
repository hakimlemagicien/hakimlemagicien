import { NUTRITION_STRATEGY_VERSION } from "./constants";
import { resolveNutritionGoalProfile } from "./goal-profile-resolver";
import {
  resolvePostWorkoutState,
  resolvePreWorkoutState,
  trainingTimeBucket,
} from "./pre-post-resolver";
import { computeNutritionTarget } from "./target-engine";
import { getMealByExternalId } from "../meal-library";
import { optimizeWholeDay, topDeterministicAlternatives } from "./whole-day-optimizer";
import { validateNutritionPlan } from "./validate-nutrition-plan";
import type {
  AllergyState,
  ClientGoalId,
  ClientNutritionProfile,
  MealHistoryWindow,
  MembershipTier,
  NutritionDayContext,
  NutritionFailClosedOutcome,
  NutritionPreferences,
  NutritionSlot,
  NutritionSlotKey,
  NutritionSlotRole,
  NutritionSlotState,
  NutritionTarget,
  ResolvedNutritionDay,
} from "./types";

const BASE_SLOT_ORDER: NutritionSlotKey[] = [
  "breakfast",
  "snack",
  "lunch",
  "pre_workout",
  "post_workout",
  "dinner",
];

const SLOT_META: Record<
  NutritionSlotKey,
  { hour: number; minute: number; role: NutritionSlotRole }
> = {
  breakfast: { hour: 8, minute: 0, role: "PRIMARY_MEAL" },
  snack: { hour: 11, minute: 0, role: "SUPPORT_SNACK" },
  lunch: { hour: 14, minute: 0, role: "PRIMARY_MEAL" },
  pre_workout: { hour: 17, minute: 0, role: "PRE_WORKOUT" },
  post_workout: { hour: 19, minute: 0, role: "POST_WORKOUT" },
  dinner: { hour: 20, minute: 0, role: "PRIMARY_MEAL" },
};

function reorderForTrainingTime(
  slots: NutritionSlot[],
  bucket: ReturnType<typeof trainingTimeBucket>,
): NutritionSlot[] {
  if (bucket !== "MORNING") return slots;
  const order: NutritionSlotKey[] = ["pre_workout", "post_workout", "breakfast", "snack", "lunch", "dinner"];
  return [...slots].sort(
    (a, b) => order.indexOf(a.slot_key) - order.indexOf(b.slot_key),
  );
}

function buildDaySlots(context: NutritionDayContext): NutritionSlot[] {
  const bucket = context.training_time ?? trainingTimeBucket(context.session_time);
  const pre = resolvePreWorkoutState({
    context,
    lunchHour: SLOT_META.lunch.hour,
    snackHour: SLOT_META.snack.hour,
  });
  const post = resolvePostWorkoutState({
    context,
    dinnerHour: SLOT_META.dinner.hour,
    lunchHour: SLOT_META.lunch.hour,
  });

  const states: Record<NutritionSlotKey, { state: NutritionSlotState; satisfied_by?: NutritionSlotKey }> = {
    breakfast: { state: "ACTIVE" },
    snack: { state: context.day_type === "REST_DAY" ? "OPTIONAL" : "ACTIVE" },
    lunch: { state: "ACTIVE" },
    pre_workout: pre,
    post_workout: post,
    dinner: { state: "ACTIVE" },
  };

  if (context.day_type === "REST_DAY") {
    states.pre_workout = { state: "NOT_REQUIRED" };
    states.post_workout = { state: "NOT_REQUIRED" };
  }

  const slots: NutritionSlot[] = BASE_SLOT_ORDER.map((slot_key, idx) => {
    const meta = SLOT_META[slot_key];
    const s = states[slot_key];
    const counts =
      s.state !== "SATISFIED_BY_OTHER_MEAL" && s.state !== "NOT_REQUIRED";
    return {
      slot_key,
      slot_state: s.state,
      slot_role: meta.role,
      satisfied_by_slot_key: s.satisfied_by,
      counts_toward_day_totals: counts,
      display_order: idx,
      hour: meta.hour,
      minute: meta.minute,
    };
  });

  return reorderForTrainingTime(slots, bucket);
}

function alternativesForTier(
  tier: MembershipTier,
  mealExternalId: string,
  allergens: string[],
): ReturnType<typeof topDeterministicAlternatives> {
  const record = getMealByExternalId(mealExternalId);
  if (!record) return [];
  if (tier === "premium" || tier === "vip") {
    return topDeterministicAlternatives(record, 3, allergens);
  }
  return [];
}

export function resolveNutritionDay(input: {
  client_goal: ClientGoalId;
  profile: ClientNutritionProfile;
  approved_target?: NutritionTarget;
  day_context: NutritionDayContext;
  preferences?: NutritionPreferences;
  allergies: AllergyState;
  restrictions?: string[];
  meal_history?: MealHistoryWindow;
  library_version?: string;
  strategy_version?: string;
  date?: string;
  membership_tier?: MembershipTier;
}): ResolvedNutritionDay | NutritionFailClosedOutcome {
  if (input.allergies.status === "UNKNOWN") {
    return { code: "ALLERGY_STATUS_REQUIRED", message: "Allergy status must be confirmed before assignment" };
  }

  const goalProfile = resolveNutritionGoalProfile({
    clientGoal: input.client_goal,
    profile: input.profile,
  });
  if ("code" in goalProfile) {
    return {
      code: "NUTRITION_PROFILE_RESOLUTION_REQUIRED",
      message: "Profile data insufficient for goal resolution",
      missing: goalProfile.missing,
    };
  }

  let target = input.approved_target;
  if (!target) {
    const computed = computeNutritionTarget({
      profile: input.profile,
      nutrition_objective: goalProfile.nutrition_objective,
      goal_context: goalProfile.goal_context,
    });
    if ("code" in computed) {
      return { code: "NUTRITION_TARGET_REVIEW_REQUIRED", message: "Target requires professional review" };
    }
    target = computed;
  }

  const ordered_slots = buildDaySlots(input.day_context);
  const candidate = optimizeWholeDay({
    slots: ordered_slots,
    target,
    goal_profile: goalProfile,
    allergy: input.allergies,
    restrictions: input.restrictions ?? [],
    history: input.meal_history ?? { recent_by_meal_type: {} },
  });

  if (!candidate) {
    return {
      code: "INSUFFICIENT_SAFE_MEAL_COVERAGE",
      message: "No valid whole-day plan could be generated",
    };
  }

  const validation = validateNutritionPlan({
    target,
    planned_totals: candidate.planned_totals,
    slots: ordered_slots,
    allergy_safe: true,
  });

  if (validation.status === "INVALID") {
    return { code: "NUTRITION_PLAN_INVALID", message: "Plan failed whole-day validation" };
  }

  const slot_states = Object.fromEntries(
    ordered_slots.map((s) => [s.slot_key, s.slot_state]),
  ) as Record<NutritionSlotKey, NutritionSlotState>;
  const slot_roles = Object.fromEntries(
    ordered_slots.map((s) => [s.slot_key, s.slot_role]),
  ) as Record<NutritionSlotKey, NutritionSlotRole>;

  const servings = Object.fromEntries(
    candidate.assigned_meals.map((m) => [m.slot_key, m.servings]),
  ) as Record<NutritionSlotKey, number>;

  const allergens =
    input.allergies.status === "KNOWN_ALLERGIES" ? input.allergies.allergens : [];
  const tier = input.membership_tier ?? "essential";
  const alternatives: ResolvedNutritionDay["alternatives"] = {};
  for (const meal of candidate.assigned_meals) {
    const alts = alternativesForTier(tier, meal.external_id, allergens);
    if (alts.length > 0) {
      alternatives[meal.slot_key] = alts.map((m, i) => ({
        external_id: m.external_id,
        meal: m,
        servings: meal.servings,
        score: i,
      }));
    }
  }

  return {
    ordered_slots,
    slot_states,
    slot_roles,
    assigned_meals: candidate.assigned_meals,
    servings,
    alternatives,
    planned_totals: candidate.planned_totals,
    validation_result: validation,
    decision_trace: [
      {
        code: "INITIAL_ASSIGNMENT",
        message: `Strategy ${input.strategy_version ?? NUTRITION_STRATEGY_VERSION}`,
        data: { goal: input.client_goal, day_type: input.day_context.day_type },
      },
    ],
  };
}
