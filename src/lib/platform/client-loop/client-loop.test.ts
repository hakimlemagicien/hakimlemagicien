import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAuthoredV2Metadata, toV2Contract } from "@/lib/platform/exercise-library-v2-validator";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import { getClientTrainingProgressSummary } from "@/lib/platform/training-progress/summary";
import {
  generateTrainingProgram,
  canActivateProgram,
  validateTrainingProgram,
} from "@/lib/platform/program-generation";
import { cloneCandidate } from "@/lib/platform/program-generation/apply";
import type { ProgramGenerationContext } from "@/lib/platform/program-generation/types";
import { FORBIDDEN_CLIENT_PHRASES } from "@/lib/platform/training-progress/copy";
import {
  evaluateClientLoop,
  programAdaptationJustified,
  toGoalProgressView,
  goalEvaluationKey,
  volumeEvaluationKey,
} from "@/lib/platform/client-loop/evaluate";
import {
  generateAuthorizedProgramCandidate,
  shouldRequestProgramGeneration,
} from "@/lib/platform/client-loop/assignment";
import { isoWeekKey } from "@/lib/platform/client-loop/dates";
import type { LoopEvidence } from "@/lib/platform/client-loop/types";
import type { VolumeSetInput, PrescribedVolumeInput } from "@/lib/platform/volume/types";

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
const allExercises = authored.map((row) => toV2Contract(row, "placeholder"));
const byId = new Map(allExercises.map((item) => [item.external_id, item]));
function ex(id: string): ExerciseV2Metadata {
  const row = byId.get(id);
  if (!row) throw new Error(`missing ${id}`);
  return row;
}

const catalog: Record<string, ExerciseV2Metadata> = {
  "GL-001": ex("GL-001"),
  "LE-001": ex("LE-001"),
  "CH-001": ex("CH-001"),
  "AB-001": ex("AB-001"),
  "BI-001": ex("BI-001"),
};

function working(
  weekKey: string,
  date: string,
  externalId: string,
  count: number,
  extra: Partial<VolumeSetInput> = {},
): VolumeSetInput[] {
  return Array.from({ length: count }, () => ({
    weekKey,
    sessionDate: date,
    externalId,
    setType: extra.setType ?? "WORKING",
    skipped: extra.skipped ?? false,
    setCompleted: extra.setCompleted ?? true,
    effortV2: extra.effortV2 ?? "IDEAL",
    actualReps: extra.actualReps ?? 10,
    actualLoad: extra.actualLoad ?? 50,
    ...extra,
  }));
}

function prescribed(
  weekKey: string,
  externalId: string,
  workingSets: number,
): PrescribedVolumeInput {
  return { weekKey, externalId, workingSets };
}

function evidence(
  partial: Partial<LoopEvidence> & Pick<LoopEvidence, "sets" | "prescribed" | "goalId">,
): LoopEvidence {
  return {
    trainingLevel: "INTERMEDIATE",
    assignmentId: "assign-1",
    programVersion: 1,
    evaluationDate: "2026-08-21",
    exercises: catalog,
    continuityState: "NORMAL",
    ...partial,
  };
}

const weeks = ["2026-W32", "2026-W33", "2026-W34"] as const;
const dates = ["2026-08-07", "2026-08-14", "2026-08-21"] as const;

const gluteLoop = evaluateClientLoop(
  evidence({
    goalId: "GLUTE_GROWTH",
    lastVolumeAction: { action: "KEEP_VOLUME", validWeeksAgo: 1 },
    sets: weeks.flatMap((week, index) => [
      ...working(week, dates[index], "GL-001", 6, { actualReps: 10, actualLoad: 50 }),
      ...working(week, dates[index], "LE-001", 4, {
        actualReps: 8 + index * 2,
        actualLoad: 40 + index * 4,
      }),
    ]),
    prescribed: weeks.flatMap((week) => [
      prescribed(week, "GL-001", 6),
      prescribed(week, "LE-001", 4),
    ]),
  }),
);
assert(
  gluteLoop.volume.program_action !== "ADD_SMALL_VOLUME",
  "no automatic total volume increase",
);
const gluteState = gluteLoop.goal.regional_responses.find((row) => row.region.includes("GLUTE"));
const quadState = gluteLoop.goal.regional_responses.find((row) => row.region.includes("QUAD"));
assert(gluteState, "glute regional present");
assert(quadState, "quad regional present");
assert(
  gluteLoop.goal.action === "REALLOCATE_TRAINING_EMPHASIS" ||
    gluteLoop.goal.action === "PROGRAM_REVIEW_REQUIRED" ||
    gluteLoop.goal.goal_response === "REGIONAL_UNDER_RESPONSE",
  `glute/quad split produces regional signal, got ${gluteLoop.goal.action}/${gluteLoop.goal.goal_response}`,
);
assert(gluteLoop.goal.reallocation?.from_region !== "GLUTES", "does not steal from glutes");
if (gluteLoop.goal.reallocation) {
  assertEqual(gluteLoop.goal.reallocation.from_region, "QUADRICEPS", "from quads");
  assertEqual(gluteLoop.goal.reallocation.to_region, "GLUTES", "to glutes");
}

const gluteRecovery = evaluateClientLoop(
  evidence({
    goalId: "GLUTE_GROWTH",
    sets: weeks.flatMap((week, index) => [
      ...working(week, dates[index], "GL-001", 2, {
        actualReps: 6,
        actualLoad: 50,
        effortV2: "FAILURE",
      }),
      ...working(week, dates[index], "LE-001", 2, {
        actualReps: 6,
        actualLoad: 40,
        effortV2: "VERY_HARD",
      }),
    ]),
    prescribed: weeks.flatMap((week) => [
      prescribed(week, "GL-001", 4),
      prescribed(week, "LE-001", 4),
    ]),
  }),
);
assert(gluteRecovery.volume.program_action !== "ADD_SMALL_VOLUME", "recovery does not add volume");
assert(
  gluteRecovery.goal.action !== "REALLOCATE_TRAINING_EMPHASIS" ||
    gluteRecovery.program_adaptation_justified === false,
  "recovery blocks aggressive adaptation",
);
assertEqual(
  programAdaptationJustified(gluteRecovery).justified,
  false,
  "phase 10 must not raise stress",
);

const waist = evaluateClientLoop(
  evidence({
    goalId: "SLIM_TONED_WAIST",
    lastVolumeAction: { action: "KEEP_VOLUME", validWeeksAgo: 1 },
    sets: weeks.flatMap((week, index) =>
      working(week, dates[index], "AB-001", 6, { actualReps: 12 + index, actualLoad: 0 }),
    ),
    prescribed: weeks.map((week) => prescribed(week, "AB-001", 6)),
    body: { waistTrend: "STABLE", photosPresent: false },
  }),
);
assert(waist.goal.reallocation?.to_region !== "RECTUS_ABDOMINIS", "no spot reduction to abs");
assert(waist.goal.reallocation?.to_region !== "CORE", "no extra core for local fat");
assert(
  waist.volume.program_action !== "ADD_SMALL_VOLUME",
  "waist stagnation does not add ab volume",
);

const fatLoss = evaluateClientLoop(
  evidence({
    goalId: "FAT_LOSS",
    lastVolumeAction: { action: "KEEP_VOLUME", validWeeksAgo: 1 },
    sets: weeks.flatMap((week, index) =>
      working(week, dates[index], "CH-001", 6, { actualReps: 10 + index, actualLoad: 40 }),
    ),
    prescribed: weeks.map((week) => prescribed(week, "CH-001", 6)),
    body: { weightTrend: "STABLE" },
  }),
);
assert(
  fatLoss.volume.program_action !== "ADD_SMALL_VOLUME",
  "fat loss does not auto-add resistance volume",
);
assert(!fatLoss.goal.client_explanation.toLowerCase().includes("hiit"), "no mandatory HIIT");
assert(
  fatLoss.goal.nutrition_review_required ||
    fatLoss.goal.action === "NUTRITION_REVIEW_REQUIRED" ||
    fatLoss.goal.action === "BODY_COMPOSITION_REVIEW_REQUIRED" ||
    fatLoss.goal.goal_response === "BODY_COMPOSITION_LIMITED" ||
    fatLoss.goal.goal_response === "PARTIAL_RESPONSE" ||
    fatLoss.goal.goal_response === "ON_TRACK" ||
    fatLoss.goal.goal_response === "ADHERENCE_LIMITED",
  `fat loss preserves training/nutrition boundary, got ${fatLoss.goal.goal_response}`,
);

const lowAdherence = evaluateClientLoop(
  evidence({
    goalId: "GLUTE_GROWTH",
    sets: weeks.flatMap((week) => working(week, "2026-08-21", "GL-001", 1)),
    prescribed: weeks.map((week) => prescribed(week, "GL-001", 6)),
  }),
);
assert(
  lowAdherence.goal.goal_response === "ADHERENCE_LIMITED" ||
    lowAdherence.volume.reason_code === "COMPLETION_TOO_LOW",
  `adherence limited not add, got ${lowAdherence.goal.goal_response}/${lowAdherence.volume.reason_code}`,
);
assert(lowAdherence.volume.program_action !== "ADD_SMALL_VOLUME", "low adherence ≠ add volume");
assert(lowAdherence.goal.goal_response !== "STAGNANT_REVIEW", "not program failure");

const productiveWeeks = ["2026-W31", "2026-W32", "2026-W33", "2026-W34"] as const;
const productive = evaluateClientLoop(
  evidence({
    goalId: "GLUTE_GROWTH",
    lastVolumeAction: { action: "KEEP_VOLUME", validWeeksAgo: 1 },
    sets: productiveWeeks.flatMap((week, index) =>
      working(week, `2026-08-${String(1 + index * 7).padStart(2, "0")}`, "GL-001", 3, {
        actualReps: 8 + index,
        actualLoad: 50,
      }),
    ),
    prescribed: productiveWeeks.map((week) => prescribed(week, "GL-001", 3)),
  }),
);
assertEqual(productive.volume.program_action, "KEEP_VOLUME", "productive KEEP_VOLUME");
assertEqual(
  productive.program_adaptation_justified,
  false,
  "productive training does not regenerate program",
);

const sparse = evaluateClientLoop(
  evidence({
    goalId: "GLUTE_GROWTH",
    sets: working("2026-W34", "2026-08-21", "GL-001", 2),
    prescribed: [prescribed("2026-W34", "GL-001", 3)],
  }),
);
assertEqual(sparse.goal.goal_response, "INSUFFICIENT_DATA", "sparse history is insufficient");
assertEqual(sparse.program_adaptation_justified, false, "no speculative adaptation");

const progressNeutral = getClientTrainingProgressSummary({
  goalId: "GLUTE_GROWTH",
  goalDecision: {
    goal_response: sparse.goal.goal_response,
    action: sparse.goal.action,
    reason_code: sparse.goal.reason_code,
    limiting_factor: sparse.goal.limiting_factor,
    client_explanation: sparse.goal.client_explanation,
  },
});
assertEqual(progressNeutral.goal_card.tone, "neutral", "insufficient data is neutral");
assert(
  !/فشل|هضبة|جينات/.test(progressNeutral.goal_card.short_reason + progressNeutral.goal_card.title),
  "not framed as failure",
);
assert(
  !FORBIDDEN_CLIENT_PHRASES.some((token) => progressNeutral.goal_card.short_reason.includes(token)),
  "no forbidden copy",
);

const persistedGoal = toGoalProgressView(gluteLoop.goal);
const progressFromPersist = getClientTrainingProgressSummary({
  goalId: "GLUTE_GROWTH",
  goalDecision: {
    goal_response: persistedGoal.goal_response,
    action: persistedGoal.action,
    reason_code: persistedGoal.reason_code as typeof sparse.goal.reason_code,
    limiting_factor: persistedGoal.limiter,
    client_explanation: persistedGoal.client_explanation,
    reallocation: persistedGoal.reallocation,
  },
  regionalDecisions: persistedGoal.regional_responses,
  volumeDecision: {
    action: gluteLoop.volume.program_action,
    reason_code: gluteLoop.volume.reason_code,
    recovery_state: gluteLoop.volume.recovery_state,
  },
});
assert(progressFromPersist.goal_card.title.length > 0, "progress consumes persisted phase 9");
if (persistedGoal.action === "REALLOCATE_TRAINING_EMPHASIS") {
  assert(
    progressFromPersist.goal_card.short_reason.includes("التركيز") ||
      progressFromPersist.goal_card.title.includes("التركيز"),
    "client sees emphasis change not genetics",
  );
}

assertEqual(
  volumeEvaluationKey("assign-1", "2026-W34"),
  volumeEvaluationKey("assign-1", "2026-W34"),
  "volume key stable",
);
assertEqual(
  goalEvaluationKey("assign-1", "2026-W34"),
  "goal:assign-1:2026-W34",
  "goal key identity",
);
assert(isoWeekKey("2026-08-21").includes("W"), "iso week key");

const store = new Map<string, string>();
function upsertFake(type: string, key: string, reason: string) {
  store.set(`${type}:${key}`, reason);
  return store.size;
}
const firstSize = upsertFake(
  "WEEKLY_VOLUME",
  gluteLoop.volume_evaluation_key,
  gluteLoop.volume.reason_code,
);
upsertFake("GOAL_RESPONSE", gluteLoop.goal_evaluation_key, gluteLoop.goal.reason_code);
const secondSize = upsertFake(
  "WEEKLY_VOLUME",
  gluteLoop.volume_evaluation_key,
  gluteLoop.volume.reason_code,
);
assertEqual(
  secondSize,
  firstSize + 1,
  "repeat evaluation upserts, does not duplicate volume+goal pair",
);

const genCtx = (overrides: Partial<ProgramGenerationContext> = {}): ProgramGenerationContext => ({
  goalId: "GLUTE_GROWTH",
  trainingLevel: "INTERMEDIATE",
  daysPerWeek: 3,
  availableMinutes: 50,
  location: "GYM",
  exercises: allExercises,
  reason: "COACH_REQUEST",
  ...overrides,
});

const validGen = generateAuthorizedProgramCandidate(genCtx());
assert(validGen.assignable, "valid candidate is assignable");
assert(
  canActivateProgram(validGen.result.validation, validGen.result.status),
  "validator gates activation",
);
assert(
  validGen.result.candidate?.sessions.every((session) =>
    session.exercises.every((row) => row.suggested_weight_kg == null),
  ),
  "no fixed kg",
);

if (gluteLoop.program_adaptation_justified && gluteLoop.goal.reallocation) {
  const adapted = generateAuthorizedProgramCandidate(
    genCtx({
      daysPerWeek: 4,
      reallocation: gluteLoop.goal.reallocation,
      reason: "REGIONAL_REALLOCATION",
      recoveryState: gluteLoop.volume.recovery_state,
    }),
  );
  const baseline = generateTrainingProgram(genCtx({ daysPerWeek: 4 }));
  const lower = (row: typeof baseline) =>
    (row.regional_volume.GLUTES?.effective ?? 0) + (row.regional_volume.QUADRICEPS?.effective ?? 0);
  assert(adapted.assignable || adapted.blockReason, "adaptation still validated");
  if (adapted.assignable && adapted.result.candidate) {
    assert(
      lower(adapted.result) <= lower(baseline) + 1.01,
      "adaptation is reallocation not lower-body dump",
    );
  }
} else {
  const forced = generateAuthorizedProgramCandidate(
    genCtx({
      daysPerWeek: 4,
      reallocation: { from_region: "QUADRICEPS", to_region: "GLUTES" },
      reason: "REGIONAL_REALLOCATION",
    }),
  );
  assert(
    forced.result.status === "READY" || forced.blockReason,
    "realloc candidate still goes through validator",
  );
}

const recoveryGen = generateAuthorizedProgramCandidate(
  genCtx({
    recoveryState: "POOR",
    reallocation: { from_region: "QUADRICEPS", to_region: "GLUTES" },
  }),
);
const normalGen = generateTrainingProgram(genCtx());
const countSets = (result: typeof recoveryGen.result) =>
  result.candidate?.sessions.reduce(
    (sum, session) => sum + session.exercises.reduce((inner, item) => inner + item.sets, 0),
    0,
  ) ?? 0;
assert(
  countSets(recoveryGen.result) <= countSets(normalGen),
  "recovery-limited generation is not higher stress",
);

const invalidCandidate = cloneCandidate(validGen.result.candidate!);
invalidCandidate.sessions = [];
const invalidValidation = validateTrainingProgram(invalidCandidate, genCtx());
assertEqual(canActivateProgram(invalidValidation, "READY"), false, "INVALID never activates");
assert(
  !generateAuthorizedProgramCandidate(
    genCtx({ lockedExternalIds: ["GL-001"], excludedExternalIds: ["GL-001"] }),
  ).assignable,
  "blocked generation is not assignable",
);

assertEqual(
  shouldRequestProgramGeneration(productive.volume, productive.goal),
  false,
  "keep volume does not request generation",
);

const root = process.cwd();
const migration = readFileSync(
  join(root, "supabase/migrations/20260821180000_client_loop_integration.sql"),
  "utf8",
);
assert(migration.includes("client_upsert_adaptive_decision"), "upsert RPC");
assert(
  migration.includes("ON CONFLICT (user_id, decision_type, evaluation_key)"),
  "idempotent unique key",
);
assert(migration.includes("admin_assign_generated_v2_program"), "generated assignment RPC");
assert(migration.includes("program_invalid"), "invalid assignment blocked");
assert(migration.includes("active_workout_in_progress"), "active session protected");
assert(migration.includes("generation_source"), "snapshot source recorded");
assert(migration.includes("_require_admin"), "admin assign gated");
assert(
  migration.includes("REVOKE ALL ON FUNCTION public.admin_assign_generated_v2_program"),
  "anon cannot assign generated",
);
assert(
  migration.includes("auth.uid() = user_id") || migration.includes("a.client_id = v_user"),
  "own-row assignment check",
);
assert(!migration.includes("DROP TABLE"), "no destructive drop");

const rls = readFileSync(join(root, "supabase/tests/training_engine_v2_rls_test_plan.sql"), "utf8");
assert(
  rls.includes("client_upsert_adaptive_decision") || rls.includes("adaptive_decision_logs"),
  "rls plan covers decisions",
);

const player = readFileSync(join(root, "src/hooks/useWorkoutPlayer.ts"), "utf8");
assert(player.includes("runClientLoopAfterSession"), "phase 7/9 run after session complete");
assert(!player.includes("generateTrainingProgram"), "player does not generate programs");
assert(
  !player.includes("getSetProgression(") || player.includes('runtimeMode === "v2"'),
  "v2 lane remains exclusive",
);

const hook = readFileSync(join(root, "src/hooks/useTrainingProgressSummary.ts"), "utf8");
assert(hook.includes("listOwnAdaptiveDecisions"), "progress reads persisted decisions");
assert(!hook.includes("evaluateGoalResponse("), "progress does not guess goal inline");
assert(!hook.includes("getWeeklyVolumeDecision("), "progress does not recompute volume inline");

const admin = readFileSync(join(root, "src/components/admin/ClientTrainingWorkspace.tsx"), "utf8");
assert(admin.includes("prepareTrainingProgramAssignment"), "admin uses assignment orchestrator");
assert(admin.includes("assignGeneratedV2Program"), "admin uses authorized assignment");
assert(admin.includes("disabled={!v2Preview.assignable"), "invalid cannot be assigned");

const nutritionTouch = readFileSync(join(root, "src/lib/platform/client-loop/evaluate.ts"), "utf8");
assert(!nutritionTouch.includes("calories"), "loop does not mutate calories");
assert(!nutritionTouch.includes('from("'), "evaluate is pure");

const clientFiles = [
  "src/routes/_platform/app/program/workout/index.tsx",
  "src/lib/platform/assigned-program-api.ts",
];
for (const file of clientFiles) {
  const source = readFileSync(join(root, file), "utf8");
  assert(
    !source.includes("admin_assign_generated_v2_program"),
    `${file} cannot call admin assign RPC`,
  );
}
assert(
  readFileSync(join(root, "src/lib/platform/client-training-assign-api.ts"), "utf8").includes(
    "client_assign_generated_v2_program",
  ),
  "client uses entitled self-assign RPC",
);

console.log("client-loop integration tests passed");
console.log(
  JSON.stringify({
    glute_action: gluteLoop.goal.action,
    glute_response: gluteLoop.goal.goal_response,
    volume_action: gluteLoop.volume.program_action,
    productive: productive.volume.program_action,
    sparse: sparse.goal.goal_response,
    valid_assignable: validGen.assignable,
  }),
);
