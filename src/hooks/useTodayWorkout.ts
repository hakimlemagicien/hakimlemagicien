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

export type TodayWorkoutSession = {
  meta: WorkoutSessionMeta;
  exercises: WorkoutSessionExercise[];
  missingExternalIds: string[];
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

async function fetchTodayWorkoutSession(): Promise<TodayWorkoutSession> {
  const externalIds = TODAY_WORKOUT_PRESCRIPTIONS.map((item) => item.external_id);
  const rows = await fetchExercisesByExternalIds(externalIds);
  const byExternalId = new Map(rows.map((row) => [row.external_id, row]));

  const missingExternalIds = externalIds.filter((id) => !byExternalId.has(id));
  const exercises: WorkoutSessionExercise[] = [];

  for (const prescription of TODAY_WORKOUT_PRESCRIPTIONS) {
    const details = byExternalId.get(prescription.external_id);
    if (!details) continue;
    exercises.push(await buildSessionExercise(prescription, details));
  }

  return {
    meta: {
      points: TODAY_WORKOUT_BRIEF.points,
      durationMin: TODAY_WORKOUT_BRIEF.durationMin,
      calories: TODAY_WORKOUT_BRIEF.calories,
      streakDays: 5,
      totalExercises: exercises.length,
    },
    exercises,
    missingExternalIds,
  };
}

export function useTodayWorkout() {
  return useQuery({
    queryKey: ["today-workout-session"],
    queryFn: fetchTodayWorkoutSession,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
