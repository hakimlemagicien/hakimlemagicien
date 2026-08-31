import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAuthoredV2Metadata, toV2Contract } from "@/lib/platform/exercise-library-v2-validator";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import { getNextSessionProgression } from "@/lib/platform/progression";
import {
  getWeeklyVolumeDecision,
  toProgressionRecoveryHold,
  contributionWeight,
} from "@/lib/platform/volume";
import { CONTRIBUTION_WEIGHT } from "@/lib/platform/volume/types";
import type {
  VolumeSetInput,
  WeeklyVolumeContext,
  PrescribedVolumeInput,
} from "@/lib/platform/volume/types";

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

function ex(id: string): ExerciseV2Metadata {
  const row = byId.get(id);
  if (!row) throw new Error(`missing ${id}`);
  return row;
}

const catalog = {
  "GL-001": ex("GL-001"),
  "CH-001": ex("CH-001"),
  "BI-001": ex("BI-001"),
  "AB-001": ex("AB-001"),
  "BA-010": ex("BA-010"),
  "CR-001": ex("CR-001"),
};

function working(
  weekKey: string,
  date: string,
  externalId: string,
  count: number,
  extra: Partial<VolumeSetInput> = {},
): VolumeSetInput[] {
  return Array.from({ length: count }, (_, index) => ({
    weekKey,
    sessionDate: date,
    externalId,
    setType: extra.setType ?? "WORKING",
    skipped: extra.skipped ?? false,
    setCompleted: extra.setCompleted ?? true,
    effortV2: extra.effortV2 ?? "IDEAL",
    actualReps: extra.actualReps ?? 10,
    actualLoad: extra.actualLoad ?? 50,
    prescribedRestSeconds: extra.prescribedRestSeconds ?? 90,
    actualRestSeconds: extra.actualRestSeconds ?? 90,
    ...extra,
  }));
}

function prescribed(
  weekKey: string,
  externalId: string,
  workingSets: number,
): PrescribedVolumeInput {
  return { weekKey, externalId, workingSets };
}

function ctx(overrides: Partial<WeeklyVolumeContext> = {}): WeeklyVolumeContext {
  return {
    goalId: "GLUTE_GROWTH",
    trainingLevel: "INTERMEDIATE",
    exercises: catalog,
    sets: [],
    prescribed: [],
    ...overrides,
  };
}

assertEqual(contributionWeight("DIRECT_PRIMARY"), 1, "direct primary weight");
assertEqual(contributionWeight("DIRECT_SECONDARY"), 0.5, "direct secondary is not a full set");
assertEqual(contributionWeight("INDIRECT_MEANINGFUL"), 0.25, "indirect partial");
assertEqual(contributionWeight("MINOR_STABILIZER"), 0, "stabilizer excluded");
assertEqual(CONTRIBUTION_WEIGHT.DIRECT_PRIMARY, 1, "documented weight table");

const hip = getWeeklyVolumeDecision(
  ctx({
    sets: working("2026-W33", "2026-08-12", "GL-001", 3),
    prescribed: [prescribed("2026-W33", "GL-001", 3)],
  }),
);
const glute = hip.regions.find((row) => row.region === "GLUTES");
assert(glute, "glute region present");
assertEqual(glute!.completed_volume, 3, "direct working sets count");
assertEqual(glute!.effective_volume, 3, "direct effective = 3");
assertEqual(hip.physical_set_count, 3, "physical count is 3");
const hammies = hip.regions.find((row) => row.region === "HAMSTRINGS");
assert(hammies, "hamstrings secondary present");
assert(
  hammies!.effective_volume < hammies!.completed_volume + 0.01 || hammies!.effective_volume === 1.5,
  "secondary not full 3",
);
assertEqual(hammies!.effective_volume, 1.5, "3 * 0.5 hamstring contribution");

const warmup = getWeeklyVolumeDecision(
  ctx({
    sets: [
      ...working("2026-W33", "2026-08-12", "GL-001", 2, { setType: "WARMUP", actualReps: 15 }),
      ...working("2026-W33", "2026-08-12", "GL-001", 3),
    ],
    prescribed: [prescribed("2026-W33", "GL-001", 3)],
  }),
);
assertEqual(warmup.physical_set_count, 3, "warmup excluded from working volume");

const skipped = getWeeklyVolumeDecision(
  ctx({
    sets: [
      ...working("2026-W33", "2026-08-12", "GL-001", 2),
      ...working("2026-W33", "2026-08-12", "GL-001", 1, {
        skipped: true,
        setCompleted: false,
        actualReps: null,
      }),
    ],
    prescribed: [prescribed("2026-W33", "GL-001", 3)],
  }),
);
assertEqual(skipped.physical_set_count, 2, "skipped not completed");
assertEqual(
  skipped.regions.find((row) => row.region === "GLUTES")!.prescribed_volume,
  3,
  "prescribed remains 3",
);

const bench = getWeeklyVolumeDecision(
  ctx({
    goalId: "TONED_ARMS_UPPER_BODY",
    sets: working("2026-W33", "2026-08-12", "CH-001", 1, { actualLoad: 40, actualReps: 8 }),
    prescribed: [prescribed("2026-W33", "CH-001", 1)],
  }),
);
assertEqual(bench.physical_set_count, 1, "one physical set");
assertEqual(
  bench.regions.find((row) => row.region === "CHEST")!.effective_volume,
  1,
  "chest direct",
);
assertEqual(
  bench.regions.find((row) => row.region === "TRICEPS")!.effective_volume,
  0.5,
  "triceps not a full primary set",
);

const productiveWeeks = ["2026-W31", "2026-W32", "2026-W33", "2026-W34"] as const;
const productive = getWeeklyVolumeDecision(
  ctx({
    sets: productiveWeeks.flatMap((week, index) =>
      working(week, `2026-08-${10 + index}`, "GL-001", 3, {
        actualReps: 8 + index,
        actualLoad: 50,
      }),
    ),
    prescribed: productiveWeeks.map((week) => prescribed(week, "GL-001", 3)),
  }),
);
assertEqual(productive.program_action, "KEEP_VOLUME", "productive progress keeps volume");
assert(productive.program_action !== "ADD_SMALL_VOLUME", "no automatic weekly set addition");

const twoStable = getWeeklyVolumeDecision(
  ctx({
    trainingLevel: "INTERMEDIATE",
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 3, { actualReps: 10, actualLoad: 50 }),
      ...working("2026-W33", "2026-08-17", "GL-001", 3, { actualReps: 10, actualLoad: 50 }),
    ],
    prescribed: [prescribed("2026-W32", "GL-001", 3), prescribed("2026-W33", "GL-001", 3)],
    lastVolumeAction: { action: "KEEP_VOLUME", validWeeksAgo: 4 },
  }),
);
assertEqual(
  twoStable.program_action,
  "ADD_SMALL_VOLUME",
  "stable primary completed volume may add +1",
);
assertEqual(twoStable.recommended_delta, 1, "conservative +1");

const oneFlat = getWeeklyVolumeDecision(
  ctx({
    sets: working("2026-W33", "2026-08-17", "GL-001", 3, { actualReps: 10 }),
    prescribed: [prescribed("2026-W33", "GL-001", 3)],
  }),
);
assert(
  oneFlat.program_action === "KEEP_VOLUME" || oneFlat.program_action === "INSUFFICIENT_DATA",
  "one week not +set",
);
assert(oneFlat.recommended_delta === 0, "no add after one flat week");

const lowCompletion = getWeeklyVolumeDecision(
  ctx({
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 9),
      ...working("2026-W33", "2026-08-17", "GL-001", 9),
    ],
    prescribed: [prescribed("2026-W32", "GL-001", 15), prescribed("2026-W33", "GL-001", 15)],
  }),
);
assert(lowCompletion.program_action !== "ADD_SMALL_VOLUME", "low completion does not add");
assert(
  lowCompletion.program_action === "REDUCE_VOLUME" ||
    lowCompletion.program_action === "HOLD_VOLUME_PROGRESSION",
  "repeated 9/15 reduces or holds",
);

const local = getWeeklyVolumeDecision(
  ctx({
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 3, { actualReps: 12, actualLoad: 50 }),
      ...working("2026-W32", "2026-08-10", "CH-001", 3, { actualReps: 10, actualLoad: 40 }),
      ...working("2026-W33", "2026-08-17", "GL-001", 3, {
        actualReps: 7,
        actualLoad: 50,
        effortV2: "VERY_HARD",
      }),
      ...working("2026-W33", "2026-08-17", "CH-001", 3, {
        actualReps: 10,
        actualLoad: 40,
        effortV2: "IDEAL",
      }),
    ],
    prescribed: [
      prescribed("2026-W32", "GL-001", 3),
      prescribed("2026-W32", "CH-001", 3),
      prescribed("2026-W33", "GL-001", 3),
      prescribed("2026-W33", "CH-001", 3),
    ],
  }),
);
const localGlute = local.regions.find((row) => row.region === "GLUTES");
assertEqual(localGlute!.local_fatigue, "HIGH", "glute local fatigue");
assert(local.global_fatigue !== "HIGH", "not automatically global");
assert(localGlute!.volume_action !== "ADD_SMALL_VOLUME", "fatigued glutes do not add volume");

const global = getWeeklyVolumeDecision(
  ctx({
    readiness: [
      { localDate: "2026-08-16", energy: "low", sleep: "poor", body: "fatigued" },
      { localDate: "2026-08-17", energy: "low", sleep: "poor", body: "fatigued" },
      { localDate: "2026-08-18", energy: "low", sleep: "poor", body: "fatigued" },
    ],
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 3, { actualReps: 12, actualLoad: 50 }),
      ...working("2026-W32", "2026-08-10", "CH-001", 3, { actualReps: 10, actualLoad: 40 }),
      ...working("2026-W33", "2026-08-17", "GL-001", 2, {
        actualReps: 7,
        actualLoad: 50,
        effortV2: "FAILURE",
      }),
      ...working("2026-W33", "2026-08-17", "CH-001", 2, {
        actualReps: 6,
        actualLoad: 40,
        effortV2: "VERY_HARD",
      }),
    ],
    prescribed: [
      prescribed("2026-W32", "GL-001", 3),
      prescribed("2026-W32", "CH-001", 3),
      prescribed("2026-W33", "GL-001", 3),
      prescribed("2026-W33", "CH-001", 3),
    ],
  }),
);
assert(
  global.global_fatigue === "HIGH" || global.recovery_state === "POOR",
  "global recovery limited/poor",
);
assert(global.program_action !== "ADD_SMALL_VOLUME", "no volume increase when global fatigue");
assert(
  global.program_action === "DELOAD_REVIEW" ||
    global.program_action === "HOLD_VOLUME_PROGRESSION" ||
    global.program_action === "REDUCE_VOLUME",
  "hold/reduce/deload review",
);

const oneHard = getWeeklyVolumeDecision(
  ctx({
    sets: working("2026-W33", "2026-08-17", "GL-001", 6, { effortV2: "VERY_HARD", actualReps: 8 }),
    prescribed: [prescribed("2026-W33", "GL-001", 6)],
  }),
);
assert(oneHard.program_action !== "DELOAD_REVIEW", "one hard session is not a deload");

const deload = getWeeklyVolumeDecision(
  ctx({
    readiness: [
      { localDate: "2026-08-16", energy: "low", sleep: "poor", body: "fatigued" },
      { localDate: "2026-08-17", energy: "low", sleep: "poor", body: "fatigued" },
      { localDate: "2026-08-18", energy: "low", sleep: "poor", body: "fatigued" },
    ],
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 4, { actualReps: 12, effortV2: "IDEAL" }),
      ...working("2026-W32", "2026-08-10", "CH-001", 4, { actualReps: 10, effortV2: "IDEAL" }),
      ...working("2026-W33", "2026-08-17", "GL-001", 2, { actualReps: 6, effortV2: "FAILURE" }),
      ...working("2026-W33", "2026-08-17", "CH-001", 2, { actualReps: 5, effortV2: "VERY_HARD" }),
    ],
    prescribed: [
      prescribed("2026-W32", "GL-001", 4),
      prescribed("2026-W32", "CH-001", 4),
      prescribed("2026-W33", "GL-001", 4),
      prescribed("2026-W33", "CH-001", 4),
    ],
  }),
);
assertEqual(
  deload.program_action,
  "DELOAD_REVIEW",
  "persistent multi-signal fatigue → deload review",
);
assert(deload.recommended_delta === 0, "no invented 50% cut");
assertEqual(
  toProgressionRecoveryHold({ recovery: deload.recovery_state, programAction: "DELOAD_REVIEW" }),
  "PROGRESSION_HOLD",
  "review is not silent DELOAD_ACTIVE",
);

const glutePositive = getWeeklyVolumeDecision(
  ctx({
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 3, { actualReps: 8 }),
      ...working("2026-W33", "2026-08-17", "GL-001", 3, { actualReps: 11 }),
    ],
    prescribed: [prescribed("2026-W32", "GL-001", 3), prescribed("2026-W33", "GL-001", 3)],
  }),
);
assertEqual(glutePositive.program_action, "KEEP_VOLUME", "glute progress keeps volume");

assert(local.program_action !== "ADD_SMALL_VOLUME", "glute fatigue no add");

const realloc = getWeeklyVolumeDecision(
  ctx({
    readiness: [
      { localDate: "2026-08-17", energy: "low", sleep: "fair", body: "fatigued" },
      { localDate: "2026-08-18", energy: "low", sleep: "poor", body: "fatigued" },
    ],
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 3, { actualReps: 10 }),
      ...working("2026-W32", "2026-08-10", "CH-001", 8, { actualReps: 10, actualLoad: 30 }),
      ...working("2026-W33", "2026-08-17", "GL-001", 3, { actualReps: 10 }),
      ...working("2026-W33", "2026-08-17", "CH-001", 8, { actualReps: 10, actualLoad: 30 }),
    ],
    prescribed: [
      prescribed("2026-W32", "GL-001", 3),
      prescribed("2026-W32", "CH-001", 8),
      prescribed("2026-W33", "GL-001", 3),
      prescribed("2026-W33", "CH-001", 8),
    ],
  }),
);
assertEqual(realloc.program_action, "REALLOCATE_VOLUME", "reallocate before adding total volume");
assertEqual(realloc.recommended_delta, 0, "reallocation is not net +total");

const fatLoss = getWeeklyVolumeDecision(
  ctx({
    goalId: "FAT_LOSS",
    readiness: [{ localDate: "2026-08-18", energy: "low", body: "fatigued" }],
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 3, { actualReps: 10 }),
      ...working("2026-W33", "2026-08-17", "GL-001", 3, { actualReps: 10 }),
    ],
    prescribed: [prescribed("2026-W32", "GL-001", 3), prescribed("2026-W33", "GL-001", 3)],
  }),
);
assert(
  fatLoss.program_action === "KEEP_VOLUME" || fatLoss.program_action === "HOLD_VOLUME_PROGRESSION",
  "fat loss does not add volume/conditioning",
);
assert(fatLoss.nutrition_signal !== undefined, "nutrition signal only, no meal change");

const waist = getWeeklyVolumeDecision(
  ctx({
    goalId: "SLIM_TONED_WAIST",
    sets: [
      ...working("2026-W32", "2026-08-10", "AB-001", 3, { actualReps: 12, actualLoad: null }),
      ...working("2026-W33", "2026-08-17", "AB-001", 3, { actualReps: 12, actualLoad: null }),
    ],
    prescribed: [prescribed("2026-W32", "AB-001", 3), prescribed("2026-W33", "AB-001", 3)],
  }),
);
assert(waist.program_action !== "ADD_SMALL_VOLUME", "waist does not add ab sets");

const arms = getWeeklyVolumeDecision(
  ctx({
    goalId: "TONED_ARMS_UPPER_BODY",
    sets: [
      ...working("2026-W32", "2026-08-10", "BI-001", 3, { actualReps: 10, actualLoad: 10 }),
      ...working("2026-W33", "2026-08-17", "BI-001", 3, { actualReps: 12, actualLoad: 10 }),
    ],
    prescribed: [prescribed("2026-W32", "BI-001", 3), prescribed("2026-W33", "BI-001", 3)],
  }),
);
assertEqual(arms.program_action, "KEEP_VOLUME", "arms progressing keep volume");

const balanced = getWeeklyVolumeDecision(
  ctx({
    goalId: "FEMININE_BALANCED_BODY",
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 3, { actualReps: 8 }),
      ...working("2026-W32", "2026-08-10", "CH-001", 3, { actualReps: 8, actualLoad: 30 }),
      ...working("2026-W33", "2026-08-17", "GL-001", 3, { actualReps: 10 }),
      ...working("2026-W33", "2026-08-17", "CH-001", 3, { actualReps: 10, actualLoad: 30 }),
    ],
    prescribed: [
      prescribed("2026-W32", "GL-001", 3),
      prescribed("2026-W32", "CH-001", 3),
      prescribed("2026-W33", "GL-001", 3),
      prescribed("2026-W33", "CH-001", 3),
    ],
  }),
);
assertEqual(balanced.program_action, "KEEP_VOLUME", "balanced keep, no arbitrary specialization");

const posture = getWeeklyVolumeDecision(
  ctx({
    goalId: "POSTURE_TONED_BACK",
    sets: [
      ...working("2026-W32", "2026-08-10", "BA-010", 4, { actualReps: 12, actualLoad: 20 }),
      ...working("2026-W33", "2026-08-17", "BA-010", 4, {
        actualReps: 7,
        actualLoad: 20,
        effortV2: "VERY_HARD",
      }),
    ],
    prescribed: [prescribed("2026-W32", "BA-010", 4), prescribed("2026-W33", "BA-010", 4)],
  }),
);
assert(posture.program_action !== "ADD_SMALL_VOLUME", "posture does not add pulling volume");

const recoveryBlock = getWeeklyVolumeDecision(
  ctx({
    readiness: [
      { localDate: "2026-08-16", energy: "low", sleep: "poor", body: "fatigued" },
      { localDate: "2026-08-17", energy: "low", sleep: "poor", body: "fatigued" },
      { localDate: "2026-08-18", energy: "low", sleep: "poor", body: "fatigued" },
    ],
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 3, { actualReps: 10 }),
      ...working("2026-W33", "2026-08-17", "GL-001", 3, { actualReps: 10 }),
    ],
    prescribed: [prescribed("2026-W32", "GL-001", 3), prescribed("2026-W33", "GL-001", 3)],
  }),
);
assert(
  recoveryBlock.program_action !== "ADD_SMALL_VOLUME",
  "poor recovery blocks add even on plateau",
);

const safety = getWeeklyVolumeDecision(
  ctx({
    safetyRegions: ["GLUTES"],
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 3),
      ...working("2026-W33", "2026-08-17", "GL-001", 3),
    ],
    prescribed: [prescribed("2026-W32", "GL-001", 3), prescribed("2026-W33", "GL-001", 3)],
  }),
);
assertEqual(safety.program_action, "SAFETY_REVIEW", "safety blocks volume add");

const restPattern = getWeeklyVolumeDecision(
  ctx({
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 4, { actualReps: 12, actualRestSeconds: 90 }),
      ...working("2026-W33", "2026-08-17", "GL-001", 4, {
        actualReps: 7,
        actualRestSeconds: 40,
        prescribedRestSeconds: 90,
        effortV2: "VERY_HARD",
      }),
    ],
    prescribed: [prescribed("2026-W32", "GL-001", 4), prescribed("2026-W33", "GL-001", 4)],
  }),
);
const restGlute = restPattern.regions.find((row) => row.region === "GLUTES");
assertEqual(restGlute!.reason_code, "REST_PATTERN_REVIEW", "under-resting flagged");
assert(
  restPattern.program_action !== "REDUCE_VOLUME" ||
    restGlute!.reason_code === "REST_PATTERN_REVIEW",
  "do not auto-blame weekly volume",
);

const oneLongRest = getWeeklyVolumeDecision(
  ctx({
    sets: [
      ...working("2026-W33", "2026-08-17", "GL-001", 2, { actualRestSeconds: 90 }),
      ...working("2026-W33", "2026-08-17", "GL-001", 1, { actualRestSeconds: 400 }),
    ],
    prescribed: [prescribed("2026-W33", "GL-001", 3)],
  }),
);
assert(oneLongRest.program_action !== "DELOAD_REVIEW", "one long rest is not fatigue proof");
assert(oneLongRest.global_fatigue !== "HIGH", "single long rest ignored");

const interference = getWeeklyVolumeDecision(
  ctx({
    readiness: [
      { localDate: "2026-08-17", energy: "low", sleep: "poor", body: "fatigued" },
      { localDate: "2026-08-18", energy: "low", sleep: "poor", body: "fatigued" },
    ],
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 3, { actualReps: 12 }),
      ...working("2026-W32", "2026-08-10", "CR-001", 6, { actualReps: null, actualLoad: null }),
      ...working("2026-W33", "2026-08-17", "GL-001", 3, { actualReps: 7, effortV2: "VERY_HARD" }),
      ...working("2026-W33", "2026-08-17", "CR-001", 8, { actualReps: null, actualLoad: null }),
    ],
    prescribed: [
      prescribed("2026-W32", "GL-001", 3),
      prescribed("2026-W32", "CR-001", 6),
      prescribed("2026-W33", "GL-001", 3),
      prescribed("2026-W33", "CR-001", 8),
    ],
  }),
);
assert(
  interference.conditioning_interference ||
    interference.reason_code === "CONDITIONING_INTERFERENCE",
  "conditioning interference review",
);
assert(
  interference.program_action !== "ADD_SMALL_VOLUME",
  "do not add glute volume under interference",
);

const afterLoad = getWeeklyVolumeDecision(
  ctx({
    recentLoadIncrease: true,
    recentProgressionActions: ["INCREASE_LOAD"],
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 3, { actualReps: 10 }),
      ...working("2026-W33", "2026-08-17", "GL-001", 3, { actualReps: 10 }),
    ],
    prescribed: [prescribed("2026-W32", "GL-001", 3), prescribed("2026-W33", "GL-001", 3)],
  }),
);
assertEqual(afterLoad.program_action, "KEEP_VOLUME", "observe after load increase");
assertEqual(afterLoad.reason_code, "LOAD_INCREASE_OBSERVATION", "observation reason");
assert(afterLoad.observation_required, "observation flag");

const cooldown = getWeeklyVolumeDecision(
  ctx({
    lastVolumeAction: { action: "ADD_SMALL_VOLUME", validWeeksAgo: 0 },
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 3, { actualReps: 10 }),
      ...working("2026-W33", "2026-08-17", "GL-001", 3, { actualReps: 10 }),
    ],
    prescribed: [prescribed("2026-W32", "GL-001", 3), prescribed("2026-W33", "GL-001", 3)],
  }),
);
assertEqual(cooldown.program_action, "KEEP_VOLUME", "volume cooldown");
assertEqual(cooldown.reason_code, "VOLUME_COOLDOWN", "no second immediate increase");

const oscil = getWeeklyVolumeDecision(
  ctx({
    lastVolumeAction: { action: "REDUCE_VOLUME", validWeeksAgo: 0 },
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 3, { actualReps: 10 }),
      ...working("2026-W33", "2026-08-17", "GL-001", 3, { actualReps: 10 }),
    ],
    prescribed: [prescribed("2026-W32", "GL-001", 3), prescribed("2026-W33", "GL-001", 3)],
  }),
);
assertEqual(oscil.program_action, "KEEP_VOLUME", "anti-oscillation prefers keep");

const recond = getWeeklyVolumeDecision(
  ctx({
    reconditioningActive: true,
    sets: working("2026-W33", "2026-08-17", "GL-001", 3),
    prescribed: [prescribed("2026-W33", "GL-001", 12)],
  }),
);
assertEqual(recond.program_action, "RECONDITIONING", "reconditioning state");
assert(recond.recommended_delta === 0, "do not restore prior max volume");

const deloadActive = getWeeklyVolumeDecision(
  ctx({
    deloadActive: true,
    sets: working("2026-W33", "2026-08-17", "GL-001", 3, { actualReps: 12 }),
    prescribed: [prescribed("2026-W33", "GL-001", 3)],
  }),
);
assertEqual(deloadActive.recovery_hold, "DELOAD_ACTIVE", "phase 6 gate");
const p6 = getNextSessionProgression({
  externalId: "GL-001",
  exercise: ex("GL-001"),
  history: [
    {
      id: "1",
      workoutSessionId: "s",
      sessionDate: "2026-08-17",
      setNumber: 1,
      setType: "WORKING",
      prescribedLoad: 50,
      actualLoad: 50,
      prescribedRepsMin: 8,
      prescribedRepsMax: 12,
      actualReps: 12,
      effort: "medium",
      effortV2: "IDEAL",
      skipped: false,
      setCompleted: true,
      createdAt: "2026-08-17T10:00:00.000Z",
    },
    {
      id: "2",
      workoutSessionId: "s",
      sessionDate: "2026-08-17",
      setNumber: 2,
      setType: "WORKING",
      prescribedLoad: 50,
      actualLoad: 50,
      prescribedRepsMin: 8,
      prescribedRepsMax: 12,
      actualReps: 12,
      effort: "medium",
      effortV2: "IDEAL",
      skipped: false,
      setCompleted: true,
      createdAt: "2026-08-17T10:05:00.000Z",
    },
    {
      id: "3",
      workoutSessionId: "s",
      sessionDate: "2026-08-17",
      setNumber: 3,
      setType: "WORKING",
      prescribedLoad: 50,
      actualLoad: 50,
      prescribedRepsMin: 8,
      prescribedRepsMax: 12,
      actualReps: 12,
      effort: "medium",
      effortV2: "IDEAL",
      skipped: false,
      setCompleted: true,
      createdAt: "2026-08-17T10:10:00.000Z",
    },
  ],
  trainingLevel: "BEGINNER",
  requiredWorkingSets: 3,
  repMin: 8,
  repMax: 12,
  availableIncrementKg: 2.5,
  recoveryHold: deloadActive.recovery_hold,
});
assertEqual(p6.action, "HOLD_PROGRESSION", "phase 6 holds during deload");
assert(p6.action !== "INCREASE_LOAD", "no load increase while deload active");

const missing = getWeeklyVolumeDecision(ctx({ sets: [], prescribed: [] }));
assertEqual(missing.program_action, "INSUFFICIENT_DATA", "sparse data");
assertEqual(missing.recommended_delta, 0, "no aggressive adaptation");

const coach = getWeeklyVolumeDecision(
  ctx({
    coachProtected: true,
    sets: [
      ...working("2026-W32", "2026-08-10", "GL-001", 3, { actualReps: 10 }),
      ...working("2026-W33", "2026-08-17", "GL-001", 3, { actualReps: 10 }),
    ],
    prescribed: [prescribed("2026-W32", "GL-001", 3), prescribed("2026-W33", "GL-001", 3)],
  }),
);
assertEqual(coach.program_action, "KEEP_VOLUME", "coach not overwritten");
assertEqual(coach.reason_code, "COACH_OVERRIDE_ACTIVE", "coach reason");
assert(coach.coach_override_state, "coach flag");

const a = getWeeklyVolumeDecision(
  ctx({
    sets: working("2026-W33", "2026-08-17", "GL-001", 3),
    prescribed: [prescribed("2026-W33", "GL-001", 3)],
  }),
);
const b = getWeeklyVolumeDecision(
  ctx({
    sets: working("2026-W33", "2026-08-17", "GL-001", 3),
    prescribed: [prescribed("2026-W33", "GL-001", 3)],
  }),
);
assertEqual(a.program_action, b.program_action, "deterministic action");
assertEqual(a.reason_code, b.reason_code, "deterministic reason");

const src = [
  readFileSync(join(process.cwd(), "src/lib/platform/volume/engine.ts"), "utf8"),
  readFileSync(join(process.cwd(), "src/lib/platform/volume/aggregate.ts"), "utf8"),
  readFileSync(join(process.cwd(), "src/lib/platform/volume/recovery.ts"), "utf8"),
].join("\n");
assert(!src.includes("calorie"), "no calorie changes");
assert(!src.includes("macro"), "no macro changes");
assert(!src.includes("reschedule"), "no phase 8 reschedule");
assert(!src.includes("missed session"), "no missed-session scheduler");
assert(!src.includes("circumference"), "no phase 9 measurements");
assert(!src.includes("waist measurement"), "no waist interpretation");
assert(!src.includes("MEV"), "no MEV/MRV client terms");
assert(!src.includes("every 4"), "no automatic 4-week deload");
assert(!src.includes("Week 1 = 10"), "no automatic weekly set ladder");

assert(Boolean(a.reason_code), "reason present");
assert(["LOW", "MODERATE", "HIGH"].includes(a.confidence), "confidence enum");

console.log("weekly volume engine tests passed");
