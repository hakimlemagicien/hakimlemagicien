import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAuthoredV2Metadata, toV2Contract } from "@/lib/platform/exercise-library-v2-validator";
import { TRAINING_V2_CANONICAL_GOALS } from "@/lib/platform/training-v2-contracts";
import { GOAL_MUSCLE_PROFILES } from "@/lib/platform/prescription/goal-profile";
import { CONTRIBUTION_WEIGHT } from "@/lib/platform/volume/types";
import {
  generateTrainingProgram,
  validateTrainingProgram,
  canActivateProgram,
  programDiff,
  toContinuityProgramDays,
  PROGRAM_GENERATOR,
  PROGRAM_VALIDATOR,
  PROGRAM_COPY,
} from "@/lib/platform/program-generation";
import { cloneCandidate } from "@/lib/platform/program-generation/apply";
import { buildSessionBlueprints } from "@/lib/platform/program-generation/roles";
import { expandBlueprintToTarget, resolveSessionExerciseTarget } from "@/lib/platform/program-generation/session-composition";
import { estimateSessionMinutes } from "@/lib/platform/program-generation/duration";
import { STANDARD_SESSION_EXERCISE_TARGET } from "@/lib/platform/program-generation/types";
import type { ProgramCandidate, ProgramGenerationContext } from "@/lib/platform/program-generation/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const authored = loadAuthoredV2Metadata();
const exercises = authored.map((row) => toV2Contract(row, "placeholder"));
const byId = new Map(exercises.map((item) => [item.external_id, item]));

function base(overrides: Partial<ProgramGenerationContext> = {}): ProgramGenerationContext {
  return {
    goalId: "GLUTE_GROWTH",
    trainingLevel: "INTERMEDIATE",
    daysPerWeek: 3,
    availableMinutes: 60,
    location: "GYM",
    availableEquipment: null,
    exercises,
    reason: "INITIAL_PROGRAM_GENERATION",
    ...overrides,
  };
}

const GOALS = [...TRAINING_V2_CANONICAL_GOALS];
const DAYS = [2, 3, 4, 5] as const;
const matrix: Array<{
  goal: string;
  days: number;
  roles: string[];
  status: string;
  primary: string[];
  volume: Record<string, number>;
  movement: string[];
  minutes: number[];
}> = [];

for (const goal of GOALS) {
  const roleSets: string[][] = [];
  for (const days of DAYS) {
    const result = generateTrainingProgram(base({ goalId: goal, daysPerWeek: days }));
    assert(result.validation.status !== "INVALID", `${goal} ${days}d invalid: ${JSON.stringify(result.validation.errors)}`);
    assert(result.status === "READY", `${goal} ${days}d not READY: ${result.status}`);
    assert(result.candidate, `${goal} ${days}d missing candidate`);
    assertEqual(result.candidate.sessions.length, days, `${goal} ${days}d session count`);
    assert(
      result.candidate.sessions.every((session) => session.estimated_minutes <= 60),
      `${goal} ${days}d duration`,
    );
    assert(
      result.candidate.sessions.every((session) => session.exercises.every((item) => item.suggested_weight_kg === null)),
      `${goal} ${days}d no baked load`,
    );
    const ids = result.candidate.sessions.map((session) => session.sequence_index);
    assertEqual(ids.join(","), [...Array(days).keys()].join(","), `${goal} ${days}d sequence`);
    const roles = result.candidate.sessions.map((session) => session.role);
    roleSets.push(roles);
    if (goal === "GLUTE_GROWTH") {
      assert((result.regional_volume.GLUTES?.effective ?? 0) > 0, "glute primary volume");
    }
    if (goal === "FAT_LOSS") {
      assert(
        !result.movement_roles.includes("INTERVAL_CONDITIONING"),
        "fat loss must not require intervals",
      );
    }
    if (goal === "SLIM_TONED_WAIST") {
      const absHeavy = result.candidate.sessions.flatMap((session) => session.exercises).filter((item) => item.movement_role === "TRUNK_FLEXION");
      assert(absHeavy.length < 3, "waist is not abs fat burn");
    }
    if (goal === "TONED_ARMS_UPPER_BODY") {
      assert((result.regional_volume.GLUTES?.effective ?? 0) + (result.regional_volume.QUADRICEPS?.effective ?? 0) > 0, "arms keep lower maintenance");
    }
    matrix.push({
      goal,
      days,
      roles,
      status: result.validation.status,
      primary: GOAL_MUSCLE_PROFILES[goal].primary,
      volume: Object.fromEntries(Object.entries(result.regional_volume).map(([key, value]) => [key, Number(value.effective.toFixed(2))])),
      movement: result.movement_roles,
      minutes: result.candidate.sessions.map((session) => session.estimated_minutes),
    });
  }
  assert(new Set(roleSets.map((row) => row.join("|"))).size > 1, `${goal} must not use one template for every frequency`);
}

assertEqual(matrix.length, TRAINING_V2_CANONICAL_GOALS.length * DAYS.length, "goal × frequency scenarios");

const first = generateTrainingProgram(base({ daysPerWeek: 3 }));
const second = generateTrainingProgram(base({ daysPerWeek: 3 }));
assertEqual(JSON.stringify(first.candidate), JSON.stringify(second.candidate), "deterministic");

const home = generateTrainingProgram(
  base({
    location: "HOME",
    availableEquipment: ["DUMBBELL", "BAND"],
    daysPerWeek: 3,
  }),
);
assert(home.candidate, "home candidate");
for (const session of home.candidate.sessions) {
  for (const exercise of session.exercises) {
    const meta = byId.get(exercise.external_id);
    assert(meta, `home unknown ${exercise.external_id}`);
    assert(meta.location_compatibility.includes("HOME"), `${exercise.external_id} not home`);
    if (meta.equipment_state === "HAS_EQUIPMENT") {
      assert(
        meta.required_equipment.every((item) => ["DUMBBELL", "BAND"].includes(item)),
        `${exercise.external_id} equipment`,
      );
    }
    assert(meta.loading_type !== "CABLE", "no cable without equipment");
  }
}

const gym = generateTrainingProgram(base({ location: "GYM", daysPerWeek: 4 }));
assert(gym.status === "READY", "gym ready");

const beginner = generateTrainingProgram(base({ trainingLevel: "BEGINNER", daysPerWeek: 3 }));
assert(beginner.status === "READY", "beginner ready");
const beginnerCount = beginner.candidate!.sessions.reduce((sum, session) => sum + session.exercises.length, 0);
const intermediateCount = first.candidate!.sessions.reduce((sum, session) => sum + session.exercises.length, 0);
assert(beginnerCount <= intermediateCount + 2, "beginner is not more complex");

const twoDay = generateTrainingProgram(base({ daysPerWeek: 2 }));
assert(
  twoDay.candidate!.sessions.every((session) => session.exercises.length <= STANDARD_SESSION_EXERCISE_TARGET),
  "2-day is not a giant catch-all",
);

const standardEligible = generateTrainingProgram(base({ goalId: "GLUTE_GROWTH", daysPerWeek: 3, availableMinutes: 60, location: "GYM" }));
assert(standardEligible.candidate, "standard eligible candidate");
const standardCounts = standardEligible.candidate.sessions.map((session) => session.exercises.length);
assert(
  standardCounts.every((count) => count >= 4 && count <= STANDARD_SESSION_EXERCISE_TARGET),
  `standard eligible range: ${standardCounts.join(",")}`,
);
assert(
  standardCounts.filter((count) => count === STANDARD_SESSION_EXERCISE_TARGET).length >= 1,
  `expected at least one ${STANDARD_SESSION_EXERCISE_TARGET}-exercise session, got ${standardCounts.join(",")}`,
);

const durationConstrained = generateTrainingProgram(base({ availableMinutes: 35, daysPerWeek: 3 }));
assert(durationConstrained.candidate, "duration constrained candidate");
assert(
  durationConstrained.candidate.sessions.every((session) => session.exercises.length >= 2 && session.exercises.length <= 5),
  "duration constrained sessions shorten",
);
assert(
  durationConstrained.candidate.sessions.every((session) => session.estimated_minutes <= 35),
  "duration constrained fits budget",
);
assertEqual(durationConstrained.validation.status !== "INVALID", true, "duration constrained stays valid");

const thinHome = generateTrainingProgram(
  base({
    location: "HOME",
    availableEquipment: ["BAND"],
    daysPerWeek: 3,
    availableMinutes: 60,
  }),
);
assert(thinHome.candidate, "thin home candidate");
for (const session of thinHome.candidate.sessions) {
  for (const exercise of session.exercises) {
    const meta = byId.get(exercise.external_id);
    assert(meta, `thin home unknown ${exercise.external_id}`);
    assert(meta.location_compatibility.includes("HOME"), `${exercise.external_id} not home`);
  }
}

const fiveDay = generateTrainingProgram(base({ daysPerWeek: 5 }));
const threeDayVolume = first.regional_volume.GLUTES?.effective ?? 0;
const fiveDayVolume = fiveDay.regional_volume.GLUTES?.effective ?? 0;
assert(fiveDayVolume < threeDayVolume * 2.5, "5-day is not automatic max volume");

const realloc = generateTrainingProgram(
  base({
    daysPerWeek: 4,
    reallocation: { from_region: "QUADRICEPS", to_region: "GLUTES" },
    reason: "REGIONAL_REALLOCATION",
  }),
);
const baseline4 = generateTrainingProgram(base({ daysPerWeek: 4 }));
const lowerBefore =
  (baseline4.regional_volume.GLUTES?.effective ?? 0) + (baseline4.regional_volume.QUADRICEPS?.effective ?? 0);
const lowerAfter = (realloc.regional_volume.GLUTES?.effective ?? 0) + (realloc.regional_volume.QUADRICEPS?.effective ?? 0);
assert(realloc.regional_volume.GLUTES?.effective ?? 0 >= (baseline4.regional_volume.GLUTES?.effective ?? 0) - 0.01, "glute quality not reduced");
assert(lowerAfter <= lowerBefore + 1.01, "reallocation does not raise total lower stress");
assert(realloc.client_explanation.includes("المؤخرة"), "glute explanation");

const recoveryLimited = generateTrainingProgram(
  base({
    recoveryState: "POOR",
    reallocation: { from_region: "QUADRICEPS", to_region: "GLUTES" },
  }),
);
const recoverySets = recoveryLimited.candidate!.sessions.reduce((sum, session) => sum + session.exercises.reduce((inner, item) => inner + item.sets, 0), 0);
const normalSets = first.candidate!.sessions.reduce((sum, session) => sum + session.exercises.reduce((inner, item) => inner + item.sets, 0), 0);
assert(recoverySets <= normalSets, "recovery limited does not add stress");

const arms = generateTrainingProgram(base({ goalId: "TONED_ARMS_UPPER_BODY", daysPerWeek: 4 }));
const armsRealloc = generateTrainingProgram(
  base({
    goalId: "TONED_ARMS_UPPER_BODY",
    daysPerWeek: 4,
    reallocation: { from_region: "SHOULDERS", to_region: "BICEPS" },
    reason: "REGIONAL_REALLOCATION",
  }),
);
const upperBefore =
  (arms.regional_volume.SHOULDERS?.effective ?? 0) +
  (arms.regional_volume.BICEPS?.effective ?? 0) +
  (arms.regional_volume.TRICEPS?.effective ?? 0);
const upperAfter =
  (armsRealloc.regional_volume.SHOULDERS?.effective ?? 0) +
  (armsRealloc.regional_volume.BICEPS?.effective ?? 0) +
  (armsRealloc.regional_volume.TRICEPS?.effective ?? 0);
assert(upperAfter <= upperBefore + 1.5, "arms realloc does not blindly raise upper volume");
assert(armsRealloc.client_explanation.includes("الذراعين"), "arms explanation");

const mismatch = generateTrainingProgram(base({ scheduleCapacityMismatch: true, daysPerWeek: 5 }));
assertEqual(mismatch.status, "PROGRAM_REVIEW_REQUIRED", "schedule mismatch review");
assertEqual(mismatch.candidate, null, "do not activate unrealistic frequency");

const durationCap = generateTrainingProgram(base({ availableMinutes: 45, sessionDurationMismatch: true, daysPerWeek: 3 }));
assert(durationCap.candidate, "duration cap still generates");
assert(
  durationCap.candidate.sessions.every((session) => session.estimated_minutes <= 45),
  "sessions fit 45",
);
assert(
  durationCap.candidate.sessions.every((session) => session.exercises.length >= 4 && session.exercises.length <= STANDARD_SESSION_EXERCISE_TARGET),
  "45-minute sessions stay within strategy range",
);
const durationPrimary = durationCap.candidate.sessions.some((session) =>
  session.exercises.some((item) => item.muscle_priority === "PRIMARY" || item.movement_role === "HIP_EXTENSION"),
);
assert(durationPrimary, "primary work preserved when shortening");

const recond = generateTrainingProgram(base({ reconditioningActive: true, trainingLevel: "INTERMEDIATE" }));
assertEqual(recond.candidate!.goal_id, "GLUTE_GROWTH", "reconditioning keeps goal");
const recondSets = recond.candidate!.sessions.reduce((sum, session) => sum + session.exercises.reduce((inner, item) => inner + item.sets, 0), 0);
assert(recondSets <= normalSets, "reconditioning reduces current volume");
assertEqual(recond.client_explanation, PROGRAM_COPY.RECONDITIONING, "level not reset copy");

const locationChange = generateTrainingProgram(
  base({
    location: "HOME",
    availableEquipment: ["DUMBBELL"],
    previousProgram: gym.candidate,
    previousExternalIds: gym.candidate!.sessions.flatMap((session) => session.exercises.map((item) => item.external_id)),
    reason: "LOCATION_CHANGED",
  }),
);
assert(locationChange.candidate, "location change rematerializes");
assert(locationChange.candidate.version === gym.candidate!.version + 1, "new version");
assert(locationChange.diff.removed.length >= 0, "diff exists");

const established = generateTrainingProgram(
  base({
    previousExternalIds: ["GL-001"],
    experienceById: { "GL-001": "ESTABLISHED" },
    daysPerWeek: 3,
  }),
);
const establishedIds = established.candidate!.sessions.flatMap((session) => session.exercises.map((item) => item.external_id));
assert(establishedIds.includes("GL-001"), "retain established hip thrust");
assert(
  established.candidate!.sessions.some((session) =>
    session.exercises.some((item) => item.external_id === "GL-001" && item.calibration_required === false),
  ),
  "established exercise is not fake-calibrated",
);

const fresh = generateTrainingProgram(base({ daysPerWeek: 3, experienceById: {} }));
assert(
  fresh.candidate!.sessions.some((session) => session.exercises.some((item) => item.calibration_required)),
  "new exercises stay calibration-compatible",
);

const locked = generateTrainingProgram(base({ lockedExternalIds: ["GL-001"], daysPerWeek: 3 }));
assert(locked.candidate!.sessions.some((session) => session.exercises.some((item) => item.external_id === "GL-001")), "coach lock retained");

const lockConflict = generateTrainingProgram(base({ lockedExternalIds: ["GL-001"], excludedExternalIds: ["GL-001"] }));
assertEqual(lockConflict.status, "COACH_OVERRIDE_CONFLICT", "lock vs safety conflict");

const spot = generateTrainingProgram(base({ goalId: "SLIM_TONED_WAIST", waistStagnationSpotReduction: true }));
assertEqual(spot.status, "PROGRAM_GENERATION_BLOCKED", "spot reduction blocked");
assert(spot.validation.errors.some((item) => item.code === "SPOT_REDUCTION_LOGIC_INVALID"), "spot code");
assertEqual(canActivateProgram(spot.validation, spot.status), false, "invalid not active");

const noCandidate = generateTrainingProgram(
  base({
    daysPerWeek: 3,
    excludedExternalIds: exercises.map((item) => item.external_id),
  }),
);
assert(noCandidate.status === "PROGRAM_GENERATION_BLOCKED", "no library coverage blocked");
assert(noCandidate.validation.errors.some((item) => item.code === "NO_VALID_EXERCISE_CANDIDATE" || item.code === "MISSING_PRIMARY_REGION" || item.code === "MISSING_MOVEMENT_ROLE"), "blocker code");

const goalChange = generateTrainingProgram(
  base({
    goalId: "FAT_LOSS",
    previousProgram: first.candidate,
    reason: "GOAL_CHANGED",
  }),
);
assertEqual(goalChange.candidate!.goal_id, "FAT_LOSS", "goal change generates new goal");
assert(goalChange.candidate!.version === first.candidate!.version + 1, "history version increments");

const daysChange = generateTrainingProgram(base({ daysPerWeek: 4, previousProgram: first.candidate, reason: "TRAINING_DAYS_CHANGED" }));
assertEqual(daysChange.candidate!.sessions.length, 4, "days change is a new structure");
assert(
  daysChange.candidate!.sessions.map((session) => session.role).join("|") !== first.candidate!.sessions.map((session) => session.role).join("|"),
  "not a random extra session tacked on",
);

const compound = byId.get("GL-001")!;
assertEqual(CONTRIBUTION_WEIGHT.DIRECT_PRIMARY, 1, "phase 3/7 weight");
const hipSet = 1 * CONTRIBUTION_WEIGHT.DIRECT_PRIMARY;
const hamSet = 1 * CONTRIBUTION_WEIGHT.DIRECT_SECONDARY;
assert(hipSet === 1 && hamSet === 0.5, "no full-set triple count");
assert(compound.muscle_contributions.length >= 2, "compound multi-region");

const continuity = toContinuityProgramDays(first.candidate!);
assert(
  continuity.every((day, index) => day.programDayId === `program-day-${index}` && day.sequenceIndex === index),
  "phase 8 sequence ids",
);
assert(!continuity.some((day) => /monday|tuesday/i.test(day.programDayId)), "session identity is not weekday");

const valid = first.candidate!;
const validCheck = validateTrainingProgram(valid, base(), { regionalVolume: first.regional_volume });
assert(validCheck.status === "VALID" || validCheck.status === "VALID_WITH_WARNINGS", "valid program");

function mutate(edit: (candidate: ProgramCandidate) => void) {
  const copy = cloneCandidate(valid);
  edit(copy);
  return validateTrainingProgram(copy, base(), { regionalVolume: first.regional_volume });
}

const missingPrimary = mutate((candidate) => {
  candidate.sessions = candidate.sessions.map((session) => ({
    ...session,
    exercises: session.exercises.filter((item) => item.movement_role !== "HIP_EXTENSION" && item.muscle_priority !== "PRIMARY"),
  }));
});
assert(missingPrimary.errors.some((item) => item.code === "MISSING_PRIMARY_REGION" || item.code === "MISSING_MOVEMENT_ROLE"), "missing primary");

const volumeLow = validateTrainingProgram(valid, base(), {
  regionalVolume: { GLUTES: { effective: 0.5, physical: 1 } },
  targets: [{ region: "GLUTES", min: 6, target: 8, max: 14 }],
});
assert(volumeLow.errors.some((item) => item.code === "REGIONAL_VOLUME_BELOW_MIN"), "volume low");

const volumeHigh = validateTrainingProgram(valid, base(), {
  regionalVolume: { GLUTES: { effective: 40, physical: 40 } },
  targets: [{ region: "GLUTES", min: 3, target: 8, max: 14 }],
});
assert(volumeHigh.errors.some((item) => item.code === "REGIONAL_VOLUME_ABOVE_MAX"), "volume high");

const missingRole = mutate((candidate) => {
  candidate.sessions.forEach((session) => {
    session.exercises = session.exercises.map((item, index) => ({
      ...item,
      external_id: "CA-001",
      movement_role: "CALF_RAISE",
      order_index: index,
    }));
  });
});
assert(missingRole.errors.some((item) => item.code === "MISSING_MOVEMENT_ROLE"), "missing role");

const redundant = mutate((candidate) => {
  const firstEx = candidate.sessions[0].exercises[0];
  candidate.sessions[0].exercises = [firstEx, { ...firstEx, order_index: 1 }, { ...firstEx, order_index: 2 }, { ...firstEx, order_index: 3 }];
});
assert(redundant.errors.some((item) => item.code === "REDUNDANT_STIMULUS_EXCESS"), "redundancy");

const spacing = mutate((candidate) => {
  candidate.sessions[0].role = "LOWER_GLUTE_PRIORITY";
  candidate.sessions[0].primary_regions = ["GLUTES"];
  candidate.sessions[1].role = "LOWER_GLUTE_PRIORITY";
  candidate.sessions[1].primary_regions = ["GLUTES"];
});
assert(spacing.errors.some((item) => item.code === "RECOVERY_SPACING_INVALID"), "recovery spacing");

const consecutiveOk = mutate((candidate) => {
  candidate.sessions[0].role = "UPPER_PRIORITY";
  candidate.sessions[0].primary_regions = ["SHOULDERS"];
  candidate.sessions[1].role = "LOWER_SUPPORT";
  candidate.sessions[1].primary_regions = ["GLUTES"];
});
assert(!consecutiveOk.errors.some((item) => item.code === "RECOVERY_SPACING_INVALID"), "consecutive different regions allowed");

const tooLong = mutate((candidate) => {
  candidate.sessions[0].estimated_minutes = 90;
});
assert(tooLong.errors.some((item) => item.code === "SESSION_DURATION_EXCEEDED"), "duration exceeded");

const unknown = mutate((candidate) => {
  candidate.sessions[0].exercises[0].external_id = "ZZ-999";
});
assert(unknown.errors.some((item) => item.code === "UNKNOWN_EXERCISE"), "unknown id");
assertEqual(canActivateProgram(unknown, "READY"), false, "unknown not active");

const safety = validateTrainingProgram(valid, base({ excludedExternalIds: [valid.sessions[0].exercises[0].external_id] }), {
  regionalVolume: first.regional_volume,
});
assert(safety.errors.some((item) => item.code === "SAFETY_RESTRICTION_VIOLATION"), "safety");

const equipment = validateTrainingProgram(valid, base({ location: "HOME", availableEquipment: [] }), {
  regionalVolume: first.regional_volume,
});
assert(
  equipment.errors.some((item) => item.code === "EQUIPMENT_MISMATCH" || item.code === "LOCATION_MISMATCH"),
  "home vs gym equipment/location",
);

const sequence = mutate((candidate) => {
  candidate.sessions[0].sequence_index = 1;
});
assert(sequence.errors.some((item) => item.code === "DUPLICATE_SESSION_INDEX" || item.code === "INVALID_SEQUENCE"), "sequence");

const protectedOutcome = validateTrainingProgram(valid, base(), {
  regionalVolume: { GLUTES: { effective: 4, physical: 4 }, QUADRICEPS: { effective: 12, physical: 12 } },
});
assert(protectedOutcome.errors.some((item) => item.code === "PROTECTED_OUTCOME_CONFLICT"), "quad-dominant glute program");

const fatLossHiit = generateTrainingProgram(base({ goalId: "FAT_LOSS", daysPerWeek: 3 }));
assert(
  !fatLossHiit.candidate!.sessions.some((session) => session.exercises.some((item) => item.rest_seconds < 60 && item.reps_min != null && item.reps_min >= 20)),
  "fat loss is not high-rep short rest",
);

assertEqual(PROGRAM_GENERATOR, "generateTrainingProgram", "central generator");
assertEqual(PROGRAM_VALIDATOR, "validateTrainingProgram", "central validator");

const srcRoot = join(process.cwd(), "src/lib/platform/program-generation");
for (const file of ["generate.ts", "validate.ts", "volume.ts", "selection.ts"]) {
  const source = readFileSync(join(srcRoot, file), "utf8");
  assert(!source.includes("calories"), `${file} must not write calories`);
  assert(!source.includes("macros"), `${file} must not write macros`);
  assert(!/meal_plan|upsertMeal|nutrition_plan/.test(source), `${file} must not mutate meals`);
  assert(!source.includes("from(\""), `${file} has no supabase writes`);
}

const workoutIndex = readFileSync(join(process.cwd(), "src/routes/_platform/app/program/workout/index.tsx"), "utf8");
assert(!workoutIndex.includes("generateTrainingProgram"), "legacy workout page does not auto-regenerate");

const snapshotMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260820240000_client_program_assignment_snapshots.sql"),
  "utf8",
);
assert(snapshotMigration.includes("client_program_days"), "existing snapshot schema reused");
assert(!snapshotMigration.includes("v2_programs"), "no parallel v2_programs in original snapshot");

const roles2 = buildSessionBlueprints({ goal: "GLUTE_GROWTH", days: 2 }).map((item) => item.role);
const roles5 = buildSessionBlueprints({ goal: "GLUTE_GROWTH", days: 5 }).map((item) => item.role);
assert(roles2.includes("FULL_BODY"), "2-day glute uses efficient full body");
assert(roles5.includes("LOWER_GLUTE_PRIORITY"), "5-day allows specialization");
assert(roles2.join() !== roles5.join(), "frequency changes structure");

const expandedHigh = expandBlueprintToTarget(
  buildSessionBlueprints({ goal: "GLUTE_GROWTH", days: 2 })[0],
  STANDARD_SESSION_EXERCISE_TARGET,
);
assertEqual(expandedHigh.slots.length, STANDARD_SESSION_EXERCISE_TARGET, "full body expands to target");

const coreSupportTarget = resolveSessionExerciseTarget({
  availableMinutes: 60,
  trainingLevel: "INTERMEDIATE",
  daysPerWeek: 3,
  demand: "LOW",
});
assertEqual(coreSupportTarget, 4, "low-demand core support stays shorter");

const beginnerFiveTarget = resolveSessionExerciseTarget({
  availableMinutes: 60,
  trainingLevel: "BEGINNER",
  daysPerWeek: 5,
  demand: "HIGH",
});
assertEqual(beginnerFiveTarget, 5, "beginner 5-day reduces target");

const durationEstimate = estimateSessionMinutes(first.candidate!.sessions[0].exercises);
assert(durationEstimate === first.candidate!.sessions[0].estimated_minutes, "duration uses sets+rest not count alone");

assert(programDiff(first.candidate, daysChange.candidate).added.length + programDiff(first.candidate, daysChange.candidate).removed.length > 0, "diff-aware regeneration");

console.log("program-generation tests passed");
console.log(JSON.stringify(matrix.map((row) => ({
  GOAL_ID: row.goal,
  DAYS_PER_WEEK: row.days,
  SESSION_ROLES: row.roles,
  VALIDATION: row.status,
  PRIMARY: row.primary,
  MOVEMENT: row.movement,
  MINUTES: row.minutes,
})), null, 2));
