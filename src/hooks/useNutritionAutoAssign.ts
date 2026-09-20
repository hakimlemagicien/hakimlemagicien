import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runNutritionAutoAssignment } from "@/lib/platform/nutrition-auto-assign";
import type { TrainingMealWindow } from "@/lib/platform/customer-journey";

export const NUTRITION_AUTO_ASSIGN_KEY = ["nutrition-auto-assign"] as const;

export function useNutritionAutoAssign(input: {
  enabled: boolean;
  userId: string;
  trainingMealWindow: TrainingMealWindow | null | undefined;
}) {
  const queryClient = useQueryClient();
  const attemptedRef = useRef(false);
  const mutation = useMutation({
    mutationKey: NUTRITION_AUTO_ASSIGN_KEY,
    mutationFn: () =>
      runNutritionAutoAssignment({
        userId: input.userId,
        trainingMealWindow: input.trainingMealWindow,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["client-nutrition-runtime"] });
    },
  });

  useEffect(() => {
    if (!input.enabled || !input.userId || !input.trainingMealWindow) return;
    if (attemptedRef.current || mutation.isPending || mutation.isSuccess) return;
    attemptedRef.current = true;
    mutation.mutate();
  }, [input.enabled, input.trainingMealWindow, input.userId, mutation]);

  return {
    isRunning: mutation.isPending,
    result: mutation.data,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}
