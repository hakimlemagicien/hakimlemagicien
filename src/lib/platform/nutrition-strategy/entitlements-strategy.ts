import type { MembershipTier } from "./types";

export function nutritionEntitlementSummary(tier: MembershipTier) {
  if (tier === "free") {
    return {
      allowedMealsPerDay: 1,
      fullDay: false,
      dailySwapLimit: 0,
      multipleAlternatives: false,
    };
  }
  if (tier === "essential") {
    return {
      allowedMealsPerDay: 99,
      fullDay: true,
      dailySwapLimit: 1,
      multipleAlternatives: false,
    };
  }
  return {
    allowedMealsPerDay: 99,
    fullDay: true,
    dailySwapLimit: null,
    multipleAlternatives: true,
  };
}

export function canAccessFullNutritionPlan(tier: MembershipTier): boolean {
  return tier !== "free";
}

export function canSwapMeal(tier: MembershipTier, swapsUsedToday: number): boolean {
  const ent = nutritionEntitlementSummary(tier);
  if (!ent.fullDay) return false;
  if (ent.dailySwapLimit === null) return true;
  return swapsUsedToday < ent.dailySwapLimit;
}
