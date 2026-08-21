import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  KNOWN_CRITICAL_CONFLICT_PENDING_PHASE_4,
  KNOWN_CRITICAL_CONFLICT_PENDING_PHASE_5_6,
  LEGACY_GOAL_MAP,
  TRAINING_NUTRITION_BOUNDARY,
  TRAINING_V2_CANONICAL_GOALS,
  isWorkingSetHistoryRow,
  mapLegacyEffortToV2,
  mapLegacyGoalId,
} from "./training-v2-contracts";
import { SET_WEIGHT_INCREMENT } from "./workout-session";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

assertEqual(mapLegacyGoalId("fat").canonicalId, "FAT_LOSS", "fat → FAT_LOSS");
assertEqual(mapLegacyGoalId("glutes").canonicalId, "GLUTE_GROWTH", "glutes → GLUTE_GROWTH");
assertEqual(mapLegacyGoalId("waist").canonicalId, "SLIM_TONED_WAIST", "waist → SLIM_TONED_WAIST");
assertEqual(mapLegacyGoalId("body").canonicalId, "FEMININE_BALANCED_BODY", "body → FEMININE_BALANCED_BODY");
assertEqual(mapLegacyGoalId("tone").canonicalId, null, "tone is not TONED_ARMS_UPPER_BODY");
assertEqual(mapLegacyGoalId("tone").mappingStatus, "LEGACY_UNMAPPED", "tone unmapped");
assertEqual(mapLegacyGoalId("fit").mappingStatus, "LEGACY_UNMAPPED", "fit unmapped");
assertEqual(mapLegacyGoalId("unknown-goal").mappingStatus, "LEGACY_UNMAPPED", "unknown unmapped");
assert(!LEGACY_GOAL_MAP.tone?.canonicalId, "tone mapping table has no canonical id");
assert(TRAINING_V2_CANONICAL_GOALS.includes("TONED_ARMS_UPPER_BODY"), "arms goal exists as catalog, not auto-map");

assertEqual(mapLegacyEffortToV2("easy"), "EASY", "easy → EASY");
assertEqual(mapLegacyEffortToV2("medium"), "IDEAL", "medium → IDEAL");
assertEqual(mapLegacyEffortToV2("hard"), "VERY_HARD", "hard → VERY_HARD");
assertEqual(mapLegacyEffortToV2("hard"), "VERY_HARD", "historical hard is not FAILURE");
assertEqual(mapLegacyEffortToV2(null), null, "missing effort stays unknown");

assert(
  isWorkingSetHistoryRow({ setType: "WORKING", skipped: false }),
  "working set counts",
);
assert(
  !isWorkingSetHistoryRow({ setType: "WARMUP", skipped: false }),
  "warmup excluded from working history",
);
assert(
  !isWorkingSetHistoryRow({ setType: "WORKING", skipped: true }),
  "skipped excluded",
);

assertEqual(SET_WEIGHT_INCREMENT, 0.1, "Phase 2 does not change +10% rule");
assertEqual(
  KNOWN_CRITICAL_CONFLICT_PENDING_PHASE_5_6,
  "KNOWN_CRITICAL_CONFLICT_PENDING_PHASE_5_6",
  "phase 5/6 conflict tagged",
);
assertEqual(
  KNOWN_CRITICAL_CONFLICT_PENDING_PHASE_4,
  "KNOWN_CRITICAL_CONFLICT_PENDING_PHASE_4",
  "phase 4 conflict tagged",
);
assertEqual(TRAINING_NUTRITION_BOUNDARY, "PENDING_SHARED_CONTRACT", "nutrition remains pending");

const root = process.cwd();
const migration = readFileSync(
  join(root, "supabase/migrations/20260821120000_training_engine_v2_data_contracts.sql"),
  "utf8",
);

assert(migration.includes("CREATE TABLE IF NOT EXISTS public.workout_sessions"), "session table");
assert(migration.includes("UNIQUE (user_id, session_key)"), "idempotent session key");
assert(migration.includes("ADD COLUMN IF NOT EXISTS workout_session_id"), "set logs extended not replaced");
assert(migration.includes("CREATE TABLE IF NOT EXISTS public.workout_set_logs") === false, "no workout_set_logs_v2");
assert(!migration.includes("CREATE TABLE IF NOT EXISTS public.exercises_v2"), "no exercises_v2");
assert(!migration.includes("program_templates_v2"), "no program_templates_v2");
assert(migration.includes("'EASY', 'IDEAL', 'VERY_HARD', 'FAILURE'"), "v2 effort contract");
assert(migration.includes("WHEN 'hard' THEN 'VERY_HARD'"), "hard maps to VERY_HARD");
assert(!/effort_v2 = 'FAILURE'/.test(migration), "no historical FAILURE fabrication");
assert(migration.includes("set_type = COALESCE(set_type, 'WORKING')"), "historical sets default WORKING");
assert(migration.includes("NOT (skipped IS TRUE AND set_completed IS TRUE)"), "skip ≠ completed");
assert(migration.includes("set_completed left NULL for history") || migration.includes("set_completed left NULL"), "historical completion not guessed");
assert(migration.includes("'WARMUP', 'WORKING'"), "set type contract");
assert(migration.includes("prescribed_load"), "prescribed load");
assert(migration.includes("actual_load"), "actual load");
assert(migration.includes("prescribed_rest_seconds"), "prescribed rest");
assert(migration.includes("actual_rest_seconds"), "actual rest");
assert(migration.includes("UNASSESSED"), "training level");
assert(migration.includes("GRANT SELECT ON public.client_training_levels TO authenticated"), "client cannot write level table");
assert(!/GRANT INSERT ON public.client_training_levels TO authenticated/.test(migration), "no direct level insert grant");
assert(migration.includes("NEW', 'CALIBRATING', 'FAMILIAR', 'ESTABLISHED'"), "experience states");
assert(migration.includes("GRANT SELECT ON public.client_exercise_experience TO authenticated"), "experience read-only to client table");
assert(migration.includes("RECONDITIONING"), "reconditioning representable");
assert(migration.includes("'fat', 'FAT_LOSS'"), "fat mapping seed");
assert(migration.includes("'tone', NULL, 'LEGACY_UNMAPPED'"), "tone unmapped seed");
assert(migration.includes("'fit', NULL, 'LEGACY_UNMAPPED'"), "fit unmapped seed");
assert(migration.includes("client_goal_history"), "goal history");
assert(migration.includes("client_ensure_workout_session"), "active/resume session RPC");
assert(migration.includes("ON CONFLICT (user_id, session_key) DO UPDATE"), "session retry idempotent");
assert(migration.includes("client_list_exercise_set_history"), "history read RPC");
assert(migration.includes("client_map_legacy_goal"), "goal mapping RPC");
assert(migration.includes("adaptive_decision_logs"), "decision audit foundation");
assert(migration.includes("client_training_safety_signals"), "safety ≠ effort");
assert(migration.includes("pain', 'discomfort', 'unsafe_execution"), "safety signals");
assert(!migration.includes("INCREASE_LOAD"), "no load engine in SQL");
assert(!migration.includes("ADD_VOLUME"), "no volume engine in SQL");
assert(!migration.includes("calories"), "no nutrition calories in training v2 migration");
assert(migration.includes("workout_sessions_own_select"), "session RLS own select");
assert(migration.includes("workout_sessions_admin_select"), "session admin select");
assert(migration.includes("s.user_id = auth.uid()"), "set log session ownership");
assert(migration.includes("counters_authority"), "counters documented as derived");
assert(migration.includes("workout_set_logs_session_set_uidx"), "session-scoped set uniqueness");
assert(migration.includes("UNIQUE (user_id, session_date, exercise_external_id, set_number)") === false, "legacy unique kept in prior migration");
assert(migration.includes("ADD COLUMN IF NOT EXISTS workout_session_id UUID REFERENCES public.workout_sessions"), "nullable historical session link");
assert(migration.includes("daily_readiness_checks"), "readiness kept");
assert(migration.includes("REVOKE ALL ON FUNCTION public.client_ensure_workout_session"), "anon cannot ensure session");

const api = readFileSync(join(root, "src/lib/platform/training-v2-api.ts"), "utf8");
assert(api.includes("client_ensure_workout_session"), "API wraps session ensure");
assert(api.includes("client_get_active_workout_session"), "API wraps active session");
assert(api.includes("client_list_exercise_set_history"), "API wraps history");
assert(!api.includes("INCREASE_LOAD"), "API has no progression engine");

const player = readFileSync(join(root, "src/hooks/useWorkoutPlayer.ts"), "utf8");
assert(player.includes("getSetProgression"), "legacy_free path may still isolate +10% helper");
assert(player.includes("ensureWorkoutSession"), "Phase 5 player uses canonical session");
assert(player.includes("legacy_free"), "legacy free path is isolated");

const setLogApi = readFileSync(join(root, "src/lib/platform/workout-set-logs-api.ts"), "utf8");
assert(setLogApi.includes("onConflict: \"user_id,session_date,exercise_external_id,set_number\""), "legacy upsert key preserved");
assert(setLogApi.includes("workoutSessionId"), "optional session link without requiring Phase 5");

const today = readFileSync(join(root, "src/lib/platform/today-workout.ts"), "utf8");
assert(today.includes("KNOWN_CRITICAL_CONFLICT_PENDING_PHASE_4"), "fixed loads tagged");
assert(today.includes("suggested_weight_kg: 40"), "visible starting loads unchanged");

const sessionLib = readFileSync(join(root, "src/lib/platform/workout-session.ts"), "utf8");
assert(sessionLib.includes("KNOWN_CRITICAL_CONFLICT_PENDING_PHASE_5_6"), "+10% tagged not removed");

const types = readFileSync(join(root, "src/integrations/supabase/types.ts"), "utf8");
assert(types.includes("workout_sessions:"), "generated types include sessions");
assert(types.includes("client_ensure_workout_session"), "RPC typed");
assert(types.includes("effort_v2"), "set log v2 effort typed");

console.log("training-v2-contracts tests passed");
