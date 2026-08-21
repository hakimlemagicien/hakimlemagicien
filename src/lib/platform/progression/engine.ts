import type { ExerciseSetHistoryItem } from "@/lib/platform/training-v2-contracts";
import {
  allAtOrAbove,
  effortAcceptableForIncrease,
  effortMissing,
  effortTooHard,
  groupExposures,
  largeSetDrop,
  majorityBelow,
  median,
  type ProgressionExposure,
} from "./exposures";
import { explainProgression } from "./explanations";
import { nextValidLoad, previousValidLoad } from "./increments";
import {
  BODYWEIGHT_PRACTICAL_CEILING,
  OBSERVATION_EXPOSURES,
  type NextSessionProgression,
  type ProgressionAction,
  type ProgressionContext,
  type ProgressionReasonCode,
} from "./types";

function result(
  context: ProgressionContext,
  current: ProgressionExposure | null,
  action: ProgressionAction,
  reason: ProgressionReasonCode,
  extra: Partial<NextSessionProgression> = {},
): NextSessionProgression {
  const keepLoad = current?.load ?? null;
  const nextLoad =
    extra.next_load !== undefined
      ? extra.next_load
      : action === "INCREASE_LOAD" || action === "DECREASE_LOAD"
        ? keepLoad
        : keepLoad;
  return {
    exercise_external_id: context.externalId,
    action,
    current_load: keepLoad,
    next_load: nextLoad,
    current_rep_min: context.repMin,
    current_rep_max: context.repMax,
    next_rep_min: extra.next_rep_min ?? context.repMin,
    next_rep_max: extra.next_rep_max ?? context.repMax,
    current_duration_min: context.durationMin ?? null,
    current_duration_max: context.durationMax ?? null,
    next_duration_min: extra.next_duration_min ?? context.durationMin ?? null,
    next_duration_max: extra.next_duration_max ?? context.durationMax ?? null,
    reason_code: reason,
    confidence: extra.confidence ?? "MODERATE",
    client_explanation: extra.client_explanation ?? explainProgression(reason),
    created_from_session_id: extra.created_from_session_id ?? current?.sessionId ?? null,
    load_increase_eligible: extra.load_increase_eligible ?? action === "INCREASE_LOAD",
  };
}

function limitingReps(exposure: ProgressionExposure): number[] {
  const left = exposure.sets
    .filter((row) => row.executionSide === "LEFT")
    .map((row) => row.actualReps)
    .filter((v): v is number => v != null);
  const right = exposure.sets
    .filter((row) => row.executionSide === "RIGHT")
    .map((row) => row.actualReps)
    .filter((v): v is number => v != null);
  if (left.length && right.length) {
    const leftMed = median(left) ?? 0;
    const rightMed = median(right) ?? 0;
    return leftMed <= rightMed ? left : right;
  }
  return exposure.reps;
}

function isPartial(exposure: ProgressionExposure, required: number) {
  return exposure.sets.length < required;
}

function repeatedDecline(exposures: ProgressionExposure[]) {
  if (exposures.length < 3) return false;
  const recent = exposures.slice(-3);
  const medians = recent.map((item) => median(item.reps) ?? 0);
  const declining = medians[0] > medians[1] && medians[1] > medians[2];
  const latestHard = recent[2].efforts.some(
    (value) => value === "VERY_HARD" || value === "FAILURE",
  );
  return declining && latestHard;
}

function plateauSuspected(
  exposures: ProgressionExposure[],
  repMax: number,
  level: ProgressionContext["trainingLevel"],
) {
  const needed = level === "INTERMEDIATE" ? OBSERVATION_EXPOSURES : OBSERVATION_EXPOSURES + 2;
  const window = exposures.slice(-needed);
  if (window.length < needed) return false;
  const loads = window.map((item) => item.load);
  const sameLoad = loads.every((value) => value === loads[0]);
  const medians = window.map((item) => median(item.reps) ?? 0);
  const progressed = medians.some((value, index) => index > 0 && value > medians[0] + 0.5);
  const atTop = window.every((item) => allAtOrAbove(item.reps, repMax));
  return sameLoad && !progressed && !atTop;
}

function decideResistance(
  context: ProgressionContext,
  exposures: ProgressionExposure[],
): NextSessionProgression {
  const current = exposures[exposures.length - 1] ?? null;
  const previous = exposures.length > 1 ? exposures[exposures.length - 2] : null;
  if (!current) {
    return result(context, null, "INSUFFICIENT_DATA", "INSUFFICIENT_HISTORY", {
      confidence: "LOW",
      next_load: null,
    });
  }

  const isBodyweight =
    context.exercise.is_bodyweight === true || context.exercise.loading_type === "BODYWEIGHT";
  if (current.sets.some((row) => row.actualReps == null)) {
    return result(context, current, "INSUFFICIENT_DATA", "MISSING_REPS", {
      confidence: "LOW",
      next_load: current.load,
    });
  }
  if (!isBodyweight && (current.load == null || !(current.load > 0))) {
    return result(context, current, "INSUFFICIENT_DATA", "MISSING_LOAD", {
      confidence: "LOW",
      next_load: null,
    });
  }

  const reps = limitingReps(current);
  if (isPartial(current, context.requiredWorkingSets)) {
    return result(context, current, "KEEP_LOAD", "PARTIAL_SESSION", {
      confidence: "LOW",
      next_load: current.load,
    });
  }

  if (context.techniqueDegraded) {
    return result(context, current, "HOLD_PROGRESSION", "TECHNIQUE_DEGRADED", {
      confidence: "LOW",
      next_load: current.load,
    });
  }

  const newLoad = previous?.load != null && current.load != null && current.load > previous.load;
  if (newLoad) {
    const tolerated =
      !majorityBelow(reps, context.repMin) &&
      reps.filter((value) => value >= context.repMin).length >= Math.ceil(reps.length * 0.5);
    if (!tolerated && (effortTooHard(current.efforts) || majorityBelow(reps, context.repMin))) {
      const down = previousValidLoad({
        current: current.load!,
        incrementKg: context.availableIncrementKg,
        validLoads: context.validLoads,
        fallback: previous.load,
      });
      return result(context, current, "DECREASE_LOAD", "NEW_LOAD_NOT_TOLERATED", {
        next_load: down,
        confidence: "HIGH",
      });
    }
    if (
      context.prescribedLoad != null &&
      current.load! > context.prescribedLoad &&
      majorityBelow(reps, context.repMin)
    ) {
      return result(context, current, "DECREASE_LOAD", "MANUAL_HIGH_LOAD_REJECTED", {
        next_load: context.prescribedLoad,
        confidence: "MODERATE",
      });
    }
    if (tolerated) {
      return result(context, current, "KEEP_LOAD", "NEW_LOAD_TOLERATED", {
        next_load: current.load,
        confidence: "HIGH",
      });
    }
  }

  if (!isBodyweight && majorityBelow(reps, context.repMin) && effortTooHard(current.efforts)) {
    const down = previousValidLoad({
      current: current.load ?? 0,
      incrementKg: context.availableIncrementKg,
      validLoads: context.validLoads,
      fallback: previous?.load ?? null,
    });
    return result(context, current, "DECREASE_LOAD", "BELOW_REP_MIN", {
      next_load: down,
      confidence: "MODERATE",
    });
  }

  if (reps.length >= 2) {
    const last = reps[reps.length - 1];
    const earlierOk = reps.slice(0, -1).every((value) => value >= context.repMin);
    if (last < context.repMin && earlierOk && !majorityBelow(reps, context.repMin)) {
      return result(context, current, "KEEP_LOAD", "ONE_WEAK_SET", { next_load: current.load });
    }
  }

  if (repeatedDecline(exposures)) {
    return result(context, current, "RECOVERY_REVIEW", "REPEATED_DECLINE", {
      next_load: current.load,
      confidence: "MODERATE",
    });
  }

  if (previous) {
    const prevMed = median(previous.reps) ?? 0;
    const curMed = median(reps) ?? 0;
    if (
      curMed < prevMed &&
      reps.every((value) => value >= context.repMin) &&
      prevMed - curMed <= 2 &&
      !repeatedDecline(exposures)
    ) {
      return result(context, current, "KEEP_LOAD", "SINGLE_SESSION_VARIANCE", {
        next_load: current.load,
      });
    }
  }

  if (plateauSuspected(exposures, context.repMax, context.trainingLevel)) {
    return result(context, current, "PLATEAU_REVIEW", "PLATEAU_SUSPECTED", {
      next_load: current.load,
      confidence: "MODERATE",
    });
  }

  if (isBodyweight) {
    return decideBodyweight(context, current, reps);
  }

  const mastered = reps.length >= context.requiredWorkingSets && allAtOrAbove(reps, context.repMax);
  if (!mastered) {
    const inRange = reps.every((value) => value >= context.repMin);
    const allBelowMax = reps.every((value) => value < context.repMax);
    const action: ProgressionAction = inRange && allBelowMax ? "INCREASE_REPS" : "KEEP_LOAD";
    return result(context, current, action, "REP_RANGE_NOT_MAXED", {
      next_load: current.load,
      confidence: "MODERATE",
    });
  }

  if (effortTooHard(current.efforts)) {
    return result(context, current, "HOLD_PROGRESSION", "EFFORT_TOO_HIGH", {
      next_load: current.load,
      confidence: "MODERATE",
    });
  }
  if (effortMissing(current.efforts)) {
    return result(context, current, "KEEP_LOAD", "MISSING_EFFORT", {
      next_load: current.load,
      confidence: "LOW",
    });
  }
  if (!effortAcceptableForIncrease(current.efforts)) {
    return result(context, current, "KEEP_LOAD", "EFFORT_TOO_HIGH", {
      next_load: current.load,
      confidence: "MODERATE",
    });
  }
  if (
    largeSetDrop(reps) &&
    current.efforts.some((value) => value === "VERY_HARD" || value === "FAILURE")
  ) {
    return result(context, current, "HOLD_PROGRESSION", "EFFORT_TOO_HIGH", {
      next_load: current.load,
    });
  }

  const step = nextValidLoad({
    current: current.load ?? 0,
    incrementKg: context.availableIncrementKg,
    validLoads: context.validLoads,
    mechanics: context.exercise.mechanics,
  });
  if (step.next == null || step.limited) {
    return result(context, current, "KEEP_LOAD", "EQUIPMENT_INCREMENT_LIMITED", {
      next_load: current.load,
      confidence: "MODERATE",
    });
  }

  const easy = current.efforts.every((value) => value === "EASY");
  return result(context, current, "INCREASE_LOAD", easy ? "TOP_RANGE_EASY" : "TOP_RANGE_MASTERED", {
    next_load: step.next,
    confidence: exposures.length >= 2 ? "HIGH" : "MODERATE",
    load_increase_eligible: true,
  });
}

function decideBodyweight(
  context: ProgressionContext,
  current: ProgressionExposure,
  reps: number[],
): NextSessionProgression {
  const ceiling = Math.min(context.repMax, BODYWEIGHT_PRACTICAL_CEILING);
  if (majorityBelow(reps, context.repMin) && effortTooHard(current.efforts)) {
    return result(context, current, "REGRESS_VARIATION", "BELOW_REP_MIN", {
      next_load: null,
      confidence: "MODERATE",
    });
  }
  if (
    allAtOrAbove(reps, ceiling) &&
    effortAcceptableForIncrease(current.efforts) &&
    current.efforts.some((value) => value === "EASY")
  ) {
    return result(context, current, "PROGRESS_VARIATION", "BODYWEIGHT_REP_CEILING", {
      next_load: null,
      confidence: "HIGH",
    });
  }
  if (allAtOrAbove(reps, context.repMax) && effortAcceptableForIncrease(current.efforts)) {
    return result(context, current, "PROGRESS_VARIATION", "BODYWEIGHT_REP_CEILING", {
      next_load: null,
      confidence: "MODERATE",
    });
  }
  return result(context, current, "INCREASE_REPS", "REP_RANGE_NOT_MAXED", { next_load: null });
}

function decideTimed(
  context: ProgressionContext,
  exposures: ProgressionExposure[],
): NextSessionProgression {
  const current = exposures[exposures.length - 1];
  if (!current) {
    return result(context, null, "INSUFFICIENT_DATA", "INSUFFICIENT_HISTORY", {
      next_load: null,
      confidence: "LOW",
    });
  }
  const durations = current.durations;
  if (!durations.length) {
    return result(context, current, "INSUFFICIENT_DATA", "MISSING_REPS", {
      next_load: null,
      confidence: "LOW",
    });
  }
  const max = context.durationMax ?? 40;
  const min = context.durationMin ?? 20;
  const best = Math.max(...durations);
  if (best < max) {
    const next = Math.min(max, best + 5);
    return result(context, current, "INCREASE_DURATION", "DURATION_RANGE_NOT_MAXED", {
      next_load: null,
      next_duration_min: Math.max(min, next - 10),
      next_duration_max: next,
      confidence: "MODERATE",
    });
  }
  if (
    effortAcceptableForIncrease(current.efforts) ||
    current.efforts.some((value) => value === "EASY")
  ) {
    return result(context, current, "PROGRESS_VARIATION", "DURATION_RANGE_MASTERED", {
      next_load: null,
      confidence: "HIGH",
    });
  }
  return result(context, current, "KEEP_DURATION", "DURATION_RANGE_MASTERED", { next_load: null });
}

export function getNextSessionProgression(context: ProgressionContext): NextSessionProgression {
  try {
    return decide(context);
  } catch {
    return result(context, null, "RECALIBRATE", "ENGINE_ERROR", {
      next_load: null,
      confidence: "LOW",
      client_explanation: explainProgression("ENGINE_ERROR"),
    });
  }
}

function decide(context: ProgressionContext): NextSessionProgression {
  const exposures = groupExposures(context.history);
  const latest = exposures.at(-1) ?? null;
  if (context.safetyReview || context.prescriptionState === "SAFETY_REVIEW") {
    return result(context, latest, "SAFETY_REVIEW", "SAFETY_BLOCK", {
      next_load: latest?.load ?? null,
      confidence: "HIGH",
    });
  }
  if (context.coachProtected) {
    return result(context, latest, "KEEP_LOAD", "COACH_OVERRIDE", {
      next_load: context.coachLoad ?? latest?.load ?? null,
      confidence: "HIGH",
    });
  }
  if (context.recoveryHold === "RECOVERY_LIMITED" || context.recoveryHold === "PROGRESSION_HOLD") {
    return result(context, latest, "HOLD_PROGRESSION", "RECOVERY_HOLD", {
      next_load: latest?.load ?? null,
    });
  }
  if (context.recoveryHold === "DELOAD_ACTIVE") {
    return result(context, latest, "HOLD_PROGRESSION", "DELOAD_HOLD", {
      next_load: latest?.load ?? null,
    });
  }
  if (context.prescriptionState === "RECONDITIONING") {
    return result(context, latest, "RECALIBRATE", "RECONDITIONING_HOLD", {
      next_load: null,
      confidence: "LOW",
    });
  }

  const mode = context.exercise.prescription_mode;
  if (
    mode === "INTERVAL" &&
    !context.durationMax &&
    !context.exercise.supports_timed_prescription
  ) {
    return result(context, latest, "KEEP_LOAD", "CONDITIONING_DEFERRED", {
      next_load: null,
      confidence: "LOW",
    });
  }
  if (
    mode === "DURATION" ||
    (mode === "INTERVAL" && context.exercise.supports_timed_prescription)
  ) {
    return decideTimed(context, exposures);
  }
  return decideResistance(context, exposures);
}

export function excludeCurrentSession(
  history: ExerciseSetHistoryItem[],
  currentSessionId: string | null | undefined,
  todayIso?: string,
) {
  const today = todayIso ?? new Date().toISOString().slice(0, 10);
  return history.filter((row) => {
    if (currentSessionId && row.workoutSessionId === currentSessionId) return false;
    if (!row.workoutSessionId && row.sessionDate.slice(0, 10) === today) return false;
    return true;
  });
}

export function hasSideSpecificData(history: ExerciseSetHistoryItem[]) {
  return history.some((row) => row.executionSide === "LEFT" || row.executionSide === "RIGHT");
}
