import type { ProgressionAutomationScope, ProgressionStrategy } from "./types";

export function automationScopeFor(strategy: ProgressionStrategy): ProgressionAutomationScope {
  if (strategy === "COACH_MANAGED") {
    return {
      load: "COACH",
      reps: "COACH",
      sets: "COACH",
      rest: "COACH",
      exercises: "COACH",
    };
  }
  return {
    load: "AUTO",
    reps: "AUTO",
    sets: "COACH",
    rest: "COACH",
    exercises: "COACH",
  };
}

export function shouldAutoApplyProgression(strategy: ProgressionStrategy): boolean {
  return strategy !== "COACH_MANAGED";
}
