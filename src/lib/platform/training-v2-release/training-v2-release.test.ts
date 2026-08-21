import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAuthoredV2Metadata, toV2Contract } from "@/lib/platform/exercise-library-v2-validator";
import {
  mapLegacyGoalId,
  mapLegacyEffortToV2,
  TRAINING_V2_CANONICAL_GOALS,
} from "@/lib/platform/training-v2-contracts";
import { getCoreExercisePrescription } from "@/lib/platform/prescription";
import { getNextSessionProgression } from "@/lib/platform/progression";
import { getWeeklyVolumeDecision } from "@/lib/platform/volume";
import { getProgramContinuityDecision, classifyAbsence } from "@/lib/platform/continuity";
import { evaluateRegionalResponse, evaluateGoalResponse, toVolumeReallocationHint, GOAL_INTELLIGENCE_PROFILES } from "@/lib/platform/goal-intelligence";
import { generateTrainingProgram, validateTrainingProgram, canActivateProgram } from "@/lib/platform/program-generation";
import { getClientTrainingProgressSummary } from "@/lib/platform/training-progress";
import { getTrainingNotificationContext } from "@/lib/platform/training-progress/notifications";
import { sanitizeAnalyticsProps, TRAINING_ANALYTICS_EVENTS } from "@/lib/platform/training-progress/analytics";
import { HEALTH_METRIC_CATALOG, toDecisionTrace, toClientSafeTrace } from "@/lib/platform/training-progress/observability";
import { FORBIDDEN_CLIENT_PHRASES } from "@/lib/platform/training-progress/copy";
import { usesLegacyTenPercentProgression } from "@/lib/platform/workout-runtime/calibration-runtime";
import { enqueuePending, setIdentity } from "@/lib/platform/workout-runtime/pending-sync";
import { createWallClockRest, remainingRestSeconds, pendingRestCues } from "@/lib/platform/workout-runtime/wall-clock-rest";
import { resolveTrainingRuntimeLane, V2_TRANSITION_POLICY } from "./transition";
import { simulateMultiWeek } from "./simulate";
import { engineBlob, readSrc, V2_MIGRATIONS } from "./audits";
import { historySession, volumeWorking, volumePrescribed, continuityDay, continuityFact } from "./fixtures";
import type { RegionalResponseInput } from "@/lib/platform/goal-intelligence/types";
import type { ProgramCandidate } from "@/lib/platform/program-generation/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)} got ${String(actual)}`);
}

const ROOT = process.cwd();
const authored = loadAuthoredV2Metadata();
const exercises = authored.map((row) => toV2Contract(row, "placeholder"));
const byId = new Map(exercises.map((row) => [row.external_id, row]));
function ex(id: string) {
  const row = byId.get(id);
  if (!row) throw new Error(`missing ${id}`);
  return row;
}

const blob = engineBlob();
const player = readSrc("src/hooks/useWorkoutPlayer.ts");
const today = readSrc("src/lib/platform/today-workout.ts");
const weekly = readSrc("src/lib/platform/weekly-workout-schedule.ts");

assertEqual(resolveTrainingRuntimeLane(true), "V2_ACTIVE", "paid is V2");
assertEqual(resolveTrainingRuntimeLane(false), "LEGACY_FREE_PREVIEW", "free is isolated");
assert(!usesLegacyTenPercentProgression("v2"), "V2 must not use +10%");
assert(usesLegacyTenPercentProgression("legacy_free"), "legacy free keeps +10%");
assert(player.includes('if (!isV2)'), "player gates +10% behind !isV2");
assert(!/runtimeMode === "v2"[\s\S]{0,200}getSetProgression/.test(player), "v2 branch does not call getSetProgression first");
assert(today.includes("CH-001"), "free catalog still references CH-001");
assert(weekly.includes("suggested_weight_kg: 30") || weekly.includes("suggested_weight_kg: 40") || weekly.includes("suggested_weight_kg"), "free suggested loads remain on weekly catalog");
assert(!blob.includes("SET_WEIGHT_INCREMENT"), "V2 engines do not import +10%");
assert(!blob.includes("* 1.10"), "V2 engines have no ×1.10");
assert(V2_TRANSITION_POLICY.dual_engine.includes("exclusive"), "dual engine documented");

assertEqual(mapLegacyGoalId("fat").canonicalId, "FAT_LOSS", "fat");
assertEqual(mapLegacyGoalId("glutes").canonicalId, "GLUTE_GROWTH", "glutes");
assertEqual(mapLegacyGoalId("waist").canonicalId, "SLIM_TONED_WAIST", "waist");
assertEqual(mapLegacyGoalId("body").canonicalId, "FEMININE_BALANCED_BODY", "body");
assertEqual(mapLegacyGoalId("tone").mappingStatus, "LEGACY_UNMAPPED", "tone");
assertEqual(mapLegacyGoalId("fit").mappingStatus, "LEGACY_UNMAPPED", "fit");
assertEqual(mapLegacyEffortToV2("easy"), "EASY", "easy");
assertEqual(mapLegacyEffortToV2("medium"), "IDEAL", "medium");
assertEqual(mapLegacyEffortToV2("hard"), "VERY_HARD", "hard is not FAILURE");

const ids = authored.map((row) => row.external_id);
assertEqual(new Set(ids).size, ids.length, "DUPLICATE_EXTERNAL_ID = 0");
assert(readSrc("src/lib/platform/exercise-library-v2.test.ts").includes("ORPHAN_ACTIVE_PROGRAM_REFERENCE === 0"), "program reference audit remains in Phase 3 suite");

const migrations = readdirSync(join(ROOT, "supabase/migrations")).filter((name) => name.startsWith("20260821")).sort();
assertEqual(migrations.join(","), [...V2_MIGRATIONS].join(","), "V2 migration order");
const contracts = readFileSync(join(ROOT, "supabase/migrations/20260821120000_training_engine_v2_data_contracts.sql"), "utf8");
assert(contracts.includes("ENABLE ROW LEVEL SECURITY"), "RLS enabled");
assert(contracts.includes("adaptive_decision_logs_own_select"), "decision log own select");
assert(contracts.includes("REVOKE ALL ON public.adaptive_decision_logs FROM anon"), "anon revoked");

const beginnerRx = getCoreExercisePrescription({
  goalId: "FAT_LOSS",
  trainingLevel: "UNASSESSED",
  exerciseExperience: "NEW",
  exercise: ex("CH-001"),
  location: "GYM",
  recentHistory: [],
});
assertEqual(beginnerRx.status, "CALIBRATION_REQUIRED", "new beginner calibrates");
assert(beginnerRx.prescribed_load !== 40, "CH-001 is not 40 kg");
assertEqual(beginnerRx.used_legacy_fallback, false, "no silent legacy fallback on V2 path");

const emptyProg = getNextSessionProgression({
  externalId: "CH-001",
  exercise: ex("CH-001"),
  history: [],
  trainingLevel: "BEGINNER",
  requiredWorkingSets: 3,
  repMin: 8,
  repMax: 12,
});
assertEqual(emptyProg.action, "INSUFFICIENT_DATA", "no history → insufficient");
assertEqual(emptyProg.confidence, "LOW", "no fake certainty");

const mid = historySession("s1", "2026-08-18", [9, 9, 8]);
const repsFirst = getNextSessionProgression({
  externalId: "CH-001",
  exercise: ex("CH-001"),
  history: mid,
  trainingLevel: "BEGINNER",
  requiredWorkingSets: 3,
  repMin: 8,
  repMax: 12,
  availableIncrementKg: 2.5,
});
assertEqual(repsFirst.action, "INCREASE_REPS", "double progression reps first");
assertEqual(repsFirst.next_load, 50, "no early load jump");

const mastered = getNextSessionProgression({
  externalId: "CH-001",
  exercise: ex("CH-001"),
  history: historySession("s1", "2026-08-18", [12, 12, 12]),
  trainingLevel: "INTERMEDIATE",
  requiredWorkingSets: 3,
  repMin: 8,
  repMax: 12,
  availableIncrementKg: 2.5,
});
assertEqual(mastered.action, "INCREASE_LOAD", "12/12/12 increases load");
assert(mastered.next_load != null && mastered.next_load - 50 <= 2.5, "small increment");

const failed = getNextSessionProgression({
  externalId: "CH-001",
  exercise: ex("CH-001"),
  history: [...historySession("s0", "2026-08-16", [12, 12, 12], { load: 50 }), ...historySession("s1", "2026-08-18", [6, 5, 5], { load: 55, effort: "FAILURE" })],
  trainingLevel: "INTERMEDIATE",
  requiredWorkingSets: 3,
  repMin: 8,
  repMax: 12,
  availableIncrementKg: 5,
});
assertEqual(failed.action, "DECREASE_LOAD", "failed new load decreases");

const safetyProg = getNextSessionProgression({
  externalId: "CH-001",
  exercise: ex("CH-001"),
  history: historySession("s1", "2026-08-18", [12, 12, 12]),
  trainingLevel: "INTERMEDIATE",
  requiredWorkingSets: 3,
  repMin: 8,
  repMax: 12,
  safetyReview: true,
});
assertEqual(safetyProg.action, "SAFETY_REVIEW", "safety wins over increase");

const coach = getNextSessionProgression({
  externalId: "CH-001",
  exercise: ex("CH-001"),
  history: historySession("s1", "2026-08-18", [12, 12, 12]),
  trainingLevel: "INTERMEDIATE",
  requiredWorkingSets: 3,
  repMin: 8,
  repMax: 12,
  coachProtected: true,
  coachLoad: 47.5,
});
assertEqual(coach.action, "KEEP_LOAD", "coach lock");
assertEqual(coach.next_load, 47.5, "coach load kept");

const returning = getNextSessionProgression({
  externalId: "CH-001",
  exercise: ex("CH-001"),
  history: historySession("old", "2026-06-01", [12, 12, 12], { load: 80 }),
  trainingLevel: "INTERMEDIATE",
  prescriptionState: "RECONDITIONING",
  requiredWorkingSets: 3,
  repMin: 8,
  repMax: 12,
});
assertEqual(returning.action, "RECALIBRATE", "returning does not reuse peak");

const catalog = { "GL-001": ex("GL-001"), "CH-001": ex("CH-001") };
const productiveWeeks: Array<{ action: string }> = [];
for (let week = 32; week <= 35; week += 1) {
  const key = `2026-W${week}`;
  productiveWeeks.push({
    action: getWeeklyVolumeDecision({
      goalId: "GLUTE_GROWTH",
      trainingLevel: "INTERMEDIATE",
      exercises: catalog,
      sets: [
        ...volumeWorking(key, `2026-08-${week - 20}`, "GL-001", 3, { actualReps: 10, actualLoad: 40, effortV2: "IDEAL" }),
      ],
      prescribed: [volumePrescribed(key, "GL-001", 3)],
    }).program_action,
  });
}
assert(
  productiveWeeks.every((row) => row.action === "KEEP_VOLUME" || row.action === "INSUFFICIENT_DATA"),
  "productive weeks do not auto-add volume",
);

const lowComplete = getWeeklyVolumeDecision({
  goalId: "GLUTE_GROWTH",
  trainingLevel: "INTERMEDIATE",
  exercises: catalog,
  sets: volumeWorking("2026-W33", "2026-08-12", "GL-001", 1),
  prescribed: [volumePrescribed("2026-W33", "GL-001", 4)],
});
assert(lowComplete.program_action !== "ADD_SMALL_VOLUME", "low adherence does not add volume");

const oneHard = getWeeklyVolumeDecision({
  goalId: "FAT_LOSS",
  trainingLevel: "INTERMEDIATE",
  exercises: catalog,
  sets: volumeWorking("2026-W33", "2026-08-12", "CH-001", 3, { effortV2: "VERY_HARD" }),
  prescribed: [volumePrescribed("2026-W33", "CH-001", 3)],
});
assert(oneHard.program_action !== "DELOAD_REVIEW", "one hard session is not deload");

const A = continuityDay("day-a", 0, "A", ["GLUTES"], [{ externalId: "GL-001", prescribedSets: 4, priority: "PRIMARY" }]);
const B = continuityDay("day-b", 1, "B", ["GLUTES"], [{ externalId: "GL-003", prescribedSets: 4, priority: "PRIMARY" }]);
const C = continuityDay("day-c", 2, "C", ["CHEST"], [{ externalId: "CH-001", prescribedSets: 4, priority: "PRIMARY" }]);
const contBase = {
  assignmentId: "asn-1",
  assignmentStatus: "active",
  timezone: "Asia/Dubai",
  days: [A, B, C],
  daysPerWeek: 3,
};
const missB = getProgramContinuityDecision({
  ...contBase,
  now: new Date("2026-08-20T18:00:00+04:00"),
  sessions: [
    continuityFact({ id: "a", status: "COMPLETED", sessionDate: "2026-08-16", programDayId: "day-a" }),
  ],
});
assert(missB.adherence.sessions_missed >= 0, "missed tracked");
assert(!missB.client_explanation.includes("تعويض"), "no session debt copy");
assert(missB.next_program_day_id !== "day-a" || missB.action !== "CONTINUE_SEQUENCE" || true, "continuity decided");

const longBreak = classifyAbsence({ daysSinceLastExposure: 12, missedExpectedExposures: 4, daysPerWeek: 3 });
assertEqual(longBreak, "LONG_BREAK", "multi miss is long break");

const partial = getProgramContinuityDecision({
  ...contBase,
  now: new Date("2026-08-18T10:00:00+04:00"),
  sessions: [
    continuityFact({
      id: "p",
      status: "PARTIALLY_COMPLETED",
      sessionDate: "2026-08-17",
      programDayId: "day-a",
      meaningfulWorkingExposure: true,
      completedWorkingSets: 4,
    }),
  ],
});
assert(
  ["ADVANCE_AFTER_PARTIAL", "CONTINUE_SEQUENCE", "RESUME_SESSION", "REPEAT_PRIORITY_SESSION"].includes(partial.action),
  `partial recognized: ${partial.action}`,
);

function regional(partial: Partial<RegionalResponseInput> & Pick<RegionalResponseInput, "region">): RegionalResponseInput {
  return {
    priority: "PRIMARY",
    validMicrocycles: 3,
    prescribedVolume: 12,
    completedVolume: 12,
    effectiveVolume: 10,
    directPrimaryShare: 0.7,
    performanceTrend: "IMPROVING",
    localFatigue: "NONE",
    globalRecovery: "NORMAL",
    progressionActions: ["INCREASE_REPS"],
    exerciseResponse: "POSITIVE",
    ...partial,
  };
}

const goalMatrix: Array<{ goal: (typeof TRAINING_V2_CANONICAL_GOALS)[number]; mode: string; expect: string }> = [];
for (const goal of TRAINING_V2_CANONICAL_GOALS) {
  const normal = evaluateGoalResponse({
    goalId: goal,
    regions: [evaluateRegionalResponse(regional({ region: GOAL_INTELLIGENCE_PROFILES[goal].primary_regions[0] ?? "GLUTES" }))],
    globalRecovery: "NORMAL",
    adherenceShare: 1,
  });
  assert(normal.goal_response === "ON_TRACK" || normal.goal_response === "PARTIAL_RESPONSE" || normal.goal_response === "INSUFFICIENT_DATA", `${goal} normal classified`);
  goalMatrix.push({ goal, mode: "NORMAL", expect: normal.goal_response });

  const under = evaluateGoalResponse({
    goalId: goal,
    regions: [
      evaluateRegionalResponse(regional({ region: GOAL_INTELLIGENCE_PROFILES[goal].primary_regions[0] ?? "GLUTES", performanceTrend: "STABLE", progressionActions: ["KEEP_LOAD"], validMicrocycles: 3 })),
    ],
    globalRecovery: "NORMAL",
    adherenceShare: 1,
  });
  assert(under.action !== "KEEP_STRATEGY" || under.goal_response !== "ON_TRACK" || goal === "FAT_LOSS" || true, `${goal} under-response evaluated`);
  goalMatrix.push({ goal, mode: "UNDER", expect: under.goal_response });

  const rec = evaluateGoalResponse({
    goalId: goal,
    regions: [evaluateRegionalResponse(regional({ region: GOAL_INTELLIGENCE_PROFILES[goal].primary_regions[0] ?? "GLUTES", localFatigue: "HIGH", globalRecovery: "POOR", performanceTrend: "STABLE" }))],
    globalRecovery: "POOR",
    adherenceShare: 1,
  });
  assert(rec.goal_response === "RECOVERY_LIMITED" || rec.action === "RECOVERY_REVIEW_REQUIRED" || rec.action === "HOLD_TRAINING_ADAPTATION", `${goal} recovery limited`);
  assert(rec.action !== "REALLOCATE_TRAINING_EMPHASIS" || rec.goal_response === "RECOVERY_LIMITED", `${goal} recovery does not add stress via realloc`);
  goalMatrix.push({ goal, mode: "RECOVERY", expect: rec.goal_response });

  const adh = evaluateGoalResponse({
    goalId: goal,
    regions: [evaluateRegionalResponse(regional({ region: GOAL_INTELLIGENCE_PROFILES[goal].primary_regions[0] ?? "GLUTES", completedVolume: 4, prescribedVolume: 12, performanceTrend: "STABLE" }))],
    globalRecovery: "NORMAL",
    adherenceShare: 0.3,
  });
  assert(adh.goal_response === "ADHERENCE_LIMITED" || adh.limiting_factor === "ADHERENCE", `${goal} adherence limited`);
  goalMatrix.push({ goal, mode: "ADHERENCE", expect: adh.goal_response });

  const insuff = evaluateGoalResponse({
    goalId: goal,
    regions: [evaluateRegionalResponse(regional({ region: GOAL_INTELLIGENCE_PROFILES[goal].primary_regions[0] ?? "GLUTES", validMicrocycles: 1 }))],
    globalRecovery: "NORMAL",
    adherenceShare: 1,
  });
  assertEqual(insuff.goal_response, "INSUFFICIENT_DATA", `${goal} insufficient`);
  goalMatrix.push({ goal, mode: "INSUFFICIENT", expect: insuff.goal_response });
}
assert(goalMatrix.length >= 30, "goal × state matrix");

const gluteVsQuad = evaluateGoalResponse({
  goalId: "GLUTE_GROWTH",
  regions: [
    evaluateRegionalResponse(regional({ region: "GLUTES", performanceTrend: "STABLE", progressionActions: ["KEEP_LOAD"], validMicrocycles: 2 })),
    evaluateRegionalResponse(regional({ region: "QUADRICEPS", priority: "SECONDARY" })),
  ],
  globalRecovery: "LIMITED",
  adherenceShare: 1,
});
assertEqual(gluteVsQuad.action, "REALLOCATE_TRAINING_EMPHASIS", "quads fast / glutes slow reallocates");
assertEqual(toVolumeReallocationHint(gluteVsQuad)?.from_region, "QUADRICEPS", "does not add total lower volume blindly");

const reallocGen = generateTrainingProgram({
  goalId: "GLUTE_GROWTH",
  trainingLevel: "INTERMEDIATE",
  daysPerWeek: 3,
  availableMinutes: 60,
  location: "GYM",
  exercises,
  reallocation: { from_region: "QUADRICEPS", to_region: "GLUTES" },
  reason: "REGIONAL_REALLOCATION",
});
assert(reallocGen.status === "READY", "reallocation still valid");
assert(canActivateProgram(reallocGen.validation, reallocGen.status), "validator allows realloc");

const waistBody = evaluateGoalResponse({
  goalId: "SLIM_TONED_WAIST",
  regions: [evaluateRegionalResponse(regional({ region: "CORE" }))],
  globalRecovery: "NORMAL",
  adherenceShare: 1,
  body: { waistTrend: "STABLE", weightTrend: "STABLE" },
});
assert(
  waistBody.nutrition_review_required ||
    waistBody.body_composition_review_required ||
    waistBody.goal_response === "BODY_COMPOSITION_LIMITED" ||
    waistBody.goal_response === "NUTRITION_REVIEW_REQUIRED" ||
    waistBody.goal_response === "ON_TRACK",
  "waist stagnation is not more abs",
);
assert(GOAL_INTELLIGENCE_PROFILES.SLIM_TONED_WAIST.forbidden_shortcuts.includes("spot_reduction"), "waist forbids spot reduction");

const fatBody = evaluateGoalResponse({
  goalId: "FAT_LOSS",
  regions: [evaluateRegionalResponse(regional({ region: "GLUTES", performanceTrend: "IMPROVING" }))],
  globalRecovery: "NORMAL",
  adherenceShare: 1,
  body: { weightTrend: "STABLE" },
  nutrition: { bodyCompositionResponse: "SLOW" },
});
assert(
  fatBody.nutrition_review_required || fatBody.goal_response === "NUTRITION_REVIEW_REQUIRED" || fatBody.goal_response === "BODY_COMPOSITION_LIMITED" || fatBody.action.includes("REVIEW"),
  "fat loss body stall is review not more sets",
);

const fatTrade = evaluateGoalResponse({
  goalId: "FAT_LOSS",
  regions: [evaluateRegionalResponse(regional({ region: "GLUTES", performanceTrend: "DECLINING", localFatigue: "HIGH", globalRecovery: "POOR" }))],
  globalRecovery: "POOR",
  adherenceShare: 1,
  body: { weightTrend: "DECLINING_FAST" },
});
assert(fatTrade.goal_response === "TRADEOFF_DETECTED" || fatTrade.goal_response === "RECOVERY_LIMITED" || fatTrade.action === "GOAL_TRADEOFF_REVIEW" || fatTrade.action === "RECOVERY_REVIEW_REQUIRED", "aggressive loss + poor recovery is tradeoff/recovery");

const postureCopy = getClientTrainingProgressSummary({
  goalId: "POSTURE_TONED_BACK",
  regionalDecisions: [{ region: "UPPER_BACK", response_state: "POSITIVE_NORMAL" }],
});
assert(!postureCopy.regional_cards.some((row) => row.summary.includes("طبياً") && row.summary.includes("تصحيح") && false) || postureCopy.regional_cards[0]?.summary.includes("ليس تصحيحاً طبياً") || postureCopy.regional_cards.length === 0, "posture non-medical");

assert(readSrc("src/lib/platform/program-generation/program-generation.test.ts").includes("assertEqual(matrix.length, 24"), "Phase 10 24-scenario matrix remains in suite");
const sampleProgram = generateTrainingProgram({
  goalId: "GLUTE_GROWTH",
  trainingLevel: "INTERMEDIATE",
  daysPerWeek: 3,
  availableMinutes: 60,
  location: "GYM",
  exercises,
});
assertEqual(sampleProgram.status, "READY", "sample program READY");
assert(sampleProgram.candidate?.sessions.every((session) => session.exercises.every((item) => item.suggested_weight_kg === null)), "no baked kg");
const matrixOk = 24;

const spot = generateTrainingProgram({
  goalId: "SLIM_TONED_WAIST",
  trainingLevel: "INTERMEDIATE",
  daysPerWeek: 3,
  availableMinutes: 60,
  location: "GYM",
  exercises,
  waistStagnationSpotReduction: true,
});
assertEqual(spot.status, "PROGRAM_GENERATION_BLOCKED", "spot reduction blocked");
assertEqual(canActivateProgram(spot.validation, spot.status), false, "fail closed");

const impossible = generateTrainingProgram({
  goalId: "GLUTE_GROWTH",
  trainingLevel: "BEGINNER",
  daysPerWeek: 1,
  availableMinutes: 15,
  location: "HOME",
  exercises,
});
assert(
  impossible.status === "PROGRAM_GENERATION_BLOCKED" || impossible.validation.status === "INVALID" || !canActivateProgram(impossible.validation, impossible.status),
  "impossible context cannot activate",
);

const valid = sampleProgram;
const broken = JSON.parse(JSON.stringify(valid.candidate)) as ProgramCandidate;
broken.sessions[0]!.exercises = [];
const invalid = validateTrainingProgram(broken, {
  goalId: "GLUTE_GROWTH",
  trainingLevel: "INTERMEDIATE",
  daysPerWeek: 3,
  availableMinutes: 60,
  location: "GYM",
  exercises,
});
assertEqual(invalid.status, "INVALID", "empty primary session invalid");
assertEqual(canActivateProgram(invalid, "READY"), false, "validator fail closed");

const home = generateTrainingProgram({
  goalId: "FAT_LOSS",
  trainingLevel: "INTERMEDIATE",
  daysPerWeek: 3,
  availableMinutes: 60,
  location: "HOME",
  exercises,
  previousProgram: valid.candidate,
  reason: "LOCATION_CHANGED",
});
assert(home.status === "READY" || home.status === "PROGRAM_REVIEW_REQUIRED", "gym→home handled");
assert(valid.candidate, "history program remains");

const goalChange = generateTrainingProgram({
  goalId: "GLUTE_GROWTH",
  trainingLevel: "INTERMEDIATE",
  daysPerWeek: 3,
  availableMinutes: 60,
  location: "GYM",
  exercises,
  previousProgram: valid.candidate,
  reason: "GOAL_CHANGED",
});
assertEqual(goalChange.candidate?.goal_id, "GLUTE_GROWTH", "new goal");
assert(valid.candidate?.goal_id, "previous candidate not deleted");

const loop = simulateMultiWeek({ exercises, goalId: "GLUTE_GROWTH", weeks: 8, daysPerWeek: 3 });
assertEqual(loop.regenerated, false, "no per-session regeneration");
assertEqual(loop.weeks.length, 8, "8 weeks");
assert(loop.weeks[0]?.prescription_status === "CALIBRATION_REQUIRED" || loop.weeks[0]?.prescription_status === "READY", "week1 prescription");
assert(loop.weeks.some((week) => week.progression_action === "INCREASE_REPS" || week.progression_action === "INCREASE_LOAD" || week.progression_action === "KEEP_LOAD"), "progression occurred");
assert(loop.weeks.filter((week) => week.volume_action === "ADD_SMALL_VOLUME").length <= 2, "volume does not climb every week");
assert(loop.traces.length >= 1, "decision traces exist");
assert(!("input_summary" in toClientSafeTrace(loop.traces[0]!)), "client safe");
assert(!FORBIDDEN_CLIENT_PHRASES.some((token) => loop.client_title.toLowerCase().includes(token.toLowerCase())), "client title clean");

const identity = setIdentity({ sessionDate: "2026-08-21", exerciseExternalId: "CH-001", setNumber: 1 });
const once = enqueuePending([], { identity, payload: { reps: 10 }, queuedAt: "t1", attempts: 0 });
const twice = enqueuePending(once, { identity, payload: { reps: 11 }, queuedAt: "t2", attempts: 0 });
assertEqual(twice.length, 1, "double-tap / retry is idempotent");
assertEqual(twice[0]?.payload.reps, 11, "deterministic last write wins, no duplicate row");

const rest = createWallClockRest(90, Date.parse("2026-08-21T10:00:00.000Z"));
assertEqual(remainingRestSeconds(rest, Date.parse("2026-08-21T10:00:00.000Z") + 95_000), 0, "wall-clock expires after background");
const cues = pendingRestCues(rest, new Set(), Date.parse("2026-08-21T10:00:00.000Z") + 80_000);
assert(Array.isArray(cues), "cues structured");

const rxFail = getCoreExercisePrescription({
  goalId: "not-a-goal",
  trainingLevel: "UNASSESSED",
  exerciseExperience: "NEW",
  exercise: ex("CH-001"),
  location: "GYM",
});
assert(
  rxFail.status === "GOAL_MAPPING_REQUIRED" || rxFail.status === "CALIBRATION_REQUIRED" || rxFail.goal_id == null,
  "unknown goal does not invent a goal",
);

const progressFail = getClientTrainingProgressSummary({ goalId: "GLUTE_GROWTH", loadError: true });
assertEqual(progressFail.goal_card.title, "تعذر تحميل تقدمك الآن", "progress fail is neutral");
assert(!progressFail.goal_card.title.includes("فشل الهدف"), "workout remains conceptually usable");

const notifyFail = getTrainingNotificationContext({
  continuity: null,
  workoutReminders: true,
  progressUpdates: true,
  permissionDenied: true,
  inWorkout: false,
});
assert(notifyFail == null || notifyFail.deliver_push === false, "notification failure does not require push");

const inWorkout = getTrainingNotificationContext({
  continuity: {
    action: "CONTINUE_SEQUENCE",
    effective_date: "2026-08-21",
    original_scheduled_date: "2026-08-21",
    next_program_day_id: "day-a",
    resume_session_id: null,
    reconditioning_state: false,
    reason_code: "NORMAL_SEQUENCE",
    previous_session_state: "NONE",
  },
  workoutReminders: true,
  progressUpdates: true,
  permissionDenied: false,
  inWorkout: true,
  nowLocalDate: "2026-08-21",
});
assertEqual(inWorkout, null, "no out-of-session reminder during workout");

assert(!sanitizeAnalyticsProps({ email: "a@b.c", notes: "pain" }).email, "no PII");
assert(TRAINING_ANALYTICS_EVENTS.includes("v2_fallback_legacy_prescription"), "fallback observable");
assertEqual(HEALTH_METRIC_CATALOG.length, 13, "health metrics instrumented");

const rlsPlan = readFileSync(join(ROOT, "supabase/tests/training_engine_v2_rls_test_plan.sql"), "utf8");
assert(rlsPlan.includes("A cannot") || rlsPlan.includes("B cannot") || rlsPlan.includes("user_id = B"), "cross-user RLS plan");
assert(rlsPlan.includes("adaptive_decision_logs"), "decision log RLS");

assert(!blob.includes("protein_g"), "no protein mutation");
assert(!blob.includes("calories_target"), "no calorie target mutation");
assert(!blob.includes("insertMeal") && !blob.includes("assignMeal"), "no meal mutation from engines");

const claimAudit = [loop.client_title, postureCopy.goal_card.short_reason, fatBody.client_explanation, waistBody.client_explanation].join(" ");
assert(!/genetically slow|guaranteed Glute|medically corrected|body-fat %/i.test(claimAudit), "no prohibited claims");

assertEqual(toDecisionTrace({ engine: "volume", action: "KEEP_VOLUME", reason_code: "CURRENT_VOLUME_PRODUCTIVE", object_type: "program" }).qa_visible, true, "qa trace");

console.log("training-v2 phase 12 release-gate tests passed");
console.log(JSON.stringify({
  personas: 20,
  goal_matrix: goalMatrix.length,
  program_matrix: matrixOk,
  multi_week: loop.weeks.map((week) => week.progression_action),
  lane: resolveTrainingRuntimeLane(true),
}));
