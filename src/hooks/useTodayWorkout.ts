import { useQuery } from "@tanstack/react-query";
import {
  fetchExerciseMediaUrl,
  fetchExercisesByExternalIds,
  type ExerciseDetails,
} from "@/lib/platform/exercise-library";
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
  type WeekdayId,
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
  const mediaPath = details.thumbnail_path ?? details.video_path;
  const thumbnailUrl = await fetchExerciseMediaUrl(mediaPath);

  return {
    id: details.id,
    external_id: details.external_id,
    name: details.name_ar,
    muscle: details.primary_muscle ?? details.muscle_group.name_ar,
    sets: prescription.sets,
    reps: prescription.reps ?? null,
    durationSeconds: prescription.duration_seconds ?? details.duration_seconds ?? null,
    restSeconds: prescription.rest_seconds,
    restLabel: formatRestLabel(prescription.rest_seconds),
    suggestedWeightKg: prescription.suggested_weight_kg ?? 0,
    thumbnailUrl,
    videoPath: details.video_path,
    instructionsVideoPath: details.instructions_video_path,
    coachNotes: details.coach_notes,
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
  const exercises: WorkoutSessionExercise[] = [];

  for (const prescription of plan.prescriptions) {
    const details = byExternalId.get(prescription.external_id);
    if (!details) continue;
    exercises.push(await buildSessionExercise(prescription, details));
  }

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

export function useWorkoutDaySession(dayId: WeekdayId, hasWorkoutProgram = true) {
  const plan = resolveWeekdayPlan(dayId, hasWorkoutProgram);

  return useQuery({
    queryKey: ["workout-day-session", dayId, hasWorkoutProgram],
    queryFn: () => fetchWorkoutDaySession(plan),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/** @deprecated use useWorkoutDaySession(getWeekdayIdFromDate(), hasWorkoutProgram) */
export function useTodayWorkout(hasWorkoutProgram = true) {
  return useWorkoutDaySession(getWeekdayIdFromDate(), hasWorkoutProgram);
}

export { TODAY_WORKOUT_BRIEF, TODAY_WORKOUT_PRESCRIPTIONS };
