import type {
  ExerciseSetHistoryItem,
  TrainingV2Effort,
} from "@/lib/platform/training-v2-contracts";
import { isWorkingSetHistoryRow } from "@/lib/platform/training-v2-contracts";

export type ProgressionExposure = {
  sessionDate: string;
  sessionId: string | null;
  sets: ExerciseSetHistoryItem[];
  load: number | null;
  reps: number[];
  durations: number[];
  efforts: Array<TrainingV2Effort | null>;
};

export function validWorkingSets(history: ExerciseSetHistoryItem[] | undefined) {
  return (history ?? []).filter((row) => isWorkingSetHistoryRow(row) && row.setCompleted !== false);
}

export function groupExposures(
  history: ExerciseSetHistoryItem[] | undefined,
): ProgressionExposure[] {
  const map = new Map<string, ExerciseSetHistoryItem[]>();
  for (const row of validWorkingSets(history)) {
    const key = row.workoutSessionId || row.sessionDate.slice(0, 10);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  const exposures: ProgressionExposure[] = [];
  for (const [key, sets] of map) {
    const ordered = [...sets].sort((a, b) => a.setNumber - b.setNumber);
    const loads = ordered
      .map((row) => row.actualLoad)
      .filter((value): value is number => value != null);
    const reps = ordered
      .map((row) => row.actualReps)
      .filter((value): value is number => value != null);
    const durations = ordered
      .map((row) => row.actualDurationSeconds)
      .filter((value): value is number => value != null);
    exposures.push({
      sessionDate: ordered[0]?.sessionDate ?? key,
      sessionId: ordered[0]?.workoutSessionId ?? null,
      sets: ordered,
      load: loads.length ? loads[loads.length - 1] : null,
      reps,
      durations,
      efforts: ordered.map((row) => row.effortV2 ?? null),
    });
  }
  return exposures.sort(
    (a, b) =>
      Date.parse(a.sessionDate) - Date.parse(b.sessionDate) ||
      (a.sessionId ?? "").localeCompare(b.sessionId ?? ""),
  );
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function allAtOrAbove(values: number[], target: number) {
  return values.length > 0 && values.every((value) => value >= target);
}

export function majorityBelow(values: number[], target: number) {
  if (!values.length) return false;
  return values.filter((value) => value < target).length > values.length / 2;
}

export function effortTooHard(efforts: Array<TrainingV2Effort | null>) {
  const known = efforts.filter((value): value is TrainingV2Effort => value != null);
  if (!known.length) return false;
  return (
    known.every((value) => value === "VERY_HARD" || value === "FAILURE") ||
    known.filter((value) => value === "FAILURE").length >= Math.ceil(known.length / 2)
  );
}

export function effortAcceptableForIncrease(efforts: Array<TrainingV2Effort | null>) {
  const known = efforts.filter((value): value is TrainingV2Effort => value != null);
  if (!known.length) return false;
  return known.every((value) => value === "IDEAL" || value === "EASY");
}

export function effortMissing(efforts: Array<TrainingV2Effort | null>) {
  return efforts.length === 0 || efforts.every((value) => value == null);
}

export function largeSetDrop(reps: number[]) {
  if (reps.length < 2) return false;
  return reps[0] - reps[reps.length - 1] >= 6;
}
