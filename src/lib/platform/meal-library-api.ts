import { supabase } from "@/integrations/supabase/client";
import {
  setMealLibraryCatalog,
  getMealLibrarySeed,
  dbMealCatalogIsV2,
  type MealLibraryIngredient,
  type MealLibraryRecord,
  type MealSubstitutionProfile,
  type MealType,
} from "@/lib/platform/meal-library";
import { overlayMealCatalog } from "@/lib/platform/library-overlays";

export type MealLibrarySource = "supabase" | "json";

type MealRow = {
  external_id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  meal_type: MealType;
  suitable_goals: string[];
  dietary_tags: string[];
  allergens: string[];
  calories: number | string;
  protein_g: number | string;
  carbs_g: number | string;
  fat_g: number | string;
  serving_size: number | string;
  serving_unit: string;
  yield_servings: number | string;
  preparation_steps_ar: string[];
  preparation_steps_en: string[];
  preparation_time_minutes: number | null;
  image_master_path: string | null;
  image_status: string;
  image_alt_ar: string | null;
  image_alt_en: string | null;
  status: string;
  review_status: string | null;
  notes: string | null;
  substitution_profile: MealSubstitutionProfile | Record<string, unknown>;
  qa: MealLibraryRecord["qa"] | Record<string, unknown>;
  meal_ingredients: IngredientRow[] | null;
};

type IngredientRow = {
  ingredient_order: number | string;
  ingredient_key: string;
  name_en: string;
  name_ar: string;
  quantity: number | string;
  unit: string;
  kcal: number | string | null;
  protein_g: number | string | null;
  carbs_g: number | string | null;
  fat_g: number | string | null;
  source: string | null;
  source_query_url: string | null;
};

function num(value: number | string | null | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapIngredient(row: IngredientRow): MealLibraryIngredient {
  return {
    ingredient_order: num(row.ingredient_order),
    ingredient_key: row.ingredient_key,
    name_en: row.name_en,
    name_ar: row.name_ar,
    quantity: num(row.quantity),
    unit: row.unit,
    kcal: num(row.kcal),
    protein_g: num(row.protein_g),
    carbs_g: num(row.carbs_g),
    fat_g: num(row.fat_g),
    source: row.source ?? "",
    source_query_url: row.source_query_url ?? "",
  };
}

function mapMeal(row: MealRow): MealLibraryRecord {
  const ingredients = [...(row.meal_ingredients ?? [])]
    .sort((a, b) => num(a.ingredient_order) - num(b.ingredient_order))
    .map(mapIngredient);
  const imageRef = row.image_master_path || `images/${row.external_id}.png`;

  return {
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
    ingredients,
    preparation_steps_ar: row.preparation_steps_ar ?? [],
    preparation_steps_en: row.preparation_steps_en ?? [],
    preparation_time_minutes: row.preparation_time_minutes ?? 0,
    image: {
      reference: imageRef,
      status: row.image_status,
      alt_ar: row.image_alt_ar ?? row.name_ar,
      alt_en: row.image_alt_en ?? row.name_en,
    },
    image_status: row.image_status,
    status: row.status,
    review_status: row.review_status ?? "",
    notes: row.notes ?? "",
    substitution_profile: row.substitution_profile as MealSubstitutionProfile,
    qa: row.qa as MealLibraryRecord["qa"],
  };
}

export async function fetchMealLibraryFromSupabase(): Promise<MealLibraryRecord[]> {
  const { data, error } = await supabase
    .from("meals")
    .select(
      `
      external_id,
      name_ar,
      name_en,
      description_ar,
      description_en,
      meal_type,
      suitable_goals,
      dietary_tags,
      allergens,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      serving_size,
      serving_unit,
      yield_servings,
      preparation_steps_ar,
      preparation_steps_en,
      preparation_time_minutes,
      image_master_path,
      image_status,
      image_alt_ar,
      image_alt_en,
      status,
      review_status,
      notes,
      substitution_profile,
      qa,
      meal_ingredients (
        ingredient_order,
        ingredient_key,
        name_en,
        name_ar,
        quantity,
        unit,
        kcal,
        protein_g,
        carbs_g,
        fat_g,
        source,
        source_query_url
      )
    `,
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as unknown as MealRow[]).map(mapMeal);
}

async function fetchHiddenMealExternalIds(): Promise<string[]> {
  const { data, error } = await supabase.rpc("client_list_hidden_library_keys");
  if (error) throw error;
  const payload = (data ?? {}) as { meal_external_ids?: string[] };
  return payload.meal_external_ids ?? [];
}

let lastHydratedSource: MealLibrarySource = "json";

export async function hydrateMealLibraryFromSupabase(): Promise<MealLibrarySource> {
  try {
    const [meals, hidden] = await Promise.all([fetchMealLibraryFromSupabase(), fetchHiddenMealExternalIds()]);
    const dbRows = dbMealCatalogIsV2(meals) ? meals : [];
    const overlaid = overlayMealCatalog(getMealLibrarySeed(), dbRows, hidden);
    setMealLibraryCatalog(overlaid);
    lastHydratedSource = dbRows.length > 0 || hidden.length > 0 ? "supabase" : "json";
    return lastHydratedSource;
  } catch {
    setMealLibraryCatalog(null);
    lastHydratedSource = "json";
    return lastHydratedSource;
  }
}

export function getHydratedMealLibrarySource(): MealLibrarySource {
  return lastHydratedSource;
}
