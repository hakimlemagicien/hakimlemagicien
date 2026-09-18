import { supabase } from "@/integrations/supabase/client";
import { ADMIN_LIBRARY_PAGE_SIZE, clampAdminLibraryLimit } from "./admin-libraries";

export const ADMIN_MEAL_MEDIA_BUCKET = "meal-media";
export const ADMIN_MEAL_IMAGE_MAX_BYTES = 6 * 1024 * 1024;

export type AdminMealListItem = {
  id: string;
  external_id: string;
  name_ar: string;
  name_en: string;
  meal_type: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  status: string;
  review_status: string | null;
  is_active: boolean;
  image_thumb_path: string | null;
  image_status: string;
  updated_at: string;
};

export type AdminMealIngredient = {
  id?: string;
  ingredient_order: number;
  ingredient_key: string;
  name_en: string;
  name_ar: string;
  quantity: number;
  unit: string;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  source: string | null;
  source_query_url: string | null;
};

export type AdminMealDetail = AdminMealListItem & {
  description_ar: string | null;
  description_en: string | null;
  suitable_goals: string[];
  dietary_tags: string[];
  allergens: string[];
  serving_size: number;
  serving_unit: string;
  yield_servings: number;
  preparation_steps_ar: string[];
  preparation_steps_en: string[];
  preparation_time_minutes: number | null;
  image_path: string | null;
  image_master_path: string | null;
  image_alt_ar: string | null;
  image_alt_en: string | null;
  notes: string | null;
  qa: Record<string, unknown>;
  substitution_profile: Record<string, unknown>;
  ingredients: AdminMealIngredient[];
};

function num(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapList(row: Record<string, unknown>): AdminMealListItem {
  return {
    id: String(row.id),
    external_id: String(row.external_id),
    name_ar: String(row.name_ar),
    name_en: String(row.name_en),
    meal_type: String(row.meal_type),
    calories: num(row.calories),
    protein_g: num(row.protein_g),
    carbs_g: num(row.carbs_g),
    fat_g: num(row.fat_g),
    status: String(row.status),
    review_status: (row.review_status as string | null) ?? null,
    is_active: Boolean(row.is_active),
    image_thumb_path: (row.image_thumb_path as string | null) ?? null,
    image_status: String(row.image_status ?? "placeholder"),
    updated_at: String(row.updated_at),
  };
}

export async function listAdminMeals(opts: {
  query?: string;
  type?: string | null;
  status?: string | null;
  offset?: number;
}) {
  const { data, error } = await supabase.rpc("admin_list_meals", {
    p_query: opts.query?.trim() || null,
    p_type: opts.type || null,
    p_status: opts.status || null,
    p_limit: clampAdminLibraryLimit(ADMIN_LIBRARY_PAGE_SIZE),
    p_offset: Math.max(opts.offset ?? 0, 0),
  });
  if (error) throw error;
  const rows = ((data ?? []) as Record<string, unknown>[]).map(mapList);
  return {
    rows,
    totalCount: Number(
      (data as Array<{ total_count?: number }> | null)?.[0]?.total_count ?? rows.length,
    ),
  };
}

export async function getAdminMeal(id: string): Promise<AdminMealDetail> {
  const { data, error } = await supabase.rpc("admin_get_meal", { p_id: id });
  if (error) throw error;
  const row = data as Record<string, unknown>;
  return {
    ...mapList(row),
    description_ar: (row.description_ar as string | null) ?? "",
    description_en: (row.description_en as string | null) ?? "",
    suitable_goals: (row.suitable_goals as string[]) ?? [],
    dietary_tags: (row.dietary_tags as string[]) ?? [],
    allergens: (row.allergens as string[]) ?? [],
    serving_size: num(row.serving_size) || 1,
    serving_unit: String(row.serving_unit ?? "g"),
    yield_servings: num(row.yield_servings) || 1,
    preparation_steps_ar: (row.preparation_steps_ar as string[]) ?? [],
    preparation_steps_en: (row.preparation_steps_en as string[]) ?? [],
    preparation_time_minutes:
      row.preparation_time_minutes == null ? null : num(row.preparation_time_minutes),
    image_path: (row.image_path as string | null) ?? null,
    image_master_path: (row.image_master_path as string | null) ?? null,
    image_alt_ar: (row.image_alt_ar as string | null) ?? null,
    image_alt_en: (row.image_alt_en as string | null) ?? null,
    notes: (row.notes as string | null) ?? "",
    qa: (row.qa as Record<string, unknown>) ?? {},
    substitution_profile: (row.substitution_profile as Record<string, unknown>) ?? {},
    ingredients: ((row.ingredients as AdminMealIngredient[]) ?? []).map((ingredient, index) => ({
      ...ingredient,
      ingredient_order: num(ingredient.ingredient_order) || index + 1,
      quantity: num(ingredient.quantity),
    })),
  };
}

export async function saveAdminMeal(
  payload: Record<string, unknown>,
  expectedUpdatedAt: string | null,
): Promise<AdminMealDetail> {
  const { data, error } = await supabase.rpc("admin_save_meal", {
    p_payload: payload,
    p_expected_updated_at: expectedUpdatedAt,
  });
  if (error) throw error;
  return getAdminMeal(String((data as { id: string }).id));
}

export async function setAdminMealStatus(
  id: string,
  status: "pilot" | "published" | "archived",
): Promise<AdminMealDetail> {
  const { error } = await supabase.rpc("admin_set_meal_status", { p_id: id, p_status: status });
  if (error) throw error;
  return getAdminMeal(id);
}

export function validateAdminMealImage(file: File): string | null {
  if (!file.size) return "ملف الصورة فارغ.";
  if (file.size > ADMIN_MEAL_IMAGE_MAX_BYTES) return "حجم الصورة أكبر من 6 ميغابايت.";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "الصيغ المسموحة: JPG أو PNG أو WebP.";
  return null;
}

function mealImageExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function fetchAdminMealMediaUrls(
  paths: Array<string | null | undefined>,
): Promise<Record<string, string>> {
  const unique = [
    ...new Set(
      paths
        .map((path) => path?.trim())
        .filter((path): path is string => Boolean(path) && !/^https?:\/\//i.test(path!)),
    ),
  ];
  if (unique.length === 0) return {};
  const { data, error } = await supabase.storage
    .from(ADMIN_MEAL_MEDIA_BUCKET)
    .createSignedUrls(unique, 60 * 60);
  if (error || !data) return {};
  const result: Record<string, string> = {};
  data.forEach((item, index) => {
    if (item.signedUrl) result[unique[index]!] = item.signedUrl;
  });
  return result;
}

export async function uploadAdminMealImage(
  externalId: string,
  file: File,
): Promise<{ path: string; signedUrl: string }> {
  const validation = validateAdminMealImage(file);
  if (validation) throw new Error(validation);
  const normalizedId = externalId.trim().toUpperCase();
  if (!/^MEAL-[A-Z0-9-]+$/.test(normalizedId))
    throw new Error("احفظ معرّف وجبة صالحًا قبل رفع الصورة.");
  const path = `meals/${normalizedId}/cover.${mealImageExtension(file)}`;
  const { error } = await supabase.storage.from(ADMIN_MEAL_MEDIA_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) throw new Error(error.message || "فشل رفع صورة الوجبة.");
  const urls = await fetchAdminMealMediaUrls([path]);
  if (!urls[path]) throw new Error("رُفعت الصورة لكن تعذر إنشاء معاينتها.");
  return { path, signedUrl: urls[path] };
}

export function adminMealImageSource(
  input: {
    external_id: string;
    image_path?: string | null;
    image_thumb_path?: string | null;
    image_master_path?: string | null;
  },
  signed: Record<string, string>,
  variant: "thumb" | "cover" = "cover",
) {
  const path =
    variant === "thumb"
      ? input.image_thumb_path || input.image_master_path || input.image_path
      : input.image_master_path || input.image_path || input.image_thumb_path;
  if (path && /^https?:\/\//i.test(path)) return path;
  if (path && signed[path]) return signed[path];
  return `/nutrition/meals/${input.external_id}/cover${variant === "thumb" ? "-thumb" : ""}.webp`;
}

export function emptyMealIngredient(): AdminMealIngredient {
  return {
    ingredient_order: 1,
    ingredient_key: "",
    name_en: "",
    name_ar: "",
    quantity: 1,
    unit: "g",
    kcal: null,
    protein_g: null,
    carbs_g: null,
    fat_g: null,
    source: "",
    source_query_url: "",
  };
}

export function emptyMealDraft(): AdminMealDetail {
  return {
    id: "",
    external_id: "",
    name_ar: "",
    name_en: "",
    meal_type: "lunch",
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    status: "pilot",
    review_status: "edited",
    is_active: true,
    image_thumb_path: null,
    image_status: "placeholder",
    updated_at: "",
    description_ar: "",
    description_en: "",
    suitable_goals: [],
    dietary_tags: [],
    allergens: [],
    serving_size: 100,
    serving_unit: "g",
    yield_servings: 1,
    preparation_steps_ar: [""],
    preparation_steps_en: [""],
    preparation_time_minutes: 10,
    image_path: null,
    image_master_path: null,
    image_alt_ar: "",
    image_alt_en: "",
    notes: "",
    qa: {},
    substitution_profile: {},
    ingredients: [emptyMealIngredient()],
  };
}
