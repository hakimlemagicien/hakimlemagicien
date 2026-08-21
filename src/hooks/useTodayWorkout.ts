import { useQuery } from "@tanstack/react-query";
import {
  fetchExercisesByExternalIds,
  resolveExerciseListMediaPath,
  type ExerciseDetails,
} from "@/lib/platform/exercise-library";
import { fetchResolvedExerciseMediaUrl } from "@/lib/platform/exercise-media";
import {
  TODAY_WORKOUT_BRIEF,
  TODAY_WORKOUT_PRESCRIPTIONS,
  type TodayWorkoutPrescription,
} from "@/lib/platform/today-workout";
import {
  formatRestLabel,
  type WorkoutSessionExercise,
  type WorkoutSessionMeta,
} from "@/lib/platform/workout-session";
import {
  getWeekdayIdFromDate,
  resolveWeekdayPlan,
  type WeekdayWorkoutPlan,
} from "@/lib/platform/weekly-workout-schedule";

export type TodayWorkoutSession = {
  meta: WorkoutSessionMeta;
  exercises: WorkoutSessionExercise[];
  missingExternalIds: string[];
  isRestDay: boolean;
  dayId: WeekdayId;
};

async function buildSessionExercise(
  prescription: TodayWorkoutPrescription,
  details: ExerciseDetails,
): Promise<WorkoutSessionExercise> {
  const listMedia = resolveExerciseListMediaPath({
    status: details.video_status,
    thumbnailPath: details.thumbnail_path,
    videoPath: details.video_path,
  });
  const thumbnailUrl = await fetchResolvedExerciseMediaUrl({
    status: listMedia.status,
    path: listMedia.path,
    kind: listMedia.kind,
  });

  return {
    id: details.id,
    external_id: details.external_id,
    name: details.name_ar,
    muscle: details.primary_muscle ?? details.muscle_group?.name_ar ?? "عضلة",
    sets: prescription.sets,
    reps: prescription.reps ?? null,
    durationSeconds: prescription.duration_seconds ?? details.duration_seconds ?? null,
    restSeconds: prescription.rest_seconds,
    restLabel: formatRestLabel(prescription.rest_seconds),
    suggestedWeightKg: prescription.suggested_weight_kg ?? 0,
    thumbnailUrl,
    videoStatus: details.video_status,
    videoPath: details.video_path,
    instructionsStatus: details.instructions_status,
    instructionsVideoPath: details.instructions_video_path,
    coachNotes: prescription.notes_ar ?? details.coach_notes,
    assignmentId: prescription.assignmentId,
    assignmentExerciseId: prescription.assignmentExerciseId,
    assignmentDayId: prescription.assignmentDayId,
  };
}

async function fetchWorkoutDaySession(plan: WeekdayWorkoutPlan): Promise<TodayWorkoutSession> {
  if (plan.isRestDay) {
    return {
      meta: {
        points: 0,
        durationMin: 0,
        calories: 0,
        streakDays: 0,
        totalExercises: 0,
      },
      exercises: [],
      missingExternalIds: [],
      isRestDay: true,
      dayId: plan.id,
    };
  }

  const externalIds = plan.prescriptions.map((item) => item.external_id);
  const rows = await fetchExercisesByExternalIds(externalIds);
  const byExternalId = new Map(rows.map((row) => [row.external_id, row]));

  const missingExternalIds = externalIds.filter((id) => !byExternalId.has(id));
  const exercises = (
    await Promise.all(
      plan.prescriptions.map(async (prescription) => {
        const details = byExternalId.get(prescription.external_id);
        if (!details) return null;
        try {
          return await buildSessionExercise(prescription, details);
        } catch {
          return null;
        }
      }),
    )
  ).filter((item): item is WorkoutSessionExercise => item !== null);

  return {
    meta: {
      points: plan.points,
      durationMin: plan.durationMin,
      calories: plan.calories,
      streakDays: 0,
      totalExercises: exercises.length,
    },
    exercises,
    missingExternalIds,
    isRestDay: false,
    dayId: plan.id,
  };
}

export function useWorkoutDaySession(plan: WeekdayWorkoutPlan | null) {
  return useQuery({
    queryKey: [
      "workout-day-session",
      plan?.id,
      (plan?.prescriptions ?? []).map((item) => item.external_id).join(","),
    ],
    queryFn: () => fetchWorkoutDaySession(plan!),
    enabled: Boolean(plan),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/** @deprecated use useWorkoutDaySession with a resolved weekday plan */
export function useTodayWorkout(hasWorkoutProgram = true) {
  return useWorkoutDaySession(resolveWeekdayPlan(getWeekdayIdFromDate(), hasWorkoutProgram));
}

export { TODAY_WORKOUT_BRIEF, TODAY_WORKOUT_PRESCRIPTIONS };
