import { supabase } from "@/integrations/supabase/client";

export type MealSwapResult =
  | { ok: true; unlimited?: boolean; swapDate?: string }
  | { ok: false; code: "daily_meal_swap_limit_reached" | "nutrition_not_entitled" | "unknown"; message: string };

export async function recordNutritionMealSwap(input?: {
  fromMealId?: string | null;
  toMealId?: string | null;
  swapDate?: string;
}): Promise<MealSwapResult> {
  const { data, error } = await supabase.rpc("record_nutrition_meal_swap", {
    p_from_meal_id: input?.fromMealId ?? null,
    p_to_meal_id: input?.toMealId ?? null,
    p_swap_date: input?.swapDate ?? null,
  });

  if (error) {
    const message = error.message ?? "swap_failed";
    if (message.includes("daily_meal_swap_limit_reached")) {
      return { ok: false, code: "daily_meal_swap_limit_reached", message };
    }
    if (message.includes("nutrition_not_entitled")) {
      return { ok: false, code: "nutrition_not_entitled", message };
    }
    return { ok: false, code: "unknown", message };
  }

  return { ok: true, unlimited: Boolean((data as { unlimited?: boolean })?.unlimited), swapDate: (data as { swap_date?: string })?.swap_date };
}
