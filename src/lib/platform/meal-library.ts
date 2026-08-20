import nutritionPilotPackage from "./data/nutrition-pilot-20.json";
import nutritionLibrary021100 from "./data/nutrition-library-021-100.json";
import nutritionLibrary101300 from "./data/nutrition-library-101-300.json";

/**
 * Meal Library — managed catalog keyed by external_id.
 * Source of truth: Nutrition Data Contract v1.1 plus approved library batches.
 * User plan state (completed / skipped / current) must never live on these records.
 */
export const MEAL_MEDIA_BUCKET = "meal-media";
export const MEAL_LIBRARY_SCHEMA_VERSION = "1.1.0";
export const MEAL_LIBRARY_PILOT_START = "MEAL-001";
export const MEAL_LIBRARY_PILOT_END = "MEAL-020";
export const MEAL_LIBRARY_EXTENDED_START = "MEAL-021";
export const MEAL_LIBRARY_EXTENDED_END = "MEAL-300";

export type MealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "pre_workout"
  | "post_workout"
  | "drinks";

export type MealImageVariant = "cover" | "thumb";

export type MealLibraryIngredient = {
  ingredient_order: number;
  ingredient_key: string;
  name_en: string;
  name_ar: string;
  quantity: number;
  unit: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source: string;
  source_query_url: string;
};

export type MealSubstitutionProfile = {
  calorie_band_kcal: string;
  protein_band_g: string;
  carb_band_g: string;
  fat_band_g: string;
  meal_type_required: boolean;
  max_calorie_delta_pct: number;
  max_protein_delta_g: number;
  exclude_allergens: boolean;
};

export type MealLibraryImage = {
  reference: string;
  status: string;
  alt_ar: string;
  alt_en: string;
};

export type MealLibraryRecord = {
  external_id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  meal_type: MealType;
  suitable_goals: string[];
  dietary_tags: string[];
  allergens: string[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size: number;
  serving_unit: string;
  yield_servings: number;
  ingredients: MealLibraryIngredient[];
  preparation_steps_ar: string[];
  preparation_steps_en: string[];
  preparation_time_minutes: number;
  image: MealLibraryImage;
  image_status: string;
  status: string;
  review_status: string;
  notes: string;
  substitution_profile: MealSubstitutionProfile;
  qa: {
    ingredient_energy_kcal: number;
    macro_energy_kcal: number;
    macro_formula: string;
    macro_vs_ingredient_delta_pct: number;
  };
};

export type MealLibraryPackage = {
  schema_version: string;
  generated_on: string;
  nutrition_basis: string;
  meals: MealLibraryRecord[];
};

export const ALLERGEN_LABELS_AR: Record<string, string> = {
  milk: "حليب",
  egg: "بيض",
  gluten: "غلوتين",
  fish: "سمك",
  tree_nuts: "مكسرات",
  sesame: "سمسم",
  soy: "صويا",
  peanuts: "فول سوداني",
  shellfish: "محار",
};

export const MEAL_TYPE_LABELS_AR: Record<MealType, string> = {
  breakfast: "الفطور",
  lunch: "الغداء",
  dinner: "العشاء",
  snack: "سناك",
  pre_workout: "قبل التمرين",
  post_workout: "بعد التمرين",
  drinks: "مشروبات",
};

/** Display-only unit labels. Source values stay in the contract unit. */
export const UNIT_LABELS_AR: Record<string, string> = {
  g: "غ",
  ml: "مل",
};

const seedCatalog = {
  ...(nutritionPilotPackage as MealLibraryPackage),
  meals: [
    ...(nutritionPilotPackage as MealLibraryPackage).meals,
    ...(nutritionLibrary021100 as MealLibraryPackage).meals,
    ...(nutritionLibrary101300 as MealLibraryPackage).meals,
  ],
};
let runtimeCatalog: MealLibraryRecord[] | null = null;

export function getMealLibrarySeed(): MealLibraryRecord[] {
  return seedCatalog.meals;
}

export function getMealLibraryCatalog(): MealLibraryRecord[] {
  return runtimeCatalog ?? seedCatalog.meals;
}

export function setMealLibraryCatalog(meals: MealLibraryRecord[] | null) {
  runtimeCatalog = meals;
}

export function listMealLibrary(): MealLibraryRecord[] {
  return getMealLibraryCatalog();
}

export function getMealByExternalId(externalId: string): MealLibraryRecord | undefined {
  return getMealLibraryCatalog().find((meal) => meal.external_id === externalId);
}

export function getMealLibraryByExternalId(): Map<string, MealLibraryRecord> {
  return new Map(getMealLibraryCatalog().map((meal) => [meal.external_id, meal]));
}

export function listMealsByType(mealType: MealType): MealLibraryRecord[] {
  return getMealLibraryCatalog()
    .filter((meal) => meal.meal_type === mealType)
    .sort((a, b) => a.external_id.localeCompare(b.external_id));
}

export function listMealsByGoal(goal: string): MealLibraryRecord[] {
  return getMealLibraryCatalog()
    .filter((meal) => meal.suitable_goals.includes(goal))
    .sort((a, b) => {
      if (goal === "fat_loss") return a.calories - b.calories;
      if (goal === "muscle_gain") return b.protein_g - a.protein_g;
      return a.external_id.localeCompare(b.external_id);
    });
}

export function listMealsByTypeAndGoal(mealType: MealType, goal?: string): MealLibraryRecord[] {
  const typed = listMealsByType(mealType);
  if (!goal) return typed;
  return typed
    .filter((meal) => meal.suitable_goals.includes(goal))
    .sort((a, b) => {
      if (goal === "fat_loss") return a.calories - b.calories;
      if (goal === "muscle_gain") return b.protein_g - a.protein_g;
      return a.external_id.localeCompare(b.external_id);
    });
}

export function mealDeliveryPath(
  externalId: string,
  variant: MealImageVariant = "cover",
): string {
  const file = variant === "thumb" ? "cover-thumb.webp" : "cover.webp";
  return `/nutrition/meals/${externalId}/${file}`;
}

/** Future Supabase Storage object path. Always keyed by external_id. */
export function mealStorageObjectPath(
  externalId: string,
  variant: MealImageVariant = "cover",
): string {
  const file = variant === "thumb" ? "cover-thumb.webp" : "cover.webp";
  return `meals/${externalId}/${file}`;
}

export function mealMasterStoragePath(externalId: string): string {
  return `meals/${externalId}/cover.png`;
}

export function formatNutritionNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 10) / 10);
}

export function formatMealAmount(quantity: number, unit: string): string {
  const label = UNIT_LABELS_AR[unit] ?? unit;
  return `${formatNutritionNumber(quantity)} ${label}`;
}

export function allergenLabel(allergen: string): string {
  return ALLERGEN_LABELS_AR[allergen] ?? allergen;
}

export function findContractAlternatives(
  meal: MealLibraryRecord,
  catalogMeals: MealLibraryRecord[] = getMealLibraryCatalog(),
  userAllergens: string[] = [],
): MealLibraryRecord[] {
  const profile = meal.substitution_profile;
  return catalogMeals
    .filter((candidate) => {
      if (candidate.external_id === meal.external_id) return false;
      if (profile.meal_type_required && candidate.meal_type !== meal.meal_type) {
        return false;
      }
      if (profile.exclude_allergens && userAllergens.length > 0) {
        if (candidate.allergens.some((item) => userAllergens.includes(item))) {
          return false;
        }
      }
      const calorieDeltaPct =
        (Math.abs(candidate.calories - meal.calories) / meal.calories) * 100;
      if (calorieDeltaPct > profile.max_calorie_delta_pct) return false;
      const proteinDelta = Math.abs(candidate.protein_g - meal.protein_g);
      if (proteinDelta > profile.max_protein_delta_g) return false;
      return true;
    })
    .sort((a, b) => a.external_id.localeCompare(b.external_id));
}

export type MealLibraryIntegrityReport = {
  mealCount: number;
  uniqueExternalIds: number;
  duplicateExternalIds: string[];
  missingImages: string[];
  brokenImageRefs: string[];
  duplicateImageRefs: string[];
  orphanImageRefs: string[];
  imageStatusNotReady: string[];
};

export function auditMealLibrary(
  meals: MealLibraryRecord[] = getMealLibraryCatalog(),
): MealLibraryIntegrityReport {
  const ids = meals.map((meal) => meal.external_id);
  const uniqueIds = new Set(ids);
  const duplicateExternalIds = ids.filter((id, index) => ids.indexOf(id) !== index);

  const refs = meals.map((meal) => meal.image.reference);
  const refCounts = new Map<string, number>();
  for (const ref of refs) {
    refCounts.set(ref, (refCounts.get(ref) ?? 0) + 1);
  }

  const expectedRefs = meals.map((meal) => `images/${meal.external_id}.png`);
  const brokenImageRefs = meals
    .filter((meal) => meal.image.reference !== `images/${meal.external_id}.png`)
    .map((meal) => meal.external_id);
  const missingImages = meals
    .filter((meal) => meal.image_status !== "ready" || meal.image.status !== "ready")
    .map((meal) => meal.external_id);
  const duplicateImageRefs = [...refCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([ref]) => ref);
  const assigned = new Set(refs);
  const orphanImageRefs = expectedRefs.filter((ref) => !assigned.has(ref));

  return {
    mealCount: meals.length,
    uniqueExternalIds: uniqueIds.size,
    duplicateExternalIds: [...new Set(duplicateExternalIds)],
    missingImages,
    brokenImageRefs,
    duplicateImageRefs,
    orphanImageRefs,
    imageStatusNotReady: meals
      .filter((meal) => meal.image_status !== "ready")
      .map((meal) => meal.external_id),
  };
}
