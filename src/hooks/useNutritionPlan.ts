import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import {
  NUTRITION_GOALS,
  NUTRITION_MEAL_SLOTS,
  computeCommitmentPct,
  getMealByAlternativeId,
  motivationalMessage,
  sumConsumedMacros,
  type MealStatus,
} from "@/lib/platform/nutrition-experience";
import {
  NUTRITION_PLAN_CHANGE_EVENT,
  adoptMealAlternative,
  getMealChoiceMap,
  getMealStatusMap,
  getShoppingChecked,
  markAllShoppingPurchased,
  markMealCompleted,
  markMealSkipped,
  toggleShoppingItem,
} from "@/lib/platform/nutrition-plan-storage";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function useNutritionPlan(selectedDateKey?: string) {
  const { userId, snapshot } = usePlatformActivity();
  const dateKey = selectedDateKey ?? todayKey();
  const isSelectedToday = dateKey === todayKey();
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener(NUTRITION_PLAN_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(NUTRITION_PLAN_CHANGE_EVENT, onChange);
  }, [refresh]);

  const statuses = useMemo(
    () => getMealStatusMap(userId, dateKey, isSelectedToday),
    [userId, dateKey, isSelectedToday, tick],
  );

  const choices = useMemo(
    () => getMealChoiceMap(userId, dateKey),
    [userId, dateKey, tick],
  );

  const shoppingChecked = useMemo(
    () => getShoppingChecked(userId),
    [userId, tick],
  );

  const consumed = useMemo(
    () => sumConsumedMacros(NUTRITION_MEAL_SLOTS, statuses, choices),
    [statuses, choices],
  );

  const completedCount = Object.values(statuses).filter((s) => s === "completed").length;
  const remainingMeals = NUTRITION_MEAL_SLOTS.length - completedCount;
  const commitmentPct = computeCommitmentPct(completedCount, NUTRITION_MEAL_SLOTS.length);

  const meals = useMemo(
    () =>
      NUTRITION_MEAL_SLOTS.map((slot) => {
        const meal = getMealByAlternativeId(slot, choices[slot.id]);
        return {
          slot,
          meal,
          status: statuses[slot.id] as MealStatus,
        };
      }),
    [choices, statuses],
  );

  return {
    userId,
    dateKey,
    isSelectedToday,
    goals: NUTRITION_GOALS,
    meals,
    statuses,
    choices,
    consumed,
    completedCount,
    remainingMeals,
    commitmentPct,
    motivation: motivationalMessage(remainingMeals),
    shoppingChecked,
    waterMl: snapshot.waterMl,
    waterGoalMl: snapshot.waterGoalMl,
    markCompleted: (slotId: string) => markMealCompleted(userId, dateKey, slotId),
    markSkipped: (slotId: string) => markMealSkipped(userId, dateKey, slotId),
    adoptAlternative: (slotId: string, alternativeId: string) =>
      adoptMealAlternative(userId, dateKey, slotId, alternativeId),
    toggleShopping: (itemId: string, checked?: boolean) =>
      toggleShoppingItem(userId, itemId, checked),
    purchaseAllShopping: (itemIds: string[]) => markAllShoppingPurchased(userId, itemIds),
    refresh,
  };
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return online;
}
