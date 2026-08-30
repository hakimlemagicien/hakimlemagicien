import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import { EXERCISE_POOL_MAAKFIT_V1_CORE_100 } from "@/lib/platform/strategy-matrix/core-100";
import { primaryGeneratorLocation } from "@/lib/platform/strategy-matrix/resolve-location";
import type { TrainingStrategyInput } from "@/lib/platform/strategy-matrix/types";
import {
  prepareTrainingProgramAssignment,
  type TrainingAssignmentCandidate,
} from "@/lib/platform/training-assignment-orchestrator";
import { suggestExerciseAlternatives, reviewExerciseEligibility } from "./alternatives";
import {
  analyzeDurationImpact,
  analyzeEquipmentImpact,
  analyzeExclusionImpact,
  analyzeFrequencyImpact,
  analyzeLocationImpact,
  analyzePreferredWeekdayImpact,
} from "./impact";
import { mapCoachOverrideToStrategyContext, mergeStrategyInput } from "./map-override";
import type {
  CoachOverridePayload,
  CoachOverrideRequest,
  CoachOverrideReview,
  CoachOverrideReviewStatus,
  OverrideImpactItem,
} from "./types";

export type ReviewCoachOverrideInput = {
  request: CoachOverrideRequest;
  strategyInput: TrainingStrategyInput;
  exercises: ExerciseV2Metadata[];
  currentCandidate?: TrainingAssignmentCandidate | null;
  membershipTier?: string | null;
  /** Current assignment version — mismatch → stale block. */
  currentAssignmentVersion?: string | null;
};

function exerciseById(exercises: ExerciseV2Metadata[], externalId: string) {
  return exercises.find((row) => row.external_id === externalId) ?? null;
}

function buildEligibilityContext(
  strategyInput: TrainingStrategyInput,
  mappedInput: TrainingStrategyInput,
  exercises: ExerciseV2Metadata[],
) {
  const built = prepareTrainingProgramAssignment({
    clientId: mappedInput.userId ?? "override-preview",
    strategyInput: mappedInput,
    exercises,
    assignmentMode: "ASSISTED",
  });
  const strategy = built.strategy;
  const location = strategy
    ? primaryGeneratorLocation(strategy.trainingLocation)
    : primaryGeneratorLocation("GYM");
  return {
    location,
    permittedLocations: strategy?.permittedLocations,
    availableEquipment: strategy?.availableEquipment ?? mappedInput.availableEquipment,
    trainingLevel: strategy?.trainingLevel ?? mappedInput.assessedTrainingLevel ?? "INTERMEDIATE",
    exercisePoolVersion: EXERCISE_POOL_MAAKFIT_V1_CORE_100,
    injuryIds: strategyInput.injuryIds ?? strategy?.safety.injuryIds,
    restrictedMuscles: strategy?.safety.restrictedMuscles,
    excludedExternalIds: mappedInput.excludedExternalIds,
  };
}

function resolveReviewStatus(input: {
  blockingReasons: string[];
  impacts: OverrideImpactItem[];
  alternativesCount: number;
  candidateAssignable: boolean;
}): CoachOverrideReviewStatus {
  if (
    input.blockingReasons.includes("STALE_ASSIGNMENT") ||
    input.blockingReasons.includes("SAFETY_RESTRICTION")
  ) {
    return "BLOCKED";
  }
  if (input.alternativesCount > 0 && !input.candidateAssignable) {
    return "ALTERNATIVE_RECOMMENDED";
  }
  if (input.blockingReasons.length && !input.candidateAssignable) return "BLOCKED";
  if (input.alternativesCount > 0 && input.blockingReasons.length) {
    return "ALTERNATIVE_RECOMMENDED";
  }
  const hasWarning = input.impacts.some((row) => row.severity === "WARNING");
  if (!input.candidateAssignable) return "BLOCKED";
  if (hasWarning) return "SAFE_WITH_IMPACT";
  return "SAFE";
}

/**
 * Central engine review — deterministic rules only; no LLM authority.
 */
export function reviewCoachOverride(input: ReviewCoachOverrideInput): CoachOverrideReview {
  const { request, strategyInput, exercises } = input;
  const impacts: OverrideImpactItem[] = [];
  const blockingReasons: string[] = [];
  const warnings: string[] = [];
  let alternatives: CoachOverrideReview["alternatives"] = [];
  let suggestedPayload: CoachOverridePayload | null = null;

  if (
    input.currentAssignmentVersion &&
    request.sourceAssignmentVersion &&
    input.currentAssignmentVersion !== request.sourceAssignmentVersion
  ) {
    blockingReasons.push("STALE_ASSIGNMENT");
    return {
      requestId: request.id,
      status: "BLOCKED",
      requestState: "BLOCKED",
      impacts: [
        {
          dimension: "CONTINUITY",
          severity: "BLOCKING",
          code: "STALE_ASSIGNMENT",
          detail: "تغيّر التعيين النشط منذ اقتراح التعديل.",
        },
      ],
      blockingReasons,
      warnings,
      alternatives: [],
      suggestedPayload: null,
      revisedCandidate: null,
      nutritionReviewRecommended: false,
      changeSource: "COACH_OVERRIDE",
    };
  }

  const { strategyInputPatch, strategyOverrides } = mapCoachOverrideToStrategyContext(
    request,
    strategyInput,
  );
  const mappedInput = mergeStrategyInput(strategyInput, strategyInputPatch);
  const eligibility = buildEligibilityContext(strategyInput, mappedInput, exercises);

  impacts.push(
    ...analyzeFrequencyImpact(request, strategyInput.trainingDaysPerWeek),
    ...analyzePreferredWeekdayImpact(request, strategyInput.preferredTrainingDays ?? null),
    ...analyzeDurationImpact(request, strategyInput.sessionDurationMinutes),
    ...analyzeLocationImpact(request),
    ...analyzeEquipmentImpact(request),
    ...analyzeExclusionImpact(request),
  );

  if (request.overrideType === "EXERCISE_REPLACE") {
    const { fromExternalId, toExternalId } = request.payload as {
      fromExternalId: string;
      toExternalId: string;
    };
    const source = exerciseById(exercises, fromExternalId);
    const target = exerciseById(exercises, toExternalId);
    if (!target) {
      blockingReasons.push("UNKNOWN_EXERCISE");
    } else {
      const review = reviewExerciseEligibility({ exercise: target, eligibility });
      if (!review.ok) {
        if (review.code === "SAFETY_RESTRICTION") {
          blockingReasons.push(review.code);
        }
        impacts.push({
          dimension: "SAFETY",
          severity: review.code === "SAFETY_RESTRICTION" ? "BLOCKING" : "WARNING",
          code: review.code,
          detail: `التمرين المطلوب ${toExternalId} غير مؤهل: ${review.code}`,
        });
        alternatives = suggestExerciseAlternatives({
          exercises,
          eligibility,
          sourceExercise: source,
          movementRole: source?.primary_movement_role ?? null,
          muscleFamily: source?.primary_muscles[0] ?? null,
        });
        if (alternatives[0] && review.code !== "SAFETY_RESTRICTION") {
          suggestedPayload = {
            fromExternalId,
            toExternalId: alternatives[0].external_id,
          };
        }
      } else {
        impacts.push({
          dimension: "EXERCISE_SUBSTITUTION",
          severity: "INFO",
          code: "EXERCISE_REPLACE_VALID",
          detail: `استبدال ${fromExternalId} بـ ${toExternalId} ضمن الأهلية.`,
        });
      }
    }
  }

  if (request.overrideType === "EXERCISE_LOCK") {
    const externalId = (request.payload as { externalId: string }).externalId;
    const target = exerciseById(exercises, externalId);
    if (!target) {
      blockingReasons.push("UNKNOWN_EXERCISE");
    } else {
      const review = reviewExerciseEligibility({ exercise: target, eligibility });
      if (!review.ok) {
        blockingReasons.push(review.code);
        impacts.push({
          dimension: "SAFETY",
          severity: "BLOCKING",
          code: review.code,
          detail: `لا يمكن قفل تمرين غير آمن: ${externalId}`,
        });
        alternatives = suggestExerciseAlternatives({
          exercises,
          eligibility,
          sourceExercise: target,
        });
      }
    }
  }

  const revisedCandidate = prepareTrainingProgramAssignment({
    clientId: request.clientId,
    strategyInput: mappedInput,
    exercises,
    assignmentMode: "ASSISTED",
    membershipTier: input.membershipTier,
    overrides: strategyOverrides,
    programNameAr: `برنامج معدّل · ${mappedInput.rawGoalId ?? "V2"}`,
  });

  if (!revisedCandidate.assignable) {
    for (const reason of revisedCandidate.blockingReasons) {
      if (!blockingReasons.includes(reason)) blockingReasons.push(reason);
    }
    impacts.push({
      dimension: "MOVEMENT_COVERAGE",
      severity: "BLOCKING",
      code: "PROGRAM_REGENERATION_FAILED",
      detail: "فشل إعادة توليد برنامج صالح بعد التعديل.",
    });
  }

  for (const row of impacts.filter((item) => item.severity === "WARNING")) {
    warnings.push(row.detail);
  }

  const status = resolveReviewStatus({
    blockingReasons,
    impacts,
    alternativesCount: alternatives.length,
    candidateAssignable: revisedCandidate.assignable,
  });

  const nutritionReviewRecommended =
    request.overrideType === "TRAINING_FREQUENCY_CHANGE" ||
    request.overrideType === "SESSION_DURATION_CHANGE";

  return {
    requestId: request.id,
    status,
    requestState: status === "BLOCKED" ? "BLOCKED" : "REVIEWED",
    impacts,
    blockingReasons,
    warnings,
    alternatives,
    suggestedPayload,
    revisedCandidate: status === "BLOCKED" ? null : revisedCandidate,
    nutritionReviewRecommended,
    changeSource: "COACH_OVERRIDE",
  };
}
