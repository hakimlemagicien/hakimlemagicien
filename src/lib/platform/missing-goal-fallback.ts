import {
  WEEKDAY_WORKOUT_PLANS,
  emptyRestPlan,
  type WeekdayId,
  type WeekdayWorkoutPlan,
} from "@/lib/platform/weekly-workout-schedule";

export const MISSING_GOAL_FALLBACK_GOAL_LABEL = "بناء العضلات";
export const MISSING_GOAL_FALLBACK_GOAL_ID = "MUSCLE_GROWTH";
export const MISSING_GOAL_FALLBACK_DAYS = 4;
export const MISSING_GOAL_FALLBACK_ENVIRONMENT = "gym" as const;
export const MISSING_GOAL_FALLBACK_NUTRITION_GOAL = "muscle_gain";

function workoutPlan(dayId: WeekdayId, sourceId: WeekdayId): WeekdayWorkoutPlan {
  const source = WEEKDAY_WORKOUT_PLANS[sourceId];
  return {
    ...source,
    id: dayId,
    prescriptions: source.prescriptions.map((prescription) => ({ ...prescription })),
    safeExerciseCount: source.prescriptions.length,
  };
}

/**
 * A deterministic, display-only starter week for clients whose goal is missing.
 * It is never persisted as a Program Assignment and is replaced as soon as the
 * client supplies a goal. Four gym sessions are spaced across the week.
 */
export function buildMissingGoalFallbackWorkoutPlans(): Record<WeekdayId, WeekdayWorkoutPlan> {
  return {
    sun: emptyRestPlan("sun"),
    mon: workoutPlan("mon", "mon"),
    tue: workoutPlan("tue", "tue"),
    wed: emptyRestPlan("wed"),
    thu: workoutPlan("thu", "thu"),
    fri: emptyRestPlan("fri"),
    sat: workoutPlan("sat", "fri"),
  };
}

export function hasClientGoal(input: { goal?: string | null; goalId?: string | null }): boolean {
  return Boolean(input.goal?.trim() || input.goalId?.trim());
}
