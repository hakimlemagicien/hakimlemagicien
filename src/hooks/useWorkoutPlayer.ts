import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EFFORT_LABELS,
  type EffortLevel,
  type WorkoutSessionExercise,
  type WorkoutSessionMeta,
} from "@/lib/platform/workout-session";
import {
  clearWorkoutSession,
  getTodayWorkoutSessionKey,
  loadWorkoutSession,
  saveWorkoutProgress,
  type StoredExerciseProgress,
  type StoredSetLog,
} from "@/lib/platform/workout-progress-storage";
import { upsertWorkoutSetLog } from "@/lib/platform/workout-set-logs-api";

export type ExerciseRunStatus = "active" | "done" | "pending";

export type PlayerPhase = "exercise" | "set-sheet" | "rest" | "complete";

export type ExerciseRunState = {
  completedSets: number;
  status: ExerciseRunStatus;
};

export type SetLogDraft = {
  weightKg: number;
  reps: number;
  effort: EffortLevel;
  notes: string;
};

function createInitialProgress(
  exercises: WorkoutSessionExercise[],
  initialExerciseIndex: number,
  sessionKey: string,
): { progress: ExerciseRunState[]; exerciseIndex: number; setLogs: StoredSetLog[] } {
  const stored = loadWorkoutSession(sessionKey, exercises.length);
  if (stored) {
    return {
      progress: stored.progress.map((item) => ({
        completedSets: item.completedSets,
        status: item.status,
      })),
      exerciseIndex: stored.exerciseIndex,
      setLogs: stored.setLogs,
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
  };
}

export function useWorkoutPlayer(
  exercises: WorkoutSessionExercise[],
  meta: WorkoutSessionMeta,
  initialExerciseIndex = 0,
) {
  const sessionKey = useMemo(() => getTodayWorkoutSessionKey(), []);
  const initialState = useMemo(
    () => createInitialProgress(exercises, initialExerciseIndex, sessionKey),
    [exercises, initialExerciseIndex, sessionKey],
  );

  const [exerciseIndex, setExerciseIndex] = useState(initialState.exerciseIndex);
  const [progress, setProgress] = useState<ExerciseRunState[]>(initialState.progress);
  const [setLogs, setSetLogs] = useState<StoredSetLog[]>(initialState.setLogs);
  const [phase, setPhase] = useState<PlayerPhase>(() => {
    const allDone = initialState.progress.every((item) => item.status === "done");
    return allDone && exercises.length > 0 ? "complete" : "exercise";
  });
  const [setInProgress, setSetInProgress] = useState(false);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [restSecondsLeft, setRestSecondsLeft] = useState(90);
  const [restTotalSeconds, setRestTotalSeconds] = useState(90);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoAutoPlay, setVideoAutoPlay] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [heroKey, setHeroKey] = useState(0);

  const currentExercise = exercises[exerciseIndex];
  const currentProgress = progress[exerciseIndex] ?? {
    completedSets: 0,
    status: "pending" as const,
  };

  const [setDraft, setSetDraft] = useState<SetLogDraft>({
    weightKg: currentExercise?.suggestedWeightKg ?? 0,
    reps: 10,
    effort: "medium",
    notes: "",
  });

  useEffect(() => {
    if (!currentExercise) return;
    const lastLogForExercise = [...setLogs]
      .reverse()
      .find((log) => log.exerciseExternalId === currentExercise.external_id);

    setSetDraft({
      weightKg: lastLogForExercise?.weightKg ?? currentExercise.suggestedWeightKg,
      reps: lastLogForExercise?.reps ?? 10,
      effort: lastLogForExercise?.effort ?? "medium",
      notes: "",
    });
    setCurrentSetNumber(currentProgress.completedSets + 1);
  }, [currentExercise, currentProgress.completedSets, exerciseIndex, setLogs]);

  useEffect(() => {
    if (exercises.length === 0) return;
    saveWorkoutProgress(
      sessionKey,
      exerciseIndex,
      progress as StoredExerciseProgress[],
      setLogs,
    );
  }, [exerciseIndex, exercises.length, progress, sessionKey, setLogs]);

  const sessionProgressPct = useMemo(() => {
    const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
    if (totalSets === 0) return 0;
    const doneSets = progress.reduce((sum, item) => sum + item.completedSets, 0);
    return Math.min(Math.round((doneSets / totalSets) * 100), 100);
  }, [exercises, progress]);

  const nextExercise = exercises[exerciseIndex + 1] ?? null;

  const beginSet = useCallback(() => {
    setVideoAutoPlay(true);
    setVideoOpen(true);
    setSetInProgress(true);
  }, []);

  const openSetSheet = useCallback(() => {
    setVideoOpen(false);
    setVideoAutoPlay(false);
    setPhase("set-sheet");
  }, []);

  const closeSetSheet = useCallback(() => {
    setPhase("exercise");
  }, []);

  const startRest = useCallback((seconds: number) => {
    setRestTotalSeconds(seconds);
    setRestSecondsLeft(seconds);
    setPhase("rest");
    setSetInProgress(false);
    setVideoOpen(false);
    setVideoAutoPlay(false);
  }, []);

  const advanceAfterSet = useCallback(() => {
    const exercise = exercises[exerciseIndex];
    if (!exercise) return;

    const nextCompletedSets = currentProgress.completedSets + 1;
    const isExerciseDone = nextCompletedSets >= exercise.sets;

    setProgress((prev) =>
      prev.map((item, index) => {
        if (index === exerciseIndex) {
          return {
            completedSets: nextCompletedSets,
            status: isExerciseDone ? "done" : "active",
          };
        }
        if (isExerciseDone && index === exerciseIndex + 1) {
          return { ...item, status: "active" };
        }
        return item;
      }),
    );

    if (!isExerciseDone) {
      setCurrentSetNumber(nextCompletedSets + 1);
      startRest(exercise.restSeconds);
      return;
    }

    if (exerciseIndex < exercises.length - 1) {
      const nextIndex = exerciseIndex + 1;
      setExerciseIndex(nextIndex);
      setCurrentSetNumber(1);
      setHeroKey((value) => value + 1);
      setPhase("exercise");
      setSetInProgress(false);
      startRest(exercises[nextIndex].restSeconds);
      return;
    }

    setPhase("complete");
    setSetInProgress(false);
    setVideoOpen(false);
    setVideoAutoPlay(false);
  }, [currentProgress.completedSets, exerciseIndex, exercises, startRest]);

  const saveSet = useCallback(
    (skipped = false) => {
      const exercise = exercises[exerciseIndex];
      if (!exercise) return;

      const logEntry: StoredSetLog = {
        exerciseExternalId: exercise.external_id,
        exerciseId: exercise.id,
        setNumber: currentSetNumber,
        weightKg: setDraft.weightKg,
        reps: setDraft.reps,
        effort: setDraft.effort,
        notes: setDraft.notes.trim(),
        skipped,
        loggedAt: new Date().toISOString(),
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

      void upsertWorkoutSetLog({
        exerciseId: exercise.id,
        exerciseExternalId: exercise.external_id,
        setNumber: currentSetNumber,
        weightKg: setDraft.weightKg,
        reps: setDraft.reps,
        effort: setDraft.effort,
        notes: setDraft.notes,
        skipped,
      });

      closeSetSheet();
      advanceAfterSet();
    },
    [
      advanceAfterSet,
      closeSetSheet,
      currentSetNumber,
      exerciseIndex,
      exercises,
      setDraft.effort,
      setDraft.notes,
      setDraft.reps,
      setDraft.weightKg,
    ],
  );

  const skipRest = useCallback(() => {
    setPhase("exercise");
  }, []);

  const addRestTime = useCallback(() => {
    setRestSecondsLeft((value) => value + 30);
    setRestTotalSeconds((value) => value + 30);
  }, []);

  useEffect(() => {
    if (phase !== "rest") return;

    const timer = window.setInterval(() => {
      setRestSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "rest" || restSecondsLeft > 0) return;
    setPhase("exercise");
  }, [phase, restSecondsLeft]);

  const primaryActionLabel = useMemo(() => {
    const exercise = exercises[exerciseIndex];
    if (!exercise) return "ابدأ المجموعة";

    if (!setInProgress) {
      const isLastSet =
        currentProgress.completedSets + 1 >= exercise.sets &&
        exerciseIndex === exercises.length - 1;
      if (isLastSet && currentProgress.completedSets + 1 === exercise.sets) {
        return "إنهاء المجموعة";
      }
      return "ابدأ المجموعة";
    }

    const isLastSetOfExercise = currentSetNumber >= exercise.sets;
    const isLastExercise = exerciseIndex === exercises.length - 1;

    if (isLastSetOfExercise && isLastExercise) {
      return "إنهاء المجموعة";
    }
    if (isLastSetOfExercise) {
      return "التمرين التالي";
    }
    return "إنهاء المجموعة";
  }, [currentProgress.completedSets, currentSetNumber, exerciseIndex, exercises, setInProgress]);

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
      setShowDetails(false);
      setVideoOpen(false);
      setVideoAutoPlay(false);
    },
    [exercises.length],
  );

  const resetSession = useCallback(() => {
    clearWorkoutSession();
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
    setShowDetails(false);
    setVideoOpen(false);
    setVideoAutoPlay(false);
    setHeroKey((value) => value + 1);
  }, [exercises]);

  return {
    meta,
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
    videoOpen,
    videoAutoPlay,
    setVideoOpen,
    openVideo,
    closeVideo,
    showDetails,
    setShowDetails,
    heroKey,
    sessionProgressPct,
    nextExercise,
    setDraft,
    setSetDraft,
    effortLabels: EFFORT_LABELS,
    beginSet,
    openSetSheet,
    closeSetSheet,
    saveSet,
    skipRest,
    addRestTime,
    primaryActionLabel,
    handlePrimaryAction,
    jumpToExercise,
    resetSession,
  };
}

export type WorkoutPlayerState = ReturnType<typeof useWorkoutPlayer>;
