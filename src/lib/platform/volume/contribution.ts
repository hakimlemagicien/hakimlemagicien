import type {
  ExerciseV2Metadata,
  MuscleContributionRole,
} from "@/lib/platform/exercise-library-v2";
import { CONTRIBUTION_WEIGHT } from "./types";

export function contributionWeight(role: MuscleContributionRole | null | undefined): number {
  if (!role) return 0;
  return CONTRIBUTION_WEIGHT[role] ?? 0;
}

export function exerciseContributions(exercise: ExerciseV2Metadata | undefined): {
  contributions: Array<{ muscle: string; role: MuscleContributionRole; weight: number }>;
  metadataRequired: boolean;
} {
  if (!exercise) return { contributions: [], metadataRequired: true };
  const rows = exercise.muscle_contributions ?? [];
  if (!rows.length) {
    return { contributions: [], metadataRequired: true };
  }
  return {
    contributions: rows.map((row) => ({
      muscle: row.muscle,
      role: row.contribution,
      weight: contributionWeight(row.contribution),
    })),
    metadataRequired: false,
  };
}

export function isConditioningExercise(exercise: ExerciseV2Metadata | undefined) {
  if (!exercise) return false;
  if (exercise.conditioning_class) return true;
  return exercise.prescription_mode === "INTERVAL" || exercise.prescription_mode === "DISTANCE";
}

export function isLowerBodyDemand(exercise: ExerciseV2Metadata | undefined) {
  if (!exercise) return false;
  const muscles = [
    ...(exercise.primary_muscles ?? []),
    ...(exercise.muscle_contributions?.map((row) => row.muscle) ?? []),
  ];
  if (
    muscles.some((muscle) =>
      ["GLUTES", "GLUTEUS_MAXIMUS", "GLUTEUS_MEDIUS", "QUADRICEPS", "HAMSTRINGS"].includes(muscle),
    )
  ) {
    return true;
  }
  if (isConditioningExercise(exercise)) {
    return muscles.length === 0 || muscles.includes("FULL_BODY");
  }
  return false;
}
