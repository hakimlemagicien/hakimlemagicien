import { buildQuizAnswersPayload } from "@/lib/quiz-answers-builder";
import type { ClientTrainingRuntime } from "@/lib/platform/assigned-program-api";
import { runtimeToWeekdayPlans } from "@/lib/platform/assigned-program-api";
import { getProgramContinuityDecision, programDaysFromRuntime } from "@/lib/platform/continuity";
import {
  applyWeeklyScheduleToWeekdayPlans,
  buildWeekdayPlansForAssignedRuntime,
  calendarSessionsFromRuntime,
} from "@/lib/platform/strategy-matrix/calendar-runtime";
import {
  countWorkoutDays,
  resolveWeeklyTrainingSchedule,
  restWeekdayIds,
} from "@/lib/platform/strategy-matrix/calendar-resolver";
import { resolveSessionLocationSemantics } from "@/lib/platform/strategy-matrix/resolve-session-location";
import {
  normalizePreferredTrainingDays,
  parseTrainingProfileAnswers,
  resolveStrategyTrainingLocation,
  resolveTrainingStrategy,
  trainingStrategyInputFromProfileRow,
} from "@/lib/platform/strategy-matrix";
import type { CalendarSessionInput } from "@/lib/platform/strategy-matrix";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function sessions(count: number): CalendarSessionInput[] {
  return Array.from({ length: count }, (_, sequenceIndex) => ({
    sequenceIndex,
    programDayId: `day-${sequenceIndex + 1}`,
    role: `ROLE_${sequenceIndex}`,
    title: `Session ${sequenceIndex + 1}`,
    primaryRegions: sequenceIndex % 2 === 0 ? ["GLUTES"] : ["CHEST"],
    demand: "MODERATE" as const,
  }));
}

function scheduleFingerprint(schedule: ReturnType<typeof resolveWeeklyTrainingSchedule>) {
  assert(!("ok" in schedule), "expected schedule");
  return schedule.days.map((day) =>
    day.dayKind === "REST" ? `${day.weekdayId}:REST` : `${day.weekdayId}:${day.workout?.programDayId}`,
  );
}

// --- Frequency schedules ---

for (const freq of [2, 3, 4, 5] as const) {
  const schedule = resolveWeeklyTrainingSchedule({
    sessions: sessions(freq),
    trainingDaysPerWeek: freq,
    preferredTrainingDays: [],
    trainingLocation: "GYM",
  });
  assert(!("ok" in schedule), `${freq} sessions schedule resolves`);
  assertEqual(countWorkoutDays(schedule), freq, `${freq} workout days`);
  assertEqual(restWeekdayIds(schedule).length, 7 - freq, `${freq} rest days`);
}

// --- Preferred weekdays ---

const preferred3 = resolveWeeklyTrainingSchedule({
  sessions: sessions(3),
  trainingDaysPerWeek: 3,
  preferredTrainingDays: ["mon", "wed", "fri"],
  trainingLocation: "HOME",
});
assert(!("ok" in preferred3), "preferred schedule resolves");
assertEqual(
  preferred3.days.filter((day) => day.dayKind === "WORKOUT").map((day) => day.weekdayId),
  ["mon", "wed", "fri"],
  "preferred weekdays honored",
);
assert(
  preferred3.days.every(
    (day) => day.dayKind === "REST" || day.workout?.placementSource === "CLIENT_PREFERENCE",
  ),
  "preferred source",
);

// --- Duplicate / invalid weekdays ---

const dup = normalizePreferredTrainingDays(["mon", "mon", "wed", "invalid"]);
assert(dup.days.includes("mon") && dup.days.includes("wed"), "valid days kept");
assert(dup.warnings.some((warning) => warning.startsWith("DUPLICATE_WEEKDAY")), "duplicate warning");
assert(dup.warnings.some((warning) => warning.startsWith("INVALID_WEEKDAY")), "invalid warning");

// --- Missing preferred days fallback ---

const fallback3 = resolveWeeklyTrainingSchedule({
  sessions: sessions(3),
  trainingDaysPerWeek: 3,
  preferredTrainingDays: [],
  trainingLocation: "GYM",
});
assert(!("ok" in fallback3), "fallback schedule");
assert(fallback3.placementSource === "FALLBACK", "fallback placement source");
assert(fallback3.warnings.includes("SCHEDULE_FALLBACK_NO_PREFERRED_DAYS"), "fallback labeled");

// --- Rest days are not workouts ---

assert(
  fallback3.days.every((day) => (day.dayKind === "REST") === !day.workout),
  "rest vs workout mutual",
);

// --- Determinism ---

const a = scheduleFingerprint(
  resolveWeeklyTrainingSchedule({
    sessions: sessions(4),
    trainingDaysPerWeek: 4,
    preferredTrainingDays: ["tue", "thu"],
    trainingLocation: "BOTH",
  }),
);
const b = scheduleFingerprint(
  resolveWeeklyTrainingSchedule({
    sessions: sessions(4),
    trainingDaysPerWeek: 4,
    preferredTrainingDays: ["tue", "thu"],
    trainingLocation: "BOTH",
  }),
);
assertEqual(a, b, "deterministic schedule");

// --- Location semantics ---

assertEqual(resolveSessionLocationSemantics("GYM"), "GYM", "GYM session location");
assertEqual(resolveSessionLocationSemantics("HOME"), "HOME", "HOME session location");
assertEqual(resolveSessionLocationSemantics("BOTH"), "FLEXIBLE", "BOTH flexible");
assertEqual(resolveSessionLocationSemantics("UNKNOWN"), "FLEXIBLE", "UNKNOWN flexible");

const bothSchedule = resolveWeeklyTrainingSchedule({
  sessions: sessions(3),
  trainingDaysPerWeek: 3,
  preferredTrainingDays: [],
  trainingLocation: "BOTH",
});
assert(!("ok" in bothSchedule), "BOTH schedule");
assert(
  bothSchedule.days
    .filter((day) => day.dayKind === "WORKOUT")
    .every((day) => day.workout?.sessionLocation === "FLEXIBLE"),
  "BOTH does not invent per-day location",
);

// --- Partial preferences (Scenario B) ---

const partial4 = resolveWeeklyTrainingSchedule({
  sessions: sessions(4),
  trainingDaysPerWeek: 4,
  preferredTrainingDays: ["mon", "wed"],
  trainingLocation: "GYM",
});
assert(!("ok" in partial4), "partial preference schedule");
assert(partial4.placementSource === "MIXED", "mixed placement");
assert(
  partial4.days.some((day) => day.workout?.placementSource === "CLIENT_PREFERENCE"),
  "keeps client preference",
);
assertEqual(countWorkoutDays(partial4), 4, "fills to frequency");

// --- Quiz payload persistence (trainingEnvironment) ---

for (const env of ["gym", "home", "anywhere"] as const) {
  const payload = buildQuizAnswersPayload({ trainingEnvironment: env }) as Record<string, unknown>;
  assertEqual(payload.trainingEnvironment, env, `quiz payload stores ${env}`);
  const parsed = parseTrainingProfileAnswers(payload);
  assertEqual(parsed.trainingEnvironment, env, `profile parser reads ${env}`);
  const location = resolveStrategyTrainingLocation({ trainingEnvironment: env });
  assert(location.ok, `location resolves for ${env}`);
  const expected = env === "gym" ? "GYM" : env === "home" ? "HOME" : "BOTH";
  assertEqual(location.trainingLocation, expected, `${env} → ${expected}`);
}

// --- Legacy runtime compatibility ---

const legacyRuntime: ClientTrainingRuntime = {
  reason: "ok",
  snapshotComplete: true,
  currentWeekNumber: 1,
  assignment: {
    id: "a1",
    status: "active",
    name_ar: "legacy",
    starts_on: "2026-01-01",
    template_version: 1,
    duration_weeks: 4,
    days_per_week: 3,
  },
  days: [
    {
      day_id: "d1",
      day_number: 1,
      day_type: "workout",
      title_ar: "A",
      muscle_focus: "صدر",
      estimated_minutes: 45,
      estimated_calories: 300,
      exercises: [
        {
          id: "e1",
          exercise_id: null,
          external_id: "CH-001",
          name_ar: "chest",
          sets: 3,
          reps_min: 8,
          reps_max: 10,
          reps_label: null,
          rest_seconds: 90,
          suggested_weight_kg: 20,
          notes_ar: null,
        },
      ],
    },
    {
      day_id: "d2",
      day_number: 2,
      day_type: "workout",
      title_ar: "B",
      muscle_focus: "ظهر",
      estimated_minutes: 45,
      estimated_calories: 300,
      exercises: [
        {
          id: "e2",
          exercise_id: null,
          external_id: "BA-001",
          name_ar: "back",
          sets: 3,
          reps_min: 8,
          reps_max: 10,
          reps_label: null,
          rest_seconds: 90,
          suggested_weight_kg: 30,
          notes_ar: null,
        },
      ],
    },
    {
      day_id: "d3",
      day_number: 3,
      day_type: "workout",
      title_ar: "C",
      muscle_focus: "رجل",
      estimated_minutes: 45,
      estimated_calories: 300,
      exercises: [
        {
          id: "e3",
          exercise_id: null,
          external_id: "LE-001",
          name_ar: "legs",
          sets: 3,
          reps_min: 8,
          reps_max: 10,
          reps_label: null,
          rest_seconds: 90,
          suggested_weight_kg: 40,
          notes_ar: null,
        },
      ],
    },
  ],
};

const calendarOnlyPlans = buildWeekdayPlansForAssignedRuntime(legacyRuntime, null);
assert(calendarOnlyPlans.mon.programDayId, "assignment without strategy still uses weekly calendar");
assert(calendarOnlyPlans.tue.isRestDay, "calendar rest day without strategy");
assert(calendarOnlyPlans.wed.programDayId, "fallback weekday placement without strategy");

const strategy = resolveTrainingStrategy(
  trainingStrategyInputFromProfileRow({
    userId: "u1",
    goal: "glutes",
    answers: {
      goalId: "glutes",
      trainingEnvironment: "anywhere",
      trainingDaysPerWeek: 3,
      preferredTrainingDays: ["mon", "wed", "fri"],
    },
  }),
);
assert(strategy.ok, "strategy for scheduled runtime");
const scheduledPlans = buildWeekdayPlansForAssignedRuntime(
  legacyRuntime,
  strategy.ok ? strategy.strategy : null,
);
assert(scheduledPlans.wed.programDayId, "strategy path places session on wed");
assert(scheduledPlans.tue.isRestDay, "non-workout day is rest");

// --- Continuity integration (Scenario E) — no volume debt path ---

const continuityDecision = getProgramContinuityDecision({
  assignmentId: "a1",
  assignmentStatus: "active",
  timezone: "Asia/Dubai",
  now: new Date("2026-01-07T10:00:00Z"),
  days: programDaysFromRuntime(legacyRuntime),
  sessions: [],
  daysPerWeek: 3,
  pendingSync: false,
});
assert(continuityDecision.action !== "CATCH_UP_SET_DEBT", "no set debt action");

// --- Rest day adherence (Scenario F) ---

const scheduleForRuntime = resolveWeeklyTrainingSchedule({
  sessions: calendarSessionsFromRuntime(legacyRuntime),
  trainingDaysPerWeek: 3,
  preferredTrainingDays: ["mon", "wed", "fri"],
  trainingLocation: "GYM",
});
assert(!("ok" in scheduleForRuntime), "runtime-backed schedule");
const plans = applyWeeklyScheduleToWeekdayPlans(legacyRuntime, scheduleForRuntime);
assert(plans.sun.isRestDay && plans.tue.isRestDay, "calendar rest days");
assert(!plans.mon.isRestDay, "workout day not rest");

// --- Fail-closed goal unchanged ---

const toneReady = resolveTrainingStrategy(
  trainingStrategyInputFromProfileRow({
    userId: "u2",
    goal: "tone",
    answers: {
      goalId: "tone",
      trainingEnvironment: "gym",
      activityLevel: "moderate",
    },
  }),
);
assert(toneReady.ok, "quiz tone + activity + gym environment resolves via bridge");

const blocked = resolveTrainingStrategy(
  trainingStrategyInputFromProfileRow({
    userId: "u2",
    goal: "not-a-real-goal",
    answers: { goalId: "not-a-real-goal", trainingEnvironment: "gym", trainingDaysPerWeek: 3 },
  }),
);
assert(!blocked.ok, "unknown goal remains fail-closed");

console.log("calendar-resolver.test.ts: all tests passed");
