import type { ExerciseSetHistoryItem, TrainingV2Effort } from "@/lib/platform/training-v2-contracts";
import type { VolumeSetInput, PrescribedVolumeInput } from "@/lib/platform/volume/types";
import type { ContinuityProgramDay, ContinuitySessionFact } from "@/lib/platform/continuity/types";

export function historySession(
  sessionId: string,
  date: string,
  reps: number[],
  extra: { load?: number; effort?: TrainingV2Effort } = {},
): ExerciseSetHistoryItem[] {
  return reps.map((rep, index) => ({
    id: `${sessionId}-${index + 1}`,
    workoutSessionId: sessionId,
    sessionDate: date,
    setNumber: index + 1,
    setType: "WORKING",
    prescribedLoad: extra.load ?? 50,
    actualLoad: extra.load ?? 50,
    prescribedRepsMin: 8,
    prescribedRepsMax: 12,
    actualReps: rep,
    actualDurationSeconds: null,
    effort: extra.effort === "EASY" ? "easy" : extra.effort === "VERY_HARD" || extra.effort === "FAILURE" ? "hard" : "medium",
    effortV2: extra.effort ?? "IDEAL",
    skipped: false,
    setCompleted: true,
    createdAt: `${date}T10:00:00.000Z`,
  }));
}

export function volumeWorking(
  weekKey: string,
  date: string,
  externalId: string,
  count: number,
  extra: Partial<VolumeSetInput> = {},
): VolumeSetInput[] {
  return Array.from({ length: count }, () => ({
    weekKey,
    sessionDate: date,
    externalId,
    setType: "WORKING",
    skipped: false,
    setCompleted: true,
    effortV2: extra.effortV2 ?? "IDEAL",
    actualReps: extra.actualReps ?? 10,
    actualLoad: extra.actualLoad ?? 50,
    prescribedRestSeconds: 90,
    actualRestSeconds: 90,
    ...extra,
  }));
}

export function volumePrescribed(weekKey: string, externalId: string, workingSets: number): PrescribedVolumeInput {
  return { weekKey, externalId, workingSets };
}

export function continuityDay(
  id: string,
  index: number,
  title: string,
  regions: string[],
  extras: Array<{ externalId: string; prescribedSets: number; priority: "PRIMARY" | "IMPORTANT" | "SUPPORT" | "OPTIONAL" }>,
): ContinuityProgramDay {
  return {
    programDayId: id,
    sequenceIndex: index,
    dayNumber: index + 1,
    dayType: "workout",
    title,
    primaryRegions: regions,
    exercises: extras,
    estimatedMinutes: 45,
    demand: index === 0 ? "HIGH" : "MODERATE",
  };
}

export function continuityFact(
  partial: Partial<ContinuitySessionFact> & Pick<ContinuitySessionFact, "id" | "status" | "sessionDate">,
): ContinuitySessionFact {
  return {
    assignmentId: "asn-1",
    programDayId: partial.programDayId ?? "day-a",
    startedAt: `${partial.sessionDate}T08:00:00.000Z`,
    lastActivityAt: `${partial.sessionDate}T09:00:00.000Z`,
    completedAt: partial.status === "COMPLETED" ? `${partial.sessionDate}T09:00:00.000Z` : null,
    prescribedWorkingSets: 8,
    completedWorkingSets: partial.status === "COMPLETED" ? 8 : partial.completedWorkingSets ?? 0,
    prescribedExercises: 3,
    completedExercises: partial.status === "COMPLETED" ? 3 : 0,
    meaningfulWorkingExposure: partial.meaningfulWorkingExposure ?? partial.status === "COMPLETED",
    ...partial,
  };
}
