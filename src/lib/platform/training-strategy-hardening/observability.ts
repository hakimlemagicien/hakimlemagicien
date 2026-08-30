import { canonicalErrorCode } from "./error-taxonomy";

export type TrainingStrategyObservabilityEvent = {
  scope: "strategy" | "assignment" | "override" | "runtime";
  action: string;
  clientId?: string | null;
  assignmentId?: string | null;
  assignmentMode?: string | null;
  poolVersion?: string | null;
  strategyVersion?: string | null;
  validationStatus?: string | null;
  changeSource?: "COACH_OVERRIDE" | "SYSTEM_ADAPTATION" | "COACH_REQUEST" | null;
  blockingReasons?: string[];
  stale?: boolean;
};

/**
 * Safe structured logging — no tokens, passwords, or full profile payloads.
 */
export function logTrainingStrategyEvent(
  event: TrainingStrategyObservabilityEvent,
): void {
  const payload = {
    ...event,
    blockingReasons: event.blockingReasons?.map(canonicalErrorCode),
    ts: new Date().toISOString(),
  };
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[training-strategy]", JSON.stringify(payload));
  }
}
