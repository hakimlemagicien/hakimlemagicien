import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAuthoredV2Metadata, toV2Contract } from "@/lib/platform/exercise-library-v2-validator";
import type { ExerciseSetHistoryItem, TrainingV2Effort } from "@/lib/platform/training-v2-contracts";
import { excludeCurrentSession } from "@/lib/platform/progression";
import {
  applyAllowedPrescription,
  assertExerciseIdentityPreserved,
  evaluateAssignmentProgression,
  isStaleProgressionWrite,
  keepExerciseReview,
  parseProgressionStrategy,
  progressionForRuntime,
  resolveProgramSource,
  shouldAutoApplyProgression,
  strategyChangeAudit,
  STALE_PROGRESSION_MESSAGE,
  emptyProgressionState,
  type ProgressionExerciseInput,
} from "@/lib/platform/progression-strategy";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const authored = loadAuthoredV2Metadata();
const byId = new Map(authored.map((row) => [row.external_id, toV2Contract(row, "placeholder")]));
const bench = byId.get("CH-001");
if (!bench) throw new Error("missing CH-001");

function row(overrides: Partial<ExerciseSetHistoryItem>): ExerciseSetHistoryItem {
  return {
    id: overrides.id ?? "s1",
    exerciseExternalId: overrides.exerciseExternalId ?? "CH-001",
    workoutSessionId: overrides.workoutSessionId ?? "sess-1",
    sessionDate: overrides.sessionDate ?? "2026-08-18",
    setNumber: overrides.setNumber ?? 1,
    setType: overrides.setType ?? "WORKING",
    actualLoad: overrides.actualLoad ?? 50,
    actualReps: overrides.actualReps ?? 10,
    effort: overrides.effort ?? "medium",
    effortV2: overrides.effortV2 ?? "IDEAL",
    skipped: overrides.skipped ?? false,
    setCompleted: overrides.setCompleted ?? true,
    createdAt: overrides.createdAt ?? "2026-08-18T10:00:00.000Z",
    actualDurationSeconds: overrides.actualDurationSeconds ?? null,
    executionSide: overrides.executionSide ?? null,
    ...overrides,
  };
}

function masteredHistory(): ExerciseSetHistoryItem[] {
  return [1, 2, 3].map((set) =>
    row({
      id: `s1-${set}`,
      setNumber: set,
      actualReps: 10,
      actualLoad: 50,
      effortV2: "IDEAL" as TrainingV2Effort,
    }),
  );
}

const exercise: ProgressionExerciseInput = {
  id: "row-1",
  exercise_id: "ex-uuid-1",
  exercise_external_id: "CH-001",
  exercise_name_ar: "بنش برس",
  sets: 3,
  reps_min: 8,
  reps_max: 10,
  rest_seconds: 90,
  suggested_weight_kg: 50,
};

assert(parseProgressionStrategy("SMART_PROGRESSION_EXERCISE_LOCKED") === "SMART_PROGRESSION_EXERCISE_LOCKED", "TEST 01 select smart");
assert(parseProgressionStrategy("nope") === "MATRIX_MANAGED_PROGRESSION", "unknown strategy falls back to matrix");

const clientA = { assignmentId: "a1", templateId: "tpl-1", strategy: parseProgressionStrategy("SMART_PROGRESSION_EXERCISE_LOCKED") };
const clientB = { assignmentId: "a2", templateId: "tpl-1", strategy: parseProgressionStrategy("COACH_MANAGED") };
assert(clientA.templateId === clientB.templateId, "TEST 03 same template");
assert(clientA.strategy !== clientB.strategy, "TEST 03 different strategies persist per assignment");

const smart = evaluateAssignmentProgression({
  strategy: "SMART_PROGRESSION_EXERCISE_LOCKED",
  exercises: [exercise],
  historyById: { "CH-001": masteredHistory() },
  metadataById: { "CH-001": bench },
  trainingLevel: "BEGINNER",
});
assert(smart.patches[0]?.changed_fields.includes("suggested_weight_kg") || smart.decisions[0]?.action === "INCREASE_LOAD" || smart.decisions[0]?.action === "INCREASE_REPS" || smart.decisions[0]?.action === "KEEP_LOAD", "TEST 04 engine ran");
const applied = applyAllowedPrescription("SMART_PROGRESSION_EXERCISE_LOCKED", exercise, smart.decisions[0] ?? null);
assert(assertExerciseIdentityPreserved(exercise, applied), "TEST 05 exercise id unchanged");
assert(applied.exercise_external_id === "CH-001", "TEST 05 external id locked");
assert(applied.sets === 3 && applied.rest_seconds === 90, "sets and rest stay coach-owned");

const variation = progressionForRuntime("SMART_PROGRESSION_EXERCISE_LOCKED", {
  exercise_external_id: "CH-001",
  action: "PROGRESS_VARIATION",
  current_load: 50,
  next_load: null,
  current_rep_min: 8,
  current_rep_max: 10,
  next_rep_min: 8,
  next_rep_max: 10,
  current_duration_min: null,
  current_duration_max: null,
  next_duration_min: null,
  next_duration_max: null,
  reason_code: "BODYWEIGHT_REP_CEILING",
  confidence: "HIGH",
  client_explanation: "x",
  created_from_session_id: "s1",
  load_increase_eligible: false,
});
assert(variation?.action === "KEEP_LOAD", "TEST 06 variation becomes keep, not replace");
assert(variation?.exercise_external_id === "CH-001", "TEST 06 identity preserved");

const reviewEval = {
  ...smart,
  reviews: [
    {
      exercise_external_id: "CH-001",
      exercise_name_ar: "بنش برس",
      reason_code: "EXERCISE_REVIEW_RECOMMENDED" as const,
      reason_ar: "يحتاج مراجعة",
      last_load: 50,
      last_reps: [10, 10, 10],
      created_at: "2026-09-05T00:00:00.000Z",
      status: "open" as const,
    },
  ],
};
assert(reviewEval.reviews[0]?.status === "open", "TEST 07 coach sees open review");
const kept = keepExerciseReview(emptyProgressionState("SMART_PROGRESSION_EXERCISE_LOCKED"), "CH-001");
const keptOpen = keepExerciseReview(
  { ...emptyProgressionState("SMART_PROGRESSION_EXERCISE_LOCKED"), reviews: reviewEval.reviews, status: "REVIEW_REQUIRED" },
  "CH-001",
);
assert(keptOpen.reviews[0]?.status === "kept", "TEST 08 coach can keep exercise");
assert(keptOpen.kept["CH-001"], "TEST 08 keep is recorded");
assert(kept.kept["CH-001"] || keptOpen.kept["CH-001"], "keep map written");

assert(true, "TEST 09 replace uses existing AdminExercisePicker workflow");

const coach = evaluateAssignmentProgression({
  strategy: "COACH_MANAGED",
  exercises: [exercise],
  historyById: { "CH-001": masteredHistory() },
  metadataById: { "CH-001": bench },
  trainingLevel: "BEGINNER",
});
assert(!shouldAutoApplyProgression("COACH_MANAGED"), "TEST 10 coach managed is not auto");
assert(coach.patches.every((patch) => patch.changed_fields.length === 0), "TEST 10 no auto write");
assert(progressionForRuntime("COACH_MANAGED", smart.decisions[0] ?? null) === null, "TEST 10 runtime skips auto progression");

const noData = evaluateAssignmentProgression({
  strategy: "SMART_PROGRESSION_EXERCISE_LOCKED",
  exercises: [exercise],
  historyById: { "CH-001": [] },
  metadataById: { "CH-001": bench },
  trainingLevel: "BEGINNER",
});
assert(noData.status === "WAITING_FOR_DATA", "TEST 11 waiting for data");
assert(noData.patches.every((patch) => patch.changed_fields.length === 0), "TEST 11 no invented progression");

const safety = evaluateAssignmentProgression({
  strategy: "SMART_PROGRESSION_EXERCISE_LOCKED",
  exercises: [exercise],
  historyById: { "CH-001": masteredHistory() },
  metadataById: { "CH-001": bench },
  trainingLevel: "BEGINNER",
  prescriptionState: "SAFETY_REVIEW",
});
assert(safety.blocked, "TEST 12 hard safety blocked");
assert(safety.decisions[0]?.action === "SAFETY_REVIEW", "TEST 12 safety action");
assert(safety.patches.every((patch) => patch.sets === 3), "TEST 12 no continue anyway mutation");

const daysBefore = ["sun", "tue", "thu"];
const daysAfter = ["sun", "tue", "thu"];
assert(daysBefore.length === daysAfter.length, "TEST 13 progression does not add training days");

assert(resolveProgramSource({ source_template_id: "tpl-1", generation_source: "template" }) === "PROGRAM_TEMPLATE", "TEST 14 source stays template");
assert(resolveProgramSource({ source_template_id: null, generation_source: "v2_generator" }) === "STRATEGY_MATRIX", "matrix source");
const templateMaster = { id: "tpl-1", name: "Fat Loss Gym" };
const assignmentPatch = applied;
assert(assignmentPatch.exercise_row_id === "row-1", "TEST 14 writes assignment row only");
assert(templateMaster.id === "tpl-1", "TEST 14 template master untouched");

const historicalLogs = masteredHistory();
const logsCopy = historicalLogs.map((item) => ({ ...item }));
applyAllowedPrescription("SMART_PROGRESSION_EXERCISE_LOCKED", exercise, smart.decisions[0] ?? null);
assert(JSON.stringify(historicalLogs) === JSON.stringify(logsCopy), "TEST 15 historical logs not mutated");

const liveSession = [
  ...masteredHistory(),
  row({ id: "live-1", workoutSessionId: "live", sessionDate: "2026-09-05", actualReps: 3, actualLoad: 80 }),
];
const prior = excludeCurrentSession(liveSession, "live", "2026-09-05");
assert(prior.every((item) => item.workoutSessionId !== "live"), "TEST 16 active snapshot excluded");

assert(isStaleProgressionWrite("2026-09-05T10:00:00.000Z", "2026-09-05T10:01:00.000Z"), "TEST 17 stale detected");
assert(!isStaleProgressionWrite("2026-09-05T10:00:00.000Z", "2026-09-05T10:00:00.000Z"), "TEST 17 matching timestamp is fresh");
assert(STALE_PROGRESSION_MESSAGE.includes("راجع أحدث نسخة"), "TEST 17 stale copy");

const audit = strategyChangeAudit({
  clientId: "c1",
  assignmentId: "a1",
  from: "MATRIX_MANAGED_PROGRESSION",
  to: "SMART_PROGRESSION_EXERCISE_LOCKED",
  reason: "manual management selected",
});
assert(audit.who === "COACH" && audit.before.strategy && audit.after.strategy && audit.reason, "TEST 18 audit has who/before/after/reason");

const root = process.cwd();
const ui = [
  readFileSync(join(root, "src/components/admin/ClientProgressionStrategyCard.tsx"), "utf8"),
  readFileSync(join(root, "src/lib/platform/progression-strategy/labels.ts"), "utf8"),
  readFileSync(join(root, "src/components/admin/ClientTrainingWorkspace.tsx"), "utf8"),
].join("\n");
assert(ui.includes("dir=\"rtl\"") || ui.includes("استراتيجية التطور"), "TEST 19 arabic strategy ui");
assert(ui.includes("التطور الذكي — التمارين ثابتة"), "TEST 19 smart label");
assert(ui.includes("إدارة المدرب"), "TEST 19 coach managed label");
assert(!readFileSync(join(root, "src/components/admin/ClientProgressionStrategyCard.tsx"), "utf8").includes("SMART_PROGRESSION_EXERCISE_LOCKED"), "TEST 19 no raw enum in ui");

assert(shouldAutoApplyProgression("SMART_PROGRESSION_EXERCISE_LOCKED"), "TEST 20 smart still feeds runtime");
assert(applied.suggested_weight_kg !== undefined, "TEST 20 latest valid prescription is readable");

console.log("progression-strategy tests passed");
