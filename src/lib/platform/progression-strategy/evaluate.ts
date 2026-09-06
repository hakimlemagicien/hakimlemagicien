import { getNextSessionProgression } from "@/lib/platform/progression";
import type { ExerciseSetHistoryItem } from "@/lib/platform/training-v2-contracts";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import type { ClientTrainingLevel, PrescriptionState } from "@/lib/platform/training-v2-contracts";
import type { NextSessionProgression, RecoveryHoldState } from "@/lib/platform/progression/types";
import { progressionDecisionLabel } from "./labels";
import { applyAllowedPrescription, isExerciseChangeAction } from "./apply";
import { shouldAutoApplyProgression } from "./scope";
import {
  REVIEW_ACTIONS,
  type ProgressionApplyPatch,
  type ProgressionEvaluation,
  type ProgressionExerciseInput,
  type ProgressionHistoryEntry,
  type ProgressionReview,
  type ProgressionStrategy,
} from "./types";

export type EvaluateProgressionInput = {
  strategy: ProgressionStrategy;
  exercises: ProgressionExerciseInput[];
  historyById: Record<string, ExerciseSetHistoryItem[]>;
  metadataById: Record<string, ExerciseV2Metadata>;
  trainingLevel: ClientTrainingLevel;
  recoveryHold?: RecoveryHoldState;
  prescriptionState?: PrescriptionState | null;
  kept?: Record<string, { at: string; reason_code: string }>;
  now?: string;
};

function latestReps(history: ExerciseSetHistoryItem[]): number[] {
  const lastSession = history.at(-1)?.workoutSessionId;
  return history
    .filter((row) => (lastSession ? row.workoutSessionId === lastSession : true) && row.actualReps != null)
    .map((row) => row.actualReps as number);
}

function shouldOpenReview(strategy: ProgressionStrategy, action: NextSessionProgression["action"]): boolean {
  if (strategy === "COACH_MANAGED") return false;
  if (strategy === "SMART_PROGRESSION_EXERCISE_LOCKED") {
    return REVIEW_ACTIONS.includes(action) || isExerciseChangeAction(action);
  }
  return action === "SAFETY_REVIEW";
}

function identityPatch(exercise: ProgressionExerciseInput): ProgressionApplyPatch {
  return {
    exercise_row_id: exercise.id,
    exercise_external_id: exercise.exercise_external_id,
    exercise_id: exercise.exercise_id,
    suggested_weight_kg: exercise.suggested_weight_kg,
    reps_min: exercise.reps_min,
    reps_max: exercise.reps_max,
    sets: exercise.sets,
    rest_seconds: exercise.rest_seconds,
    changed_fields: [],
  };
}

export function evaluateAssignmentProgression(input: EvaluateProgressionInput): ProgressionEvaluation {
  const now = input.now ?? new Date().toISOString();
  const decisions: NextSessionProgression[] = [];
  const patches: ProgressionApplyPatch[] = [];
  const reviews: ProgressionReview[] = [];
  const history: ProgressionHistoryEntry[] = [];
  let waiting = input.exercises.length === 0;
  let blocked = false;
  let reviewRequired = false;

  for (const exercise of input.exercises) {
    const meta = input.metadataById[exercise.exercise_external_id];
    const logs = input.historyById[exercise.exercise_external_id] ?? [];
    if (!meta) {
      waiting = true;
      patches.push(identityPatch(exercise));
      continue;
    }
    const decision = getNextSessionProgression({
      externalId: exercise.exercise_external_id,
      exercise: meta,
      history: logs,
      trainingLevel: input.trainingLevel,
      requiredWorkingSets: exercise.sets,
      repMin: exercise.reps_min ?? 8,
      repMax: exercise.reps_max ?? 12,
      prescribedLoad: exercise.suggested_weight_kg,
      recoveryHold: input.recoveryHold,
      safetyReview: input.prescriptionState === "SAFETY_REVIEW",
      prescriptionState: input.prescriptionState,
    });
    decisions.push(decision);
    const patch = applyAllowedPrescription(input.strategy, exercise, decision);
    patches.push(input.strategy === "COACH_MANAGED" ? identityPatch(exercise) : patch);
    if (decision.action === "INSUFFICIENT_DATA") waiting = true;
    if (decision.action === "SAFETY_REVIEW") blocked = true;
    history.push({
      exercise_external_id: exercise.exercise_external_id,
      exercise_name_ar: exercise.exercise_name_ar,
      session_date: logs.at(-1)?.sessionDate ?? now.slice(0, 10),
      load: logs.at(-1)?.actualLoad ?? decision.current_load,
      reps: latestReps(logs),
      action: decision.action,
      reason_code: decision.reason_code,
      reason_ar: progressionDecisionLabel(decision.reason_code),
      previous_load: decision.current_load,
      next_load: shouldAutoApplyProgression(input.strategy) ? decision.next_load : decision.current_load,
    });
    if (!shouldOpenReview(input.strategy, decision.action)) continue;
    const kept = input.kept?.[exercise.exercise_external_id];
    if (kept && kept.reason_code === (isExerciseChangeAction(decision.action) ? "EXERCISE_REVIEW_RECOMMENDED" : decision.reason_code)) {
      continue;
    }
    reviewRequired = true;
    reviews.push({
      exercise_external_id: exercise.exercise_external_id,
      exercise_name_ar: exercise.exercise_name_ar,
      reason_code: isExerciseChangeAction(decision.action) ? "EXERCISE_REVIEW_RECOMMENDED" : decision.reason_code,
      reason_ar: isExerciseChangeAction(decision.action)
        ? progressionDecisionLabel("EXERCISE_REVIEW_RECOMMENDED")
        : progressionDecisionLabel(decision.reason_code),
      last_load: decision.current_load,
      last_reps: latestReps(logs),
      created_at: now,
      status: "open",
    });
  }

  let status: ProgressionEvaluation["status"] = "ACTIVE";
  if (blocked) status = "PAUSED";
  else if (reviewRequired) status = "REVIEW_REQUIRED";
  else if (waiting && patches.every((patch) => patch.changed_fields.length === 0)) status = "WAITING_FOR_DATA";

  return {
    strategy: input.strategy,
    status,
    decisions,
    patches,
    reviews,
    history,
    blocked,
  };
}
