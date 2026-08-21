import type { ClientTrainingLevel } from "@/lib/platform/training-v2-contracts";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";

const ACCESSORY_HIGH_REP_ROLES = new Set([
  "SHOULDER_ABDUCTION",
  "SHOULDER_FLEXION",
  "HIP_ABDUCTION",
  "CALF_RAISE",
  "ELBOW_FLEXION",
  "ELBOW_EXTENSION",
]);

export function prescribeRepOrDuration(input: {
  exercise: ExerciseV2Metadata;
  trainingLevel: ClientTrainingLevel;
  strengthEligible: boolean;
}): {
  rep_min: number | null;
  rep_max: number | null;
  fixed_reps: number | null;
  duration_min: number | null;
  duration_max: number | null;
} {
  const mode = input.exercise.prescription_mode;
  if (mode === "DURATION") {
    const beginner = input.trainingLevel !== "INTERMEDIATE";
    return {
      rep_min: null,
      rep_max: null,
      fixed_reps: null,
      duration_min: beginner ? 20 : 30,
      duration_max: beginner ? 40 : 60,
    };
  }
  if (mode === "INTERVAL" || mode === "DISTANCE") {
    return {
      rep_min: null,
      rep_max: null,
      fixed_reps: null,
      duration_min: input.trainingLevel === "UNASSESSED" ? 8 : 12,
      duration_max: input.trainingLevel === "UNASSESSED" ? 15 : 20,
    };
  }

  if (input.strengthEligible && input.exercise.mechanics === "COMPOUND") {
    return { rep_min: 3, rep_max: 6, fixed_reps: null, duration_min: null, duration_max: null };
  }
  if (input.exercise.mechanics === "ISOLATION" || ACCESSORY_HIGH_REP_ROLES.has(input.exercise.primary_movement_role ?? "")) {
    if (input.exercise.primary_movement_role === "SHOULDER_ABDUCTION" || input.exercise.primary_movement_role === "HIP_ABDUCTION") {
      return { rep_min: 12, rep_max: 20, fixed_reps: null, duration_min: null, duration_max: null };
    }
    return { rep_min: 8, rep_max: 15, fixed_reps: null, duration_min: null, duration_max: null };
  }
  return { rep_min: 6, rep_max: 12, fixed_reps: null, duration_min: null, duration_max: null };
}

export function isStrengthEligible(input: {
  trainingLevel: ClientTrainingLevel;
  exerciseExperience: string;
  mechanics: string | null;
}): boolean {
  return (
    input.trainingLevel === "INTERMEDIATE" &&
    input.exerciseExperience === "ESTABLISHED" &&
    input.mechanics === "COMPOUND"
  );
}
