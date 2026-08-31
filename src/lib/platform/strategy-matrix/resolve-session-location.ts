import type { TrainingStrategyLocation } from "./types";

export type SessionLocationSemantics = "GYM" | "HOME" | "FLEXIBLE";

/**
 * Maps client training-location capability to per-session location semantics.
 * BOTH / UNKNOWN → FLEXIBLE (no invented per-day HOME/GYM assignment).
 */
export function resolveSessionLocationSemantics(
  trainingLocation: TrainingStrategyLocation,
): SessionLocationSemantics {
  if (trainingLocation === "GYM") return "GYM";
  if (trainingLocation === "HOME") return "HOME";
  return "FLEXIBLE";
}
