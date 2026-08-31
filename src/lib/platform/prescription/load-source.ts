import type { ExerciseSetHistoryItem, PrescriptionState } from "@/lib/platform/training-v2-contracts";
import { isWorkingSetHistoryRow } from "@/lib/platform/training-v2-contracts";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import { LARGE_RELATIVE_INCREMENT, RECENT_HISTORY_DAYS, type LoadSource } from "./types";

function daysBetween(isoDate: string, now: Date): number {
  const stamp = Date.parse(`${isoDate.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(stamp)) return Number.POSITIVE_INFINITY;
  return Math.abs((now.getTime() - stamp) / 86_400_000);
}

export function completedWorkingHistory(history: ExerciseSetHistoryItem[] | undefined) {
  return (history ?? []).filter(
    (row) => isWorkingSetHistoryRow(row) && row.setCompleted !== false && !row.skipped,
  );
}

export function latestValidLoad(history: ExerciseSetHistoryItem[] | undefined, now = new Date()) {
  const rows = completedWorkingHistory(history)
    .filter((row) => row.actualLoad != null && row.actualLoad > 0)
    .sort((a, b) => Date.parse(b.createdAt || b.sessionDate) - Date.parse(a.createdAt || a.sessionDate));
  const latest = rows[0];
  if (!latest || latest.actualLoad == null) return null;
  const age = daysBetween(latest.sessionDate || latest.createdAt, now);
  return { load: latest.actualLoad, ageDays: age, recent: age <= RECENT_HISTORY_DAYS };
}

export function resolveLoadSource(input: {
  exercise: ExerciseV2Metadata;
  history?: ExerciseSetHistoryItem[];
  prescriptionState?: PrescriptionState | null;
  now?: Date;
}): {
  load_source: LoadSource;
  prescribed_load: number | null;
  history_reference_load: number | null;
} {
  const mode = input.exercise.prescription_mode;
  if (mode === "DURATION" || mode === "INTERVAL" || mode === "DISTANCE") {
    return { load_source: "NO_LOAD", prescribed_load: null, history_reference_load: null };
  }
  if (input.exercise.is_bodyweight === true || input.exercise.loading_type === "BODYWEIGHT") {
    const history = latestValidLoad(input.history, input.now);
    return {
      load_source: "BODYWEIGHT",
      prescribed_load: null,
      history_reference_load: history?.load ?? null,
    };
  }

  const history = latestValidLoad(input.history, input.now);
  if (input.prescriptionState === "RECONDITIONING") {
    return {
      load_source: "RECONDITIONING_HISTORY",
      prescribed_load: null,
      history_reference_load: history?.load ?? null,
    };
  }
  if (history?.recent) {
    return {
      load_source: "RECENT_HISTORY",
      prescribed_load: history.load,
      history_reference_load: history.load,
    };
  }
  if (history && !history.recent) {
    return {
      load_source: "UNKNOWN_REQUIRES_CALIBRATION",
      prescribed_load: null,
      history_reference_load: history.load,
    };
  }
  return {
    load_source: "UNKNOWN_REQUIRES_CALIBRATION",
    prescribed_load: null,
    history_reference_load: null,
  };
}

export function incrementIsSafe(currentLoad: number, incrementKg: number) {
  if (!(currentLoad > 0) || !(incrementKg > 0)) return false;
  return incrementKg / currentLoad <= LARGE_RELATIVE_INCREMENT;
}
