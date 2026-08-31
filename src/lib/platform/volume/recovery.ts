import type { ReadinessSlice, RecoveryCapacityState } from "./types";
import type { WeekAggregate } from "./aggregate";
import type { RecoveryHoldState } from "@/lib/platform/progression/types";

/** Categorical mapping only. Never average into a fake Recovery = 83%. */
export function recoveryFromReadiness(
  slices: ReadinessSlice[] | undefined,
): RecoveryCapacityState | null {
  if (!slices?.length) return null;
  const recent = slices.slice(-3);
  if (recent.some((row) => row.body === "pain")) return "LIMITED";
  const poor = recent.filter(
    (row) => row.energy === "low" || row.sleep === "poor" || row.body === "fatigued",
  ).length;
  if (poor >= 3) return "POOR";
  if (poor >= 2) return "LIMITED";
  if (
    recent.every(
      (row) => row.energy === "high" && (row.sleep === "good" || !row.sleep) && row.body === "good",
    )
  ) {
    return "GOOD";
  }
  return "NORMAL";
}

export function recoveryFromTraining(weeks: WeekAggregate[]): RecoveryCapacityState {
  if (!weeks.length) return "INSUFFICIENT_DATA";
  const latest = weeks[weeks.length - 1];
  const prev = weeks.length > 1 ? weeks[weeks.length - 2] : null;
  const completionDrop = prev
    ? latest.completionRate + 0.2 < prev.completionRate && latest.completionRate < 0.7
    : false;
  const hardShare =
    latest.physicalCompleted > 0 ? latest.hardSetCount / latest.physicalCompleted : 0;
  if (completionDrop && hardShare >= 0.5) return "POOR";
  if (latest.completionRate < 0.65 && hardShare >= 0.4) return "LIMITED";
  if (latest.completionRate >= 0.9 && hardShare < 0.35) return "NORMAL";
  return "NORMAL";
}

export function combineRecovery(
  fromReadiness: RecoveryCapacityState | null,
  fromTraining: RecoveryCapacityState,
): RecoveryCapacityState {
  const rank: RecoveryCapacityState[] = ["INSUFFICIENT_DATA", "GOOD", "NORMAL", "LIMITED", "POOR"];
  const worse = (a: RecoveryCapacityState, b: RecoveryCapacityState) =>
    rank.indexOf(a) >= rank.indexOf(b) ? a : b;
  if (!fromReadiness || fromReadiness === "INSUFFICIENT_DATA") return fromTraining;
  if (fromTraining === "INSUFFICIENT_DATA") return fromReadiness;
  return worse(fromReadiness, fromTraining);
}

export function toProgressionRecoveryHold(input: {
  recovery: RecoveryCapacityState;
  deloadActive?: boolean;
  reconditioningActive?: boolean;
  programAction?: string;
}): RecoveryHoldState {
  if (input.deloadActive) return "DELOAD_ACTIVE";
  if (input.programAction === "DELOAD_REVIEW") return "PROGRESSION_HOLD";
  if (input.reconditioningActive || input.programAction === "RECONDITIONING")
    return "PROGRESSION_HOLD";
  if (input.recovery === "POOR" || input.recovery === "LIMITED") return "RECOVERY_LIMITED";
  return "NORMAL";
}
