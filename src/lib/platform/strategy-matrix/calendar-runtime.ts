import type { ClientTrainingRuntime } from "@/lib/platform/assigned-program-api";
import { runtimeToWeekdayPlans } from "@/lib/platform/assigned-program-api";
import { runtimeDayToPlan } from "@/lib/platform/continuity/apply";
import type { WeekdayId, WeekdayWorkoutPlan } from "@/lib/platform/weekly-workout-schedule";
import { emptyRestPlan } from "@/lib/platform/weekly-workout-schedule";
import {
  type CalendarSessionDemand,
  type CalendarSessionInput,
  resolveWeeklyTrainingSchedule,
  type WeeklyTrainingSchedule,
} from "./calendar-resolver";
import { isStrategySupportedDaysPerWeek } from "./constants";
import type { ResolvedTrainingStrategy } from "./types";
import { WEEKDAY_CALENDAR_ORDER } from "./weekdays";

function inferRegions(muscleFocus: string | null, externalIds: string[]): string[] {
  const focus = (muscleFocus ?? "").toLowerCase();
  const regions = new Set<string>();
  if (focus.includes("جلوت") || focus.includes("مقعد")) regions.add("GLUTES");
  if (focus.includes("صدر")) regions.add("CHEST");
  if (focus.includes("ظهر")) regions.add("UPPER_BACK");
  if (focus.includes("كتف") || focus.includes("أكتاف")) regions.add("SHOULDERS");
  if (focus.includes("رجل") || focus.includes("أرجل") || focus.includes("فخذ")) regions.add("QUADRICEPS");
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

function sessionDemand(day: ClientTrainingRuntime["days"][number]): CalendarSessionDemand {
  const sets = day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  if (sets >= 14 || (day.estimated_minutes ?? 0) >= 50) return "HIGH";
  if (sets <= 6) return "LOW";
  return "MODERATE";
}

/** Extracts abstract workout sessions from an assignment runtime (no calendar placement). */
export function calendarSessionsFromRuntime(runtime: ClientTrainingRuntime): CalendarSessionInput[] {
  const workoutDays = runtime.days.filter((day) => day.day_type === "workout" && day.exercises.length > 0);
  return workoutDays.map((day, sequenceIndex) => ({
    sequenceIndex,
    programDayId: day.day_id ?? `day-${day.day_number}`,
    title: day.title_ar,
    primaryRegions: inferRegions(
      day.muscle_focus,
      day.exercises.map((exercise) => exercise.external_id),
    ),
    demand: sessionDemand(day),
  }));
}

export function applyWeeklyScheduleToWeekdayPlans(
  runtime: ClientTrainingRuntime,
  schedule: WeeklyTrainingSchedule,
): Record<WeekdayId, WeekdayWorkoutPlan> {
  const map = Object.fromEntries(
    WEEKDAY_CALENDAR_ORDER.map((id) => [id, emptyRestPlan(id)]),
  ) as Record<WeekdayId, WeekdayWorkoutPlan>;

  if (runtime.reason !== "ok") return map;

  for (const day of schedule.days) {
    if (day.dayKind !== "WORKOUT" || !day.workout) continue;
    map[day.weekdayId] = runtimeDayToPlan(runtime, day.workout.programDayId, day.weekdayId);
  }

  return map;
}

export function buildWeeklyScheduleForRuntime(
  runtime: ClientTrainingRuntime,
  strategy: ResolvedTrainingStrategy | null,
): WeeklyTrainingSchedule | null {
  if (runtime.reason !== "ok") return null;

  const sessions = calendarSessionsFromRuntime(runtime);
  const frequency = strategy?.trainingDaysPerWeek ?? runtime.assignment?.days_per_week;
  if (!frequency || !isStrategySupportedDaysPerWeek(frequency)) return null;
  if (sessions.length !== frequency) return null;

  const result = resolveWeeklyTrainingSchedule({
    sessions,
    trainingDaysPerWeek: frequency,
    preferredTrainingDays: strategy?.preferredTrainingDays ?? [],
    trainingLocation: strategy?.trainingLocation,
  });

  return "ok" in result && result.ok === false ? null : result;
}

/**
 * Builds weekday workout plans for an assigned runtime.
 * Uses the calendar resolver when a resolved strategy is available; otherwise legacy day_number mapping.
 */
export function buildWeekdayPlansForAssignedRuntime(
  runtime: ClientTrainingRuntime,
  strategy: ResolvedTrainingStrategy | null,
): Record<WeekdayId, WeekdayWorkoutPlan> {
  if (runtime.reason !== "ok") return runtimeToWeekdayPlans(runtime);

  const schedule = buildWeeklyScheduleForRuntime(runtime, strategy);
  if (schedule) return applyWeeklyScheduleToWeekdayPlans(runtime, schedule);

  return runtimeToWeekdayPlans(runtime);
}
