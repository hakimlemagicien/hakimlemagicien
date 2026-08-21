import type { ClientTrainingLevel, ExerciseExperienceState } from "@/lib/platform/training-v2-contracts";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import type { ExercisePriority, MusclePriority } from "./types";

export function resolveExercisePriority(
  musclePriority: MusclePriority | null,
  mechanics: string | null,
): ExercisePriority | null {
  if (!musclePriority) return null;
  if (musclePriority === "PRIMARY" && mechanics === "COMPOUND") return "REQUIRED";
  if (musclePriority === "PRIMARY") return "HIGH";
  if (musclePriority === "SECONDARY") return "NORMAL";
  return "OPTIONAL";
}

export function prescribeWorkingSets(input: {
  trainingLevel: ClientTrainingLevel;
  exerciseExperience: ExerciseExperienceState;
  exercisePriority: ExercisePriority | null;
  mechanics: string | null;
  calibrating: boolean;
}): number {
  const conservative = input.trainingLevel === "UNASSESSED" || input.calibrating || input.exerciseExperience === "NEW";
  if (conservative) {
    if (input.exercisePriority === "REQUIRED" || input.exercisePriority === "HIGH") return 3;
    return 2;
  }
  if (input.trainingLevel === "BEGINNER") {
    if (input.exercisePriority === "REQUIRED" || input.exercisePriority === "HIGH") return 3;
    return 2;
  }
  if (input.exercisePriority === "REQUIRED" && input.mechanics === "COMPOUND") return 4;
  if (input.exercisePriority === "OPTIONAL") return 2;
  return 3;
}

export function prescribeWarmupSets(input: {
  exercise: ExerciseV2Metadata;
  trainingLevel: ClientTrainingLevel;
  calibrating: boolean;
}): number {
  if (input.exercise.mechanics !== "COMPOUND") return 0;
  if (input.exercise.is_bodyweight) return 0;
  if (input.exercise.prescription_mode === "DURATION") return 0;
  const loaded =
    input.exercise.loading_type === "BARBELL" ||
    input.exercise.loading_type === "SMITH_MACHINE" ||
    input.exercise.loading_type === "DUMBBELL";
  if (!loaded) return 0;
  if (input.trainingLevel === "UNASSESSED" && !input.calibrating) return 1;
  if (input.calibrating) return 1;
  return 1;
}
