import { supabase } from "@/integrations/supabase/client";
import { formatRepsLabel, ISO_DAY_TO_WEEKDAY } from "@/lib/platform/training-assignment";
import { applySessionPresentationToPlan } from "@/lib/platform/session-muscle-presentation";
import type { TodayWorkoutPrescription } from "@/lib/platform/today-workout";
import type { WeekdayId, WeekdayWorkoutPlan } from "@/lib/platform/weekly-workout-schedule";

export type ClientTrainingRuntime = {
  reason: "ok" | "no_program" | "scheduled" | "ended" | "legacy_incomplete";
  snapshotComplete: boolean;
  currentWeekNumber: number | null;
  assignment: {
    id: string;
    status: string;
    name_ar: string | null;
    starts_on: string | null;
    template_version: number;
    duration_weeks: number | null;
    days_per_week: number | null;
    progression_strategy?: string | null;
  } | null;
  days: Array<{
    day_id?: string;
    day_number: number;
    day_type: string;
    title_ar: string;
    muscle_focus: string | null;
    estimated_minutes: number | null;
    estimated_calories: number | null;
    exercises: Array<{
      id: string;
      exercise_id: string | null;
      external_id: string;
      name_ar: string;
      sets: number;
      reps_min: number | null;
      reps_max: number | null;
      reps_label: string | null;
      rest_seconds: number;
      suggested_weight_kg: number | null;
      notes_ar: string | null;
    }>;
  }>;
};

function emptyRuntime(reason: ClientTrainingRuntime["reason"]): ClientTrainingRuntime {
  return {
    reason,
    snapshotComplete: false,
    currentWeekNumber: null,
    assignment: null,
    days: [],
  };
}

export async function fetchMyTrainingRuntime(): Promise<ClientTrainingRuntime> {
  const { data, error } = await supabase.rpc("client_get_my_training_runtime");
  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  const reason = (row.reason as ClientTrainingRuntime["reason"]) || "no_program";
  const assignment = row.assignment as Record<string, unknown> | null;
  if (!assignment) return emptyRuntime(reason);
  return {
    reason,
    snapshotComplete: Boolean(row.snapshot_complete),
    currentWeekNumber: row.current_week_number == null ? null : Number(row.current_week_number),
    assignment: {
      id: String(assignment.id),
      status: String(assignment.status),
      name_ar: (assignment.name_ar as string | null) ?? null,
      starts_on: (assignment.starts_on as string | null) ?? null,
      template_version: Number(assignment.template_version ?? 1),
      duration_weeks: assignment.duration_weeks == null ? null : Number(assignment.duration_weeks),
      days_per_week: assignment.days_per_week == null ? null : Number(assignment.days_per_week),
      progression_strategy: (assignment.progression_strategy as string | null) ?? null,
    },
    days: ((row.days as ClientTrainingRuntime["days"]) ?? []).map((day) => ({
      ...day,
      day_id: day.day_id ?? (day as { day_id?: string }).day_id,
      exercises: day.exercises ?? [],
    })),
  };
}

export function runtimeToWeekdayPlans(runtime: ClientTrainingRuntime): Record<WeekdayId, WeekdayWorkoutPlan> {
  const ids: WeekdayId[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const rest = (id: WeekdayId): WeekdayWorkoutPlan => ({
    id,
    muscleTitle: "",
    targetMuscle: "",
    isRestDay: true,
    prescriptions: [],
    durationMin: 0,
    calories: 0,
    points: 0,
  });
  const map = Object.fromEntries(ids.map((id) => [id, rest(id)])) as Record<WeekdayId, WeekdayWorkoutPlan>;
  if (runtime.reason !== "ok") return map;

  for (const day of runtime.days) {
    const weekday = ISO_DAY_TO_WEEKDAY[day.day_number];
    if (!weekday) continue;
    const isRest = day.day_type !== "workout" || day.exercises.length === 0;
    const prescriptions: TodayWorkoutPrescription[] = day.exercises.map((exercise) => ({
      external_id: exercise.external_id,
      sets: exercise.sets,
      reps: formatRepsLabel(exercise),
      rest_seconds: exercise.rest_seconds,
      suggested_weight_kg: exercise.suggested_weight_kg ?? undefined,
      assignmentId: runtime.assignment?.id,
      assignmentExerciseId: exercise.id,
      assignmentDayId: day.day_id,
      notes_ar: exercise.notes_ar ?? undefined,
    }));
    map[weekday] = applySessionPresentationToPlan({
      id: weekday,
      muscleTitle: day.title_ar || day.muscle_focus || "",
      targetMuscle: day.muscle_focus || day.title_ar || "",
      isRestDay: isRest,
      prescriptions,
      durationMin: day.estimated_minutes ?? 0,
      calories: day.estimated_calories ?? 0,
      points: isRest ? 0 : 100,
      programDayId: day.day_id,
    });
  }
  return map;
}
