import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ClientTrainingRuntime } from "@/lib/platform/assigned-program-api";
import {
  factsFromSessionRecords,
  getProgramContinuityDecision,
  overlayTodayPlan,
  programDaysFromRuntime,
  type ContinuityDecision,
} from "@/lib/platform/continuity";
import { getLocalDateKey, getUserTimeZone } from "@/lib/platform/readiness";
import { listOwnRecentWorkoutSessions, updateWorkoutSessionStatus } from "@/lib/platform/training-v2-api";
import { readPendingQueue } from "@/lib/platform/workout-runtime/pending-sync";
import { getWeekdayIdFromDate, type WeekdayId, type WeekdayWorkoutPlan } from "@/lib/platform/weekly-workout-schedule";
import { runtimeToWeekdayPlans } from "@/lib/platform/assigned-program-api";

export function useProgramContinuity(runtime: ClientTrainingRuntime | undefined, enabled: boolean) {
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
    const base = runtimeToWeekdayPlans(runtime);
    if (!decision) return base;
    return overlayTodayPlan({ assignedPlans: base, todayId, runtime, decision });
  }, [runtime, decision, todayId]);

  return {
    decision,
    assignedPlans,
    todayId,
    todayKey: getLocalDateKey(),
    sessionsLoading: sessionsQuery.isLoading,
  };
}

export type ContinuityAssignedPlans = Record<WeekdayId, WeekdayWorkoutPlan> | null;
