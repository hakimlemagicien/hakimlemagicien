import type { ClientTrainingLevel } from "@/lib/platform/training-v2-contracts";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import type {
  ContinuityState,
  LastVolumeAction,
  PrescribedVolumeInput,
  VolumeAction,
  VolumeSetInput,
  WeeklyVolumeDecision,
} from "@/lib/platform/volume/types";
import type {
  BodyCompositionInput,
  GoalAction,
  GoalResponseDecision,
  NutritionSideInput,
} from "@/lib/platform/goal-intelligence/types";

export const CLIENT_LOOP_VOLUME_DECISION = "WEEKLY_VOLUME" as const;
export const CLIENT_LOOP_GOAL_DECISION = "GOAL_RESPONSE" as const;
export const CLIENT_LOOP_PROGRAM_DECISION = "PROGRAM_GENERATION" as const;
export const CLIENT_LOOP_PROGRAM_BLOCKED = "PROGRAM_VALIDATION_BLOCKED" as const;

export const PROGRAM_ADAPTATION_ACTIONS: GoalAction[] = [
  "REALLOCATE_TRAINING_EMPHASIS",
  "PROGRAM_REVIEW_REQUIRED",
];

export const VOLUME_BLOCKS_ADAPTATION: VolumeAction[] = [
  "DELOAD_REVIEW",
  "RECONDITIONING",
  "SAFETY_REVIEW",
  "HOLD_VOLUME_PROGRESSION",
  "REDUCE_VOLUME",
];

export type LoopEvidence = {
  goalId: string | null;
  trainingLevel: ClientTrainingLevel;
  assignmentId: string | null;
  programVersion: number | null;
  evaluationDate: string;
  exercises: Record<string, ExerciseV2Metadata>;
  sets: VolumeSetInput[];
  prescribed: PrescribedVolumeInput[];
  continuityState?: ContinuityState;
  reconditioningActive?: boolean;
  lastVolumeAction?: LastVolumeAction | null;
  lastGoalAction?: GoalAction | null;
  lastGoalActionWeeksAgo?: number | null;
  body?: BodyCompositionInput;
  nutrition?: NutritionSideInput | null;
  safetyActive?: boolean;
  coachProtected?: boolean;
  activeWorkoutInProgress?: boolean;
};

export type ClientLoopEvaluation = {
  volume: WeeklyVolumeDecision;
  goal: GoalResponseDecision;
  volume_evaluation_key: string;
  goal_evaluation_key: string;
  evaluation_week: string;
  assignment_id: string | null;
  program_version: number | null;
  program_adaptation_justified: boolean;
  program_adaptation_blocked_reason: string | null;
};

export type PersistedAdaptiveDecision = {
  id: string;
  decision_type: string;
  evaluation_key: string;
  reason_code: string | null;
  confidence: string | null;
  input_snapshot: Record<string, unknown>;
  assignment_id: string | null;
  program_version: number | null;
  created_at: string;
};

export type VolumeProgressView = {
  program_action: VolumeAction;
  reason_code: string;
  recovery_state: string;
  recommended_delta: number;
  physical_set_count: number;
  observation_required: boolean;
  regions: Array<{
    region: string;
    volume_action: VolumeAction;
    reason_code: string;
    prescribed_volume: number;
    completed_volume: number;
    performance_trend: string;
    local_fatigue: string;
  }>;
};

export type GoalProgressView = {
  goal_id: string | null;
  goal_response: GoalResponseDecision["goal_response"];
  action: GoalAction;
  limiter: GoalResponseDecision["limiting_factor"];
  reason_code: string;
  confidence: GoalResponseDecision["confidence"];
  client_explanation: string;
  reallocation: GoalResponseDecision["reallocation"];
  nutrition_review_required: boolean;
  body_composition_review_required: boolean;
  regional_responses: Array<{
    region: string;
    response_state: string;
    reason_code: string;
  }>;
};
