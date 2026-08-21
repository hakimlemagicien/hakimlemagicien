import { isWorkingSetHistoryRow } from "@/lib/platform/training-v2-contracts";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import { exerciseContributions, isConditioningExercise, isLowerBodyDemand } from "./contribution";
import type { PrescribedVolumeInput, VolumeSetInput } from "./types";

export function isCountableWorkingSet(set: VolumeSetInput) {
  return (
    !set.cancelled &&
    isWorkingSetHistoryRow({ setType: set.setType, skipped: set.skipped }) &&
    set.setCompleted &&
    set.skipped !== true
  );
}

export function weekKeys(sets: VolumeSetInput[], prescribed: PrescribedVolumeInput[]) {
  return [
    ...new Set([...sets.map((row) => row.weekKey), ...prescribed.map((row) => row.weekKey)]),
  ].sort();
}

export type RegionWeekStats = {
  region: string;
  prescribed: number;
  completedPhysical: number;
  effective: number;
  hardEffort: number;
  failureEffort: number;
  medianLoad: number | null;
  medianReps: number | null;
  shortRest: number;
  longRest: number;
  restSamples: number;
};

export type WeekAggregate = {
  weekKey: string;
  physicalCompleted: number;
  physicalPrescribed: number;
  completionRate: number;
  region: Record<string, RegionWeekStats>;
  conditioningCompleted: number;
  lowerBodyConditioningCompleted: number;
  metadataGaps: string[];
  sessionDates: string[];
  hardSetCount: number;
};

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function ensureRegion(map: Record<string, RegionWeekStats>, region: string): RegionWeekStats {
  if (!map[region]) {
    map[region] = {
      region,
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
  }
  return map[region];
}

export function aggregateWeek(
  weekKey: string,
  sets: VolumeSetInput[],
  prescribed: PrescribedVolumeInput[],
  exercises: Record<string, ExerciseV2Metadata>,
): WeekAggregate {
  const weekSets = sets.filter((row) => row.weekKey === weekKey);
  const weekPrescribed = prescribed.filter((row) => row.weekKey === weekKey);
  const region: Record<string, RegionWeekStats> = {};
  const metadataGaps: string[] = [];
  const loadsByRegion: Record<string, number[]> = {};
  const repsByRegion: Record<string, number[]> = {};

  for (const item of weekPrescribed) {
    const meta = exercises[item.externalId];
    const { contributions, metadataRequired } = exerciseContributions(meta);
    if (metadataRequired) metadataGaps.push(item.externalId);
    for (const row of contributions) {
      if (row.weight <= 0) continue;
      ensureRegion(region, row.muscle).prescribed += item.workingSets * row.weight;
    }
  }

  let physicalCompleted = 0;
  let conditioningCompleted = 0;
  let lowerBodyConditioningCompleted = 0;
  let hardSetCount = 0;

  for (const set of weekSets) {
    if (set.setType === "WARMUP") continue;
    const meta = exercises[set.externalId];
    const { contributions, metadataRequired } = exerciseContributions(meta);
    if (metadataRequired) metadataGaps.push(set.externalId);
    if (!isCountableWorkingSet(set)) continue;
    physicalCompleted += 1;
    if (isConditioningExercise(meta)) {
      conditioningCompleted += 1;
      if (isLowerBodyDemand(meta)) lowerBodyConditioningCompleted += 1;
    }
    if (set.effortV2 === "VERY_HARD" || set.effortV2 === "FAILURE") hardSetCount += 1;
    const countedPhysical = new Set<string>();
    for (const row of contributions) {
      if (row.weight <= 0) continue;
      const stats = ensureRegion(region, row.muscle);
      stats.effective += row.weight;
      if (row.role === "DIRECT_PRIMARY" && !countedPhysical.has(row.muscle)) {
        stats.completedPhysical += 1;
        countedPhysical.add(row.muscle);
        if (set.actualLoad != null) (loadsByRegion[row.muscle] ??= []).push(set.actualLoad);
        if (set.actualReps != null) (repsByRegion[row.muscle] ??= []).push(set.actualReps);
      }
      if (set.effortV2 === "VERY_HARD") stats.hardEffort += 1;
      if (set.effortV2 === "FAILURE") stats.failureEffort += 1;
      if (set.prescribedRestSeconds && set.actualRestSeconds != null) {
        stats.restSamples += 1;
        if (set.actualRestSeconds < set.prescribedRestSeconds * 0.6) stats.shortRest += 1;
        if (set.actualRestSeconds > set.prescribedRestSeconds * 2.5) stats.longRest += 1;
      }
    }
  }

  for (const stats of Object.values(region)) {
    stats.medianLoad = median(loadsByRegion[stats.region] ?? []);
    stats.medianReps = median(repsByRegion[stats.region] ?? []);
  }

  const physicalPrescribed = weekPrescribed.reduce((sum, row) => sum + row.workingSets, 0);
  return {
    weekKey,
    physicalCompleted,
    physicalPrescribed,
    completionRate: physicalPrescribed > 0 ? physicalCompleted / physicalPrescribed : 0,
    region,
    conditioningCompleted,
    lowerBodyConditioningCompleted,
    metadataGaps: [...new Set(metadataGaps)],
    sessionDates: [...new Set(weekSets.map((row) => row.sessionDate))],
    hardSetCount,
  };
}

export function aggregateWeeks(
  sets: VolumeSetInput[],
  prescribed: PrescribedVolumeInput[],
  exercises: Record<string, ExerciseV2Metadata>,
): WeekAggregate[] {
  return weekKeys(sets, prescribed).map((key) => aggregateWeek(key, sets, prescribed, exercises));
}
