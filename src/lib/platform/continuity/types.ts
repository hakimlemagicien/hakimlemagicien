import type { PrescriptionConfidence } from "@/lib/platform/prescription/types";
import type { RecoveryCapacityState } from "@/lib/platform/volume/types";
import type { WorkoutSessionStatus } from "@/lib/platform/training-v2-contracts";

export const CONTINUITY_ACTIONS = [
  "CONTINUE_SEQUENCE",
  "RESUME_SESSION",
  "ADVANCE_AFTER_PARTIAL",
  "REPEAT_PRIORITY_SESSION",
  "RESCHEDULE_SESSION",
  "DEFER_SESSION",
  "SWAP_SESSION_ORDER",
  "ENTER_RECONDITIONING",
  "RECALIBRATION_REQUIRED",
  "SCHEDULE_REVIEW_REQUIRED",
  "PROGRAM_REVIEW_REQUIRED",
  "INSUFFICIENT_DATA",
  "SAFETY_REVIEW",
] as const;

export type ContinuityAction = (typeof CONTINUITY_ACTIONS)[number];

export const CONTINUITY_REASON_CODES = [
  "NORMAL_SEQUENCE",
  "ACTIVE_SESSION_RESUME",
  "PARTIAL_PRIMARY_COMPLETE",
  "PARTIAL_PRIMARY_MISSED",
  "SESSION_MISSED",
  "SESSION_RESCHEDULED",
  "RECOVERY_CONFLICT",
  "LOCAL_FATIGUE_CONFLICT",
  "BACK_TO_BACK_ALLOWED",
  "BACK_TO_BACK_DEFERRED",
  "SHORT_BREAK_RETURN",
  "LONG_BREAK_RETURN",
  "RECONDITIONING_REQUIRED",
  "SCHEDULE_CAPACITY_MISMATCH",
  "PROGRAM_DURATION_MISMATCH",
  "PENDING_SYNC",
  "COACH_PROGRAM_CHANGE",
  "GOAL_CHANGE",
  "INSUFFICIENT_DATA",
  "SAFETY_BLOCK",
  "STALE_ACTIVE_SESSION",
  "USER_SKIPPED",
  "COACH_CANCELLED",
  "NO_VOLUME_DEBT",
] as const;

export type ContinuityReasonCode = (typeof CONTINUITY_REASON_CODES)[number];

export type SkipAttribution = "USER_SKIP" | "COACH_CANCEL" | "SYSTEM" | null;

export type SessionDemand = "LOW" | "MODERATE" | "HIGH";

export type ContinuityProgramDay = {
  programDayId: string;
  sequenceIndex: number;
  dayNumber: number;
  dayType: "workout" | "rest" | "active_recovery" | string;
  title: string;
  primaryRegions: string[];
  exercises: Array<{
    externalId: string;
    prescribedSets: number;
    priority: "PRIMARY" | "IMPORTANT" | "SUPPORT" | "OPTIONAL";
  }>;
  estimatedMinutes: number | null;
  demand: SessionDemand;
};

export type ContinuityExerciseResult = {
  externalId: string;
  prescribedSets: number;
  completedWorkingSets: number;
  warmupOnly?: boolean;
};

export type ContinuitySessionFact = {
  id: string;
  assignmentId: string | null;
  programDayId: string | null;
  status: WorkoutSessionStatus;
  sessionDate: string;
  startedAt: string | null;
  lastActivityAt: string;
  completedAt: string | null;
  prescribedWorkingSets: number | null;
  completedWorkingSets: number | null;
  prescribedExercises: number | null;
  completedExercises: number | null;
  meaningfulWorkingExposure: boolean;
  skipAttribution?: SkipAttribution;
  pendingSync?: boolean;
  exercises?: ContinuityExerciseResult[];
};

export type ContinuityContext = {
  assignmentId: string | null;
  assignmentStatus: string | null;
  timezone: string;
  now: Date;
  days: ContinuityProgramDay[];
  sessions: ContinuitySessionFact[];
  daysPerWeek: number | null;
  lastCompletedAt?: string | null;
  recoveryState?: RecoveryCapacityState;
  localFatigueRegions?: string[];
  safetyActive?: boolean;
  pendingSync?: boolean;
  recentSwapCount?: number;
  trainingLevel?: "UNASSESSED" | "BEGINNER" | "INTERMEDIATE";
  previousAssignmentId?: string | null;
  goalChanged?: boolean;
};

export type AdherenceMetrics = {
  sessions_prescribed: number;
  sessions_completed: number;
  sessions_partial: number;
  sessions_missed: number;
  working_sets_prescribed: number;
  working_sets_completed: number;
};

export type ContinuityDecision = {
  action: ContinuityAction;
  next_program_day_id: string | null;
  current_sequence_position: number | null;
  effective_date: string;
  original_scheduled_date: string | null;
  previous_session_state: WorkoutSessionStatus | "MISSED" | "RESCHEDULED" | "NONE";
  recommended_session_status: WorkoutSessionStatus | null;
  resume_session_id: string | null;
  reconditioning_state: boolean;
  recalibration_required: boolean;
  schedule_review_required: boolean;
  prescription_state: "NORMAL" | "RECONDITIONING" | null;
  hold_progression: boolean;
  hold_volume: boolean;
  reason_code: ContinuityReasonCode;
  confidence: PrescriptionConfidence;
  client_explanation: string;
  adherence: AdherenceMetrics;
  swapped_with_day_id: string | null;
};

export const CONTINUITY_ENGINE = "getProgramContinuityDecision" as const;
export const RESUME_MAX_HOURS = 18;
export const STALE_ACTIVE_HOURS = 36;
export const SHORT_BREAK_MAX_MISSED = 2;
export const SHORT_BREAK_MAX_DAYS = 4;
