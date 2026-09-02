import { MAX_PRIMARY_REPEAT_PER_7_DAYS, VARIETY_AVOID_REPEAT_DAYS } from "./constants";
import type { MealHistoryWindow } from "./types";

export function varietyPenalty(
  mealType: string,
  externalId: string,
  history: MealHistoryWindow,
): number {
  const recent = history.recent_by_meal_type[mealType] ?? [];
  const avoidDays = VARIETY_AVOID_REPEAT_DAYS[mealType] ?? 3;
  const idx = recent.indexOf(externalId);
  if (idx >= 0 && idx < avoidDays) {
    return (avoidDays - idx) * 10;
  }
  const count7d = recent.filter((id) => id === externalId).length;
  if (count7d >= MAX_PRIMARY_REPEAT_PER_7_DAYS) {
    return 50;
  }
  return 0;
}

export function recordMealInHistory(
  history: MealHistoryWindow,
  mealType: string,
  externalId: string,
  windowSize = 7,
): MealHistoryWindow {
  const prev = history.recent_by_meal_type[mealType] ?? [];
  const next = [externalId, ...prev.filter((id) => id !== externalId)].slice(0, windowSize);
  return {
    ...history,
    recent_by_meal_type: { ...history.recent_by_meal_type, [mealType]: next },
  };
}
