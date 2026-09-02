import { supabase } from "@/integrations/supabase/client";
import {
  buildStrategySwapPayload,
  isFailClosed,
  type NutritionDayContext,
  type NutritionTarget,
  type ResolvedNutritionDay,
  type AllergyState,
} from "@/lib/platform/nutrition-strategy";

export type ApplyNutritionSwapResult =
  | { ok: true; runtime: Record<string, unknown> }
  | { ok: false; code: "SWAP_NOT_ALLOWED" | "nutrition_not_entitled" | "daily_meal_swap_limit_reached" | "unknown"; message: string };

export async function applyNutritionMealSwap(input: {
  slotId: string;
  day: ResolvedNutritionDay;
  target: NutritionTarget;
  slotKey: ResolvedNutritionDay["ordered_slots"][number]["slot_key"];
  toExternalId: string;
  allergy: AllergyState;
  dayContext: NutritionDayContext;
  sessionDate?: string;
}): Promise<ApplyNutritionSwapResult> {
  const payload = buildStrategySwapPayload({
    day: input.day,
    target: input.target,
    slot_key: input.slotKey,
    to_external_id: input.toExternalId,
    allergy: input.allergy,
    day_context: input.dayContext,
  });

  if (isFailClosed(payload)) {
    return { ok: false, code: "SWAP_NOT_ALLOWED", message: payload.message };
  }

  const { data, error } = await supabase.rpc("nutrition_apply_swap", {
    p_slot_id: input.slotId,
    p_payload: payload,
    p_session_date: input.sessionDate ?? new Date().toISOString().slice(0, 10),
  });

  if (error) {
    const message = error.message ?? "swap_failed";
    if (message.includes("swap_not_allowed")) {
      return { ok: false, code: "SWAP_NOT_ALLOWED", message };
    }
    if (message.includes("nutrition_not_entitled")) {
      return { ok: false, code: "nutrition_not_entitled", message };
    }
    if (message.includes("daily_meal_swap_limit_reached")) {
      return { ok: false, code: "daily_meal_swap_limit_reached", message };
    }
    return { ok: false, code: "unknown", message };
  }

  return { ok: true, runtime: (data as { runtime?: Record<string, unknown> })?.runtime ?? {} };
}
