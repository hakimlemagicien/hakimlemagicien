export const TRAINING_ANALYTICS_EVENT = "hakim:analytics";

export const TRAINING_ANALYTICS_EVENTS = [
  "training_program_viewed",
  "workout_started",
  "workout_resumed",
  "workout_completed",
  "workout_partial",
  "set_completed",
  "set_skipped",
  "set_sync_failed",
  "calibration_started",
  "calibration_completed",
  "progression_applied",
  "volume_adaptation_applied",
  "recovery_hold_applied",
  "deload_review_triggered",
  "reconditioning_started",
  "session_rescheduled",
  "goal_response_updated",
  "program_regenerated",
  "program_validation_failed",
  "progress_viewed",
  "v2_fallback_legacy_prescription",
  "insufficient_data",
  "exercise_metadata_required",
  "goal_mapping_required",
  "program_generation_blocked",
  "pending_shared_contract",
] as const;

export type TrainingAnalyticsEvent = (typeof TRAINING_ANALYTICS_EVENTS)[number];

const PII_KEYS = ["email", "name", "full_name", "phone", "notes", "health_notes"];

export function sanitizeAnalyticsProps(props: Record<string, unknown> | undefined) {
  const next: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(props ?? {})) {
    if (PII_KEYS.includes(key) || key.includes("email") || key.includes("note")) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      next[key] = value;
    }
  }
  return next;
}

export function trackTrainingEvent(event: TrainingAnalyticsEvent, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TRAINING_ANALYTICS_EVENT, {
      detail: { event, ...sanitizeAnalyticsProps(props) },
    }),
  );
}
