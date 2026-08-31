import type { ClientTrainingLevel, ExerciseExperienceState } from "@/lib/platform/training-v2-contracts";
import type { TrainingV2CanonicalGoal } from "@/lib/platform/training-v2-contracts";
import type { ExerciseV2Metadata, LocationCompatibility } from "@/lib/platform/exercise-library-v2";
import type { ExercisePoolVersion } from "@/lib/platform/strategy-matrix/core-100";
import type { MusclePriority, ExercisePriority } from "@/lib/platform/prescription/types";
import type { RecoveryCapacityState } from "@/lib/platform/volume/types";
import type { ReallocationRequest } from "@/lib/platform/goal-intelligence/types";

export const SUPPORTED_DAYS_PER_WEEK = [2, 3, 4, 5] as const;
export type DaysPerWeek = (typeof SUPPORTED_DAYS_PER_WEEK)[number];

export const SESSION_ROLES = [
  "LOWER_GLUTE_PRIORITY",
  "LOWER_GLUTE_SUPPORT",
  "LOWER_SUPPORT",
  "LOWER_POSTERIOR",
  "POSTERIOR_CHAIN",
  "UPPER_PRIORITY",
  "UPPER_SUPPORT",
  "PULL_POSTERIOR",
  "FULL_BODY",
  "BALANCED_FULL_BODY",
  "CORE_SUPPORT",
] as const;
export type SessionRole = (typeof SESSION_ROLES)[number];

export const GENERATION_REASON_CODES = [
  "INITIAL_PROGRAM_GENERATION",
  "GOAL_CHANGED",
  "TRAINING_DAYS_CHANGED",
  "LOCATION_CHANGED",
  "EQUIPMENT_CHANGED",
  "REGIONAL_REALLOCATION",
  "PROGRAM_REVIEW",
  "SCHEDULE_CAPACITY_ADJUSTMENT",
  "SESSION_DURATION_ADJUSTMENT",
  "RECONDITIONING_TRANSITION",
  "COACH_REQUEST",
  "SAFETY_CONSTRAINT_CHANGED",
] as const;
export type GenerationReasonCode = (typeof GENERATION_REASON_CODES)[number];

export const VALIDATION_STATUSES = ["VALID", "VALID_WITH_WARNINGS", "INVALID"] as const;
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export const VALIDATION_ERROR_CODES = [
  "MISSING_PRIMARY_REGION",
  "REGIONAL_VOLUME_BELOW_MIN",
  "REGIONAL_VOLUME_ABOVE_MAX",
  "RECOVERY_SPACING_INVALID",
  "SESSION_DURATION_EXCEEDED",
  "MISSING_MOVEMENT_ROLE",
  "REDUNDANT_STIMULUS_EXCESS",
  "EQUIPMENT_MISMATCH",
  "LOCATION_MISMATCH",
  "UNKNOWN_EXERCISE",
  "SAFETY_RESTRICTION_VIOLATION",
  "INVALID_SEQUENCE",
  "DUPLICATE_SESSION_INDEX",
  "NO_VALID_EXERCISE_CANDIDATE",
  "SPOT_REDUCTION_LOGIC_INVALID",
  "PROTECTED_OUTCOME_CONFLICT",
  "PROGRAM_CAPACITY_EXCEEDED",
  "UNSUPPORTED_FREQUENCY",
  "PROGRAM_GENERATION_BLOCKED",
  "NOT_IN_CORE_100",
  "INSUFFICIENT_SAFE_EXERCISE_COVERAGE",
] as const;
export type ValidationErrorCode = (typeof VALIDATION_ERROR_CODES)[number];

export const VALIDATION_WARNING_CODES = [
  "SESSION_NEAR_DURATION_LIMIT",
  "PRIMARY_VOLUME_NEAR_MAX",
  "HIGH_REGIONAL_OVERLAP",
  "NEW_EXERCISE_CALIBRATION_REQUIRED",
  "LOW_EXERCISE_VARIETY",
  "HIGH_EXERCISE_VARIETY",
  "BODY_COMPOSITION_REVIEW_PENDING",
  "COACH_REVIEW_RECOMMENDED",
  "SCHEDULE_CAPACITY_MISMATCH",
] as const;
export type ValidationWarningCode = (typeof VALIDATION_WARNING_CODES)[number];

export type RegionalVolumeTarget = {
  region: string;
  min: number;
  target: number;
  max: number;
};

export type ProgramSlot = {
  movementRole?: string | null;
  muscleFamily: string;
  priority: MusclePriority;
};

export type GeneratedExercise = {
  external_id: string;
  session_index: number;
  order_index: number;
  sets: number;
  rest_seconds: number;
  reps_min: number | null;
  reps_max: number | null;
  duration_seconds: number | null;
  suggested_weight_kg: null;
  muscle_priority: MusclePriority | null;
  exercise_priority: ExercisePriority | null;
  movement_role: string | null;
  calibration_required: boolean;
  retained: boolean;
};

export type GeneratedSession = {
  program_day_id: string;
  sequence_index: number;
  role: SessionRole;
  title: string;
  primary_regions: string[];
  estimated_minutes: number;
  exercises: GeneratedExercise[];
};

export type ProgramCandidate = {
  goal_id: TrainingV2CanonicalGoal;
  days_per_week: DaysPerWeek;
  version: number;
  context_version: string;
  sessions: GeneratedSession[];
};

export type ValidationIssue = {
  code: ValidationErrorCode | ValidationWarningCode;
  severity: "error" | "warning";
  message: string;
  session_index?: number;
};

export type ValidationResult = {
  status: ValidationStatus;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};

export type RegionalVolumeSummary = Record<string, { effective: number; physical: number }>;

export type ProgramGenerationContext = {
  goalId: string;
  trainingLevel: ClientTrainingLevel;
  daysPerWeek: number;
  availableMinutes: number;
  location: LocationCompatibility;
  /** When set, exercise may match any listed environment (BOTH semantics — union, not intersection). */
  permittedLocations?: LocationCompatibility[];
  availableEquipment?: string[] | null;
  excludedExternalIds?: string[];
  lockedExternalIds?: string[];
  restrictedMuscles?: string[];
  /** Injury identifiers from profile — wired in Phase 1; exercise exclusions in Phase 3. */
  injuryIds?: string[];
  exercisePoolVersion?: ExercisePoolVersion;
  experienceById?: Record<string, ExerciseExperienceState>;
  previousExternalIds?: string[];
  previousProgram?: ProgramCandidate | null;
  regionalTargets?: RegionalVolumeTarget[];
  reallocation?: Pick<ReallocationRequest, "from_region" | "to_region"> | null;
  recoveryState?: RecoveryCapacityState;
  reconditioningActive?: boolean;
  scheduleCapacityMismatch?: boolean;
  allowFrequencyAdaptation?: boolean;
  sessionDurationMismatch?: boolean;
  waistStagnationSpotReduction?: boolean;
  reason?: GenerationReasonCode;
  exercises: ExerciseV2Metadata[];
  coachProtected?: boolean;
};

export type ProgramGenerationResult = {
  status: "READY" | "PROGRAM_REVIEW_REQUIRED" | "PROGRAM_GENERATION_BLOCKED" | "COACH_OVERRIDE_CONFLICT";
  candidate: ProgramCandidate | null;
  validation: ValidationResult;
  regional_volume: RegionalVolumeSummary;
  movement_roles: string[];
  generation_reason: GenerationReasonCode;
  client_explanation: string;
  diff: {
    retained: string[];
    added: string[];
    removed: string[];
  };
};

export const PROGRAM_GENERATOR = "generateTrainingProgram" as const;
export const PROGRAM_VALIDATOR = "validateTrainingProgram" as const;
export const PROGRAM_CONTEXT_VERSION = "v2-phase10-1" as const;
