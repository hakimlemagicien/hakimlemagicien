import { isV2EligibleExercise, type ExerciseV2Metadata, type LocationCompatibility } from "@/lib/platform/exercise-library-v2";
import type { ClientTrainingLevel } from "@/lib/platform/training-v2-contracts";

export type EligibilityFailure =
  | "INACTIVE_OR_UNAPPROVED"
  | "MOVEMENT_ROLE_MISMATCH"
  | "MUSCLE_MISMATCH"
  | "EQUIPMENT_UNAVAILABLE"
  | "LOCATION_INCOMPATIBLE"
  | "PRESCRIPTION_MODE_MISMATCH"
  | "COMPLEXITY_INAPPROPRIATE"
  | "EQUIPMENT_CONTEXT_REQUIRED";

export type EligibilityInput = {
  exercise: ExerciseV2Metadata;
  isActive?: boolean;
  requiredMovementRole?: string | null;
  targetMuscle?: string | null;
  requiredPrescriptionMode?: string | null;
  location?: LocationCompatibility | null;
  availableEquipment?: string[] | null;
  trainingLevel?: ClientTrainingLevel;
};

export function isMetadataApproved(exercise: ExerciseV2Metadata, isActive = true): boolean {
  return isV2EligibleExercise({
    is_active: isActive,
    external_id: exercise.external_id,
    metadata_status: exercise.metadata_status,
    primary_muscles: exercise.primary_muscles,
    primary_movement_role: exercise.primary_movement_role,
    equipment_state: exercise.equipment_state,
    required_equipment: exercise.required_equipment,
    mechanics: exercise.mechanics,
    is_bodyweight: exercise.is_bodyweight,
    is_unilateral: exercise.is_unilateral,
    prescription_mode: exercise.prescription_mode,
    supports_timed_prescription: exercise.supports_timed_prescription,
  });
}

export function explainEligibility(input: EligibilityInput): EligibilityFailure | null {
  const { exercise } = input;
  if (!isMetadataApproved(exercise, input.isActive ?? true)) return "INACTIVE_OR_UNAPPROVED";
  if (input.requiredMovementRole && exercise.primary_movement_role !== input.requiredMovementRole) {
    return "MOVEMENT_ROLE_MISMATCH";
  }
  if (input.targetMuscle && !exercise.primary_muscles.includes(input.targetMuscle)) {
    return "MUSCLE_MISMATCH";
  }
  if (input.requiredPrescriptionMode && exercise.prescription_mode !== input.requiredPrescriptionMode) {
    return "PRESCRIPTION_MODE_MISMATCH";
  }

  const location = input.location ?? null;
  const equipment = input.availableEquipment;
  if (!location && equipment == null) {
    if (exercise.equipment_state !== "NO_EQUIPMENT" && !exercise.location_compatibility.includes("NO_EQUIPMENT")) {
      return "EQUIPMENT_CONTEXT_REQUIRED";
    }
  }
  if (location && !exercise.location_compatibility.includes(location)) {
    return "LOCATION_INCOMPATIBLE";
  }
  if (equipment && exercise.equipment_state === "HAS_EQUIPMENT") {
    const missing = exercise.required_equipment.filter((item) => !equipment.includes(item));
    if (missing.length) return "EQUIPMENT_UNAVAILABLE";
  }

  if (
    (input.trainingLevel === "UNASSESSED" || input.trainingLevel === "BEGINNER") &&
    exercise.complexity === "HIGH" &&
    exercise.beginner_eligible === false
  ) {
    return "COMPLEXITY_INAPPROPRIATE";
  }
  return null;
}

export function filterEligibleExercises(
  candidates: ExerciseV2Metadata[],
  input: Omit<EligibilityInput, "exercise">,
): ExerciseV2Metadata[] {
  return candidates.filter((exercise) => explainEligibility({ ...input, exercise }) == null);
}
