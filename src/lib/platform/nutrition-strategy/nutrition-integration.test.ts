import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPartialConsumptionEvent,
  buildStrategyAssignmentPayload,
  buildStrategyReplacementPayload,
  buildStrategySwapPayload,
  computeConsumedTotals,
  consumptionStatusFromLog,
  detectAssignmentSchema,
  isFailClosed,
  legacyPlannedTotalsFromSlots,
  resolveNutritionDay,
} from "./index";
import { findContractAlternatives } from "../meal-library";
import { computeNutritionTarget } from "./target-engine";

const ROOT = process.cwd();
const M4 = readFileSync(
  join(ROOT, "supabase/migrations/20260902130000_nutrition_v1_strategy_rpcs.sql"),
  "utf8",
);

for (const fn of [
  "nutrition_create_target",
  "admin_generate_client_nutrition",
  "nutrition_apply_swap",
  "client_get_my_nutrition_runtime",
  "client_log_nutrition_meal",
]) {
  assert(M4.includes(`FUNCTION public.${fn}`), `M4 defines ${fn}`);
}

const PROFILE = {
  gender: "female" as const,
  age: 30,
  weight_kg: 68,
  height_cm: 165,
  activity_level: "moderate" as const,
  body_fat_category: "moderate" as const,
  lean_mass_focus: false,
  recomposition_signal: true,
};

const ALLERGY_OK = { status: "CONFIRMED_NONE" as const, confirmed_at: new Date().toISOString() };
const DAY = { day_type: "TRAINING_DAY" as const, training_time: "EVENING" as const, session_time: "18:00" };

// A. Create target payload (orchestrator includes target block)
const assignmentPayload = buildStrategyAssignmentPayload({
  client_goal: "FAT_LOSS",
  profile: { ...PROFILE, gender: "male", body_fat_category: undefined },
  day_context: DAY,
  allergies: ALLERGY_OK,
});
assert(!isFailClosed(assignmentPayload), "A: assignment payload builds");
assert.ok(assignmentPayload.target.calories > 0, "A: target in payload");

// B. Generate Strategy V1 assignment structure
assert.equal(assignmentPayload.validation_status !== "INVALID", true, "B: validation not INVALID");
assert.ok(assignmentPayload.slots.length >= 4, "B: dynamic slots present");

// C. Persist dynamic slots shape
assert.ok(assignmentPayload.slots.every((s) => s.slot_key && s.source_external_id), "C: slot persist shape");

const targetForDay = computeNutritionTarget({
  profile: { ...PROFILE, gender: "male" },
  nutrition_objective: "FAT_LOSS",
  goal_context: "FAT_LOSS",
});
if ("code" in targetForDay) throw new Error("target failed");
const dayWithTarget = resolveNutritionDay({
  client_goal: "FAT_LOSS",
  profile: { ...PROFILE, gender: "male" },
  approved_target: targetForDay,
  day_context: DAY,
  allergies: ALLERGY_OK,
});

// D. SATISFIED_BY without double counting
assert(!isFailClosed(dayWithTarget), "day resolves with target");
const countable = dayWithTarget.assigned_meals.filter((m) => {
  const slot = dayWithTarget.ordered_slots.find((s) => s.slot_key === m.slot_key);
  return slot?.counts_toward_day_totals;
});
const legacyPlanned = legacyPlannedTotalsFromSlots(
  countable.map((m) => ({
    calories: m.macros.calories,
    protein_g: m.macros.protein_g,
    carbs_g: m.macros.carbs_g,
    fat_g: m.macros.fat_g,
    servings: 1,
  })),
);
assert.ok(legacyPlanned.calories <= dayWithTarget.planned_totals.calories + 50, "D: no double count");

// E/F. Runtime schema detection
assert.equal(
  detectAssignmentSchema({ slot_keys: ["breakfast", "snack", "lunch", "dinner"] }),
  "LEGACY_4_SLOT",
  "F: legacy schema",
);
assert.equal(
  detectAssignmentSchema({
    schema_version: "STRATEGY_V1_DYNAMIC",
    target_id: "t1",
    slot_keys: ["breakfast", "lunch", "pre_workout", "dinner"],
  }),
  "STRATEGY_V1_DYNAMIC",
  "E: strategy schema",
);

// G/H. Swap payloads
if (!isFailClosed(dayWithTarget)) {
  const lunch = dayWithTarget.assigned_meals.find((m) => m.slot_key === "lunch");
  if (lunch) {
    const alts = findContractAlternatives(lunch.meal).slice(0, 8);
    const swapResults = alts.map((alt) =>
      buildStrategySwapPayload({
        day: dayWithTarget,
        target: targetForDay,
        slot_key: "lunch",
        to_external_id: alt.external_id,
        allergy: ALLERGY_OK,
        day_context: DAY,
      }),
    );
    assert(
      swapResults.every((result) => (isFailClosed(result) ? result.code === "SWAP_NOT_ALLOWED" : true)),
      "G: swap orchestrator is fail-closed only",
    );

    const invalidSwap = buildStrategySwapPayload({
      day: dayWithTarget,
      target: targetForDay,
      slot_key: "lunch",
      to_external_id: "MEAL-999-INVALID",
      allergy: ALLERGY_OK,
      day_context: DAY,
    });
    assert(isFailClosed(invalidSwap), "H: invalid swap rejected");
  }
}

// I. Partial consumption
const partial = buildPartialConsumptionEvent({
  slot_key: "lunch",
  source_external_id: "MEAL-056",
  planned_servings: 1,
  consumed_servings: 0.5,
  macros_per_serving: { calories: 400, protein_g: 30, carbs_g: 40, fat_g: 10 },
  session_date: "2026-09-02",
});
assert.equal(partial.status, "PARTIAL", "I: partial consumption");
assert.equal(consumptionStatusFromLog({ has_log_row: false }), "NOT_LOGGED");
assert.notEqual(consumptionStatusFromLog({ has_log_row: true, status: "skipped" }), "NOT_LOGGED");

// J. UNKNOWN allergy fail-closed
const unknown = buildStrategyAssignmentPayload({
  client_goal: "FAT_LOSS",
  profile: { ...PROFILE, gender: "male" },
  day_context: DAY,
  allergies: { status: "UNKNOWN" },
});
assert(isFailClosed(unknown) && unknown.code === "ALLERGY_STATUS_REQUIRED", "J: allergy fail-closed");

// K. New assignment version payload preserves previous id reference
const replacement = buildStrategyReplacementPayload({
  client_goal: "FAT_LOSS",
  profile: { ...PROFILE, gender: "male", body_fat_category: undefined },
  day_context: DAY,
  allergies: ALLERGY_OK,
  previous_assignment_id: "assign-old-1",
});
assert(!isFailClosed(replacement));
assert.equal(replacement.replaces_assignment_id, "assign-old-1", "K: version chain metadata");

// L. Decision trace in payload
assert.equal(assignmentPayload.decision_trace.reason, "INITIAL_ASSIGNMENT", "L: decision trace");

// Consumed totals from events only
const consumed = computeConsumedTotals([partial]);
assert.ok(consumed.calories > 0 && consumed.calories < 400);

const workspace = readFileSync(join(ROOT, "src/components/admin/ClientNutritionWorkspace.tsx"), "utf8");
const nutritionPlan = readFileSync(join(ROOT, "src/hooks/useNutritionPlan.ts"), "utf8");
assert(nutritionPlan.includes("applyNutritionMealSwap"), "client strategy swap wiring");
assert(nutritionPlan.includes("STRATEGY_V1_DYNAMIC"), "client detects strategy schema for swap");
assert(workspace.includes("generateAdminStrategyNutrition"), "admin strategy wiring");
assert(workspace.includes("buildStrategyAssignmentPayload"), "admin uses orchestrator");

console.log("nutrition-integration.test.ts: all assertions passed");
