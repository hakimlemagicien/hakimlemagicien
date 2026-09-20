import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  setMealLibraryCatalog,
  type MealLibraryRecord,
} from "../src/lib/platform/meal-library";
import {
  isFailClosed,
  resolveNutritionDay,
  type ClientNutritionProfile,
  type NutritionTarget,
} from "../src/lib/platform/nutrition-strategy";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const readEnv = (name: string) => {
  const match = env.match(new RegExp(`^${name}=(.*)$`, "m"));
  if (!match) throw new Error(`Missing ${name}`);
  return match[1]!.trim().replace(/^['\"]|['\"]$/g, "");
};
const url = readEnv("VITE_SUPABASE_URL");
const projectRef = new URL(url).hostname.split(".")[0]!;
const keys = JSON.parse(
  execFileSync(
    "supabase",
    ["projects", "api-keys", "--project-ref", projectRef, "--output", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ),
) as Array<{ name: string; type: string; api_key: string }>;
const serviceKey = keys.find((item) => item.name === "service_role" && item.type === "legacy")?.api_key;
if (!serviceKey) throw new Error("Production service key unavailable");
const db = createClient(url, serviceKey, { auth: { persistSession: false } });
const { data, error } = await db
  .from("meals")
  .select("*,meal_ingredients(*)")
  .eq("is_active", true)
  .order("sort_order");
if (error) throw error;

const num = (value: unknown) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const catalog = (data ?? []).map((row): MealLibraryRecord => ({
  external_id: row.external_id,
  name_ar: row.name_ar,
  name_en: row.name_en,
  description_ar: row.description_ar ?? "",
  description_en: row.description_en ?? "",
  meal_type: row.meal_type,
  suitable_goals: row.suitable_goals ?? [],
  dietary_tags: row.dietary_tags ?? [],
  allergens: row.allergens ?? [],
  calories: num(row.calories),
  protein_g: num(row.protein_g),
  carbs_g: num(row.carbs_g),
  fat_g: num(row.fat_g),
  serving_size: num(row.serving_size),
  serving_unit: row.serving_unit,
  yield_servings: num(row.yield_servings),
  ingredients: [...(row.meal_ingredients ?? [])]
    .sort((a, b) => num(a.ingredient_order) - num(b.ingredient_order))
    .map((ingredient) => ({
      ingredient_order: num(ingredient.ingredient_order),
      ingredient_key: ingredient.ingredient_key,
      name_en: ingredient.name_en,
      name_ar: ingredient.name_ar,
      quantity: num(ingredient.quantity),
      unit: ingredient.unit,
      kcal: num(ingredient.kcal),
      protein_g: num(ingredient.protein_g),
      carbs_g: num(ingredient.carbs_g),
      fat_g: num(ingredient.fat_g),
      source: ingredient.source ?? "",
      source_query_url: ingredient.source_query_url ?? "",
    })),
  preparation_steps_ar: row.preparation_steps_ar ?? [],
  preparation_steps_en: row.preparation_steps_en ?? [],
  preparation_time_minutes: row.preparation_time_minutes ?? 0,
  image: {
    reference: row.image_path ?? `images/${row.external_id}.png`,
    status: row.image_status,
    alt_ar: row.image_alt_ar ?? row.name_ar,
    alt_en: row.image_alt_en ?? row.name_en,
  },
  image_status: row.image_status,
  status: row.status,
  review_status: row.review_status ?? "",
  notes: row.notes ?? "",
  substitution_profile: row.substitution_profile ?? {},
  qa: row.qa ?? {},
}));
setMealLibraryCatalog(catalog);

const profile: ClientNutritionProfile = {
  gender: "male",
  age: 28,
  weight_kg: 72,
  height_cm: 180,
  activity_level: "very_active",
};
const target: NutritionTarget = {
  id: "production-target",
  version: 1,
  calories: 3488,
  protein_g: 129.6,
  carbs_g: 501.7,
  fat_g: 107,
  reference_weight_kg: 72,
  nutrition_objective: "MUSCLE_GAIN",
  goal_context: "MUSCLE_GAIN",
  target_source: "ENGINE_APPROVED",
  strategy_version: "nutrition-strategy-v1",
  target_created_at: "2026-09-20T00:00:00Z",
  target_reason: "ENGINE_INITIAL_TARGET",
  review_required: false,
};
const result = resolveNutritionDay({
  client_goal: "MUSCLE_GAIN",
  profile,
  approved_target: target,
  day_context: {
    day_type: "TRAINING_DAY",
    training_time: "EVENING",
    session_time: "18:00",
    force_six_meals: true,
  },
  allergies: { status: "CONFIRMED_NONE", confirmed_at: "2026-09-20T00:00:00Z" },
});
if (isFailClosed(result)) throw new Error(`${result.code}: ${result.message}`);
console.log(JSON.stringify({
  catalog_count: catalog.length,
  target,
  actual: result.planned_totals,
  validation: result.validation_result,
  meals: result.assigned_meals.map((meal) => ({
    slot_key: meal.slot_key,
    external_id: meal.external_id,
    name_ar: meal.meal.name_ar,
    servings: meal.servings,
  })),
}, null, 2));
