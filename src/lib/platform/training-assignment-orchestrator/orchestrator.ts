import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import {
  assignmentPayloadFromResult,
  generateAuthorizedProgramCandidate,
} from "@/lib/platform/client-loop/assignment";
import {
  buildProgramGenerationContextFromProfile,
  resolveWeeklyTrainingSchedule,
} from "@/lib/platform/strategy-matrix";
import type {
  StrategyResolutionOverrides,
  TrainingStrategyInput,
} from "@/lib/platform/strategy-matrix/types";
import { evaluateAutomaticAssignmentEligibility } from "./eligibility";
import { buildAssignmentRecommendation } from "./recommendation";
import type {
  AssignmentCandidateState,
  AssignmentMode,
  CoachReviewSummary,
  TrainingAssignmentCandidate,
} from "./types";

export type PrepareTrainingProgramAssignmentInput = {
  clientId: string;
  strategyInput: TrainingStrategyInput;
  exercises: ExerciseV2Metadata[];
  assignmentMode?: AssignmentMode;
  overrides?: StrategyResolutionOverrides;
  membershipTier?: string | null;
  /** V1 default: automated assignment capability exists but is not globally enabled. */
  automatedGloballyDisabled?: boolean;
  programNameAr?: string;
  /** When regenerating, pass prior fingerprint to detect stale context. */
  priorContextFingerprint?: string | null;
};

const LOCATION_LABELS: Record<string, string> = {
  GYM: "نادي",
  HOME: "منزل",
  BOTH: "نادي ومنزل",
  UNKNOWN: "غير محدد",
};

export function buildStrategyContextFingerprint(
  strategy: TrainingStrategyInput,
  overrides?: StrategyResolutionOverrides,
): string {
  const payload = {
    userId: strategy.userId ?? null,
    rawGoalId: strategy.rawGoalId ?? null,
    profileGoal: strategy.profileGoal ?? null,
    gender: strategy.gender ?? null,
    assessedTrainingLevel: strategy.assessedTrainingLevel ?? null,
    trainingDaysPerWeek: overrides?.trainingDaysPerWeek ?? strategy.trainingDaysPerWeek ?? null,
    preferredTrainingDays: strategy.preferredTrainingDays ?? null,
    sessionDurationMinutes:
      overrides?.sessionDurationMinutes ?? strategy.sessionDurationMinutes ?? null,
    trainingEnvironment: strategy.trainingEnvironment ?? null,
    trainingType: strategy.trainingType ?? null,
    locationPreference: strategy.locationPreference ?? null,
    availableEquipment: overrides?.availableEquipment ?? strategy.availableEquipment ?? null,
    injuryIds: strategy.injuryIds ?? null,
    lockedExternalIds: overrides?.lockedExternalIds ?? strategy.lockedExternalIds ?? null,
    excludedExternalIds: overrides?.excludedExternalIds ?? strategy.excludedExternalIds ?? null,
    coachProtected: overrides?.coachProtected ?? strategy.coachProtected ?? false,
    overrideLocation: overrides?.trainingLocation ?? null,
    overrideReason: overrides?.reason ?? null,
  };
  return JSON.stringify(payload);
}

function mainEmphasisFromSessions(
  sessions: Array<{ primary_regions: string[] }> | undefined,
): string {
  if (!sessions?.length) return "—";
  const counts = new Map<string, number>();
  for (const session of sessions) {
    for (const region of session.primary_regions) {
      counts.set(region, (counts.get(region) ?? 0) + 1);
    }
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? "—";
}

function buildCoachReviewSummary(input: {
  strategy: NonNullable<TrainingAssignmentCandidate["strategy"]>;
  generation: NonNullable<TrainingAssignmentCandidate["generation"]>;
  assignable: boolean;
  blockingReasons: string[];
}): CoachReviewSummary {
  const { strategy, generation, assignable, blockingReasons } = input;
  const restrictions: string[] = [];
  if (strategy.safety.injuryIds.length) {
    restrictions.push(`إصابات: ${strategy.safety.injuryIds.join(", ")}`);
  }
  if (strategy.safety.restrictedMuscles.length) {
    restrictions.push(`عضلات مقيّدة: ${strategy.safety.restrictedMuscles.join(", ")}`);
  }
  if (strategy.excludedExternalIds.length) {
    restrictions.push(`تمارين مستبعدة: ${strategy.excludedExternalIds.length}`);
  }

  return {
    clientGoal: strategy.canonicalGoal,
    trainingLevel: strategy.trainingLevel,
    daysPerWeek: strategy.trainingDaysPerWeek,
    trainingLocation: LOCATION_LABELS[strategy.trainingLocation] ?? strategy.trainingLocation,
    sessionCount: generation.candidate?.sessions.length ?? 0,
    mainEmphasis: mainEmphasisFromSessions(generation.candidate?.sessions),
    restrictions,
    validationStatus: generation.validation.status,
    generationStatus: generation.status,
    assignable,
    warnings: generation.validation.warnings.map((row) => row.message),
    blockingReasons,
    whyGenerated: generation.client_explanation,
  };
}

function resolveCandidateState(input: {
  assignmentMode: AssignmentMode;
  assignable: boolean;
  automationStatus: ReturnType<typeof evaluateAutomaticAssignmentEligibility>["status"];
  strategyFailed: boolean;
}): AssignmentCandidateState {
  if (input.strategyFailed || !input.assignable) return "BLOCKED";
  if (input.assignmentMode === "ASSISTED") return "REVIEW_REQUIRED";
  if (input.automationStatus === "ELIGIBLE") return "READY_TO_ASSIGN";
  if (input.automationStatus === "REVIEW_REQUIRED") return "REVIEW_REQUIRED";
  return "BLOCKED";
}

function blockedCandidate(
  partial: Partial<TrainingAssignmentCandidate> &
    Pick<TrainingAssignmentCandidate, "clientId" | "assignmentMode" | "blockingReasons">,
): TrainingAssignmentCandidate {
  return {
    state: "BLOCKED",
    provenance: null,
    weeklySchedule: null,
    strategy: null,
    generation: null,
    automationEligibility: "BLOCKED",
    automationBlockReasons: [],
    reviewRequired: false,
    assignable: false,
    recommendation: [],
    coachReview: null,
    clientExplanation: "",
    assignmentPayload: null,
    rejectionReason: null,
    ...partial,
  };
}

/**
 * Central assignment orchestration — Strategy Matrix → Calendar → Core 100 → Safety → Generate → Validate.
 * Does not persist or assign; returns a reviewable candidate for coach/system action.
 */
export function prepareTrainingProgramAssignment(
  input: PrepareTrainingProgramAssignmentInput,
): TrainingAssignmentCandidate {
  const assignmentMode = input.assignmentMode ?? "ASSISTED";
  const contextFingerprint = buildStrategyContextFingerprint(input.strategyInput, input.overrides);

  if (
    input.priorContextFingerprint &&
    input.priorContextFingerprint !== contextFingerprint
  ) {
    return blockedCandidate({
      clientId: input.clientId,
      assignmentMode,
      blockingReasons: ["STALE_STRATEGY_CONTEXT"],
      automationEligibility: "BLOCKED",
      automationBlockReasons: ["MISSING_PROFILE_DATA"],
      clientExplanation:
        "تغيّرت بيانات العميل منذ توليد المرشّح. أعد التوليد قبل التعيين.",
    });
  }

  const built = buildProgramGenerationContextFromProfile(input.strategyInput, {
    exercises: input.exercises,
    overrides: input.overrides,
  });

  if (!built.ok) {
    const strategyErrors = built.resolution.errors.map((row) => row.code);
    const automation = evaluateAutomaticAssignmentEligibility({
      assignmentMode,
      strategy: null,
      generation: null,
      assignable: false,
      blockReason: strategyErrors[0] ?? "STRATEGY_RESOLUTION_FAILED",
      strategyResolutionFailed: true,
      strategyErrors,
      automatedGloballyDisabled: input.automatedGloballyDisabled,
      membershipTier: input.membershipTier,
    });
    return blockedCandidate({
      clientId: input.clientId,
      assignmentMode,
      blockingReasons: strategyErrors,
      automationEligibility: automation.status,
      automationBlockReasons: automation.reasons,
      reviewRequired: assignmentMode === "ASSISTED" && strategyErrors.some((code) => code === "UNMAPPED_LEGACY_GOAL"),
      clientExplanation: built.resolution.errors.map((row) => row.message).join(" "),
    });
  }

  const { strategy, context } = built;
  const generated = generateAuthorizedProgramCandidate(context);
  const weeklyScheduleResult = generated.result.candidate
    ? resolveWeeklyTrainingSchedule({
        trainingDaysPerWeek: strategy.trainingDaysPerWeek,
        preferredTrainingDays: strategy.preferredTrainingDays,
        trainingLocation: strategy.trainingLocation,
        sessions: generated.result.candidate.sessions.map((session) => ({
          sequenceIndex: session.sequence_index,
          programDayId: session.program_day_id,
          role: session.role,
          title: session.title,
          primaryRegions: session.primary_regions,
        })),
      })
    : null;
  const weeklySchedule =
    weeklyScheduleResult && "days" in weeklyScheduleResult ? weeklyScheduleResult : null;

  const recommendation = buildAssignmentRecommendation(strategy, generated.result);
  const automation = evaluateAutomaticAssignmentEligibility({
    assignmentMode,
    strategy,
    generation: generated.result,
    assignable: generated.assignable,
    blockReason: generated.blockReason,
    strategyResolutionFailed: false,
    strategyErrors: [],
    automatedGloballyDisabled: input.automatedGloballyDisabled,
    membershipTier: input.membershipTier,
  });

  const blockingReasons: string[] = [];
  if (!generated.assignable) {
    blockingReasons.push(generated.blockReason ?? generated.result.validation.errors[0]?.code ?? "PROGRAM_INVALID");
  }
  if (automation.status === "BLOCKED") {
    blockingReasons.push(...automation.reasons);
  }

  const state = resolveCandidateState({
    assignmentMode,
    assignable: generated.assignable,
    automationStatus: automation.status,
    strategyFailed: false,
  });

  const assignable =
    generated.assignable &&
    (assignmentMode === "ASSISTED"
      ? state === "REVIEW_REQUIRED"
      : state === "READY_TO_ASSIGN");

  const programName =
    input.programNameAr ?? `برنامج V2 · ${strategy.canonicalGoal}`;
  const assignmentPayload = generated.assignable
    ? (assignmentPayloadFromResult(generated.result, programName) as Record<string, unknown> | null)
    : null;

  const provenance = {
    strategyVersion: strategy.strategyVersion,
    exercisePoolVersion: strategy.exercisePoolVersion,
    canonicalGoal: strategy.canonicalGoal,
    trainingLevel: strategy.trainingLevel,
    trainingDaysPerWeek: strategy.trainingDaysPerWeek,
    trainingLocation: strategy.trainingLocation,
    assignmentMode,
    injuryIds: strategy.safety.injuryIds,
    generationReason: strategy.generationReason,
    contextFingerprint,
  };

  return {
    clientId: input.clientId,
    assignmentMode,
    state,
    provenance,
    weeklySchedule,
    strategy,
    generation: generated.result,
    automationEligibility: automation.status,
    automationBlockReasons: automation.reasons,
    blockingReasons: [...new Set(blockingReasons)],
    reviewRequired: state === "REVIEW_REQUIRED",
    assignable,
    recommendation,
    coachReview: buildCoachReviewSummary({
      strategy,
      generation: generated.result,
      assignable,
      blockingReasons,
    }),
    clientExplanation: generated.result.client_explanation,
    assignmentPayload,
    rejectionReason: null,
  };
}

/** Coach rejects a candidate — does not assign or activate. */
export function rejectAssignmentCandidate(
  candidate: TrainingAssignmentCandidate,
  reason?: string,
): TrainingAssignmentCandidate {
  return {
    ...candidate,
    state: "REJECTED",
    assignable: false,
    reviewRequired: false,
    rejectionReason: reason?.trim() || "COACH_REJECTED",
  };
}

/** Coach approves an assisted candidate — transitions to ready without persisting. */
export function approveAssignmentCandidate(
  candidate: TrainingAssignmentCandidate,
): TrainingAssignmentCandidate {
  if (candidate.state === "REJECTED" || candidate.state === "BLOCKED") {
    return candidate;
  }
  if (!candidate.generation || !candidate.assignable) {
    return { ...candidate, state: "BLOCKED", assignable: false };
  }
  return {
    ...candidate,
    state: "READY_TO_ASSIGN",
    assignable: true,
    reviewRequired: false,
  };
}

/** Detect whether client strategy context changed since candidate was built. */
export function isAssignmentCandidateStale(
  candidate: TrainingAssignmentCandidate,
  currentFingerprint: string,
): boolean {
  if (!candidate.provenance?.contextFingerprint) return false;
  return candidate.provenance.contextFingerprint !== currentFingerprint;
}
