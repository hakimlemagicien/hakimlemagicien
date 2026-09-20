import { useQuery } from "@tanstack/react-query";
import { useCustomerJourney } from "@/hooks/useCustomerJourney";
import { useNutritionPreferences } from "@/hooks/useNutritionPreferences";
import { PROFILE_TRAINING_KEY } from "@/hooks/useProfileExperience";
import { fetchMyTrainingProfile } from "@/lib/platform/profile-api";
import { resolveFreeBreakfastGoalKey } from "@/lib/platform/nutrition-experience";
import { readQuizProgress } from "@/lib/quiz-progress-storage";

/**
 * One server-backed source for every FREE nutrition surface.
 * Dashboard, meal details and alternatives must resolve the same meal, order
 * and safety filters even when local quiz storage is empty after a new login.
 */
export function useFreeNutritionPreviewOptions(enabled: boolean) {
  const trainingProfile = useQuery({
    queryKey: PROFILE_TRAINING_KEY,
    queryFn: fetchMyTrainingProfile,
    enabled,
    staleTime: 30_000,
  });
  const journey = useCustomerJourney();
  const preferences = useNutritionPreferences();
  const quizGoalId =
    trainingProfile.data?.answers.goalId ??
    trainingProfile.data?.goal ??
    readQuizProgress()?.goalId ??
    null;

  return {
    breakfastGoalKey: resolveFreeBreakfastGoalKey(quizGoalId),
    trainingMealWindow: journey.data?.trainingMealWindow ?? null,
    allergens: preferences.data?.knownAllergens ?? [],
    dislikedFoods: preferences.data?.dislikedFoods ?? [],
  };
}
