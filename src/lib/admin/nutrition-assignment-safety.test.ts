import { readFileSync } from "node:fs";
import { join } from "node:path";
import { allergenOverlap, scaleMacros } from "../platform/nutrition-assignment";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const migration = readFileSync(
  join(root, "supabase/migrations/20260820250000_client_nutrition_assignments.sql"),
  "utf8",
);

assert(migration.includes("client_nutrition_assignments"), "assignment table");
assert(migration.includes("client_nutrition_slots"), "frozen slots table");
assert(migration.includes("client_nutrition_meal_logs"), "completion logs");
assert(migration.includes("_copy_meals_to_nutrition_assignment"), "atomic meal copy");
assert(migration.includes("admin_assign_client_nutrition"), "assign RPC");
assert(migration.includes("p_replace"), "replacement is explicit");
assert(migration.includes("client_nutrition_replaced"), "replace audit");
assert(migration.includes("client_nutrition_assigned"), "assign audit");
assert(migration.includes("client_nutrition_ended") || migration.includes("client_meal_replaced"), "end/replace meal audit");
assert(migration.includes("client_meal_portion_updated"), "portion audit");
assert(migration.includes("stale_update"), "concurrency");
assert(migration.includes("client_get_my_nutrition_runtime"), "client runtime RPC");
assert(migration.includes("meal_not_assignable"), "archived/unpublished meals blocked");
assert(migration.includes("active_nutrition_exists"), "silent replace blocked");
assert(migration.includes("_require_admin"), "admin mutations gated");
assert(migration.includes("REVOKE ALL ON FUNCTION public.admin_assign_client_nutrition"), "anon cannot assign");
assert(migration.includes("GRANT EXECUTE ON FUNCTION public.client_get_my_nutrition_runtime"), "client can read own runtime");
assert(migration.includes("source_external_id = client_nutrition_meal_logs.source_external_id"), "logs keep original meal on update");
assert(migration.includes("client_nutrition_assignments_one_active"), "one active plan per client");
assert(migration.includes("UNIQUE (assignment_id, slot_key)"), "one meal per slot");
assert(!/CREATE TABLE[\s\S]*admin_client_meals/.test(migration), "no parallel admin_client_meals");
assert(!migration.includes("admin_nutrition_library"), "no parallel admin nutrition library");
assert(migration.includes("FOR SELECT TO authenticated"), "client can read own snapshot");
assert(migration.includes("GRANT SELECT ON public.client_nutrition_slots TO authenticated"), "select only on snapshot slots");
assert(!migration.includes("GRANT SELECT, INSERT, UPDATE ON public.client_nutrition_meal_logs"), "clients do not get direct log DML");
assert(migration.includes("calories = v_meal.calories"), "substitution copies current library into client snapshot");
assert(migration.includes("source_meal_id UUID REFERENCES public.meals(id) ON DELETE SET NULL"), "archived library meal does not delete assignment");

const snapshotCalories = scaleMacros({ calories: 500, protein_g: 40, carbs_g: 50, fat_g: 20, servings: 1 });
const laterLibraryCalories = 900;
assert(snapshotCalories.calories !== laterLibraryCalories, "library mutation later does not equal frozen snapshot");

assert(allergenOverlap(["peanut"], ["peanut"]).length > 0, "conflict is visible");
assert(allergenOverlap(["peanut"], ["shellfish"]).length === 0, "unrelated allergen is not a conflict");

const browser = readFileSync(join(root, "src/integrations/supabase/client.ts"), "utf8");
assert(!browser.includes("SERVICE_ROLE"), "no service_role in browser");

const clientFiles = [
  "src/routes/_platform/app/nutrition/index.tsx",
  "src/routes/_platform/app/nutrition/meal.tsx",
  "src/routes/_platform/app/nutrition/alternatives.tsx",
  "src/lib/platform/assigned-nutrition-api.ts",
  "src/hooks/useAssignedNutritionRuntime.ts",
  "src/hooks/useNutritionPlan.ts",
];
for (const file of clientFiles) {
  const source = readFileSync(join(root, file), "utf8");
  assert(!source.includes("admin_assign_client_nutrition"), `${file} cannot assign`);
  assert(!source.includes("admin_save_client_nutrition_slots"), `${file} cannot mutate assignment structure`);
  assert(!source.includes("service_role"), `${file} has no service_role`);
  assert(!source.includes("from \"@/components/admin"), `${file} does not import admin UI`);
}

const copy = readFileSync(join(root, "src/lib/platform/assigned-nutrition-api.ts"), "utf8");
assert(copy.includes("scaleMacros(slot)"), "default meal macros come from snapshot+servings");
assert(!copy.includes("library?.calories"), "library calories are not the assigned default");

console.log("nutrition-assignment-safety tests passed");
