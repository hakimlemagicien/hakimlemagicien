/**
 * Legacy program_goal (cut|bulk|fitness|recomp) compatibility with Primary Strategy.
 * Does not expand/rename the DB enum in Phase 2 — metadata carries the rich identity.
 */

import type { PrimaryTrainingStrategy } from "./primary-strategy";

export const LEGACY_PROGRAM_GOALS = ["cut", "bulk", "fitness", "recomp"] as const;
export type LegacyProgramGoal = (typeof LEGACY_PROGRAM_GOALS)[number];

export function isLegacyProgramGoal(value: unknown): value is LegacyProgramGoal {
  return typeof value === "string" && (LEGACY_PROGRAM_GOALS as readonly string[]).includes(value);
}

/** Best-effort Primary Strategy → legacy column for existing filters/RPCs. */
export function legacyProgramGoalFromPrimaryStrategy(
  strategy: PrimaryTrainingStrategy,
): LegacyProgramGoal {
  switch (strategy) {
    case "FAT_LOSS":
      return "cut";
    case "MUSCLE_GAIN":
    case "STRENGTH":
      return "bulk";
    case "BODY_RECOMPOSITION":
    case "GLUTE_FOCUS":
      return "recomp";
    case "GENERAL_FITNESS":
    case "ATHLETIC_PERFORMANCE":
    case "ENDURANCE":
    case "MOBILITY_FUNCTIONAL":
    case "HEALTHY_AGING_ACTIVE_LIFE":
      return "fitness";
  }
}

/** Legacy column → default Primary Strategy (lossy; prefer metadata.primary_strategy). */
export function primaryStrategyFromLegacyProgramGoal(
  goal: LegacyProgramGoal,
): PrimaryTrainingStrategy {
  switch (goal) {
    case "cut":
      return "FAT_LOSS";
    case "bulk":
      return "MUSCLE_GAIN";
    case "recomp":
      return "BODY_RECOMPOSITION";
    case "fitness":
      return "GENERAL_FITNESS";
  }
}
