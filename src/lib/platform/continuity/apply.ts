import type { ClientTrainingRuntime } from "@/lib/platform/assigned-program-api";
import { formatRepsLabel } from "@/lib/platform/training-assignment";
import type { TodayWorkoutPrescription } from "@/lib/platform/today-workout";
import type { WeekdayId, WeekdayWorkoutPlan } from "@/lib/platform/weekly-workout-schedule";
import { emptyRestPlan } from "@/lib/platform/weekly-workout-schedule";
import type { ContinuityDecision, ContinuityProgramDay, ContinuitySessionFact } from "./types";

function inferRegions(muscleFocus: string | null, externalIds: string[]): string[] {
  const focus = (muscleFocus ?? "").toLowerCase();
  const regions = new Set<string>();
  if (focus.includes("جلوت") || focus.includes("مقعد")) regions.add("GLUTES");
  if (focus.includes("صدر")) regions.add("CHEST");
  if (focus.includes("ظهر")) regions.add("UPPER_BACK");
  if (focus.includes("كتف") || focus.includes("أكتاف")) regions.add("SHOULDERS");
  if (focus.includes("رجل") || focus.includes("فخذ")) regions.add("QUADRICEPS");
  if (focus.includes("باي")) regions.add("BICEPS");
  if (focus.includes("تراي")) regions.add("TRICEPS");
  for (const id of externalIds) {
    const prefix = id.slice(0, 2).toUpperCase();
    if (prefix === "GL") regions.add("GLUTES");
    if (prefix === "CH") regions.add("CHEST");
    if (prefix === "BA") regions.add("UPPER_BACK");
    if (prefix === "SH") regions.add("SHOULDERS");
    if (prefix === "BI") regions.add("BICEPS");
    if (prefix === "TR") regions.add("TRICEPS");
    if (prefix === "LE" || prefix === "LG") regions.add("QUADRICEPS");
  }
  return [...regions];
}

function exercisePriority(index: number, total: number): ContinuityProgramDay["exercises"][number]["priority"] {
  if (index === 0) return "PRIMARY";
  if (index === 1 && total > 2) return "IMPORTANT";
  if (index >= total - 1 && total >= 4) return "OPTIONAL";
  return "SUPPORT";
}

export function programDaysFromRuntime(runtime: ClientTrainingRuntime): ContinuityProgramDay[] {
  const workoutDays = runtime.days.filter((day) => day.day_type === "workout" && day.exercises.length > 0);
  return runtime.days.map((day) => {
    const workoutIndex = workoutDays.findIndex((item) => (item.day_id ?? String(item.day_number)) === (day.day_id ?? String(day.day_number)));
    const ids = day.exercises.map((exercise) => exercise.external_id);
    const sets = day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
    return {
      programDayId: day.day_id ?? `day-${day.day_number}`,
      sequenceIndex: workoutIndex >= 0 ? workoutIndex : day.day_number,
      dayNumber: day.day_number,
      dayType: day.day_type,
      title: day.title_ar,
      primaryRegions: inferRegions(day.muscle_focus, ids),
      exercises: day.exercises.map((exercise, index) => ({
        externalId: exercise.external_id,
        prescribedSets: exercise.sets,
        priority: exercisePriority(index, day.exercises.length),
      })),
      estimatedMinutes: day.estimated_minutes,
      demand: sets >= 14 || (day.estimated_minutes ?? 0) >= 50 ? "HIGH" : sets <= 6 ? "LOW" : "MODERATE",
    };
  });
}

export function runtimeDayToPlan(
  runtime: ClientTrainingRuntime,
  programDayId: string,
  displayWeekday: WeekdayId,
): WeekdayWorkoutPlan {
  const day = runtime.days.find((item) => (item.day_id ?? `day-${item.day_number}`) === programDayId);
  if (!day || day.day_type !== "workout" || day.exercises.length === 0) return emptyRestPlan(displayWeekday);
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
  return {
    id: displayWeekday,
    muscleTitle: day.title_ar || day.muscle_focus || "",
    targetMuscle: day.muscle_focus || day.title_ar || "",
    isRestDay: false,
    prescriptions,
    durationMin: day.estimated_minutes ?? 0,
    calories: day.estimated_calories ?? 0,
    points: 100,
    programDayId: day.day_id ?? programDayId,
  };
}

export function overlayTodayPlan(input: {
  assignedPlans: Record<WeekdayId, WeekdayWorkoutPlan>;
  todayId: WeekdayId;
  runtime: ClientTrainingRuntime;
  decision: ContinuityDecision;
}): Record<WeekdayId, WeekdayWorkoutPlan> {
  if (!input.decision.next_program_day_id) return input.assignedPlans;
  const nextPlan = runtimeDayToPlan(input.runtime, input.decision.next_program_day_id, input.todayId);
  if (nextPlan.isRestDay) return input.assignedPlans;
  return {
    ...input.assignedPlans,
    [input.todayId]: nextPlan,
  };
}

export function noVolumeDebt(decision: ContinuityDecision, nextPrescribedSets: number): boolean {
  return (decision.adherence.working_sets_completed >= 0) && nextPrescribedSets > 0;
}

export function factsFromSessionRecords(
  rows: Array<{
    id: string;
    assignmentId: string | null;
    assignmentDayId?: string | null;
    status: ContinuitySessionFact["status"];
    sessionDate: string;
    startedAt: string | null;
    completedAt?: string | null;
    lastActivityAt: string;
    prescribedWorkingSets?: number | null;
    completedWorkingSets?: number | null;
    prescribedExerciseCount?: number | null;
    completedExerciseCount?: number | null;
  }>,
): ContinuitySessionFact[] {
  return rows.map((row) => ({
    id: row.id,
    assignmentId: row.assignmentId,
    programDayId: row.assignmentDayId ?? null,
    status: row.status,
    sessionDate: row.sessionDate,
    startedAt: row.startedAt,
    lastActivityAt: row.lastActivityAt,
    completedAt: row.completedAt ?? null,
    prescribedWorkingSets: row.prescribedWorkingSets ?? null,
    completedWorkingSets: row.completedWorkingSets ?? null,
    prescribedExercises: row.prescribedExerciseCount ?? null,
    completedExercises: row.completedExerciseCount ?? null,
    meaningfulWorkingExposure: (row.completedWorkingSets ?? 0) > 0,
  }));
}
