import { resolveCanonicalGoal } from "@/lib/platform/prescription/goal-profile";
import { GOAL_COPY } from "./explanations";
import { getGoalIntelligenceProfile, isPrimaryRegion, regionFamily } from "./profiles";
import {
  MIN_MICROCYCLES_FOR_SPEED,
  type GoalAction,
  type GoalReasonCode,
  type GoalResponseDecision,
  type GoalResponseInput,
  type GoalResponseState,
  type RegionalResponseDecision,
  type ReallocationRequest,
  type ResponseLimiter,
} from "./types";

function familyState(regions: RegionalResponseDecision[], family: string): RegionalResponseDecision | null {
  const matches = regions.filter((row) => regionFamily(row.region) === family);
  if (matches.length === 0) return null;
  const rank = (state: RegionalResponseDecision["response_state"]) =>
    ["RECOVERY_LIMITED", "ADHERENCE_LIMITED", "PROGRAM_LIMITED", "STAGNANT", "POSITIVE_SLOW", "INSUFFICIENT_DATA", "POSITIVE_NORMAL", "POSITIVE_FAST"].indexOf(state);
  return matches.slice().sort((a, b) => rank(a.response_state) - rank(b.response_state))[0] ?? null;
}

function positive(state: RegionalResponseDecision["response_state"] | undefined): boolean {
  return state === "POSITIVE_FAST" || state === "POSITIVE_NORMAL";
}

function under(state: RegionalResponseDecision["response_state"] | undefined): boolean {
  return state === "POSITIVE_SLOW" || state === "STAGNANT";
}

function explanation(state: GoalResponseState, extra?: string): string {
  if (extra) return extra;
  if (state === "ON_TRACK") return GOAL_COPY.ON_TRACK;
  if (state === "PARTIAL_RESPONSE") return GOAL_COPY.PARTIAL;
  if (state === "REGIONAL_UNDER_RESPONSE") return GOAL_COPY.REALLOCATE;
  if (state === "RECOVERY_LIMITED") return GOAL_COPY.RECOVERY;
  if (state === "ADHERENCE_LIMITED") return GOAL_COPY.ADHERENCE;
  if (state === "BODY_COMPOSITION_LIMITED") return GOAL_COPY.BODY;
  if (state === "NUTRITION_REVIEW_REQUIRED") return GOAL_COPY.NUTRITION;
  if (state === "TRADEOFF_DETECTED") return GOAL_COPY.TRADEOFF;
  if (state === "SAFETY_REVIEW") return GOAL_COPY.SAFETY;
  if (state === "PROGRAM_LIMITED") return GOAL_COPY.PROGRAM;
  if (state === "STAGNANT_REVIEW") return GOAL_COPY.STAGNANT;
  if (state === "COACH_REVIEW_REQUIRED") return GOAL_COPY.COACH;
  return GOAL_COPY.INSUFFICIENT;
}

export function evaluateGoalResponse(input: GoalResponseInput): GoalResponseDecision {
  const mapped = resolveCanonicalGoal(input.goalId);
  const nutritionStatus = input.nutrition ? "OPTIONAL_INPUTS" : "PENDING_SHARED_CONTRACT";
  const recovery = input.globalRecovery;
  const trainingDemand: GoalResponseDecision["training_demand"] =
    recovery === "POOR" || recovery === "LIMITED" ? "LOW" : input.adherenceShare >= 0.85 ? "NORMAL" : "LOW";

  const base = (
    partial: Omit<
      GoalResponseDecision,
      "goal_id_unchanged" | "nutrition_contract_status" | "training_demand" | "recovery_state" | "regional_responses" | "client_explanation"
    > & { copy?: string },
  ): GoalResponseDecision => {
    const { copy, ...rest } = partial;
    return {
      ...rest,
      regional_responses: input.regions,
      nutrition_contract_status: nutritionStatus,
      training_demand: trainingDemand,
      recovery_state: recovery,
      client_explanation: explanation(partial.goal_response, copy),
      goal_id_unchanged: true,
    };
  };

  if (!mapped.canonicalId) {
    return base({
      goal_id: null,
      goal_response: "INSUFFICIENT_DATA",
      action: "INSUFFICIENT_DATA",
      limiting_factor: "INSUFFICIENT_DATA",
      reason_code: "INSUFFICIENT_REGIONAL_DATA",
      confidence: "LOW",
      training_confidence: "LOW",
      full_goal_confidence: "LOW",
      reallocation: null,
      protected_outcome_conflict: false,
      body_composition_review_required: false,
      nutrition_review_required: false,
      body_composition_data_required: false,
    });
  }

  const profile = getGoalIntelligenceProfile(mapped.canonicalId);
  const primaries = input.regions.filter((row) => isPrimaryRegion(mapped.canonicalId!, row.region));
  const cooldown = Boolean(input.lastGoalAction === "REALLOCATE_TRAINING_EMPHASIS" && (input.lastGoalActionWeeksAgo ?? 99) < MIN_MICROCYCLES_FOR_SPEED);

  if (input.safetyActive) {
    return base({
      goal_id: mapped.canonicalId,
      goal_response: "SAFETY_REVIEW",
      action: "SAFETY_REVIEW",
      limiting_factor: "SAFETY",
      reason_code: "SAFETY_BLOCK",
      confidence: "HIGH",
      training_confidence: "HIGH",
      full_goal_confidence: "LOW",
      reallocation: null,
      protected_outcome_conflict: false,
      body_composition_review_required: false,
      nutrition_review_required: false,
      body_composition_data_required: false,
    });
  }

  if (primaries.length === 0 && profile.primary_regions.length > 0) {
    const anyData = input.regions.length > 0;
    return base({
      goal_id: mapped.canonicalId,
      goal_response: anyData ? "PROGRAM_LIMITED" : "INSUFFICIENT_DATA",
      action: anyData ? "PROGRAM_REVIEW_REQUIRED" : "INSUFFICIENT_DATA",
      limiting_factor: anyData ? "PROGRAM_STRUCTURE" : "INSUFFICIENT_DATA",
      reason_code: anyData ? "PROGRAM_STRUCTURE_LIMITS_GOAL" : "INSUFFICIENT_REGIONAL_DATA",
      confidence: "LOW",
      training_confidence: "LOW",
      full_goal_confidence: "LOW",
      reallocation: null,
      protected_outcome_conflict: false,
      body_composition_review_required: false,
      nutrition_review_required: false,
      body_composition_data_required: false,
    });
  }

  const focus = primaries.length ? primaries : input.regions;
  if (focus.some((row) => row.response_state === "INSUFFICIENT_DATA") && focus.every((row) => row.response_state === "INSUFFICIENT_DATA" || row.observation_microcycles < MIN_MICROCYCLES_FOR_SPEED)) {
    return base({
      goal_id: mapped.canonicalId,
      goal_response: "INSUFFICIENT_DATA",
      action: "INSUFFICIENT_DATA",
      limiting_factor: "INSUFFICIENT_DATA",
      reason_code: "INSUFFICIENT_REGIONAL_DATA",
      confidence: "LOW",
      training_confidence: "LOW",
      full_goal_confidence: "LOW",
      reallocation: null,
      protected_outcome_conflict: false,
      body_composition_review_required: false,
      nutrition_review_required: false,
      body_composition_data_required: profile.body_composition_dependency !== "NONE",
      copy: GOAL_COPY.INSUFFICIENT,
    });
  }

  if (focus.some((row) => row.response_state === "ADHERENCE_LIMITED") || input.adherenceShare < 0.75) {
    return base({
      goal_id: mapped.canonicalId,
      goal_response: "ADHERENCE_LIMITED",
      action: "INSUFFICIENT_DATA",
      limiting_factor: "ADHERENCE",
      reason_code: "ADHERENCE_TOO_LOW_TO_EVALUATE",
      confidence: "MODERATE",
      training_confidence: "LOW",
      full_goal_confidence: "LOW",
      reallocation: null,
      protected_outcome_conflict: false,
      body_composition_review_required: false,
      nutrition_review_required: false,
      body_composition_data_required: false,
    });
  }

  if (focus.some((row) => row.response_state === "RECOVERY_LIMITED") || recovery === "POOR") {
    return base({
      goal_id: mapped.canonicalId,
      goal_response: "RECOVERY_LIMITED",
      action: "RECOVERY_REVIEW_REQUIRED",
      limiting_factor: "RECOVERY",
      reason_code: "RECOVERY_LIMITS_RESPONSE",
      confidence: "HIGH",
      training_confidence: "MODERATE",
      full_goal_confidence: "LOW",
      reallocation: null,
      protected_outcome_conflict: false,
      body_composition_review_required: false,
      nutrition_review_required: Boolean(input.nutrition?.energyRecoveryConstraint),
      body_composition_data_required: false,
    });
  }

  if (focus.some((row) => row.response_state === "PROGRAM_LIMITED")) {
    const row = focus.find((item) => item.response_state === "PROGRAM_LIMITED")!;
    return base({
      goal_id: mapped.canonicalId,
      goal_response: "PROGRAM_LIMITED",
      action: "PROGRAM_REVIEW_REQUIRED",
      limiting_factor: row.limiting_factor,
      reason_code: row.reason_code,
      confidence: "MODERATE",
      training_confidence: "MODERATE",
      full_goal_confidence: "LOW",
      reallocation: null,
      protected_outcome_conflict: false,
      body_composition_review_required: false,
      nutrition_review_required: false,
      body_composition_data_required: false,
    });
  }

  const glutes = familyState(input.regions, "GLUTES");
  const quads = familyState(input.regions, "QUADRICEPS");
  const arms = familyState(input.regions, "BICEPS") ?? familyState(input.regions, "TRICEPS");
  const shoulders = familyState(input.regions, "SHOULDERS");
  const core = familyState(input.regions, "CORE");
  const back = familyState(input.regions, "UPPER_BACK") ?? familyState(input.regions, "LATS");

  let reallocation: ReallocationRequest | null = null;
  let state: GoalResponseState = "ON_TRACK";
  let action: GoalAction = "KEEP_STRATEGY";
  let limiter: ResponseLimiter = "NONE";
  let reason: GoalReasonCode = "REGIONAL_PROGRESS_POSITIVE";
  let conflict = false;
  let bodyReview = false;
  let nutritionReview = false;
  let bodyDataRequired = false;
  let copy: string | undefined;
  let trainingConf: GoalResponseDecision["training_confidence"] = "HIGH";
  let fullConf: GoalResponseDecision["full_goal_confidence"] = "MODERATE";

  const trainingPositive = focus.filter((row) => positive(row.response_state)).length >= Math.ceil(focus.length / 2);
  const trainingUnder = focus.some((row) => under(row.response_state));

  if (mapped.canonicalId === "GLUTE_GROWTH") {
    if (under(glutes?.response_state) && positive(quads?.response_state) && recovery !== "POOR") {
      state = "REGIONAL_UNDER_RESPONSE";
      action = cooldown ? "HOLD_TRAINING_ADAPTATION" : "REALLOCATE_TRAINING_EMPHASIS";
      limiter = "TRAINING_VOLUME";
      reason = cooldown ? "POST_ADAPTATION_OBSERVATION" : "VOLUME_REALLOCATION_PREFERRED";
      reallocation = cooldown
        ? null
        : {
            from_region: "QUADRICEPS",
            to_region: "GLUTES",
            reason: "VOLUME_REALLOCATION_PREFERRED",
            priority: "PRIMARY",
            confidence: "MODERATE",
          };
      copy = GOAL_COPY.REALLOCATE;
    } else if (glutes?.response_state === "STAGNANT") {
      state = "STAGNANT_REVIEW";
      action = "PROGRAM_REVIEW_REQUIRED";
      limiter = "TRAINING_VOLUME";
      reason = "REGIONAL_STAGNATION_CONFIRMED";
    } else if (positive(glutes?.response_state) || trainingPositive) {
      state = "ON_TRACK";
      action = "KEEP_STRATEGY";
      reason = "TRAINING_SIDE_POSITIVE";
      copy = GOAL_COPY.TRAINING_ONLY;
      bodyDataRequired = !input.body?.hipTrend || input.body.hipTrend === "INSUFFICIENT";
      fullConf = bodyDataRequired ? "LOW" : "MODERATE";
      if (input.body?.weightTrend === "DECLINING_FAST") {
        state = "TRADEOFF_DETECTED";
        action = "GOAL_TRADEOFF_REVIEW";
        limiter = "BODY_COMPOSITION";
        reason = "GOAL_TRADEOFF_DETECTED";
        conflict = true;
        nutritionReview = true;
        copy = GOAL_COPY.TRADEOFF;
      }
    }
  }

  if (mapped.canonicalId === "SLIM_TONED_WAIST") {
    const waist = input.body?.waistTrend;
    if (positive(core?.response_state) || trainingPositive) {
      if (!waist || waist === "INSUFFICIENT") {
        state = "PARTIAL_RESPONSE";
        action = "BODY_COMPOSITION_REVIEW_REQUIRED";
        limiter = "BODY_COMPOSITION";
        reason = "BODY_COMPOSITION_DATA_REQUIRED";
        bodyDataRequired = true;
        bodyReview = true;
        fullConf = "LOW";
        copy = GOAL_COPY.BODY;
      } else if (waist === "STABLE" || waist === "INCREASING") {
        state = "BODY_COMPOSITION_LIMITED";
        action = "BODY_COMPOSITION_REVIEW_REQUIRED";
        limiter = "BODY_COMPOSITION";
        reason = "BODY_COMPOSITION_LIMITS_GOAL";
        bodyReview = true;
        nutritionReview = true;
        copy = GOAL_COPY.BODY;
      } else {
        state = "ON_TRACK";
        action = "KEEP_STRATEGY";
        reason = "TRAINING_SIDE_POSITIVE";
      }
    }
  }

  if (mapped.canonicalId === "TONED_ARMS_UPPER_BODY") {
    if (under(arms?.response_state) && positive(shoulders?.response_state) && recovery !== "POOR") {
      state = "PARTIAL_RESPONSE";
      action = cooldown ? "HOLD_TRAINING_ADAPTATION" : "REALLOCATE_TRAINING_EMPHASIS";
      reason = cooldown ? "POST_ADAPTATION_OBSERVATION" : "VOLUME_REALLOCATION_PREFERRED";
      limiter = "TRAINING_VOLUME";
      reallocation = cooldown
        ? null
        : {
            from_region: "SHOULDERS",
            to_region: arms?.region === "TRICEPS" ? "TRICEPS" : "BICEPS",
            reason: "VOLUME_REALLOCATION_PREFERRED",
            priority: "PRIMARY",
            confidence: "MODERATE",
          };
      copy = GOAL_COPY.REALLOCATE;
    } else if (trainingPositive && input.body?.armTrend === "STABLE") {
      state = "PARTIAL_RESPONSE";
      action = "BODY_COMPOSITION_REVIEW_REQUIRED";
      limiter = "BODY_COMPOSITION";
      reason = "BODY_COMPOSITION_LIMITS_GOAL";
      bodyReview = true;
    } else if (trainingPositive) {
      state = "ON_TRACK";
      action = "KEEP_STRATEGY";
      reason = "TRAINING_SIDE_POSITIVE";
      bodyDataRequired = !input.body?.armTrend || input.body.armTrend === "INSUFFICIENT";
      fullConf = bodyDataRequired ? "LOW" : "MODERATE";
    }
  }

  if (mapped.canonicalId === "FEMININE_BALANCED_BODY") {
    const lower = glutes;
    const upper = back ?? shoulders;
    if (positive(lower?.response_state) && under(upper?.response_state) && recovery !== "POOR") {
      state = "PARTIAL_RESPONSE";
      action = "HOLD_TRAINING_ADAPTATION";
      limiter = "TRAINING_VOLUME";
      reason = "REGIONAL_PROGRESS_SLOW";
      copy = GOAL_COPY.PARTIAL;
    } else if (positive(lower?.response_state) && (positive(upper?.response_state) || !upper)) {
      state = "ON_TRACK";
      action = "KEEP_STRATEGY";
      reason = "REGIONAL_PROGRESS_POSITIVE";
    }
    if (input.body?.weightTrend && input.body.weightTrend !== "INSUFFICIENT" && !positive(glutes?.response_state) && !upper) {
      fullConf = "LOW";
    }
  }

  if (mapped.canonicalId === "FAT_LOSS") {
    const weight = input.body?.weightTrend;
    const nutritionBc = input.nutrition?.bodyCompositionResponse;
    if (trainingPositive || !trainingUnder) {
      if (weight === "DECLINING_FAST" && (recovery === "LIMITED" || recovery === "POOR" || input.regions.some((row) => row.exercise_response === "LIMITED"))) {
        state = "TRADEOFF_DETECTED";
        action = "GOAL_TRADEOFF_REVIEW";
        limiter = "NUTRITION_REVIEW_REQUIRED";
        reason = "GOAL_TRADEOFF_DETECTED";
        conflict = true;
        nutritionReview = true;
        copy = GOAL_COPY.TRADEOFF;
      } else if (weight === "STABLE" || nutritionBc === "SLOW" || !weight || weight === "INSUFFICIENT") {
        state = weight && weight !== "INSUFFICIENT" ? "BODY_COMPOSITION_LIMITED" : "PARTIAL_RESPONSE";
        action = "NUTRITION_REVIEW_REQUIRED";
        limiter = "BODY_COMPOSITION";
        reason = weight && weight !== "INSUFFICIENT" ? "BODY_COMPOSITION_LIMITS_GOAL" : "BODY_COMPOSITION_DATA_REQUIRED";
        nutritionReview = true;
        bodyReview = true;
        bodyDataRequired = !weight || weight === "INSUFFICIENT";
        fullConf = "LOW";
        trainingConf = "HIGH";
        copy = GOAL_COPY.NUTRITION;
      } else if (weight === "DECLINING") {
        state = "ON_TRACK";
        action = "KEEP_STRATEGY";
        reason = "PERFORMANCE_PRESERVED";
      }
    }
  }

  if (mapped.canonicalId === "POSTURE_TONED_BACK") {
    if (positive(back?.response_state) || trainingPositive) {
      state = "ON_TRACK";
      action = "KEEP_STRATEGY";
      reason = "TRAINING_SIDE_POSITIVE";
      fullConf = "MODERATE";
      copy = GOAL_COPY.POSTURE;
    }
  }

  if (input.body?.photosPresent) {
    fullConf = fullConf === "HIGH" ? "MODERATE" : fullConf;
  }

  if (input.coachProtected && (action === "REALLOCATE_TRAINING_EMPHASIS" || action === "PROGRAM_REVIEW_REQUIRED")) {
    return base({
      goal_id: mapped.canonicalId,
      goal_response: "COACH_REVIEW_REQUIRED",
      action: "COACH_REVIEW_REQUIRED",
      limiting_factor: limiter,
      reason_code: "COACH_OVERRIDE_ACTIVE",
      confidence: "HIGH",
      training_confidence: trainingConf,
      full_goal_confidence: fullConf,
      reallocation: null,
      protected_outcome_conflict: conflict,
      body_composition_review_required: bodyReview,
      nutrition_review_required: nutritionReview,
      body_composition_data_required: bodyDataRequired,
    });
  }

  const conf: GoalResponseDecision["confidence"] =
    action === "KEEP_STRATEGY" ? (trainingConf === "HIGH" ? "MODERATE" : trainingConf) : trainingConf === "LOW" ? "LOW" : "MODERATE";

  return base({
    goal_id: mapped.canonicalId,
    goal_response: state,
    action,
    limiting_factor: limiter,
    reason_code: reason,
    confidence: conf,
    training_confidence: trainingConf,
    full_goal_confidence: fullConf,
    reallocation,
    protected_outcome_conflict: conflict,
    body_composition_review_required: bodyReview,
    nutrition_review_required: nutritionReview,
    body_composition_data_required: bodyDataRequired,
    copy,
  });
}

export function toVolumeReallocationHint(decision: GoalResponseDecision): {
  from_region: string;
  to_region: string;
} | null {
  if (decision.action !== "REALLOCATE_TRAINING_EMPHASIS" || !decision.reallocation) return null;
  return { from_region: decision.reallocation.from_region, to_region: decision.reallocation.to_region };
}

export function toAdaptiveDecisionSnapshot(decision: GoalResponseDecision): {
  decision_type: "GOAL_RESPONSE";
  reason_code: GoalReasonCode;
  confidence: GoalResponseDecision["confidence"];
  input_snapshot: Record<string, unknown>;
} {
  return {
    decision_type: "GOAL_RESPONSE",
    reason_code: decision.reason_code,
    confidence: decision.confidence,
    input_snapshot: {
      goal_id: decision.goal_id,
      goal_response: decision.goal_response,
      action: decision.action,
      limiter: decision.limiting_factor,
      reallocation: decision.reallocation,
      training_confidence: decision.training_confidence,
      full_goal_confidence: decision.full_goal_confidence,
    },
  };
}
