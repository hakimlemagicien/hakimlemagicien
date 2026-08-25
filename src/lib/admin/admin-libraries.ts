export const ADMIN_LIBRARY_PAGE_SIZE = 25;
export const ADMIN_LIBRARY_MAX_PAGE_SIZE = 50;
export const PROGRAM_VERSIONING_COMPLETION_REQUIRED = true;
export const CMS_SOURCE_OF_TRUTH = "database_with_seed_fallback" as const;
export const SCHEDULED_PUBLISH_RUNTIME = "rls_read_time" as const;

export type LibrarySaveState = "saved" | "saving" | "unsaved" | "failed";

export const EXERCISE_TYPES = ["strength", "cardio", "mobility", "warmup", "other"] as const;
export const EXERCISE_DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "pre_workout", "post_workout", "drinks"] as const;
export const MEAL_STATUSES = ["pilot", "published", "archived"] as const;
export const PROGRAM_GOALS = ["cut", "bulk", "fitness", "recomp"] as const;
export const PROGRAM_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const DISCOVER_TYPES = [
  "article",
  "video",
  "recipe",
  "success_story",
  "challenge",
  "daily_tip",
  "platform_update",
  "promotional",
] as const;
export const DISCOVER_STATUSES = ["draft", "scheduled", "published", "unpublished", "archived"] as const;

const LIBRARY_ERROR_MESSAGES: Record<string, string> = {
  forbidden: "هذه العملية متاحة للمشرف فقط.",
  not_found: "العنصر غير موجود.",
  name_required: "الاسم مطلوب بالعربية والإنجليزية حيث ينطبق.",
  title_required: "العنوان مطلوب.",
  slug_required: "المعرّف النصي مطلوب.",
  external_id_required: "معرّف الوجبة مطلوب.",
  muscle_group_required: "اختر المجموعة العضلية.",
  invalid_exercise_type: "نوع التمرين غير صالح.",
  invalid_difficulty: "مستوى الصعوبة غير صالح.",
  invalid_meal_type: "نوع الوجبة غير صالح.",
  invalid_macros: "السعرات والعناصر الغذائية يجب أن تكون أرقاماً موجبة.",
  invalid_serving: "حجم الحصة يجب أن يكون أكبر من صفر.",
  invalid_quantity: "كمية المكوّن يجب أن تكون أكبر من صفر.",
  invalid_unit: "وحدة المكوّن مطلوبة.",
  ingredient_required: "كل مكوّن يحتاج اسماً عربياً وإنجليزياً ومفتاحاً.",
  duplicate_ingredient: "لا يمكن تكرار نفس المكوّن داخل الوجبة.",
  duplicate_exercise: "تمرين بنفس المعرّف أو الرابط موجود مسبقاً.",
  duplicate_external_id: "وجبة بنفس المعرّف موجودة مسبقاً.",
  external_id_immutable: "معرّف التمرين ثابت ولا يمكن تغييره بعد الإنشاء.",
  invalid_v2_metadata: "بيانات التدريب V2 غير مكتملة أو غير صالحة للموافقة.",
  duration_requires_timed: "وضع المدة يتطلب تفعيل الوصفة الزمنية.",
  bodyweight_loading_conflict: "تمرين وزن الجسم لا يمكن أن يستخدم تحميلاً يناقض ذلك.",
  no_equipment_with_requirements: "حالة بلا معدات لا تقبل قائمة متطلبات.",
  has_equipment_without_requirements: "حدد المعدات المطلوبة أو غيّر الحالة إلى غير معروف.",
  duplicate_slug: "هذا المعرّف النصي مستخدم مسبقاً.",
  allergens_review_required: "بعد تغيير المكوّنات راجع قائمة مسببات الحساسية ثم أكّد الحفظ.",
  stale_update: "تم تعديل هذا العنصر من جلسة أخرى. أعد التحميل قبل الحفظ.",
  template_archived: "لا يمكن تعديل قالب مؤرشف.",
  exercise_required: "اختر تمريناً من المكتبة.",
  invalid_goal: "هدف البرنامج غير صالح.",
  invalid_level: "مستوى البرنامج غير صالح.",
  invalid_meal_status: "حالة الوجبة غير صالحة.",
  invalid_content_type: "نوع المحتوى غير صالح.",
  invalid_content_status: "حالة النشر غير صالحة.",
  summary_required: "الملخص مطلوب قبل النشر.",
  schedule_required: "حدد وقت النشر للمحتوى المجدول.",
  name_ar_required: "الاسم العربي مطلوب.",
  invalid_client: "العميل غير موجود.",
  template_not_found: "القالب غير موجود.",
  template_not_assignable: "لا يمكن تعيين قالب غير منشور أو مؤرشف.",
  template_empty: "القالب بلا أسابيع ولا يمكن تعيينه.",
  active_assignment_exists: "يوجد برنامج نشط. أكّد الاستبدال أولاً.",
  scheduled_assignment_exists: "يوجد برنامج مجدول. أكّد الاستبدال أولاً.",
  assignment_not_editable: "لا يمكن تعديل برنامج غير نشط أو غير مجدول.",
  invalid_assignment_status: "حالة البرنامج غير صالحة.",
  invalid_sets: "عدد المجموعات يجب أن يكون أكبر من صفر.",
  invalid_rest: "وقت الراحة لا يمكن أن يكون سالباً.",
  meal_required: "اختر وجبة من المكتبة.",
  meal_not_assignable: "لا يمكن تعيين وجبة غير منشورة أو مؤرشفة.",
  slots_required: "الخطة تحتاج أربع وجبات يومية.",
  invalid_slot: "فترة الوجبة غير صالحة.",
  invalid_servings: "الحصة يجب أن تكون أكبر من صفر.",
  active_nutrition_exists: "يوجد خطة تغذية نشطة. أكّد الاستبدال أولاً.",
  scheduled_nutrition_exists: "يوجد خطة تغذية مجدولة. أكّد الاستبدال أولاً.",
  program_invalid: "المرشّح غير صالح. لا يمكن تعيينه. يبقى البرنامج الحالي كما هو.",
  program_generation_blocked: "توليد البرنامج محظور. لم يُغيَّر البرنامج النشط.",
  active_workout_in_progress: "العميل لديه حصة قيد التنفيذ. انتظر اكتمالها قبل استبدال البرنامج.",
  unknown_exercise: "تمرين في المرشّح غير موجود في المكتبة.",
};

export function clampAdminLibraryLimit(limit: number, max = ADMIN_LIBRARY_PAGE_SIZE): number {
  if (!Number.isFinite(limit)) return max;
  return Math.min(Math.max(Math.trunc(limit), 1), max);
}

export function translateLibraryError(error: unknown): string {
  const raw =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: string }).message ?? "")
      : String(error ?? "");
  const code = raw.split(":")[0]?.trim() || raw.trim();
  for (const [key, message] of Object.entries(LIBRARY_ERROR_MESSAGES)) {
    if (code.includes(key) || raw.includes(key)) return message;
  }
  return "تعذر حفظ التغييرات. تحقق من الحقول وأعد المحاولة.";
}

export function librarySaveStateLabel(state: LibrarySaveState): string {
  if (state === "saving") return "جاري الحفظ";
  if (state === "saved") return "تم الحفظ";
  if (state === "failed") return "فشل الحفظ";
  return "تغييرات غير محفوظة";
}

export type FieldErrors = Record<string, string>;

export function validateExerciseDraft(input: {
  name_ar: string;
  name_en: string;
  muscle_group_id: string;
  exercise_type: string;
  difficulty: string | null;
  duration_seconds: number;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.name_ar.trim()) errors.name_ar = "الاسم العربي مطلوب.";
  if (!input.name_en.trim()) errors.name_en = "الاسم الإنجليزي مطلوب.";
  if (!input.muscle_group_id) errors.muscle_group_id = "المجموعة العضلية مطلوبة.";
  if (!EXERCISE_TYPES.includes(input.exercise_type as (typeof EXERCISE_TYPES)[number])) {
    errors.exercise_type = "نوع التمرين غير صالح.";
  }
  if (input.difficulty && !EXERCISE_DIFFICULTIES.includes(input.difficulty as (typeof EXERCISE_DIFFICULTIES)[number])) {
    errors.difficulty = "مستوى الصعوبة غير صالح.";
  }
  if (!Number.isFinite(input.duration_seconds) || input.duration_seconds < 1) {
    errors.duration_seconds = "المدة يجب أن تكون ثانية واحدة على الأقل.";
  }
  return errors;
}

export function validateExerciseV2Draft(input: {
  v2_metadata_status?: string;
  primary_muscle_canonical?: string | null;
  primary_movement_role?: string | null;
  equipment_state?: string | null;
  required_equipment?: string[];
  mechanics?: string | null;
  is_bodyweight?: boolean | null;
  is_unilateral?: boolean | null;
  prescription_mode?: string | null;
  supports_timed_prescription?: boolean | null;
}): FieldErrors {
  const errors: FieldErrors = {};
  const status = input.v2_metadata_status ?? "UNREVIEWED";
  if (!["UNREVIEWED", "REVIEW_REQUIRED", "APPROVED", "BLOCKED"].includes(status)) {
    errors.v2_metadata_status = "حالة مراجعة البيانات غير صالحة.";
  }
  if (input.prescription_mode === "DURATION" && input.supports_timed_prescription !== true) {
    errors.prescription_mode = "وضع المدة يتطلب وصفة زمنية.";
  }
  if (status !== "APPROVED") return errors;
  if (!input.primary_muscle_canonical?.trim()) errors.primary_muscle_canonical = "العضلة الأساسية مطلوبة للموافقة.";
  if (!input.primary_movement_role?.trim()) errors.primary_movement_role = "دور الحركة مطلوب للموافقة.";
  if (!input.mechanics) errors.mechanics = "الميكانيكا مطلوبة للموافقة.";
  if (input.is_bodyweight == null) errors.is_bodyweight = "حدد إن كان التمرين بوزن الجسم.";
  if (input.is_unilateral == null) errors.is_unilateral = "حدد إن كان التمرين أحادي الجانب.";
  if (!input.prescription_mode) errors.prescription_mode = "وضع الوصفة مطلوب للموافقة.";
  if (input.equipment_state === "UNKNOWN" || !input.equipment_state) {
    errors.equipment_state = "لا يمكن الموافقة مع معدات غير معروفة.";
  }
  if (input.equipment_state === "HAS_EQUIPMENT" && !(input.required_equipment ?? []).length) {
    errors.required_equipment = "حدد المعدات المطلوبة.";
  }
  return errors;
}

export function validateMealDraft(input: {
  external_id: string;
  name_ar: string;
  name_en: string;
  meal_type: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size: number;
  ingredients: Array<{ ingredient_key: string; name_ar: string; name_en: string; quantity: number; unit: string }>;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.external_id.trim()) errors.external_id = "معرّف الوجبة مطلوب.";
  if (!input.name_ar.trim()) errors.name_ar = "الاسم العربي مطلوب.";
  if (!input.name_en.trim()) errors.name_en = "الاسم الإنجليزي مطلوب.";
  if (!MEAL_TYPES.includes(input.meal_type as (typeof MEAL_TYPES)[number])) errors.meal_type = "نوع الوجبة غير صالح.";
  if (!(input.calories >= 0)) errors.calories = "السعرات غير صالحة.";
  if (!(input.protein_g >= 0)) errors.protein_g = "البروتين غير صالح.";
  if (!(input.carbs_g >= 0)) errors.carbs_g = "الكربوهيدرات غير صالحة.";
  if (!(input.fat_g >= 0)) errors.fat_g = "الدهون غير صالحة.";
  if (!(input.serving_size > 0)) errors.serving_size = "حجم الحصة يجب أن يكون أكبر من صفر.";
  const keys = new Set<string>();
  input.ingredients.forEach((ingredient, index) => {
    const prefix = `ingredient_${index}`;
    if (!ingredient.ingredient_key.trim() || !ingredient.name_ar.trim() || !ingredient.name_en.trim()) {
      errors[prefix] = "بيانات المكوّن غير مكتملة.";
    }
    if (!(ingredient.quantity > 0)) errors[`${prefix}_qty`] = "كمية المكوّن يجب أن تكون أكبر من صفر.";
    if (!ingredient.unit.trim()) errors[`${prefix}_unit`] = "وحدة المكوّن مطلوبة.";
    const key = ingredient.ingredient_key.trim();
    if (key && keys.has(key)) errors[prefix] = "مكوّن مكرر.";
    if (key) keys.add(key);
  });
  return errors;
}

export function validateProgramDraft(input: { name_ar: string; slug: string; duration_weeks: number; days_per_week: number }): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.name_ar.trim()) errors.name_ar = "اسم البرنامج مطلوب.";
  if (!input.slug.trim()) errors.slug = "المعرّف النصي مطلوب.";
  if (!(input.duration_weeks > 0)) errors.duration_weeks = "عدد الأسابيع يجب أن يكون أكبر من صفر.";
  if (input.days_per_week < 1 || input.days_per_week > 7) errors.days_per_week = "أيام الأسبوع بين 1 و 7.";
  return errors;
}

export function validateContentDraft(input: {
  title: string;
  slug: string;
  short_description: string;
  content_type: string;
  status: string;
  publish_at: string | null;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.title.trim()) errors.title = "العنوان مطلوب.";
  if (!input.slug.trim()) errors.slug = "المعرّف النصي مطلوب.";
  if (!DISCOVER_TYPES.includes(input.content_type as (typeof DISCOVER_TYPES)[number])) {
    errors.content_type = "نوع المحتوى غير صالح.";
  }
  if (!DISCOVER_STATUSES.includes(input.status as (typeof DISCOVER_STATUSES)[number])) {
    errors.status = "حالة النشر غير صالحة.";
  }
  return errors;
}

export function canPublishContent(input: { title: string; short_description: string }): boolean {
  return Boolean(input.title.trim() && input.short_description.trim());
}

export function canPublishMeal(input: { name_ar: string; external_id: string }): boolean {
  return Boolean(input.name_ar.trim() && input.external_id.trim());
}

export function canActivateExercise(input: { name_ar: string; name_en: string; muscle_group_id: string }): boolean {
  return Boolean(input.name_ar.trim() && input.name_en.trim() && input.muscle_group_id);
}

export function ingredientsChanged(
  before: Array<{ ingredient_key: string; quantity: number; unit: string }>,
  after: Array<{ ingredient_key: string; quantity: number; unit: string }>,
): boolean {
  const fingerprint = (rows: typeof before) =>
    rows
      .map((row) => `${row.ingredient_key}:${row.quantity}:${row.unit}`)
      .sort()
      .join("|");
  return fingerprint(before) !== fingerprint(after);
}

export function libraryStatusTone(
  status: string,
): "draft" | "review" | "published" | "archived" | "active" | "inactive" | "pilot" {
  if (status === "published" || status === "active") return "published";
  if (status === "archived" || status === "unpublished" || status === "inactive") return "archived";
  if (status === "pilot" || status === "review" || status === "scheduled") return "review";
  if (status === "draft") return "draft";
  return "draft";
}

export function exerciseStatusLabel(isActive: boolean): string {
  return isActive ? "نشط" : "مؤرشف";
}

export function mealStatusLabel(status: string): string {
  if (status === "published") return "منشور";
  if (status === "archived") return "مؤرشف";
  return "تجريبي";
}

export function programStatusLabel(isPublished: boolean, archivedAt: string | null): string {
  if (archivedAt) return "مؤرشف";
  if (isPublished) return "منشور";
  return "مسودة";
}

export function discoverStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "مسودة",
    scheduled: "مجدول",
    published: "منشور",
    unpublished: "غير منشور",
    archived: "مؤرشف",
  };
  return labels[status] ?? status;
}

export function mealTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    breakfast: "فطور",
    lunch: "غداء",
    dinner: "عشاء",
    snack: "سناك",
    pre_workout: "قبل التمرين",
    post_workout: "بعد التمرين",
    drinks: "مشروبات",
  };
  return labels[type] ?? type;
}

export function programGoalLabel(goal: string | null): string {
  const labels: Record<string, string> = {
    cut: "تنشيف",
    bulk: "تضخيم",
    fitness: "لياقة",
    recomp: "إعادة تركيب",
  };
  return goal ? (labels[goal] ?? goal) : "—";
}

export function programLevelLabel(level: string | null): string {
  const labels: Record<string, string> = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
  };
  return level ? (labels[level] ?? level) : "—";
}

export function discoverTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    article: "مقال",
    video: "فيديو",
    recipe: "وصفة",
    success_story: "قصة نجاح",
    challenge: "تحدي",
    daily_tip: "نصيحة",
    platform_update: "تحديث",
    promotional: "ترويجي",
  };
  return labels[type] ?? type;
}

export function csvToList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function listToCsv(value: string[] | null | undefined): string {
  return (value ?? []).join("، ");
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const next = index + direction;
  if (next < 0 || next >= items.length) return items;
  const copy = items.slice();
  const [row] = copy.splice(index, 1);
  copy.splice(next, 0, row!);
  return copy;
}
