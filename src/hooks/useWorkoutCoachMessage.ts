import { isWarmUpActivityRole } from "@/lib/platform/training-templates/activity-roles";
/**
 * Hakim's line for the current moment of the workout player (brief, rest reaction,
 * end of session), personalised with the client's first name and gender.
 */
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { WorkoutPlayerState } from "@/hooks/useWorkoutPlayer";
import { useMembership } from "@/hooks/useMembership";
import { PROFILE_TRAINING_KEY } from "@/hooks/useProfileExperience";
import { resolveClientFirstName } from "@/lib/platform/home-hub";
import { fetchMyTrainingProfile } from "@/lib/platform/profile-api";
import { buildWorkoutCoachMessage, type WorkoutCoachMessage } from "@/lib/platform/workout-coach";

export function useWorkoutCoachMessage(player: WorkoutPlayerState): WorkoutCoachMessage | null {
  const { displayName } = useMembership();
  const training = useQuery({
    queryKey: PROFILE_TRAINING_KEY,
    queryFn: fetchMyTrainingProfile,
    staleTime: 60_000,
  });
  const female = training.data?.answers.gender === "female";
  const firstName = resolveClientFirstName(displayName);
  const ex = player.currentExercise;
  const lastLog = player.setLogs.length ? player.setLogs[player.setLogs.length - 1]! : null;
  const { repsMin, repsMax, weightKg } = player.currentSetTargets;

  return useMemo(() => {
    if (!ex) return null;
    return buildWorkoutCoachMessage({
      firstName,
      female,
      phase: player.phase,
      setInProgress: player.setInProgress,
      exerciseIndex: player.exerciseIndex,
      totalExercises: player.exercises.length,
      exercise: {
        id: ex.id,
        name: ex.name,
        sets: ex.sets,
        repsMin: player.isTimed ? null : repsMin,
        repsMax: player.isTimed ? null : repsMax,
        weightKg: player.isBodyweight ? null : weightKg || null,
        isTimed: player.isTimed,
        isWarmUp: isWarmUpActivityRole(ex.activityRole),
      },
      completedSetsCurrent: player.currentProgress.completedSets,
      currentSetNumber: player.currentSetNumber,
      lastLog: lastLog
        ? {
            exerciseId: lastLog.exerciseId,
            setNumber: lastLog.setNumber,
            reps: lastLog.reps,
            weightKg: lastLog.weightKg,
            effort: lastLog.effort,
          }
        : null,
      nextExerciseName: player.nextExercise?.name ?? null,
      completedWorkingSets: player.completedWorkingSets,
      durationMin: player.meta.durationMin,
      partial: player.sessionPartial,
    });
  }, [
    ex,
    firstName,
    female,
    player.phase,
    player.setInProgress,
    player.exerciseIndex,
    player.exercises.length,
    player.isTimed,
    player.isBodyweight,
    repsMin,
    repsMax,
    weightKg,
    player.currentProgress.completedSets,
    player.currentSetNumber,
    lastLog,
    player.nextExercise?.name,
    player.completedWorkingSets,
    player.meta.durationMin,
    player.sessionPartial,
  ]);
}
