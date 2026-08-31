import { FREE_MEMBER_UNLOCKED_MEAL_SLOT_ID } from "./nutrition-experience";

export type EntitlementTier = "free" | "essential" | "premium" | "vip";

export type TrainingEntitlements = {
  allowedExercisesPerSession: number;
  fullSession: boolean;
  previewExercises: boolean;
  advancedFeatures: boolean;
};

export type NutritionEntitlements = {
  allowedMealsPerDay: number;
  fullDay: boolean;
  dailySwapLimit: number | null;
  swapsUsedToday: number;
  swapsRemainingToday: number | null;
  multipleAlternatives: boolean;
  unlockedMealStrategy: "first_of_day" | "all_assigned";
  advancedFeatures: boolean;
};

export type EntitlementsSnapshot = {
  tier: EntitlementTier;
  isPaid: boolean;
  subscriptionStatus: string;
  cancelAtPeriodEnd: boolean;
  training: TrainingEntitlements;
  nutrition: NutritionEntitlements;
  coachChat: boolean;
};

export const FREE_ENTITLEMENTS: EntitlementsSnapshot = {
  tier: "free",
  isPaid: false,
  subscriptionStatus: "free",
  cancelAtPeriodEnd: false,
  training: {
    allowedExercisesPerSession: 1,
    fullSession: false,
    previewExercises: true,
    advancedFeatures: false,
  },
  nutrition: {
    allowedMealsPerDay: 1,
    fullDay: false,
    dailySwapLimit: 0,
    swapsUsedToday: 0,
    swapsRemainingToday: 0,
    multipleAlternatives: false,
    unlockedMealStrategy: "first_of_day",
    advancedFeatures: false,
  },
  coachChat: false,
};

function readInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function readBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export function normalizeEntitlements(raw: unknown): EntitlementsSnapshot {
  if (!raw || typeof raw !== "object") return FREE_ENTITLEMENTS;
  const source = raw as Record<string, unknown>;
  const training = (source.training ?? {}) as Record<string, unknown>;
  const nutrition = (source.nutrition ?? {}) as Record<string, unknown>;
  const tierRaw = source.tier;
  const tier: EntitlementTier =
    tierRaw === "essential" || tierRaw === "premium" || tierRaw === "vip" ? tierRaw : "free";

  const dailySwapLimitRaw = nutrition.daily_swap_limit;
  const dailySwapLimit =
    dailySwapLimitRaw === null || dailySwapLimitRaw === undefined
      ? tier === "premium"
        ? null
        : readInt(dailySwapLimitRaw, 0)
      : readInt(dailySwapLimitRaw, 0);

  const swapsRemainingRaw = nutrition.swaps_remaining_today;
  const swapsRemainingToday =
    swapsRemainingRaw === null || swapsRemainingRaw === undefined
      ? dailySwapLimit === null
        ? null
        : readInt(swapsRemainingRaw, 0)
      : readInt(swapsRemainingRaw, 0);

  return {
    tier,
    isPaid: readBool(source.is_paid, tier !== "free"),
    subscriptionStatus: String(source.subscription_status ?? (tier === "free" ? "free" : "active")),
    cancelAtPeriodEnd: readBool(source.cancel_at_period_end, false),
    training: {
      allowedExercisesPerSession: readInt(training.allowed_exercises_per_session, 1),
      fullSession: readBool(training.full_session, tier !== "free"),
      previewExercises: readBool(training.preview_exercises, tier === "free"),
      advancedFeatures: readBool(training.advanced_features, tier === "premium" || tier === "vip"),
    },
    nutrition: {
      allowedMealsPerDay: readInt(nutrition.allowed_meals_per_day, tier === "free" ? 1 : 99),
      fullDay: readBool(nutrition.full_day, tier !== "free"),
      dailySwapLimit,
      swapsUsedToday: readInt(nutrition.swaps_used_today, 0),
      swapsRemainingToday,
      multipleAlternatives: readBool(nutrition.multiple_alternatives, tier === "premium" || tier === "vip"),
      unlockedMealStrategy:
        nutrition.unlocked_meal_strategy === "all_assigned" ? "all_assigned" : "first_of_day",
      advancedFeatures: readBool(nutrition.advanced_features, tier === "premium" || tier === "vip"),
    },
    coachChat: readBool(source.coach_chat, tier === "vip"),
  };
}

export function isTrainingPreviewMode(ent: EntitlementsSnapshot): boolean {
  return !ent.training.fullSession;
}

export function isExerciseUnlockedByEntitlements(
  ent: EntitlementsSnapshot,
  orderIndex: number,
  opts: { isToday: boolean },
): boolean {
  if (ent.training.fullSession) return true;
  if (!opts.isToday) return false;
  return orderIndex < ent.training.allowedExercisesPerSession;
}

export function isMealSlotUnlockedByEntitlements(
  ent: EntitlementsSnapshot,
  input: { slotId: string; slotIndex: number; dateKey: string; todayKey: string },
): boolean {
  if (ent.nutrition.fullDay) return true;
  if (input.dateKey !== input.todayKey) return false;
  if (ent.nutrition.unlockedMealStrategy === "first_of_day") {
    return input.slotIndex === 0 || input.slotId === FREE_MEMBER_UNLOCKED_MEAL_SLOT_ID;
  }
  return input.slotIndex < ent.nutrition.allowedMealsPerDay;
}

export function canRecordMealSwap(ent: EntitlementsSnapshot): boolean {
  if (!ent.nutrition.fullDay) return false;
  if (ent.nutrition.dailySwapLimit === null) return true;
  return (ent.nutrition.swapsRemainingToday ?? 0) > 0;
}

export function mealSwapAllowanceLabel(ent: EntitlementsSnapshot): string | null {
  if (!ent.nutrition.fullDay) return null;
  if (ent.nutrition.dailySwapLimit === null) return "تغييرات مرنة";
  const remaining = ent.nutrition.swapsRemainingToday ?? 0;
  if (remaining > 0) return `${remaining} تغيير متاح اليوم`;
  return "تم استخدام تغيير اليوم";
}

export function shouldShowPremiumAlternatives(ent: EntitlementsSnapshot): boolean {
  return ent.nutrition.multipleAlternatives && ent.nutrition.fullDay;
}

export async function fetchMyEntitlements(): Promise<EntitlementsSnapshot> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase.rpc("get_my_entitlements");
  if (error) throw error;
  return normalizeEntitlements(data);
}
