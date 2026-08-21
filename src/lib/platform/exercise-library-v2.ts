/**
 * Training Engine V2 Phase 3 — Exercise Library compatibility contracts.
 * Factual metadata only. No selection ranking, prescription, volume, or goals.
 */

export const EXERCISE_EXTERNAL_ID_PATTERN = /^[A-Z]{2}-\d{3}$/;

export const V2_METADATA_STATUSES = [
  "UNREVIEWED",
  "REVIEW_REQUIRED",
  "APPROVED",
  "BLOCKED",
] as const;
export type V2MetadataStatus = (typeof V2_METADATA_STATUSES)[number];

export const MUSCLE_CONTRIBUTION_ROLES = [
  "DIRECT_PRIMARY",
  "DIRECT_SECONDARY",
  "INDIRECT_MEANINGFUL",
  "MINOR_STABILIZER",
] as const;
export type MuscleContributionRole = (typeof MUSCLE_CONTRIBUTION_ROLES)[number];

export const CANONICAL_MUSCLES = [
  "CHEST",
  "BACK",
  "LATS",
  "UPPER_BACK",
  "TRAPEZIUS",
  "RHOMBOIDS",
  "SHOULDERS",
  "ANTERIOR_DELTOID",
  "LATERAL_DELTOID",
  "POSTERIOR_DELTOID",
  "BICEPS",
  "TRICEPS",
  "FOREARMS",
  "CORE",
  "RECTUS_ABDOMINIS",
  "OBLIQUES",
  "QUADRICEPS",
  "HAMSTRINGS",
  "GLUTES",
  "GLUTEUS_MAXIMUS",
  "GLUTEUS_MEDIUS",
  "GLUTEUS_MINIMUS",
  "CALVES",
  "ADDUCTORS",
  "ABDUCTORS",
  "HIP_FLEXORS",
  "FULL_BODY",
] as const;
export type CanonicalMuscle = (typeof CANONICAL_MUSCLES)[number];

export const MUSCLE_LEGACY_ALIASES: Record<string, CanonicalMuscle> = {
  chest: "CHEST",
  pecs: "CHEST",
  pectorals: "CHEST",
  back: "BACK",
  lats: "LATS",
  latissimus: "LATS",
  "upper back": "UPPER_BACK",
  traps: "TRAPEZIUS",
  trapezius: "TRAPEZIUS",
  rhomboids: "RHOMBOIDS",
  shoulders: "SHOULDERS",
  delts: "SHOULDERS",
  "front delt": "ANTERIOR_DELTOID",
  "side delt": "LATERAL_DELTOID",
  "rear delt": "POSTERIOR_DELTOID",
  biceps: "BICEPS",
  triceps: "TRICEPS",
  forearms: "FOREARMS",
  core: "CORE",
  abs: "RECTUS_ABDOMINIS",
  abdominals: "RECTUS_ABDOMINIS",
  obliques: "OBLIQUES",
  quads: "QUADRICEPS",
  quadriceps: "QUADRICEPS",
  hamstrings: "HAMSTRINGS",
  glutes: "GLUTES",
  glute: "GLUTES",
  calves: "CALVES",
  adductors: "ADDUCTORS",
  abductors: "ABDUCTORS",
  "hip flexors": "HIP_FLEXORS",
  "full body": "FULL_BODY",
};

export const MOVEMENT_ROLES = [
  "SQUAT",
  "HINGE",
  "HIP_EXTENSION",
  "KNEE_EXTENSION",
  "KNEE_FLEXION",
  "HORIZONTAL_PUSH",
  "VERTICAL_PUSH",
  "HORIZONTAL_PULL",
  "VERTICAL_PULL",
  "ELBOW_FLEXION",
  "ELBOW_EXTENSION",
  "SHOULDER_ABDUCTION",
  "SHOULDER_FLEXION",
  "SHOULDER_EXTERNAL_ROTATION",
  "HIP_ABDUCTION",
  "HIP_ADDUCTION",
  "CALF_RAISE",
  "TRUNK_FLEXION",
  "ANTI_EXTENSION",
  "ANTI_ROTATION",
  "LATERAL_STABILITY",
  "LOADED_CARRY",
  "LOCOMOTION",
  "STEADY_CARDIO",
  "INTERVAL_CONDITIONING",
  "MOBILITY",
  "WARMUP",
  "SCAPULAR_CONTROL",
] as const;
export type MovementRole = (typeof MOVEMENT_ROLES)[number];

export const MECHANICS = ["COMPOUND", "ISOLATION", "NOT_APPLICABLE"] as const;
export type ExerciseMechanics = (typeof MECHANICS)[number];

export const LOADING_TYPES = [
  "BARBELL",
  "DUMBBELL",
  "MACHINE",
  "CABLE",
  "BODYWEIGHT",
  "BAND",
  "KETTLEBELL",
  "PLATE_LOADED_MACHINE",
  "SELECTORIZED_MACHINE",
  "SMITH_MACHINE",
  "CARDIO_MACHINE",
  "OTHER",
] as const;
export type LoadingType = (typeof LOADING_TYPES)[number];

export const EQUIPMENT_STATES = ["NO_EQUIPMENT", "HAS_EQUIPMENT", "UNKNOWN"] as const;
export type EquipmentState = (typeof EQUIPMENT_STATES)[number];

export const LOCATION_COMPATIBILITY = ["GYM", "HOME", "NO_EQUIPMENT"] as const;
export type LocationCompatibility = (typeof LOCATION_COMPATIBILITY)[number];

export const EXECUTION_SIDES = ["BILATERAL", "ALTERNATING", "LEFT_RIGHT_SEPARATE"] as const;
export type ExecutionSides = (typeof EXECUTION_SIDES)[number];

export const PRESCRIPTION_MODES = ["REPS", "DURATION", "DISTANCE", "INTERVAL", "OTHER"] as const;
export type PrescriptionMode = (typeof PRESCRIPTION_MODES)[number];

export const CONDITIONING_CLASSES = [
  "STEADY_CARDIO",
  "CYCLICAL_CONDITIONING",
  "BODYWEIGHT_CONDITIONING",
  "CIRCUIT_CAPABLE",
  "INTERVAL_CAPABLE",
] as const;
export type ConditioningClass = (typeof CONDITIONING_CLASSES)[number];

export const COMPLEXITY_LEVELS = ["LOW", "MODERATE", "HIGH"] as const;
export type ComplexityLevel = (typeof COMPLEXITY_LEVELS)[number];

export const EQUIPMENT_ALIASES: Record<string, string> = {
  dumbbell: "DUMBBELLS",
  dumbbells: "DUMBBELLS",
  db: "DUMBBELLS",
  barbell: "BARBELL",
  bb: "BARBELL",
  cable: "CABLE_STATION",
  cables: "CABLE_STATION",
  machine: "MACHINE",
  band: "RESISTANCE_BAND",
  bands: "RESISTANCE_BAND",
  none: "NO_EQUIPMENT",
  bodyweight: "NO_EQUIPMENT",
};

export type MuscleContribution = {
  muscle: string;
  contribution: MuscleContributionRole;
};

export type ExerciseV2Metadata = {
  external_id: string;
  name_en: string;
  name_ar: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  muscle_contributions: MuscleContribution[];
  primary_movement_role: string | null;
  secondary_movement_roles: string[];
  substitution_group: string | null;
  mechanics: ExerciseMechanics | null;
  loading_type: LoadingType | null;
  required_equipment: string[];
  equipment_state: EquipmentState;
  location_compatibility: LocationCompatibility[];
  is_bodyweight: boolean | null;
  is_unilateral: boolean | null;
  execution_sides: ExecutionSides | null;
  supports_timed_prescription: boolean | null;
  prescription_mode: PrescriptionMode | null;
  conditioning_class: ConditioningClass | null;
  complexity: ComplexityLevel | null;
  beginner_eligible: boolean | null;
  metadata_status: V2MetadataStatus;
  media_status: string;
};

export type V2CandidateFilters = {
  movementRole?: string;
  muscle?: string;
  equipment?: string;
  location?: LocationCompatibility;
  prescriptionMode?: string;
  substitutionGroup?: string;
  mechanics?: string;
};

export const EXERCISE_LIBRARY_AUTHORING = {
  AUTHORING_SOURCE: "scripts/exercise-library.json + scripts/exercise-library-v2-metadata.json",
  RUNTIME_SOURCE: "public.exercises",
  SYNC_DIRECTION: "catalog JSON → public.exercises by external_id; V2 columns never overwritten by empty JSON",
  ADMIN_EDIT_PATH: "Admin Exercise Library Manager → admin_save_exercise",
  CONFLICT_RESOLUTION: "Admin DB writes win until the next explicit V2 metadata apply; identity (external_id) is immutable",
} as const;

export function normalizeMuscleKey(value: string | null | undefined): CanonicalMuscle | null {
  if (!value || !value.trim()) return null;
  const upper = value.trim().toUpperCase().replace(/\s+/g, "_");
  if ((CANONICAL_MUSCLES as readonly string[]).includes(upper)) return upper as CanonicalMuscle;
  const alias = MUSCLE_LEGACY_ALIASES[value.trim().toLowerCase()];
  return alias ?? null;
}

export function normalizeEquipmentKey(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const alias = EQUIPMENT_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;
  return trimmed.toUpperCase().replace(/\s+/g, "_");
}

export function isValidExternalId(value: string | null | undefined): boolean {
  return Boolean(value && EXERCISE_EXTERNAL_ID_PATTERN.test(value));
}

export function hasCompleteV2CriticalMetadata(input: {
  external_id: string;
  is_active?: boolean;
  metadata_status: V2MetadataStatus;
  primary_muscle?: string | null;
  primary_muscles?: string[];
  primary_movement_role: string | null;
  equipment_state: EquipmentState;
  required_equipment?: string[];
  mechanics: string | null;
  is_bodyweight: boolean | null;
  is_unilateral: boolean | null;
  prescription_mode: string | null;
  supports_timed_prescription?: boolean | null;
}): boolean {
  const primary =
    (input.primary_muscles && input.primary_muscles[0]) || input.primary_muscle || null;
  if (!isValidExternalId(input.external_id)) return false;
  if (!primary) return false;
  if (!input.primary_movement_role) return false;
  if (input.equipment_state === "UNKNOWN") return false;
  if (input.equipment_state === "HAS_EQUIPMENT" && !(input.required_equipment ?? []).length) return false;
  if (input.equipment_state === "NO_EQUIPMENT" && (input.required_equipment ?? []).length > 0) return false;
  if (!input.mechanics) return false;
  if (input.is_bodyweight == null) return false;
  if (input.is_unilateral == null) return false;
  if (!input.prescription_mode) return false;
  if (input.prescription_mode === "DURATION" && input.supports_timed_prescription !== true) return false;
  return true;
}

export function isV2EligibleExercise(input: {
  is_active: boolean;
  external_id: string;
  metadata_status: V2MetadataStatus;
  primary_muscle?: string | null;
  primary_muscles?: string[];
  primary_movement_role: string | null;
  equipment_state: EquipmentState;
  required_equipment?: string[];
  mechanics: string | null;
  is_bodyweight: boolean | null;
  is_unilateral: boolean | null;
  prescription_mode: string | null;
  supports_timed_prescription?: boolean | null;
}): boolean {
  return (
    input.is_active &&
    input.metadata_status === "APPROVED" &&
    hasCompleteV2CriticalMetadata(input)
  );
}

export function filterV2Candidates<T extends ExerciseV2Metadata>(
  records: T[],
  filters: V2CandidateFilters = {},
): T[] {
  return records.filter((record) => {
    if (
      !isV2EligibleExercise({
        is_active: true,
        external_id: record.external_id,
        metadata_status: record.metadata_status,
        primary_muscles: record.primary_muscles,
        primary_movement_role: record.primary_movement_role,
        equipment_state: record.equipment_state,
        required_equipment: record.required_equipment,
        mechanics: record.mechanics,
        is_bodyweight: record.is_bodyweight,
        is_unilateral: record.is_unilateral,
        prescription_mode: record.prescription_mode,
        supports_timed_prescription: record.supports_timed_prescription,
      })
    ) {
      return false;
    }
    if (filters.movementRole && record.primary_movement_role !== filters.movementRole) return false;
    if (filters.muscle && !record.primary_muscles.includes(filters.muscle)) return false;
    if (filters.equipment && !record.required_equipment.includes(filters.equipment)) return false;
    if (filters.location && !record.location_compatibility.includes(filters.location)) return false;
    if (filters.prescriptionMode && record.prescription_mode !== filters.prescriptionMode) return false;
    if (filters.substitutionGroup && record.substitution_group !== filters.substitutionGroup) return false;
    if (filters.mechanics && record.mechanics !== filters.mechanics) return false;
    return true;
  });
}

export function substitutionCandidates<T extends ExerciseV2Metadata>(
  source: T,
  pool: T[],
  options: { sameEquipment?: boolean; location?: LocationCompatibility } = {},
): T[] {
  return filterV2Candidates(pool, {
    movementRole: source.primary_movement_role ?? undefined,
    location: options.location,
    equipment: options.sameEquipment ? source.required_equipment[0] : undefined,
  }).filter((candidate) => candidate.external_id !== source.external_id);
}

export function validateV2Combination(input: {
  metadata_status: V2MetadataStatus;
  loading_type?: string | null;
  is_bodyweight?: boolean | null;
  required_equipment?: string[];
  equipment_state?: EquipmentState;
  prescription_mode?: string | null;
  supports_timed_prescription?: boolean | null;
  primary_movement_role?: string | null;
  conditioning_class?: string | null;
  exercise_type?: string | null;
}): string[] {
  const errors: string[] = [];
  if (
    input.is_bodyweight === true &&
    input.loading_type &&
    ["BARBELL", "DUMBBELL", "CABLE", "SELECTORIZED_MACHINE", "SMITH_MACHINE", "PLATE_LOADED_MACHINE"].includes(
      input.loading_type,
    )
  ) {
    errors.push("bodyweight_loading_conflict");
  }
  if (input.prescription_mode === "DURATION" && input.supports_timed_prescription !== true) {
    errors.push("duration_requires_timed");
  }
  if (input.metadata_status === "APPROVED" && !input.primary_movement_role) {
    errors.push("approved_missing_movement_role");
  }
  if (
    input.conditioning_class &&
    input.exercise_type === "mobility" &&
    input.conditioning_class !== "CIRCUIT_CAPABLE"
  ) {
    errors.push("conditioning_on_mobility");
  }
  if (input.equipment_state === "NO_EQUIPMENT" && (input.required_equipment ?? []).length > 0) {
    errors.push("no_equipment_with_requirements");
  }
  if (input.equipment_state === "HAS_EQUIPMENT" && !(input.required_equipment ?? []).length) {
    errors.push("has_equipment_without_requirements");
  }
  return errors;
}
