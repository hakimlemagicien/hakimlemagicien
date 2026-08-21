import { musclePriorityFor, resolveCanonicalGoal } from "@/lib/platform/prescription/goal-profile";
import type { MusclePriority } from "@/lib/platform/prescription/types";
import type { RecoveryHoldState } from "@/lib/platform/progression/types";
import { aggregateWeeks, type WeekAggregate } from "./aggregate";
import {
  combineRecovery,
  recoveryFromReadiness,
  recoveryFromTraining,
  toProgressionRecoveryHold,
} from "./recovery";
import {
  ADD_VOLUME_DELTA,
  OBSERVATION_WEEKS,
  REDUCE_VOLUME_DELTA,
  type FatigueLevel,
  type PerformanceTrend,
  type RegionVolumeState,
  type VolumeAction,
  type VolumeReasonCode,
  type WeeklyVolumeContext,
  type WeeklyVolumeDecision,
} from "./types";

function trend(current: number | null, previous: number | null): PerformanceTrend {
  if (current == null || previous == null) return "INSUFFICIENT";
  if (current > previous * 1.03) return "IMPROVING";
  if (current < previous * 0.92) return "DECLINING";
  return "STABLE";
}

function regionTrend(
  latest: WeekAggregate,
  previous: WeekAggregate | null,
  region: string,
): PerformanceTrend {
  if (!previous) return "INSUFFICIENT";
  const now = latest.region[region];
  const before = previous.region[region];
  if (!now || !before) return "INSUFFICIENT";
  const load = trend(now.medianLoad, before.medianLoad);
  const reps = trend(now.medianReps, before.medianReps);
  if (load === "DECLINING" || reps === "DECLINING") return "DECLINING";
  if (load === "IMPROVING" || reps === "IMPROVING") return "IMPROVING";
  if (load === "INSUFFICIENT" && reps === "INSUFFICIENT") return "INSUFFICIENT";
  return "STABLE";
}

function localFatigue(
  latest: WeekAggregate,
  region: string,
  performance: PerformanceTrend,
): FatigueLevel {
  const stats = latest.region[region];
  if (!stats || stats.completedPhysical === 0) return "NONE";
  const hardRate = (stats.hardEffort + stats.failureEffort) / Math.max(stats.completedPhysical, 1);
  if (performance === "DECLINING" && hardRate >= 0.5) return "HIGH";
  if (hardRate >= 0.6) return "ELEVATED";
  return "NONE";
}

function shortRestPattern(latest: WeekAggregate, region: string) {
  const stats = latest.region[region];
  if (!stats || stats.restSamples < 3) return false;
  return stats.shortRest / stats.restSamples >= 0.6;
}

function singleLongRestOnly(weeks: WeekAggregate[]) {
  const latest = weeks[weeks.length - 1];
  if (!latest) return false;
  const long = Object.values(latest.region).reduce((sum, row) => sum + row.longRest, 0);
  const samples = Object.values(latest.region).reduce((sum, row) => sum + row.restSamples, 0);
  return long === 1 && samples >= 3;
}

function primaryRegions(
  goal: ReturnType<typeof resolveCanonicalGoal>["canonicalId"],
  regions: string[],
) {
  if (!goal) return [];
  return regions.filter((region) => musclePriorityFor(goal, [region]) === "PRIMARY");
}

function decideRegion(input: {
  region: string;
  priority: MusclePriority | null;
  latest: WeekAggregate;
  previous: WeekAggregate | null;
  weeks: WeekAggregate[];
  ctx: WeeklyVolumeContext;
  recovery: WeeklyVolumeDecision["recovery_state"];
  globalFatigue: FatigueLevel;
  blocked: { action: VolumeAction; reason: VolumeReasonCode } | null;
}): RegionVolumeState {
  const stats = input.latest.region[input.region] ?? {
    region: input.region,
    prescribed: 0,
    completedPhysical: 0,
    effective: 0,
    hardEffort: 0,
    failureEffort: 0,
    medianLoad: null,
    medianReps: null,
    shortRest: 0,
    longRest: 0,
    restSamples: 0,
  };
  const performance = regionTrend(input.latest, input.previous, input.region);
  const fatigue = localFatigue(input.latest, input.region, performance);
  const completion =
    stats.prescribed > 0 ? stats.effective / stats.prescribed : input.latest.completionRate;
  const validWeeks = input.weeks.length;
  const base = {
    region: input.region,
    priority: input.priority,
    prescribed_volume: round1(stats.prescribed),
    completed_volume: stats.completedPhysical,
    effective_volume: round1(stats.effective),
    physical_set_count: stats.completedPhysical,
    performance_trend: performance,
    local_fatigue: fatigue,
  };

  if (input.blocked) {
    return {
      ...base,
      volume_action: input.blocked.action,
      recommended_delta: 0,
      reason_code: input.blocked.reason,
      confidence: "HIGH",
    };
  }

  if (input.ctx.safetyRegions?.includes(input.region)) {
    return {
      ...base,
      volume_action: "SAFETY_REVIEW",
      recommended_delta: 0,
      reason_code: "SAFETY_BLOCK",
      confidence: "HIGH",
    };
  }

  if (shortRestPattern(input.latest, input.region) && performance === "DECLINING") {
    return {
      ...base,
      volume_action: "KEEP_VOLUME",
      recommended_delta: 0,
      reason_code: "REST_PATTERN_REVIEW",
      confidence: "MODERATE",
    };
  }

  if (fatigue === "HIGH") {
    return {
      ...base,
      volume_action: completion < 0.75 ? "REDUCE_VOLUME" : "HOLD_VOLUME_PROGRESSION",
      recommended_delta: completion < 0.75 ? REDUCE_VOLUME_DELTA : 0,
      reason_code: "LOCAL_FATIGUE_HIGH",
      confidence: "HIGH",
    };
  }

  if (input.globalFatigue === "HIGH") {
    return {
      ...base,
      volume_action: "HOLD_VOLUME_PROGRESSION",
      recommended_delta: 0,
      reason_code: "GLOBAL_FATIGUE_HIGH",
      confidence: "HIGH",
    };
  }

  if (validWeeks < OBSERVATION_WEEKS) {
    const sparse = stats.completedPhysical === 0 && stats.prescribed === 0;
    return {
      ...base,
      volume_action: sparse ? "INSUFFICIENT_DATA" : "KEEP_VOLUME",
      recommended_delta: 0,
      reason_code: sparse ? "INSUFFICIENT_DATA" : "INSUFFICIENT_DATA",
      confidence: "LOW",
    };
  }

  if (performance === "INSUFFICIENT") {
    return {
      ...base,
      volume_action: "KEEP_VOLUME",
      recommended_delta: 0,
      reason_code: "INSUFFICIENT_DATA",
      confidence: "LOW",
    };
  }

  if (completion < 0.7 && validWeeks >= OBSERVATION_WEEKS) {
    const prevCompletion =
      input.previous && input.previous.region[input.region]?.prescribed
        ? input.previous.region[input.region].effective /
          input.previous.region[input.region].prescribed
        : (input.previous?.completionRate ?? 1);
    if (prevCompletion < 0.75) {
      return {
        ...base,
        volume_action: "REDUCE_VOLUME",
        recommended_delta: REDUCE_VOLUME_DELTA,
        reason_code: "COMPLETION_TOO_LOW",
        confidence: "HIGH",
      };
    }
    return {
      ...base,
      volume_action: "HOLD_VOLUME_PROGRESSION",
      recommended_delta: 0,
      reason_code: "COMPLETION_TOO_LOW",
      confidence: "MODERATE",
    };
  }

  if (performance === "IMPROVING" && completion >= 0.85 && input.recovery !== "POOR") {
    return {
      ...base,
      volume_action: "KEEP_VOLUME",
      recommended_delta: 0,
      reason_code: "CURRENT_VOLUME_PRODUCTIVE",
      confidence: "HIGH",
    };
  }

  if (
    performance === "STABLE" &&
    completion >= 0.9 &&
    input.recovery !== "LIMITED" &&
    input.recovery !== "POOR"
  ) {
    const cooldownOk = (input.ctx.lastVolumeAction?.validWeeksAgo ?? 99) >= OBSERVATION_WEEKS;
    const canAdd =
      input.priority === "PRIMARY" &&
      !input.ctx.recentLoadIncrease &&
      input.ctx.lastVolumeAction?.action !== "ADD_SMALL_VOLUME" &&
      cooldownOk &&
      input.ctx.trainingLevel !== "UNASSESSED" &&
      input.ctx.goalId !== "FAT_LOSS" &&
      input.ctx.goalId !== "SLIM_TONED_WAIST" &&
      (input.recovery === "GOOD" || input.recovery === "NORMAL") &&
      completion >= 0.95;

    if (
      canAdd &&
      ((input.ctx.trainingLevel === "BEGINNER" && stats.prescribed >= 12) || stats.prescribed >= 16)
    ) {
      return {
        ...base,
        volume_action: "KEEP_VOLUME",
        recommended_delta: 0,
        reason_code: "VOLUME_CEILING_REACHED",
        confidence: "MODERATE",
      };
    }
    if (canAdd) {
      return {
        ...base,
        volume_action: "ADD_SMALL_VOLUME",
        recommended_delta: ADD_VOLUME_DELTA,
        reason_code: "PRIMARY_REGION_UNDERDOSED_REVIEW",
        confidence: "MODERATE",
      };
    }
    return {
      ...base,
      volume_action: "KEEP_VOLUME",
      recommended_delta: 0,
      reason_code: "CURRENT_VOLUME_PRODUCTIVE",
      confidence: "MODERATE",
    };
  }

  return {
    ...base,
    volume_action: "KEEP_VOLUME",
    recommended_delta: 0,
    reason_code: "CURRENT_VOLUME_PRODUCTIVE",
    confidence: "MODERATE",
  };
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function getWeeklyVolumeDecision(context: WeeklyVolumeContext): WeeklyVolumeDecision {
  const goal = resolveCanonicalGoal(context.goalId);
  const weeks = aggregateWeeks(context.sets, context.prescribed, context.exercises);
  const latest = weeks[weeks.length - 1];
  const previous = weeks.length > 1 ? weeks[weeks.length - 2] : null;
  const physical = latest?.physicalCompleted ?? 0;
  const gaps = [...new Set(weeks.flatMap((week) => week.metadataGaps))];

  const recovery = combineRecovery(
    recoveryFromReadiness(context.readiness),
    recoveryFromTraining(weeks),
  );

  const decliningRegions = latest
    ? Object.keys(latest.region).filter(
        (region) => regionTrend(latest, previous, region) === "DECLINING",
      )
    : [];
  const globalFatigue: FatigueLevel =
    decliningRegions.length >= 2 && recovery !== "GOOD" && (latest?.completionRate ?? 1) < 0.85
      ? "HIGH"
      : decliningRegions.length >= 2
        ? "ELEVATED"
        : "NONE";

  const conditioningInterference = Boolean(
    latest &&
    latest.lowerBodyConditioningCompleted >= 6 &&
    decliningRegions.some((region) =>
      ["GLUTES", "QUADRICEPS", "HAMSTRINGS", "GLUTEUS_MAXIMUS"].includes(region),
    ) &&
    (recovery === "LIMITED" || recovery === "POOR" || globalFatigue !== "NONE"),
  );

  let blocked: { action: VolumeAction; reason: VolumeReasonCode } | null = null;
  if (context.coachProtected) blocked = { action: "KEEP_VOLUME", reason: "COACH_OVERRIDE_ACTIVE" };
  if (context.deloadActive)
    blocked = { action: "HOLD_VOLUME_PROGRESSION", reason: "DELOAD_PATTERN_DETECTED" };
  if (context.reconditioningActive || context.continuityState === "RECONDITIONING_REQUIRED") {
    blocked = { action: "RECONDITIONING", reason: "RECONDITIONING_ACTIVE" };
  }

  const regionNames = [...new Set(weeks.flatMap((week) => Object.keys(week.region)))];
  const regionStates: RegionVolumeState[] = latest
    ? regionNames.map((region) =>
        decideRegion({
          region,
          priority: musclePriorityFor(goal.canonicalId, [region]),
          latest,
          previous,
          weeks,
          ctx: context,
          recovery,
          globalFatigue,
          blocked,
        }),
      )
    : [];

  let program_action: VolumeAction = "KEEP_VOLUME";
  let reason: VolumeReasonCode = "CURRENT_VOLUME_PRODUCTIVE";
  let confidence: WeeklyVolumeDecision["confidence"] =
    weeks.length >= OBSERVATION_WEEKS ? "MODERATE" : "LOW";
  let delta = 0;
  let observation = false;

  if (!latest || (latest.physicalPrescribed === 0 && latest.physicalCompleted === 0)) {
    program_action = "INSUFFICIENT_DATA";
    reason = "INSUFFICIENT_DATA";
    confidence = "LOW";
  } else if (blocked) {
    program_action = blocked.action;
    reason = blocked.reason;
    confidence = "HIGH";
  } else if (context.safetyRegions?.length) {
    program_action = "SAFETY_REVIEW";
    reason = "SAFETY_BLOCK";
    confidence = "HIGH";
  } else if (
    weeks.length === 1 &&
    latest.hardSetCount >= 4 &&
    (!previous || previous.hardSetCount < 2)
  ) {
    program_action = "KEEP_VOLUME";
    reason = "ONE_HARD_SESSION";
    confidence = "MODERATE";
  } else if (
    globalFatigue === "HIGH" &&
    recovery === "POOR" &&
    latest.completionRate < 0.75 &&
    weeks.length >= OBSERVATION_WEEKS
  ) {
    program_action = "DELOAD_REVIEW";
    reason = "DELOAD_PATTERN_DETECTED";
    confidence = "HIGH";
  } else if (globalFatigue === "HIGH" || recovery === "POOR") {
    program_action = "HOLD_VOLUME_PROGRESSION";
    reason = recovery === "POOR" ? "RECOVERY_LIMITED" : "GLOBAL_FATIGUE_HIGH";
    confidence = "HIGH";
  } else if (conditioningInterference) {
    program_action = "KEEP_VOLUME";
    reason = "CONDITIONING_INTERFERENCE";
    confidence = "MODERATE";
  } else if (
    context.recentLoadIncrease ||
    context.recentProgressionActions?.includes("INCREASE_LOAD")
  ) {
    program_action = "KEEP_VOLUME";
    reason = "LOAD_INCREASE_OBSERVATION";
    observation = true;
    confidence = "MODERATE";
  } else if (
    context.lastVolumeAction?.action === "ADD_SMALL_VOLUME" &&
    (context.lastVolumeAction.validWeeksAgo ?? 0) < OBSERVATION_WEEKS
  ) {
    program_action = "KEEP_VOLUME";
    reason = "VOLUME_COOLDOWN";
    observation = true;
    confidence = "MODERATE";
  } else if (
    context.lastVolumeAction &&
    ((context.lastVolumeAction.action === "ADD_SMALL_VOLUME" &&
      regionStates.some((row) => row.volume_action === "REDUCE_VOLUME")) ||
      (context.lastVolumeAction.action === "REDUCE_VOLUME" &&
        regionStates.some((row) => row.volume_action === "ADD_SMALL_VOLUME"))) &&
    (context.lastVolumeAction.validWeeksAgo ?? 0) < OBSERVATION_WEEKS
  ) {
    program_action = "KEEP_VOLUME";
    reason = "CURRENT_VOLUME_PRODUCTIVE";
    confidence = "LOW";
  } else if (goal.canonicalId === "FAT_LOSS" && recovery !== "GOOD") {
    program_action = "KEEP_VOLUME";
    reason = "FAT_LOSS_KEEP_PERFORMANCE";
    confidence = "MODERATE";
  } else if (context.goalReallocationRequest && recovery !== "POOR") {
    const from = regionStates.find((row) => row.region === context.goalReallocationRequest?.from_region);
    const to = regionStates.find((row) => row.region === context.goalReallocationRequest?.to_region);
    if (from && to) {
      program_action = "REALLOCATE_VOLUME";
      reason = "REALLOCATION_PREFERRED";
      confidence = "MODERATE";
      delta = 0;
      from.volume_action = "REALLOCATE_VOLUME";
      from.recommended_delta = REDUCE_VOLUME_DELTA;
      from.reason_code = "REALLOCATION_PREFERRED";
      to.volume_action = "REALLOCATE_VOLUME";
      to.recommended_delta = ADD_VOLUME_DELTA;
      to.reason_code = "REALLOCATION_PREFERRED";
    } else {
      program_action = "KEEP_VOLUME";
      reason = "CURRENT_VOLUME_PRODUCTIVE";
    }
  } else {
    const primaries = regionStates.filter((row) => row.priority === "PRIMARY");
    const maintenanceHigh = regionStates.filter(
      (row) => row.priority === "MAINTENANCE" && row.effective_volume > 6 && recovery !== "GOOD",
    );
    const primaryNeed = primaries.find(
      (row) =>
        row.performance_trend === "STABLE" &&
        row.local_fatigue === "NONE" &&
        row.completed_volume >= 1 &&
        latest.completionRate >= 0.9,
    );
    if (primaryNeed && maintenanceHigh.length && recovery === "LIMITED") {
      program_action = "REALLOCATE_VOLUME";
      reason = "REALLOCATION_PREFERRED";
      confidence = "MODERATE";
      const maint = regionStates.find((row) => row.region === maintenanceHigh[0].region);
      if (maint) {
        maint.volume_action = "REALLOCATE_VOLUME";
        maint.recommended_delta = REDUCE_VOLUME_DELTA;
        maint.reason_code = "REALLOCATION_PREFERRED";
      }
      primaryNeed.volume_action = "REALLOCATE_VOLUME";
      primaryNeed.recommended_delta = ADD_VOLUME_DELTA;
      primaryNeed.reason_code = "REALLOCATION_PREFERRED";
    } else {
      const add = primaries.find((row) => row.volume_action === "ADD_SMALL_VOLUME");
      const reduce = regionStates.find((row) => row.volume_action === "REDUCE_VOLUME");
      if (reduce && recovery !== "GOOD") {
        program_action = "REDUCE_VOLUME";
        reason = reduce.reason_code;
        delta = REDUCE_VOLUME_DELTA;
        confidence = reduce.confidence;
      } else if (add && recovery !== "LIMITED" && recovery !== "POOR" && globalFatigue === "NONE") {
        program_action = "ADD_SMALL_VOLUME";
        reason = add.reason_code;
        delta = ADD_VOLUME_DELTA;
        confidence = add.confidence;
      } else {
        const productive =
          primaries.find((row) => row.reason_code === "CURRENT_VOLUME_PRODUCTIVE") ??
          regionStates[0];
        program_action = productive?.volume_action ?? "KEEP_VOLUME";
        reason = productive?.reason_code ?? "CURRENT_VOLUME_PRODUCTIVE";
        confidence = productive?.confidence ?? "MODERATE";
      }
    }
  }

  if (goal.canonicalId === "SLIM_TONED_WAIST") {
    for (const row of regionStates) {
      if (
        ["CORE", "RECTUS_ABDOMINIS", "OBLIQUES"].includes(row.region) &&
        row.volume_action === "ADD_SMALL_VOLUME"
      ) {
        row.volume_action = "KEEP_VOLUME";
        row.recommended_delta = 0;
        row.reason_code = "MAINTENANCE_VOLUME_SUFFICIENT";
      }
    }
    if (program_action === "ADD_SMALL_VOLUME") {
      program_action = "KEEP_VOLUME";
      reason = "MAINTENANCE_VOLUME_SUFFICIENT";
      delta = 0;
    }
  }

  const recoveryHold: RecoveryHoldState = toProgressionRecoveryHold({
    recovery,
    deloadActive: context.deloadActive,
    reconditioningActive:
      context.reconditioningActive || context.continuityState === "RECONDITIONING_REQUIRED",
    programAction: program_action,
  });

  return {
    goal_profile: goal.canonicalId,
    recovery_state: recovery,
    recovery_hold: recoveryHold,
    global_fatigue: globalFatigue,
    conditioning_interference: conditioningInterference,
    observation_required: observation,
    coach_override_state: Boolean(context.coachProtected),
    nutrition_signal:
      recovery === "LIMITED" || recovery === "POOR" ? "RECOVERY_LIMITED" : "TRAINING_DEMAND_NORMAL",
    physical_set_count: physical,
    regions: regionStates,
    program_action,
    recommended_delta: delta,
    reason_code: reason,
    confidence,
    metadata_gaps: gaps,
  };
}

export { toProgressionRecoveryHold };
