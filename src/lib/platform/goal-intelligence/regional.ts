import {
  ADHERENCE_JUDGE_MIN,
  DIRECT_COVERAGE_MIN,
  MIN_MICROCYCLES_FOR_SPEED,
  MIN_MICROCYCLES_FOR_STAGNANT,
  type GoalAction,
  type GoalReasonCode,
  type RegionalResponseDecision,
  type RegionalResponseInput,
  type ResponseLimiter,
} from "./types";

function completion(input: RegionalResponseInput): number {
  if (input.prescribedVolume <= 0) return 0;
  return input.completedVolume / input.prescribedVolume;
}

function progressionLimited(input: RegionalResponseInput): boolean {
  if (input.progressionActions.length === 0) return false;
  const blocked = input.progressionActions.filter(
    (action) => action === "RECALIBRATE" || action === "HOLD_PROGRESSION" || action === "INSUFFICIENT_DATA",
  );
  const progressing = input.progressionActions.filter(
    (action) => action === "INCREASE_REPS" || action === "INCREASE_LOAD" || action === "INCREASE_DURATION",
  );
  return blocked.length > 0 && progressing.length === 0 && completion(input) >= ADHERENCE_JUDGE_MIN;
}

export function evaluateRegionalResponse(input: RegionalResponseInput): RegionalResponseDecision {
  const ratio = completion(input);
  const cooldown = (input.lastReallocationWeeksAgo ?? 99) < MIN_MICROCYCLES_FOR_SPEED;

  if (input.safetyActive) {
    return result(input, "INSUFFICIENT_DATA", "SAFETY", "SAFETY_REVIEW", "SAFETY_BLOCK", "HIGH");
  }

  if (input.validMicrocycles < MIN_MICROCYCLES_FOR_SPEED) {
    return result(input, "INSUFFICIENT_DATA", "INSUFFICIENT_DATA", "INSUFFICIENT_DATA", "INSUFFICIENT_REGIONAL_DATA", "LOW");
  }

  if (ratio < ADHERENCE_JUDGE_MIN) {
    return result(input, "ADHERENCE_LIMITED", "ADHERENCE", "INSUFFICIENT_DATA", "ADHERENCE_TOO_LOW_TO_EVALUATE", "MODERATE");
  }

  if (input.globalRecovery === "POOR" || input.localFatigue === "HIGH") {
    return result(input, "RECOVERY_LIMITED", "RECOVERY", "RECOVERY_REVIEW_REQUIRED", "RECOVERY_LIMITS_RESPONSE", "HIGH");
  }

  if (input.directPrimaryShare < DIRECT_COVERAGE_MIN && input.prescribedVolume > 0) {
    return result(input, "PROGRAM_LIMITED", "EXERCISE_SELECTION", "PROGRAM_REVIEW_REQUIRED", "EXERCISE_SELECTION_LIMITS_GOAL", "MODERATE");
  }

  if (progressionLimited(input) && input.effectiveVolume >= input.prescribedVolume * 0.8) {
    return result(input, "POSITIVE_SLOW", "EXERCISE_PROGRESSION", "HOLD_TRAINING_ADAPTATION", "EXERCISE_PROGRESSION_LIMITS_GOAL", "MODERATE");
  }

  const confidence = input.validMicrocycles >= MIN_MICROCYCLES_FOR_STAGNANT ? "HIGH" : "MODERATE";

  if (input.performanceTrend === "IMPROVING") {
    const fast =
      input.progressionActions.filter((action) => action === "INCREASE_LOAD" || action === "INCREASE_REPS").length >= 2;
    const state = fast ? "POSITIVE_FAST" : "POSITIVE_NORMAL";
    const signal: GoalAction = cooldown ? "HOLD_TRAINING_ADAPTATION" : "KEEP_STRATEGY";
    const reason: GoalReasonCode = cooldown ? "POST_ADAPTATION_OBSERVATION" : "REGIONAL_PROGRESS_POSITIVE";
    return result(input, state, "NONE", signal, reason, confidence);
  }

  if (
    input.performanceTrend === "STABLE" &&
    input.validMicrocycles >= MIN_MICROCYCLES_FOR_STAGNANT &&
    ratio >= 0.85 &&
    input.globalRecovery !== "LIMITED" &&
    input.localFatigue === "NONE"
  ) {
    return result(input, "STAGNANT", "TRAINING_VOLUME", "HOLD_TRAINING_ADAPTATION", "REGIONAL_STAGNATION_CONFIRMED", "HIGH");
  }

  if (input.performanceTrend === "STABLE" || input.performanceTrend === "DECLINING") {
    const limiter: ResponseLimiter =
      input.globalRecovery === "LIMITED" ? "RECOVERY" : input.effectiveVolume < input.prescribedVolume * 0.9 ? "TRAINING_VOLUME" : "NONE";
    const state = limiter === "RECOVERY" ? "RECOVERY_LIMITED" : "POSITIVE_SLOW";
    return result(
      input,
      state,
      limiter === "NONE" ? "TRAINING_VOLUME" : limiter,
      limiter === "RECOVERY" ? "RECOVERY_REVIEW_REQUIRED" : "HOLD_TRAINING_ADAPTATION",
      limiter === "RECOVERY" ? "RECOVERY_LIMITS_RESPONSE" : "REGIONAL_PROGRESS_SLOW",
      confidence,
    );
  }

  return result(input, "INSUFFICIENT_DATA", "INSUFFICIENT_DATA", "INSUFFICIENT_DATA", "INSUFFICIENT_REGIONAL_DATA", "LOW");
}

function result(
  input: RegionalResponseInput,
  response_state: RegionalResponseDecision["response_state"],
  limiting_factor: ResponseLimiter,
  recommended_signal: GoalAction,
  reason_code: GoalReasonCode,
  confidence: RegionalResponseDecision["confidence"],
): RegionalResponseDecision {
  return {
    region: input.region,
    response_state,
    limiting_factor,
    confidence,
    recommended_signal,
    reason_code,
    exercise_response: input.exerciseResponse,
    observation_microcycles: input.validMicrocycles,
  };
}
