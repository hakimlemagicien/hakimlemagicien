import { getWeeklyVolumeDecision } from "@/lib/platform/volume";
import { evaluateGoalResponse, evaluateRegionalResponse } from "@/lib/platform/goal-intelligence";
import type { ExerciseResponseState } from "@/lib/platform/goal-intelligence/types";
import type { ProgressionAction } from "@/lib/platform/progression/types";
import type { PerformanceTrend } from "@/lib/platform/volume/types";
import { isoWeekKey } from "./dates";
import {
  PROGRAM_ADAPTATION_ACTIONS,
  VOLUME_BLOCKS_ADAPTATION,
  type ClientLoopEvaluation,
  type GoalProgressView,
  type LoopEvidence,
  type VolumeProgressView,
} from "./types";

function exerciseResponseFromTrend(trend: PerformanceTrend): ExerciseResponseState {
  if (trend === "IMPROVING") return "POSITIVE";
  if (trend === "STABLE") return "STABLE";
  if (trend === "DECLINING") return "LIMITED";
  return "INSUFFICIENT";
}

function uniqueWeeks(sets: LoopEvidence["sets"]): number {
  return new Set(sets.map((row) => row.weekKey)).size;
}

function progressionGuess(trend: PerformanceTrend): ProgressionAction[] {
  if (trend === "IMPROVING") return ["INCREASE_REPS", "INCREASE_LOAD"];
  if (trend === "DECLINING") return ["HOLD_PROGRESSION"];
  if (trend === "STABLE") return ["KEEP_LOAD"];
  return ["INSUFFICIENT_DATA"];
}

export function volumeEvaluationKey(assignmentId: string | null, week: string) {
  return `volume:${assignmentId ?? "none"}:${week}`;
}

export function goalEvaluationKey(assignmentId: string | null, week: string) {
  return `goal:${assignmentId ?? "none"}:${week}`;
}

export function programAdaptationJustified(evaluation: {
  volume: ClientLoopEvaluation["volume"];
  goal: ClientLoopEvaluation["goal"];
}): {
  justified: boolean;
  blockedReason: string | null;
} {
  if (
    evaluation.goal.action === "INSUFFICIENT_DATA" ||
    evaluation.goal.goal_response === "INSUFFICIENT_DATA"
  ) {
    return { justified: false, blockedReason: "INSUFFICIENT_DATA" };
  }
  if (
    evaluation.goal.action === "NUTRITION_REVIEW_REQUIRED" ||
    evaluation.goal.nutrition_review_required
  ) {
    return { justified: false, blockedReason: "NUTRITION_REVIEW_REQUIRED" };
  }
  if (VOLUME_BLOCKS_ADAPTATION.includes(evaluation.volume.program_action)) {
    return { justified: false, blockedReason: evaluation.volume.program_action };
  }
  if (
    evaluation.volume.recovery_state === "POOR" ||
    evaluation.volume.recovery_state === "LIMITED"
  ) {
    return { justified: false, blockedReason: "RECOVERY_LIMITED" };
  }
  if (!PROGRAM_ADAPTATION_ACTIONS.includes(evaluation.goal.action)) {
    return { justified: false, blockedReason: "KEEP_CURRENT_PROGRAM" };
  }
  return { justified: true, blockedReason: null };
}

export function toVolumeProgressView(volume: ClientLoopEvaluation["volume"]): VolumeProgressView {
  return {
    program_action: volume.program_action,
    reason_code: volume.reason_code,
    recovery_state: volume.recovery_state,
    recommended_delta: volume.recommended_delta,
    physical_set_count: volume.physical_set_count,
    observation_required: volume.observation_required,
    regions: volume.regions.map((row) => ({
      region: row.region,
      volume_action: row.volume_action,
      reason_code: row.reason_code,
      prescribed_volume: row.prescribed_volume,
      completed_volume: row.completed_volume,
      performance_trend: row.performance_trend,
      local_fatigue: row.local_fatigue,
    })),
  };
}

export function toGoalProgressView(goal: ClientLoopEvaluation["goal"]): GoalProgressView {
  return {
    goal_id: goal.goal_id,
    goal_response: goal.goal_response,
    action: goal.action,
    limiter: goal.limiting_factor,
    reason_code: goal.reason_code,
    confidence: goal.confidence,
    client_explanation: goal.client_explanation,
    reallocation: goal.reallocation,
    nutrition_review_required: goal.nutrition_review_required,
    body_composition_review_required: goal.body_composition_review_required,
    regional_responses: goal.regional_responses.map((row) => ({
      region: row.region,
      response_state: row.response_state,
      reason_code: row.reason_code,
    })),
  };
}

export function evaluateClientLoop(evidence: LoopEvidence): ClientLoopEvaluation {
  const week = isoWeekKey(evidence.evaluationDate);
  const volume = getWeeklyVolumeDecision({
    goalId: evidence.goalId,
    trainingLevel: evidence.trainingLevel,
    exercises: evidence.exercises,
    sets: evidence.sets,
    prescribed: evidence.prescribed,
    coachProtected: evidence.coachProtected,
    continuityState: evidence.continuityState,
    reconditioningActive: evidence.reconditioningActive,
    lastVolumeAction: evidence.lastVolumeAction,
  });

  const microcycles = uniqueWeeks(evidence.sets);
  const regions = volume.regions.map((row) =>
    evaluateRegionalResponse({
      region: row.region,
      priority: row.priority,
      validMicrocycles: microcycles,
      prescribedVolume: row.prescribed_volume,
      completedVolume: row.completed_volume,
      effectiveVolume: row.effective_volume,
      directPrimaryShare:
        row.prescribed_volume > 0
          ? Math.min(1, row.effective_volume / Math.max(row.prescribed_volume, 1))
          : 0,
      performanceTrend: row.performance_trend,
      localFatigue: row.local_fatigue,
      globalRecovery: volume.recovery_state,
      progressionActions: progressionGuess(row.performance_trend),
      exerciseResponse: exerciseResponseFromTrend(row.performance_trend),
      safetyActive: evidence.safetyActive,
    }),
  );

  const completed = evidence.sets.filter(
    (row) => row.setCompleted && !row.skipped && row.setType !== "WARMUP",
  ).length;
  const prescribedSets = evidence.prescribed.reduce((sum, row) => sum + row.workingSets, 0);
  const adherenceShare = prescribedSets > 0 ? completed / prescribedSets : 0;

  const goal = evaluateGoalResponse({
    goalId: evidence.goalId,
    regions,
    globalRecovery: volume.recovery_state,
    adherenceShare,
    safetyActive: evidence.safetyActive,
    coachProtected: evidence.coachProtected,
    lastGoalAction: evidence.lastGoalAction,
    lastGoalActionWeeksAgo: evidence.lastGoalActionWeeksAgo,
    body: evidence.body,
    nutrition: evidence.nutrition,
  });

  const adaptation = programAdaptationJustified({ volume, goal });
  return {
    volume,
    goal,
    volume_evaluation_key: volumeEvaluationKey(evidence.assignmentId, week),
    goal_evaluation_key: goalEvaluationKey(evidence.assignmentId, week),
    evaluation_week: week,
    assignment_id: evidence.assignmentId,
    program_version: evidence.programVersion,
    program_adaptation_justified: adaptation.justified,
    program_adaptation_blocked_reason: adaptation.blockedReason,
  };
}
