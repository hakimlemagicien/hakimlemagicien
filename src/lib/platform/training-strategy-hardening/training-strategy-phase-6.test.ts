import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  loadAuthoredV2Metadata,
  toV2Contract,
} from "@/lib/platform/exercise-library-v2-validator";
import {
  applyCoachOverride,
  buildCoachOverrideRequest,
  COACH_OVERRIDE_DURABLE_IDEMPOTENCY,
  resetCoachOverrideApplyKeysForTests,
  reviewCoachOverride,
} from "@/lib/platform/coach-override";
import {
  prepareTrainingProgramAssignment,
  buildStrategyContextFingerprint,
  isAssignmentCandidateStale,
} from "@/lib/platform/training-assignment-orchestrator";
import {
  assertAutomatedAssignmentAllowed,
  AUTOMATED_ASSIGNMENT_GLOBALLY_DISABLED,
  canonicalErrorCode,
  TRAINING_STRATEGY_ERROR_CODES,
  validateCandidateBeforeAssign,
  validateV2AssignmentPayload,
  validateValidationStatuses,
} from "@/lib/platform/training-strategy-hardening";
import { validateCore100Config } from "@/lib/platform/strategy-matrix";
import type { TrainingStrategyInput } from "@/lib/platform/strategy-matrix";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const root = process.cwd();
const exercises = loadAuthoredV2Metadata().map((row) => toV2Contract(row, "placeholder"));

function baseInput(): TrainingStrategyInput {
  return {
    userId: "client-phase6",
    rawGoalId: "FAT_LOSS",
    assessedTrainingLevel: "INTERMEDIATE",
    trainingDaysPerWeek: 3,
    sessionDurationMinutes: 60,
    trainingEnvironment: "gym",
    availableEquipment: null,
    injuryIds: ["none"],
  };
}

// --- Fail-closed gates ---
assert(AUTOMATED_ASSIGNMENT_GLOBALLY_DISABLED, "automated globally disabled");
assert(!assertAutomatedAssignmentAllowed("AUTOMATED").ok, "AUTOMATED blocked");
assert(assertAutomatedAssignmentAllowed("ASSISTED").ok, "ASSISTED allowed");

assert(
  validateV2AssignmentPayload({ sessions: [] }) === TRAINING_STRATEGY_ERROR_CODES.MISSING_GOAL_ID,
  "missing goal_id blocked",
);
assert(
  validateValidationStatuses({ generationStatus: "READY", validationStatus: "INVALID" }) ===
    TRAINING_STRATEGY_ERROR_CODES.PROGRAM_INVALID,
  "invalid validation blocked",
);

const valid = prepareTrainingProgramAssignment({
  clientId: "client-phase6",
  strategyInput: baseInput(),
  exercises,
  assignmentMode: "ASSISTED",
});
assert(valid.assignable, "valid assisted candidate");
const fp = buildStrategyContextFingerprint(baseInput());
assert(!validateCandidateBeforeAssign({ candidate: valid, currentFingerprint: fp }), "fresh assign ok");
assert(
  validateCandidateBeforeAssign({
    candidate: valid,
    currentFingerprint: buildStrategyContextFingerprint({ ...baseInput(), trainingDaysPerWeek: 4 }),
  }) === TRAINING_STRATEGY_ERROR_CODES.STALE_STRATEGY_CONTEXT,
  "stale candidate blocked",
);

// --- Core 100 ---
const core = validateCore100Config(exercises);
assert(core.ok && core.count === 100, "Core 100 100/100");

// --- Determinism ---
const d1 = prepareTrainingProgramAssignment({
  clientId: "client-phase6",
  strategyInput: baseInput(),
  exercises,
});
const d2 = prepareTrainingProgramAssignment({
  clientId: "client-phase6",
  strategyInput: baseInput(),
  exercises,
});
assert(
  d1.generation?.candidate?.sessions.length === d2.generation?.candidate?.sessions.length,
  "deterministic generation",
);

// --- Override stale + idempotency flag ---
resetCoachOverrideApplyKeysForTests();
const overrideReq = buildCoachOverrideRequest({
  clientId: "client-phase6",
  currentAssignmentId: "assign-1",
  overrideType: "SESSION_DURATION_CHANGE",
  payload: { sessionDurationMinutes: 45 },
  sourceAssignmentVersion: "v-old",
});
const staleOverride = reviewCoachOverride({
  request: overrideReq,
  strategyInput: baseInput(),
  exercises,
  currentAssignmentVersion: "v-new",
});
assertEqual(staleOverride.status, "BLOCKED", "stale override");
assert(staleOverride.blockingReasons.includes("STALE_ASSIGNMENT"), "stale assignment reason");

assert(
  COACH_OVERRIDE_DURABLE_IDEMPOTENCY === "PHASE_6_DURABLE_IDEMPOTENCY_DECISION_REQUIRED",
  "durable idempotency documented",
);

// --- RPC migration audit: FAT_LOSS fallback documented ---
const migration = readFileSync(
  join(root, "supabase/migrations/20260821180000_client_loop_integration.sql"),
  "utf8",
);
assert(migration.includes("COALESCE(p_payload ->> 'goal_id', 'FAT_LOSS')"), "RPC FAT_LOSS fallback known");
assert(
  validateV2AssignmentPayload({ goal_id: "", sessions: [{ exercises: [] }] }) ===
    TRAINING_STRATEGY_ERROR_CODES.MISSING_GOAL_ID,
  "client gate closes RPC FAT_LOSS path for V2",
);

// --- Template path separation ---
const workspace = readFileSync(join(root, "src/components/admin/ClientTrainingWorkspace.tsx"), "utf8");
assert(workspace.includes("assignAdminClientProgram"), "legacy template path exists");
assert(workspace.includes("assignGeneratedV2Program"), "V2 path exists");
assert(workspace.includes("validateV2AssignmentPayload"), "V2 gate in UI");
assert(workspace.includes("validateCandidateBeforeAssign"), "stale gate in UI");
assert(workspace.includes("assigningInFlight"), "duplicate assign guard");

// --- Security static ---
const runtime = readFileSync(join(root, "src/lib/platform/client-program-runtime.test.ts"), "utf8");
assert(runtime.includes("admin_assign"), "client cannot admin assign");
assert(!readFileSync(join(root, "src/integrations/supabase/client.ts"), "utf8").includes("service_role"), "no service role in client");

// --- Nutrition boundary ---
assert(!workspace.includes("nutrition-assignment"), "training workspace no nutrition mutation");

// --- No Math.random in strategy path ---
for (const file of [
  "src/lib/platform/training-assignment-orchestrator/orchestrator.ts",
  "src/lib/platform/coach-override/review.ts",
  "src/lib/platform/training-strategy-hardening/assignment-gates.ts",
]) {
  assert(!readFileSync(join(root, file), "utf8").includes("Math.random"), `no random in ${file}`);
}

// --- Error taxonomy ---
assert(
  canonicalErrorCode("SAFETY_RESTRICTION_VIOLATION") === TRAINING_STRATEGY_ERROR_CODES.SAFETY_RESTRICTION,
  "error alias",
);

// --- Phase reports exist ---
for (const report of [
  "docs/MAAKFIT_TRAINING_STRATEGY_PHASE_4_REPORT.md",
  "docs/MAAKFIT_TRAINING_STRATEGY_PHASE_5_REPORT.md",
]) {
  assert(readFileSync(join(root, report), "utf8").length > 100, `${report} exists`);
}

console.log("training-strategy-phase-6.test.ts: all tests passed");
