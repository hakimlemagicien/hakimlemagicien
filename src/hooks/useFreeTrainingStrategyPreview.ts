import { useQuery } from "@tanstack/react-query";
import { listV2ExerciseCandidates } from "@/lib/platform/exercise-library-v2-api";
import { buildFreeStrategyPreviewWeekdayPlans } from "@/lib/platform/free-training-strategy-preview";
import type { TrainingProfileSnapshot } from "@/lib/platform/profile-api";
import { trainingStrategyInputFromProfileRow } from "@/lib/platform/strategy-matrix/profile-source";

export const FREE_TRAINING_STRATEGY_PREVIEW_KEY = ["free-training-strategy-preview"] as const;

export function useFreeTrainingStrategyPreview(input: {
  enabled: boolean;
  userId: string;
  training: TrainingProfileSnapshot | undefined;
}) {
  const answersKey = input.training?.answers ? JSON.stringify(input.training.answers) : "none";

  return useQuery({
    queryKey: [
      ...FREE_TRAINING_STRATEGY_PREVIEW_KEY,
      input.userId,
      input.training?.goal ?? "",
      input.training?.trainingType ?? "",
      answersKey,
    ],
    queryFn: async () => {
      const exercises = await listV2ExerciseCandidates();
      const strategyInput = trainingStrategyInputFromProfileRow({
        userId: input.userId,
        goal: input.training?.goal ?? null,
        trainingType: input.training?.trainingType ?? null,
        locationPreference: null,
        answers: (input.training?.answers ?? null) as Record<string, unknown> | null,
        assessedTrainingLevel: null,
      });
      return buildFreeStrategyPreviewWeekdayPlans(strategyInput, exercises);
    },
    enabled: input.enabled && Boolean(input.training),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
