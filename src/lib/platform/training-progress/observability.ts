import { PROGRESSION_ENGINE } from "@/lib/platform/progression/types";
import { VOLUME_ENGINE } from "@/lib/platform/volume/types";
import { CONTINUITY_ENGINE } from "@/lib/platform/continuity/types";
import { GOAL_INTELLIGENCE_ENGINE } from "@/lib/platform/goal-intelligence/types";
import { PROGRAM_GENERATOR, PROGRAM_CONTEXT_VERSION } from "@/lib/platform/program-generation/types";
import { TRAINING_PROGRESS_VERSION, type DecisionTrace, type HealthMetricId, type ReviewFlag } from "./types";

export const ENGINE_VERSIONS = {
  progression: PROGRESSION_ENGINE,
  volume: VOLUME_ENGINE,
  continuity: CONTINUITY_ENGINE,
  goal: GOAL_INTELLIGENCE_ENGINE,
  program: `${PROGRAM_GENERATOR}:${PROGRAM_CONTEXT_VERSION}`,
  progress: TRAINING_PROGRESS_VERSION,
} as const;

export function toDecisionTrace(input: {
  engine: keyof typeof ENGINE_VERSIONS | string;
  action: string;
  reason_code: string;
  confidence?: DecisionTrace["confidence"];
  object_type: string;
  object_id?: string | null;
  source_session_id?: string | null;
  program_version?: number | null;
  input_summary?: DecisionTrace["input_summary"];
}): DecisionTrace {
  const engineVersion = ENGINE_VERSIONS[input.engine as keyof typeof ENGINE_VERSIONS] ?? String(input.engine);
  return {
    engine: String(input.engine),
    engine_version: engineVersion,
    action: input.action,
    reason_code: input.reason_code,
    confidence: input.confidence ?? null,
    object_type: input.object_type,
    object_id: input.object_id ?? null,
    source_session_id: input.source_session_id ?? null,
    program_version: input.program_version ?? null,
    input_summary: input.input_summary ?? {},
    client_visible: false,
    coach_visible: true,
    qa_visible: true,
  };
}

export function toClientSafeTrace(trace: DecisionTrace) {
  return {
    action: trace.action,
    object_type: trace.object_type,
    created_via: trace.engine,
    program_version: trace.program_version,
  };
}

export const HEALTH_METRIC_CATALOG: Array<{ id: HealthMetricId; label: string; source: string }> = [
  { id: "v2_session_usage", label: "V2 session usage", source: "workout_sessions.status" },
  { id: "set_actual_reps_coverage", label: "Set actual-reps coverage", source: "workout_set_logs.actual_reps" },
  { id: "set_effort_coverage", label: "Set effort coverage", source: "workout_set_logs.effort_v2" },
  { id: "v2_eligible_exercise_coverage", label: "V2-eligible exercise coverage", source: "exercises.metadata_status" },
  { id: "insufficient_data_rate", label: "Insufficient-data rate", source: "adaptive_decision_logs" },
  { id: "legacy_fallback_rate", label: "Legacy fallback rate", source: "analytics v2_fallback_legacy_prescription" },
  { id: "progression_decision_rate", label: "Progression decision rate", source: "progression engine" },
  { id: "volume_adaptation_rate", label: "Volume adaptation rate", source: "volume engine" },
  { id: "recovery_hold_rate", label: "Recovery-hold rate", source: "volume/progression hold" },
  { id: "program_validation_failure_rate", label: "Program validation failure rate", source: "program-generation validator" },
  { id: "program_generation_block_rate", label: "Program generation block rate", source: "generateTrainingProgram status" },
  { id: "set_sync_failure_rate", label: "Set sync failure rate", source: "pending-sync + analytics" },
  { id: "continuity_reschedule_rate", label: "Continuity reschedule rate", source: "continuity RESCHEDULE_SESSION" },
];

export function getCoachTrainingOverview(flags: ReviewFlag[]) {
  const ordered = [...flags].sort((left, right) => {
    const rank = { safety: 0, high: 1, normal: 2 };
    return rank[left.severity] - rank[right.severity];
  });
  return {
    has_open_review: ordered.some((item) => item.open),
    highest: ordered[0] ?? null,
    flags: ordered,
  };
}
