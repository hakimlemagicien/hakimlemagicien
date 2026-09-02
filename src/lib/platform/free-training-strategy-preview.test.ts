import { loadAuthoredV2Metadata, toV2Contract } from "@/lib/platform/exercise-library-v2-validator";
import {
  buildFreeStrategyPreviewWeekdayPlans,
  weekdayPlansFromProgramCandidate,
} from "@/lib/platform/free-training-strategy-preview";
import { generateTrainingProgram } from "@/lib/platform/program-generation";
import type { TrainingStrategyInput } from "@/lib/platform/strategy-matrix/types";
import { buildProgramGenerationContextFromProfile } from "@/lib/platform/strategy-matrix/build-from-profile";
import { countVisibleSessionExercises } from "@/lib/platform/training-preview-access";
import { FREE_ENTITLEMENTS } from "@/lib/platform/entitlements";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const exercises = loadAuthoredV2Metadata().map((row) => toV2Contract(row, "placeholder"));

function baseInput(overrides: Partial<TrainingStrategyInput> = {}): TrainingStrategyInput {
  return {
    userId: "preview-user",
    rawGoalId: "glutes",
    profileGoal: null,
    gender: "female",
    assessedTrainingLevel: "INTERMEDIATE",
    trainingDaysPerWeek: 3,
    sessionDurationMinutes: 60,
    trainingEnvironment: "gym",
    injuryIds: [],
    ...overrides,
  };
}

const plans = buildFreeStrategyPreviewWeekdayPlans(baseInput(), exercises);
assert(plans, "glute preview plans generated");

const workoutDays = Object.values(plans!).filter((plan) => !plan.isRestDay && plan.prescriptions.length > 0);
assert(workoutDays.length === 3, `expected 3 workout days, got ${workoutDays.length}`);
assert(
  workoutDays.some((plan) => plan.prescriptions.length >= 5),
  "at least one session should show strategy-sized prescription list",
);

const built = buildProgramGenerationContextFromProfile(baseInput({ rawGoalId: "fat" }), { exercises });
assert(built.ok, "fat loss strategy resolves");
const generated = generateTrainingProgram(built.context);
assert(generated.candidate, "fat loss candidate");
const fatPlans = weekdayPlansFromProgramCandidate(generated.candidate!, built.strategy);
const fatWorkout = Object.values(fatPlans).find((plan) => !plan.isRestDay && plan.prescriptions.length > 0);
assert(fatWorkout && fatWorkout.prescriptions.length >= 4, "fat loss preview shows multiple exercises");

const sampleCount = workoutDays[0]!.prescriptions.length;
assert(
  countVisibleSessionExercises(FREE_ENTITLEMENTS, sampleCount) === 1,
  "free entitlement still unlocks one exercise only",
);
assert(sampleCount - countVisibleSessionExercises(FREE_ENTITLEMENTS, sampleCount) >= 1, "remaining exercises stay locked");

console.log("free-training-strategy-preview tests passed");
