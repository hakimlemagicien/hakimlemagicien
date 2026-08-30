import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PROFILE_TRAINING_KEY } from "@/hooks/useProfileExperience";
import type { ClientTrainingRuntime } from "@/lib/platform/assigned-program-api";
import {
  factsFromSessionRecords,
  getProgramContinuityDecision,
  overlayTodayPlan,
  programDaysFromRuntime,
  type ContinuityDecision,
} from "@/lib/platform/continuity";
import { fetchMyTrainingProfile } from "@/lib/platform/profile-api";
import { getLocalDateKey, getUserTimeZone } from "@/lib/platform/readiness";
import { resolveTrainingStrategy, trainingStrategyInputFromProfileRow } from "@/lib/platform/strategy-matrix";
import { buildWeekdayPlansForAssignedRuntime } from "@/lib/platform/strategy-matrix/calendar-runtime";
import { listOwnRecentWorkoutSessions, updateWorkoutSessionStatus } from "@/lib/platform/training-v2-api";
import { readPendingQueue } from "@/lib/platform/workout-runtime/pending-sync";
import { getWeekdayIdFromDate, type WeekdayId, type WeekdayWorkoutPlan } from "@/lib/platform/weekly-workout-schedule";

export function useProgramContinuity(runtime: ClientTrainingRuntime | undefined, enabled: boolean) {
  const trainingQuery = useQuery({
    queryKey: PROFILE_TRAINING_KEY,
    queryFn: fetchMyTrainingProfile,
    enabled,
    staleTime: 60_000,
    retry: 1,
  });

  const resolvedStrategy = useMemo(() => {
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

  const sessionsQuery = useQuery({
    queryKey: ["workout-sessions-recent", runtime?.assignment?.id ?? "none"],
    queryFn: () => listOwnRecentWorkoutSessions(24),
    enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const decision = useMemo<ContinuityDecision | null>(() => {
    if (!enabled || !runtime || runtime.reason !== "ok" || !runtime.assignment) return null;
    const pending = typeof window !== "undefined" && readPendingQueue().length > 0;
    return getProgramContinuityDecision({
      assignmentId: runtime.assignment.id,
      assignmentStatus: runtime.reason === "ok" ? runtime.assignment.status : runtime.reason,
      timezone: getUserTimeZone(),
      now: new Date(),
      days: programDaysFromRuntime(runtime),
      sessions: factsFromSessionRecords(sessionsQuery.data ?? []),
      daysPerWeek: runtime.assignment.days_per_week,
      pendingSync: pending,
    });
  }, [enabled, runtime, sessionsQuery.data]);

  useEffect(() => {
    const nextStatus = decision?.recommended_session_status;
    if (nextStatus !== "INTERRUPTED" && nextStatus !== "PARTIALLY_COMPLETED") return;
    const staleRow = (sessionsQuery.data ?? []).find((item) => item.status === "IN_PROGRESS");
    if (staleRow) void updateWorkoutSessionStatus(staleRow.id, nextStatus);
  }, [decision?.recommended_session_status, sessionsQuery.data]);

  const todayId = getWeekdayIdFromDate();
  const assignedPlans = useMemo(() => {
    if (!runtime || runtime.reason !== "ok") return null;
    const base = buildWeekdayPlansForAssignedRuntime(runtime, resolvedStrategy);
    if (!decision) return base;
    return overlayTodayPlan({ assignedPlans: base, todayId, runtime, decision });
  }, [runtime, decision, todayId, resolvedStrategy]);

  return {
    decision,
    assignedPlans,
    todayId,
    todayKey: getLocalDateKey(),
    sessionsLoading: sessionsQuery.isLoading,
    strategyLoading: trainingQuery.isLoading,
  };
}

export type ContinuityAssignedPlans = Record<WeekdayId, WeekdayWorkoutPlan> | null;
