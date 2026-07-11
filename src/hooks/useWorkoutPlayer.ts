import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EFFORT_LABELS,
  type EffortLevel,
  WORKOUT_SESSION_EXERCISES,
  WORKOUT_SESSION_META,
} from "@/lib/platform/workout-session";

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

function createInitialProgress(): ExerciseRunState[] {
  return WORKOUT_SESSION_EXERCISES.map((_, index) => ({
    completedSets: 0,
    status: index === 0 ? "active" : "pending",
  }));
}

export function useWorkoutPlayer(initialExerciseIndex = 0) {
  const [exerciseIndex, setExerciseIndex] = useState(initialExerciseIndex);
  const [progress, setProgress] = useState<ExerciseRunState[]>(createInitialProgress);
  const [phase, setPhase] = useState<PlayerPhase>("exercise");
  const [setInProgress, setSetInProgress] = useState(false);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [restSecondsLeft, setRestSecondsLeft] = useState(90);
  const [restTotalSeconds, setRestTotalSeconds] = useState(90);
  const [videoOpen, setVideoOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [heroKey, setHeroKey] = useState(0);

  const currentExercise = WORKOUT_SESSION_EXERCISES[exerciseIndex];
  const currentProgress = progress[exerciseIndex];

  const [setDraft, setSetDraft] = useState<SetLogDraft>({
    weightKg: currentExercise.suggestedWeightKg,
    reps: 10,
    effort: "medium",
    notes: "",
  });

  useEffect(() => {
    setSetDraft({
      weightKg: currentExercise.suggestedWeightKg,
      reps: 10,
      effort: "medium",
      notes: "",
    });
    setCurrentSetNumber(currentProgress.completedSets + 1);
  }, [currentExercise.suggestedWeightKg, currentProgress.completedSets, exerciseIndex]);

  const sessionProgressPct = useMemo(() => {
    const totalSets = WORKOUT_SESSION_EXERCISES.reduce((sum, exercise) => sum + exercise.sets, 0);
    const doneSets = progress.reduce((sum, item) => sum + item.completedSets, 0);
    return Math.min(Math.round((doneSets / totalSets) * 100), 100);
  }, [progress]);

  const nextExercise = WORKOUT_SESSION_EXERCISES[exerciseIndex + 1] ?? null;

  const beginSet = useCallback(() => {
    setSetInProgress(true);
  }, []);

  const openSetSheet = useCallback(() => {
    setPhase("set-sheet");
  }, []);

  const closeSetSheet = useCallback(() => {
    setPhase("exercise");
  }, []);

  const startRest = useCallback(
    (seconds: number) => {
      setRestTotalSeconds(seconds);
      setRestSecondsLeft(seconds);
      setPhase("rest");
      setSetInProgress(false);
    },
    [],
  );

  const advanceAfterSet = useCallback(() => {
    const exercise = WORKOUT_SESSION_EXERCISES[exerciseIndex];
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

    if (exerciseIndex < WORKOUT_SESSION_EXERCISES.length - 1) {
      const nextIndex = exerciseIndex + 1;
      setExerciseIndex(nextIndex);
      setCurrentSetNumber(1);
      setHeroKey((value) => value + 1);
      setPhase("exercise");
      startRest(WORKOUT_SESSION_EXERCISES[nextIndex].restSeconds);
      return;
    }

    setPhase("complete");
    setSetInProgress(false);
  }, [currentProgress.completedSets, exerciseIndex, startRest]);

  const saveSet = useCallback(
    (_skipped = false) => {
      closeSetSheet();
      advanceAfterSet();
    },
    [advanceAfterSet, closeSetSheet],
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
    if (!setInProgress) {
      const exercise = WORKOUT_SESSION_EXERCISES[exerciseIndex];
      const isLastSet =
        currentProgress.completedSets + 1 >= exercise.sets &&
        exerciseIndex === WORKOUT_SESSION_EXERCISES.length - 1;
      if (isLastSet && currentProgress.completedSets + 1 === exercise.sets) {
        return "إنهاء المجموعة";
      }
      return "ابدأ المجموعة";
    }

    const exercise = WORKOUT_SESSION_EXERCISES[exerciseIndex];
    const isLastSetOfExercise = currentSetNumber >= exercise.sets;
    const isLastExercise = exerciseIndex === WORKOUT_SESSION_EXERCISES.length - 1;

    if (isLastSetOfExercise && isLastExercise) {
      return "إنهاء المجموعة";
    }
    if (isLastSetOfExercise) {
      return "التمرين التالي";
    }
    return "إنهاء المجموعة";
  }, [currentProgress.completedSets, currentSetNumber, exerciseIndex, setInProgress]);

  const handlePrimaryAction = useCallback(() => {
    if (!setInProgress) {
      beginSet();
      return;
    }
    openSetSheet();
  }, [beginSet, openSetSheet, setInProgress]);

  const jumpToExercise = useCallback((index: number) => {
    if (index < 0 || index >= WORKOUT_SESSION_EXERCISES.length) return;
    setExerciseIndex(index);
    setHeroKey((value) => value + 1);
    setSetInProgress(false);
    setPhase("exercise");
    setShowDetails(false);
  }, []);

  const resetSession = useCallback(() => {
    setExerciseIndex(0);
    setProgress(createInitialProgress());
    setPhase("exercise");
    setSetInProgress(false);
    setCurrentSetNumber(1);
    setShowDetails(false);
    setVideoOpen(false);
    setHeroKey((value) => value + 1);
  }, []);

  return {
    meta: WORKOUT_SESSION_META,
    exercises: WORKOUT_SESSION_EXERCISES,
    exerciseIndex,
    currentExercise,
    currentProgress,
    progress,
    phase,
    setInProgress,
    currentSetNumber,
    restSecondsLeft,
    restTotalSeconds,
    videoOpen,
    setVideoOpen,
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
