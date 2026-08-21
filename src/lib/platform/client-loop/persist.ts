import { supabase } from "@/integrations/supabase/client";
import { trackTrainingEvent } from "@/lib/platform/training-progress/analytics";
import { toAdaptiveDecisionSnapshot } from "@/lib/platform/goal-intelligence";
import { toGoalProgressView, toVolumeProgressView } from "./evaluate";
import type { ClientLoopEvaluation, PersistedAdaptiveDecision } from "./types";
import {
  CLIENT_LOOP_GOAL_DECISION,
  CLIENT_LOOP_PROGRAM_BLOCKED,
  CLIENT_LOOP_VOLUME_DECISION,
} from "./types";

function asDecision(row: Record<string, unknown>): PersistedAdaptiveDecision {
  return {
    id: String(row.id ?? ""),
    decision_type: String(row.decision_type ?? ""),
    evaluation_key: String(row.evaluation_key ?? ""),
    reason_code: row.reason_code == null ? null : String(row.reason_code),
    confidence: row.confidence == null ? null : String(row.confidence),
    input_snapshot: (row.input_snapshot as Record<string, unknown>) ?? {},
    assignment_id: row.assignment_id ? String(row.assignment_id) : null,
    program_version: row.program_version == null ? null : Number(row.program_version),
    created_at: String(row.created_at ?? ""),
  };
}

export async function listOwnAdaptiveDecisions(limit = 12): Promise<PersistedAdaptiveDecision[]> {
  const { data, error } = await supabase.rpc("client_list_own_adaptive_decisions", {
    p_decision_types: [CLIENT_LOOP_VOLUME_DECISION, CLIENT_LOOP_GOAL_DECISION],
    p_limit: limit,
  });
  if (error) {
    console.warn("[client-loop] listOwnAdaptiveDecisions failed", error.message);
    return [];
  }
  return (Array.isArray(data) ? data : []).map((row) => asDecision(row as Record<string, unknown>));
}

export async function upsertOwnAdaptiveDecision(input: {
  decisionType: string;
  evaluationKey: string;
  reasonCode: string;
  confidence: string | null;
  snapshot: Record<string, unknown>;
  assignmentId?: string | null;
  programVersion?: number | null;
}): Promise<PersistedAdaptiveDecision | null> {
  const { data, error } = await supabase.rpc("client_upsert_adaptive_decision", {
    p_decision_type: input.decisionType,
    p_evaluation_key: input.evaluationKey,
    p_reason_code: input.reasonCode,
    p_confidence: input.confidence,
    p_input_snapshot: input.snapshot,
    p_assignment_id: input.assignmentId ?? null,
    p_program_version: input.programVersion ?? null,
  });
  if (error) {
    console.warn("[client-loop] upsertOwnAdaptiveDecision failed", error.message);
    return null;
  }
  return asDecision((data ?? {}) as Record<string, unknown>);
}

export async function persistClientLoopEvaluation(evaluation: ClientLoopEvaluation) {
  const volumeView = toVolumeProgressView(evaluation.volume);
  const goalView = toGoalProgressView(evaluation.goal);
  const volumeRow = await upsertOwnAdaptiveDecision({
    decisionType: CLIENT_LOOP_VOLUME_DECISION,
    evaluationKey: evaluation.volume_evaluation_key,
    reasonCode: evaluation.volume.reason_code,
    confidence: evaluation.volume.confidence,
    assignmentId: evaluation.assignment_id,
    programVersion: evaluation.program_version,
    snapshot: {
      engine: "getWeeklyVolumeDecision",
      evaluation_week: evaluation.evaluation_week,
      progress_view: volumeView,
      program_adaptation_justified: evaluation.program_adaptation_justified,
    },
  });
  const goalSnapshot = toAdaptiveDecisionSnapshot(evaluation.goal);
  const goalRow = await upsertOwnAdaptiveDecision({
    decisionType: CLIENT_LOOP_GOAL_DECISION,
    evaluationKey: evaluation.goal_evaluation_key,
    reasonCode: evaluation.goal.reason_code,
    confidence: evaluation.goal.confidence,
    assignmentId: evaluation.assignment_id,
    programVersion: evaluation.program_version,
    snapshot: {
      ...goalSnapshot.input_snapshot,
      engine: "evaluateGoalResponse",
      evaluation_week: evaluation.evaluation_week,
      progress_view: goalView,
      volume_action: evaluation.volume.program_action,
      volume_reason_code: evaluation.volume.reason_code,
      program_adaptation_justified: evaluation.program_adaptation_justified,
      program_adaptation_blocked_reason: evaluation.program_adaptation_blocked_reason,
    },
  });

  if (volumeRow) {
    trackTrainingEvent(
      evaluation.volume.program_action === "DELOAD_REVIEW"
        ? "deload_review_triggered"
        : evaluation.volume.recovery_hold !== "NORMAL"
          ? "recovery_hold_applied"
          : "volume_adaptation_applied",
      {
        action: evaluation.volume.program_action,
        week: evaluation.evaluation_week,
      },
    );
  }
  if (goalRow) {
    trackTrainingEvent(
      evaluation.goal.goal_response === "INSUFFICIENT_DATA"
        ? "insufficient_data"
        : "goal_response_updated",
      {
        response: evaluation.goal.goal_response,
        action: evaluation.goal.action,
        week: evaluation.evaluation_week,
      },
    );
  }
  return { volumeRow, goalRow };
}

export function latestOfType(
  rows: PersistedAdaptiveDecision[],
  type: string,
): PersistedAdaptiveDecision | null {
  return rows.find((row) => row.decision_type === type) ?? null;
}

export { CLIENT_LOOP_PROGRAM_BLOCKED };
