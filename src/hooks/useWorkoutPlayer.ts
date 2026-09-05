import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EFFORT_LABELS,
  getSetProgression,
  type EffortLevel,
  type WorkoutSessionExercise,
  type WorkoutSessionMeta,
} from "@/lib/platform/workout-session";
import { markWorkoutCompleted } from "@/lib/platform/platform-activity";
import { supabase } from "@/integrations/supabase/client";
import {
  clearWorkoutSession,
  getTodayWorkoutSessionKey,
  loadWorkoutSession,
  saveWorkoutProgress,
  type StoredExerciseProgress,
  type StoredSetLog,
} from "@/lib/platform/workout-progress-storage";
import {
  flushPendingWorkoutSetLogs,
  insertSafetySignal,
  listOwnSetLogsForDate,
  upsertWorkoutSetLog,
} from "@/lib/platform/workout-set-logs-api";
import {
  ensureExerciseExperience,
  ensureTrainingLevel,
  ensureWorkoutSession,
  getActiveWorkoutSession,
  listExerciseSetHistory,
  updateWorkoutSessionStatus,
  type WorkoutSessionRecord,
} from "@/lib/platform/training-v2-api";
import { getCoreExercisePrescription, getCalibrationAdjustment } from "@/lib/platform/prescription";
import { getNextSessionProgression, excludeCurrentSession } from "@/lib/platform/progression";
import type { RecoveryHoldState } from "@/lib/platform/progression/types";
import {
  parseProgressionStrategy,
  progressionForRuntime,
  type ProgressionStrategy,
} from "@/lib/platform/progression-strategy";
import type { CoreExercisePrescription } from "@/lib/platform/prescription";
import type { CalibrationAction } from "@/lib/platform/prescription/types";
import { fetchExercisesV2ByExternalIds } from "@/lib/platform/exercise-library-v2-api";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import type {
  ExerciseSetHistoryItem,
  PrescriptionState,
  TrainingV2Effort,
} from "@/lib/platform/training-v2-contracts";
import {
  createWallClockRest,
  extendWallClockRest,
  remainingRestSeconds,
  restElapsedSeconds,
  type WallClockRest,
} from "@/lib/platform/workout-runtime/wall-clock-rest";
import { V2_EFFORT_LABELS_AR, effortV2ToLegacy } from "@/lib/platform/workout-runtime/effort";
import {
  nextLoadAfterCalibration,
  DEFAULT_LOADED_INCREMENT_KG,
} from "@/lib/platform/workout-runtime/calibration-runtime";
import { shouldShowHydrationReminder } from "@/lib/platform/workout-runtime/hydration";
import { loadForPersistence, validateSetWrite } from "@/lib/platform/workout-runtime/set-result";
import { parseRepsLabel } from "@/lib/platform/workout-runtime/parse-reps";
import { primeWorkoutAudio } from "@/lib/platform/workout-runtime/audio";
import { trackTrainingEvent } from "@/lib/platform/training-progress/analytics";
import { runClientLoopAfterSession } from "@/lib/platform/client-loop";

export type ExerciseRunStatus = "active" | "done" | "pending";
export type PlayerPhase = "exercise" | "set-sheet" | "rest" | "complete";
export type WorkoutRuntimeMode = "v2" | "legacy_free";

export type ExerciseRunState = {
  completedSets: number;
  status: ExerciseRunStatus;
};

export type SetLogDraft = {
  weightKg: number;
  reps: number;
  durationSeconds: number;
  effort: EffortLevel;
  effortV2: TrainingV2Effort;
  notes: string;
  safetyFlag: boolean;
};

export type WorkoutPlayerOptions = {
  runtimeMode?: WorkoutRuntimeMode;
  goalId?: string | null;
  assignmentId?: string | null;
  /** Phase 7 recovery/deload gate. Phase 6 consumes this; the player does not recompute weekly volume. */
  recoveryHold?: RecoveryHoldState;
  /** Phase 8 continuity → Phase 4 prescription_state. Does not change training_level. */
  prescriptionState?: PrescriptionState | null;
  progressionStrategy?: ProgressionStrategy | string | null;
};

function createInitialProgress(
  exercises: WorkoutSessionExercise[],
  initialExerciseIndex: number,
  sessionKey: string,
): {
  progress: ExerciseRunState[];
  exerciseIndex: number;
  setLogs: StoredSetLog[];
  rest: WallClockRest | null;
  sessionId: string | null;
  startedAt: string | null;
  hydrationLastShownAt: string | null;
} {
  const stored = loadWorkoutSession(sessionKey, exercises.length);
  if (stored) {
    const allDone = stored.progress.every((item) => item.status === "done");
    return {
      progress: stored.progress.map((item) => ({
        completedSets: item.completedSets,
        status: item.status,
      })),
      exerciseIndex: stored.exerciseIndex,
      setLogs: stored.setLogs,
      rest: allDone ? null : (stored.rest ?? null),
      sessionId: stored.sessionId ?? null,
      startedAt: stored.startedAt ?? null,
      hydrationLastShownAt: stored.hydrationLastShownAt ?? null,
    };
  }

  return {
    progress: exercises.map((_, index) => ({
      completedSets: 0,
      status:
        index === initialExerciseIndex
          ? "active"
          : index < initialExerciseIndex
            ? "done"
            : "pending",
    })),
    exerciseIndex: initialExerciseIndex,
    setLogs: [],
    rest: null,
    sessionId: null,
    startedAt: null,
    hydrationLastShownAt: null,
  };
}

export function useWorkoutPlayer(
  exercises: WorkoutSessionExercise[],
  meta: WorkoutSessionMeta,
  initialExerciseIndex = 0,
  options: WorkoutPlayerOptions = {},
) {
  const runtimeMode: WorkoutRuntimeMode = options.runtimeMode ?? "v2";
  const isV2 = runtimeMode === "v2";
  const sessionKey = useMemo(
    () =>
      getTodayWorkoutSessionKey(
        exercises.map((item) => item.assignmentExerciseId ?? item.external_id),
      ),
    [exercises],
  );
  const initialState = useMemo(
    () => createInitialProgress(exercises, initialExerciseIndex, sessionKey),
    [exercises, initialExerciseIndex, sessionKey],
  );

  const [exerciseIndex, setExerciseIndex] = useState(initialState.exerciseIndex);
  const [progress, setProgress] = useState<ExerciseRunState[]>(initialState.progress);
  const [setLogs, setSetLogs] = useState<StoredSetLog[]>(initialState.setLogs);
  const [phase, setPhase] = useState<PlayerPhase>(() => {
    const allDone = initialState.progress.every((item) => item.status === "done");
    if (allDone && exercises.length > 0) return "complete";
    if (initialState.rest) return "rest";
    return "exercise";
  });
  const [setInProgress, setSetInProgress] = useState(false);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [restClock, setRestClock] = useState<WallClockRest | null>(initialState.rest);
  const [restSecondsLeft, setRestSecondsLeft] = useState(
    initialState.rest ? remainingRestSeconds(initialState.rest) : 90,
  );
  const [restTotalSeconds, setRestTotalSeconds] = useState(
    initialState.rest?.prescribed_rest_seconds ?? 90,
  );
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoAutoPlay, setVideoAutoPlay] = useState(false);
  const [heroKey, setHeroKey] = useState(0);
  const [dbSession, setDbSession] = useState<WorkoutSessionRecord | null>(null);
  const [v2ById, setV2ById] = useState<Record<string, ExerciseV2Metadata>>({});
  const [historyById, setHistoryById] = useState<Record<string, ExerciseSetHistoryItem[]>>({});
  const [trainingLevel, setTrainingLevel] = useState<"UNASSESSED" | "BEGINNER" | "INTERMEDIATE">(
    "UNASSESSED",
  );
  const [experienceById, setExperienceById] = useState<
    Record<string, "NEW" | "CALIBRATING" | "FAMILIAR" | "ESTABLISHED">
  >({});
  const [calibrationAction, setCalibrationAction] = useState<CalibrationAction | null>(null);
  const [syncStatus, setSyncStatus] = useState<"SAVED" | "PENDING_SYNC" | null>(null);
  const [hydrationVisible, setHydrationVisible] = useState(false);
  const [hydrationLastShownAt, setHydrationLastShownAt] = useState<string | null>(
    initialState.hydrationLastShownAt,
  );
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(initialState.startedAt);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingSet, setEditingSet] = useState(false);
  const savingRef = useRef(false);
  const ensuringRef = useRef(false);
  const startedTrackedRef = useRef(false);
  const setStartedAtRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(initialState.sessionId);

  const currentExercise = exercises[exerciseIndex];
  const currentProgress = progress[exerciseIndex] ?? {
    completedSets: 0,
    status: "pending" as const,
  };
  const currentMeta = currentExercise ? v2ById[currentExercise.external_id] : undefined;
  const isTimed = Boolean(
    currentMeta?.prescription_mode === "DURATION" ||
    currentMeta?.prescription_mode === "INTERVAL" ||
    (currentExercise?.durationSeconds && !currentExercise?.reps),
  );
  const isBodyweight = currentMeta?.is_bodyweight === true;

  const prescription: CoreExercisePrescription | null = useMemo(() => {
    if (!isV2 || !currentExercise || !currentMeta) return null;
    try {
      const parsed = parseRepsLabel(currentExercise.reps);
      const priorHistory = excludeCurrentSession(
        historyById[currentExercise.external_id] ?? [],
        dbSession?.id ?? sessionIdRef.current,
      );
      const rawProgression = getNextSessionProgression({
        externalId: currentExercise.external_id,
        exercise: currentMeta,
        history: priorHistory,
        trainingLevel,
        exerciseExperience: experienceById[currentExercise.external_id] ?? "NEW",
        requiredWorkingSets: currentExercise.sets,
        repMin: parsed?.min ?? 8,
        repMax: parsed?.max ?? 12,
        durationMin: currentExercise.durationSeconds
          ? Math.max(20, currentExercise.durationSeconds - 10)
          : 20,
        durationMax: currentExercise.durationSeconds ?? 40,
        prescribedLoad: currentExercise.suggestedWeightKg || null,
        recoveryHold: options.recoveryHold ?? "NORMAL",
      });
      const progression = progressionForRuntime(
        parseProgressionStrategy(options.progressionStrategy),
        rawProgression,
      );
      return getCoreExercisePrescription({
        goalId: options.goalId ?? null,
        trainingLevel,
        exerciseExperience: experienceById[currentExercise.external_id] ?? "NEW",
        exercise: currentMeta,
        recentHistory: priorHistory,
        assigned: {
          sets: currentExercise.sets,
          reps: currentExercise.reps,
          rest_seconds: currentExercise.restSeconds,
          suggested_weight_kg: currentExercise.suggestedWeightKg,
          duration_seconds: currentExercise.durationSeconds,
        },
        now: new Date(),
        progression,
        prescriptionState: options.prescriptionState ?? null,
      });
    } catch {
      return null;
    }
  }, [
    currentExercise,
    currentMeta,
    dbSession?.id,
    experienceById,
    historyById,
    isV2,
    options.goalId,
    options.recoveryHold,
    options.prescriptionState,
    options.progressionStrategy,
    trainingLevel,
  ]);

  const [setDraft, setSetDraft] = useState<SetLogDraft>({
    weightKg: currentExercise?.suggestedWeightKg ?? 0,
    reps: 10,
    durationSeconds: currentExercise?.durationSeconds ?? 30,
    effort: "medium",
    effortV2: "IDEAL",
    notes: "",
    safetyFlag: false,
  });

  const lastLogForCurrent = useMemo(() => {
    if (!currentExercise) return null;
    return (
      [...setLogs]
        .reverse()
        .find((log) => log.exerciseExternalId === currentExercise.external_id && !log.skipped) ??
      null
    );
  }, [currentExercise, setLogs]);

  const v2Targets = useMemo(() => {
    const parsed = parseRepsLabel(currentExercise?.reps);
    const fallbackMin = parsed?.min ?? 8;
    const fallbackMax = parsed?.max ?? 12;
    const loadKnown =
      prescription?.load_source === "RECENT_HISTORY" && prescription.prescribed_load != null;
    let weightKg = loadKnown ? prescription.prescribed_load! : (lastLogForCurrent?.weightKg ?? 0);
    if (
      prescription?.status === "CALIBRATION_REQUIRED" ||
      prescription?.status === "RECALIBRATION_REQUIRED"
    ) {
      weightKg = lastLogForCurrent?.weightKg ?? 0;
    }
    if (calibrationAction && lastLogForCurrent?.weightKg != null) {
      const next = nextLoadAfterCalibration({
        action: calibrationAction,
        currentLoad: lastLogForCurrent.weightKg,
        incrementKg: isBodyweight ? null : DEFAULT_LOADED_INCREMENT_KG,
      });
      if (next.load != null) weightKg = next.load;
    }
    return {
      setNumber: currentSetNumber,
      weightKg,
      loadKnown: loadKnown && prescription?.status !== "CALIBRATION_REQUIRED",
      reps: prescription?.rep_max ?? fallbackMax,
      repsMin: prescription?.rep_min ?? fallbackMin,
      repsMax: prescription?.rep_max ?? fallbackMax,
      durationMin: prescription?.duration_min ?? currentExercise?.durationSeconds ?? null,
      durationMax: prescription?.duration_max ?? currentExercise?.durationSeconds ?? null,
      restSeconds: prescription?.recommended_rest_seconds ?? currentExercise?.restSeconds ?? 90,
      setType: "WORKING" as const,
    };
  }, [
    calibrationAction,
    currentExercise,
    currentSetNumber,
    isBodyweight,
    lastLogForCurrent,
    prescription,
  ]);

  const currentSetTargets = useMemo(() => {
    if (!isV2) {
      if (!currentExercise) return getSetProgression({ setNumber: 1, baseWeightKg: 0 });
      return getSetProgression({
        setNumber: currentSetNumber,
        baseWeightKg: currentExercise.suggestedWeightKg,
        lastWeightKg: currentSetNumber > 1 ? (lastLogForCurrent?.weightKg ?? null) : null,
      });
    }
    return {
      setNumber: v2Targets.setNumber,
      weightKg: v2Targets.weightKg,
      reps: v2Targets.reps,
      repsMin: v2Targets.repsMin,
      repsMax: v2Targets.repsMax,
    };
  }, [currentExercise, currentSetNumber, isV2, lastLogForCurrent, v2Targets]);

  useEffect(() => {
    if (!currentExercise) return;
    if (phase === "rest" || phase === "set-sheet") return;
    const nextSetNumber = Math.min(
      Math.max(currentProgress.completedSets + 1, 1),
      Math.max(currentExercise.sets, 1),
    );
    setCurrentSetNumber(nextSetNumber);
    if (isV2) {
      setSetDraft({
        weightKg: v2Targets.weightKg,
        reps: v2Targets.repsMax,
        durationSeconds: v2Targets.durationMax ?? currentExercise.durationSeconds ?? 30,
        effort: "medium",
        effortV2: lastLogForCurrent?.effortV2 ?? "IDEAL",
        notes: "",
        safetyFlag: false,
      });
      return;
    }
    const targets = getSetProgression({
      setNumber: nextSetNumber,
      baseWeightKg: currentExercise.suggestedWeightKg,
      lastWeightKg: nextSetNumber > 1 ? (lastLogForCurrent?.weightKg ?? null) : null,
    });
    setSetDraft({
      weightKg: targets.weightKg,
      reps: targets.reps,
      durationSeconds: currentExercise.durationSeconds ?? 30,
      effort: lastLogForCurrent?.effort ?? "medium",
      effortV2: "IDEAL",
      notes: "",
      safetyFlag: false,
    });
  }, [
    currentExercise,
    currentProgress.completedSets,
    exerciseIndex,
    isV2,
    lastLogForCurrent,
    phase,
    v2Targets.durationMax,
    v2Targets.repsMax,
    v2Targets.weightKg,
  ]);

  useEffect(() => {
    if (exercises.length === 0) return;
    saveWorkoutProgress(sessionKey, exerciseIndex, progress as StoredExerciseProgress[], setLogs, {
      sessionId: sessionIdRef.current,
      rest: phase === "rest" ? restClock : null,
      hydrationLastShownAt,
      startedAt: sessionStartedAt,
    });
  }, [
    exerciseIndex,
    exercises.length,
    hydrationLastShownAt,
    phase,
    progress,
    restClock,
    sessionKey,
    sessionStartedAt,
    setLogs,
  ]);

  useEffect(() => {
    if (!isV2 || exercises.length === 0) return;
    let cancelled = false;
    void fetchExercisesV2ByExternalIds(exercises.map((item) => item.external_id)).then((rows) => {
      if (cancelled) return;
      const map: Record<string, ExerciseV2Metadata> = {};
      rows.forEach((row) => {
        map[row.external_id] = row;
      });
      setV2ById(map);
    });
    return () => {
      cancelled = true;
    };
  }, [exercises, isV2]);

  useEffect(() => {
    let cancelled = false;
    void getActiveWorkoutSession().then((active) => {
      if (cancelled || !active) return;
      if (active.sessionKey === sessionKey) {
        sessionIdRef.current = active.id;
        setDbSession(active);
        setSessionStartedAt((value) => value ?? active.startedAt);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sessionKey]);

  useEffect(() => {
    if (!isV2 || exercises.length === 0) return;
    const date = new Date().toISOString().slice(0, 10);
    let cancelled = false;
    void listOwnSetLogsForDate(date).then((rows) => {
      if (cancelled || !rows.length) return;
      const relevant = rows.filter((row) =>
        exercises.some((item) => item.external_id === row.exercise_external_id),
      );
      if (!relevant.length) return;
      setSetLogs((prev) => {
        const pendingIds = new Set(
          prev
            .filter((item) => item.syncStatus === "PENDING_SYNC")
            .map((item) => `${item.exerciseExternalId}:${item.setNumber}`),
        );
        const fromDb: StoredSetLog[] = relevant.map((row) => ({
          exerciseExternalId: row.exercise_external_id,
          exerciseId:
            row.exercise_id ??
            exercises.find((item) => item.external_id === row.exercise_external_id)?.id ??
            "",
          setNumber: row.set_number,
          weightKg: row.actual_load ?? row.weight_kg,
          reps: row.actual_reps ?? row.reps,
          durationSeconds: row.actual_duration_seconds,
          effort: row.effort as EffortLevel | null,
          effortV2: (row.effort_v2 as TrainingV2Effort | null) ?? null,
          notes: row.notes ?? "",
          skipped: Boolean(row.skipped),
          setCompleted: row.set_completed ?? !row.skipped,
          setType: (row.set_type as StoredSetLog["setType"]) ?? "WORKING",
          prescribedLoad: row.prescribed_load,
          prescribedRepsMin: row.prescribed_reps_min,
          prescribedRepsMax: row.prescribed_reps_max,
          prescribedRestSeconds: row.prescribed_rest_seconds,
          actualRestSeconds: row.actual_rest_seconds,
          startedAt: row.started_at,
          completedAt: row.completed_at,
          syncStatus: "SAVED",
          loggedAt: row.updated_at ?? row.completed_at ?? new Date().toISOString(),
        }));
        const keptPending = prev.filter((item) =>
          pendingIds.has(`${item.exerciseExternalId}:${item.setNumber}`),
        );
        const withoutPending = fromDb.filter(
          (item) => !pendingIds.has(`${item.exerciseExternalId}:${item.setNumber}`),
        );
        return [...withoutPending, ...keptPending];
      });
      setProgress((prev) =>
        exercises.map((exercise, index) => {
          const n = relevant.filter(
            (row) => row.exercise_external_id === exercise.external_id,
          ).length;
          const completedSets = Math.max(
            prev[index]?.completedSets ?? 0,
            Math.min(n, exercise.sets),
          );
          return {
            completedSets,
            status:
              completedSets >= exercise.sets
                ? "done"
                : completedSets > 0 || index === 0
                  ? "active"
                  : "pending",
          };
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [exercises, isV2, sessionKey]);

  useEffect(() => {
    const onOnline = () => {
      void flushPendingWorkoutSetLogs().then((count) => {
        if (count > 0) setSyncStatus("SAVED");
      });
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const persistSession = useCallback(async () => {
    if (!isV2 || ensuringRef.current) return sessionIdRef.current;
    ensuringRef.current = true;
    try {
      const record = await ensureWorkoutSession({
        sessionKey,
        assignmentId: options.assignmentId ?? currentExercise?.assignmentId ?? null,
        assignmentDayId: currentExercise?.assignmentDayId ?? null,
        prescribedExerciseCount: exercises.length,
        prescribedWorkingSets: exercises.reduce((sum, item) => sum + item.sets, 0),
      });
      if (record) {
        sessionIdRef.current = record.id;
        setDbSession(record);
        setSessionStartedAt((value) => value ?? record.startedAt ?? new Date().toISOString());
        if (!startedTrackedRef.current) {
          startedTrackedRef.current = true;
          trackTrainingEvent(record.status === "IN_PROGRESS" ? "workout_resumed" : "workout_started", {
            runtime: "v2",
          });
        }
        const level = await ensureTrainingLevel();
        if (level) setTrainingLevel(level.trainingLevel);
      }
      return record?.id ?? sessionIdRef.current;
    } finally {
      ensuringRef.current = false;
    }
  }, [currentExercise?.assignmentId, exercises, isV2, options.assignmentId, sessionKey]);

  const sessionProgressPct = useMemo(() => {
    const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
    if (totalSets === 0) return 0;
    const doneSets = progress.reduce((sum, item) => sum + item.completedSets, 0);
    return Math.min(Math.round((doneSets / totalSets) * 100), 100);
  }, [exercises, progress]);

  const completedWorkingSets = useMemo(
    () => setLogs.filter((log) => !log.skipped && log.setType !== "WARMUP").length,
    [setLogs],
  );

  const nextExercise = exercises[exerciseIndex + 1] ?? null;

  const restUpcoming = useMemo(() => {
    if (!currentExercise) return null;
    const exerciseDone = currentProgress.completedSets >= currentExercise.sets;
    if (exerciseDone) {
      if (!nextExercise) return null;
      return { kind: "exercise" as const, exercise: nextExercise };
    }
    const nextSetNumber = currentProgress.completedSets + 1;
    if (isV2) {
      return {
        kind: "set" as const,
        exercise: currentExercise,
        setNumber: nextSetNumber,
        totalSets: currentExercise.sets,
        from: {
          weightKg: lastLogForCurrent?.weightKg ?? v2Targets.weightKg,
          repsMin: v2Targets.repsMin,
          repsMax: v2Targets.repsMax,
        },
        to: {
          weightKg: v2Targets.weightKg,
          repsMin: v2Targets.repsMin,
          repsMax: v2Targets.repsMax,
        },
      };
    }
    const fromProgression = getSetProgression({
      setNumber: Math.max(1, nextSetNumber - 1),
      baseWeightKg: currentExercise.suggestedWeightKg,
    });
    const to = getSetProgression({
      setNumber: nextSetNumber,
      baseWeightKg: currentExercise.suggestedWeightKg,
      lastWeightKg: lastLogForCurrent?.weightKg ?? null,
    });
    return {
      kind: "set" as const,
      exercise: currentExercise,
      setNumber: nextSetNumber,
      totalSets: currentExercise.sets,
      from: {
        ...fromProgression,
        weightKg: lastLogForCurrent?.weightKg ?? fromProgression.weightKg,
      },
      to,
    };
  }, [
    currentExercise,
    currentProgress.completedSets,
    isV2,
    lastLogForCurrent,
    nextExercise,
    v2Targets,
  ]);

  const beginSet = useCallback(() => {
    primeWorkoutAudio();
    setVideoAutoPlay(true);
    setVideoOpen(true);
    setSetInProgress(true);
    setStartedAtRef.current = new Date().toISOString();
    void persistSession();
    if (isV2 && currentExercise) {
      void listExerciseSetHistory(currentExercise.external_id, 12).then((rows) => {
        setHistoryById((prev) => ({ ...prev, [currentExercise.external_id]: rows }));
      });
      void ensureExerciseExperience(currentExercise.external_id).then((row) => {
        if (row) setExperienceById((prev) => ({ ...prev, [row.externalId]: row.state }));
      });
    }
  }, [currentExercise, isV2, persistSession]);

  const openSetSheet = useCallback(() => {
    setPhase("set-sheet");
  }, []);

  const closeSetSheet = useCallback(() => {
    setPhase("exercise");
    setEditingSet(false);
  }, []);

  const startRest = useCallback((seconds: number) => {
    const clock = createWallClockRest(seconds);
    setRestClock(clock);
    setRestTotalSeconds(seconds);
    setRestSecondsLeft(seconds);
    setPhase("rest");
    setSetInProgress(false);
  }, []);

  const advanceAfterSet = useCallback(() => {
    const exercise = exercises[exerciseIndex];
    if (!exercise) return;
    const nextCompletedSets = currentProgress.completedSets + 1;
    const isExerciseDone = nextCompletedSets >= exercise.sets;
    setProgress((prev) =>
      prev.map((item, index) => {
        if (index === exerciseIndex) {
          return { completedSets: nextCompletedSets, status: isExerciseDone ? "done" : "active" };
        }
        if (isExerciseDone && index === exerciseIndex + 1) return { ...item, status: "active" };
        return item;
      }),
    );
    if (!isExerciseDone || exerciseIndex < exercises.length - 1) {
      startRest(isV2 ? v2Targets.restSeconds : exercise.restSeconds);
      return;
    }
    setPhase("complete");
    setSetInProgress(false);
    setVideoOpen(false);
    setVideoAutoPlay(false);
    void persistSession().then((id) => {
      if (id) void updateWorkoutSessionStatus(id, "COMPLETED");
      trackTrainingEvent("workout_completed", { runtime: isV2 ? "v2" : "legacy_free" });
      void runClientLoopAfterSession(isV2);
    });
    void supabase.auth.getUser().then(({ data }) => {
      markWorkoutCompleted(data.user?.id ?? "guest");
    });
  }, [
    currentProgress.completedSets,
    exerciseIndex,
    exercises,
    isV2,
    persistSession,
    startRest,
    v2Targets.restSeconds,
  ]);

  const saveSet = useCallback(
    (skipped = false) => {
      const exercise = exercises[exerciseIndex];
      if (!exercise || savingRef.current) return;
      savingRef.current = true;
      const effortRequired = isV2 && !skipped;
      const actualLoad = loadForPersistence({
        isBodyweight,
        actualLoad:
          isTimed || isBodyweight
            ? setDraft.weightKg > 0
              ? setDraft.weightKg
              : null
            : setDraft.weightKg,
      });
      const check = isV2
        ? validateSetWrite({
            actualLoad,
            actualReps: isTimed ? null : setDraft.reps,
            actualDurationSeconds: isTimed ? setDraft.durationSeconds : null,
            effortV2: setDraft.effortV2,
            skipped,
            setType: "WORKING",
            prescriptionMode: currentMeta?.prescription_mode ?? (isTimed ? "DURATION" : "REPS"),
            isBodyweight,
            requireEffort: effortRequired,
          })
        : { ok: true as const };
      if (!check.ok) {
        savingRef.current = false;
        setSaveError("أكمل بيانات المجموعة قبل الحفظ");
        return;
      }
      setSaveError(null);
      const completedAt = new Date().toISOString();
      const logEntry: StoredSetLog = {
        exerciseExternalId: exercise.external_id,
        exerciseId: exercise.id,
        setNumber: currentSetNumber,
        weightKg: skipped ? null : actualLoad,
        reps: skipped || isTimed ? null : setDraft.reps,
        durationSeconds: skipped || !isTimed ? null : setDraft.durationSeconds,
        effort: isV2 ? effortV2ToLegacy(setDraft.effortV2) : setDraft.effort,
        effortV2: skipped || !isV2 ? null : setDraft.effortV2,
        notes: setDraft.notes.trim(),
        skipped,
        setCompleted: !skipped,
        setType: "WORKING",
        prescribedLoad: prescription?.prescribed_load ?? null,
        prescribedRepsMin: v2Targets.repsMin,
        prescribedRepsMax: v2Targets.repsMax,
        prescribedDurationSeconds: v2Targets.durationMin,
        prescribedRestSeconds: v2Targets.restSeconds,
        startedAt: setStartedAtRef.current,
        completedAt: skipped ? null : completedAt,
        syncStatus: "PENDING_SYNC",
        loggedAt: completedAt,
      };
      setSetLogs((prev) => {
        const withoutCurrent = prev.filter(
          (item) =>
            !(
              item.exerciseExternalId === logEntry.exerciseExternalId &&
              item.setNumber === logEntry.setNumber
            ),
        );
        return [...withoutCurrent, logEntry];
      });
      if (isV2 && !skipped && prescription?.status === "CALIBRATION_REQUIRED" && currentMeta) {
        const action = getCalibrationAdjustment({
          exercise: currentMeta!,
          trainingLevel,
          targetMin: isTimed ? (v2Targets.durationMin ?? 0) : v2Targets.repsMin,
          targetMax: isTimed ? (v2Targets.durationMax ?? 0) : v2Targets.repsMax,
          actualValue: isTimed ? setDraft.durationSeconds : setDraft.reps,
          actualLoad,
          effort: setDraft.effortV2,
          safetyReview: setDraft.safetyFlag,
          equipmentIncrementKg: isBodyweight ? null : DEFAULT_LOADED_INCREMENT_KG,
          prescriptionMode: isTimed ? "DURATION" : "REPS",
        });
        setCalibrationAction(action.action);
      } else if (isV2) {
        setCalibrationAction(setDraft.safetyFlag ? "SAFETY_REVIEW" : "KEEP");
      }
      if (setDraft.safetyFlag) {
        void insertSafetySignal({
          signal: "pain",
          exerciseExternalId: exercise.external_id,
          workoutSessionId: sessionIdRef.current,
        });
      }
      void (async () => {
        const sessionId = (await persistSession()) ?? sessionIdRef.current;
        const result = await upsertWorkoutSetLog({
          exerciseId: exercise.id,
          exerciseExternalId: exercise.external_id,
          setNumber: currentSetNumber,
          weightKg: logEntry.weightKg,
          reps: logEntry.reps,
          effort: logEntry.effort,
          notes: logEntry.notes,
          skipped,
          assignmentId: exercise.assignmentId ?? null,
          assignmentExerciseId: exercise.assignmentExerciseId ?? null,
          workoutSessionId: sessionId,
          setType: "WORKING",
          prescribedLoad: logEntry.prescribedLoad ?? null,
          actualLoad: logEntry.weightKg,
          prescribedRepsMin: logEntry.prescribedRepsMin ?? null,
          prescribedRepsMax: logEntry.prescribedRepsMax ?? null,
          actualReps: logEntry.reps,
          prescribedDurationSeconds: logEntry.prescribedDurationSeconds ?? null,
          actualDurationSeconds: logEntry.durationSeconds ?? null,
          prescribedRestSeconds: logEntry.prescribedRestSeconds ?? null,
          effortV2: logEntry.effortV2 ?? null,
          setCompleted: !skipped,
          startedAt: logEntry.startedAt ?? null,
          completedAt: logEntry.completedAt ?? null,
        });
        setSyncStatus(result.status);
        if (result.status === "PENDING_SYNC") trackTrainingEvent("set_sync_failed", { runtime: "v2" });
        setSetLogs((prev) =>
          prev.map((item) =>
            item.exerciseExternalId === logEntry.exerciseExternalId &&
            item.setNumber === logEntry.setNumber
              ? { ...item, syncStatus: result.status }
              : item,
          ),
        );
      })();
      if (!editingSet) advanceAfterSet();
      else {
        setPhase("exercise");
        setEditingSet(false);
      }
      window.setTimeout(() => {
        savingRef.current = false;
      }, 400);
    },
    [
      advanceAfterSet,
      currentMeta,
      currentSetNumber,
      editingSet,
      exerciseIndex,
      exercises,
      isBodyweight,
      isTimed,
      isV2,
      persistSession,
      prescription,
      setDraft,
      trainingLevel,
      v2Targets,
    ],
  );

  const applyActualRestToLastSet = useCallback(
    (actualSeconds: number, restCompletedAt: string) => {
      const last = [...setLogs].reverse().find((item) => !item.skipped);
      if (!last) return;
      setSetLogs((prev) =>
        prev.map((item) =>
          item.exerciseExternalId === last.exerciseExternalId && item.setNumber === last.setNumber
            ? { ...item, actualRestSeconds: actualSeconds }
            : item,
        ),
      );
      const exercise = exercises.find((item) => item.external_id === last.exerciseExternalId);
      if (!exercise) return;
      void upsertWorkoutSetLog({
        exerciseId: exercise.id,
        exerciseExternalId: last.exerciseExternalId,
        setNumber: last.setNumber,
        weightKg: last.weightKg,
        reps: last.reps,
        effort: last.effort,
        notes: last.notes,
        skipped: last.skipped,
        assignmentId: exercise.assignmentId ?? null,
        assignmentExerciseId: exercise.assignmentExerciseId ?? null,
        workoutSessionId: sessionIdRef.current,
        actualRestSeconds: actualSeconds,
        restStartedAt: restClock?.rest_started_at ?? null,
        restCompletedAt,
        prescribedRestSeconds:
          last.prescribedRestSeconds ?? restClock?.prescribed_rest_seconds ?? null,
        actualLoad: last.weightKg,
        actualReps: last.reps,
        effortV2: last.effortV2 ?? null,
        setCompleted: last.setCompleted ?? !last.skipped,
      });
    },
    [exercises, restClock, setLogs],
  );

  const finishRest = useCallback(() => {
    const now = Date.now();
    if (restClock) {
      applyActualRestToLastSet(restElapsedSeconds(restClock, now), new Date(now).toISOString());
    }
    const exercise = exercises[exerciseIndex];
    const completed = progress[exerciseIndex]?.completedSets ?? 0;
    const isExerciseDone = Boolean(exercise && completed >= exercise.sets);
    if (isExerciseDone && exerciseIndex < exercises.length - 1) {
      const nextIndex = exerciseIndex + 1;
      setExerciseIndex(nextIndex);
      setCurrentSetNumber(1);
      setHeroKey((value) => value + 1);
      setCalibrationAction(null);
    }
    setRestClock(null);
    setPhase("exercise");
    setSetInProgress(true);
    setVideoOpen(true);
    setVideoAutoPlay(true);
    setStartedAtRef.current = new Date().toISOString();
  }, [applyActualRestToLastSet, exerciseIndex, exercises, progress, restClock]);

  const skipRest = finishRest;

  const addRestTime = useCallback(() => {
    setRestClock((clock) => (clock ? extendWallClockRest(clock, 30) : clock));
    setRestTotalSeconds((value) => value + 30);
  }, []);

  const dismissHydration = useCallback(() => {
    setHydrationVisible(false);
    setHydrationLastShownAt(new Date().toISOString());
  }, []);

  useEffect(() => {
    if (phase !== "rest") return;
    const show = shouldShowHydrationReminder({
      sessionStartedAt,
      completedWorkingSets,
      lastShownAt: hydrationLastShownAt,
      phase,
    });
    if (show) setHydrationVisible(true);
  }, [completedWorkingSets, hydrationLastShownAt, phase, sessionStartedAt]);

  const finishWorkoutEarly = useCallback(() => {
    const remaining = progress.some(
      (item, index) => item.completedSets < (exercises[index]?.sets ?? 0),
    );
    setPhase("complete");
    setRestClock(null);
    void persistSession().then((id) => {
      if (id) void updateWorkoutSessionStatus(id, remaining ? "PARTIALLY_COMPLETED" : "COMPLETED");
      trackTrainingEvent(remaining ? "workout_partial" : "workout_completed", { runtime: isV2 ? "v2" : "legacy_free" });
      void runClientLoopAfterSession(isV2);
    });
  }, [exercises, isV2, persistSession, progress]);

  const editLastSet = useCallback(() => {
    if (!lastLogForCurrent) return;
    setCurrentSetNumber(lastLogForCurrent.setNumber);
    setSetDraft({
      weightKg: lastLogForCurrent.weightKg ?? 0,
      reps: lastLogForCurrent.reps ?? v2Targets.repsMax,
      durationSeconds: lastLogForCurrent.durationSeconds ?? v2Targets.durationMax ?? 30,
      effort: lastLogForCurrent.effort ?? "medium",
      effortV2: lastLogForCurrent.effortV2 ?? "IDEAL",
      notes: lastLogForCurrent.notes,
      safetyFlag: false,
    });
    setEditingSet(true);
    setPhase("set-sheet");
  }, [lastLogForCurrent, v2Targets.durationMax, v2Targets.repsMax]);

  const primaryActionLabel = useMemo(() => {
    const exercise = exercises[exerciseIndex];
    if (!exercise) return "ابدأ الجولة";
    if (!setInProgress) return "ابدأ الجولة";
    const isLastSetOfExercise = currentSetNumber >= exercise.sets;
    return isLastSetOfExercise ? "أنهِ المجموعة" : "مر إلى الجولة التالية";
  }, [currentSetNumber, exerciseIndex, exercises, setInProgress]);

  const handlePrimaryAction = useCallback(() => {
    if (!setInProgress) {
      beginSet();
      return;
    }
    openSetSheet();
  }, [beginSet, openSetSheet, setInProgress]);

  const openVideo = useCallback(() => {
    setVideoAutoPlay(true);
    setVideoOpen(true);
  }, []);

  const closeVideo = useCallback(() => {
    setVideoOpen(false);
    setVideoAutoPlay(false);
  }, []);

  const jumpToExercise = useCallback(
    (index: number) => {
      if (index < 0 || index >= exercises.length) return;
      setExerciseIndex(index);
      setHeroKey((value) => value + 1);
      setSetInProgress(false);
      setPhase("exercise");
      setCalibrationAction(null);
    },
    [exercises.length],
  );

  const resetSession = useCallback(() => {
    clearWorkoutSession();
    sessionIdRef.current = null;
    setExerciseIndex(0);
    setProgress(
      exercises.map((_, index) => ({
        completedSets: 0,
        status: index === 0 ? "active" : "pending",
      })),
    );
    setSetLogs([]);
    setPhase("exercise");
    setSetInProgress(false);
    setCurrentSetNumber(1);
    setVideoOpen(false);
    setVideoAutoPlay(false);
    setHeroKey((value) => value + 1);
    setRestClock(null);
    setCalibrationAction(null);
  }, [exercises]);

  const sessionElapsedMin = useMemo(() => {
    if (!sessionStartedAt) return meta.durationMin;
    const end = phase === "complete" ? Date.now() : Date.now();
    return Math.max(1, Math.round((end - Date.parse(sessionStartedAt)) / 60000));
  }, [meta.durationMin, phase, sessionStartedAt]);

  return {
    meta: { ...meta, durationMin: isV2 ? sessionElapsedMin : meta.durationMin },
    exercises,
    exerciseIndex,
    currentExercise,
    currentProgress,
    progress,
    setLogs,
    phase,
    setInProgress,
    currentSetNumber,
    restSecondsLeft,
    restTotalSeconds,
    restClock,
    setRestSecondsLeft,
    videoOpen,
    videoAutoPlay,
    setVideoOpen,
    openVideo,
    closeVideo,
    heroKey,
    sessionProgressPct,
    nextExercise,
    restUpcoming,
    currentSetTargets,
    setDraft,
    setSetDraft,
    effortLabels: isV2 ? V2_EFFORT_LABELS_AR : EFFORT_LABELS,
    beginSet,
    openSetSheet,
    closeSetSheet,
    saveSet,
    skipRest,
    addRestTime,
    finishRest,
    primaryActionLabel,
    handlePrimaryAction,
    jumpToExercise,
    resetSession,
    runtimeMode,
    prescription,
    calibrationAction,
    isTimed,
    isBodyweight,
    hydrationVisible,
    dismissHydration,
    syncStatus,
    saveError,
    finishWorkoutEarly,
    editLastSet,
    completedWorkingSets,
    sessionPartial: progress.some(
      (item, index) => item.completedSets < (exercises[index]?.sets ?? 0),
    ),
    v2Targets,
    workoutSessionId: dbSession?.id ?? sessionIdRef.current,
  };
}

export type WorkoutPlayerState = ReturnType<typeof useWorkoutPlayer>;
