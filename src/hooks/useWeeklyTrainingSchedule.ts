import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ClientTrainingRuntime } from "@/lib/platform/assigned-program-api";
import { fetchMyTrainingProfile } from "@/lib/platform/profile-api";
import { PROFILE_TRAINING_KEY } from "@/hooks/useProfileExperience";
import {
  buildWeeklyScheduleForRuntime,
  resolveTrainingStrategy,
  trainingStrategyInputFromProfileRow,
  type ResolvedTrainingStrategy,
  type WeeklyTrainingSchedule,
} from "@/lib/platform/strategy-matrix";

export function useWeeklyTrainingSchedule(
  runtime: ClientTrainingRuntime | undefined,
  enabled: boolean,
): {
  strategy: ResolvedTrainingStrategy | null;
  schedule: WeeklyTrainingSchedule | null;
  strategyLoading: boolean;
} {
  const trainingQuery = useQuery({
    queryKey: PROFILE_TRAINING_KEY,
    queryFn: fetchMyTrainingProfile,
    enabled,
    staleTime: 60_000,
    retry: 1,
  });

  const strategy = useMemo(() => {
    const training = trainingQuery.data;
    if (!training) return null;
    const input = trainingStrategyInputFromProfileRow({
      userId: "client",
      goal: training.goal,
      trainingType: training.trainingType,
      answers: training.answers as Record<string, unknown>,
    });
    const resolved = resolveTrainingStrategy(input);
    return resolved.ok ? resolved.strategy : null;
  }, [trainingQuery.data]);

  const schedule = useMemo(() => {
    if (!enabled || !runtime || runtime.reason !== "ok") return null;
    return buildWeeklyScheduleForRuntime(runtime, strategy);
  }, [enabled, runtime, strategy]);

  return {
    strategy,
    schedule,
    strategyLoading: trainingQuery.isLoading,
  };
}
