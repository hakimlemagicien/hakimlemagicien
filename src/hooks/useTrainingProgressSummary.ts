import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAssignedTrainingRuntime } from "@/hooks/useAssignedTrainingRuntime";
import { useProgramContinuity } from "@/hooks/useProgramContinuity";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import { getClientTrainingProgressSummary } from "@/lib/platform/training-progress/summary";
import { aggregateExerciseTrends } from "@/lib/platform/training-progress/trends";
import { trackTrainingEvent } from "@/lib/platform/training-progress/analytics";
import { listOwnRecentWorkingSetSummaries } from "@/lib/platform/training-v2-api";
import { listOwnAdaptiveDecisions, runClientLoopEvaluation } from "@/lib/platform/client-loop";
import type { GoalProgressView, PersistedAdaptiveDecision } from "@/lib/platform/client-loop/types";
import {
  CLIENT_LOOP_GOAL_DECISION,
  CLIENT_LOOP_VOLUME_DECISION,
} from "@/lib/platform/client-loop/types";
import { readQuizProgress } from "@/lib/quiz-progress-storage";
import type {
  GoalAction,
  GoalReasonCode,
  GoalResponseState,
  ResponseLimiter,
} from "@/lib/platform/goal-intelligence/types";
import type {
  RecoveryCapacityState,
  VolumeAction,
  VolumeReasonCode,
} from "@/lib/platform/volume/types";

function viewFromSnapshot(row: PersistedAdaptiveDecision | null): GoalProgressView | null {
  if (!row) return null;
  const view = row.input_snapshot.progress_view as GoalProgressView | undefined;
  return view ?? null;
}

function volumeFromSnapshot(row: PersistedAdaptiveDecision | null) {
  if (!row) return null;
  const view = row.input_snapshot.progress_view as
    | { program_action?: string; reason_code?: string; recovery_state?: string }
    | undefined;
  if (!view?.program_action) return null;
  return {
    action: view.program_action as VolumeAction,
    reason_code: (view.reason_code ?? row.reason_code ?? "INSUFFICIENT_DATA") as VolumeReasonCode,
    recovery_state: (view.recovery_state ?? "INSUFFICIENT_DATA") as RecoveryCapacityState,
  };
}

export function useTrainingProgressSummary(enabled: boolean) {
  const { snapshot } = usePlatformActivity();
  const runtimeQuery = useAssignedTrainingRuntime(enabled);
  const continuity = useProgramContinuity(
    runtimeQuery.data,
    enabled && runtimeQuery.data?.reason === "ok",
  );
  const setsQuery = useQuery({
    queryKey: ["training-progress-set-summaries"],
    queryFn: () => listOwnRecentWorkingSetSummaries(80),
    enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const decisionsQuery = useQuery({
    queryKey: ["training-progress-decisions"],
    queryFn: () => listOwnAdaptiveDecisions(12),
    enabled,
    staleTime: 30 * 1000,
    retry: 1,
  });

  const goalId = readQuizProgress()?.goalId ?? null;
  const evaluated = useRef(false);
  useEffect(() => {
    if (!enabled || evaluated.current) return;
    if (runtimeQuery.data?.reason !== "ok") return;
    if (decisionsQuery.isLoading) return;
    const hasGoal = (decisionsQuery.data ?? []).some(
      (row) => row.decision_type === CLIENT_LOOP_GOAL_DECISION,
    );
    evaluated.current = true;
    if (!hasGoal) {
      void runClientLoopEvaluation().then(() => {
        void decisionsQuery.refetch();
      });
    }
  }, [decisionsQuery, enabled, runtimeQuery.data?.reason]);

  const summary = useMemo(() => {
    if (runtimeQuery.isError && setsQuery.isError) {
      return getClientTrainingProgressSummary({ goalId, loadError: true });
    }
    const goalView = viewFromSnapshot(
      (decisionsQuery.data ?? []).find((row) => row.decision_type === CLIENT_LOOP_GOAL_DECISION) ??
        null,
    );
    const volumeView = volumeFromSnapshot(
      (decisionsQuery.data ?? []).find(
        (row) => row.decision_type === CLIENT_LOOP_VOLUME_DECISION,
      ) ?? null,
    );
    return getClientTrainingProgressSummary({
      goalId,
      goalDecision: goalView
        ? {
            goal_response: goalView.goal_response as GoalResponseState,
            action: goalView.action as GoalAction,
            reason_code: goalView.reason_code as GoalReasonCode,
            limiting_factor: goalView.limiter as ResponseLimiter,
            client_explanation: goalView.client_explanation,
            reallocation: goalView.reallocation,
            nutrition_review_required: goalView.nutrition_review_required,
            body_composition_review_required: goalView.body_composition_review_required,
          }
        : null,
      regionalDecisions: goalView?.regional_responses ?? [],
      volumeDecision: volumeView,
      continuity: continuity.decision
        ? {
            action: continuity.decision.action,
            reason_code: continuity.decision.reason_code,
            effective_date: continuity.decision.effective_date,
            original_scheduled_date: continuity.decision.original_scheduled_date,
            next_program_day_id: continuity.decision.next_program_day_id,
            resume_session_id: continuity.decision.resume_session_id,
            reconditioning_state: continuity.decision.reconditioning_state,
            client_explanation: continuity.decision.client_explanation,
            adherence: continuity.decision.adherence,
            previous_session_state: continuity.decision.previous_session_state,
            recommended_session_status: continuity.decision.recommended_session_status,
          }
        : null,
      progressionSamples: aggregateExerciseTrends(setsQuery.data ?? []),
      bodyTrends: {
        has_valid_weight: snapshot.currentWeight != null,
        has_valid_waist: false,
      },
    });
  }, [
    continuity.decision,
    decisionsQuery.data,
    goalId,
    runtimeQuery.isError,
    setsQuery.data,
    setsQuery.isError,
    snapshot.currentWeight,
  ]);

  const tracked = useRef(false);
  useEffect(() => {
    if (!enabled || tracked.current) return;
    tracked.current = true;
    trackTrainingEvent("progress_viewed", {
      empty: summary.empty,
      goal: summary.canonical_goal ?? "unmapped",
    });
  }, [enabled, summary.canonical_goal, summary.empty]);

  return {
    summary,
    loading: runtimeQuery.isLoading || setsQuery.isLoading || decisionsQuery.isLoading,
    error: runtimeQuery.isError && setsQuery.isError,
  };
}
