import type { ContinuityProgramDay } from "./types";

export function workoutSequence(days: ContinuityProgramDay[]): ContinuityProgramDay[] {
  return days
    .filter((day) => day.dayType === "workout" && day.exercises.length > 0)
    .slice()
    .sort((a, b) => a.sequenceIndex - b.sequenceIndex || a.dayNumber - b.dayNumber);
}

export function nextAfter(sequence: ContinuityProgramDay[], programDayId: string | null): ContinuityProgramDay | null {
  if (sequence.length === 0) return null;
  if (!programDayId) return sequence[0] ?? null;
  const index = sequence.findIndex((day) => day.programDayId === programDayId);
  if (index < 0) return sequence[0] ?? null;
  return sequence[(index + 1) % sequence.length] ?? null;
}

export function findDay(days: ContinuityProgramDay[], programDayId: string | null): ContinuityProgramDay | null {
  if (!programDayId) return null;
  return days.find((day) => day.programDayId === programDayId) ?? null;
}

export function regionsOverlap(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const set = new Set(a.map((item) => item.toUpperCase()));
  return b.some((item) => set.has(item.toUpperCase()));
}

export function sessionDemand(day: ContinuityProgramDay): "LOW" | "MODERATE" | "HIGH" {
  if (day.demand) return day.demand;
  const sets = day.exercises.reduce((sum, exercise) => sum + exercise.prescribedSets, 0);
  if (sets >= 14 || (day.estimatedMinutes ?? 0) >= 50) return "HIGH";
  if (sets <= 6) return "LOW";
  return "MODERATE";
}
