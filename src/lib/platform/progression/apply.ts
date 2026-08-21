import type { LoadSource } from "@/lib/platform/prescription/types";
import type { NextSessionProgression } from "./types";

export const LOAD_SOURCE_PRECEDENCE = [
  "COACH_OVERRIDE",
  "PROGRESSION_DECISION",
  "RECENT_HISTORY",
  "CALIBRATION",
  "LEGACY_FALLBACK",
] as const;

export function applyProgressionToLoad(input: {
  progression: NextSessionProgression | null | undefined;
  historyLoad: number | null;
  coachProtected?: boolean;
  coachLoad?: number | null;
}): { prescribed_load: number | null; load_source: LoadSource | null } {
  if (input.coachProtected) {
    return {
      prescribed_load: input.coachLoad ?? input.historyLoad,
      load_source: "USER_AVAILABLE_LOAD",
    };
  }
  if (!input.progression) {
    return {
      prescribed_load: input.historyLoad,
      load_source: input.historyLoad != null ? "RECENT_HISTORY" : "UNKNOWN_REQUIRES_CALIBRATION",
    };
  }
  if (
    input.progression.action === "INCREASE_LOAD" ||
    input.progression.action === "DECREASE_LOAD"
  ) {
    return {
      prescribed_load: input.progression.next_load,
      load_source:
        input.progression.next_load != null
          ? "PROGRESSION_DECISION"
          : "UNKNOWN_REQUIRES_CALIBRATION",
    };
  }
  return {
    prescribed_load: input.progression.next_load ?? input.historyLoad,
    load_source:
      input.progression.next_load != null || input.historyLoad != null
        ? "RECENT_HISTORY"
        : "UNKNOWN_REQUIRES_CALIBRATION",
  };
}
