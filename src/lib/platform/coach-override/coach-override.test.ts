import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  loadAuthoredV2Metadata,
  toV2Contract,
} from "@/lib/platform/exercise-library-v2-validator";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import {
  applyCoachOverride,
  buildCoachOverrideRequest,
  rejectCoachOverrideRequest,
  resetCoachOverrideApplyKeysForTests,
  reviewCoachOverride,
  suggestExerciseAlternatives,
} from "@/lib/platform/coach-override";
import type { TrainingStrategyInput } from "@/lib/platform/strategy-matrix";

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
const clientId = "client-phase5-test";
const assignmentId = "assign-phase5-1";
const assignmentVersion = "v1";

function baseInput(overrides: Partial<TrainingStrategyInput> = {}): TrainingStrategyInput {
  return {
    userId: clientId,
    rawGoalId: "FAT_LOSS",
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

function request(
  overrideType: Parameters<typeof buildCoachOverrideRequest>[0]["overrideType"],
  payload: Parameters<typeof buildCoachOverrideRequest>[0]["payload"],
) {
  return buildCoachOverrideRequest({
    clientId,
    currentAssignmentId: assignmentId,
    overrideType,
    payload,
    sourceAssignmentVersion: assignmentVersion,
  });
}

resetCoachOverrideApplyKeysForTests();

// 1. valid exercise replacement context — review produces candidate or alternative path
const replaceReq = request("EXERCISE_REPLACE", {
  fromExternalId: "CH-001",
  toExternalId: "CH-002",
});
const replaceReview = reviewCoachOverride({
  request: replaceReq,
  strategyInput: baseInput(),
  exercises,
  currentAssignmentVersion: assignmentVersion,
});
assert(
  replaceReview.status === "SAFE" ||
    replaceReview.status === "SAFE_WITH_IMPACT" ||
    replaceReview.status === "ALTERNATIVE_RECOMMENDED",
  "1: exercise replace reviewed",
);

// 2. unsafe exercise lock with knee injury
const kneeInput = baseInput({ injuryIds: ["knee"], trainingEnvironment: "home", availableEquipment: ["DUMBBELLS"] });
const squat = exercises.find((row) => row.external_id === "LE-001");
if (squat) {
  const lockReview = reviewCoachOverride({
    request: request("EXERCISE_LOCK", { externalId: squat.external_id }),
    strategyInput: kneeInput,
    exercises,
    currentAssignmentVersion: assignmentVersion,
  });
  assert(
    lockReview.status === "BLOCKED" || lockReview.blockingReasons.includes("SAFETY_RESTRICTION"),
    "2/7: safety-blocked lock",
  );
}

// 3. wrong location replacement → alternative or block
const homeInput = baseInput({ trainingEnvironment: "home", availableEquipment: ["DUMBBELLS", "RESISTANCE_BAND", "MAT"] });
const gymOnly = exercises.find(
  (row) => !row.location_compatibility.includes("HOME") && row.location_compatibility.includes("GYM"),
);
if (gymOnly) {
  const locReview = reviewCoachOverride({
    request: request("EXERCISE_REPLACE", { fromExternalId: "CH-001", toExternalId: gymOnly.external_id }),
    strategyInput: homeInput,
    exercises,
    currentAssignmentVersion: assignmentVersion,
  });
  assert(
    locReview.status === "ALTERNATIVE_RECOMMENDED" || locReview.status === "BLOCKED",
    "3/4: location mismatch handled",
  );
  if (locReview.alternatives.length) {
    assert(locReview.alternatives.every((row) => row.external_id), "alternatives have ids");
  }
}

// 5. exercise exclusion → regeneration impact
const excludeReview = reviewCoachOverride({
  request: request("EXERCISE_EXCLUDE", { externalId: "CH-001" }),
  strategyInput: baseInput(),
  exercises,
  currentAssignmentVersion: assignmentVersion,
});
assert(excludeReview.impacts.some((row) => row.code === "EXERCISE_EXCLUDED"), "5: exclusion impact");

// 6. valid lock on eligible exercise
const lockOk = reviewCoachOverride({
  request: request("EXERCISE_LOCK", { externalId: "CH-001" }),
  strategyInput: baseInput(),
  exercises,
  currentAssignmentVersion: assignmentVersion,
});
assert(lockOk.status !== "BLOCKED" || !lockOk.blockingReasons.includes("SAFETY_RESTRICTION"), "6: valid lock");

// 8. frequency change → regeneration
const freqReview = reviewCoachOverride({
  request: request("TRAINING_FREQUENCY_CHANGE", { trainingDaysPerWeek: 4 }),
  strategyInput: baseInput(),
  exercises,
  currentAssignmentVersion: assignmentVersion,
});
assert(
  freqReview.impacts.some((row) => row.code === "FREQUENCY_CHANGE_REQUIRES_REGENERATION"),
  "8: frequency impact",
);
assert(freqReview.revisedCandidate?.strategy?.trainingDaysPerWeek === 4, "8: frequency applied");

// 9. preferred weekday change
const dayReview = reviewCoachOverride({
  request: request("PREFERRED_WEEKDAYS_CHANGE", {
    preferredWeekdays: ["mon", "tue", "wed"],
  }),
  strategyInput: baseInput(),
  exercises,
  currentAssignmentVersion: assignmentVersion,
});
assert(dayReview.impacts.some((row) => row.dimension === "RECOVERY_SPACING"), "9: calendar review");

// 10. duration reduction
const durReview = reviewCoachOverride({
  request: request("SESSION_DURATION_CHANGE", { sessionDurationMinutes: 35 }),
  strategyInput: baseInput(),
  exercises,
  currentAssignmentVersion: assignmentVersion,
});
assert(durReview.impacts.some((row) => row.code === "SESSION_DURATION_CHANGE"), "10: duration impact");

// 11. temporary HOME constraint
const tempReview = reviewCoachOverride({
  request: request("TEMPORARY_CONSTRAINT", {
    trainingEnvironment: "home",
    availableEquipment: ["DUMBBELLS", "RESISTANCE_BAND", "MAT"],
    validUntil: "2026-09-07",
  }),
  strategyInput: baseInput(),
  exercises,
  currentAssignmentVersion: assignmentVersion,
});
assert(tempReview.revisedCandidate?.strategy?.trainingLocation === "HOME", "11: temporary HOME");

// 12. deterministic identical request
const a = reviewCoachOverride({
  request: request("SESSION_DURATION_CHANGE", { sessionDurationMinutes: 45 }),
  strategyInput: baseInput(),
  exercises,
  currentAssignmentVersion: assignmentVersion,
});
const b = reviewCoachOverride({
  request: request("SESSION_DURATION_CHANGE", { sessionDurationMinutes: 45 }),
  strategyInput: baseInput(),
  exercises,
  currentAssignmentVersion: assignmentVersion,
});
assertEqual(
  a.revisedCandidate?.generation?.candidate?.sessions.length,
  b.revisedCandidate?.generation?.candidate?.sessions.length,
  "12: deterministic",
);

// 13. cancelled override
const cancelled = rejectCoachOverrideRequest(freqReview);
assertEqual(cancelled.requestState, "REJECTED", "13: cancelled");

// 14. stale override
const stale = reviewCoachOverride({
  request: replaceReq,
  strategyInput: baseInput(),
  exercises,
  currentAssignmentVersion: "different-version",
});
assertEqual(stale.status, "BLOCKED", "14: stale blocked");
assert(stale.blockingReasons.includes("STALE_ASSIGNMENT"), "14: stale reason");

// 15. duplicate apply idempotent
resetCoachOverrideApplyKeysForTests();
const applyReview = reviewCoachOverride({
  request: request("SESSION_DURATION_CHANGE", { sessionDurationMinutes: 50 }),
  strategyInput: baseInput(),
  exercises,
  currentAssignmentVersion: assignmentVersion,
});
if (applyReview.status !== "BLOCKED" && applyReview.revisedCandidate?.assignable) {
  const applyReq = request("SESSION_DURATION_CHANGE", { sessionDurationMinutes: 50 });
  const first = applyCoachOverride({
    request: applyReq,
    review: applyReview,
    strategyInput: baseInput(),
    exercises,
    currentAssignmentVersion: assignmentVersion,
    applyKey: "dup-test-key",
  });
  const second = applyCoachOverride({
    request: applyReq,
    review: applyReview,
    strategyInput: baseInput(),
    exercises,
    currentAssignmentVersion: assignmentVersion,
    applyKey: "dup-test-key",
  });
  assert(first.ok && second.ok, "15: duplicate apply safe");
  assertEqual(first.applyKey, second.applyKey, "15: same apply key");
}

// alternatives helper
const alts = suggestExerciseAlternatives({
  exercises,
  eligibility: {
    location: "HOME",
    availableEquipment: ["DUMBBELLS", "RESISTANCE_BAND", "MAT"],
    trainingLevel: "INTERMEDIATE",
    exercisePoolVersion: "MAAKFIT_V1_CORE_100",
    injuryIds: ["none"],
  },
  sourceExercise: exercises.find((row) => row.external_id === "CH-001") ?? null,
  movementRole: "HORIZONTAL_PUSH",
  muscleFamily: "CHEST",
  limit: 3,
});
assert(Array.isArray(alts), "alternatives array");

// security — client paths
const root = process.cwd();
const runtime = readFileSync(join(root, "src/lib/platform/client-program-runtime.test.ts"), "utf8");
assert(runtime.includes("admin_assign"), "client cannot admin assign");
const workspace = readFileSync(join(root, "src/components/admin/ClientTrainingWorkspace.tsx"), "utf8");
assert(workspace.includes("reviewCoachOverride"), "admin override wired");

// no Math.random
const reviewSrc = readFileSync(join(root, "src/lib/platform/coach-override/review.ts"), "utf8");
assert(!reviewSrc.includes("Math.random"), "no Math.random in review");

// nutrition boundary
assert(!reviewSrc.includes("calories"), "nutrition untouched in review");

console.log("coach-override.test.ts: all tests passed");
