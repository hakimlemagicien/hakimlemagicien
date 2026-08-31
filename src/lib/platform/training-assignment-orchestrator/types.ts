import type { ProgramGenerationResult } from "@/lib/platform/program-generation/types";
import type { ResolvedTrainingStrategy } from "@/lib/platform/strategy-matrix/types";
import type { WeeklyTrainingSchedule } from "@/lib/platform/strategy-matrix/calendar-resolver";
import type { ExercisePoolVersion } from "@/lib/platform/strategy-matrix/core-100";
import type { TrainingStrategyVersion } from "@/lib/platform/strategy-matrix/version";

/** Explicit assignment orchestration mode — never inferred from UI state. */
export const ASSIGNMENT_MODES = ["ASSISTED", "AUTOMATED"] as const;
export type AssignmentMode = (typeof ASSIGNMENT_MODES)[number];

/** Candidate lifecycle state — distinct from program validation status. */
export const ASSIGNMENT_CANDIDATE_STATES = [
  "GENERATED",
  "REVIEW_REQUIRED",
  "READY_TO_ASSIGN",
  "ASSIGNED",
  "BLOCKED",
  "REJECTED",
] as const;
export type AssignmentCandidateState = (typeof ASSIGNMENT_CANDIDATE_STATES)[number];

export const AUTOMATION_ELIGIBILITY_STATUSES = ["ELIGIBLE", "REVIEW_REQUIRED", "BLOCKED"] as const;
export type AutomationEligibilityStatus = (typeof AUTOMATION_ELIGIBILITY_STATUSES)[number];

export const AUTOMATION_BLOCK_REASONS = [
  "UNRESOLVED_GOAL",
  "SAFETY_REVIEW_REQUIRED",
  "MISSING_PROFILE_DATA",
  "PROGRAM_INVALID",
  "UNSUPPORTED_STRATEGY",
  "CORE_100_UNAVAILABLE",
  "COACH_REVIEW_REQUIRED",
  "AUTOMATED_DISABLED",
  "FREE_ENTITLEMENT_BLOCKED",
  "FIXED_LOAD_FORBIDDEN",
  "GENERATION_BLOCKED",
] as const;
export type AutomationBlockReason = (typeof AUTOMATION_BLOCK_REASONS)[number];

export const RECOMMENDATION_CATEGORIES = [
  "GOAL_ALIGNMENT",
  "FREQUENCY_ALIGNMENT",
  "LOCATION_ALIGNMENT",
  "LEVEL_ALIGNMENT",
  "RECOVERY_ALIGNMENT",
  "SAFETY_ALIGNMENT",
  "VALIDATION_ALIGNMENT",
] as const;
export type RecommendationCategory = (typeof RECOMMENDATION_CATEGORIES)[number];

export type AssignmentRecommendationItem = {
  category: RecommendationCategory;
  aligned: boolean;
  detail: string;
};

export type AssignmentProvenance = {
  strategyVersion: TrainingStrategyVersion;
  exercisePoolVersion: ExercisePoolVersion;
  canonicalGoal: string;
  trainingLevel: string;
  trainingDaysPerWeek: number;
  trainingLocation: string;
  assignmentMode: AssignmentMode;
  injuryIds: string[];
  generationReason: string;
  contextFingerprint: string;
};

export type CoachReviewSummary = {
  clientGoal: string;
  trainingLevel: string;
  daysPerWeek: number;
  trainingLocation: string;
  sessionCount: number;
  mainEmphasis: string;
  restrictions: string[];
  validationStatus: string;
  generationStatus: string;
  assignable: boolean;
  warnings: string[];
  blockingReasons: string[];
  whyGenerated: string;
};

export type CoachAssignmentAction = "APPROVE_AND_ASSIGN" | "REGENERATE" | "REJECT";

export type TrainingAssignmentCandidate = {
  clientId: string;
  assignmentMode: AssignmentMode;
  state: AssignmentCandidateState;
  provenance: AssignmentProvenance | null;
  weeklySchedule: WeeklyTrainingSchedule | null;
  strategy: ResolvedTrainingStrategy | null;
  generation: ProgramGenerationResult | null;
  automationEligibility: AutomationEligibilityStatus;
  automationBlockReasons: AutomationBlockReason[];
  blockingReasons: string[];
  reviewRequired: boolean;
  assignable: boolean;
  recommendation: AssignmentRecommendationItem[];
  coachReview: CoachReviewSummary | null;
  clientExplanation: string;
  assignmentPayload: Record<string, unknown> | null;
  rejectionReason: string | null;
};
