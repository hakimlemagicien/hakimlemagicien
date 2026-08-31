import type { ClientTrainingLevel, ExerciseExperienceState } from "@/lib/platform/training-v2-contracts";
import type { TrainingV2Effort } from "@/lib/platform/training-v2-contracts";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import type { RestReason } from "./types";

export function prescribeTargetEffort(input: {
  trainingLevel: ClientTrainingLevel;
  exerciseExperience: ExerciseExperienceState;
  mechanics: string | null;
  calibrating: boolean;
}): { target_effort: TrainingV2Effort; failure_allowed: boolean; failure_required: false } {
  const beginner = input.trainingLevel === "UNASSESSED" || input.trainingLevel === "BEGINNER";
  if (input.calibrating || beginner) {
    return {
      target_effort: "IDEAL",
      failure_allowed: input.mechanics === "ISOLATION" && !beginner,
      failure_required: false,
    };
  }
  return {
    target_effort: "IDEAL",
    failure_allowed: input.mechanics === "ISOLATION",
    failure_required: false,
  };
}

export function prescribeRest(input: {
  exercise: ExerciseV2Metadata;
  strengthEmphasis: boolean;
  calibrating: boolean;
}): { recommended_rest_seconds: number; rest_reason: RestReason } {
  if (input.calibrating) {
    const compound = input.exercise.mechanics === "COMPOUND";
    return {
      recommended_rest_seconds: compound ? 150 : 90,
      rest_reason: "CALIBRATION",
    };
  }
  if (input.exercise.prescription_mode === "DURATION" || input.exercise.prescription_mode === "INTERVAL") {
    return { recommended_rest_seconds: 60, rest_reason: "TIMED_CONDITIONING" };
  }
  if (input.strengthEmphasis && input.exercise.mechanics === "COMPOUND") {
    return { recommended_rest_seconds: 180, rest_reason: "STRENGTH_EMPHASIS" };
  }
  if (input.exercise.mechanics === "COMPOUND") {
    return { recommended_rest_seconds: 150, rest_reason: "COMPOUND_HIGH_DEMAND" };
  }
  return { recommended_rest_seconds: 90, rest_reason: "ISOLATION_ACCESSORY" };
}
