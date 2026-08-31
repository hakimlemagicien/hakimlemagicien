import type { TrainingV2CanonicalGoal } from "@/lib/platform/training-v2-contracts";
import type { GoalAction, GoalReasonCode, GoalResponseState, ResponseLimiter } from "@/lib/platform/goal-intelligence/types";
import type { ProgressionAction, ProgressionReasonCode } from "@/lib/platform/progression/types";
import type { VolumeAction, VolumeReasonCode, RecoveryCapacityState } from "@/lib/platform/volume/types";
import type { ContinuityAction, ContinuityReasonCode, AdherenceMetrics } from "@/lib/platform/continuity/types";
import type { GenerationReasonCode } from "@/lib/platform/program-generation/types";
import type { PrescriptionConfidence } from "@/lib/platform/prescription/types";

export const TRAINING_PROGRESS_ENGINE = "getClientTrainingProgressSummary" as const;
export const TRAINING_PROGRESS_VERSION = "v2-phase11-1" as const;

export const CLIENT_GOAL_TONES = ["neutral", "positive", "caution"] as const;
export type ClientGoalTone = (typeof CLIENT_GOAL_TONES)[number];

export type ClientExplanation = {
  title: string;
  short_reason: string;
  client_action: string;
  optional_detail?: string;
  importance: "low" | "normal" | "high";
  date?: string;
};

export type ExerciseTrendCard = {
  external_id: string;
  name_ar: string;
  kind: "load" | "reps" | "duration" | "bodyweight_reps";
  from_label: string;
  to_label: string;
  improved: boolean;
  action: ProgressionAction | null;
  explanation: ClientExplanation;
};

export type RegionalProgressCard = {
  region: string;
  label_ar: string;
  summary: string;
};

export type ConsistencyCard = {
  completed: number;
  prescribed: number;
  partial: number;
  missed: number;
  summary: string;
};

export type ReviewFlag = {
  code: string;
  severity: "safety" | "high" | "normal";
  label_ar: string;
  open: boolean;
};

export type DecisionTrace = {
  engine: string;
  engine_version: string;
  action: string;
  reason_code: string;
  confidence: PrescriptionConfidence | null;
  object_type: string;
  object_id: string | null;
  source_session_id: string | null;
  program_version: number | null;
  input_summary: Record<string, string | number | boolean | null>;
  client_visible: boolean;
  coach_visible: boolean;
  qa_visible: boolean;
};

export type TrainingNotificationKind =
  | "UPCOMING_SESSION"
  | "RESCHEDULED_SESSION"
  | "RESUME_SESSION"
  | "MISSED_SESSION_UPDATE"
  | "RECONDITIONING_START"
  | "MATERIAL_PROGRAM_UPDATE"
  | "GOAL_PERFORMANCE_UPDATE";

export type TrainingNotificationCandidate = {
  kind: TrainingNotificationKind;
  title: string;
  body: string;
  href: string;
  dedupe_key: string;
  cancel_keys: string[];
  local_date: string;
  deliver_in_app: boolean;
  deliver_push: boolean;
};

export type TrainingProgressInput = {
  goalId: string | null;
  trainingLevel?: string | null;
  goalDecision?: {
    goal_response: GoalResponseState;
    action: GoalAction;
    reason_code: GoalReasonCode;
    limiting_factor: ResponseLimiter;
    client_explanation: string;
    reallocation?: { from_region: string; to_region: string } | null;
    nutrition_review_required?: boolean;
    body_composition_review_required?: boolean;
    body_composition_data_required?: boolean;
    nutrition_contract_status?: "OPTIONAL_INPUTS" | "PENDING_SHARED_CONTRACT";
  } | null;
  regionalDecisions?: Array<{ region: string; response_state: string; limiting_factor?: string }>;
  volumeDecision?: {
    action: VolumeAction;
    reason_code: VolumeReasonCode;
    recovery_state: RecoveryCapacityState;
  } | null;
  continuity?: {
    action: ContinuityAction;
    reason_code: ContinuityReasonCode;
    effective_date: string;
    original_scheduled_date: string | null;
    next_program_day_id: string | null;
    resume_session_id: string | null;
    reconditioning_state: boolean;
    client_explanation: string;
    adherence: AdherenceMetrics;
    previous_session_state: string;
    recommended_session_status: string | null;
  } | null;
  progressionSamples?: Array<{
    external_id: string;
    name_ar: string;
    action: ProgressionAction | null;
    reason_code: ProgressionReasonCode;
    from_load: number | null;
    to_load: number | null;
    from_reps: number | null;
    to_reps: number | null;
    from_duration: number | null;
    to_duration: number | null;
    is_bodyweight?: boolean;
  }>;
  programChange?: {
    material: boolean;
    reason: GenerationReasonCode | string;
    added: string[];
    removed: string[];
    version: number;
  } | null;
  bodyTrends?: {
    weight_trend?: string | null;
    waist_trend?: string | null;
    hip_trend?: string | null;
    has_valid_weight?: boolean;
    has_valid_waist?: boolean;
  } | null;
  loadError?: boolean;
};

export type ClientTrainingProgressSummary = {
  version: string;
  empty: boolean;
  load_error: boolean;
  canonical_goal: TrainingV2CanonicalGoal | null;
  goal_card: ClientExplanation & { tone: ClientGoalTone; status_key: string };
  exercise_trends: ExerciseTrendCard[];
  regional_cards: RegionalProgressCard[];
  body_card: { title: string; summary: string; show: boolean } | null;
  consistency: ConsistencyCard | null;
  recovery: ClientExplanation | null;
  adaptations: ClientExplanation[];
  nutrition_review: ClientExplanation | null;
  review_flags: ReviewFlag[];
  forbidden_tokens: string[];
};

export type HealthMetricId =
  | "v2_session_usage"
  | "set_actual_reps_coverage"
  | "set_effort_coverage"
  | "v2_eligible_exercise_coverage"
  | "insufficient_data_rate"
  | "legacy_fallback_rate"
  | "progression_decision_rate"
  | "volume_adaptation_rate"
  | "recovery_hold_rate"
  | "program_validation_failure_rate"
  | "program_generation_block_rate"
  | "set_sync_failure_rate"
  | "continuity_reschedule_rate";
