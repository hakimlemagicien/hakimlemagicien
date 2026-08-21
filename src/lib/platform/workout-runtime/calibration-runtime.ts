import type { CalibrationAction } from "@/lib/platform/prescription/types";

export const DEFAULT_LOADED_INCREMENT_KG = 2.5;

export function nextLoadAfterCalibration(input: {
  action: CalibrationAction;
  currentLoad: number | null;
  incrementKg: number | null;
}): { load: number | null; autoApplied: boolean } {
  const current = input.currentLoad;
  const increment = input.incrementKg;
  if (input.action === "SAFETY_REVIEW") {
    return { load: current, autoApplied: false };
  }
  if (input.action === "KEEP" || input.action === "RECALIBRATE") {
    return { load: current, autoApplied: false };
  }
  if (input.action === "SMALL_INCREASE") {
    if (current != null && increment != null && increment > 0) {
      return { load: current + increment, autoApplied: true };
    }
    return { load: current, autoApplied: false };
  }
  if (input.action === "REDUCE") {
    if (current != null && increment != null && increment > 0 && current > increment) {
      return { load: current - increment, autoApplied: true };
    }
    return { load: current, autoApplied: false };
  }
  return { load: current, autoApplied: false };
}

export function usesLegacyTenPercentProgression(runtimeMode: "v2" | "legacy_free"): boolean {
  return runtimeMode === "legacy_free";
}
