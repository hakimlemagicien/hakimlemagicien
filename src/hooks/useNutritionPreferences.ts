import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyNutritionPreferences,
  saveMyNutritionPreferences,
} from "@/lib/platform/nutrition-preferences-api";

export const NUTRITION_PREFERENCES_QUERY_KEY = ["nutrition-preferences-v1"] as const;

export function useNutritionPreferences() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: NUTRITION_PREFERENCES_QUERY_KEY,
    queryFn: getMyNutritionPreferences,
    staleTime: 30_000,
    retry: 1,
  });
  const save = useMutation({
    mutationFn: saveMyNutritionPreferences,
    onSuccess: (preferences) => client.setQueryData(NUTRITION_PREFERENCES_QUERY_KEY, preferences),
  });
  return { ...query, save };
}
