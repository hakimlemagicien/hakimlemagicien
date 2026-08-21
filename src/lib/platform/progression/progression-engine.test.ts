import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAuthoredV2Metadata, toV2Contract } from "@/lib/platform/exercise-library-v2-validator";
import type {
  ExerciseSetHistoryItem,
  TrainingV2Effort,
} from "@/lib/platform/training-v2-contracts";
import { getCoreExercisePrescription } from "@/lib/platform/prescription";
import {
  applyProgressionToLoad,
  excludeCurrentSession,
  getNextSessionProgression,
  nextValidLoad,
  LOAD_SOURCE_PRECEDENCE,
} from "@/lib/platform/progression";
import type { ProgressionContext } from "@/lib/platform/progression/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(
      `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

const authored = loadAuthoredV2Metadata();
const byId = new Map(authored.map((row) => [row.external_id, toV2Contract(row, "placeholder")]));

function ex(id: string) {
  const row = byId.get(id);
  if (!row) throw new Error(`missing ${id}`);
  return row;
}

function row(overrides: Partial<ExerciseSetHistoryItem>): ExerciseSetHistoryItem {
  return {
    id: overrides.id ?? "h",
    workoutSessionId: overrides.workoutSessionId ?? "s1",
    sessionDate: overrides.sessionDate ?? "2026-08-18",
    setNumber: overrides.setNumber ?? 1,
    setType: overrides.setType ?? "WORKING",
    prescribedLoad: overrides.prescribedLoad ?? 50,
    actualLoad: overrides.actualLoad ?? 50,
    prescribedRepsMin: overrides.prescribedRepsMin ?? 8,
    prescribedRepsMax: overrides.prescribedRepsMax ?? 12,
    actualReps: overrides.actualReps ?? 10,
    effort: overrides.effort ?? "medium",
    effortV2: overrides.effortV2 ?? "IDEAL",
    skipped: overrides.skipped ?? false,
    setCompleted: overrides.setCompleted ?? true,
    createdAt: overrides.createdAt ?? `${overrides.sessionDate ?? "2026-08-18"}T10:00:00.000Z`,
    ...overrides,
  };
}

function session(
  sessionId: string,
  date: string,
  reps: Array<number | null>,
  extra: {
    load?: number | null;
    effort?: TrainingV2Effort | null | TrainingV2Effort[];
    skipped?: boolean[];
    setType?: Array<ExerciseSetHistoryItem["setType"]>;
    duration?: number[];
    side?: Array<ExerciseSetHistoryItem["executionSide"]>;
  } = {},
): ExerciseSetHistoryItem[] {
  return reps.map((rep, index) =>
    row({
      id: `${sessionId}-${index + 1}`,
      workoutSessionId: sessionId,
      sessionDate: date,
      setNumber: index + 1,
      actualReps: extra.duration ? null : rep,
      actualLoad: extra.load === undefined ? 50 : extra.load,
      effortV2: Array.isArray(extra.effort)
        ? (extra.effort[index] ?? null)
        : extra.effort === undefined
          ? "IDEAL"
          : extra.effort,
      skipped: extra.skipped?.[index] ?? false,
      setType: extra.setType?.[index] ?? "WORKING",
      actualDurationSeconds: extra.duration?.[index] ?? null,
      executionSide: extra.side?.[index] ?? null,
      createdAt: `${date}T10:0${index}:00.000Z`,
    }),
  );
}

function ctx(overrides: Partial<ProgressionContext> = {}): ProgressionContext {
  return {
    externalId: "CH-001",
    exercise: ex("CH-001"),
    history: [],
    trainingLevel: "BEGINNER",
    requiredWorkingSets: 3,
    repMin: 8,
    repMax: 12,
    availableIncrementKg: 2.5,
    ...overrides,
  };
}

function decide(overrides: Partial<ProgressionContext> = {}) {
  return getNextSessionProgression(ctx(overrides));
}

const mid = session("s1", "2026-08-18", [9, 9, 8]);
assertEqual(decide({ history: mid }).action, "INCREASE_REPS", "9/9/8 progresses reps not load");
assertEqual(decide({ history: mid }).reason_code, "REP_RANGE_NOT_MAXED", "rep range not maxed");
assert(decide({ history: mid }).next_load === 50, "keep 50kg");

const partialTop = session("s1", "2026-08-18", [12, 11, 10]);
assertEqual(decide({ history: partialTop }).action, "KEEP_LOAD", "12/11/10 keep load");
assertEqual(
  decide({ history: partialTop }).reason_code,
  "REP_RANGE_NOT_MAXED",
  "not all sets at max",
);

const fullTop = session("s1", "2026-08-18", [12, 12, 12]);
const up = decide({ history: fullTop, availableIncrementKg: 2 });
assertEqual(up.action, "INCREASE_LOAD", "12/12/12 IDEAL increases load");
assertEqual(up.next_load, 52, "smallest increment 20+2 style from 50+2");
assertEqual(up.reason_code, "TOP_RANGE_MASTERED", "top range mastered");
assert(up.confidence === "MODERATE" || up.confidence === "HIGH", "confidence present");

const veryHard = decide({
  history: session("s1", "2026-08-18", [12, 12, 12], { effort: "VERY_HARD" }),
});
assert(
  veryHard.action === "HOLD_PROGRESSION" || veryHard.action === "KEEP_LOAD",
  "VERY_HARD does not auto increase",
);
assertEqual(veryHard.reason_code, "EFFORT_TOO_HIGH", "effort blocks increase");

const failureTop = decide({
  history: session("s1", "2026-08-18", [12, 12, 12], { effort: "FAILURE" }),
});
assert(failureTop.action !== "INCREASE_LOAD", "FAILURE does not increase load");

const stepped = nextValidLoad({ current: 20, validLoads: [20, 22, 24], mechanics: "COMPOUND" });
assertEqual(stepped.next, 22, "next available 22 not 21");
assertEqual(
  decide({
    history: session("s1", "2026-08-18", [12, 12, 12], { load: 20 }),
    availableIncrementKg: null,
    validLoads: [20, 22, 24],
  }).next_load,
  22,
  "engine returns 22",
);

const isolationJump = nextValidLoad({ current: 5, validLoads: [5, 7.5], mechanics: "ISOLATION" });
assert(isolationJump.limited === true, "7.5 from 5 is a large isolation jump");
const isolationHold = decide({
  exercise: ex("SH-021"),
  externalId: "SH-021",
  history: session("s1", "2026-08-18", [12, 12, 12], { load: 5 }),
  availableIncrementKg: null,
  validLoads: [5, 7.5],
});
assertEqual(isolationHold.action, "KEEP_LOAD", "large isolation increment held");
assertEqual(isolationHold.reason_code, "EQUIPMENT_INCREMENT_LIMITED", "equipment limited");

const newLoadOk = decide({
  history: [
    ...session("s0", "2026-08-16", [12, 12, 12], { load: 50 }),
    ...session("s1", "2026-08-18", [9, 9, 8], { load: 52.5 }),
  ],
  availableIncrementKg: 2.5,
});
assertEqual(newLoadOk.action, "KEEP_LOAD", "new load in range is tolerated");
assertEqual(newLoadOk.reason_code, "NEW_LOAD_TOLERATED", "new load success");
assertEqual(newLoadOk.next_load, 52.5, "keep new load");

const newLoadFail = decide({
  history: [
    ...session("s0", "2026-08-16", [12, 12, 12], { load: 50 }),
    ...session("s1", "2026-08-18", [6, 5], { load: 55, effort: "FAILURE" }),
  ],
  requiredWorkingSets: 2,
  availableIncrementKg: 5,
});
assert(newLoadFail.action === "DECREASE_LOAD", "new load failure decreases");
assertEqual(newLoadFail.reason_code, "NEW_LOAD_NOT_TOLERATED", "not tolerated");
assert(newLoadFail.next_load === 50, "return toward previous load");

const oneWeak = decide({ history: session("s1", "2026-08-18", [9, 8, 7]) });
assertEqual(oneWeak.action, "KEEP_LOAD", "one weak last set does not decrease");
assertEqual(oneWeak.reason_code, "ONE_WEAK_SET", "one weak set reason");

const singleBad = decide({
  history: [...session("s0", "2026-08-16", [10, 10, 9]), ...session("s1", "2026-08-18", [9, 9, 8])],
});
assert(
  singleBad.action === "KEEP_LOAD" || singleBad.action === "HOLD_PROGRESSION",
  "one weaker session keep/hold",
);
assertEqual(singleBad.reason_code, "SINGLE_SESSION_VARIANCE", "not regression");

const decline = decide({
  history: [
    ...session("s0", "2026-08-14", [11, 11, 10], { effort: "IDEAL" }),
    ...session("s1", "2026-08-16", [10, 9, 9], { effort: "VERY_HARD" }),
    ...session("s2", "2026-08-18", [8, 8, 8], { effort: "FAILURE" }),
  ],
});
assertEqual(decline.action, "RECOVERY_REVIEW", "repeated decline reviews recovery");
assert(decline.action !== "INCREASE_LOAD", "no volume/load increase on decline");

const recovery = decide({
  history: fullTop,
  recoveryHold: "RECOVERY_LIMITED",
});
assertEqual(recovery.action, "HOLD_PROGRESSION", "recovery hold");
assertEqual(recovery.reason_code, "RECOVERY_HOLD", "recovery reason");

const safety = decide({ history: fullTop, safetyReview: true });
assertEqual(safety.action, "SAFETY_REVIEW", "safety overrides 12/12/12");
assertEqual(safety.reason_code, "SAFETY_BLOCK", "safety block");

const missingEffort = decide({
  history: session("s1", "2026-08-18", [12, 12, 12], { effort: null }),
});
assert(missingEffort.action !== "INCREASE_LOAD", "missing effort not treated as IDEAL");
assertEqual(missingEffort.reason_code, "MISSING_EFFORT", "missing effort reason");
assertEqual(missingEffort.confidence, "LOW", "low confidence without effort");

const missingReps = decide({
  history: session("s1", "2026-08-18", [null, null, null]),
});
assertEqual(missingReps.action, "INSUFFICIENT_DATA", "missing reps");
assertEqual(missingReps.reason_code, "MISSING_REPS", "missing reps reason");

const missingLoad = decide({
  history: session("s1", "2026-08-18", [12, 12, 12], { load: null }),
});
assertEqual(missingLoad.action, "INSUFFICIENT_DATA", "missing load");

const bwCeiling = decide({
  exercise: ex("BA-001"),
  externalId: "BA-001",
  history: session("s1", "2026-08-18", [15, 15, 15], { load: null, effort: "EASY" }),
  repMin: 6,
  repMax: 15,
});
assertEqual(bwCeiling.action, "PROGRESS_VARIATION", "bodyweight ceiling");
assertEqual(bwCeiling.reason_code, "BODYWEIGHT_REP_CEILING", "no fake kg");
assertEqual(bwCeiling.next_load, null, "no invented load");

const bwBelow = decide({
  exercise: ex("CH-004"),
  externalId: "CH-004",
  history: session("s1", "2026-08-18", [3, 2, 2], { load: null, effort: "FAILURE" }),
  repMin: 8,
  repMax: 12,
});
assertEqual(bwBelow.action, "REGRESS_VARIATION", "below min regresses variation");

const timedMid = decide({
  exercise: ex("AB-006"),
  externalId: "AB-006",
  history: session("s1", "2026-08-18", [1, 1, 1], { duration: [30, 30, 30], load: null }),
  durationMin: 20,
  durationMax: 40,
});
assert(
  timedMid.action === "INCREASE_DURATION" || timedMid.action === "KEEP_DURATION",
  "timed 30s progresses duration",
);
assertEqual(timedMid.reason_code, "DURATION_RANGE_NOT_MAXED", "duration not maxed");

const timedTop = decide({
  exercise: ex("AB-006"),
  externalId: "AB-006",
  history: session("s1", "2026-08-18", [1], { duration: [40], load: null, effort: "EASY" }),
  requiredWorkingSets: 1,
  durationMin: 20,
  durationMax: 40,
});
assertEqual(timedTop.action, "PROGRESS_VARIATION", "timed top can progress variation");

const warmup = decide({
  history: [
    ...session("s1", "2026-08-18", [15], { setType: ["WARMUP"] }),
    ...session("s1", "2026-08-18", [10, 10, 10]).map((item, index) => ({
      ...item,
      setNumber: index + 2,
      id: `w-${index}`,
    })),
  ],
});
assert(warmup.action !== "INCREASE_LOAD", "warmup high reps do not qualify");

const skipped = decide({
  history: [...session("s1", "2026-08-18", [12, 12, 12], { skipped: [false, false, true] })],
});
assert(skipped.action !== "INCREASE_LOAD", "skipped set is not mastery");
assertEqual(skipped.reason_code, "PARTIAL_SESSION", "two completed of three");

const partialSession = decide({
  history: session("s1", "2026-08-18", [12, 12]),
  requiredWorkingSets: 3,
});
assertEqual(partialSession.confidence, "LOW", "partial session low confidence");
assert(partialSession.action !== "INCREASE_LOAD", "no aggressive increase");

const src = readFileSync(join(process.cwd(), "src/lib/platform/progression/engine.ts"), "utf8");
assert(!src.includes("ADD_VOLUME"), "no auto volume");
assert(!src.includes("SET_WEIGHT_INCREMENT"), "no +10% long-term rule");
assert(!src.includes("upper body"), "no upper/lower percentage law");
assert(!src.includes("SET_WEIGHT_INCREMENT = 0.1"), "no 0.1 intra-set rule");
assert(!src.includes("working_sets + 1"), "plateau does not add sets");

const plateau = decide({
  trainingLevel: "INTERMEDIATE",
  history: [
    ...session("s0", "2026-08-10", [9, 9, 9]),
    ...session("s1", "2026-08-12", [9, 9, 9]),
    ...session("s2", "2026-08-14", [9, 9, 9]),
    ...session("s3", "2026-08-16", [9, 9, 9]),
  ],
});
assertEqual(plateau.action, "PLATEAU_REVIEW", "plateau suspected after flat window");
assertEqual(plateau.reason_code, "PLATEAU_SUSPECTED", "not add volume");

const oneFlat = decide({
  trainingLevel: "INTERMEDIATE",
  history: [
    ...session("s0", "2026-08-16", [10, 10, 9]),
    ...session("s1", "2026-08-18", [10, 10, 9]),
  ],
});
assert(oneFlat.action !== "PLATEAU_REVIEW", "one flat session is not plateau");

const beginnerKeep = decide({
  trainingLevel: "BEGINNER",
  history: session("s1", "2026-08-18", [9, 9, 8]),
});
assertEqual(
  beginnerKeep.action,
  "INCREASE_REPS",
  "beginner can progress reps without mandatory load jump",
);

const gluteNoOverride = decide({
  goalId: "GLUTE_GROWTH",
  exercise: ex("GL-001"),
  externalId: "GL-001",
  history: session("s1", "2026-08-18", [5, 5, 4], { effort: "IDEAL" }),
  repMin: 8,
  repMax: 12,
});
assert(gluteNoOverride.action !== "INCREASE_LOAD", "glute goal does not override gates");

const fatLoss = decide({
  goalId: "FAT_LOSS",
  history: fullTop,
  availableIncrementKg: 2.5,
});
assertEqual(fatLoss.action, "INCREASE_LOAD", "fat loss still progresses resistance");

const armsNoCap = decide({
  goalId: "TONED_ARMS_UPPER_BODY",
  exercise: ex("BI-001"),
  externalId: "BI-001",
  history: session("s1", "2026-08-18", [15, 15, 15], { load: 10 }),
  repMin: 8,
  repMax: 15,
  availableIncrementKg: 1,
});
assertEqual(armsNoCap.action, "INCREASE_LOAD", "arms isolation can increase small increment");
assertEqual(armsNoCap.next_load, 11, "small isolation increment");

const overrideHigh = decide({
  prescribedLoad: 20,
  history: [
    ...session("s0", "2026-08-16", [10, 10, 10], { load: 20 }),
    ...session("s1", "2026-08-18", [5, 4, 4], { load: 30, effort: "FAILURE" }),
  ],
});
assert(overrideHigh.action === "DECREASE_LOAD", "manual high load not adopted");
assert(overrideHigh.next_load !== 30, "do not keep failed 30kg");

const coach = decide({
  history: fullTop,
  coachProtected: true,
  coachLoad: 40,
});
assertEqual(coach.action, "KEEP_LOAD", "coach lock keeps");
assertEqual(coach.next_load, 40, "coach load preserved");
assertEqual(coach.reason_code, "COACH_OVERRIDE", "coach reason");

const recond = decide({
  history: fullTop,
  prescriptionState: "RECONDITIONING",
});
assertEqual(recond.action, "RECALIBRATE", "reconditioning does not reuse peak");

const deload = decide({ history: fullTop, recoveryHold: "DELOAD_ACTIVE" });
assertEqual(deload.action, "HOLD_PROGRESSION", "deload input holds");

const leftLimit = decide({
  history: [
    row({
      workoutSessionId: "u1",
      sessionDate: "2026-08-18",
      setNumber: 1,
      actualReps: 8,
      executionSide: "LEFT",
    }),
    row({
      workoutSessionId: "u1",
      sessionDate: "2026-08-18",
      setNumber: 2,
      actualReps: 8,
      executionSide: "LEFT",
    }),
    row({
      workoutSessionId: "u1",
      sessionDate: "2026-08-18",
      setNumber: 3,
      actualReps: 12,
      executionSide: "RIGHT",
    }),
    row({
      workoutSessionId: "u1",
      sessionDate: "2026-08-18",
      setNumber: 4,
      actualReps: 12,
      executionSide: "RIGHT",
    }),
  ],
  requiredWorkingSets: 2,
});
assert(leftLimit.action !== "INCREASE_LOAD", "limiting side blocks increase");

const noSides = decide({ history: fullTop });
assertEqual(noSides.action, "INCREASE_LOAD", "aggregated path when no side data");

const everyAction = decide({ history: fullTop });
assert(Boolean(everyAction.reason_code), "reason code present");
assert(["LOW", "MODERATE", "HIGH"].includes(everyAction.confidence), "confidence enum");

const sameA = decide({ history: fullTop, availableIncrementKg: 2.5 });
const sameB = decide({ history: fullTop, availableIncrementKg: 2.5 });
assertEqual(sameA.action, sameB.action, "deterministic action");
assertEqual(sameA.next_load, sameB.next_load, "deterministic load");

const boom = getNextSessionProgression({
  ...ctx(),
  history: new Proxy([] as ExerciseSetHistoryItem[], {
    get() {
      throw new Error("engine boom");
    },
  }),
});
assert(boom.action === "RECALIBRATE" || boom.action === "KEEP_LOAD", "safe fallback");
assertEqual(boom.reason_code, "ENGINE_ERROR", "engine error logged as reason");
assert(boom.next_load == null, "no random load");

const applied = applyProgressionToLoad({
  progression: up,
  historyLoad: 50,
});
assertEqual(applied.prescribed_load, 52, "phase 4 consumes next load");
assertEqual(applied.load_source, "PROGRESSION_DECISION", "load source progression");

const coachApply = applyProgressionToLoad({
  progression: up,
  historyLoad: 50,
  coachProtected: true,
  coachLoad: 40,
});
assertEqual(coachApply.prescribed_load, 40, "coach precedence over algorithm");
assertEqual(LOAD_SOURCE_PRECEDENCE[0], "COACH_OVERRIDE", "precedence documented");

const rx = getCoreExercisePrescription({
  goalId: "FAT_LOSS",
  trainingLevel: "BEGINNER",
  exerciseExperience: "FAMILIAR",
  exercise: ex("CH-001"),
  location: "GYM",
  recentHistory: fullTop,
  progression: up,
  now: new Date("2026-08-21T12:00:00.000Z"),
});
assertEqual(rx.prescribed_load, 52, "core prescription uses progression next load");
assertEqual(rx.load_source, "PROGRESSION_DECISION", "prescription source");

const currentExcluded = excludeCurrentSession(
  [...session("old", "2026-08-17", [12, 12, 12]), ...session("today", "2026-08-21", [12, 12, 12])],
  "today",
  "2026-08-21",
);
assertEqual(currentExcluded.length, 3, "current session excluded from next-prescription");

const machine = nextValidLoad({ current: 40, validLoads: [40, 45, 50], mechanics: "COMPOUND" });
assertEqual(machine.next, 45, "machine stack 45 not 42.5");

const waistCore = decide({
  goalId: "SLIM_TONED_WAIST",
  exercise: ex("AB-006"),
  externalId: "AB-006",
  history: session("s1", "2026-08-18", [1], { duration: [30], load: null }),
  requiredWorkingSets: 1,
  durationMin: 20,
  durationMax: 40,
});
assert(waistCore.action !== "DECREASE_LOAD", "waist fat loss does not drive core load down");

const substituteA = decide({
  exercise: ex("CH-001"),
  history: session("s1", "2026-08-18", [12, 12, 12], { load: 60 }),
  availableIncrementKg: 2.5,
});
const substituteB = decide({
  exercise: ex("CH-004"),
  externalId: "CH-004",
  history: [],
});
assert(substituteA.next_load !== substituteB.next_load, "substitutes do not inherit load");

assert(!src.toLowerCase().includes("diagnos"), "posture remains non-medical");

console.log("progression engine tests passed");
