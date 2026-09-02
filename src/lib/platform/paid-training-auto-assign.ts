import { assignmentPayloadFromResult } from "@/lib/platform/client-loop/assignment";
import { listV2ExerciseCandidates } from "@/lib/platform/exercise-library-v2-api";
import { prepareTrainingProgramAssignment } from "@/lib/platform/training-assignment-orchestrator";
import {
  clientAssignGeneratedV2Program,
  clientRecordProgramReviewRequired,
} from "@/lib/platform/client-training-assign-api";
import { loadClientTrainingStrategyInput } from "@/lib/platform/client-training-strategy-input";

export type PaidTrainingAutoAssignResult =
  | { status: "assigned"; assignmentId: string | null }
  | { status: "review_required"; reasonCode: string }
  | { status: "blocked"; reasonCode: string }
  | { status: "skipped"; reason: "no_profile" | "already_assigned" | "not_entitled" };

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * V1 paid auto-assign: Strategy Matrix → Generate → Validate → Assign (normal cases).
 * Exception cases → PROGRAM_VALIDATION_BLOCKED for coach review — no generic fallback.
 */
export async function runPaidTrainingAutoAssignment(input: {
  userId: string;
  membershipTier: string;
  hasWorkoutProgram: boolean;
  runtimeReason?: string | null;
}): Promise<PaidTrainingAutoAssignResult> {
  if (!input.hasWorkoutProgram) {
    return { status: "skipped", reason: "not_entitled" };
  }
  if (input.runtimeReason === "ok") {
    return { status: "skipped", reason: "already_assigned" };
  }

  const strategyInput = await loadClientTrainingStrategyInput(input.userId);
  if (!strategyInput) {
    return { status: "blocked", reasonCode: "MISSING_PROFILE_DATA" };
  }

  const exercises = await listV2ExerciseCandidates();
  const candidate = prepareTrainingProgramAssignment({
    clientId: input.userId,
    strategyInput,
    exercises,
    assignmentMode: "AUTOMATED",
    membershipTier: input.membershipTier,
    automatedGloballyDisabled: false,
    programNameAr: "برنامجك الشخصي",
  });

  const evaluationKey = `auto-assign:${input.userId}:${todayIsoDate()}`;

  if (candidate.assignable && candidate.assignmentPayload) {
    const payload = candidate.assignmentPayload as Record<string, unknown>;
    const generationStatus = candidate.generation?.status ?? "PROGRAM_GENERATION_BLOCKED";
    const validationStatus = candidate.generation?.validation.status ?? "INVALID";

    await clientAssignGeneratedV2Program({
      startsOn: todayIsoDate(),
      replace: input.runtimeReason === "legacy_incomplete",
      generationStatus,
      validationStatus,
      payload,
    });

    return {
      status: "assigned",
      assignmentId: null,
    };
  }

  const reasonCode =
    candidate.blockingReasons[0] ??
    candidate.automationBlockReasons[0] ??
    candidate.generation?.validation.errors[0]?.code ??
    "PROGRAM_REVIEW_REQUIRED";

  await clientRecordProgramReviewRequired({
    evaluationKey,
    reasonCode,
    snapshot: {
      state: candidate.state,
      automation_eligibility: candidate.automationEligibility,
      automation_block_reasons: candidate.automationBlockReasons,
      blocking_reasons: candidate.blockingReasons,
      generation_status: candidate.generation?.status ?? null,
      validation_status: candidate.generation?.validation.status ?? null,
      validation_errors: candidate.generation?.validation.errors.map((row) => row.code) ?? [],
    },
  });

  if (candidate.state === "REVIEW_REQUIRED" || candidate.automationEligibility === "REVIEW_REQUIRED") {
    return { status: "review_required", reasonCode };
  }

  return { status: "blocked", reasonCode };
}
