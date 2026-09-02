import { NUTRITION_STRATEGY_VERSION } from "./constants";
import type { NutritionDecisionReason, NutritionDecisionTrace, NutritionDecisionTraceEntry } from "./types";

export function buildDecisionTrace(input: {
  reason: NutritionDecisionReason;
  target_id?: string;
  assignment_id?: string;
  entries?: NutritionDecisionTraceEntry[];
}): NutritionDecisionTrace {
  return {
    reason: input.reason,
    strategy_version: NUTRITION_STRATEGY_VERSION,
    target_id: input.target_id,
    assignment_id: input.assignment_id,
    entries: input.entries ?? [],
    created_at: new Date().toISOString(),
  };
}
