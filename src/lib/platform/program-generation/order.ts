import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import type { GeneratedExercise } from "./types";

function complexityScore(exercise: ExerciseV2Metadata | undefined) {
  if (exercise?.complexity === "HIGH") return 0;
  if (exercise?.mechanics === "COMPOUND") return 1;
  if (exercise?.complexity === "MODERATE") return 2;
  return 3;
}

function priorityScore(exercise: GeneratedExercise) {
  if (exercise.exercise_priority === "REQUIRED") return 0;
  if (exercise.exercise_priority === "HIGH") return 1;
  if (exercise.exercise_priority === "NORMAL") return 2;
  return 3;
}

function muscleScore(exercise: GeneratedExercise) {
  if (exercise.muscle_priority === "PRIMARY") return 0;
  if (exercise.muscle_priority === "SECONDARY") return 1;
  return 2;
}

export function orderSessionExercises(
  exercises: GeneratedExercise[],
  catalog: Map<string, ExerciseV2Metadata>,
): GeneratedExercise[] {
  const sorted = [...exercises].sort((left, right) => {
    const leftMeta = catalog.get(left.external_id);
    const rightMeta = catalog.get(right.external_id);
    const leftComplexity = complexityScore(leftMeta);
    const rightComplexity = complexityScore(rightMeta);
    if (leftComplexity !== rightComplexity) return leftComplexity - rightComplexity;
    const leftPriority = priorityScore(left);
    const rightPriority = priorityScore(right);
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    const leftMuscle = muscleScore(left);
    const rightMuscle = muscleScore(right);
    if (leftMuscle !== rightMuscle) return leftMuscle - rightMuscle;
    return left.external_id.localeCompare(right.external_id);
  });
  return sorted.map((item, index) => ({ ...item, order_index: index }));
}
