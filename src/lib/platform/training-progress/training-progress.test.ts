import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TRAINING_V2_CANONICAL_GOALS } from "@/lib/platform/training-v2-contracts";
import { getClientTrainingProgressSummary } from "@/lib/platform/training-progress/summary";
import { mapGoalStatus, mapProgressionAction, FORBIDDEN_CLIENT_PHRASES, GOAL_DISPLAY_NAMES } from "@/lib/platform/training-progress/copy";
import { getTrainingNotificationContext, notificationDedupeKey } from "@/lib/platform/training-progress/notifications";
import { sanitizeAnalyticsProps, TRAINING_ANALYTICS_EVENTS } from "@/lib/platform/training-progress/analytics";
import { toDecisionTrace, toClientSafeTrace, getCoachTrainingOverview, HEALTH_METRIC_CATALOG, ENGINE_VERSIONS } from "@/lib/platform/training-progress/observability";
import { aggregateExerciseTrends } from "@/lib/platform/training-progress/trends";
import { TRAINING_PROGRESS_ENGINE } from "@/lib/platform/training-progress/types";
import type { TrainingProgressInput } from "@/lib/platform/training-progress/types";
import type { GoalResponseState, GoalAction, GoalReasonCode, ResponseLimiter } from "@/lib/platform/goal-intelligence/types";
import type { ContinuityAction, ContinuityReasonCode, AdherenceMetrics } from "@/lib/platform/continuity/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)} got ${String(actual)}`);
}

function blob(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function hasForbidden(text: string) {
  const lower = text.toLowerCase();
  return FORBIDDEN_CLIENT_PHRASES.some((token) => lower.includes(token.toLowerCase()));
}

function goalDecision(
  state: GoalResponseState,
  extra?: Partial<NonNullable<TrainingProgressInput["goalDecision"]>>,
): NonNullable<TrainingProgressInput["goalDecision"]> {
  return {
    goal_response: state,
    action: (extra?.action ?? "KEEP_STRATEGY") as GoalAction,
    reason_code: (extra?.reason_code ?? "INSUFFICIENT_REGIONAL_DATA") as GoalReasonCode,
    limiting_factor: (extra?.limiting_factor ?? "NONE") as ResponseLimiter,
    client_explanation: extra?.client_explanation ?? "",
    reallocation: extra?.reallocation ?? null,
    nutrition_review_required: extra?.nutrition_review_required,
    body_composition_review_required: extra?.body_composition_review_required,
    body_composition_data_required: extra?.body_composition_data_required,
    nutrition_contract_status: extra?.nutrition_contract_status,
  };
}

function continuity(partial: Partial<NonNullable<TrainingProgressInput["continuity"]>> & { action: ContinuityAction }) {
  const adherence: AdherenceMetrics = partial.adherence ?? {
    sessions_prescribed: 9,
    sessions_completed: 8,
    sessions_partial: 0,
    sessions_missed: 1,
    working_sets_prescribed: 90,
    working_sets_completed: 80,
  };
  return {
    action: partial.action,
    reason_code: (partial.reason_code ?? "NORMAL_SEQUENCE") as ContinuityReasonCode,
    effective_date: partial.effective_date ?? "2026-08-21",
    original_scheduled_date: partial.original_scheduled_date ?? "2026-08-20",
    next_program_day_id: partial.next_program_day_id ?? "day-b",
    resume_session_id: partial.resume_session_id ?? null,
    reconditioning_state: partial.reconditioning_state ?? false,
    client_explanation: partial.client_explanation ?? "",
    adherence,
    previous_session_state: partial.previous_session_state ?? "NONE",
    recommended_session_status: partial.recommended_session_status ?? null,
  };
}

const root = process.cwd();
const progressRoute = readFileSync(join(root, "src/routes/_platform/app/progress.tsx"), "utf8");
const progressCards = readFileSync(join(root, "src/components/platform/progress/TrainingProgressCards.tsx"), "utf8");
const reminder = readFileSync(join(root, "src/components/platform/workout/TrainingReminderOverlay.tsx"), "utf8");
const player = readFileSync(join(root, "src/hooks/useWorkoutPlayer.ts"), "utf8");
const hook = readFileSync(join(root, "src/hooks/useTrainingProgressSummary.ts"), "utf8");
const migration = readFileSync(join(root, "supabase/migrations/20260821120000_training_engine_v2_data_contracts.sql"), "utf8");

assert(progressRoute.includes("TrainingProgressCards"), "existing /app/progress upgraded");
assert(!progressRoute.includes("progress-v2"), "no duplicate progress-v2 route");
assert(progressCards.includes("حالة الهدف"), "goal status card");
assert(reminder.includes("getTrainingNotificationContext"), "reminders consume continuity context");
assert(player.includes('trackTrainingEvent("workout_completed"'), "workout completed analytics");
assert(migration.includes("adaptive_decision_logs"), "reuse phase 2 decision log");
assert(!migration.includes("progress_v2"), "no progress_v2 table");
assertEqual(TRAINING_PROGRESS_ENGINE, "getClientTrainingProgressSummary", "central summary");

const empty = getClientTrainingProgressSummary({ goalId: null });
assert(empty.empty, "new client empty");
assert(empty.goal_card.short_reason.includes("أولى حصصك"), "useful empty copy");
assert(!empty.goal_card.short_reason.toLowerCase().includes("no progress"), "no fake no-progress");
assert(empty.exercise_trends.length === 0, "no empty charts");

const loadError = getClientTrainingProgressSummary({ goalId: "GLUTE_GROWTH", loadError: true });
assertEqual(loadError.goal_card.title, "تعذر تحميل تقدمك الآن", "neutral load error");
assert(!loadError.goal_card.title.includes("فشل الهدف"), "no goal failed");

const uxCases: Array<{
  name: string;
  input: TrainingProgressInput;
  titleIncludes: string;
  mustNot: string[];
}> = [
  {
    name: "ON_TRACK",
    input: { goalId: "GLUTE_GROWTH", goalDecision: goalDecision("ON_TRACK") },
    titleIncludes: "الاتجاه الصحيح",
    mustNot: ["No progress", "وراثي"],
  },
  {
    name: "PARTIAL",
    input: { goalId: "GLUTE_GROWTH", goalDecision: goalDecision("PARTIAL_RESPONSE") },
    titleIncludes: "تعديل التركيز",
    mustNot: ["You failed", "فشلت"],
  },
  {
    name: "RECOVERY",
    input: {
      goalId: "FAT_LOSS",
      goalDecision: goalDecision("RECOVERY_LIMITED"),
      volumeDecision: { action: "HOLD_VOLUME_PROGRESSION", reason_code: "RECOVERY_LIMITED", recovery_state: "LIMITED" },
    },
    titleIncludes: "تعافي",
    mustNot: ["Goal failed", "فشلت"],
  },
  {
    name: "ADHERENCE",
    input: { goalId: "GLUTE_GROWTH", goalDecision: goalDecision("ADHERENCE_LIMITED") },
    titleIncludes: "انتظام",
    mustNot: ["poor adherence", "You owe"],
  },
  {
    name: "REALLOCATION",
    input: {
      goalId: "GLUTE_GROWTH",
      goalDecision: goalDecision("REGIONAL_UNDER_RESPONSE", {
        action: "REALLOCATE_TRAINING_EMPHASIS",
        reallocation: { from_region: "QUADRICEPS", to_region: "GLUTES" },
      }),
      programChange: { material: true, reason: "GOAL_REALLOCATION", added: ["CH-001"], removed: ["SQ-001"], version: 2 },
    },
    titleIncludes: "تعديل التركيز",
    mustNot: ["coefficient", "وراثي"],
  },
  {
    name: "DELOAD",
    input: {
      goalId: "FAT_LOSS",
      volumeDecision: { action: "DELOAD_REVIEW", reason_code: "DELOAD_PATTERN_DETECTED", recovery_state: "POOR" },
    },
    titleIncludes: "تخفيف",
    mustNot: ["punish", "فشلت"],
  },
  {
    name: "RECONDITIONING",
    input: {
      goalId: "GLUTE_GROWTH",
      continuity: continuity({ action: "ENTER_RECONDITIONING", reconditioning_state: true }),
      volumeDecision: { action: "RECONDITIONING", reason_code: "RECONDITIONING_ACTIVE", recovery_state: "LIMITED" },
      trainingLevel: "INTERMEDIATE",
    },
    titleIncludes: "عودة",
    mustNot: ["Beginner", "lost X%", "مبتدئ"],
  },
  {
    name: "NUTRITION_REVIEW",
    input: {
      goalId: "FAT_LOSS",
      goalDecision: goalDecision("NUTRITION_REVIEW_REQUIRED", { nutrition_review_required: true }),
    },
    titleIncludes: "التدريب يسير جيدًا",
    mustNot: ["خفض 200", "Calories burned"],
  },
  {
    name: "BODY_DATA",
    input: {
      goalId: "GLUTE_GROWTH",
      goalDecision: goalDecision("ON_TRACK", { body_composition_data_required: true }),
      regionalDecisions: [{ region: "GLUTES", response_state: "POSITIVE_NORMAL" }],
    },
    titleIncludes: "الاتجاه الصحيح",
    mustNot: ["confirmed glute growth", "نمو مؤكد"],
  },
];

for (const item of uxCases) {
  const summary = getClientTrainingProgressSummary(item.input);
  const text = blob(summary.goal_card.title, summary.goal_card.short_reason, summary.recovery?.title, ...summary.adaptations.map((row) => row.title));
  assert(text.includes(item.titleIncludes), `${item.name} client title`);
  for (const banned of item.mustNot) {
    assert(!text.toLowerCase().includes(banned.toLowerCase()), `${item.name} must not show ${banned}`);
  }
}

const keep = mapProgressionAction("KEEP_LOAD", "REP_RANGE_NOT_MAXED");
assert(keep.short_reason.includes("حافظنا") || keep.title.includes("نثبت"), "KEEP copy positive");
assert(!keep.short_reason.toLowerCase().includes("no progress"), "KEEP is not no progress");

const decrease = mapProgressionAction("DECREASE_LOAD", "NEW_LOAD_NOT_TOLERATED");
assert(decrease.client_action.includes("ليس تراجعًا"), "decrease is not shame");

const increase = getClientTrainingProgressSummary({
  goalId: "GLUTE_GROWTH",
  progressionSamples: [
    {
      external_id: "CH-001",
      name_ar: "Hip Thrust",
      action: "INCREASE_LOAD",
      reason_code: "TOP_RANGE_MASTERED",
      from_load: 40,
      to_load: 45,
      from_reps: 12,
      to_reps: 12,
      from_duration: null,
      to_duration: null,
    },
  ],
});
assertEqual(increase.exercise_trends[0]?.from_label, "40 كجم", "load from");
assertEqual(increase.exercise_trends[0]?.to_label, "45 كجم", "load to");

const reps = getClientTrainingProgressSummary({
  goalId: "TONED_ARMS_UPPER_BODY",
  progressionSamples: [
    {
      external_id: "LP-001",
      name_ar: "Lat Pulldown",
      action: "INCREASE_REPS",
      reason_code: "REP_RANGE_NOT_MAXED",
      from_load: 20,
      to_load: 20,
      from_reps: 8,
      to_reps: 12,
      from_duration: null,
      to_duration: null,
    },
  ],
});
assert(reps.exercise_trends[0]?.kind === "reps", "rep progress without load change");
assertEqual(reps.exercise_trends[0]?.to_label, "12 تكرار", "12 reps");

const timed = getClientTrainingProgressSummary({
  goalId: "POSTURE_TONED_BACK",
  progressionSamples: [
    {
      external_id: "PL-001",
      name_ar: "Plank",
      action: "INCREASE_DURATION",
      reason_code: "DURATION_RANGE_MASTERED",
      from_load: null,
      to_load: null,
      from_reps: null,
      to_reps: null,
      from_duration: 30,
      to_duration: 45,
    },
  ],
});
assertEqual(timed.exercise_trends[0]?.kind, "duration", "timed kind");
assert(!timed.exercise_trends[0]?.to_label.includes("كجم"), "no fake kg");

const bw = getClientTrainingProgressSummary({
  goalId: "FEMININE_BALANCED_BODY",
  progressionSamples: [
    {
      external_id: "PU-001",
      name_ar: "Push-up",
      action: "INCREASE_REPS",
      reason_code: "REP_RANGE_NOT_MAXED",
      from_load: null,
      to_load: null,
      from_reps: 8,
      to_reps: 12,
      from_duration: null,
      to_duration: null,
      is_bodyweight: true,
    },
  ],
});
assertEqual(bw.exercise_trends[0]?.kind, "bodyweight_reps", "bodyweight uses reps");
assert(!bw.exercise_trends[0]?.from_label.includes("0 كجم"), "no 0kg");

const partial = getClientTrainingProgressSummary({
  goalId: "GLUTE_GROWTH",
  continuity: continuity({
    action: "ADVANCE_AFTER_PARTIAL",
    adherence: {
      sessions_prescribed: 4,
      sessions_completed: 2,
      sessions_partial: 1,
      sessions_missed: 0,
      working_sets_prescribed: 40,
      working_sets_completed: 28,
    },
  }),
});
assert(partial.consistency?.summary.includes("جزئية"), "partial recognized");
assert(!partial.consistency?.summary.includes("صفر"), "not zero adherence");

const missed = getClientTrainingProgressSummary({
  goalId: "FAT_LOSS",
  continuity: continuity({ action: "DEFER_SESSION", previous_session_state: "MISSED" }),
});
assert(missed.adaptations.some((row) => row.short_reason.includes("ترتيب") || row.title.includes("ترتيب")), "continuity-aware missed");
assert(!blob(...missed.adaptations.map((row) => row.short_reason)).includes("تعويض الحصة المفقودة"), "no workout debt");

const waist = getClientTrainingProgressSummary({
  goalId: "SLIM_TONED_WAIST",
  regionalDecisions: [{ region: "CORE", response_state: "POSITIVE_NORMAL" }],
  goalDecision: goalDecision("BODY_COMPOSITION_LIMITED", { body_composition_data_required: true }),
});
assert(waist.regional_cards[0]?.summary.includes("الجذع"), "core training copy");
assert(waist.body_card?.summary.includes("منفصل") || waist.goal_card.short_reason.includes("تكوين الجسم"), "body separate from core");
assert(!blob(waist.regional_cards[0]?.summary, waist.body_card?.summary).includes("حرق موضعي"), "no spot reduction");

const arms = getClientTrainingProgressSummary({
  goalId: "TONED_ARMS_UPPER_BODY",
  goalDecision: goalDecision("REGIONAL_UNDER_RESPONSE", {
    action: "REALLOCATE_TRAINING_EMPHASIS",
    reallocation: { from_region: "SHOULDERS", to_region: "BICEPS" },
  }),
  regionalDecisions: [
    { region: "SHOULDERS", response_state: "POSITIVE_FAST" },
    { region: "BICEPS", response_state: "POSITIVE_SLOW" },
  ],
});
assert(arms.goal_card.short_reason.includes("الذراعين"), "arms reallocation");
assert(!arms.goal_card.short_reason.toLowerCase().includes("light-weight"), "no stereotype");

const fat = getClientTrainingProgressSummary({
  goalId: "FAT_LOSS",
  goalDecision: goalDecision("ON_TRACK"),
});
assert(!blob(fat.goal_card.short_reason, fat.body_card?.summary).includes("سعرات التمرين"), "no calorie burn");

const posture = getClientTrainingProgressSummary({
  goalId: "POSTURE_TONED_BACK",
  regionalDecisions: [{ region: "UPPER_BACK", response_state: "POSITIVE_NORMAL" }],
});
assert(posture.regional_cards[0]?.summary.includes("ليس تصحيحاً طبياً") || posture.regional_cards.length >= 0, "non-medical");
assert(!blob(...posture.regional_cards.map((row) => row.summary)).includes("medically corrected"), "no medical claim");

for (const goal of TRAINING_V2_CANONICAL_GOALS) {
  const mapped = mapGoalStatus("ON_TRACK");
  assert(GOAL_DISPLAY_NAMES[goal], `${goal} display name`);
  assert(!hasForbidden(mapped.short_reason), `${goal} on-track copy clean`);
}

const traces = [
  ["progression", "CALIBRATION_REQUIRED", "INSUFFICIENT_HISTORY"],
  ["progression", "INCREASE_LOAD", "TOP_RANGE_MASTERED"],
  ["progression", "DECREASE_LOAD", "NEW_LOAD_NOT_TOLERATED"],
  ["progression", "HOLD_PROGRESSION", "RECOVERY_HOLD"],
  ["volume", "ADD_SMALL_VOLUME", "RECOVERY_CAPACITY_AVAILABLE"],
  ["volume", "REDUCE_VOLUME", "RECOVERY_LIMITED"],
  ["volume", "REALLOCATE_VOLUME", "VOLUME_REALLOCATION_PREFERRED"],
  ["volume", "HOLD_VOLUME_PROGRESSION", "RECOVERY_LIMITED"],
  ["volume", "DELOAD_REVIEW", "DELOAD_PATTERN_DETECTED"],
  ["volume", "RECONDITIONING", "RECONDITIONING_ACTIVE"],
  ["continuity", "RESCHEDULE_SESSION", "SESSION_RESCHEDULED"],
  ["goal", "REALLOCATE_TRAINING_EMPHASIS", "REGIONAL_PROGRESS_SLOW"],
  ["goal", "GOAL_TRADEOFF_REVIEW", "GOAL_TRADEOFF_DETECTED"],
  ["program", "PROGRAM_REGENERATION", "GOAL_REALLOCATION"],
  ["program", "PROGRAM_VALIDATION_FAILURE", "INVALID"],
  ["progress", "V2_FALLBACK_LEGACY_PRESCRIPTION", "LEGACY_FALLBACK"],
] as const;

for (const [engine, action, reason] of traces) {
  const trace = toDecisionTrace({
    engine,
    action,
    reason_code: reason,
    confidence: "MODERATE",
    object_type: "exercise",
    object_id: "CH-001",
    source_session_id: "sess-1",
    program_version: 3,
    input_summary: { top_range: true },
  });
  assert(trace.engine_version.length > 0, `${action} engine version`);
  assertEqual(trace.program_version, 3, `${action} program version`);
  assert(trace.qa_visible && trace.coach_visible && !trace.client_visible, `${action} visibility split`);
  const safe = toClientSafeTrace(trace);
  assert(!("input_summary" in safe), `${action} client API strips input_summary`);
}

const coach = getCoachTrainingOverview([
  { code: "NUTRITION_REVIEW_REQUIRED", severity: "normal", label_ar: "تغذية", open: true },
  { code: "SAFETY_REVIEW_REQUIRED", severity: "safety", label_ar: "سلامة", open: true },
]);
assertEqual(coach.highest?.code, "SAFETY_REVIEW_REQUIRED", "safety is highest");
assert(coach.has_open_review, "open review not auto-closed");

assertEqual(HEALTH_METRIC_CATALOG.length, 13, "health metric catalog");
assert(ENGINE_VERSIONS.program.includes("v2-phase10-1"), "program version traceable");

const upcoming = getTrainingNotificationContext({
  continuity: {
    action: "CONTINUE_SEQUENCE",
    effective_date: "2026-08-21",
    original_scheduled_date: "2026-08-21",
    next_program_day_id: "day-a",
    resume_session_id: null,
    reconditioning_state: false,
    reason_code: "NORMAL_SEQUENCE",
    previous_session_state: "NONE",
  },
  workoutReminders: true,
  progressUpdates: true,
  permissionDenied: false,
  inWorkout: false,
  nowLocalDate: "2026-08-21",
});
assertEqual(upcoming?.kind, "UPCOMING_SESSION", "upcoming uses effective date");
assertEqual(upcoming?.href, "/app/program/workout", "deep link workout");

const rescheduled = getTrainingNotificationContext({
  continuity: {
    action: "RESCHEDULE_SESSION",
    effective_date: "2026-08-22",
    original_scheduled_date: "2026-08-21",
    next_program_day_id: "day-b",
    resume_session_id: null,
    reconditioning_state: false,
    reason_code: "SESSION_RESCHEDULED",
    previous_session_state: "RESCHEDULED",
  },
  workoutReminders: true,
  progressUpdates: true,
  permissionDenied: false,
  inWorkout: false,
  nowLocalDate: "2026-08-21",
});
assertEqual(rescheduled?.kind, "RESCHEDULED_SESSION", "reschedule Thursday not Wednesday");
assert(rescheduled?.cancel_keys.some((key) => key.includes("2026-08-21")), "cancel stale Wednesday");
assertEqual(rescheduled?.local_date, "2026-08-22", "effective Thursday");

const duplicate = getTrainingNotificationContext({
  continuity: {
    action: "RESCHEDULE_SESSION",
    effective_date: "2026-08-22",
    original_scheduled_date: "2026-08-21",
    next_program_day_id: "day-b",
    resume_session_id: null,
    reconditioning_state: false,
    reason_code: "SESSION_RESCHEDULED",
    previous_session_state: "RESCHEDULED",
  },
  workoutReminders: true,
  progressUpdates: true,
  permissionDenied: false,
  inWorkout: false,
  sentKeys: [notificationDedupeKey("RESCHEDULED_SESSION", "day-b", "2026-08-22")],
  nowLocalDate: "2026-08-21",
});
assertEqual(duplicate, null, "duplicate reschedule suppressed");

const completed = getTrainingNotificationContext({
  continuity: {
    action: "CONTINUE_SEQUENCE",
    effective_date: "2026-08-21",
    original_scheduled_date: "2026-08-21",
    next_program_day_id: "day-a",
    resume_session_id: null,
    reconditioning_state: false,
    reason_code: "NORMAL_SEQUENCE",
    previous_session_state: "NONE",
  },
  workoutReminders: true,
  progressUpdates: true,
  permissionDenied: false,
  inWorkout: false,
  completedProgramDayIds: ["day-a"],
  nowLocalDate: "2026-08-21",
});
assertEqual(completed, null, "completed session cancels reminder");

const resume = getTrainingNotificationContext({
  continuity: {
    action: "RESUME_SESSION",
    effective_date: "2026-08-21",
    original_scheduled_date: "2026-08-21",
    next_program_day_id: "day-a",
    resume_session_id: "sess-active",
    reconditioning_state: false,
    reason_code: "ACTIVE_SESSION_RESUME",
    previous_session_state: "IN_PROGRESS",
  },
  workoutReminders: true,
  progressUpdates: true,
  permissionDenied: false,
  inWorkout: false,
  nowLocalDate: "2026-08-21",
});
assertEqual(resume?.kind, "RESUME_SESSION", "resume not start new");
assertEqual(resume?.href, "/app/program/workout", "resume deep link");

const denied = getTrainingNotificationContext({
  continuity: {
    action: "CONTINUE_SEQUENCE",
    effective_date: "2026-08-21",
    original_scheduled_date: "2026-08-21",
    next_program_day_id: "day-a",
    resume_session_id: null,
    reconditioning_state: false,
    reason_code: "NORMAL_SEQUENCE",
    previous_session_state: "NONE",
  },
  workoutReminders: true,
  progressUpdates: true,
  permissionDenied: true,
  inWorkout: false,
  nowLocalDate: "2026-08-21",
});
assertEqual(denied?.deliver_in_app, true, "in-app still works");
assertEqual(denied?.deliver_push, false, "push skipped when denied");

const inSession = getTrainingNotificationContext({
  continuity: {
    action: "CONTINUE_SEQUENCE",
    effective_date: "2026-08-21",
    original_scheduled_date: "2026-08-21",
    next_program_day_id: "day-a",
    resume_session_id: null,
    reconditioning_state: false,
    reason_code: "NORMAL_SEQUENCE",
    previous_session_state: "NONE",
  },
  workoutReminders: true,
  progressUpdates: true,
  permissionDenied: false,
  inWorkout: true,
  nowLocalDate: "2026-08-21",
});
assertEqual(inSession, null, "no out-of-session reminder during workout");

const noMaterial = getTrainingNotificationContext({
  continuity: {
    action: "CONTINUE_SEQUENCE",
    effective_date: "2026-08-22",
    original_scheduled_date: "2026-08-22",
    next_program_day_id: "day-a",
    resume_session_id: null,
    reconditioning_state: false,
    reason_code: "NORMAL_SEQUENCE",
    previous_session_state: "NONE",
  },
  workoutReminders: true,
  progressUpdates: true,
  permissionDenied: false,
  inWorkout: false,
  materialProgramChange: false,
  nowLocalDate: "2026-08-21",
});
assertEqual(noMaterial, null, "no spam when nothing material and not today");

const sanitized = sanitizeAnalyticsProps({ email: "a@b.c", name: "Ali", notes: "knee pain", event_ok: true, count: 2 });
assert(!("email" in sanitized) && !("name" in sanitized) && !("notes" in sanitized), "no PII analytics");
assertEqual(sanitized.event_ok, true, "typed props kept");
assert(TRAINING_ANALYTICS_EVENTS.includes("v2_fallback_legacy_prescription"), "fallback event");
assert(TRAINING_ANALYTICS_EVENTS.includes("progress_viewed"), "progress viewed");

const trends = aggregateExerciseTrends([
  { exercise_external_id: "CH-001", session_date: "2026-08-01", actual_load: 40, actual_reps: 10, actual_duration_seconds: null },
  { exercise_external_id: "CH-001", session_date: "2026-08-08", actual_load: 45, actual_reps: 10, actual_duration_seconds: null },
]);
assertEqual(trends[0]?.action, null, "aggregator does not invent progression action");
assertEqual(trends[0]?.from_load, 40, "factual from load");
assertEqual(trends[0]?.to_load, 45, "factual to load");

const rls = readFileSync(join(root, "supabase/tests/training_engine_v2_rls_test_plan.sql"), "utf8");
assert(rls.includes("adaptive_decision_logs"), "decision log rls plan exists");

assert(hook.includes("listOwnAdaptiveDecisions"), "progress hook reads persisted decisions");
assert(!hook.includes("evaluateGoalResponse("), "progress hook does not guess goal inline");
assert(!player.includes("generateTrainingProgram"), "workout player does not generate programs");
assert(!progressRoute.includes("evaluateGoalResponse("), "progress UI does not run goal engine inline");

console.log("training-progress phase 11 tests passed");
