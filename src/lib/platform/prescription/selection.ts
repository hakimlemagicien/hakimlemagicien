import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import type { ClientTrainingLevel, ExerciseSetHistoryItem } from "@/lib/platform/training-v2-contracts";
import { filterEligibleExercises } from "./eligibility";
import { completedWorkingHistory } from "./load-source";
import type { SelectionContext } from "./types";

function complexityRank(exercise: ExerciseV2Metadata, level: ClientTrainingLevel) {
  if (level === "INTERMEDIATE") return 0;
  if (exercise.complexity === "LOW") return 0;
  if (exercise.complexity === "MODERATE") return 1;
  return 2;
}

function historyScore(history: ExerciseSetHistoryItem[] | undefined) {
  return completedWorkingHistory(history).length;
}

export function selectEligibleExercise(context: SelectionContext): {
  exercise: ExerciseV2Metadata | null;
  selection_reason: string;
  candidates: ExerciseV2Metadata[];
} {
  const eligible = filterEligibleExercises(context.candidates, {
    requiredMovementRole: context.requiredMovementRole,
    targetMuscle: context.targetMuscle,
    location: context.location,
    availableEquipment: context.availableEquipment,
    trainingLevel: context.trainingLevel,
  }).filter((exercise) => !(context.dislikedExternalIds ?? []).includes(exercise.external_id));

  if (context.existingExternalId) {
    const existing = eligible.find((exercise) => exercise.external_id === context.existingExternalId);
    if (existing) {
      return {
        exercise: existing,
        selection_reason: "EXISTING_EXERCISE_STABILITY",
        candidates: eligible,
      };
    }
  }

  const sorted = [...eligible].sort((left, right) => {
    const leftHistory = historyScore(context.historyByExternalId?.[left.external_id]);
    const rightHistory = historyScore(context.historyByExternalId?.[right.external_id]);
    if (leftHistory !== rightHistory) return rightHistory - leftHistory;
    const leftSimple = complexityRank(left, context.trainingLevel);
    const rightSimple = complexityRank(right, context.trainingLevel);
    if (leftSimple !== rightSimple) return leftSimple - rightSimple;
    return left.external_id.localeCompare(right.external_id);
  });

  return {
    exercise: sorted[0] ?? null,
    selection_reason: sorted[0]
      ? historyScore(context.historyByExternalId?.[sorted[0].external_id]) > 0
        ? "HISTORY_STABILITY"
        : "DETERMINISTIC_TIEBREAK_EXTERNAL_ID"
      : "NO_ELIGIBLE_CANDIDATE",
    candidates: sorted,
  };
}
