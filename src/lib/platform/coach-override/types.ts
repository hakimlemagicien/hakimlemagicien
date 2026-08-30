import type { PreferredWeekdayId } from "@/lib/platform/strategy-matrix/weekdays";
import type { TrainingStrategyLocation } from "@/lib/platform/strategy-matrix/types";
import type { TrainingAssignmentCandidate } from "@/lib/platform/training-assignment-orchestrator";

export const COACH_OVERRIDE_TYPES = [
  "TRAINING_DAYS_CHANGE",
  "PREFERRED_WEEKDAYS_CHANGE",
  "SESSION_DURATION_CHANGE",
  "EXERCISE_REPLACE",
  "EXERCISE_EXCLUDE",
  "EXERCISE_LOCK",
  "TRAINING_LOCATION_CHANGE",
  "AVAILABLE_EQUIPMENT_CHANGE",
  "TRAINING_FREQUENCY_CHANGE",
  "TEMPORARY_CONSTRAINT",
] as const;

export type CoachOverrideType = (typeof COACH_OVERRIDE_TYPES)[number];

export const COACH_OVERRIDE_SOURCES = ["COACH_ADMIN", "CLIENT_REQUEST"] as const;
export type CoachOverrideSource = (typeof COACH_OVERRIDE_SOURCES)[number];

export const COACH_OVERRIDE_REVIEW_STATUSES = [
  "SAFE",
  "SAFE_WITH_IMPACT",
  "ALTERNATIVE_RECOMMENDED",
  "BLOCKED",
] as const;

export type CoachOverrideReviewStatus = (typeof COACH_OVERRIDE_REVIEW_STATUSES)[number];

export const COACH_OVERRIDE_REQUEST_STATES = [
  "PROPOSED",
  "REVIEWED",
  "CONFIRMED",
  "APPLIED",
  "REJECTED",
  "BLOCKED",
] as const;

export type CoachOverrideRequestState = (typeof COACH_OVERRIDE_REQUEST_STATES)[number];

export const OVERRIDE_IMPACT_DIMENSIONS = [
  "WEEKLY_FREQUENCY",
  "RECOVERY_SPACING",
  "MOVEMENT_COVERAGE",
  "MUSCLE_COVERAGE",
  "GOAL_EMPHASIS",
  "SESSION_DURATION",
  "EQUIPMENT_ELIGIBILITY",
  "LOCATION_ELIGIBILITY",
  "EXERCISE_SUBSTITUTION",
  "SAFETY",
  "TOTAL_VOLUME",
  "CONTINUITY",
  "NUTRITION_REVIEW",
] as const;

export type OverrideImpactDimension = (typeof OVERRIDE_IMPACT_DIMENSIONS)[number];

export type OverrideImpactItem = {
  dimension: OverrideImpactDimension;
  severity: "INFO" | "WARNING" | "BLOCKING";
  code: string;
  detail: string;
};

export type TemporaryConstraintPayload = {
  trainingEnvironment?: "home" | "gym" | "anywhere";
  availableEquipment?: string[] | null;
  validUntil?: string | null;
};

export type CoachOverridePayload =
  | { trainingDaysPerWeek: number }
  | { preferredWeekdays: PreferredWeekdayId[] }
  | { sessionDurationMinutes: number }
  | { fromExternalId: string; toExternalId: string; sessionIndex?: number }
  | { externalId: string }
  | { trainingLocation: TrainingStrategyLocation }
  | { availableEquipment: string[] | null }
  | TemporaryConstraintPayload;

export type CoachOverrideRequest = {
  id: string;
  clientId: string;
  currentAssignmentId: string;
  overrideType: CoachOverrideType;
  payload: CoachOverridePayload;
  source: CoachOverrideSource;
  coachNote?: string | null;
  proposedAt: string;
  /** Assignment `updated_at` or fingerprint when proposed — stale detection. */
  sourceAssignmentVersion?: string | null;
};

export type ExerciseAlternative = {
  external_id: string;
  name_ar: string;
  reason: string;
};

export type CoachOverrideReview = {
  requestId: string;
  status: CoachOverrideReviewStatus;
  requestState: CoachOverrideRequestState;
  impacts: OverrideImpactItem[];
  blockingReasons: string[];
  warnings: string[];
  alternatives: ExerciseAlternative[];
  suggestedPayload?: CoachOverridePayload | null;
  revisedCandidate: TrainingAssignmentCandidate | null;
  nutritionReviewRecommended: boolean;
  changeSource: "COACH_OVERRIDE";
};

export type CoachOverrideProvenance = {
  overrideType: CoachOverrideType;
  overrideRequestId: string;
  reviewStatus: CoachOverrideReviewStatus;
  sourceAssignmentId: string;
  impactCodes: string[];
  coachNote: string | null;
  appliedAt: string;
};
