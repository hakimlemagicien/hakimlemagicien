import { readFileSync } from "node:fs";
import { join } from "node:path";
import { evaluateRegionalResponse } from "./regional";
import { evaluateGoalResponse, toVolumeReallocationHint, toAdaptiveDecisionSnapshot } from "./goal";
import { classifyMeasurementTrend, photosAreNotBodyTruth } from "./trends";
import { GOAL_INTELLIGENCE_PROFILES } from "./profiles";
import { TRAINING_V2_CANONICAL_GOALS } from "@/lib/platform/training-v2-contracts";
import type { RegionalResponseDecision, RegionalResponseInput } from "./types";
import type { BodyMeasurementEntry } from "@/lib/platform/progress-storage";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

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
    progressionActions: ["INCREASE_REPS", "INCREASE_LOAD"],
    exerciseResponse: "POSITIVE",
    ...partial,
  };
}

const hipThrustOnly = evaluateRegionalResponse(
  regional({ region: "GLUTES", validMicrocycles: 1, exerciseResponse: "POSITIVE", performanceTrend: "IMPROVING" }),
);
assertEqual(hipThrustOnly.exercise_response, "POSITIVE", "exercise layer stays positive");
assertEqual(hipThrustOnly.response_state, "INSUFFICIENT_DATA", "one exposure is not regional speed");
const prematureGoal = evaluateGoalResponse({
  goalId: "GLUTE_GROWTH",
  regions: [hipThrustOnly],
  globalRecovery: "NORMAL",
  adherenceShare: 1,
});
assert(prematureGoal.goal_response === "INSUFFICIENT_DATA", "exercise progress is not glute goal achieved");
assert(prematureGoal.reason_code !== "REGIONAL_PROGRESS_POSITIVE" || prematureGoal.goal_response === "INSUFFICIENT_DATA", "no goal success");

const fast = evaluateRegionalResponse(regional({ region: "GLUTES" }));
assertEqual(fast.response_state, "POSITIVE_FAST", "fast regional");
assertEqual(fast.recommended_signal, "KEEP_STRATEGY", "fast does not add volume");
assertEqual(fast.limiting_factor, "NONE", "no limiter");

const lowAdherence = evaluateRegionalResponse(regional({ region: "GLUTES", completedVolume: 6, prescribedVolume: 12, performanceTrend: "STABLE" }));
assertEqual(lowAdherence.response_state, "ADHERENCE_LIMITED", "low completion is not slow responder");
assertEqual(lowAdherence.limiting_factor, "ADHERENCE", "adherence limiter");

const recoveryLimited = evaluateRegionalResponse(
  regional({ region: "GLUTES", performanceTrend: "STABLE", localFatigue: "HIGH", globalRecovery: "POOR" }),
);
assertEqual(recoveryLimited.response_state, "RECOVERY_LIMITED", "poor recovery is not undertrained");
assertEqual(recoveryLimited.recommended_signal, "RECOVERY_REVIEW_REQUIRED", "no add volume");

const programLimited = evaluateRegionalResponse(
  regional({ region: "GLUTES", directPrimaryShare: 0.1, performanceTrend: "STABLE" }),
);
assertEqual(programLimited.response_state, "PROGRAM_LIMITED", "quad-dominant coverage");
assertEqual(programLimited.limiting_factor, "EXERCISE_SELECTION", "selection limiter");

const progressionLimited = evaluateRegionalResponse(
  regional({
    region: "GLUTES",
    performanceTrend: "STABLE",
    progressionActions: ["RECALIBRATE", "HOLD_PROGRESSION"],
    exerciseResponse: "LIMITED",
  }),
);
assertEqual(progressionLimited.limiting_factor, "EXERCISE_PROGRESSION", "progression limiter");
assert(progressionLimited.response_state !== "ADHERENCE_LIMITED", "volume was completed");

const stagnant = evaluateRegionalResponse(
  regional({
    region: "GLUTES",
    performanceTrend: "STABLE",
    progressionActions: ["KEEP_LOAD"],
    validMicrocycles: 3,
    localFatigue: "NONE",
    globalRecovery: "NORMAL",
  }),
);
assertEqual(stagnant.response_state, "STAGNANT", "stagnant after window");

const slowGlute: RegionalResponseDecision = evaluateRegionalResponse(
  regional({ region: "GLUTES", performanceTrend: "STABLE", progressionActions: ["KEEP_LOAD"], validMicrocycles: 2, globalRecovery: "NORMAL" }),
);
const fastQuad: RegionalResponseDecision = evaluateRegionalResponse(regional({ region: "QUADRICEPS", priority: "SECONDARY" }));
const gluteVsQuad = evaluateGoalResponse({
  goalId: "GLUTE_GROWTH",
  regions: [slowGlute, fastQuad],
  globalRecovery: "LIMITED",
  adherenceShare: 1,
});
assertEqual(gluteVsQuad.goal_response, "REGIONAL_UNDER_RESPONSE", "glute vs quad");
assertEqual(gluteVsQuad.action, "REALLOCATE_TRAINING_EMPHASIS", "reallocate not add lower");
assertEqual(gluteVsQuad.reallocation?.from_region, "QUADRICEPS", "from quads");
assertEqual(gluteVsQuad.reallocation?.to_region, "GLUTES", "to glutes");
assertEqual(toVolumeReallocationHint(gluteVsQuad)?.from_region, "QUADRICEPS", "phase 7 hint");

const gluteSlowRecovery = evaluateGoalResponse({
  goalId: "GLUTE_GROWTH",
  regions: [recoveryLimited, fastQuad],
  globalRecovery: "POOR",
  adherenceShare: 1,
});
assertEqual(gluteSlowRecovery.goal_response, "RECOVERY_LIMITED", "recovery overrides add glute");
assert(gluteSlowRecovery.action !== "REALLOCATE_TRAINING_EMPHASIS", "no extra glute work");

const gluteSlowAdherence = evaluateGoalResponse({
  goalId: "GLUTE_GROWTH",
  regions: [lowAdherence],
  globalRecovery: "NORMAL",
  adherenceShare: 0.5,
});
assertEqual(gluteSlowAdherence.goal_response, "ADHERENCE_LIMITED", "adherence override");

const glutePositive = evaluateRegionalResponse(regional({ region: "GLUTES" }));
const gluteTrainingOnly = evaluateGoalResponse({
  goalId: "GLUTE_GROWTH",
  regions: [glutePositive],
  globalRecovery: "NORMAL",
  adherenceShare: 1,
  body: { hipTrend: "INSUFFICIENT" },
});
assertEqual(gluteTrainingOnly.goal_response, "ON_TRACK", "training-side on track");
assertEqual(gluteTrainingOnly.body_composition_data_required, true, "no confirmed growth");
assertEqual(gluteTrainingOnly.full_goal_confidence, "LOW", "full goal confidence lower than training");
assert(gluteTrainingOnly.training_confidence !== "LOW", "training confidence can be higher");
assert(gluteTrainingOnly.client_explanation.includes("لا يعني تأكيد"), "no false growth claim");

const corePos = evaluateRegionalResponse(regional({ region: "CORE", priority: "SECONDARY" }));
const waist = evaluateGoalResponse({
  goalId: "SLIM_TONED_WAIST",
  regions: [corePos],
  globalRecovery: "NORMAL",
  adherenceShare: 1,
  body: { waistTrend: "STABLE" },
});
assertEqual(waist.goal_response, "BODY_COMPOSITION_LIMITED", "waist not abs");
assertEqual(waist.action, "BODY_COMPOSITION_REVIEW_REQUIRED", "body review");
assert(waist.reason_code !== "VOLUME_REALLOCATION_PREFERRED", "no extra core");

const bicepsSlow = evaluateRegionalResponse(
  regional({ region: "BICEPS", performanceTrend: "STABLE", progressionActions: ["KEEP_LOAD"], validMicrocycles: 2 }),
);
const shoulderFast = evaluateRegionalResponse(regional({ region: "SHOULDERS" }));
const arms = evaluateGoalResponse({
  goalId: "TONED_ARMS_UPPER_BODY",
  regions: [bicepsSlow, shoulderFast],
  globalRecovery: "LIMITED",
  adherenceShare: 1,
});
assertEqual(arms.goal_response, "PARTIAL_RESPONSE", "arms vs shoulders");
assertEqual(arms.action, "REALLOCATE_TRAINING_EMPHASIS", "reallocate upper");
assert(arms.reallocation?.from_region === "SHOULDERS", "from shoulders");

const fatGood = evaluateGoalResponse({
  goalId: "FAT_LOSS",
  regions: [evaluateRegionalResponse(regional({ region: "CHEST", priority: "SECONDARY" }))],
  globalRecovery: "NORMAL",
  adherenceShare: 1,
  body: { weightTrend: "STABLE" },
});
assertEqual(fatGood.action, "NUTRITION_REVIEW_REQUIRED", "fat loss stall is nutrition");
assert(fatGood.goal_response === "BODY_COMPOSITION_LIMITED" || fatGood.goal_response === "PARTIAL_RESPONSE", "training ok");

const fatFast = evaluateGoalResponse({
  goalId: "FAT_LOSS",
  regions: [evaluateRegionalResponse(regional({ region: "CHEST", priority: "SECONDARY", exerciseResponse: "LIMITED", performanceTrend: "DECLINING" }))],
  globalRecovery: "POOR",
  adherenceShare: 1,
  body: { weightTrend: "DECLINING_FAST" },
});
assertEqual(fatFast.goal_response, "RECOVERY_LIMITED", "poor recovery first vs celebrating scale");
const fatTradeoff = evaluateGoalResponse({
  goalId: "FAT_LOSS",
  regions: [
    evaluateRegionalResponse(
      regional({ region: "CHEST", priority: "SECONDARY", exerciseResponse: "LIMITED", performanceTrend: "IMPROVING", localFatigue: "NONE", globalRecovery: "LIMITED" }),
    ),
  ],
  globalRecovery: "LIMITED",
  adherenceShare: 1,
  body: { weightTrend: "DECLINING_FAST" },
});
assert(fatTradeoff.goal_response === "TRADEOFF_DETECTED" || fatTradeoff.nutrition_review_required, "aggressive loss tradeoff");

const balanced = evaluateGoalResponse({
  goalId: "FEMININE_BALANCED_BODY",
  regions: [glutePositive, evaluateRegionalResponse(regional({ region: "UPPER_BACK", priority: "SECONDARY" }))],
  globalRecovery: "NORMAL",
  adherenceShare: 1,
});
assertEqual(balanced.goal_response, "ON_TRACK", "balance on track");
assertEqual(balanced.action, "KEEP_STRATEGY", "do not suppress lower");

const posture = evaluateGoalResponse({
  goalId: "POSTURE_TONED_BACK",
  regions: [evaluateRegionalResponse(regional({ region: "UPPER_BACK" }))],
  globalRecovery: "NORMAL",
  adherenceShare: 1,
});
assertEqual(posture.goal_response, "ON_TRACK", "posture training positive");
assert(posture.client_explanation.includes("ليس تصحيحاً طبياً"), "no medical claim");

const protectedConflict = evaluateGoalResponse({
  goalId: "GLUTE_GROWTH",
  regions: [glutePositive],
  globalRecovery: "NORMAL",
  adherenceShare: 1,
  body: { weightTrend: "DECLINING_FAST", hipTrend: "INSUFFICIENT" },
});
assertEqual(protectedConflict.goal_response, "TRADEOFF_DETECTED", "protected outcome conflict");
assertEqual(protectedConflict.protected_outcome_conflict, true, "conflict flag");

const safety = evaluateGoalResponse({
  goalId: "GLUTE_GROWTH",
  regions: [slowGlute],
  globalRecovery: "NORMAL",
  adherenceShare: 1,
  safetyActive: true,
});
assertEqual(safety.action, "SAFETY_REVIEW", "safety first");

const coach = evaluateGoalResponse({
  goalId: "GLUTE_GROWTH",
  regions: [slowGlute, fastQuad],
  globalRecovery: "NORMAL",
  adherenceShare: 1,
  coachProtected: true,
});
assertEqual(coach.goal_response, "COACH_REVIEW_REQUIRED", "coach lock");
assertEqual(coach.reallocation, null, "no silent rewrite");

const cooldown = evaluateGoalResponse({
  goalId: "GLUTE_GROWTH",
  regions: [slowGlute, fastQuad],
  globalRecovery: "NORMAL",
  adherenceShare: 1,
  lastGoalAction: "REALLOCATE_TRAINING_EMPHASIS",
  lastGoalActionWeeksAgo: 1,
});
assertEqual(cooldown.action, "HOLD_TRAINING_ADAPTATION", "post-adaptation cooldown");
assertEqual(cooldown.reason_code, "POST_ADAPTATION_OBSERVATION", "cooldown reason");

const a = evaluateGoalResponse({ goalId: "GLUTE_GROWTH", regions: [glutePositive], globalRecovery: "NORMAL", adherenceShare: 1 });
const b = evaluateGoalResponse({ goalId: "GLUTE_GROWTH", regions: [glutePositive], globalRecovery: "NORMAL", adherenceShare: 1 });
assertEqual(a.goal_response, b.goal_response, "deterministic");
assertEqual(a.action, b.action, "deterministic action");

assertEqual(a.goal_id, "GLUTE_GROWTH", "goal id unchanged");
const switched = evaluateGoalResponse({
  goalId: "FAT_LOSS",
  previousGoalId: "GLUTE_GROWTH",
  regions: [evaluateRegionalResponse(regional({ region: "CHEST", priority: "SECONDARY" }))],
  globalRecovery: "NORMAL",
  adherenceShare: 1,
  body: { weightTrend: "STABLE" },
});
assertEqual(switched.goal_id, "FAT_LOSS", "new goal context");
assertEqual(a.goal_id, "GLUTE_GROWTH", "old snapshot retained independently");

for (const id of TRAINING_V2_CANONICAL_GOALS) {
  assert(GOAL_INTELLIGENCE_PROFILES[id], `profile ${id}`);
  assert(GOAL_INTELLIGENCE_PROFILES[id].forbidden_shortcuts.length > 0, `${id} has forbidden shortcuts`);
}

const src = readFileSync(join(process.cwd(), "src/lib/platform/goal-intelligence/goal.ts"), "utf8");
assert(!src.includes("calories"), "no calorie writes");
assert(!src.includes("protein"), "no macro writes");
assert(!src.includes("meal"), "no meal writes");
assert(!src.includes("genetically"), "no genetic label");
assert(!src.includes("hormone"), "no hormone inference");
assert(!src.includes("spot"), "spot reduction not implemented as action");
assert(!GOAL_INTELLIGENCE_PROFILES.SLIM_TONED_WAIST.forbidden_shortcuts.includes("keep_strategy"), "waist forbids spot reduction");
assert(GOAL_INTELLIGENCE_PROFILES.SLIM_TONED_WAIST.forbidden_shortcuts.includes("spot_reduction"), "waist spot reduction forbidden");

const measurements: BodyMeasurementEntry[] = [
  { key: "waist", value: 70, unit: "cm", dateKey: "2026-07-01", updatedAt: "t" },
  { key: "waist", value: 70.2, unit: "cm", dateKey: "2026-07-15", updatedAt: "t" },
  { key: "waist", value: 70.1, unit: "cm", dateKey: "2026-08-01", updatedAt: "t" },
];
assertEqual(classifyMeasurementTrend(measurements, "waist"), "STABLE", "waist trend not one reading");
assertEqual(photosAreNotBodyTruth(true).inferred, false, "photos not machine truth");

const log = toAdaptiveDecisionSnapshot(gluteVsQuad);
assertEqual(log.decision_type, "GOAL_RESPONSE", "decision log payload");
assert(log.input_snapshot.goal_id === "GLUTE_GROWTH", "snapshot stores derived state not sets");

assert(!src.includes("program_templates"), "no phase 10 generator");
assert(!readFileSync(join(process.cwd(), "src/lib/platform/goal-intelligence/regional.ts"), "utf8").includes("BEGINNER"), "no auto level");

const regionalSrc = readFileSync(join(process.cwd(), "src/lib/platform/goal-intelligence/regional.ts"), "utf8");
assert(!regionalSrc.includes("genetically"), "no genetic regional label");

console.log("goal-intelligence tests passed");
