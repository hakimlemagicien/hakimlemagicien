import type { ExerciseMediaStatus } from "@/lib/platform/exercise-media";

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
  videoStatus: ExerciseMediaStatus;
  videoPath: string | null;
  instructionsStatus: ExerciseMediaStatus;
  instructionsVideoPath: string | null;
  coachNotes: string | null;
  assignmentId?: string;
  assignmentExerciseId?: string;
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

/** Placeholder load rule — later replaced by per-goal progression. */
export const SET_WEIGHT_INCREMENT = 0.1;

export const SET_REP_RANGES = [
  { min: 15, max: 20 },
  { min: 12, max: 15 },
  { min: 10, max: 12 },
  { min: 8, max: 10 },
] as const;

export type SetProgression = {
  setNumber: number;
  weightKg: number;
  reps: number;
  repsMin: number;
  repsMax: number;
};

export function getSetRepRange(setNumber: number) {
  const index = Math.min(Math.max(setNumber, 1), SET_REP_RANGES.length) - 1;
  return SET_REP_RANGES[index];
}

export function formatRepRange(range: { min: number; max: number }) {
  return `${range.min}–${range.max}`;
}

export function roundWeightKg(kg: number, step = 0.5) {
  if (kg <= 0) return 0;
  return Math.round(kg / step) * step;
}

export function formatWeightKg(kg: number) {
  if (kg <= 0) return "—";
  const rounded = roundWeightKg(kg);
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

export function getSetProgression(input: {
  setNumber: number;
  baseWeightKg: number;
  lastWeightKg?: number | null;
}): SetProgression {
  const setNumber = Math.max(1, Math.floor(input.setNumber));
  const step = setNumber - 1;
  const fromLast =
    input.lastWeightKg != null && input.lastWeightKg > 0
      ? input.lastWeightKg * (1 + SET_WEIGHT_INCREMENT)
      : input.baseWeightKg > 0
        ? input.baseWeightKg * (1 + SET_WEIGHT_INCREMENT) ** step
        : 0;
  const range = getSetRepRange(setNumber);

  return {
    setNumber,
    weightKg: roundWeightKg(fromLast),
    reps: range.max,
    repsMin: range.min,
    repsMax: range.max,
  };
}
