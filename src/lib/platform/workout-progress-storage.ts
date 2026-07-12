import { TODAY_WORKOUT_PRESCRIPTIONS } from "@/lib/platform/today-workout";
import type { EffortLevel } from "@/lib/platform/workout-session";

export type StoredExerciseProgress = {
  completedSets: number;
  status: "active" | "done" | "pending";
};

export type StoredSetLog = {
  exerciseExternalId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  effort: EffortLevel;
  notes: string;
  skipped: boolean;
  loggedAt: string;
};

export type StoredWorkoutSession = {
  version: 2;
  sessionKey: string;
  exerciseIndex: number;
  progress: StoredExerciseProgress[];
  setLogs: StoredSetLog[];
  updatedAt: string;
};

const STORAGE_KEY = "hakim:today-workout-session:v2";
const LEGACY_STORAGE_KEY = "hakim:today-workout-progress:v1";

export function getTodayWorkoutSessionKey(): string {
  const date = new Date().toISOString().slice(0, 10);
  const ids = TODAY_WORKOUT_PRESCRIPTIONS.map((item) => item.external_id).join(",");
  return `${date}::${ids}`;
}

function readLegacyProgress(length: number): StoredExerciseProgress[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredExerciseProgress[];
    if (!Array.isArray(parsed) || parsed.length !== length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function loadWorkoutSession(
  sessionKey: string,
  length: number,
): StoredWorkoutSession | null {
  if (typeof window === "undefined" || length === 0) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredWorkoutSession;
      if (
        parsed?.version === 2 &&
        parsed.sessionKey === sessionKey &&
        Array.isArray(parsed.progress) &&
        parsed.progress.length === length
      ) {
        return {
          ...parsed,
          setLogs: Array.isArray(parsed.setLogs) ? parsed.setLogs : [],
          exerciseIndex: Math.min(Math.max(parsed.exerciseIndex ?? 0, 0), length - 1),
        };
      }
    }
  } catch {
    // fall through to legacy migration
  }

  const legacy = readLegacyProgress(length);
  if (!legacy) return null;

  return {
    version: 2,
    sessionKey,
    exerciseIndex: 0,
    progress: legacy,
    setLogs: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadWorkoutProgress(length: number): StoredExerciseProgress[] | null {
  const sessionKey = getTodayWorkoutSessionKey();
  return loadWorkoutSession(sessionKey, length)?.progress ?? null;
}

export function saveWorkoutSession(state: StoredWorkoutSession) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // ignore quota / private mode
  }
}

export function saveWorkoutProgress(
  sessionKey: string,
  exerciseIndex: number,
  progress: StoredExerciseProgress[],
  setLogs: StoredSetLog[],
) {
  saveWorkoutSession({
    version: 2,
    sessionKey,
    exerciseIndex,
    progress,
    setLogs,
    updatedAt: new Date().toISOString(),
  });
}

export function clearWorkoutSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
