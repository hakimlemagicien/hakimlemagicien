import { loadAuthoredV2Metadata, toV2Contract } from "@/lib/platform/exercise-library-v2-validator";
import { explainEligibility } from "@/lib/platform/prescription/eligibility";
import { generateTrainingProgram } from "@/lib/platform/program-generation";
import {
  EXERCISE_POOL_MAAKFIT_V1_CORE_100,
  aggregateSafetyConstraints,
  buildProgramGenerationContextFromProfile,
  classifyExerciseSafety,
  core100ExternalIdSet,
  isExerciseSafetyBlocked,
  resolveExercisePoolVersion,
  resolveTrainingStrategy,
  validateCore100Config,
} from "@/lib/platform/strategy-matrix";
import type { TrainingStrategyInput } from "@/lib/platform/strategy-matrix";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const authored = loadAuthoredV2Metadata();
const exercises = authored.map((row) => toV2Contract(row, "placeholder"));

function baseInput(overrides: Partial<TrainingStrategyInput> = {}): TrainingStrategyInput {
  return {
    userId: "user-1",
    rawGoalId: "glutes",
    assessedTrainingLevel: "INTERMEDIATE",
    trainingDaysPerWeek: 3,
    sessionDurationMinutes: 55,
    trainingEnvironment: "gym",
    injuryIds: ["none"],
    ...overrides,
  };
}

// --- Core 100 validation ---

const coreValidation = validateCore100Config(exercises);
assert(coreValidation.ok, `core list must validate: ${JSON.stringify(coreValidation)}`);
assertEqual(coreValidation.count, 100, "core list count");
assertEqual(new Set(coreValidation.externalIds).size, 100, "core list unique IDs");

assertEqual(
  resolveExercisePoolVersion(),
  EXERCISE_POOL_MAAKFIT_V1_CORE_100,
  "validated config activates V1 pool",
);

const poolVersion = resolveTrainingStrategy(baseInput());
assert(
  poolVersion.ok &&
    poolVersion.strategy.exercisePoolVersion === EXERCISE_POOL_MAAKFIT_V1_CORE_100,
  "strategy uses Core 100",
);

// --- Core 100 unit expectations ---

assertEqual(EXERCISE_POOL_MAAKFIT_V1_CORE_100, "MAAKFIT_V1_CORE_100", "pool version constant");

// --- Injury taxonomy ---

const kneeSafety = aggregateSafetyConstraints(["knee"]);
assert(kneeSafety.injuryIds.includes("knee"), "knee injury preserved");
assert(kneeSafety.blockedMovementRoles.includes("SQUAT"), "knee blocks squat");

const unknown = aggregateSafetyConstraints(["mystery_injury"]);
assert(unknown.unknownInjuryIds.includes("mystery_injury"), "unknown injury tracked");
assert(unknown.warnings.includes("UNKNOWN_INJURY_FAIL_CLOSED"), "unknown fail closed warning");

const none = aggregateSafetyConstraints(["none"]);
assertEqual(none.injuryIds.length, 0, "none filtered");

// --- Safety classification ---

const squat = exercises.find((row) => row.primary_movement_role === "SQUAT" && row.external_id.startsWith("LE-"));
assert(squat, "squat exercise exists");
if (squat) {
  const blocked = classifyExerciseSafety({
    exercise: squat,
    constraints: kneeSafety,
  });
  assertEqual(blocked, "BLOCKED", "knee blocks squat exercise");
}

const noInjury = aggregateSafetyConstraints([]);
if (squat) {
  assertEqual(
    classifyExerciseSafety({ exercise: squat, constraints: noInjury }),
    "ALLOWED",
    "no injury allows squat",
  );
}

// --- Eligibility pipeline ---

if (squat) {
  const safetyFail = explainEligibility({
    exercise: squat,
    injuryIds: ["knee"],
    trainingLevel: "BEGINNER",
  });
  assertEqual(safetyFail, "SAFETY_RESTRICTION", "eligibility safety rejection");
}

// --- Safety overrides locked exercise ---

const built = buildProgramGenerationContextFromProfile(baseInput({ injuryIds: ["knee"] }), { exercises });
assert(built.ok, "context builds with knee injury");
if (built.ok) {
  const coreIds = core100ExternalIdSet();
  assertEqual(built.context.exercises.length, 100, "generation context is restricted to Core 100");
  assert(
    built.context.exercises.every((exercise) => coreIds.has(exercise.external_id)),
    "generation context contains Core 100 IDs only",
  );
}
const lockedSquat = built.ok
  ? generateTrainingProgram({
      ...built.context,
      lockedExternalIds: squat ? [squat.external_id] : [],
    })
  : null;
assert(lockedSquat?.status === "COACH_OVERRIDE_CONFLICT", "locked safety-blocked exercise conflicts");

// --- Integration: injury excludes blocked patterns ---

const kneeProgram = built.ok ? generateTrainingProgram(built.context) : null;
assert(kneeProgram != null, "knee program attempt");
if (kneeProgram?.candidate && squat) {
  const pickedSquat = kneeProgram.candidate.sessions.some((session) =>
    session.exercises.some((item) => item.external_id === squat.external_id),
  );
  assert(!pickedSquat, "knee injury excludes squat-pattern selection when blocked");
}

// --- Integration: no injury unchanged path ---

const normalBuilt = buildProgramGenerationContextFromProfile(baseInput(), { exercises });
assert(normalBuilt.ok, "normal context");
const normalProgram = generateTrainingProgram(normalBuilt.context);
assert(
  normalProgram.status === "READY" || normalProgram.status === "PROGRAM_GENERATION_BLOCKED",
  "normal generation path runs",
);

// --- Determinism ---

const d1 = aggregateSafetyConstraints(["shoulder", "elbow"]);
const d2 = aggregateSafetyConstraints(["shoulder", "elbow"]);
assert(JSON.stringify(d1) === JSON.stringify(d2), "safety rules deterministic");

// --- Fail-closed goal unchanged ---

const blockedGoal = resolveTrainingStrategy(baseInput({ rawGoalId: "muscle" }));
assert(!blockedGoal.ok, "unmapped goal still fail-closed");

console.log("core-100-safety.test.ts: all tests passed");
