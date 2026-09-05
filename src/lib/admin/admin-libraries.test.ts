import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ADMIN_LIBRARY_MAX_PAGE_SIZE,
  ADMIN_LIBRARY_PAGE_SIZE,
  CMS_SOURCE_OF_TRUTH,
  PROGRAM_VERSIONING_COMPLETION_REQUIRED,
  canPublishContent,
  clampAdminLibraryLimit,
  ingredientsChanged,
  moveItem,
  translateLibraryError,
  validateContentDraft,
  validateExerciseDraft,
  validateExerciseV2Draft,
  validateMealDraft,
  validateProgramDraft,
} from "./admin-libraries";
import { overlayDiscoverCatalog, overlayMealCatalog } from "../platform/library-overlays";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(clampAdminLibraryLimit(200) === ADMIN_LIBRARY_PAGE_SIZE, "library list never exceeds page size");
assert(clampAdminLibraryLimit(0) === 1, "library list lower bound");
assert(ADMIN_LIBRARY_PAGE_SIZE <= 50, "page size stays in 25–50");
assert(ADMIN_LIBRARY_MAX_PAGE_SIZE === 50, "RPC max page is 50");

assert(Object.keys(validateExerciseDraft({
  name_ar: "",
  name_en: "Squat",
  muscle_group_id: "",
  exercise_type: "strength",
  difficulty: "beginner",
  duration_seconds: 30,
})).length > 0, "exercise validation requires Arabic name and muscle group");

assert(Object.keys(validateExerciseDraft({
  name_ar: "سكوات",
  name_en: "Squat",
  muscle_group_id: "g1",
  exercise_type: "strength",
  difficulty: "beginner",
  duration_seconds: 30,
})).length === 0, "valid exercise passes");

assert(validateExerciseV2Draft({
  v2_metadata_status: "APPROVED",
  primary_movement_role: "",
  primary_muscle_canonical: "CHEST",
  equipment_state: "HAS_EQUIPMENT",
  required_equipment: ["BARBELL"],
  mechanics: "COMPOUND",
  is_bodyweight: false,
  is_unilateral: false,
  prescription_mode: "REPS",
}).primary_movement_role, "approved V2 metadata requires movement role");

assert(Object.keys(validateExerciseV2Draft({
  v2_metadata_status: "REVIEW_REQUIRED",
})).length === 0, "review-required drafts can be incomplete");

const mealErrors = validateMealDraft({
  external_id: "MEAL-001",
  name_ar: "وجبة",
  name_en: "Meal",
  meal_type: "lunch",
  calories: 100,
  protein_g: 10,
  carbs_g: 10,
  fat_g: 10,
  serving_size: 100,
  ingredients: [
    { ingredient_key: "chicken", name_ar: "دجاج", name_en: "Chicken", quantity: 0, unit: "g" },
  ],
});
assert(Boolean(mealErrors.ingredient_0_qty), "meal rejects zero quantity");

assert(
  ingredientsChanged(
    [{ ingredient_key: "a", quantity: 1, unit: "g" }],
    [{ ingredient_key: "a", quantity: 2, unit: "g" }],
  ),
  "ingredient fingerprint detects quantity change",
);

assert(validateProgramDraft({ name_ar: "", slug: "x", duration_weeks: 12, days_per_week: 4 }).name_ar, "program name required");
assert(canPublishContent({ title: "عنوان", short_description: "ملخص كاف" }), "content publish needs title+summary");
assert(!canPublishContent({ title: "عنوان", short_description: "" }), "content publish blocked without summary");
assert(validateContentDraft({
  title: "x",
  slug: "x",
  short_description: "",
  content_type: "article",
  status: "draft",
  publish_at: null,
}).title === undefined, "draft save does not require summary");

assert(moveItem(["a", "b", "c"], 1, -1).join("") === "bac", "reorder up");
assert(moveItem(["a", "b", "c"], 0, -1).join("") === "abc", "reorder bounds");

const overlaidMeals = overlayMealCatalog(
  [
    { external_id: "MEAL-001", name: "seed" },
    { external_id: "MEAL-002", name: "seed-2" },
  ],
  [{ external_id: "MEAL-001", name: "db" }],
  ["MEAL-002"],
);
assert(overlaidMeals.length === 1 && overlaidMeals[0]?.name === "db", "DB wins and archived seed is hidden");

const overlaidDiscover = overlayDiscoverCatalog(
  [
    { slug: "stay-committed", title: "seed", coverImage: "seed.png" },
    { slug: "old-tip", title: "seed-tip", coverImage: "x" },
  ],
  [{ slug: "stay-committed", title: "db", coverImage: "" }],
  ["old-tip"],
  (seed, db) => ({ ...seed, ...db, coverImage: db.coverImage || seed?.coverImage || "" }),
);
assert(overlaidDiscover.length === 1, "unpublished/archived slug is excluded");
assert(overlaidDiscover[0]?.title === "db" && overlaidDiscover[0]?.coverImage === "seed.png", "DB title wins, seed cover kept");

assert(translateLibraryError({ message: "allergens_review_required" }).includes("الحساسية"), "known SQL errors are Arabic");
assert(CMS_SOURCE_OF_TRUTH === "database_with_seed_fallback", "CMS SoT is DB with seed fallback");
assert(PROGRAM_VERSIONING_COMPLETION_REQUIRED, "program snapshot versioning is not claimed complete");

const root = process.cwd();
const migration = readFileSync(join(root, "supabase/migrations/20260820230000_admin_library_management.sql"), "utf8");
assert(migration.includes("_require_admin"), "library RPCs are admin-gated");
assert(migration.includes("admin_list_exercises"), "exercise list contract exists");
assert(migration.includes("admin_save_meal"), "atomic meal save exists");
assert(migration.includes("admin_save_program_template"), "atomic program save exists");
assert(migration.includes("assignment_count"), "assignment count is aggregated");
assert(!/CREATE TABLE[\s\S]*admin_exercises/.test(migration), "no parallel admin_exercises");
assert(!/CREATE TABLE[\s\S]*admin_meals/.test(migration), "no parallel admin_meals");
assert(!/CREATE TABLE[\s\S]*admin_programs/.test(migration), "no parallel admin_programs");
assert(!/CREATE TABLE[\s\S]*admin_articles/.test(migration), "no parallel admin_articles");
assert(migration.includes("REVOKE DELETE ON public.discover_content"), "discover hard delete revoked");
assert(migration.includes("LEAST(GREATEST(COALESCE(p_limit, 25), 1), 50)"), "library pagination is clamped");
assert(migration.includes("exercise_archived") || migration.includes("exercise_published"), "exercise status is audited");
assert(migration.includes("meal_published"), "meal publish is audited");
assert(migration.includes("program_template_published"), "program publish is audited");
assert(migration.includes("discover_content_published"), "content publish is audited");
assert(migration.includes("stale_update"), "optimistic concurrency exists");
assert(migration.includes("allergens_review_required"), "allergen review is required after ingredient edits");

const browserClient = readFileSync(join(root, "src/integrations/supabase/client.ts"), "utf8");
assert(!browserClient.includes("SERVICE_ROLE"), "browser has no service_role");

const memberAppFiles = [
  "src/routes/_platform/app/index.tsx",
  "src/routes/_platform/app/nutrition/index.tsx",
  "src/routes/_platform/app/exercises/index.tsx",
  "src/routes/_platform/app/discover/index.tsx",
];
for (const file of memberAppFiles) {
  const source = readFileSync(join(root, file), "utf8");
  assert(!source.includes("admin_save_exercise"), `${file} does not save exercises`);
  assert(!source.includes("admin_save_meal"), `${file} does not save meals`);
  assert(!source.includes("admin_save_program_template"), `${file} does not save templates`);
  assert(!source.includes("admin_save_discover_content"), `${file} does not save CMS`);
}

for (const file of [
  "src/routes/admin/exercises.tsx",
  "src/routes/admin/nutrition.tsx",
  "src/routes/admin/programs.tsx",
  "src/routes/admin/content.tsx",
]) {
  const source = readFileSync(join(root, file), "utf8");
  assert(!source.includes("AdminModulePlaceholder"), `${file} is no longer a placeholder`);
}

const exerciseUi = readFileSync(join(root, "src/components/admin/libraries/ExerciseLibraryManager.tsx"), "utf8");
assert(!exerciseUi.includes("hard delete") && !exerciseUi.includes(".from(\"exercises\").delete"), "exercise UI has no hard delete");
assert(exerciseUi.includes("أرشفة"), "exercise archive exists");
assert(exerciseUi.includes("v2_metadata_status"), "exercise manager exposes V2 metadata");
assert(exerciseUi.includes("if (draft.id) return"), "external_id is locked after create");

const v2Migration = readFileSync(join(root, "supabase/migrations/20260821140000_exercise_library_v2_compatibility.sql"), "utf8");
assert(v2Migration.includes("external_id_immutable"), "exercise identity cannot be rewritten");
assert(!/CREATE TABLE[\s\S]*exercises_v2/.test(v2Migration), "no parallel exercises_v2 table");

const mealUi = readFileSync(join(root, "src/components/admin/libraries/NutritionLibraryManager.tsx"), "utf8");
assert(mealUi.includes("allergensConfirmed"), "allergen confirmation exists");
assert(!mealUi.includes(".from(\"meals\").delete"), "meal UI does not hard-delete");

const programUi = readFileSync(join(root, "src/components/admin/libraries/ProgramLibraryManager.tsx"), "utf8");
assert(programUi.includes("PROGRAM_TEMPLATE"), "template ≠ assignment is shown");
assert(programUi.includes("PROGRAM_VERSIONING_COMPLETION_REQUIRED"), "versioning gap is disclosed");
const programBuilderUi = readFileSync(join(root, "src/components/admin/programs/AdminProgramBuilder.tsx"), "utf8");
assert(programBuilderUi.includes("اختيار تمرين"), "exercise picker uses library search");
assert(programBuilderUi.includes("حفظ مسودة"), "program save is draft");
assert(programBuilderUi.includes("معاينة كعميل"), "client preview exists");
assert(programBuilderUi.includes("هدفك"), "client preview is goal-first not template-name");

const contentUi = readFileSync(join(root, "src/components/admin/libraries/ContentLibraryManager.tsx"), "utf8");
assert(contentUi.includes("محتوى جديد"), "content list can create");
const contentBuilderUi = readFileSync(join(root, "src/components/admin/content/AdminContentBuilder.tsx"), "utf8");
assert(contentBuilderUi.includes("حفظ مسودة"), "content save is draft");
assert(contentBuilderUi.includes("نشر"), "publish is a separate action");
assert(contentBuilderUi.includes("معاينة في التطبيق"), "in-app preview exists before publish");
assert(contentBuilderUi.includes("بنات"), "audience can target girls");
assert(contentBuilderUi.includes("ذكور"), "audience can target boys");
assert(contentBuilderUi.includes("الأكل"), "audience can target food");
assert(contentBuilderUi.includes("إزالة المحتوى"), "content can be removed from the app");
assert(contentBuilderUi.includes("1080"), "cover size follows Instagram 1080");
assert(contentBuilderUi.includes("1350"), "cover size follows Instagram 1350");
const contentPreviewUi = readFileSync(join(root, "src/components/admin/content/AdminContentAppPreview.tsx"), "utf8");
assert(contentPreviewUi.includes("DiscoverContentDetailView"), "preview uses the real discover screen");
assert(contentPreviewUi.includes("HomeDiscoverCard"), "preview uses the real home card");
assert(contentPreviewUi.includes("تفاصيل المحتوى") || contentPreviewUi.includes("DiscoverContentDetailView"), "preview matches client discover screen");

const mealApi = readFileSync(join(root, "src/lib/platform/meal-library-api.ts"), "utf8");
assert(mealApi.includes("overlayMealCatalog"), "client meals overlay DB onto seed");
assert(mealApi.includes("dbMealCatalogIsV2"), "stale V1 database meals cannot overlay V2 seed");
assert(!mealApi.includes("meals.length >= seedCount"), "full-catalog replacement gate is removed");

const discoverApi = readFileSync(join(root, "src/lib/platform/discover-content-api.ts"), "utf8");
assert(discoverApi.includes("overlayDiscoverCatalog"), "client discover overlay DB onto seed");
assert(discoverApi.includes("type_payload"), "client catalog reads audience from type_payload");

const kit = readFileSync(join(root, "src/components/admin/AdminLibraryKit.tsx"), "utf8");
assert(kit.includes("useUnsavedNavigation"), "unsaved changes warning exists");
assert(kit.includes("AdminSaveState"), "save states exist");

console.log("admin-libraries tests passed");
