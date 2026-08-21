import type {
  ClientTrainingLevel,
  TrainingV2CanonicalGoal,
  TrainingV2Effort,
} from "@/lib/platform/training-v2-contracts";
import type {
  ExerciseV2Metadata,
  MuscleContributionRole,
} from "@/lib/platform/exercise-library-v2";
import type { MusclePriority, PrescriptionConfidence } from "@/lib/platform/prescription/types";
import type { RecoveryHoldState } from "@/lib/platform/progression/types";
import type { ProgressionAction } from "@/lib/platform/progression/types";

export const VOLUME_ACTIONS = [
  "KEEP_VOLUME",
  "ADD_SMALL_VOLUME",
  "REDUCE_VOLUME",
  "REALLOCATE_VOLUME",
  "HOLD_VOLUME_PROGRESSION",
  "DELOAD_REVIEW",
  "RECONDITIONING",
  "INSUFFICIENT_DATA",
  "SAFETY_REVIEW",
] as const;

export type VolumeAction = (typeof VOLUME_ACTIONS)[number];

export const VOLUME_REASON_CODES = [
  "CURRENT_VOLUME_PRODUCTIVE",
  "PRIMARY_REGION_UNDERDOSED_REVIEW",
  "RECOVERY_CAPACITY_AVAILABLE",
  "RECOVERY_LIMITED",
  "COMPLETION_TOO_LOW",
  "PERFORMANCE_DECLINING",
  "LOCAL_FATIGUE_HIGH",
  "GLOBAL_FATIGUE_HIGH",
  "CONDITIONING_INTERFERENCE",
  "REST_PATTERN_REVIEW",
  "DELOAD_PATTERN_DETECTED",
  "RECONDITIONING_ACTIVE",
  "INSUFFICIENT_DATA",
  "SAFETY_BLOCK",
  "REALLOCATION_PREFERRED",
  "MAINTENANCE_VOLUME_SUFFICIENT",
  "COACH_OVERRIDE_ACTIVE",
  "LOAD_INCREASE_OBSERVATION",
  "VOLUME_COOLDOWN",
  "EXERCISE_VOLUME_METADATA_REQUIRED",
  "VOLUME_CEILING_REACHED",
  "ONE_HARD_SESSION",
  "FAT_LOSS_KEEP_PERFORMANCE",
] as const;

export type VolumeReasonCode = (typeof VOLUME_REASON_CODES)[number];

export type RecoveryCapacityState = "GOOD" | "NORMAL" | "LIMITED" | "POOR" | "INSUFFICIENT_DATA";

export type FatigueLevel = "NONE" | "ELEVATED" | "HIGH";

export type PerformanceTrend = "IMPROVING" | "STABLE" | "DECLINING" | "INSUFFICIENT";

export type ContinuityState = "NORMAL" | "INTERRUPTED" | "RECONDITIONING_REQUIRED";

export type NutritionTrainingSignal = "NONE" | "TRAINING_DEMAND_NORMAL" | "RECOVERY_LIMITED";

/** Phase 3 contribution roles → conservative internal weights. Not a universal 0.5 for every secondary muscle. */
export const CONTRIBUTION_WEIGHT: Record<MuscleContributionRole, number> = {
  DIRECT_PRIMARY: 1,
  DIRECT_SECONDARY: 0.5,
  INDIRECT_MEANINGFUL: 0.25,
  MINOR_STABILIZER: 0,
};

export const OBSERVATION_WEEKS = 2;
export const ADD_VOLUME_DELTA = 1;
export const REDUCE_VOLUME_DELTA = -1;

export type VolumeSetInput = {
  weekKey: string;
  sessionDate: string;
  sessionId?: string | null;
  externalId: string;
  setType: "WARMUP" | "WORKING" | "RAMP" | "BACKOFF" | "TOP" | null;
  skipped: boolean;
  setCompleted: boolean;
  cancelled?: boolean;
  effortV2?: TrainingV2Effort | null;
  actualReps?: number | null;
  actualLoad?: number | null;
  prescribedRestSeconds?: number | null;
  actualRestSeconds?: number | null;
};

export type PrescribedVolumeInput = {
  weekKey: string;
  externalId: string;
  workingSets: number;
};

export type ReadinessSlice = {
  localDate: string;
  energy?: "low" | "medium" | "high";
  sleep?: "poor" | "fair" | "good";
  body?: "good" | "fatigued" | "pain";
};

export type LastVolumeAction = {
  action: VolumeAction;
  validWeeksAgo: number;
};

export type WeeklyVolumeContext = {
  goalId: string | null;
  trainingLevel: ClientTrainingLevel;
  exercises: Record<string, ExerciseV2Metadata>;
  sets: VolumeSetInput[];
  prescribed: PrescribedVolumeInput[];
  coachProtected?: boolean;
  safetyRegions?: string[];
  continuityState?: ContinuityState;
  reconditioningActive?: boolean;
  deloadActive?: boolean;
  recentLoadIncrease?: boolean;
  lastVolumeAction?: LastVolumeAction | null;
  readiness?: ReadinessSlice[];
  recentProgressionActions?: ProgressionAction[];
  /** Phase 9 goal-level reallocation hint. Does not add total program volume. */
  goalReallocationRequest?: { from_region: string; to_region: string } | null;
};

export type RegionVolumeState = {
  region: string;
  priority: MusclePriority | null;
  prescribed_volume: number;
  completed_volume: number;
  effective_volume: number;
  physical_set_count: number;
  performance_trend: PerformanceTrend;
  local_fatigue: FatigueLevel;
  volume_action: VolumeAction;
  recommended_delta: number;
  reason_code: VolumeReasonCode;
  confidence: PrescriptionConfidence;
};

export type WeeklyVolumeDecision = {
  goal_profile: TrainingV2CanonicalGoal | null;
  recovery_state: RecoveryCapacityState;
  recovery_hold: RecoveryHoldState;
  global_fatigue: FatigueLevel;
  conditioning_interference: boolean;
  observation_required: boolean;
  coach_override_state: boolean;
  nutrition_signal: NutritionTrainingSignal;
  physical_set_count: number;
  regions: RegionVolumeState[];
  program_action: VolumeAction;
  recommended_delta: number;
  reason_code: VolumeReasonCode;
  confidence: PrescriptionConfidence;
  metadata_gaps: string[];
};

export const VOLUME_ENGINE = "getWeeklyVolumeDecision" as const;
export const PHASE_7_VOLUME_ENGINE = "src/lib/platform/volume" as const;
