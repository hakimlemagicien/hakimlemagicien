import { PRE_POST_TIMING_HOURS } from "./constants";
import type {
  NutritionDayContext,
  NutritionSlotKey,
  NutritionSlotState,
  TrainingTimeBucket,
} from "./types";

export function parseSessionHour(sessionTime?: string): number | null {
  if (!sessionTime) return null;
  const [h] = sessionTime.split(":");
  const hour = Number(h);
  return Number.isFinite(hour) ? hour : null;
}

export function trainingTimeBucket(sessionTime?: string): TrainingTimeBucket {
  const hour = parseSessionHour(sessionTime);
  if (hour == null) return "EVENING";
  if (hour < 11) return "MORNING";
  if (hour < 14) return "MIDDAY";
  if (hour < 18) return "AFTERNOON";
  return "EVENING";
}

export function hoursBetweenMealAndSession(mealHour: number, sessionHour: number): number {
  return sessionHour - mealHour;
}

export function resolvePreWorkoutState(input: {
  context: NutritionDayContext;
  lunchHour?: number;
  snackHour?: number;
}): { state: NutritionSlotState; satisfied_by?: NutritionSlotKey } {
  if (input.context.day_type === "REST_DAY") {
    return { state: "NOT_REQUIRED" };
  }

  const sessionHour = parseSessionHour(input.context.session_time);
  const bucket = input.context.training_time ?? trainingTimeBucket(input.context.session_time);

  if (bucket === "MORNING") {
    return { state: "OPTIONAL" };
  }

  if (sessionHour != null && input.lunchHour != null) {
    const gap = hoursBetweenMealAndSession(input.lunchHour, sessionHour);
    if (gap >= 0 && gap <= PRE_POST_TIMING_HOURS.satisfiedByWindow) {
      return { state: "SATISFIED_BY_OTHER_MEAL", satisfied_by: "lunch" };
    }
    if (gap > PRE_POST_TIMING_HOURS.satisfiedByWindow && gap <= PRE_POST_TIMING_HOURS.optionalWindow) {
      return { state: "OPTIONAL" };
    }
  }

  if (input.context.training_demand === "HIGH") {
    return { state: "ACTIVE" };
  }

  return { state: "OPTIONAL" };
}

export function resolvePostWorkoutState(input: {
  context: NutritionDayContext;
  dinnerHour?: number;
  lunchHour?: number;
}): { state: NutritionSlotState; satisfied_by?: NutritionSlotKey } {
  if (input.context.day_type === "REST_DAY") {
    return { state: "NOT_REQUIRED" };
  }

  const sessionHour = parseSessionHour(input.context.session_time);
  if (sessionHour != null && input.dinnerHour != null) {
    const gap = input.dinnerHour - sessionHour;
    if (gap >= 0 && gap <= PRE_POST_TIMING_HOURS.satisfiedByWindow) {
      return { state: "SATISFIED_BY_OTHER_MEAL", satisfied_by: "dinner" };
    }
  }

  if (sessionHour != null && input.lunchHour != null) {
    const gap = sessionHour - input.lunchHour;
    if (gap >= 0 && gap <= PRE_POST_TIMING_HOURS.satisfiedByWindow) {
      return { state: "SATISFIED_BY_OTHER_MEAL", satisfied_by: "lunch" };
    }
  }

  return { state: "ACTIVE" };
}
