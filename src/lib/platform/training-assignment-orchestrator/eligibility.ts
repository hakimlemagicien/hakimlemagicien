import type { ProgramGenerationResult } from "@/lib/platform/program-generation/types";
import { canActivateProgram } from "@/lib/platform/program-generation";
import type { ResolvedTrainingStrategy } from "@/lib/platform/strategy-matrix/types";
import type {
  AssignmentMode,
  AutomationBlockReason,
  AutomationEligibilityStatus,
} from "./types";

export type AutomationEligibilityInput = {
  assignmentMode: AssignmentMode;
  strategy: ResolvedTrainingStrategy | null;
  generation: ProgramGenerationResult | null;
  assignable: boolean;
  blockReason: string | null;
  strategyResolutionFailed: boolean;
  strategyErrors: string[];
  /** When true, automated assignment is globally disabled (V1 default). */
  automatedGloballyDisabled?: boolean;
  membershipTier?: string | null;
};

export type AutomationEligibilityResult = {
  status: AutomationEligibilityStatus;
  reasons: AutomationBlockReason[];
};

function isPaidTier(tier: string | null | undefined): boolean {
  const value = String(tier ?? "").toLowerCase();
  return value === "essential" || value === "premium" || value === "vip";
}

/**
 * Centralized automation eligibility — do not scatter these conditions across UI.
 */
export function evaluateAutomaticAssignmentEligibility(
  input: AutomationEligibilityInput,
): AutomationEligibilityResult {
  const reasons: AutomationBlockReason[] = [];

  if (input.assignmentMode === "ASSISTED") {
    return { status: "REVIEW_REQUIRED", reasons: ["COACH_REVIEW_REQUIRED"] };
  }

  if (input.automatedGloballyDisabled !== false) {
    reasons.push("AUTOMATED_DISABLED");
  }

  if (input.strategyResolutionFailed || !input.strategy) {
    reasons.push("MISSING_PROFILE_DATA");
    if (input.strategyErrors.some((code) => code.includes("GOAL"))) {
      reasons.push("UNRESOLVED_GOAL");
    }
    if (input.strategyErrors.some((code) => code.includes("CORE_100"))) {
      reasons.push("CORE_100_UNAVAILABLE");
    }
  }

  if (!input.generation) {
    reasons.push("GENERATION_BLOCKED");
  } else {
    if (!canActivateProgram(input.generation.validation, input.generation.status)) {
      reasons.push("PROGRAM_INVALID");
    }
    if (input.generation.validation.errors.some((row) => row.code === "SAFETY_RESTRICTION_VIOLATION")) {
      reasons.push("SAFETY_REVIEW_REQUIRED");
    }
    if (
      input.generation.validation.errors.some(
        (row) => row.code === "INSUFFICIENT_SAFE_EXERCISE_COVERAGE",
      )
    ) {
      reasons.push("SAFETY_REVIEW_REQUIRED");
    }
    if (input.generation.status === "PROGRAM_REVIEW_REQUIRED") {
      reasons.push("COACH_REVIEW_REQUIRED");
    }
  }

  if (!input.assignable) {
    if (input.blockReason === "FIXED_LOAD_FORBIDDEN") reasons.push("FIXED_LOAD_FORBIDDEN");
    else if (!reasons.includes("PROGRAM_INVALID")) reasons.push("PROGRAM_INVALID");
  }

  if (input.strategy?.coachProtected) {
    reasons.push("COACH_REVIEW_REQUIRED");
  }

  const tier = input.membershipTier;
  if (tier && !isPaidTier(tier)) {
    reasons.push("FREE_ENTITLEMENT_BLOCKED");
  }

  const unique = [...new Set(reasons)];

  if (unique.some((code) => code !== "COACH_REVIEW_REQUIRED" && code !== "AUTOMATED_DISABLED")) {
    return { status: "BLOCKED", reasons: unique };
  }

  if (unique.includes("AUTOMATED_DISABLED") || unique.includes("COACH_REVIEW_REQUIRED")) {
    return { status: "REVIEW_REQUIRED", reasons: unique };
  }

  if (input.assignable && input.generation && input.strategy) {
    return { status: "ELIGIBLE", reasons: [] };
  }

  return { status: "BLOCKED", reasons: unique.length ? unique : ["PROGRAM_INVALID"] };
}
