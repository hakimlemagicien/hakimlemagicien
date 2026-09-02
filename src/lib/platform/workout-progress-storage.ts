import { TODAY_WORKOUT_PRESCRIPTIONS } from "@/lib/platform/today-workout";
import type { EffortLevel } from "@/lib/platform/workout-session";
import type { TrainingV2Effort } from "@/lib/platform/training-v2-contracts";
import type { WorkoutSetType } from "@/lib/platform/training-v2-contracts";
import type { WallClockRest } from "@/lib/platform/workout-runtime/wall-clock-rest";

export type StoredExerciseProgress = {
  completedSets: number;
  status: "active" | "done" | "pending";
};

export type StoredSetLog = {
  exerciseExternalId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  durationSeconds?: number | null;
  effort: EffortLevel | null;
  effortV2?: TrainingV2Effort | null;
  notes: string;
  skipped: boolean;
  setCompleted?: boolean;
  setType?: WorkoutSetType;
  prescribedLoad?: number | null;
  prescribedRepsMin?: number | null;
  prescribedRepsMax?: number | null;
  prescribedDurationSeconds?: number | null;
  prescribedRestSeconds?: number | null;
  actualRestSeconds?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  syncStatus?: "SAVED" | "PENDING_SYNC";
  loggedAt: string;
};

export type StoredWorkoutSession = {
  version: 2 | 3;
  sessionKey: string;
  sessionId?: string | null;
  exerciseIndex: number;
  progress: StoredExerciseProgress[];
  setLogs: StoredSetLog[];
  rest?: WallClockRest | null;
  hydrationLastShownAt?: string | null;
  startedAt?: string | null;
  updatedAt: string;
};

const STORAGE_KEY = "hakim:today-workout-session:v2";
const LEGACY_STORAGE_KEY = "hakim:today-workout-progress:v1";
export const WORKOUT_STORAGE_KEYS = {
  SESSION: STORAGE_KEY,
  LEGACY_PROGRESS: LEGACY_STORAGE_KEY,
  PENDING_SETS: "hakim:workout-pending-sets:v1",
} as const;

export function getTodayWorkoutSessionKey(externalIds?: string[]): string {
  const date = new Date().toISOString().slice(0, 10);
  const ids = (externalIds ?? TODAY_WORKOUT_PRESCRIPTIONS.map((item) => item.external_id)).join(",");
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
        (parsed?.version === 2 || parsed?.version === 3) &&
        parsed.sessionKey === sessionKey &&
        Array.isArray(parsed.progress) &&
        parsed.progress.length === length
      ) {
        return {
          ...parsed,
          version: 3,
          setLogs: Array.isArray(parsed.setLogs) ? parsed.setLogs : [],
          exerciseIndex: Math.min(Math.max(parsed.exerciseIndex ?? 0, 0), length - 1),
          rest: parsed.rest ?? null,
        };
      }
    }
  } catch {
    // fall through to legacy migration
  }

  const legacy = readLegacyProgress(length);
  if (!legacy) return null;

  return {
    version: 3,
    sessionKey,
    exerciseIndex: 0,
    progress: legacy,
    setLogs: [],
    rest: null,
    updatedAt: new Date().toISOString(),
  };
}

export function loadWorkoutProgress(length: number, externalIds?: string[]): StoredExerciseProgress[] | null {
  const sessionKey = getTodayWorkoutSessionKey(externalIds);
  return loadWorkoutSession(sessionKey, length)?.progress ?? null;
}

export function peekStoredWorkoutSession(): StoredWorkoutSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredWorkoutSession;
    if (parsed?.version !== 2 && parsed?.version !== 3) return null;
    if (!Array.isArray(parsed.progress) || parsed.progress.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isStoredWorkoutInterrupted(session: StoredWorkoutSession | null): boolean {
  if (!session) return false;
  const finished = session.progress.every((item) => item.status === "done");
  if (finished) return false;
  const progressed =
    session.progress.some((item) => item.completedSets > 0 || item.status === "done") ||
    (Array.isArray(session.setLogs) && session.setLogs.length > 0) ||
    Boolean(session.startedAt);
  return progressed;
}

export function saveWorkoutSession(state: StoredWorkoutSession) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        version: 3,
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
  extra: Partial<StoredWorkoutSession> = {},
) {
  saveWorkoutSession({
    version: 3,
    sessionKey,
    exerciseIndex,
    progress,
    setLogs,
    updatedAt: new Date().toISOString(),
    ...extra,
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
