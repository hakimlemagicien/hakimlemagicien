import type {
  ClientTrainingLevel,
  ExerciseExperienceState,
  ExerciseSetHistoryItem,
  PrescriptionState,
  TrainingV2CanonicalGoal,
} from "@/lib/platform/training-v2-contracts";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import type { PrescriptionConfidence } from "@/lib/platform/prescription/types";

export const PROGRESSION_ACTIONS = [
  "INCREASE_REPS",
  "KEEP_LOAD",
  "INCREASE_LOAD",
  "DECREASE_LOAD",
  "HOLD_PROGRESSION",
  "RECALIBRATE",
  "PROGRESS_VARIATION",
  "REGRESS_VARIATION",
  "INCREASE_DURATION",
  "KEEP_DURATION",
  "PLATEAU_REVIEW",
  "RECOVERY_REVIEW",
  "INSUFFICIENT_DATA",
  "SAFETY_REVIEW",
] as const;

export type ProgressionAction = (typeof PROGRESSION_ACTIONS)[number];

export const PROGRESSION_REASON_CODES = [
  "REP_RANGE_NOT_MAXED",
  "TOP_RANGE_MASTERED",
  "TOP_RANGE_EASY",
  "EFFORT_TOO_HIGH",
  "NEW_LOAD_TOLERATED",
  "NEW_LOAD_NOT_TOLERATED",
  "BELOW_REP_MIN",
  "RECOVERY_HOLD",
  "SAFETY_BLOCK",
  "MISSING_EFFORT",
  "MISSING_REPS",
  "MISSING_LOAD",
  "INSUFFICIENT_HISTORY",
  "PLATEAU_SUSPECTED",
  "BODYWEIGHT_REP_CEILING",
  "DURATION_RANGE_NOT_MAXED",
  "DURATION_RANGE_MASTERED",
  "EQUIPMENT_INCREMENT_LIMITED",
  "COACH_OVERRIDE",
  "RECONDITIONING_HOLD",
  "DELOAD_HOLD",
  "PARTIAL_SESSION",
  "ONE_WEAK_SET",
  "SINGLE_SESSION_VARIANCE",
  "REPEATED_DECLINE",
  "TECHNIQUE_DEGRADED",
  "KEEP_CURRENT_SAFE_PRESCRIPTION",
  "ENGINE_ERROR",
  "CONDITIONING_DEFERRED",
  "SIDE_SPECIFIC_LOGGING_DEFERRED",
  "MANUAL_HIGH_LOAD_REJECTED",
] as const;

export type ProgressionReasonCode = (typeof PROGRESSION_REASON_CODES)[number];

export type RecoveryHoldState =
  | "NORMAL"
  | "RECOVERY_LIMITED"
  | "DELOAD_ACTIVE"
  | "PROGRESSION_HOLD";

export type NextSessionProgression = {
  exercise_external_id: string;
  action: ProgressionAction;
  current_load: number | null;
  next_load: number | null;
  current_rep_min: number | null;
  current_rep_max: number | null;
  next_rep_min: number | null;
  next_rep_max: number | null;
  current_duration_min: number | null;
  current_duration_max: number | null;
  next_duration_min: number | null;
  next_duration_max: number | null;
  reason_code: ProgressionReasonCode;
  confidence: PrescriptionConfidence;
  client_explanation: string;
  created_from_session_id: string | null;
  load_increase_eligible: boolean;
};

export type ProgressionContext = {
  externalId: string;
  exercise: ExerciseV2Metadata;
  history: ExerciseSetHistoryItem[];
  trainingLevel: ClientTrainingLevel;
  exerciseExperience?: ExerciseExperienceState;
  prescriptionState?: PrescriptionState | null;
  recoveryHold?: RecoveryHoldState;
  safetyReview?: boolean;
  techniqueDegraded?: boolean;
  goalId?: TrainingV2CanonicalGoal | null;
  requiredWorkingSets: number;
  repMin: number;
  repMax: number;
  durationMin?: number | null;
  durationMax?: number | null;
  availableIncrementKg?: number | null;
  validLoads?: number[] | null;
  coachProtected?: boolean;
  coachLoad?: number | null;
  prescribedLoad?: number | null;
};

export const PROGRESSION_ENGINE = "getNextSessionProgression" as const;
export const OBSERVATION_EXPOSURES = 4;
export const ISOLATION_RELATIVE_JUMP_LIMIT = 0.15;
export const COMPOUND_RELATIVE_JUMP_LIMIT = 0.25;
export const BODYWEIGHT_PRACTICAL_CEILING = 15;
