import assert from "node:assert/strict";
import {
  TRAINING_V2_CANONICAL_GOALS,
  LEGACY_GOAL_MAP,
  mapLegacyGoalId,
} from "@/lib/platform/training-v2-contracts";
import {
  QUIZ_GOAL_IDS,
  QUIZ_GOAL_SURFACES,
  mapQuizGoalToPrimaryStrategy,
  createEmptyTemplateContract,
  validateProgramTemplateContract,
  validateSmartAutoVariables,
  resolveHomeCapabilityGate,
  writeTemplateContractToMetadata,
  readTemplateContractFromMetadata,
  templateEnvironmentFromLocation,
  templateLevelFromProgramLevel,
  programLevelFromTemplateLevel,
  legacyProgramGoalFromPrimaryStrategy,
  primaryStrategyFromLegacyProgramGoal,
  mapTrainingV2GoalToPrimaryStrategy,
  trainingV2GoalsForPrimaryStrategy,
  buildAssignmentProvenanceFromContract,
  TEMPLATE_CONTRACT_SNAPSHOT_POLICY,
} from "@/lib/platform/training-templates";

// --- A. Quiz → Primary Strategy (12/12) ---
const expectedQuiz: Record<string, string> = {
  fat: "FAT_LOSS",
  muscle: "MUSCLE_GAIN",
  fitness: "GENERAL_FITNESS",
  athletic: "ATHLETIC_PERFORMANCE",
  shape: "BODY_RECOMPOSITION",
  gain: "MUSCLE_GAIN",
  glutes: "GLUTE_FOCUS",
  waist: "BODY_RECOMPOSITION",
  body: "BODY_RECOMPOSITION",
  fit: "GENERAL_FITNESS",
  tone: "BODY_RECOMPOSITION",
};

assert.equal(QUIZ_GOAL_IDS.length, 11, "11 unique quiz goal ids");
assert.equal(QUIZ_GOAL_SURFACES.length, 12, "12 quiz goal surfaces (male+female)");
for (const surface of QUIZ_GOAL_SURFACES) {
  const result = mapQuizGoalToPrimaryStrategy(surface.goalId);
  assert.equal(result.ok, true, `${surface.gender}/${surface.goalId} maps ok`);
  if (result.ok) {
    assert.equal(
      result.primaryStrategy,
      expectedQuiz[surface.goalId],
      `${surface.goalId} → ${expectedQuiz[surface.goalId]}`,
    );
  }
}
for (const id of QUIZ_GOAL_IDS) {
  assert.equal(mapQuizGoalToPrimaryStrategy(id).ok, true, `unique id ${id}`);
}
const waistMap = mapQuizGoalToPrimaryStrategy("waist");
assert.equal(waistMap.ok, true);
if (waistMap.ok) assert.equal(waistMap.mode, "CONTEXT_SENSITIVE");
const toneMap = mapQuizGoalToPrimaryStrategy("tone");
assert.equal(toneMap.ok, true);
if (toneMap.ok) assert.equal(toneMap.mode, "CONTEXT_SENSITIVE");

const muscleV2 = mapTrainingV2GoalToPrimaryStrategy("MUSCLE_GROWTH");
assert.equal(muscleV2.ok, true);
if (muscleV2.ok) assert.equal(muscleV2.primaryStrategy, "MUSCLE_GAIN");
const gluteV2 = mapTrainingV2GoalToPrimaryStrategy("GLUTE_GROWTH");
assert.equal(gluteV2.ok, true);
if (gluteV2.ok) assert.equal(gluteV2.primaryStrategy, "GLUTE_FOCUS");

// --- B. Training V2 IDs unchanged ---
assert.deepEqual(
  [...TRAINING_V2_CANONICAL_GOALS],
  [
    "GLUTE_GROWTH",
    "SLIM_TONED_WAIST",
    "TONED_ARMS_UPPER_BODY",
    "FEMININE_BALANCED_BODY",
    "FAT_LOSS",
    "POSTURE_TONED_BACK",
    "MUSCLE_GROWTH",
    "FITNESS_ENERGY",
    "ATHLETIC_PHYSIQUE",
    "BODY_RESHAPE",
    "HEALTHY_WEIGHT_GAIN",
  ],
  "Training V2 canonical IDs unchanged",
);
assert.equal(mapLegacyGoalId("muscle").canonicalId, "MUSCLE_GROWTH", "LEGACY_GOAL_MAP intact");
assert.equal(LEGACY_GOAL_MAP.gain.canonicalId, "HEALTHY_WEIGHT_GAIN", "gain still HEALTHY_WEIGHT_GAIN");

// --- C. Unknown goal fail closed ---
assert.equal(mapQuizGoalToPrimaryStrategy("").ok, false, "empty quiz fail closed");
assert.equal(mapQuizGoalToPrimaryStrategy("unknown_goal").ok, false, "unknown quiz fail closed");
assert.equal(mapTrainingV2GoalToPrimaryStrategy("NOT_A_GOAL").ok, false, "unknown v2 fail closed");
assert.equal(mapTrainingV2GoalToPrimaryStrategy("").ok, false, "empty v2 fail closed");

assert.ok(trainingV2GoalsForPrimaryStrategy("MUSCLE_GAIN").includes("MUSCLE_GROWTH"));
assert.ok(trainingV2GoalsForPrimaryStrategy("MUSCLE_GAIN").includes("HEALTHY_WEIGHT_GAIN"));
for (const goal of TRAINING_V2_CANONICAL_GOALS) {
  assert.equal(mapTrainingV2GoalToPrimaryStrategy(goal).ok, true, `V2 bridge covers ${goal}`);
}

// --- D–F. Template contract + level/days independence + environment ---
const contract = createEmptyTemplateContract({
  primaryStrategy: "MUSCLE_GAIN",
  level: "BEGINNER",
  environment: "HOME",
  daysPerWeek: 5, // Beginner ≠ forced 3 days
  targetAudience: "Beginner client training at home with suitable dumbbells and bands whose primary goal is muscle gain.",
  templatePurpose: "Build a sustainable muscle-gain foundation using home-compatible resistance exercises and progressive overload.",
});
assert.equal(contract.variant.level, "BEGINNER");
assert.equal(contract.variant.days_per_week, 5, "level and days independent");
assert.equal(contract.variant.environment, "HOME");
assert.ok(contract.admin_summary.includes("HOME"));
assert.ok(contract.admin_summary.includes("5 Days"));
assert.equal(contract.template_family, "MUSCLE_GAIN");
assert.equal(contract.legacy_program_goal, "bulk");

const validation = validateProgramTemplateContract(contract);
assert.equal(validation.ok, true, `contract valid: ${JSON.stringify(validation.issues)}`);

const incomplete = { ...contract, target_audience: "" };
assert.equal(validateProgramTemplateContract(incomplete).ok, false, "audience required");

assert.equal(templateEnvironmentFromLocation("gym"), "GYM");
assert.equal(templateEnvironmentFromLocation("HOME"), "HOME");
assert.equal(templateEnvironmentFromLocation("anywhere"), null, "BOTH/anywhere → ambiguous");
assert.equal(templateLevelFromProgramLevel("beginner"), "BEGINNER");
assert.equal(programLevelFromTemplateLevel("INTERMEDIATE"), "intermediate");

// --- G–H. Smart + coach controls ---
assert.equal(validateSmartAutoVariables(["WEIGHT", "REPS"]).length, 0);
assert.ok(validateSmartAutoVariables(["WEIGHT", "REPS", "SETS"]).length > 0, "SETS cannot be AUTO");
assert.ok(contract.progression.coach_controlled_variables.includes("SETS"));
assert.ok(contract.progression.coach_controlled_variables.includes("REST"));
assert.deepEqual(contract.progression.smart_auto_variables, ["WEIGHT", "REPS"]);

// --- I. HOME unknown → REVIEW ---
const homeGate = resolveHomeCapabilityGate({
  requirements: [{ key: "safe_band_anchor", required: true }],
  knownCapabilities: { safe_band_anchor: "unknown" },
});
assert.equal(homeGate.status, "REVIEW_REQUIRED");
assert.ok(homeGate.reasons.some((r) => r.includes("UNKNOWN_REQUIRED_CAPABILITY")));

// --- J. Media preference does not fork identity ---
assert.equal(contract.media_preference.duplicates_exercise_identity, false);
const forked = {
  ...contract,
  media_preference: {
    preferred_demonstrator: "FEMALE" as const,
    preferred_media_variant: "FEMALE" as const,
    duplicates_exercise_identity: true,
  },
};
assert.equal(validateProgramTemplateContract(forked).ok, false, "media fork rejected");

// --- K. Review signals ---
const withSignal = {
  ...contract,
  review_signals: ["COACH_REVIEW_REQUIRED" as const, "HOME_LOAD_LIMIT_REVIEW_REQUIRED" as const],
};
assert.equal(validateProgramTemplateContract(withSignal).ok, true);
const badSignal = { ...contract, review_signals: ["NOT_A_SIGNAL"] };
assert.equal(validateProgramTemplateContract(badSignal).ok, false);

// --- L. Legacy program_goal compatibility ---
assert.equal(legacyProgramGoalFromPrimaryStrategy("FAT_LOSS"), "cut");
assert.equal(legacyProgramGoalFromPrimaryStrategy("GLUTE_FOCUS"), "recomp");
assert.equal(primaryStrategyFromLegacyProgramGoal("bulk"), "MUSCLE_GAIN");

const meta = writeTemplateContractToMetadata({ training_location: "GYM" }, contract);
assert.equal(meta.training_location, "HOME", "contract syncs training_location");
assert.equal(meta.primary_strategy, "MUSCLE_GAIN");
assert.ok(readTemplateContractFromMetadata(meta));

const provenance = buildAssignmentProvenanceFromContract(contract);
assert.equal(provenance.primary_strategy, "MUSCLE_GAIN");
assert.equal(TEMPLATE_CONTRACT_SNAPSHOT_POLICY.target_audience, "MASTER_ONLY");
assert.equal(TEMPLATE_CONTRACT_SNAPSHOT_POLICY.variant, "FREEZE_INTO_ASSIGNMENT");

console.log("training-templates Phase 2 contract tests passed");
