export type EffortLevel = "easy" | "medium" | "hard";

export type WorkoutSessionMeta = {
  points: number;
  durationMin: number;
  calories: number;
  streakDays: number;
  totalExercises: number;
};

export type WorkoutSessionExercise = {
  id: string;
  external_id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string | null;
  durationSeconds: number | null;
  restSeconds: number;
  restLabel: string;
  suggestedWeightKg: number;
  thumbnailUrl: string | null;
  videoPath: string | null;
  instructionsVideoPath: string | null;
  coachNotes: string | null;
};

export const EFFORT_LABELS: Record<EffortLevel, string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
};

export function formatRestTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatRestLabel(totalSeconds: number) {
  if (totalSeconds >= 60) {
    const max = totalSeconds + 15;
    return `${totalSeconds - 15 > 0 ? totalSeconds - 15 : totalSeconds} - ${max} ثانية`;
  }
  return `${totalSeconds} ثانية`;
}

export function formatExerciseVolume(exercise: Pick<WorkoutSessionExercise, "reps" | "durationSeconds">) {
  if (exercise.reps) return exercise.reps;
  if (exercise.durationSeconds) return `${exercise.durationSeconds} ث`;
  return "—";
}
