export type ReadinessAnalyticsEvent =
  | "readiness_check_viewed"
  | "readiness_check_submitted"
  | "readiness_check_skipped"
  | "readiness_check_dismissed"
  | "readiness_check_reopened"
  | "readiness_adjustment_viewed"
  | "readiness_adjustment_accepted"
  | "readiness_adjustment_declined";

export const READINESS_ANALYTICS_EVENT = "hakim:analytics";

type ReadinessAnalyticsPayload = {
  event: ReadinessAnalyticsEvent;
  readiness_level?: "ready" | "balanced" | "recovery";
};

/**
 * Uses the existing in-app event bus only. Never send raw energy/sleep/pain values.
 */
export function trackReadinessEvent(
  event: ReadinessAnalyticsEvent,
  extra?: Pick<ReadinessAnalyticsPayload, "readiness_level">,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(READINESS_ANALYTICS_EVENT, {
      detail: {
        event,
        ...(extra?.readiness_level ? { readiness_level: extra.readiness_level } : {}),
      } satisfies ReadinessAnalyticsPayload,
    }),
  );
}
