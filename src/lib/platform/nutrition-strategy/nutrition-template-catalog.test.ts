import { readFileSync } from "node:fs";
import { join } from "node:path";
import { strict as assert } from "node:assert";
import { buildStrategyAssignmentPayload } from "./assignment-orchestrator";
import { resolveNutritionGoalProfile } from "./goal-profile-resolver";
import {
  NUTRITION_TEMPLATE_BUCKETS,
  NUTRITION_TEMPLATE_GOAL_OPTIONS,
  dayContextForTrainingMealWindow,
  isConservativePostWorkoutMeal,
  isConservativePreWorkoutMeal,
  slotOrderForTrainingMealWindow,
  templateBucketFromObjective,
} from "./nutrition-template-contract";
import { getMealByExternalId } from "../meal-library";

const root = process.cwd();
const profile = {
  gender: "male" as const,
  age: 32,
  weight_kg: 82,
  height_cm: 180,
  activity_level: "moderate" as const,
  body_fat_category: "moderate" as const,
};
const allergy = { status: "CONFIRMED_NONE" as const, confirmed_at: "2026-09-17T00:00:00Z" };

assert.deepEqual(NUTRITION_TEMPLATE_BUCKETS, ["FAT_LOSS", "MUSCLE_GAIN", "MAINTENANCE"]);
assert.equal(Object.keys(NUTRITION_TEMPLATE_GOAL_OPTIONS).length, 12);
assert.deepEqual(slotOrderForTrainingMealWindow("after_lunch"), [
  "breakfast",
  "lunch",
  "pre_workout",
  "post_workout",
  "snack",
  "dinner",
]);

for (const goal of [
  "FAT_LOSS",
  "MUSCLE_GAIN",
  "BODY_RECOMPOSITION",
  "GLUTE_GROWTH",
  "MOBILITY_RECOVERY",
] as const) {
  const resolved = resolveNutritionGoalProfile({ clientGoal: goal, profile });
  assert.ok(!("code" in resolved), `${goal} resolves`);
  if ("code" in resolved) continue;
  assert.ok(
    NUTRITION_TEMPLATE_GOAL_OPTIONS[goal].includes(
      templateBucketFromObjective(resolved.nutrition_objective),
    ),
  );

  const payload = buildStrategyAssignmentPayload({
    client_goal: goal,
    profile,
    day_context: dayContextForTrainingMealWindow("after_lunch"),
    allergies: allergy,
  });
  assert.ok(!("code" in payload), `${goal} generates`);
  if ("code" in payload) continue;
  assert.equal(payload.slots.length, 6, `${goal}: six slots`);
  const cycle = payload.resolved_snapshot.seven_day_cycle as Array<{
    slots: Array<{
      slot_key: string;
      source_external_id: string;
      meal_snapshot?: { name_ar?: string };
    }>;
  }>;
  assert.equal(cycle.length, 7, `${goal}: seven-day persisted snapshot`);
  for (const day of cycle) {
    assert.equal(day.slots.length, 6);
    for (const slot of day.slots) {
      const meal = getMealByExternalId(slot.source_external_id);
      assert.ok(meal, `${slot.source_external_id} exists`);
      if (!meal) continue;
      assert.equal(
        slot.meal_snapshot?.name_ar,
        meal.name_ar,
        "cycle persists an immutable meal snapshot",
      );
      if (slot.slot_key === "breakfast") assert.equal(meal.meal_type, "breakfast");
      if (slot.slot_key === "pre_workout") assert.ok(isConservativePreWorkoutMeal(meal));
      if (slot.slot_key === "post_workout") assert.ok(isConservativePostWorkoutMeal(meal));
    }
  }
}

const migration = readFileSync(
  join(root, "supabase/migrations/20260917140000_nutrition_template_catalog_v1.sql"),
  "utf8",
);
const hardening = readFileSync(
  join(root, "supabase/migrations/20260917141000_nutrition_template_catalog_hardening.sql"),
  "utf8",
);
const ui = readFileSync(join(root, "src/components/admin/NutritionTemplateCatalog.tsx"), "utf8");
const assigner = readFileSync(
  join(root, "src/lib/admin/admin-nutrition-strategy-assign.ts"),
  "utf8",
);
const preferencesMigration = readFileSync(
  join(root, "supabase/migrations/20260918100000_nutrition_preferences_first.sql"),
  "utf8",
);
const adminTrainingWindowMigration = readFileSync(
  join(root, "supabase/migrations/20260918102000_admin_nutrition_training_window.sql"),
  "utf8",
);
const safetySetup = readFileSync(
  join(root, "src/components/platform/customer-journey/NutritionSafetySetup.tsx"),
  "utf8",
);
assert.ok(
  migration.includes("source_nutrition_template_version"),
  "assignment stores immutable source version",
);
assert.ok(migration.includes("TRAINING_TIME_REQUIRED"), "missing training time fails closed");
assert.ok(
  hardening.includes("_nutrition_template_validate_curated_plan"),
  "curated 7x6 is validated server-side",
);
assert.ok(
  hardening.includes("goal_strategy_bucket_mismatch"),
  "official mapping is server-enforced",
);
assert.ok(
  ui.includes("تعيين كمسودة") && ui.includes("تعيين ونشر"),
  "template assignment exposes draft/publish",
);
assert.ok(
  ui.includes("خطة 7 أيام") && ui.includes("MealPicker"),
  "mobile 7-day editor and meal picker exist",
);
assert.ok(
  assigner.includes("applyCuratedTemplate") && assigner.includes("curated_plan_preserved"),
  "curated assignment preserves the approved 7-day plan",
);
assert.ok(
  ui.includes("adminMealImageSource") && ui.includes("صورة"),
  "meal picker presents visual meal choices",
);
assert.ok(
  ui.includes("setAdminClientNutritionPreferences") && ui.includes("أطعمة لا يحبها"),
  "assignment sheet resolves safety preferences inline",
);
assert.ok(
  preferencesMigration.includes("client_set_my_nutrition_preferences") &&
    preferencesMigration.includes("disliked_foods"),
  "preferences persist server-side",
);
assert.ok(
  safetySetup.indexOf("هل لديك أي حساسية غذائية؟") < safetySetup.indexOf("هل توجد أطعمة لا تحبها؟"),
  "allergy question precedes disliked-food question",
);
assert.ok(
  adminTrainingWindowMigration.includes("admin_set_client_nutrition_training_window"),
  "admin can safely complete training meal timing",
);
assert.ok(
  assigner.includes("getAdminClientNutritionTrainingWindow"),
  "admin assignment reads protected timing through an admin RPC",
);

console.log("nutrition-template-catalog.test: OK");
