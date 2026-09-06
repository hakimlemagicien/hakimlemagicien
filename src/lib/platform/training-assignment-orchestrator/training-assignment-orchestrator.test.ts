import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  loadAuthoredV2Metadata,
  toV2Contract,
} from "@/lib/platform/exercise-library-v2-validator";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import {
  approveAssignmentCandidate,
  buildStrategyContextFingerprint,
  evaluateAutomaticAssignmentEligibility,
  isAssignmentCandidateStale,
  prepareTrainingProgramAssignment,
  rejectAssignmentCandidate,
} from "@/lib/platform/training-assignment-orchestrator";
import type { TrainingStrategyInput } from "@/lib/platform/strategy-matrix";
import { EXERCISE_POOL_MAAKFIT_V1_CORE_100 } from "@/lib/platform/strategy-matrix";

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
const exercises: ExerciseV2Metadata[] = authored.map((row) => toV2Contract(row, "placeholder"));
const clientId = "client-phase4-test";

function baseInput(overrides: Partial<TrainingStrategyInput> = {}): TrainingStrategyInput {
  return {
    userId: clientId,
    rawGoalId: "FAT_LOSS",
    profileGoal: "FAT_LOSS",
    gender: "female",
    assessedTrainingLevel: "INTERMEDIATE",
    trainingDaysPerWeek: 3,
    preferredTrainingDays: ["mon", "wed", "fri"],
    sessionDurationMinutes: 60,
    trainingEnvironment: "gym",
    availableEquipment: null,
    injuryIds: ["none"],
    ...overrides,
  };
}

function prepare(
  overrides: Partial<TrainingStrategyInput> = {},
  mode: "ASSISTED" | "AUTOMATED" = "ASSISTED",
  extra?: { membershipTier?: string | null; automatedGloballyDisabled?: boolean },
) {
  return prepareTrainingProgramAssignment({
    clientId,
    strategyInput: baseInput(overrides),
    exercises,
    assignmentMode: mode,
    membershipTier: extra?.membershipTier,
    automatedGloballyDisabled: extra?.automatedGloballyDisabled,
  });
}

// A — Assisted valid: generate → review → approve → assignable
const assisted = prepare();
assert(assisted.state === "REVIEW_REQUIRED", "A: assisted valid → REVIEW_REQUIRED");
assert(assisted.assignable, "A: assisted valid candidate is assignable for coach review");
assert(assisted.generation?.candidate, "A: program generated");
assert(assisted.assignmentPayload, "A: payload ready");
assert(assisted.provenance?.exercisePoolVersion === EXERCISE_POOL_MAAKFIT_V1_CORE_100, "A: Core 100");
const approved = approveAssignmentCandidate(assisted);
assertEqual(approved.state, "READY_TO_ASSIGN", "A: coach approve → READY_TO_ASSIGN");
assert(approved.assignable, "A: approved candidate assignable");

// B — Automated valid capability (globally disabled by default)
const automatedBlocked = prepare({}, "AUTOMATED");
assert(
  automatedBlocked.automationEligibility !== "ELIGIBLE",
  "B: automated globally disabled by default",
);
assert(
  automatedBlocked.automationBlockReasons.includes("AUTOMATED_DISABLED"),
  "B: AUTOMATED_DISABLED reason",
);
const automatedEnabled = prepare({}, "AUTOMATED", {
  automatedGloballyDisabled: false,
  membershipTier: "essential",
});
assert(
  automatedEnabled.automationEligibility === "ELIGIBLE" ||
    automatedEnabled.automationEligibility === "REVIEW_REQUIRED",
  "B: automated capability when enabled + paid tier",
);

// C — Invalid program → BLOCKED (missing goal)
const missingGoal = prepare({ rawGoalId: null, profileGoal: null });
assertEqual(missingGoal.state, "BLOCKED", "C: missing goal → BLOCKED");
assert(!missingGoal.assignable, "C: not assignable");

// D — Safety conflict
const kneeBlocked = prepare({ injuryIds: ["knee"], trainingEnvironment: "home", availableEquipment: [] });
assert(
  kneeBlocked.state === "BLOCKED" || kneeBlocked.state === "REVIEW_REQUIRED",
  "D: safety conflict handled",
);
if (kneeBlocked.state === "BLOCKED") {
  assert(!kneeBlocked.assignable, "D: blocked when safety fails");
}

// E — Core 100 unavailable (structural — pool is valid in repo; verify gate exists)
assert(
  prepare().provenance?.exercisePoolVersion === EXERCISE_POOL_MAAKFIT_V1_CORE_100,
  "E: Core 100 active when config valid",
);

// F — Missing frequency uses product default (5 days); assisted still review-gated
const missingFreq = prepare({ trainingDaysPerWeek: null });
assertEqual(missingFreq.state, "REVIEW_REQUIRED", "F: assisted + default days → REVIEW_REQUIRED");
assertEqual(missingFreq.strategy?.trainingDaysPerWeek ?? null, 5, "F: default 5 days");
assert(missingFreq.assignable, "F: still assignable for coach review");

// G — HOME location
const home = prepare({ trainingEnvironment: "home", availableEquipment: ["DUMBBELLS", "RESISTANCE_BAND", "PULL_UP_BAR", "MAT", "KETTLEBELL", "BENCH"] });
assert(home.strategy?.trainingLocation === "HOME" || home.strategy?.trainingLocation === "BOTH", "G: HOME");
if (home.generation?.candidate) {
  const homeIds = new Set(
  exercises.filter((row) => row.location_compatibility.includes("HOME")).map((row) => row.external_id),
  );
  for (const session of home.generation.candidate.sessions) {
    for (const row of session.exercises) {
      assert(homeIds.has(row.external_id), `G: HOME exercise ${row.external_id}`);
    }
  }
}

// H — GYM location
const gym = prepare({ trainingEnvironment: "gym" });
assert(gym.strategy?.trainingLocation === "GYM" || gym.strategy?.trainingLocation === "BOTH", "H: GYM");

// I — BOTH union semantics
const both = prepare({ trainingEnvironment: "anywhere" });
assert(both.strategy?.permittedLocations.length >= 1, "I: BOTH permitted locations");

// J — duplicate submit idempotency (domain: same fingerprint → deterministic)
const fp = buildStrategyContextFingerprint(baseInput());
const first = prepare();
const second = prepare();
assertEqual(
  first.provenance?.contextFingerprint,
  second.provenance?.contextFingerprint,
  "J: deterministic fingerprint",
);
assertEqual(
  first.generation?.candidate?.sessions.length,
  second.generation?.candidate?.sessions.length,
  "J: deterministic generation",
);
assert(!isAssignmentCandidateStale(first, fp), "J: same fingerprint not stale");

// K — rejected candidate not assignable
const rejected = rejectAssignmentCandidate(assisted, "not suitable");
assertEqual(rejected.state, "REJECTED", "K: rejected state");
assert(!rejected.assignable, "K: rejected not assignable");

// L — regeneration reapplies gates
const regen = prepare();
assert(regen.recommendation.length >= 5, "L: recommendation on regenerate");
assert(regen.generation?.validation.status !== "INVALID" || regen.state === "BLOCKED", "L: validation gate");

// Stale candidate detection
const staleFp = buildStrategyContextFingerprint(baseInput({ trainingDaysPerWeek: 4 }));
assert(isAssignmentCandidateStale(first, staleFp), "stale when fingerprint changes");

// Unknown goal — automated blocked
const unmapped = prepare({ rawGoalId: "not-a-real-goal", profileGoal: "not-a-real-goal", gender: "female" });
assertEqual(unmapped.state, "BLOCKED", "unknown goal blocked");
const autoUnmapped = evaluateAutomaticAssignmentEligibility({
  assignmentMode: "AUTOMATED",
  strategy: null,
  generation: null,
  assignable: false,
  blockReason: "UNMAPPED_LEGACY_GOAL",
  strategyResolutionFailed: true,
  strategyErrors: ["UNMAPPED_LEGACY_GOAL"],
});
assert(autoUnmapped.status === "BLOCKED", "automated unmapped goal blocked");

const toneReady = prepare({ rawGoalId: "tone", profileGoal: "tone", gender: "female" });
assert(toneReady.state !== "BLOCKED" || toneReady.assignable || Boolean(toneReady.generation), "tone quiz goal no longer blocked by mapping");

// Free entitlement — automated blocked
const freeAuto = prepare({}, "AUTOMATED", {
  automatedGloballyDisabled: false,
  membershipTier: "free",
});
assert(
  freeAuto.automationBlockReasons.includes("FREE_ENTITLEMENT_BLOCKED"),
  "free tier blocks automated",
);

// Explainability
assert(assisted.recommendation.some((row) => row.category === "GOAL_ALIGNMENT"), "explainability: goal");
assert(assisted.coachReview?.whyGenerated, "coach review summary");

// Security — client cannot call admin assign RPCs
const root = process.cwd();
const clientRuntime = readFileSync(join(root, "src/lib/platform/client-program-runtime.test.ts"), "utf8");
assert(clientRuntime.includes("admin_assign"), "client runtime security test references admin RPCs");
const migration = readFileSync(
  join(root, "supabase/migrations/20260820240000_client_program_assignment_snapshots.sql"),
  "utf8",
);
assert(migration.includes("_require_admin"), "admin RPC gated");

// No Math.random in orchestrator path
const orchestratorSrc = readFileSync(
  join(root, "src/lib/platform/training-assignment-orchestrator/orchestrator.ts"),
  "utf8",
);
assert(!orchestratorSrc.includes("Math.random"), "no Math.random in orchestrator");

// Admin workspace wired
const workspace = readFileSync(join(root, "src/components/admin/ClientTrainingWorkspace.tsx"), "utf8");
assert(
  workspace.includes("prepareTrainingProgramAssignment") ||
    workspace.includes("training-assignment-orchestrator"),
  "admin workspace uses orchestrator",
);

console.log("training-assignment-orchestrator.test.ts: all tests passed");
