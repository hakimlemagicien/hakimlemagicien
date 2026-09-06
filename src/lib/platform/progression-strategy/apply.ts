import { applyProgressionToLoad } from "@/lib/platform/progression/apply";
import type { NextSessionProgression } from "@/lib/platform/progression/types";
import { shouldAutoApplyProgression } from "./scope";
import {
  AUTO_LOAD_ACTIONS,
  AUTO_REP_ACTIONS,
  EXERCISE_CHANGE_ACTIONS,
  type ProgressionApplyPatch,
  type ProgressionExerciseInput,
  type ProgressionStrategy,
} from "./types";

export function isExerciseChangeAction(action: NextSessionProgression["action"]): boolean {
  return EXERCISE_CHANGE_ACTIONS.includes(action);
}

export function lockExerciseIdentity(progression: NextSessionProgression): NextSessionProgression {
  if (!isExerciseChangeAction(progression.action)) return progression;
  return {
    ...progression,
    action: "KEEP_LOAD",
    next_load: progression.current_load,
    load_increase_eligible: false,
  };
}

export function progressionForRuntime(
  strategy: ProgressionStrategy,
  progression: NextSessionProgression | null,
): NextSessionProgression | null {
  if (!shouldAutoApplyProgression(strategy) || !progression) return null;
  if (strategy === "SMART_PROGRESSION_EXERCISE_LOCKED") return lockExerciseIdentity(progression);
  return progression;
}

export function applyAllowedPrescription(
  strategy: ProgressionStrategy,
  exercise: ProgressionExerciseInput,
  progression: NextSessionProgression | null,
): ProgressionApplyPatch {
  const locked = progressionForRuntime(strategy, progression);
  const load = applyProgressionToLoad({
    progression: locked,
    historyLoad: exercise.suggested_weight_kg,
    coachProtected: strategy === "COACH_MANAGED",
    coachLoad: exercise.suggested_weight_kg,
  });
  const nextLoad =
    locked && AUTO_LOAD_ACTIONS.includes(locked.action) ? load.prescribed_load : exercise.suggested_weight_kg;
  const canReps = Boolean(locked && AUTO_REP_ACTIONS.includes(locked.action) && shouldAutoApplyProgression(strategy));
  const nextRepMin = canReps ? locked?.next_rep_min ?? exercise.reps_min : exercise.reps_min;
  const nextRepMax = canReps ? locked?.next_rep_max ?? exercise.reps_max : exercise.reps_max;
  const changed: ProgressionApplyPatch["changed_fields"] = [];
  if (nextLoad !== exercise.suggested_weight_kg) changed.push("suggested_weight_kg");
  if (nextRepMin !== exercise.reps_min) changed.push("reps_min");
  if (nextRepMax !== exercise.reps_max) changed.push("reps_max");
  return {
    exercise_row_id: exercise.id,
    exercise_external_id: exercise.exercise_external_id,
    exercise_id: exercise.exercise_id,
    suggested_weight_kg: nextLoad,
    reps_min: nextRepMin,
    reps_max: nextRepMax,
    sets: exercise.sets,
    rest_seconds: exercise.rest_seconds,
    changed_fields: changed,
  };
}

export function assertExerciseIdentityPreserved(
  before: ProgressionExerciseInput,
  after: ProgressionApplyPatch,
): boolean {
  return after.exercise_external_id === before.exercise_external_id && after.exercise_id === before.exercise_id;
}
