import type { ClientTrainingRuntime } from "@/lib/platform/assigned-program-api";
import {
  buildWeekdayPlansForAssignedRuntime,
  calendarSessionsFromRuntime,
} from "@/lib/platform/strategy-matrix/calendar-runtime";
import { resolveWeeklyTrainingSchedule } from "@/lib/platform/strategy-matrix/calendar-resolver";
import {
  resolveSessionPresentation,
  summarizeSessionMuscles,
} from "@/lib/platform/session-muscle-presentation";
import {
  buildWeeklySchedule,
  resolveWeekdayPlan,
  type WeekdayId,
  type WeekdayWorkoutPlan,
} from "@/lib/platform/weekly-workout-schedule";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function countTrainingDays(plans: Record<WeekdayId, WeekdayWorkoutPlan>) {
  return Object.values(plans).filter((plan) => !plan.isRestDay).length;
}

function countTrainingEntries(entries: ReturnType<typeof buildWeeklySchedule>) {
  return entries.filter((entry) => !entry.isRestDay).length;
}

const threeDayRuntime: ClientTrainingRuntime = {
  reason: "ok",
  snapshotComplete: true,
  currentWeekNumber: 1,
  assignment: {
    id: "a1",
    status: "active",
    name_ar: "برنامج QA",
    starts_on: "2026-01-01",
    template_version: 2,
    duration_weeks: 4,
    days_per_week: 3,
  },
  days: [
    {
      day_id: "d1",
      day_number: 1,
      day_type: "workout",
      title_ar: "صدر",
      muscle_focus: "صدر",
      estimated_minutes: 45,
      estimated_calories: 300,
      exercises: [
        {
          id: "e1",
          exercise_id: null,
          external_id: "CH-001",
          name_ar: "bench",
          sets: 4,
          reps_min: 8,
          reps_max: 10,
          reps_label: null,
          rest_seconds: 90,
          suggested_weight_kg: 40,
          notes_ar: null,
        },
      ],
    },
    {
      day_id: "d2",
      day_number: 2,
      day_type: "workout",
      title_ar: "ظهر",
      muscle_focus: "ظهر",
      estimated_minutes: 45,
      estimated_calories: 300,
      exercises: [
        {
          id: "e2",
          exercise_id: null,
          external_id: "BA-010",
          name_ar: "row",
          sets: 4,
          reps_min: 8,
          reps_max: 10,
          reps_label: null,
          rest_seconds: 90,
          suggested_weight_kg: 50,
          notes_ar: null,
        },
      ],
    },
    {
      day_id: "d3",
      day_number: 3,
      day_type: "workout",
      title_ar: "أرجل",
      muscle_focus: "أرجل",
      estimated_minutes: 45,
      estimated_calories: 300,
      exercises: [
        {
          id: "e3",
          exercise_id: null,
          external_id: "LE-001",
          name_ar: "squat",
          sets: 4,
          reps_min: 8,
          reps_max: 10,
          reps_label: null,
          rest_seconds: 90,
          suggested_weight_kg: 60,
          notes_ar: null,
        },
      ],
    },
  ],
};

for (const frequency of [2, 3, 4, 5] as const) {
  const days = Array.from({ length: frequency }, (_, index) => {
    const template = threeDayRuntime.days[index % threeDayRuntime.days.length]!;
    return {
      ...template,
      day_id: `d${index + 1}`,
      day_number: index + 1,
    };
  });
  const sessions = calendarSessionsFromRuntime({
    ...threeDayRuntime,
    assignment: { ...threeDayRuntime.assignment!, days_per_week: frequency },
    days,
  });
  const schedule = resolveWeeklyTrainingSchedule({
    sessions,
    trainingDaysPerWeek: frequency,
    preferredTrainingDays: [],
    trainingLocation: "GYM",
  });
  assert(!("ok" in schedule), `schedule resolves for ${frequency} days`);
  const workoutDays = schedule.days.filter((day) => day.dayKind === "WORKOUT");
  assert(workoutDays.length === frequency, `${frequency} training days in calendar`);
  assert(
    schedule.days.filter((day) => day.dayKind === "REST").length === 7 - frequency,
    `${frequency} rest days in calendar`,
  );
}

const calendarPlans = buildWeekdayPlansForAssignedRuntime(threeDayRuntime, null);
assert(countTrainingDays(calendarPlans) === 3, "assignment frequency maps to 3 training days without strategy");
assert(calendarPlans.tue.isRestDay && calendarPlans.thu.isRestDay, "non-scheduled weekdays stay rest");

const weeklyStrip = buildWeeklySchedule({ assignedPlans: calendarPlans });
assert(countTrainingEntries(weeklyStrip) === 3, "weekly strip shows exactly 3 training days");
assert(weeklyStrip.filter((entry) => entry.isRestDay).length === 4, "weekly strip shows 4 rest days");

const freeSunday = resolveWeekdayPlan("sun", false);
assert(freeSunday.isRestDay, "free preview keeps Sunday rest");
const freeMonday = resolveWeekdayPlan("mon", false);
assert(!freeMonday.isRestDay, "free preview keeps Monday workout");

const legsSummary = summarizeSessionMuscles({
  externalIds: ["LE-001", "LE-004", "GL-001"],
  muscleFocus: "أرجل",
});
assert(legsSummary.visualKey === "LEGS", "legs session maps to LEGS visual");
assert(legsSummary.displayNameAr === "أرجل", "legs session display name");

const pushSummary = summarizeSessionMuscles({
  externalIds: ["CH-001", "CH-004", "TR-001"],
});
assert(pushSummary.visualKey === "PUSH", "chest session maps to PUSH visual");
assert(pushSummary.displayNameAr.includes("صدر"), "push display mentions chest");

const pullSummary = summarizeSessionMuscles({
  externalIds: ["BA-010", "BA-001", "BI-002"],
});
assert(pullSummary.visualKey === "PULL", "back session maps to PULL visual");

const upperSummary = summarizeSessionMuscles({
  externalIds: ["CH-001", "BA-010", "SH-001"],
});
assert(["UPPER", "PULL", "PUSH", "SHOULDERS"].includes(upperSummary.visualKey), "upper session visual");

const fullBodySummary = summarizeSessionMuscles({
  externalIds: ["CH-001", "BA-010", "LE-001", "SH-001", "BI-002"],
});
assert(fullBodySummary.visualKey === "FULL_BODY", "mixed session maps to FULL_BODY");

const legsPlan = calendarPlans.fri;
assert(!legsPlan.isRestDay, "legs session lands on scheduled workout day");
const legsPresentation = resolveSessionPresentation({ plan: legsPlan });
assert(legsPresentation.visualKey === "LEGS", "runtime legs plan presentation matches muscles");

console.log("training-calendar-muscle-fix.test.ts: all tests passed");
