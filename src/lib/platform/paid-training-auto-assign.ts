import { listV2ExerciseCandidates } from "@/lib/platform/exercise-library-v2-api";
import { prepareTrainingProgramAssignment } from "@/lib/platform/training-assignment-orchestrator";
import {
  clientAssignGeneratedV2Program,
  clientRecordProgramReviewRequired,
} from "@/lib/platform/client-training-assign-api";
import { loadClientTrainingStrategyInput } from "@/lib/platform/client-training-strategy-input";
import { supabase } from "@/integrations/supabase/client";
import {
  applyTrainingAssignmentDecision,
  resolveDecisionForClient,
  nextSafeStartsOn,
} from "@/lib/platform/training-auto-assign";

export type PaidTrainingAutoAssignResult =
  | { status: "assigned"; assignmentId: string | null; path?: "template" | "matrix" }
  | { status: "review_required"; reasonCode: string }
  | { status: "blocked"; reasonCode: string }
  | { status: "skipped"; reason: "no_profile" | "already_assigned" | "not_entitled" };

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function clientAssignProgramTemplate(input: {
  templateId: string;
  startsOn: string;
  replace: boolean;
}): Promise<{ id: string }> {
  const { data, error } = await supabase.rpc("client_auto_assign_program_template", {
    p_template_id: input.templateId,
    p_starts_on: input.startsOn,
    p_replace: input.replace,
  });
  if (error) throw error;
  const row = data as { id?: string };
  return { id: String(row?.id ?? "") };
}

/**
 * V1 paid auto-assign:
 * 1) Template Resolver exact+safe → AUTO_ASSIGNED (no admin approval)
 * 2) Else unsafe/missing → REVIEW_REQUIRED / BLOCKED + Admin Review notification
 * 3) Else fall back to Strategy Matrix generation path (existing)
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

  // --- Template path (official product decision tree) ---
  try {
    const { decision, resolver, context, contextFingerprint } = await resolveDecisionForClient({
      clientId: input.userId,
      clientKind: "NEW",
      activeAssignment: null,
    });

    if (decision.decision_state === "AUTO_ASSIGNED" && decision.recommended_template_id) {
      const assigned = await clientAssignProgramTemplate({
        templateId: decision.recommended_template_id,
        startsOn: todayIsoDate(),
        replace: input.runtimeReason === "legacy_incomplete",
      });

      await applyTrainingAssignmentDecision({
        clientId: input.userId,
        clientKind: "NEW",
        decision: { ...decision, should_assign: false },
        resolver,
        context,
        contextFingerprint,
        asClient: true,
        deferActivation: false,
        preAssignedAssignmentId: assigned.id || null,
      });

      return { status: "assigned", assignmentId: assigned.id || null, path: "template" };
    }

    // Exact unsafe / missing / coverage gap / coach-protected: never silent fallback.
    if (
      decision.decision_state === "REVIEW_REQUIRED" ||
      decision.decision_state === "BLOCKED_NO_EXACT_MATCH" ||
      decision.decision_state === "COACH_OVERRIDE_ACTIVE" ||
      decision.decision_state === "NO_CHANGE_REQUIRED"
    ) {
      await applyTrainingAssignmentDecision({
        clientId: input.userId,
        clientKind: "NEW",
        decision,
        resolver,
        context,
        contextFingerprint,
        asClient: true,
      });

      if (decision.decision_state === "REVIEW_REQUIRED") {
        return { status: "review_required", reasonCode: decision.reason_code };
      }
      if (decision.decision_state === "BLOCKED_NO_EXACT_MATCH") {
        return { status: "blocked", reasonCode: decision.reason_code };
      }
      if (decision.decision_state === "COACH_OVERRIDE_ACTIVE") {
        return { status: "blocked", reasonCode: decision.reason_code };
      }
      return { status: "skipped", reason: "already_assigned" };
    }
  } catch (error) {
    console.warn("[paid-training-auto-assign] template path failed, trying matrix", error);
  }

  // --- Matrix fallback (existing path) ---
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
      path: "matrix",
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

export { nextSafeStartsOn };
