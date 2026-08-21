import type {
  ClientTrainingLevel,
  ExerciseExperienceState,
  ExerciseSetHistoryItem,
} from "@/lib/platform/training-v2-contracts";
import { isWorkingSetHistoryRow } from "@/lib/platform/training-v2-contracts";

function distinctSessionDates(history: ExerciseSetHistoryItem[]) {
  return new Set(
    history
      .filter((row) => isWorkingSetHistoryRow(row) && row.setCompleted !== false && !row.skipped)
      .map((row) => row.sessionDate.slice(0, 10)),
  );
}

export function deriveExerciseExperienceState(history: ExerciseSetHistoryItem[] | undefined): ExerciseExperienceState {
  const sessions = distinctSessionDates(history ?? []).size;
  if (sessions <= 0) return "NEW";
  if (sessions <= 2) return "CALIBRATING";
  if (sessions <= 5) return "FAMILIAR";
  return "ESTABLISHED";
}

export function baselineEstablished(history: ExerciseSetHistoryItem[] | undefined): boolean {
  const rows = (history ?? []).filter(
    (row) =>
      isWorkingSetHistoryRow(row) &&
      row.setCompleted === true &&
      !row.skipped &&
      row.effortV2 !== "FAILURE" &&
      (row.actualReps != null || row.actualLoad != null),
  );
  return rows.length >= 2 && distinctSessionDates(rows).size >= 1;
}

export function deriveTrainingLevel(input: {
  current: ClientTrainingLevel;
  establishedExerciseCount: number;
  completedWorkingSets: number;
}): ClientTrainingLevel {
  if (input.current === "INTERMEDIATE") return "INTERMEDIATE";
  if (input.current === "BEGINNER") return "BEGINNER";
  if (input.establishedExerciseCount >= 2 && input.completedWorkingSets >= 6) return "BEGINNER";
  return "UNASSESSED";
}
