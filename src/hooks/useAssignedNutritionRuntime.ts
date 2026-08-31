import { useQuery } from "@tanstack/react-query";
import { fetchMyNutritionRuntime } from "@/lib/platform/assigned-nutrition-api";

export function useAssignedNutritionRuntime(enabled: boolean) {
  return useQuery({
    queryKey: ["client-nutrition-runtime"],
    queryFn: fetchMyNutritionRuntime,
    enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });
}
