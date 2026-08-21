import { getProgramContinuityDecision, toProgressionRecoveryHold, toVolumeContinuityInput } from "./engine";
import { classifyAbsence } from "./reconditioning";
import { overlayTodayPlan, programDaysFromRuntime } from "./apply";
import { windowClosed, permittedShiftDays } from "./dates";
import { CONTINUITY_COPY } from "./explanations";
import type { ContinuityContext, ContinuityProgramDay, ContinuitySessionFact } from "./types";
import type { ClientTrainingRuntime } from "@/lib/platform/assigned-program-api";
import { getLocalDateKey } from "@/lib/platform/readiness";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

const A: ContinuityProgramDay = {
  programDayId: "day-a",
  sequenceIndex: 0,
  dayNumber: 1,
  dayType: "workout",
  title: "A",
  primaryRegions: ["GLUTES"],
  exercises: [
    { externalId: "GL-001", prescribedSets: 4, priority: "PRIMARY" },
    { externalId: "GL-002", prescribedSets: 3, priority: "IMPORTANT" },
    { externalId: "CH-009", prescribedSets: 2, priority: "OPTIONAL" },
  ],
  estimatedMinutes: 50,
  demand: "HIGH",
};

const B: ContinuityProgramDay = {
  programDayId: "day-b",
  sequenceIndex: 1,
  dayNumber: 3,
  dayType: "workout",
  title: "B",
  primaryRegions: ["GLUTES"],
  exercises: [
    { externalId: "GL-003", prescribedSets: 4, priority: "PRIMARY" },
    { externalId: "GL-004", prescribedSets: 3, priority: "IMPORTANT" },
  ],
  estimatedMinutes: 48,
  demand: "HIGH",
};

const C: ContinuityProgramDay = {
  programDayId: "day-c",
  sequenceIndex: 2,
  dayNumber: 5,
  dayType: "workout",
  title: "C",
  primaryRegions: ["CHEST", "UPPER_BACK"],
  exercises: [
    { externalId: "CH-001", prescribedSets: 4, priority: "PRIMARY" },
    { externalId: "BA-001", prescribedSets: 3, priority: "IMPORTANT" },
  ],
  estimatedMinutes: 42,
  demand: "MODERATE",
};

const REST: ContinuityProgramDay = {
  programDayId: "day-rest",
  sequenceIndex: 99,
  dayNumber: 2,
  dayType: "rest",
  title: "Rest",
  primaryRegions: [],
  exercises: [],
  estimatedMinutes: 0,
  demand: "LOW",
};

function session(partial: Partial<ContinuitySessionFact> & Pick<ContinuitySessionFact, "id" | "status" | "sessionDate">): ContinuitySessionFact {
  return {
    assignmentId: "asn-1",
    programDayId: "day-a",
    startedAt: `${partial.sessionDate}T08:00:00.000Z`,
    lastActivityAt: `${partial.sessionDate}T09:00:00.000Z`,
    completedAt: partial.status === "COMPLETED" ? `${partial.sessionDate}T09:00:00.000Z` : null,
    prescribedWorkingSets: 9,
    completedWorkingSets: partial.status === "COMPLETED" ? 9 : 0,
    prescribedExercises: 3,
    completedExercises: partial.status === "COMPLETED" ? 3 : 0,
    meaningfulWorkingExposure: (partial.completedWorkingSets ?? (partial.status === "COMPLETED" ? 9 : 0)) > 0,
    ...partial,
  };
}

function base(overrides: Partial<ContinuityContext> = {}): ContinuityContext {
  return {
    assignmentId: "asn-1",
    assignmentStatus: "active",
    timezone: "Asia/Dubai",
    now: new Date("2026-08-21T10:00:00+04:00"),
    days: [A, REST, B, C],
    sessions: [],
    daysPerWeek: 3,
    recoveryState: "NORMAL",
    ...overrides,
  };
}

const nextA = getProgramContinuityDecision(base());
assertEqual(nextA.action, "CONTINUE_SEQUENCE", "empty history starts at A");
assertEqual(nextA.next_program_day_id, "day-a", "first sequence day");
assertEqual(nextA.reason_code, "NORMAL_SEQUENCE", "normal start");

const afterA = getProgramContinuityDecision(
  base({
    now: new Date("2026-08-19T10:00:00+04:00"),
    sessions: [session({ id: "s1", status: "COMPLETED", sessionDate: "2026-08-17", programDayId: "day-a" })],
  }),
);
assertEqual(afterA.next_program_day_id, "day-b", "A completed → B next");
assertEqual(afterA.action, "CONTINUE_SEQUENCE", "normal sequence after A");
assertEqual(afterA.reason_code, "NORMAL_SEQUENCE", "B still upcoming Wednesday");

const missedB = getProgramContinuityDecision(
  base({
    now: new Date("2026-08-20T10:00:00+04:00"),
    sessions: [session({ id: "s1", status: "COMPLETED", sessionDate: "2026-08-17", programDayId: "day-a" })],
  }),
);
assertEqual(missedB.next_program_day_id, "day-b", "missed B still offers B not C");
assert(missedB.action === "RESCHEDULE_SESSION" || missedB.action === "CONTINUE_SEQUENCE", "no stack after miss");
assert(missedB.adherence.working_sets_prescribed === 9, "no extra sets attached to next");
assertEqual(missedB.next_program_day_id === "day-c", false as unknown as boolean, "never B+C");

const noDouble = getProgramContinuityDecision(
  base({
    now: new Date("2026-08-21T10:00:00+04:00"),
    sessions: [session({ id: "s1", status: "COMPLETED", sessionDate: "2026-08-17", programDayId: "day-a" })],
  }),
);
assertEqual(noDouble.next_program_day_id, "day-b", "still one next day after miss window");
assertEqual(noDouble.action === "CONTINUE_SEQUENCE" || noDouble.action === "RESCHEDULE_SESSION" || noDouble.action === "ENTER_RECONDITIONING", true, "single next session");

const primaryComplete = getProgramContinuityDecision(
  base({
    now: new Date("2026-08-17T20:00:00+04:00"),
    sessions: [
      session({
        id: "p1",
        status: "PARTIALLY_COMPLETED",
        sessionDate: "2026-08-17",
        programDayId: "day-a",
        completedWorkingSets: 7,
        meaningfulWorkingExposure: true,
        lastActivityAt: "2026-08-17T16:00:00.000Z",
        exercises: [
          { externalId: "GL-001", prescribedSets: 4, completedWorkingSets: 4 },
          { externalId: "GL-002", prescribedSets: 3, completedWorkingSets: 3 },
          { externalId: "CH-009", prescribedSets: 2, completedWorkingSets: 0 },
        ],
      }),
    ],
  }),
);
assertEqual(primaryComplete.action, "ADVANCE_AFTER_PARTIAL", "primary complete advances");
assertEqual(primaryComplete.next_program_day_id, "day-b", "advance to B");
assertEqual(primaryComplete.reason_code, "PARTIAL_PRIMARY_COMPLETE", "reason primary complete");

const primaryMissed = getProgramContinuityDecision(
  base({
    now: new Date("2026-08-17T20:00:00+04:00"),
    sessions: [
      session({
        id: "p2",
        status: "PARTIALLY_COMPLETED",
        sessionDate: "2026-08-17",
        programDayId: "day-a",
        completedWorkingSets: 2,
        meaningfulWorkingExposure: true,
        lastActivityAt: "2026-08-17T16:00:00.000Z",
        exercises: [
          { externalId: "GL-001", prescribedSets: 4, completedWorkingSets: 0 },
          { externalId: "GL-002", prescribedSets: 3, completedWorkingSets: 0 },
          { externalId: "CH-009", prescribedSets: 2, completedWorkingSets: 2 },
        ],
      }),
    ],
  }),
);
assertEqual(primaryMissed.action, "REPEAT_PRIORITY_SESSION", "optional-only is not success");
assertEqual(primaryMissed.next_program_day_id, "day-a", "repeat A priority");
assertEqual(primaryMissed.reason_code, "PARTIAL_PRIMARY_MISSED", "primary missed reason");

const resume = getProgramContinuityDecision(
  base({
    now: new Date("2026-08-17T12:00:00+04:00"),
    sessions: [
      session({
        id: "r1",
        status: "IN_PROGRESS",
        sessionDate: "2026-08-17",
        lastActivityAt: "2026-08-17T07:00:00.000Z",
        completedWorkingSets: 3,
        meaningfulWorkingExposure: true,
      }),
    ],
  }),
);
assertEqual(resume.action, "RESUME_SESSION", "recent interruption resumes");
assertEqual(resume.resume_session_id, "r1", "same session id");
assertEqual(resume.reason_code, "ACTIVE_SESSION_RESUME", "resume reason");

const stale = getProgramContinuityDecision(
  base({
    now: new Date("2026-08-19T12:00:00+04:00"),
    sessions: [
      session({
        id: "stale",
        status: "IN_PROGRESS",
        sessionDate: "2026-08-17",
        lastActivityAt: "2026-08-17T07:00:00.000Z",
        completedWorkingSets: 1,
        meaningfulWorkingExposure: true,
        exercises: [
          { externalId: "GL-001", prescribedSets: 4, completedWorkingSets: 1 },
          { externalId: "GL-002", prescribedSets: 3, completedWorkingSets: 0 },
          { externalId: "CH-009", prescribedSets: 2, completedWorkingSets: 0 },
        ],
      }),
    ],
  }),
);
assert(stale.recommended_session_status === "INTERRUPTED" || stale.recommended_session_status === "PARTIALLY_COMPLETED", "stale not left IN_PROGRESS");
assert(stale.action !== "RESUME_SESSION" || (stale.recommended_session_status !== "IN_PROGRESS"), "stale expiry");
assertEqual(stale.reason_code, "STALE_ACTIVE_SESSION", "stale reason");

const shortBreak = getProgramContinuityDecision(
  base({
    now: new Date("2026-08-19T10:00:00+04:00"),
    sessions: [session({ id: "s1", status: "COMPLETED", sessionDate: "2026-08-17", programDayId: "day-a" })],
  }),
);
assert(shortBreak.action !== "ENTER_RECONDITIONING", "short break no reconditioning");
assertEqual(shortBreak.prescription_state, "NORMAL", "level/prescription not reset");

const longBreak = getProgramContinuityDecision(
  base({
    now: new Date("2026-09-10T10:00:00+04:00"),
    daysPerWeek: 3,
    sessions: [session({ id: "s1", status: "COMPLETED", sessionDate: "2026-08-17", programDayId: "day-a", completedAt: "2026-08-17T09:00:00.000Z" })],
  }),
);
assertEqual(longBreak.action, "ENTER_RECONDITIONING", "long break reconditioning");
assertEqual(longBreak.prescription_state, "RECONDITIONING", "prescription state only");
assertEqual(longBreak.recalibration_required, true, "high demand established exercise recalibrates");
assertEqual(toVolumeContinuityInput(longBreak).reconditioningActive, true, "feeds phase 7");
assertEqual(toProgressionRecoveryHold(longBreak), "PROGRESSION_HOLD", "feeds phase 6 hold");

assertEqual(classifyAbsence({ daysSinceLastExposure: 3, missedExpectedExposures: 1, daysPerWeek: 3 }), "SHORT_BREAK", "absence not calendar-only");
assertEqual(classifyAbsence({ daysSinceLastExposure: 12, missedExpectedExposures: 4, daysPerWeek: 3 }), "LONG_BREAK", "duration+missed");

const differentRegion = getProgramContinuityDecision(
  base({
    now: new Date("2026-08-18T10:00:00+04:00"),
    sessions: [
      session({
        id: "upper",
        status: "COMPLETED",
        sessionDate: "2026-08-17",
        programDayId: "day-c",
        completedAt: "2026-08-17T18:00:00.000Z",
        lastActivityAt: "2026-08-17T18:00:00.000Z",
      }),
    ],
  }),
);
assertEqual(differentRegion.next_program_day_id, "day-a", "after C comes A");
assert(differentRegion.reason_code === "BACK_TO_BACK_ALLOWED" || differentRegion.action === "CONTINUE_SEQUENCE" || differentRegion.action === "RESCHEDULE_SESSION", "different region allowed");

const sameRegion = getProgramContinuityDecision(
  base({
    now: new Date("2026-08-18T08:00:00+04:00"),
    recoveryState: "LIMITED",
    localFatigueRegions: ["GLUTES"],
    sessions: [
      session({
        id: "glute",
        status: "COMPLETED",
        sessionDate: "2026-08-17",
        programDayId: "day-a",
        completedAt: "2026-08-17T18:00:00.000Z",
        lastActivityAt: "2026-08-17T18:00:00.000Z",
      }),
    ],
  }),
);
assert(sameRegion.action === "SWAP_SESSION_ORDER" || sameRegion.action === "DEFER_SESSION", "same region recovery-aware");
if (sameRegion.action === "SWAP_SESSION_ORDER") {
  assertEqual(sameRegion.next_program_day_id, "day-c", "swap to upper C");
}

const infiniteSwap = getProgramContinuityDecision(
  base({
    now: new Date("2026-08-18T08:00:00+04:00"),
    recoveryState: "LIMITED",
    localFatigueRegions: ["GLUTES"],
    recentSwapCount: 2,
    sessions: [
      session({
        id: "glute",
        status: "COMPLETED",
        sessionDate: "2026-08-17",
        programDayId: "day-a",
        completedAt: "2026-08-17T18:00:00.000Z",
        lastActivityAt: "2026-08-17T18:00:00.000Z",
      }),
    ],
  }),
);
assertEqual(infiniteSwap.action, "PROGRAM_REVIEW_REQUIRED", "no infinite swap");

const pending = getProgramContinuityDecision(base({ pendingSync: true }));
assertEqual(pending.action, "INSUFFICIENT_DATA", "pending sync not missed");
assertEqual(pending.reason_code, "PENDING_SYNC", "pending reason");

const userSkip = getProgramContinuityDecision(
  base({
    now: new Date("2026-08-17T20:00:00+04:00"),
    sessions: [
      session({
        id: "skip",
        status: "CANCELLED",
        sessionDate: "2026-08-17",
        programDayId: "day-a",
        skipAttribution: "USER_SKIP",
        meaningfulWorkingExposure: false,
        completedWorkingSets: 0,
      }),
    ],
  }),
);
assertEqual(userSkip.reason_code, "USER_SKIPPED", "user skip distinct from missed");
assertEqual(userSkip.next_program_day_id, "day-b", "skip advances without debt");

const coachCancel = getProgramContinuityDecision(
  base({
    sessions: [
      session({
        id: "cc",
        status: "CANCELLED",
        sessionDate: "2026-08-17",
        programDayId: "day-a",
        skipAttribution: "COACH_CANCEL",
        meaningfulWorkingExposure: false,
        completedWorkingSets: 0,
      }),
    ],
  }),
);
assertEqual(coachCancel.reason_code, "COACH_CANCELLED", "coach cancel not client miss");

const duration = getProgramContinuityDecision(
  base({
    sessions: [1, 2, 3, 4].map((n) =>
      session({
        id: `d${n}`,
        status: "PARTIALLY_COMPLETED",
        sessionDate: `2026-08-1${n}`,
        programDayId: "day-a",
        completedWorkingSets: 3,
        meaningfulWorkingExposure: true,
        lastActivityAt: `2026-08-1${n}T10:00:00.000Z`,
        exercises: [
          { externalId: "GL-001", prescribedSets: 4, completedWorkingSets: 2 },
          { externalId: "GL-002", prescribedSets: 3, completedWorkingSets: 1 },
          { externalId: "CH-009", prescribedSets: 2, completedWorkingSets: 0 },
        ],
      }),
    ),
  }),
);
assert(duration.reason_code === "PROGRAM_DURATION_MISMATCH" || duration.schedule_review_required, "duration mismatch review");

const capacitySessions: ContinuitySessionFact[] = [];
for (let i = 0; i < 8; i += 1) {
  capacitySessions.push(
    session({
      id: `m${i}`,
      status: i % 5 === 0 ? "COMPLETED" : "READY",
      sessionDate: `2026-07-${10 + i}`,
      programDayId: i % 3 === 0 ? "day-a" : i % 3 === 1 ? "day-b" : "day-c",
      completedWorkingSets: i % 5 === 0 ? 9 : 0,
      meaningfulWorkingExposure: i % 5 === 0,
    }),
  );
}
const capacity = getProgramContinuityDecision(base({ daysPerWeek: 5, sessions: capacitySessions }));
assert(capacity.reason_code === "SCHEDULE_CAPACITY_MISMATCH" || capacity.schedule_review_required || capacity.action === "SCHEDULE_REVIEW_REQUIRED", "days/week mismatch");

const safety = getProgramContinuityDecision(base({ safetyActive: true }));
assertEqual(safety.action, "SAFETY_REVIEW", "safety override");
assertEqual(safety.reason_code, "SAFETY_BLOCK", "safety reason");

const recovery = getProgramContinuityDecision(
  base({
    recoveryState: "POOR",
    sessions: [session({ id: "s1", status: "COMPLETED", sessionDate: "2026-08-17", programDayId: "day-a" })],
  }),
);
assertEqual(recovery.action, "DEFER_SESSION", "poor recovery no catch-up");
assertEqual(recovery.reason_code, "RECOVERY_CONFLICT", "recovery reason");

const midnight = getProgramContinuityDecision(
  base({
    now: new Date("2026-08-17T23:30:00+04:00"),
    timezone: "Asia/Dubai",
  }),
);
assertEqual(midnight.next_program_day_id, "day-a", "late night still A");
assertEqual(midnight.previous_session_state, "NONE", "midnight is not a miss");

const utcTrap = getLocalDateKey(new Date("2026-08-16T23:30:00+04:00"), "Asia/Dubai");
assertEqual(utcTrap, "2026-08-16", "local date not UTC day");
assertEqual(windowClosed({ scheduledLocalDate: "2026-08-17", nowLocalDate: "2026-08-17", daysPerWeek: 3 }), false, "same local day not closed");
assertEqual(permittedShiftDays(3) > permittedShiftDays(6), true, "3-day has more room than 6-day");

const insufficient = getProgramContinuityDecision(base({ days: [REST] }));
assertEqual(insufficient.action, "INSUFFICIENT_DATA", "no workout days");

const ended = getProgramContinuityDecision(base({ assignmentStatus: "ended" }));
assertEqual(ended.action, "PROGRAM_REVIEW_REQUIRED", "expired program");

const newProgram = getProgramContinuityDecision(
  base({
    previousAssignmentId: "old",
    sessions: [session({ id: "old-s", assignmentId: "old", status: "COMPLETED", sessionDate: "2026-08-10", programDayId: "day-c" })],
  }),
);
assertEqual(newProgram.next_program_day_id, "day-a", "new assignment starts clean");

const warmup = getProgramContinuityDecision(
  base({
    now: new Date("2026-08-17T20:00:00+04:00"),
    sessions: [
      session({
        id: "wu",
        status: "PARTIALLY_COMPLETED",
        sessionDate: "2026-08-17",
        completedWorkingSets: 0,
        meaningfulWorkingExposure: false,
        lastActivityAt: "2026-08-17T16:00:00.000Z",
        exercises: [{ externalId: "GL-001", prescribedSets: 4, completedWorkingSets: 0, warmupOnly: true }],
      }),
    ],
  }),
);
assertEqual(warmup.action, "REPEAT_PRIORITY_SESSION", "warmup is not exposure");

const goalChange = getProgramContinuityDecision(
  base({
    goalChanged: true,
    sessions: [session({ id: "s1", status: "COMPLETED", sessionDate: "2026-08-17", programDayId: "day-a" })],
    now: new Date("2026-08-19T10:00:00+04:00"),
  }),
);
assert(goalChange.next_program_day_id === "day-b", "goal change preserves sequence/history");

const d1 = getProgramContinuityDecision(base({ sessions: afterA.adherence ? [session({ id: "s1", status: "COMPLETED", sessionDate: "2026-08-17", programDayId: "day-a" })] : [], now: new Date("2026-08-19T10:00:00+04:00") }));
const d2 = getProgramContinuityDecision(base({ sessions: [session({ id: "s1", status: "COMPLETED", sessionDate: "2026-08-17", programDayId: "day-a" })], now: new Date("2026-08-19T10:00:00+04:00") }));
assertEqual(d1.action, d2.action, "deterministic action");
assertEqual(d1.next_program_day_id, d2.next_program_day_id, "deterministic next day");

assert(!CONTINUITY_COPY.ENTER_RECONDITIONING.includes("beginner"), "no beginner shaming");
assert(CONTINUITY_COPY.DEFER_SESSION.includes("تعافي"), "supportive missed copy");

const runtime: ClientTrainingRuntime = {
  reason: "ok",
  snapshotComplete: true,
  currentWeekNumber: 1,
  assignment: {
    id: "asn-1",
    status: "active",
    name_ar: "برنامج",
    starts_on: "2026-08-01",
    template_version: 1,
    duration_weeks: 8,
    days_per_week: 3,
  },
  days: [
    {
      day_id: "day-a",
      day_number: 1,
      day_type: "workout",
      title_ar: "A",
      muscle_focus: "جلوت",
      estimated_minutes: 50,
      estimated_calories: 400,
      exercises: [{ id: "e1", exercise_id: null, external_id: "GL-001", name_ar: "hip", sets: 4, reps_min: 8, reps_max: 10, reps_label: null, rest_seconds: 90, suggested_weight_kg: 20, notes_ar: null }],
    },
    {
      day_id: "day-b",
      day_number: 3,
      day_type: "workout",
      title_ar: "B",
      muscle_focus: "جلوت",
      estimated_minutes: 45,
      estimated_calories: 380,
      exercises: [{ id: "e2", exercise_id: null, external_id: "GL-003", name_ar: "rdl", sets: 4, reps_min: 8, reps_max: 10, reps_label: null, rest_seconds: 90, suggested_weight_kg: 24, notes_ar: null }],
    },
  ],
};
const days = programDaysFromRuntime(runtime);
assertEqual(days[0]?.programDayId, "day-a", "runtime keeps day id");
const overlay = overlayTodayPlan({
  assignedPlans: {
    sun: { id: "sun", muscleTitle: "", targetMuscle: "", isRestDay: true, prescriptions: [], durationMin: 0, calories: 0, points: 0 },
    mon: { id: "mon", muscleTitle: "A", targetMuscle: "A", isRestDay: false, prescriptions: [], durationMin: 50, calories: 400, points: 100, programDayId: "day-a" },
    tue: { id: "tue", muscleTitle: "", targetMuscle: "", isRestDay: true, prescriptions: [], durationMin: 0, calories: 0, points: 0 },
    wed: { id: "wed", muscleTitle: "B", targetMuscle: "B", isRestDay: false, prescriptions: [], durationMin: 45, calories: 380, points: 100, programDayId: "day-b" },
    thu: { id: "thu", muscleTitle: "", targetMuscle: "", isRestDay: true, prescriptions: [], durationMin: 0, calories: 0, points: 0 },
    fri: { id: "fri", muscleTitle: "", targetMuscle: "", isRestDay: true, prescriptions: [], durationMin: 0, calories: 0, points: 0 },
    sat: { id: "sat", muscleTitle: "", targetMuscle: "", isRestDay: true, prescriptions: [], durationMin: 0, calories: 0, points: 0 },
  },
  todayId: "thu",
  runtime,
  decision: missedB,
});
assertEqual(overlay.thu.programDayId, "day-b", "Thursday display serves B sequence not Thursday label");
assertEqual(overlay.wed.programDayId, "day-b", "planned Wednesday identity unchanged");

const root = process.cwd();
const engineSrc = readFileSync(join(root, "src/lib/platform/continuity/engine.ts"), "utf8");
assert(!engineSrc.includes("calories"), "no nutrition mutation");
assert(!engineSrc.includes("streak"), "no gamification");
assert(!engineSrc.includes("BEGINNER"), "no auto level downgrade");
assert(!engineSrc.includes("FAT_LOSS"), "no auto goal change");
assert(!engineSrc.includes("owe"), "no volume debt");

const workoutPage = readFileSync(join(root, "src/routes/_platform/app/program/workout/index.tsx"), "utf8");
assert(workoutPage.includes("useProgramContinuity"), "workout page uses continuity");

const homePage = readFileSync(join(root, "src/routes/_platform/app/index.tsx"), "utf8");
assert(homePage.includes("useProgramContinuity"), "home uses continuity next session");

console.log("continuity-engine tests passed");
