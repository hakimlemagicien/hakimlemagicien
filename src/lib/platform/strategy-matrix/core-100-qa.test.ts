import {
  loadAuthoredV2Metadata,
  toV2Contract,
} from "@/lib/platform/exercise-library-v2-validator";
import { generateTrainingProgram } from "@/lib/platform/program-generation";
import { TRAINING_V2_CANONICAL_GOALS } from "@/lib/platform/training-v2-contracts";
import {
  CORE_100_EXTERNAL_IDS,
  EXERCISE_POOL_MAAKFIT_V1_CORE_100,
  buildProgramGenerationContextFromProfile,
  validateCore100Config,
} from "@/lib/platform/strategy-matrix";
import type {
  TrainingStrategyInput,
  TrainingStrategyLocation,
} from "@/lib/platform/strategy-matrix";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function countBy(values: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const value of values) result[value] = (result[value] ?? 0) + 1;
  return result;
}

function muscleFamily(primary: string): string {
  if (["LATS", "UPPER_BACK", "BACK", "TRAPEZIUS", "RHOMBOIDS"].includes(primary)) {
    return "BACK";
  }
  if (
    [
      "SHOULDERS",
      "ANTERIOR_DELTOID",
      "LATERAL_DELTOID",
      "POSTERIOR_DELTOID",
    ].includes(primary)
  ) {
    return "SHOULDERS";
  }
  if (["GLUTES", "GLUTEUS_MAXIMUS", "GLUTEUS_MEDIUS", "GLUTEUS_MINIMUS"].includes(primary)) {
    return "GLUTES";
  }
  if (["CORE", "RECTUS_ABDOMINIS", "OBLIQUES"].includes(primary)) return "CORE";
  return primary;
}

const REQUIRED_MOVEMENT_ROLES = [
  "HORIZONTAL_PUSH",
  "VERTICAL_PUSH",
  "HORIZONTAL_PULL",
  "VERTICAL_PULL",
  "SQUAT",
  "HINGE",
  "HIP_EXTENSION",
  "KNEE_FLEXION",
  "KNEE_EXTENSION",
  "ELBOW_FLEXION",
  "ELBOW_EXTENSION",
  "SHOULDER_ABDUCTION",
  "HIP_ABDUCTION",
  "CALF_RAISE",
  "TRUNK_FLEXION",
  "ANTI_EXTENSION",
  "ANTI_ROTATION",
  "LATERAL_STABILITY",
] as const;

const REQUIRED_MUSCLE_FAMILIES = [
  "CHEST",
  "BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "QUADRICEPS",
  "HAMSTRINGS",
  "GLUTES",
  "CALVES",
  "CORE",
] as const;

const REQUIRED_EQUIPMENT_COVERAGE: Record<string, number> = {
  NO_EQUIPMENT: 10,
  DUMBBELLS: 10,
  BARBELL: 8,
  CABLE_STATION: 5,
  MACHINE: 5,
  RESISTANCE_BAND: 3,
  PULL_UP_BAR: 2,
  KETTLEBELL: 1,
};

const HOME_V1_EQUIPMENT = [
  "DUMBBELLS",
  "RESISTANCE_BAND",
  "PULL_UP_BAR",
  "MAT",
  "KETTLEBELL",
  "BENCH",
];

const ENVIRONMENTS: Array<{
  id: TrainingStrategyLocation;
  trainingEnvironment: NonNullable<TrainingStrategyInput["trainingEnvironment"]>;
  availableEquipment: string[] | null;
}> = [
  { id: "HOME", trainingEnvironment: "home", availableEquipment: HOME_V1_EQUIPMENT },
  { id: "GYM", trainingEnvironment: "gym", availableEquipment: null },
  { id: "BOTH", trainingEnvironment: "anywhere", availableEquipment: null },
];

const authored = loadAuthoredV2Metadata();
const exercises = authored.map((row) => toV2Contract(row, "placeholder"));
const coreValidation = validateCore100Config(exercises);
assert(coreValidation.ok, `Core 100 validation failed: ${JSON.stringify(coreValidation)}`);

const coreIds = new Set(CORE_100_EXTERNAL_IDS as readonly string[]);
const coreExercises = exercises.filter((exercise) => coreIds.has(exercise.external_id));
assert(coreExercises.length === 100, `expected 100 Core exercises, got ${coreExercises.length}`);

const roleCoverage = countBy(
  coreExercises.map((exercise) => exercise.primary_movement_role ?? "NONE"),
);
const muscleCoverage = countBy(
  coreExercises.map((exercise) => muscleFamily(exercise.primary_muscles[0] ?? "NONE")),
);
const equipmentCoverage = countBy(
  coreExercises.flatMap((exercise) =>
    exercise.required_equipment.length ? exercise.required_equipment : ["NO_EQUIPMENT"],
  ),
);
const locationCoverage = countBy(
  coreExercises.flatMap((exercise) => exercise.location_compatibility),
);

for (const role of REQUIRED_MOVEMENT_ROLES) {
  const alternatives = coreExercises.filter(
    (exercise) => exercise.primary_movement_role === role,
  );
  assert(alternatives.length >= 2, `${role} needs at least two Core 100 alternatives`);
  assert(
    alternatives.some((exercise) => exercise.location_compatibility.includes("HOME")),
    `${role} needs a HOME-compatible alternative`,
  );
  assert(
    alternatives.some((exercise) => exercise.location_compatibility.includes("GYM")),
    `${role} needs a GYM-compatible alternative`,
  );
}

for (const muscle of REQUIRED_MUSCLE_FAMILIES) {
  assert(
    (muscleCoverage[muscle] ?? 0) >= 3,
    `${muscle} needs at least three primary-muscle Core exercises`,
  );
}

for (const [equipment, minimum] of Object.entries(REQUIRED_EQUIPMENT_COVERAGE)) {
  assert(
    (equipmentCoverage[equipment] ?? 0) >= minimum,
    `${equipment} coverage below ${minimum}`,
  );
}

assert((locationCoverage.HOME ?? 0) >= 40, "Core 100 needs at least 40 HOME-compatible exercises");
assert((locationCoverage.GYM ?? 0) === 100, "all Core 100 exercises must be usable at GYM");
assert((locationCoverage.NO_EQUIPMENT ?? 0) >= 10, "Core 100 needs no-equipment coverage");

const failures: string[] = [];
const selectedFrequency: Record<string, number> = {};
const matrixStatus: Record<string, number> = {};
const matrixByEnvironment: Record<string, number> = {};
const matrixByLevel: Record<string, number> = {};
const matrixByGoalAndDays: Record<string, number> = {};
const warningCodes: Record<string, number> = {};
let totalScenarios = 0;

for (const goal of TRAINING_V2_CANONICAL_GOALS) {
  for (const days of [2, 3, 4, 5] as const) {
    for (const environment of ENVIRONMENTS) {
      for (const trainingLevel of ["BEGINNER", "INTERMEDIATE"] as const) {
        totalScenarios += 1;
        const label = `${goal}/${days}d/${environment.id}/${trainingLevel}`;
        const built = buildProgramGenerationContextFromProfile(
          {
            userId: "core-100-qa",
            rawGoalId: goal,
            assessedTrainingLevel: trainingLevel,
            trainingDaysPerWeek: days,
            sessionDurationMinutes: 60,
            trainingEnvironment: environment.trainingEnvironment,
            availableEquipment: environment.availableEquipment,
            injuryIds: ["none"],
          },
          { exercises },
        );

        if (!built.ok) {
          failures.push(`${label}: context ${JSON.stringify(built.resolution.errors)}`);
          continue;
        }
        if (built.context.exercisePoolVersion !== EXERCISE_POOL_MAAKFIT_V1_CORE_100) {
          failures.push(`${label}: Core 100 pool not active`);
          continue;
        }

        const result = generateTrainingProgram(built.context);
        matrixStatus[result.validation.status] = (matrixStatus[result.validation.status] ?? 0) + 1;
        matrixByEnvironment[environment.id] = (matrixByEnvironment[environment.id] ?? 0) + 1;
        matrixByLevel[trainingLevel] = (matrixByLevel[trainingLevel] ?? 0) + 1;
        const goalDays = `${goal}/${days}d`;
        matrixByGoalAndDays[goalDays] = (matrixByGoalAndDays[goalDays] ?? 0) + 1;
        for (const warning of result.validation.warnings) {
          warningCodes[warning.code] = (warningCodes[warning.code] ?? 0) + 1;
        }

        if (result.status !== "READY" || result.validation.status === "INVALID" || !result.candidate) {
          failures.push(
            `${label}: ${result.status}/${result.validation.status} ${JSON.stringify(result.validation.errors)}`,
          );
          continue;
        }
        if (result.candidate.sessions.length !== days) {
          failures.push(`${label}: expected ${days} sessions, got ${result.candidate.sessions.length}`);
        }

        for (const session of result.candidate.sessions) {
          for (const exercise of session.exercises) {
            if (!coreIds.has(exercise.external_id)) {
              failures.push(`${label}: selected out-of-pool ${exercise.external_id}`);
            }
            selectedFrequency[exercise.external_id] =
              (selectedFrequency[exercise.external_id] ?? 0) + 1;
          }
        }
      }
    }
  }
}

assert(totalScenarios === 144, `expected 144 matrix scenarios, got ${totalScenarios}`);
assert(failures.length === 0, `Core 100 QA matrix failures:\n${failures.join("\n")}`);

console.log("core-100-qa.test.ts: all tests passed");
console.log(
  JSON.stringify(
    {
      validation: {
        count: coreValidation.count,
        unique: new Set(coreValidation.externalIds).size,
        approved_v2_eligible: coreValidation.externalIds.length,
        review_required: 0,
      },
      matrix: {
        total: totalScenarios,
        failures: failures.length,
        statuses: matrixStatus,
        by_environment: matrixByEnvironment,
        by_level: matrixByLevel,
        by_goal_and_days: matrixByGoalAndDays,
        warning_codes: warningCodes,
      },
      coverage: {
        movement_roles: roleCoverage,
        muscle_families: muscleCoverage,
        equipment: equipmentCoverage,
        locations: locationCoverage,
        substitution_gaps: [],
      },
      selected_frequency: Object.fromEntries(
        Object.entries(selectedFrequency).sort((left, right) => right[1] - left[1]),
      ),
    },
    null,
    2,
  ),
);
