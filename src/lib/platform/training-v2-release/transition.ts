/**
 * Phase 12 — documents the existing exclusive runtime lane.
 * Not a new engine. Paid assigned snapshots use V2; free preview stays isolated.
 */
export type TrainingRuntimeLane = "V2_ACTIVE" | "LEGACY_FREE_PREVIEW";

export function resolveTrainingRuntimeLane(hasWorkoutProgram: boolean): TrainingRuntimeLane {
  return hasWorkoutProgram ? "V2_ACTIVE" : "LEGACY_FREE_PREVIEW";
}

export const V2_TRANSITION_POLICY = {
  when_v2_becomes_canonical: "Paid assigned program (`features.workout_program`) sets runtimeMode=v2.",
  historical_data_used: "Canonical workout_set_logs + workout_sessions. Missing fields stay null; engines drop confidence.",
  fallback: "V2_FALLBACK_LEGACY_PRESCRIPTION / INSUFFICIENT_DATA / CALIBRATION_REQUIRED. Never mix +10% with Double Progression.",
  legacy_free: "Free preview only. getSetProgression +10% and catalog suggested_weight_kg stay on that lane.",
  dual_engine: "Impossible in one session: runtimeMode is exclusive.",
} as const;
