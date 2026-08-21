import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAuthoredV2Metadata, toV2Contract } from "@/lib/platform/exercise-library-v2-validator";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import type { ExerciseSetHistoryItem } from "@/lib/platform/training-v2-contracts";
import {
  deriveExerciseExperienceState,
  deriveTrainingLevel,
  filterEligibleExercises,
  getCalibrationAdjustment,
  getCoreExercisePrescription,
  getGoalMuscleProfile,
  resolveCanonicalGoal,
  selectEligibleExercise,
} from "@/lib/platform/prescription";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const authored = loadAuthoredV2Metadata();
const byId = new Map(authored.map((row) => [row.external_id, toV2Contract(row, "placeholder")]));

function ex(id: string): ExerciseV2Metadata {
  const row = byId.get(id);
  if (!row) throw new Error(`missing ${id}`);
  return row;
}

function history(overrides: Partial<ExerciseSetHistoryItem> = {}): ExerciseSetHistoryItem {
  return {
    id: "h1",
    workoutSessionId: "s1",
    sessionDate: "2026-08-20",
    setNumber: 1,
    setType: "WORKING",
    prescribedLoad: 50,
    actualLoad: 50,
    prescribedRepsMin: 6,
    prescribedRepsMax: 12,
    actualReps: 10,
    effort: "medium",
    effortV2: "IDEAL",
    skipped: false,
    setCompleted: true,
    createdAt: "2026-08-20T10:00:00.000Z",
    ...overrides,
  };
}

const now = new Date("2026-08-21T12:00:00.000Z");

assertEqual(resolveCanonicalGoal("GLUTE_GROWTH").canonicalId, "GLUTE_GROWTH", "canonical goal accepted");
assertEqual(resolveCanonicalGoal("fat").canonicalId, "FAT_LOSS", "legacy fat maps");
assertEqual(resolveCanonicalGoal("tone").canonicalId, null, "tone not guessed");
assertEqual(resolveCanonicalGoal("tone").mappingStatus, "LEGACY_UNMAPPED", "tone unmapped");
assert(getGoalMuscleProfile("GLUTE_GROWTH").primary.includes("GLUTES"), "glute profile");
assert(!getGoalMuscleProfile("SLIM_TONED_WAIST").primary.includes("RECTUS_ABDOMINIS"), "waist abs not extreme primary");
assert(getGoalMuscleProfile("TONED_ARMS_UPPER_BODY").maintenance.includes("GLUTES"), "arms keeps lower body");
assert(getGoalMuscleProfile("FAT_LOSS").primary.length === 0, "fat loss is balanced not primary-specialized");

const unmapped = getCoreExercisePrescription({
  goalId: "tone",
  trainingLevel: "UNASSESSED",
  exerciseExperience: "NEW",
  exercise: ex("CH-001"),
  location: "GYM",
  now,
});
assertEqual(unmapped.status, "GOAL_MAPPING_REQUIRED", "unmapped goal does not prescribe");
assertEqual(unmapped.prescription_reason, "GOAL_UNMAPPED", "unmapped reason");
assert(unmapped.prescribed_load == null, "unmapped does not invent load");

const newBench = getCoreExercisePrescription({
  goalId: "FAT_LOSS",
  trainingLevel: "UNASSESSED",
  exerciseExperience: "NEW",
  exercise: ex("CH-001"),
  location: "GYM",
  now,
});
assertEqual(newBench.status, "CALIBRATION_REQUIRED", "new CH-001 calibrates");
assert(newBench.prescribed_load == null, "no universal kg");
assert(newBench.prescribed_load !== 40, "CH-001 is not 40 kg");
assertEqual(newBench.load_source, "UNKNOWN_REQUIRES_CALIBRATION", "explicit missing load");
assert(newBench.working_sets === 2 || newBench.working_sets === 3, "conservative sets");
assert((newBench.working_sets ?? 0) < 4, "unassessed does not get 4 sets by default");
assertEqual(newBench.rep_min, 6, "compound hypertrophy min");
assertEqual(newBench.rep_max, 12, "compound hypertrophy max");
assert(newBench.target_effort === "IDEAL", "beginner target IDEAL");
assertEqual(newBench.failure_required, false, "failure not required");
assertEqual(newBench.failure_allowed, false, "beginner compound failure not allowed");
assert((newBench.recommended_rest_seconds ?? 0) >= 120, "compound rest not shortened");
assert(newBench.prescription_reason.length > 0, "reason present");
assertEqual(newBench.set_type_working, "WORKING", "working sets labeled");

const fatCurl = getCoreExercisePrescription({
  goalId: "FAT_LOSS",
  trainingLevel: "BEGINNER",
  exerciseExperience: "FAMILIAR",
  exercise: ex("BI-001"),
  location: "GYM",
  now,
});
assertEqual(fatCurl.rep_min, 8, "isolation min");
assertEqual(fatCurl.rep_max, 15, "isolation max not fat-loss 15-20");
assert((fatCurl.recommended_rest_seconds ?? 0) >= 60, "fat loss does not force 30s rest");
assert(fatCurl.recommended_rest_seconds !== 30, "no fat-loss short rest");

const glute = getCoreExercisePrescription({
  goalId: "GLUTE_GROWTH",
  trainingLevel: "BEGINNER",
  exerciseExperience: "FAMILIAR",
  exercise: ex("GL-001"),
  location: "GYM",
  now,
});
assertEqual(glute.muscle_priority, "PRIMARY", "glute hip thrust is primary");
assertEqual(glute.rep_min, 6, "glute compound not magical 15");
assertEqual(glute.rep_max, 12, "glute compound hypertrophy range");

const abduction = getCoreExercisePrescription({
  goalId: "GLUTE_GROWTH",
  trainingLevel: "BEGINNER",
  exerciseExperience: "FAMILIAR",
  exercise: ex("GL-007"),
  location: "GYM",
  now,
});
assert(abduction.rep_max === 20 || abduction.rep_min === 12, "glute accessory can use higher isolation range");
assert(abduction.rep_min !== glute.rep_min || abduction.rep_max !== glute.rep_max, "glute goal is not one rep range");

const waistCore = getCoreExercisePrescription({
  goalId: "SLIM_TONED_WAIST",
  trainingLevel: "BEGINNER",
  exerciseExperience: "FAMILIAR",
  exercise: ex("AB-001"),
  location: "GYM",
  now,
});
assert(waistCore.muscle_priority !== "PRIMARY", "waist does not make abs extreme primary");

const plank = getCoreExercisePrescription({
  goalId: "SLIM_TONED_WAIST",
  trainingLevel: "UNASSESSED",
  exerciseExperience: "NEW",
  exercise: ex("AB-006"),
  location: "NO_EQUIPMENT",
  now,
});
assertEqual(plank.prescription_mode, "DURATION", "plank is timed");
assert(plank.duration_min != null && plank.duration_max != null, "duration prescription");
assert(plank.rep_min == null && plank.rep_max == null, "timed does not fake reps");
assertEqual(plank.load_source, "NO_LOAD", "timed has no kg");
assertEqual(plank.movement_role, "ANTI_EXTENSION", "plank role preserved");

const pushUp = getCoreExercisePrescription({
  goalId: "FAT_LOSS",
  trainingLevel: "BEGINNER",
  exerciseExperience: "NEW",
  exercise: ex("CH-004"),
  location: "NO_EQUIPMENT",
  now,
});
assertEqual(pushUp.load_source, "BODYWEIGHT", "bodyweight source");
assert(pushUp.prescribed_load == null, "bodyweight has no kg");
assert(pushUp.rep_min != null, "bodyweight still has reps");

const armsCurl = getCoreExercisePrescription({
  goalId: "TONED_ARMS_UPPER_BODY",
  trainingLevel: "INTERMEDIATE",
  exerciseExperience: "ESTABLISHED",
  exercise: ex("BI-001"),
  location: "GYM",
  recentHistory: [history({ actualLoad: 12 })],
  now,
});
assertEqual(armsCurl.muscle_priority, "PRIMARY", "arms curl elevated");
assert(armsCurl.prescribed_load !== 2, "no tiny toning load");
assertEqual(armsCurl.load_source, "RECENT_HISTORY", "history reused");
assertEqual(armsCurl.prescribed_load, 12, "recent load used");
assertEqual(armsCurl.confidence, "HIGH", "established history high confidence");

const postureRow = getCoreExercisePrescription({
  goalId: "POSTURE_TONED_BACK",
  trainingLevel: "BEGINNER",
  exerciseExperience: "FAMILIAR",
  exercise: ex("BA-010"),
  location: "GYM",
  now,
});
assertEqual(postureRow.movement_role, "HORIZONTAL_PULL", "posture uses pull role");
assert(!JSON.stringify(postureRow).toLowerCase().includes("diagnos"), "no medical diagnosis");

const intermediateNew = getCoreExercisePrescription({
  goalId: "FAT_LOSS",
  trainingLevel: "INTERMEDIATE",
  exerciseExperience: "NEW",
  exercise: ex("CH-001"),
  location: "GYM",
  now,
});
assertEqual(intermediateNew.status, "CALIBRATION_REQUIRED", "global intermediate + NEW exercise still calibrates");
assert(intermediateNew.prescribed_load == null, "no inherited load for new exercise");
assert((intermediateNew.working_sets ?? 9) <= 3, "new exercise stays conservative");

const stale = getCoreExercisePrescription({
  goalId: "FAT_LOSS",
  trainingLevel: "INTERMEDIATE",
  exerciseExperience: "ESTABLISHED",
  prescriptionState: "NORMAL",
  exercise: ex("CH-001"),
  location: "GYM",
  recentHistory: [history({ sessionDate: "2026-01-01", createdAt: "2026-01-01T00:00:00.000Z", actualLoad: 90 })],
  now,
});
assert(stale.prescribed_load == null, "stale peak load not reused");
assertEqual(stale.history_reference_load, 90, "stale load kept as reference only");
assertEqual(stale.status, "CALIBRATION_REQUIRED", "stale history recalibrates");

const recond = getCoreExercisePrescription({
  goalId: "FAT_LOSS",
  trainingLevel: "INTERMEDIATE",
  exerciseExperience: "ESTABLISHED",
  prescriptionState: "RECONDITIONING",
  exercise: ex("CH-001"),
  location: "GYM",
  recentHistory: [history({ actualLoad: 90 })],
  now,
});
assertEqual(recond.status, "RECALIBRATION_REQUIRED", "reconditioning does not reuse peak");
assert(recond.prescribed_load == null, "reconditioning load not prescribed");
assertEqual(recond.history_reference_load, 90, "history remains reference");

const safety = getCoreExercisePrescription({
  goalId: "FAT_LOSS",
  trainingLevel: "INTERMEDIATE",
  exerciseExperience: "ESTABLISHED",
  exercise: ex("CH-001"),
  location: "GYM",
  safetyReview: true,
  recentHistory: [history({ actualLoad: 50 })],
  now,
});
assertEqual(safety.status, "SAFETY_REVIEW_REQUIRED", "safety overrides");
assert(safety.prescribed_load == null, "safety does not increase/reuse load");

const homeBench = getCoreExercisePrescription({
  goalId: "FAT_LOSS",
  trainingLevel: "BEGINNER",
  exerciseExperience: "NEW",
  exercise: ex("CH-001"),
  location: "HOME",
  now,
});
assertEqual(homeBench.status, "EQUIPMENT_CONTEXT_REQUIRED", "gym bench excluded at home");

const missingContext = getCoreExercisePrescription({
  goalId: "FAT_LOSS",
  trainingLevel: "BEGINNER",
  exerciseExperience: "NEW",
  exercise: ex("CH-001"),
  now,
});
assertEqual(missingContext.status, "EQUIPMENT_CONTEXT_REQUIRED", "missing location is not guessed");

const reviewRequired = getCoreExercisePrescription({
  goalId: "TONED_ARMS_UPPER_BODY",
  trainingLevel: "BEGINNER",
  exerciseExperience: "NEW",
  exercise: ex("SH-021"),
  location: "GYM",
  now,
});
assertEqual(reviewRequired.status, "EXERCISE_METADATA_REQUIRED", "unapproved metadata not auto-selected");

const assignedFallback = getCoreExercisePrescription({
  goalId: "TONED_ARMS_UPPER_BODY",
  trainingLevel: "BEGINNER",
  exerciseExperience: "NEW",
  exercise: ex("SH-021"),
  location: "GYM",
  assigned: { sets: 3, reps: "12", rest_seconds: 60, suggested_weight_kg: 8 },
  now,
});
assertEqual(assignedFallback.used_legacy_fallback, true, "snapshot preserved");
assertEqual(assignedFallback.prescription_reason, "V2_FALLBACK_LEGACY_PRESCRIPTION", "legacy fallback explicit");
assert(assignedFallback.prescribed_load == null, "fallback does not treat snapshot kg as V2 baseline");
assertEqual(assignedFallback.assigned?.suggested_weight_kg, 8, "assigned kg stays on snapshot");

const eligible = filterEligibleExercises(
  [ex("CH-001"), ex("CH-004"), ex("SH-021"), ex("BI-001")],
  { location: "GYM", requiredMovementRole: "HORIZONTAL_PUSH" },
);
assert(eligible.every((row) => row.primary_movement_role === "HORIZONTAL_PUSH"), "role filter");
assert(!eligible.some((row) => row.external_id === "SH-021"), "unapproved excluded");
assert(!eligible.some((row) => row.external_id === "BI-001"), "wrong role excluded");
assert(eligible.some((row) => row.external_id === "CH-001"), "valid included");

const first = selectEligibleExercise({
  goalId: "FAT_LOSS",
  trainingLevel: "BEGINNER",
  location: "GYM",
  requiredMovementRole: "HORIZONTAL_PUSH",
  candidates: [ex("CH-012"), ex("CH-001"), ex("CH-004")],
});
const second = selectEligibleExercise({
  goalId: "FAT_LOSS",
  trainingLevel: "BEGINNER",
  location: "GYM",
  requiredMovementRole: "HORIZONTAL_PUSH",
  candidates: [ex("CH-012"), ex("CH-001"), ex("CH-004")],
});
assertEqual(first.exercise?.external_id, second.exercise?.external_id, "deterministic selection");
assert(first.selection_reason !== "random", "no random reason");

const keepExisting = selectEligibleExercise({
  goalId: "FAT_LOSS",
  trainingLevel: "BEGINNER",
  location: "GYM",
  requiredMovementRole: "HORIZONTAL_PUSH",
  candidates: [ex("CH-012"), ex("CH-001"), ex("CH-004")],
  existingExternalId: "CH-001",
});
assertEqual(keepExisting.exercise?.external_id, "CH-001", "stability prefers existing");
assertEqual(keepExisting.selection_reason, "EXISTING_EXERCISE_STABILITY", "keep reason");

assertEqual(
  getCalibrationAdjustment({
    exercise: ex("CH-001"),
    trainingLevel: "BEGINNER",
    targetMin: 6,
    targetMax: 12,
    actualValue: 10,
    actualLoad: 40,
    effort: "IDEAL",
    equipmentIncrementKg: 2.5,
    prescriptionMode: "REPS",
  }).action,
  "KEEP",
  "ideal keep",
);

const easyBump = getCalibrationAdjustment({
  exercise: ex("CH-001"),
  trainingLevel: "BEGINNER",
  targetMin: 6,
  targetMax: 12,
  actualValue: 12,
  actualLoad: 40,
  effort: "EASY",
  equipmentIncrementKg: 2.5,
  prescriptionMode: "REPS",
});
assertEqual(easyBump.action, "SMALL_INCREASE", "easy + safe increment");
assertEqual(easyBump.next_load, 42.5, "uses equipment increment not +10%");
assert(easyBump.next_load !== 44, "not 10 percent");

const easyNoIncrement = getCalibrationAdjustment({
  exercise: ex("CH-001"),
  trainingLevel: "BEGINNER",
  targetMin: 6,
  targetMax: 12,
  actualValue: 12,
  actualLoad: 40,
  effort: "EASY",
  prescriptionMode: "REPS",
});
assertEqual(easyNoIncrement.action, "KEEP", "no guessed increment");

const largeJump = getCalibrationAdjustment({
  exercise: ex("CH-001"),
  trainingLevel: "BEGINNER",
  targetMin: 6,
  targetMax: 12,
  actualValue: 12,
  actualLoad: 20,
  effort: "EASY",
  equipmentIncrementKg: 10,
  prescriptionMode: "REPS",
});
assertEqual(largeJump.action, "KEEP", "large relative jump blocked");

assertEqual(
  getCalibrationAdjustment({
    exercise: ex("CH-001"),
    trainingLevel: "BEGINNER",
    targetMin: 6,
    targetMax: 12,
    actualValue: 3,
    actualLoad: 40,
    effort: "FAILURE",
    equipmentIncrementKg: 2.5,
    prescriptionMode: "REPS",
  }).action,
  "REDUCE",
  "failure reduces",
);

assertEqual(
  getCalibrationAdjustment({
    exercise: ex("CH-001"),
    trainingLevel: "BEGINNER",
    targetMin: 6,
    targetMax: 12,
    actualValue: 10,
    actualLoad: 40,
    effort: "IDEAL",
    safetyReview: true,
    prescriptionMode: "REPS",
  }).action,
  "SAFETY_REVIEW",
  "safety blocks calibration increase",
);

assertEqual(deriveExerciseExperienceState([]), "NEW", "no history is NEW");
assertEqual(deriveExerciseExperienceState([history(), history({ sessionDate: "2026-08-19" })]), "CALIBRATING", "two sessions calibrating");
assertEqual(deriveTrainingLevel({ current: "UNASSESSED", establishedExerciseCount: 0, completedWorkingSets: 0 }), "UNASSESSED", "no auto intermediate");
assertEqual(deriveTrainingLevel({ current: "UNASSESSED", establishedExerciseCount: 2, completedWorkingSets: 6 }), "BEGINNER", "evidence → beginner only");
assertEqual(deriveTrainingLevel({ current: "BEGINNER", establishedExerciseCount: 20, completedWorkingSets: 100 }), "BEGINNER", "no time/volume auto intermediate");

const root = process.cwd();
const engineSrc = readFileSync(join(root, "src/lib/platform/prescription/engine.ts"), "utf8");
const calibSrc = readFileSync(join(root, "src/lib/platform/prescription/calibration.ts"), "utf8");
const indexSrc = readFileSync(join(root, "src/lib/platform/prescription/index.ts"), "utf8");
assert(!engineSrc.includes("SET_WEIGHT_INCREMENT"), "V2 engine does not import +10%");
assert(!calibSrc.includes("0.1"), "calibration has no universal 0.1");
assert(!engineSrc.includes("getSetProgression"), "V2 does not call legacy progression");
assert(!engineSrc.includes("TODAY_WORKOUT"), "V2 does not read free preview loads");
assert(!engineSrc.includes("suggested_weight_kg: 40"), "V2 source has no CH-001 40");
assert(indexSrc.includes("getCoreExercisePrescription"), "engine exported");
assert(!engineSrc.toLowerCase().includes("calorie"), "no nutrition");
assert(!engineSrc.includes("INCREASE_LOAD_NEXT_SESSION"), "no phase 6 progression");
assert(!engineSrc.includes("ADD_WEEKLY_VOLUME"), "no phase 7 volume");
assert(!engineSrc.includes("GLUTES FAST"), "no regional response");

const player = readFileSync(join(root, "src/hooks/useWorkoutPlayer.ts"), "utf8");
assert(player.includes("legacy_free"), "legacy free path isolated");
assert(player.includes("getSetProgression"), "legacy_free still has isolated +10% helper");
assert(!player.includes("listV2ExerciseCandidates"), "player does not load full V2 catalog");
const today = readFileSync(join(root, "src/lib/platform/today-workout.ts"), "utf8");
assert(today.includes("suggested_weight_kg: 40"), "free preview boundary kept");

console.log("core prescription engine tests passed");
