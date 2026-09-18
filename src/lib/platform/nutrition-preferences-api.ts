import { supabase } from "@/integrations/supabase/client";

export type NutritionPreferenceStatus = "UNKNOWN" | "CONFIRMED_NONE" | "KNOWN_ALLERGIES";

export type NutritionPreferences = {
  status: NutritionPreferenceStatus;
  knownAllergens: string[];
  dislikedFoods: string[];
};

function mapPreferences(value: unknown): NutritionPreferences {
  const row = (value ?? {}) as Record<string, unknown>;
  const rawStatus = String(row.allergy_status ?? "UNKNOWN");
  return {
    status:
      rawStatus === "CONFIRMED_NONE" || rawStatus === "KNOWN_ALLERGIES" ? rawStatus : "UNKNOWN",
    knownAllergens: Array.isArray(row.known_allergens) ? row.known_allergens.map(String) : [],
    dislikedFoods: Array.isArray(row.disliked_foods) ? row.disliked_foods.map(String) : [],
  };
}

export async function getMyNutritionPreferences(): Promise<NutritionPreferences> {
  const { data, error } = await (
    supabase as unknown as {
      rpc: (name: string) => Promise<{ data: unknown; error: { message?: string } | null }>;
    }
  ).rpc("client_get_my_nutrition_preferences");
  if (error) throw new Error(error.message || "تعذر تحميل تفضيلات التغذية.");
  return mapPreferences(data);
}

export async function saveMyNutritionPreferences(input: {
  status: Exclude<NutritionPreferenceStatus, "UNKNOWN">;
  knownAllergens: string[];
  dislikedFoods: string[];
}): Promise<NutritionPreferences> {
  const { data, error } = await (
    supabase as unknown as {
      rpc: (
        name: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message?: string } | null }>;
    }
  ).rpc("client_set_my_nutrition_preferences", {
    p_status: input.status,
    p_allergens: input.knownAllergens,
    p_disliked_foods: input.dislikedFoods,
  });
  if (error) throw new Error(error.message || "تعذر حفظ تفضيلات التغذية.");
  return mapPreferences(data);
}
