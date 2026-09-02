import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAssignedNutritionRuntime } from "@/hooks/useAssignedNutritionRuntime";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import { MEMBERSHIP_QUERY_KEY } from "@/lib/platform/membership";
import { recordNutritionMealSwap } from "@/lib/platform/nutrition-meal-swap-api";
import { applyNutritionMealSwap } from "@/lib/platform/nutrition-apply-swap-api";
import { hydrateMealLibraryFromSupabase } from "@/lib/platform/meal-library-api";
import {
  logMyNutritionMeal,
  runtimeDayContext,
  runtimeMacroLayers,
  runtimeToMealSlots,
  runtimeToNutritionTarget,
  runtimeToResolvedNutritionDay,
} from "@/lib/platform/assigned-nutrition-api";
import { scaleMacros } from "@/lib/platform/nutrition-assignment";
import {
  computeCommitmentPct,
  getMealByAlternativeId,
  getNutritionMealSlots,
  motivationalMessage,
  sumConsumedMacros,
  type MealSlot,
  type MealStatus,
  type MacroTotals,
} from "@/lib/platform/nutrition-experience";
import type { NutritionSlotKey } from "@/lib/platform/nutrition-strategy";
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

function plannedFromSlots(slots: MealSlot[]): MacroTotals {
  return slots.reduce(
    (sum, slot) => ({
      calories: sum.calories + slot.defaultMeal.calories,
      protein: sum.protein + slot.defaultMeal.protein,
      carbs: sum.carbs + slot.defaultMeal.carbs,
      fat: sum.fat + slot.defaultMeal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function useNutritionPlan(
  selectedDateKey?: string,
  opts?: { catalogPreview?: boolean },
) {
  const queryClient = useQueryClient();
  const { userId, snapshot } = usePlatformActivity();
  const dateKey = selectedDateKey ?? todayKey();
  const isSelectedToday = dateKey === todayKey();
  const catalogPreview = Boolean(opts?.catalogPreview);
  const [tick, setTick] = useState(0);
  const [catalogSlots, setCatalogSlots] = useState<MealSlot[]>(() => getNutritionMealSlots());
  const runtimeQuery = useAssignedNutritionRuntime(!catalogPreview);
  const refetchRuntime = runtimeQuery.refetch;

  const refresh = useCallback(() => {
    setTick((value) => value + 1);
    if (!catalogPreview) void refetchRuntime();
  }, [catalogPreview, refetchRuntime]);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener(NUTRITION_PLAN_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(NUTRITION_PLAN_CHANGE_EVENT, onChange);
  }, [refresh]);

  useEffect(() => {
    void hydrateMealLibraryFromSupabase().then(() => {
      setCatalogSlots(getNutritionMealSlots());
    });
  }, []);

  const assignmentReason = catalogPreview ? "preview" : runtimeQuery.data?.reason;
  const assignedSlots = useMemo(() => {
    if (catalogPreview) return catalogSlots;
    if (runtimeQuery.data?.reason === "ok") return runtimeToMealSlots(runtimeQuery.data);
    return [];
  }, [catalogPreview, catalogSlots, runtimeQuery.data]);

  const localStatuses = useMemo(
    () => getMealStatusMap(userId, dateKey, isSelectedToday),
    [userId, dateKey, isSelectedToday, tick],
  );

  const statuses = useMemo(() => {
    const next = { ...localStatuses };
    if (!catalogPreview && isSelectedToday) {
      for (const log of runtimeQuery.data?.todayLogs ?? []) {
        if (log.status === "completed" || log.status === "skipped") {
          next[log.slot_key] = log.status;
        }
      }
    }
    return next;
  }, [catalogPreview, isSelectedToday, localStatuses, runtimeQuery.data?.todayLogs]);

  const choices = useMemo(
    () => getMealChoiceMap(userId, dateKey),
    [userId, dateKey, tick],
  );

  const shoppingChecked = useMemo(
    () => getShoppingChecked(userId),
    [userId, tick],
  );

  const macroLayers = useMemo(() => {
    if (catalogPreview || runtimeQuery.data?.reason !== "ok") {
      const planned = plannedFromSlots(assignedSlots);
      return { target: null as MacroTotals | null, planned, consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 } };
    }
    return runtimeMacroLayers(runtimeQuery.data);
  }, [assignedSlots, catalogPreview, runtimeQuery.data]);

  const target = macroLayers.target;
  const planned = macroLayers.planned;
  const consumedFromRuntime = macroLayers.consumed;

  const consumed = useMemo(() => {
    if (!catalogPreview && isSelectedToday && runtimeQuery.data?.reason === "ok") {
      const hasServerConsumed = (runtimeQuery.data.consumed_totals?.calories ?? 0) > 0;
      if (hasServerConsumed) return consumedFromRuntime;
    }
    return sumConsumedMacros(assignedSlots, statuses, choices);
  }, [
    assignedSlots,
    catalogPreview,
    choices,
    consumedFromRuntime,
    isSelectedToday,
    runtimeQuery.data?.consumed_totals?.calories,
    runtimeQuery.data?.reason,
    statuses,
  ]);
  /** @deprecated Use `planned` for slot sums and `target` for approved prescription. */
  const goals = target ?? planned;
  const completedCount = Object.values(statuses).filter((s) => s === "completed").length;
  const remainingMeals = Math.max(assignedSlots.length - completedCount, 0);
  const commitmentPct = computeCommitmentPct(completedCount, assignedSlots.length);

  const meals = useMemo(
    () =>
      assignedSlots.map((slot) => {
        const meal = getMealByAlternativeId(slot, choices[slot.id]);
        return {
          slot,
          meal,
          status: (statuses[slot.id] as MealStatus) ?? "upcoming",
        };
      }),
    [choices, assignedSlots, statuses],
  );

  const markCompleted = (slotId: string) => {
    markMealCompleted(userId, dateKey, slotId);
    const slot = assignedSlots.find((item) => item.id === slotId);
    if (slot?.assignmentSlotId && isSelectedToday) {
      void logMyNutritionMeal(slot.assignmentSlotId, "completed", dateKey).then(() => runtimeQuery.refetch());
    }
  };

  const markSkipped = (slotId: string) => {
    markMealSkipped(userId, dateKey, slotId);
    const slot = assignedSlots.find((item) => item.id === slotId);
    if (slot?.assignmentSlotId && isSelectedToday) {
      void logMyNutritionMeal(slot.assignmentSlotId, "skipped", dateKey).then(() => runtimeQuery.refetch());
    }
  };

  return {
    userId,
    dateKey,
    isSelectedToday,
    goals,
    target,
    planned,
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
    waterSource: "LOCAL_ONLY" as const,
    assignmentReason,
    assignmentName: runtimeQuery.data?.assignment?.name_ar ?? null,
    runtimeLoading: !catalogPreview && runtimeQuery.isLoading,
    runtimeError: !catalogPreview && runtimeQuery.isError,
    assignmentSchema: catalogPreview ? null : runtimeQuery.data?.schema ?? null,
    markCompleted,
    markSkipped,
    adoptAlternative: async (slotId: string, alternativeId: string) => {
      if (!catalogPreview) {
        const slot = assignedSlots.find((item) => item.id === slotId);
        const runtime = runtimeQuery.data;
        if (runtime?.reason === "ok" && runtime.schema === "STRATEGY_V1_DYNAMIC" && slot?.assignmentSlotId) {
          const day = runtimeToResolvedNutritionDay(runtime);
          const nutritionTarget = runtimeToNutritionTarget(runtime);
          if (day && nutritionTarget) {
            const swapResult = await applyNutritionMealSwap({
              slotId: slot.assignmentSlotId,
              day,
              target: nutritionTarget,
              slotKey: slotId as NutritionSlotKey,
              toExternalId: alternativeId,
              allergy: { status: "CONFIRMED_NONE", confirmed_at: new Date().toISOString() },
              dayContext: runtimeDayContext(runtime),
              sessionDate: dateKey,
            });
            if (!swapResult.ok) {
              const err = new Error(swapResult.code);
              (err as Error & { code?: string }).code = swapResult.code;
              throw err;
            }
            await queryClient.invalidateQueries({ queryKey: MEMBERSHIP_QUERY_KEY });
            refresh();
            return;
          }
        }

        const swapResult = await recordNutritionMealSwap({
          fromMealId: slot?.assignmentSlotId ?? null,
          toMealId: null,
        });
        if (!swapResult.ok) {
          const err = new Error(swapResult.code);
          (err as Error & { code?: string }).code = swapResult.code;
          throw err;
        }
        await queryClient.invalidateQueries({ queryKey: MEMBERSHIP_QUERY_KEY });
      }
      adoptMealAlternative(userId, dateKey, slotId, alternativeId);
      refresh();
    },
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

export { scaleMacros };
