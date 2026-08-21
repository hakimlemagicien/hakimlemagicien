/**
 * Training Engine V2 Phase 4 — Core Prescription contracts.
 * Current / initial prescription only. No weekly volume, recovery, or next-session progression.
 */
import type {
  ClientTrainingLevel,
  ExerciseExperienceState,
  ExerciseSetHistoryItem,
  PrescriptionState,
  TrainingV2CanonicalGoal,
  TrainingV2Effort,
} from "@/lib/platform/training-v2-contracts";
import type { ExerciseV2Metadata, LocationCompatibility } from "@/lib/platform/exercise-library-v2";
import type { NextSessionProgression } from "@/lib/platform/progression/types";

export type MusclePriority = "PRIMARY" | "SECONDARY" | "MAINTENANCE";
export type ExercisePriority = "REQUIRED" | "HIGH" | "NORMAL" | "OPTIONAL";
export type PrescriptionConfidence = "LOW" | "MODERATE" | "HIGH";

export type LoadSource =
  | "RECENT_HISTORY"
  | "CALIBRATION"
  | "USER_AVAILABLE_LOAD"
  | "RECONDITIONING_HISTORY"
  | "NO_LOAD"
  | "BODYWEIGHT"
  | "UNKNOWN_REQUIRES_CALIBRATION"
  | "PROGRESSION_DECISION";

export type CorePrescriptionStatus =
  | "READY"
  | "CALIBRATION_REQUIRED"
  | "RECALIBRATION_REQUIRED"
  | "INSUFFICIENT_DATA"
  | "EQUIPMENT_CONTEXT_REQUIRED"
  | "SAFETY_REVIEW_REQUIRED"
  | "GOAL_MAPPING_REQUIRED"
  | "EXERCISE_METADATA_REQUIRED";

export type PrescriptionReason =
  | "NEW_EXERCISE_CALIBRATION"
  | "RECENT_HISTORY_REUSED"
  | "GOAL_PRIMARY_MUSCLE"
  | "BEGINNER_CONSERVATIVE_START"
  | "BODYWEIGHT_PRESCRIPTION"
  | "TIMED_EXERCISE"
  | "RECONDITIONING_RECALIBRATION"
  | "EQUIPMENT_FILTERED"
  | "EXISTING_EXERCISE_STABILITY"
  | "V2_FALLBACK_LEGACY_PRESCRIPTION"
  | "GOAL_UNMAPPED"
  | "METADATA_REQUIRED"
  | "SAFETY_REVIEW"
  | "INSUFFICIENT_DATA"
  | "COMPOUND_HYPERTROPHY"
  | "ISOLATION_ACCESSORY"
  | "STRENGTH_EMPHASIS_BLOCKED_FOR_LEVEL";

export type RestReason =
  | "COMPOUND_HIGH_DEMAND"
  | "ISOLATION_ACCESSORY"
  | "STRENGTH_EMPHASIS"
  | "TIMED_CONDITIONING"
  | "CALIBRATION";

export type CalibrationAction =
  | "KEEP"
  | "SMALL_INCREASE"
  | "REDUCE"
  | "RECALIBRATE"
  | "SAFETY_REVIEW";

export type AssignedSnapshotPrescription = {
  sets?: number | null;
  reps?: string | null;
  rest_seconds?: number | null;
  suggested_weight_kg?: number | null;
  duration_seconds?: number | null;
};

export type CorePrescriptionContext = {
  goalId: string | null;
  trainingLevel: ClientTrainingLevel;
  prescriptionState?: PrescriptionState | null;
  exerciseExperience: ExerciseExperienceState;
  exercise: ExerciseV2Metadata;
  recentHistory?: ExerciseSetHistoryItem[];
  assigned?: AssignedSnapshotPrescription | null;
  location?: LocationCompatibility | null;
  availableEquipment?: string[] | null;
  safetyReview?: boolean;
  severeReadiness?: boolean;
  now?: Date;
  equipmentIncrementKg?: number | null;
  /** When true, coach snapshot fields stay the workout-facing values. */
  preserveAssignedStructure?: boolean;
  /** Phase 6 next-session decision. Does not rewrite history. */
  progression?: NextSessionProgression | null;
  coachProtected?: boolean;
};

export type SelectionContext = {
  goalId: string | null;
  trainingLevel: ClientTrainingLevel;
  location?: LocationCompatibility | null;
  availableEquipment?: string[] | null;
  requiredMovementRole?: string | null;
  targetMuscle?: string | null;
  candidates: ExerciseV2Metadata[];
  existingExternalId?: string | null;
  historyByExternalId?: Record<string, ExerciseSetHistoryItem[]>;
  dislikedExternalIds?: string[];
};

export type CoreExercisePrescription = {
  external_id: string;
  goal_id: TrainingV2CanonicalGoal | null;
  muscle_priority: MusclePriority | null;
  exercise_priority: ExercisePriority | null;
  movement_role: string | null;
  mechanics: string | null;
  prescription_mode: string | null;
  training_level: ClientTrainingLevel;
  exercise_experience: ExerciseExperienceState;
  prescription_state: PrescriptionState | null;
  working_sets: number | null;
  warmup_sets: number;
  set_type_working: "WORKING";
  set_type_warmup: "WARMUP" | null;
  rep_min: number | null;
  rep_max: number | null;
  fixed_reps: number | null;
  duration_min: number | null;
  duration_max: number | null;
  target_effort: TrainingV2Effort | null;
  failure_allowed: boolean;
  failure_required: boolean;
  recommended_rest_seconds: number | null;
  rest_reason: RestReason | null;
  load_source: LoadSource | null;
  prescribed_load: number | null;
  history_reference_load: number | null;
  confidence: PrescriptionConfidence;
  prescription_reason: PrescriptionReason;
  status: CorePrescriptionStatus;
  selection_reason: string | null;
  assigned: AssignedSnapshotPrescription | null;
  used_legacy_fallback: boolean;
};

export type CalibrationAdjustmentInput = {
  exercise: ExerciseV2Metadata;
  trainingLevel: ClientTrainingLevel;
  targetMin: number;
  targetMax: number;
  actualValue: number;
  actualLoad: number | null;
  effort: TrainingV2Effort | null;
  safetyReview?: boolean;
  equipmentIncrementKg?: number | null;
  prescriptionMode: "REPS" | "DURATION" | "INTERVAL" | "DISTANCE" | "OTHER";
};

export type CalibrationAdjustment = {
  action: CalibrationAction;
  next_load: number | null;
  reason: string;
};

export const RECENT_HISTORY_DAYS = 21;
export const LARGE_RELATIVE_INCREMENT = 0.15;

export const CORE_PRESCRIPTION_ENGINE = "getCoreExercisePrescription" as const;
export const CALIBRATION_ADJUSTMENT_ENGINE = "getCalibrationAdjustment" as const;
