import type { PrescriptionConfidence } from "@/lib/platform/prescription/types";
import type { MusclePriority } from "@/lib/platform/prescription/types";
import type { TrainingV2CanonicalGoal } from "@/lib/platform/training-v2-contracts";
import type { FatigueLevel, PerformanceTrend, RecoveryCapacityState } from "@/lib/platform/volume/types";
import type { ProgressionAction } from "@/lib/platform/progression/types";

export const REGIONAL_RESPONSE_STATES = [
  "INSUFFICIENT_DATA",
  "POSITIVE_FAST",
  "POSITIVE_NORMAL",
  "POSITIVE_SLOW",
  "STAGNANT",
  "RECOVERY_LIMITED",
  "ADHERENCE_LIMITED",
  "PROGRAM_LIMITED",
] as const;

export type RegionalResponseState = (typeof REGIONAL_RESPONSE_STATES)[number];

export const GOAL_RESPONSE_STATES = [
  "ON_TRACK",
  "PARTIAL_RESPONSE",
  "REGIONAL_UNDER_RESPONSE",
  "STAGNANT_REVIEW",
  "ADHERENCE_LIMITED",
  "RECOVERY_LIMITED",
  "PROGRAM_LIMITED",
  "BODY_COMPOSITION_LIMITED",
  "NUTRITION_REVIEW_REQUIRED",
  "TRADEOFF_DETECTED",
  "SAFETY_REVIEW",
  "INSUFFICIENT_DATA",
  "COACH_REVIEW_REQUIRED",
] as const;

export type GoalResponseState = (typeof GOAL_RESPONSE_STATES)[number];

export const RESPONSE_LIMITERS = [
  "NONE",
  "INSUFFICIENT_DATA",
  "ADHERENCE",
  "RECOVERY",
  "TRAINING_VOLUME",
  "EXERCISE_SELECTION",
  "EXERCISE_PROGRESSION",
  "SCHEDULE",
  "BODY_COMPOSITION",
  "NUTRITION_REVIEW_REQUIRED",
  "SAFETY",
  "PROGRAM_STRUCTURE",
  "UNKNOWN",
] as const;

export type ResponseLimiter = (typeof RESPONSE_LIMITERS)[number];

export const GOAL_ACTIONS = [
  "KEEP_STRATEGY",
  "REALLOCATE_TRAINING_EMPHASIS",
  "HOLD_TRAINING_ADAPTATION",
  "PROGRAM_REVIEW_REQUIRED",
  "RECOVERY_REVIEW_REQUIRED",
  "BODY_COMPOSITION_REVIEW_REQUIRED",
  "NUTRITION_REVIEW_REQUIRED",
  "GOAL_TRADEOFF_REVIEW",
  "SAFETY_REVIEW",
  "INSUFFICIENT_DATA",
  "COACH_REVIEW_REQUIRED",
] as const;

export type GoalAction = (typeof GOAL_ACTIONS)[number];

export const GOAL_REASON_CODES = [
  "REGIONAL_PROGRESS_POSITIVE",
  "REGIONAL_PROGRESS_SLOW",
  "REGIONAL_STAGNATION_CONFIRMED",
  "INSUFFICIENT_REGIONAL_DATA",
  "ADHERENCE_TOO_LOW_TO_EVALUATE",
  "RECOVERY_LIMITS_RESPONSE",
  "VOLUME_ADEQUATE",
  "VOLUME_REALLOCATION_PREFERRED",
  "EXERCISE_SELECTION_LIMITS_GOAL",
  "EXERCISE_PROGRESSION_LIMITS_GOAL",
  "PROGRAM_STRUCTURE_LIMITS_GOAL",
  "BODY_COMPOSITION_LIMITS_GOAL",
  "BODY_COMPOSITION_DATA_REQUIRED",
  "NUTRITION_REVIEW_REQUIRED",
  "PROTECTED_OUTCOME_CONFLICT",
  "GOAL_TRADEOFF_DETECTED",
  "SAFETY_BLOCK",
  "POST_ADAPTATION_OBSERVATION",
  "EXERCISE_PROGRESS_NOT_GOAL_SUCCESS",
  "NO_SPOT_REDUCTION",
  "TRAINING_SIDE_POSITIVE",
  "PERFORMANCE_PRESERVED",
  "COACH_OVERRIDE_ACTIVE",
  "GOAL_UNCHANGED",
] as const;

export type GoalReasonCode = (typeof GOAL_REASON_CODES)[number];

export const EXERCISE_RESPONSE_STATES = ["POSITIVE", "STABLE", "LIMITED", "INSUFFICIENT"] as const;
export type ExerciseResponseState = (typeof EXERCISE_RESPONSE_STATES)[number];

export const BODY_TRENDS = [
  "INSUFFICIENT",
  "STABLE",
  "INCREASING",
  "DECLINING",
  "DECLINING_FAST",
] as const;
export type BodyTrend = (typeof BODY_TRENDS)[number];

export type ReallocationRequest = {
  from_region: string;
  to_region: string;
  reason: GoalReasonCode;
  priority: MusclePriority;
  confidence: PrescriptionConfidence;
};

export type RegionalResponseInput = {
  region: string;
  priority: MusclePriority | null;
  validMicrocycles: number;
  prescribedVolume: number;
  completedVolume: number;
  effectiveVolume: number;
  directPrimaryShare: number;
  performanceTrend: PerformanceTrend;
  localFatigue: FatigueLevel;
  globalRecovery: RecoveryCapacityState;
  progressionActions: ProgressionAction[];
  exerciseResponse: ExerciseResponseState;
  lastReallocationWeeksAgo?: number | null;
  safetyActive?: boolean;
};

export type RegionalResponseDecision = {
  region: string;
  response_state: RegionalResponseState;
  limiting_factor: ResponseLimiter;
  confidence: PrescriptionConfidence;
  recommended_signal: GoalAction;
  reason_code: GoalReasonCode;
  exercise_response: ExerciseResponseState;
  observation_microcycles: number;
};

export type NutritionSideInput = {
  bodyCompositionResponse?: "ON_TRACK" | "SLOW" | "ENERGY_RECOVERY_CONSTRAINT" | "ADHERENCE_LIMITED" | null;
  energyRecoveryConstraint?: boolean;
  nutritionAdherenceLimited?: boolean;
};

export type BodyCompositionInput = {
  weightTrend?: BodyTrend;
  waistTrend?: BodyTrend;
  hipTrend?: BodyTrend;
  armTrend?: BodyTrend;
  photosPresent?: boolean;
};

export type GoalResponseInput = {
  goalId: string | null;
  regions: RegionalResponseDecision[];
  globalRecovery: RecoveryCapacityState;
  adherenceShare: number;
  safetyActive?: boolean;
  coachProtected?: boolean;
  lastGoalAction?: GoalAction | null;
  lastGoalActionWeeksAgo?: number | null;
  body?: BodyCompositionInput;
  nutrition?: NutritionSideInput | null;
  previousGoalId?: string | null;
};

export type GoalResponseDecision = {
  goal_id: TrainingV2CanonicalGoal | null;
  goal_response: GoalResponseState;
  action: GoalAction;
  limiting_factor: ResponseLimiter;
  reason_code: GoalReasonCode;
  confidence: PrescriptionConfidence;
  training_confidence: PrescriptionConfidence;
  full_goal_confidence: PrescriptionConfidence;
  regional_responses: RegionalResponseDecision[];
  reallocation: ReallocationRequest | null;
  protected_outcome_conflict: boolean;
  body_composition_review_required: boolean;
  nutrition_review_required: boolean;
  body_composition_data_required: boolean;
  nutrition_contract_status: "OPTIONAL_INPUTS" | "PENDING_SHARED_CONTRACT";
  training_demand: "LOW" | "NORMAL" | "HIGH";
  recovery_state: RecoveryCapacityState;
  client_explanation: string;
  goal_id_unchanged: true;
};

export const MIN_MICROCYCLES_FOR_SPEED = 2;
export const MIN_MICROCYCLES_FOR_STAGNANT = 3;
export const ADHERENCE_JUDGE_MIN = 0.75;
export const DIRECT_COVERAGE_MIN = 0.35;
export const GOAL_INTELLIGENCE_ENGINE = "evaluateGoalResponse" as const;
export const REGIONAL_RESPONSE_ENGINE = "evaluateRegionalResponse" as const;
