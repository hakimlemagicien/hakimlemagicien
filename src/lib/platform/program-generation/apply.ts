import type { ProgramCandidate } from "./types";
import type { ContinuityProgramDay } from "@/lib/platform/continuity/types";

export function programDiff(previous: ProgramCandidate | null | undefined, next: ProgramCandidate | null) {
  const before = new Set((previous?.sessions ?? []).flatMap((session) => session.exercises.map((item) => item.external_id)));
  const after = new Set((next?.sessions ?? []).flatMap((session) => session.exercises.map((item) => item.external_id)));
  return {
    retained: [...after].filter((id) => before.has(id)).sort(),
    added: [...after].filter((id) => !before.has(id)).sort(),
    removed: [...before].filter((id) => !after.has(id)).sort(),
  };
}

export function cloneCandidate(candidate: ProgramCandidate): ProgramCandidate {
  return JSON.parse(JSON.stringify(candidate)) as ProgramCandidate;
}

export function toContinuityProgramDays(candidate: ProgramCandidate): ContinuityProgramDay[] {
  return candidate.sessions.map((session) => ({
    programDayId: session.program_day_id,
    sequenceIndex: session.sequence_index,
    dayNumber: session.sequence_index + 1,
    dayType: "workout",
    title: session.title,
    primaryRegions: session.primary_regions,
    exercises: session.exercises.map((item) => ({
      externalId: item.external_id,
      prescribedSets: item.sets,
      priority:
        item.muscle_priority === "PRIMARY" || item.exercise_priority === "REQUIRED" || item.exercise_priority === "HIGH"
          ? "PRIMARY"
          : item.exercise_priority === "OPTIONAL"
            ? "OPTIONAL"
            : "IMPORTANT",
    })),
    estimatedMinutes: session.estimated_minutes,
    demand: session.role.includes("PRIORITY") || session.role === "PULL_POSTERIOR" || session.role === "FULL_BODY" ? "HIGH" : session.role === "CORE_SUPPORT" ? "LOW" : "MODERATE",
  }));
}
