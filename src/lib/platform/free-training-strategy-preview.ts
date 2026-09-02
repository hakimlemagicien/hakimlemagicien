import { generateTrainingProgram, canActivateProgram } from "@/lib/platform/program-generation";
import type { GeneratedExercise, GeneratedSession, ProgramCandidate } from "@/lib/platform/program-generation/types";
import { applySessionPresentationToPlan } from "@/lib/platform/session-muscle-presentation";
import { formatRepsLabel } from "@/lib/platform/training-assignment";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import { buildProgramGenerationContextFromProfile } from "@/lib/platform/strategy-matrix/build-from-profile";
import {
  resolveWeeklyTrainingSchedule,
  type CalendarSessionInput,
  type WeeklyTrainingSchedule,
} from "@/lib/platform/strategy-matrix/calendar-resolver";
import type { ResolvedTrainingStrategy, TrainingStrategyInput } from "@/lib/platform/strategy-matrix/types";
import { WEEKDAY_CALENDAR_ORDER } from "@/lib/platform/strategy-matrix/weekdays";
import type { TodayWorkoutPrescription } from "@/lib/platform/today-workout";
import { emptyRestPlan, type WeekdayId, type WeekdayWorkoutPlan } from "@/lib/platform/weekly-workout-schedule";

function sessionDemand(role: GeneratedSession["role"]): CalendarSessionInput["demand"] {
  if (
    role === "LOWER_GLUTE_PRIORITY" ||
    role === "UPPER_PRIORITY" ||
    role === "PULL_POSTERIOR" ||
    role === "FULL_BODY"
  ) {
    return "HIGH";
  }
  if (role === "CORE_SUPPORT") return "LOW";
  return "MODERATE";
}

function formatGeneratedReps(exercise: GeneratedExercise): string | undefined {
  if (exercise.duration_seconds) return `${exercise.duration_seconds} ث`;
  return formatRepsLabel({ reps_min: exercise.reps_min, reps_max: exercise.reps_max });
}

export function weekdayPlansFromProgramCandidate(
  candidate: ProgramCandidate,
  strategy: ResolvedTrainingStrategy,
): Record<WeekdayId, WeekdayWorkoutPlan> {
  const map = Object.fromEntries(WEEKDAY_CALENDAR_ORDER.map((id) => [id, emptyRestPlan(id)])) as Record<
    WeekdayId,
    WeekdayWorkoutPlan
  >;

  const sessions: CalendarSessionInput[] = candidate.sessions.map((session) => ({
    sequenceIndex: session.sequence_index,
    programDayId: session.program_day_id,
    role: session.role,
    title: session.title,
    primaryRegions: session.primary_regions,
    demand: sessionDemand(session.role),
  }));

  const scheduleResult = resolveWeeklyTrainingSchedule({
    sessions,
    trainingDaysPerWeek: strategy.trainingDaysPerWeek,
    preferredTrainingDays: strategy.preferredTrainingDays,
    trainingLocation: strategy.trainingLocation,
  });

  if ("ok" in scheduleResult && scheduleResult.ok === false) return map;

  const schedule = scheduleResult as WeeklyTrainingSchedule;
  const byProgramDayId = new Map(candidate.sessions.map((session) => [session.program_day_id, session]));

  for (const day of schedule.days) {
    if (day.dayKind !== "WORKOUT" || !day.workout) continue;
    const session = byProgramDayId.get(day.workout.programDayId);
    if (!session || session.exercises.length === 0) continue;

    const prescriptions: TodayWorkoutPrescription[] = session.exercises.map((exercise) => ({
      external_id: exercise.external_id,
      sets: exercise.sets,
      reps: formatGeneratedReps(exercise),
      duration_seconds: exercise.duration_seconds ?? undefined,
      rest_seconds: exercise.rest_seconds,
    }));

    map[day.weekdayId] = applySessionPresentationToPlan({
      id: day.weekdayId,
      muscleTitle: session.title,
      targetMuscle: session.primary_regions[0] ?? session.title,
      isRestDay: false,
      prescriptions,
      durationMin: session.estimated_minutes,
      calories: Math.max(200, Math.round(session.estimated_minutes * 9)),
      points: 80 + session.exercises.length * 10,
      programDayId: session.program_day_id,
    });
  }

  return map;
}

/**
 * Free-tier preview: full strategy-aware session prescriptions (all exercises visible),
 * while entitlements still allow only one unlocked exercise per day.
 */
export function buildFreeStrategyPreviewWeekdayPlans(
  strategyInput: TrainingStrategyInput,
  exercises: ExerciseV2Metadata[],
): Record<WeekdayId, WeekdayWorkoutPlan> | null {
  const built = buildProgramGenerationContextFromProfile(strategyInput, { exercises });
  if (!built.ok) return null;

  const generated = generateTrainingProgram(built.context);
  if (!generated.candidate || !canActivateProgram(generated.validation, generated.status)) {
    return null;
  }

  return weekdayPlansFromProgramCandidate(generated.candidate, built.strategy);
}
