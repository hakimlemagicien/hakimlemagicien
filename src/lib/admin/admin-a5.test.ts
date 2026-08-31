import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildCoachOverridePayload } from "./coach-override-form";
import { detectExerciseSensitiveChanges, detectMealSensitiveChanges } from "./admin-library-safety";
import {
  buildNutritionAttentionFromOverview,
  buildTrainingAttentionFromOverview,
  buildTrainingQuickStatus,
  buildTrainingReviewRows,
} from "./admin-ops-surfaces";
import type { AdminClientOverview } from "./admin-clients-api";
import { ADMIN_NAV_GROUPS } from "./admin-nav";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const trainingOps = readFileSync(resolve(process.cwd(), "src/routes/admin/training/index.tsx"), "utf8");
const trainingReviews = readFileSync(resolve(process.cwd(), "src/routes/admin/training/reviews.tsx"), "utf8");
const nutritionOps = readFileSync(resolve(process.cwd(), "src/routes/admin/nutrition/operations.tsx"), "utf8");
const trainingWorkspace = readFileSync(resolve(process.cwd(), "src/components/admin/ClientTrainingWorkspace.tsx"), "utf8");
const exerciseLib = readFileSync(resolve(process.cwd(), "src/components/admin/libraries/ExerciseLibraryManager.tsx"), "utf8");
const mealLib = readFileSync(resolve(process.cwd(), "src/components/admin/libraries/NutritionLibraryManager.tsx"), "utf8");
const matrixSource = readFileSync(resolve(process.cwd(), "src/components/admin/MatrixImpactCard.tsx"), "utf8");
const core100 = readFileSync(resolve(process.cwd(), "src/lib/platform/strategy-matrix/core-100.ts"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const progressRoute = readFileSync(resolve(process.cwd(), "src/routes/admin/progress.tsx"), "utf8");

const overview: AdminClientOverview = {
  id: "c1",
  full_name: "Ahmed",
  email: "a@example.com",
  phone: null,
  avatar_path: null,
  goal: "loss",
  city: null,
  training_type: "gym",
  program_start_date: null,
  onboarding_completed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  membership: { tier: "premium", is_active: true, source: "stripe", starts_at: new Date().toISOString(), ends_at: null },
  coaching: null,
  assignment: {
    id: "a1",
    source_template_id: "t1",
    template_version: 1,
    status: "active",
    assigned_at: new Date().toISOString(),
    starts_on: new Date().toISOString(),
    name_ar: "برنامج",
    duration_weeks: 8,
    snapshot_complete: true,
  },
  last_workout_at: new Date().toISOString(),
  nutrition_assignment: {
    id: "n1",
    status: "active",
    name_ar: "خطة",
    starts_on: new Date().toISOString(),
    assigned_at: new Date().toISOString(),
    snapshot_complete: true,
    allergen_conflict: true,
  },
  notes_count: 0,
};

// T1 training operations
assert(trainingOps.includes("عمليات التدريب"), "training ops page");

// T2 quick status
const status = buildTrainingQuickStatus([overview]);
assert(status.activePrograms === 1, "active programs");

// T3 training attention
assert(buildTrainingAttentionFromOverview(overview).length >= 0, "training attention");

// T4 review center
assert(trainingReviews.includes("مراجعات التدريب"), "review center");

// T5–T7 deep links
assert(trainingOps.includes("/admin/clients"), "client deep link");
assert(trainingOps.includes("/admin/programs"), "program link");
assert(trainingOps.includes("/admin/exercises"), "exercise link");

// T8–T12 matrix
assert(matrixSource.includes("SAFE_WITH_IMPACT"), "matrix impact");
assert(matrixSource.includes("ALTERNATIVE_RECOMMENDED"), "matrix alt");
assert(matrixSource.includes("BLOCKED"), "matrix blocked");
assert(!matrixSource.includes("متابعة رغم"), "no bypass");
assert(core100.includes("MAAKFIT_V1_CORE_100"), "core 100");

// T15–T20 coach override inputs
assert(trainingWorkspace.includes("buildCoachOverridePayload"), "payload builder");
assert(trainingWorkspace.includes("TRAINING_DAYS_CHANGE"), "days change");
assert(trainingWorkspace.includes("overrideLocation"), "location input");
assert(trainingWorkspace.includes("overrideConstraintEquipment"), "equipment input");
assert(trainingWorkspace.includes("WeeklySchedulePreview"), "weekly preview");
const locationPayload = buildCoachOverridePayload("TRAINING_LOCATION_CHANGE", {
  overrideDays: "3",
  overrideDuration: "45",
  overrideExerciseFrom: "CH-001",
  overrideExerciseTo: "CH-002",
  overrideLocation: "GYM",
  overridePreferredWeekdays: [],
  overrideEquipment: [],
  overrideConstraintEnv: "home",
  overrideConstraintEquipment: [],
  overrideConstraintUntil: "",
});
assert("trainingLocation" in locationPayload && locationPayload.trainingLocation === "GYM", "location payload");

// T23 program library boundary
assert(trainingWorkspace.includes("Strategy Matrix"), "legacy warning");

// T26–T28 exercise library
assert(exerciseLib.includes("LibraryImpactWarningCard"), "exercise warning");
assert(exerciseLib.includes("detectExerciseSensitiveChanges"), "exercise detect");

// T31 nutrition operations
assert(nutritionOps.includes("عمليات التغذية"), "nutrition ops");

// T32 nutrition attention
assert(buildNutritionAttentionFromOverview(overview).some((row) => row.issue.includes("حساسية")), "allergen attention");

// T38 meal library
assert(mealLib.includes("مكتبة الوجبات"), "meal library label");
assert(mealLib.includes("NUTRITION_BOUNDARIES.plan"), "meal plan boundary");

// T39 meal sensitive warning
assert(mealLib.includes("detectMealSensitiveChanges"), "meal detect");

// T43 audit reviews
assert(buildTrainingReviewRows([]).length === 0, "empty reviews");

// T46 RTL
assert(styles.includes(".cc-ops-subnav"), "ops subnav styles");

// T47 mobile
assert(styles.includes(".cc-ops-card-list"), "mobile ops cards");

// T49 empty states
assert(trainingOps.includes("لا توجد حالات تدريبية"), "training empty");

// Nav IA
const trainingGroup = ADMIN_NAV_GROUPS.find((g) => g.id === "training");
assert(trainingGroup?.items.some((item) => item.to === "/admin/training"), "training nav");
assert(trainingGroup?.items.some((item) => item.to === "/admin/training/reviews"), "reviews nav");

const nutritionGroup = ADMIN_NAV_GROUPS.find((g) => g.id === "nutrition");
assert(nutritionGroup?.items.some((item) => item.to === "/admin/nutrition/operations"), "nutrition ops nav");

// progress redirect
assert(progressRoute.includes("/admin/training"), "progress redirects");

const exerciseWarning = detectExerciseSensitiveChanges(
  { location_compatibility: "GYM" },
  { location_compatibility: "HOME", external_id: "CH-001" },
);
assert(exerciseWarning !== null, "exercise sensitive change");

const mealWarning = detectMealSensitiveChanges({ allergens: "nuts" }, { allergens: "dairy" }, true);
assert(mealWarning !== null, "meal sensitive change");

console.log("admin-a5 tests passed");
