import { isV2EligibleExercise, type ExerciseV2Metadata, type LocationCompatibility } from "@/lib/platform/exercise-library-v2";
import { isCore100PoolActive, isInCore100Pool } from "@/lib/platform/strategy-matrix/core-100";
import {
  aggregateSafetyConstraints,
  isExerciseSafetyBlocked,
} from "@/lib/platform/strategy-matrix/exercise-safety-rules";
import type { ExercisePoolVersion } from "@/lib/platform/strategy-matrix/core-100";
import type { ClientTrainingLevel } from "@/lib/platform/training-v2-contracts";

export type EligibilityFailure =
  | "INACTIVE_OR_UNAPPROVED"
  | "MOVEMENT_ROLE_MISMATCH"
  | "MUSCLE_MISMATCH"
  | "EQUIPMENT_UNAVAILABLE"
  | "LOCATION_INCOMPATIBLE"
  | "PRESCRIPTION_MODE_MISMATCH"
  | "COMPLEXITY_INAPPROPRIATE"
  | "EQUIPMENT_CONTEXT_REQUIRED"
  | "NOT_IN_CORE_100"
  | "SAFETY_RESTRICTION";

export type EligibilityInput = {
  exercise: ExerciseV2Metadata;
  isActive?: boolean;
  requiredMovementRole?: string | null;
  targetMuscle?: string | null;
  requiredPrescriptionMode?: string | null;
  location?: LocationCompatibility | null;
  permittedLocations?: LocationCompatibility[] | null;
  availableEquipment?: string[] | null;
  trainingLevel?: ClientTrainingLevel;
  exercisePoolVersion?: ExercisePoolVersion;
  injuryIds?: string[] | null;
  restrictedMuscles?: string[] | null;
  excludedExternalIds?: string[] | null;
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

  if (input.exercisePoolVersion && isCore100PoolActive(input.exercisePoolVersion) && !isInCore100Pool(exercise.external_id)) {
    return "NOT_IN_CORE_100";
  }

  const excluded = new Set(input.excludedExternalIds ?? []);
  if (excluded.has(exercise.external_id)) return "SAFETY_RESTRICTION";

  const safety = aggregateSafetyConstraints(input.injuryIds);
  if (
    isExerciseSafetyBlocked({
      exercise,
      constraints: safety,
      extraRestrictedMuscles: input.restrictedMuscles ?? undefined,
    })
  ) {
    return "SAFETY_RESTRICTION";
  }

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
  const permitted = input.permittedLocations?.filter(Boolean) ?? [];
  const equipment = input.availableEquipment;
  if (!location && permitted.length === 0 && equipment == null) {
    if (exercise.equipment_state !== "NO_EQUIPMENT" && !exercise.location_compatibility.includes("NO_EQUIPMENT")) {
      return "EQUIPMENT_CONTEXT_REQUIRED";
    }
  }
  if (permitted.length > 0) {
    const allowed = permitted.some((item) => exercise.location_compatibility.includes(item));
    if (!allowed) return "LOCATION_INCOMPATIBLE";
  } else if (location && !exercise.location_compatibility.includes(location)) {
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
