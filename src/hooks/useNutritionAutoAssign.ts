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
  const attemptedUserRef = useRef<string | null>(null);
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
    // usePlatformActivity starts with the local-only "guest" identity while
    // Supabase restores the real session. Never consume the one automatic
    // attempt for that placeholder; wait for the authenticated UUID.
    if (
      !input.enabled ||
      !input.userId ||
      input.userId === "guest" ||
      !input.trainingMealWindow
    ) {
      return;
    }
    if (attemptedUserRef.current === input.userId || mutation.isPending) return;
    attemptedUserRef.current = input.userId;
    mutation.mutate();
  }, [input.enabled, input.trainingMealWindow, input.userId, mutation]);

  return {
    isRunning: mutation.isPending,
    result: mutation.data,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}
