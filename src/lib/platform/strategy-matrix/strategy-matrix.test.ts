import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAuthoredV2Metadata, toV2Contract } from "@/lib/platform/exercise-library-v2-validator";
import { generateTrainingProgram } from "@/lib/platform/program-generation";
import { explainEligibility } from "@/lib/platform/prescription/eligibility";
import {
  MAAKFIT_TRAINING_STRATEGY_V1,
  STRATEGY_FALLBACK_SESSION_DURATION_MINUTES,
  buildProgramGenerationContextFromProfile,
  resolveStrategyGoal,
  resolveStrategySessionDuration,
  resolveStrategyTrainingLocation,
  resolveTrainingStrategy,
  toProgramGenerationContext,
} from "@/lib/platform/strategy-matrix";
import type { TrainingStrategyInput } from "@/lib/platform/strategy-matrix";

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

// --- Goal resolution ---

const mapped = resolveStrategyGoal({ rawGoalId: "glutes" });
assert(mapped.ok, "known legacy goal resolves");
assertEqual(mapped.ok ? mapped.canonicalGoal : null, "GLUTE_GROWTH", "glutes → GLUTE_GROWTH");

const canonical = resolveStrategyGoal({ rawGoalId: "FAT_LOSS" });
assert(canonical.ok, "canonical id accepted");
assertEqual(canonical.ok ? canonical.canonicalGoal : null, "FAT_LOSS", "canonical passthrough");

const unknown = resolveStrategyGoal({ rawGoalId: "muscle" });
assert(!unknown.ok, "male muscle goal fails closed");
assertEqual(unknown.ok ? null : unknown.reason, "UNMAPPED_LEGACY_GOAL", "unmapped reason");
assert(
  !unknown.ok && unknown.reason !== "MISSING_GOAL",
  "unknown is not treated as missing only",
);

const missing = resolveStrategyGoal({});
assert(!missing.ok, "missing goal fails");
assertEqual(missing.ok ? null : missing.reason, "MISSING_GOAL", "missing goal code");

// --- Level ---

const levelResolved = resolveTrainingStrategy(baseInput({ assessedTrainingLevel: "BEGINNER" }));
assert(levelResolved.ok, "strategy resolves with beginner");
assertEqual(levelResolved.ok ? levelResolved.strategy.trainingLevel : null, "BEGINNER", "level preserved");

const unassessed = resolveTrainingStrategy(baseInput({ assessedTrainingLevel: null }));
assert(unassessed.ok, "strategy resolves without assessed level");
assertEqual(
  unassessed.ok ? unassessed.strategy.trainingLevel : null,
  "UNASSESSED",
  "unavailable → UNASSESSED",
);

// --- Frequency ---

const freq = resolveTrainingStrategy(baseInput({ trainingDaysPerWeek: 4 }));
assert(freq.ok, "frequency resolves");
assertEqual(freq.ok ? freq.strategy.trainingDaysPerWeek : null, 4, "frequency preserved");

const freqCoach = resolveTrainingStrategy(baseInput(), { trainingDaysPerWeek: 5 });
assert(freqCoach.ok, "coach frequency override");
assertEqual(freqCoach.ok ? freqCoach.strategy.trainingDaysPerWeek : null, 5, "coach days");

const noFreq = resolveTrainingStrategy(baseInput({ trainingDaysPerWeek: null }));
assert(!noFreq.ok, "missing frequency blocks");
assertEqual(
  noFreq.ok ? null : noFreq.errors[0]?.code,
  "MISSING_TRAINING_FREQUENCY",
  "missing frequency code",
);

// --- Preferred days separate from frequency ---

const withDays = resolveTrainingStrategy(
  baseInput({ preferredTrainingDays: ["mon", "wed", "fri"] }),
);
assert(withDays.ok, "preferred days allowed");
assertEqual(
  withDays.ok ? withDays.strategy.preferredTrainingDays.join(",") : "",
  "mon,wed,fri",
  "preferred days preserved",
);
assertEqual(withDays.ok ? withDays.strategy.trainingDaysPerWeek : null, 3, "frequency unchanged");

// --- Duration ---

const duration = resolveStrategySessionDuration({ clientMinutes: 45 });
assert(duration.ok, "client duration ok");
assertEqual(duration.ok ? duration.sessionDurationMinutes : null, 45, "duration preserved");

const badDuration = resolveStrategySessionDuration({ clientMinutes: 0 });
assert(!badDuration.ok, "zero duration rejected");

const fallback = resolveStrategySessionDuration({});
assert(fallback.ok, "fallback duration");
assertEqual(
  fallback.ok ? fallback.sessionDurationMinutes : null,
  STRATEGY_FALLBACK_SESSION_DURATION_MINUTES,
  "fallback minutes",
);

// --- Location ---

const gym = resolveStrategyTrainingLocation({ trainingEnvironment: "gym" });
assert(gym.ok && gym.trainingLocation === "GYM", "gym resolves");

const home = resolveStrategyTrainingLocation({ trainingEnvironment: "home" });
assert(home.ok && home.trainingLocation === "HOME", "home resolves");

const both = resolveStrategyTrainingLocation({ trainingEnvironment: "anywhere" });
assert(both.ok && both.trainingLocation === "BOTH", "anywhere → BOTH");
assertEqual(
  both.ok ? both.permittedLocations.join(",") : "",
  "GYM,HOME",
  "BOTH permitted union",
);

// --- Equipment not inferred from location ---

const homeStrategy = resolveTrainingStrategy(
  baseInput({
    trainingEnvironment: "home",
    availableEquipment: ["DUMBBELL"],
  }),
);
assert(homeStrategy.ok, "home with equipment resolves");
assertEqual(
  homeStrategy.ok ? homeStrategy.strategy.availableEquipment?.[0] : null,
  "DUMBBELL",
  "equipment preserved",
);
assert(
  homeStrategy.ok && homeStrategy.strategy.equipmentSource === "CLIENT",
  "equipment source client",
);

// --- Injuries ---

const injuries = resolveTrainingStrategy(
  baseInput({ injuryIds: ["knee", "shoulder"] }),
);
assert(injuries.ok, "injuries do not block phase 1 resolution");
assertEqual(
  injuries.ok ? injuries.strategy.safety.injuryIds.join(",") : "",
  "knee,shoulder",
  "injuries preserved",
);
assert(
  injuries.ok && injuries.strategy.safety.blockedMovementRoles.includes("SQUAT"),
  "knee blocks squat role",
);
assert(
  injuries.ok && injuries.strategy.safety.blockedMovementRoles.includes("VERTICAL_PUSH"),
  "shoulder blocks vertical push",
);

// --- Determinism + version ---

const a = resolveTrainingStrategy(baseInput());
const b = resolveTrainingStrategy(baseInput());
assert(JSON.stringify(a) === JSON.stringify(b), "same input → same strategy");
assert(a.ok && a.strategy.strategyVersion === MAAKFIT_TRAINING_STRATEGY_V1, "strategy version");

// --- Integration: Profile → Context → Generator ---

const builtA = buildProgramGenerationContextFromProfile(baseInput(), { exercises });
assert(builtA.ok, "scenario A builds context");
assertEqual(builtA.ok ? builtA.context.goalId : null, "GLUTE_GROWTH", "context goal");
assertEqual(builtA.ok ? builtA.context.trainingLevel : null, "INTERMEDIATE", "context level");
const genA = generateTrainingProgram(builtA.ok ? builtA.context : ({} as never));
assert(genA.candidate != null, "scenario A generates candidate");

const builtB = buildProgramGenerationContextFromProfile(
  baseInput({
    trainingEnvironment: "home",
    availableEquipment: ["DUMBBELL"],
  }),
  { exercises },
);
assert(builtB.ok, "scenario B builds");
assertEqual(builtB.ok ? builtB.context.location : null, "HOME", "HOME in context");
assert(
  builtB.ok && builtB.context.availableEquipment?.includes("DUMBBELL"),
  "equipment in context",
);

const builtC = buildProgramGenerationContextFromProfile(
  baseInput({ trainingEnvironment: "anywhere" }),
  { exercises },
);
assert(builtC.ok, "scenario C builds");
assert(
  builtC.ok &&
    builtC.context.permittedLocations?.includes("GYM") &&
    builtC.context.permittedLocations?.includes("HOME"),
  "BOTH permitted locations on context",
);
const gymOnlyExercise = exercises.find(
  (row) =>
    row.location_compatibility.includes("GYM") && !row.location_compatibility.includes("HOME"),
);
if (gymOnlyExercise && builtC.ok) {
  const eligibleBoth = explainEligibility({
    exercise: gymOnlyExercise,
    permittedLocations: builtC.context.permittedLocations,
    location: builtC.context.location,
  });
  assert(eligibleBoth == null, "BOTH is union not intersection");
}

const builtD = buildProgramGenerationContextFromProfile(
  baseInput({ rawGoalId: "muscle" }),
  { exercises },
);
assert(!builtD.ok, "scenario D blocks unknown goal");
assert(
  !builtD.ok && builtD.resolution.errors.some((row) => row.code === "UNMAPPED_LEGACY_GOAL"),
  "no silent FAT_LOSS",
);
if (!builtD.ok) {
  assert(
    !JSON.stringify(builtD.resolution).includes("FAT_LOSS"),
    "failure path does not mention FAT_LOSS assignment",
  );
}

const builtE = buildProgramGenerationContextFromProfile(
  baseInput({ injuryIds: ["lower_back"] }),
  { exercises },
);
assert(builtE.ok, "scenario E builds with injury");
assert(
  builtE.ok && builtE.context.injuryIds?.includes("lower_back"),
  "injury reaches generator context boundary",
);

// --- BOTH eligibility unit ---

const homeOnly = exercises.find((row) => row.location_compatibility.join() === "HOME");
if (homeOnly) {
  assert(
    explainEligibility({
      exercise: homeOnly,
      permittedLocations: ["GYM", "HOME"],
      location: "GYM",
    }) == null,
    "home exercise allowed under BOTH union",
  );
}

// --- Static audit: admin must not silently FAT_LOSS ---

const adminWorkspace = readFileSync(
  join(process.cwd(), "src/components/admin/ClientTrainingWorkspace.tsx"),
  "utf8",
);
assert(
  adminWorkspace.includes("prepareTrainingProgramAssignment"),
  "admin uses assignment orchestrator",
);
assert(
  !adminWorkspace.includes('canonicalId ?? "FAT_LOSS"'),
  "admin removed silent FAT_LOSS fallback",
);
assert(!adminWorkspace.includes("mapLegacyGoalId"), "admin no longer maps goals inline");

console.log("strategy-matrix.test.ts: all assertions passed");
