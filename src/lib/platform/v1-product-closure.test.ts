import { readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const assignmentGates = readFileSync(
  join(root, "src/lib/platform/training-strategy-hardening/assignment-gates.ts"),
  "utf8",
);
assert(assignmentGates.includes("AUTOMATED_ASSIGNMENT_GLOBALLY_DISABLED = false"), "P0-3 automated assignment enabled");

const productCopy = readFileSync(join(root, "src/lib/platform/training-product-copy.ts"), "utf8");
assert(productCopy.includes("معاينة مجانية — برنامجك الشخصي"), "P0-1 free badge copy");

const workoutIndex = readFileSync(join(root, "src/routes/_platform/app/program/workout/index.tsx"), "utf8");
assert(workoutIndex.includes("TRAINING_PRODUCT_COPY"), "P0-1 workout uses unified copy");
const upgradeUi = readFileSync(join(root, "src/components/platform/upgrade/upgrade-ui.tsx"), "utf8");
assert(upgradeUi.includes("معاينة شخصية"), "P0-1 upgrade comparison");

const weekly = readFileSync(join(root, "src/lib/platform/weekly-workout-schedule.ts"), "utf8");
assert(!weekly.includes("FREE_CHEST_PREVIEW"), "P0-2 generic chest preview removed");
assert(weekly.includes("emptyRestPlan(dayId)"), "P0-2 fallback is empty rest");
assert(!workoutIndex.includes("showFreeCatalogWeek"), "P0-2 catalog week removed from UI");

const paidAuto = readFileSync(join(root, "src/lib/platform/paid-training-auto-assign.ts"), "utf8");
assert(paidAuto.includes('assignmentMode: "AUTOMATED"'), "P0-3 uses AUTOMATED mode");
assert(paidAuto.includes("clientAssignGeneratedV2Program"), "P0-3 client assign RPC");
assert(paidAuto.includes("clientRecordProgramReviewRequired"), "P0-3 review queue on exceptions");
const migration = readFileSync(
  join(root, "supabase/migrations/20260902130000_client_v1_auto_assign_training.sql"),
  "utf8",
);
assert(migration.includes("client_assign_generated_v2_program"), "P0-3 migration RPC");
assert(migration.includes("workout_not_entitled"), "P0-3 entitlement gate");

assert(
  readFileSync(join(root, "src/lib/platform/program-generation/program-generation.test.ts"), "utf8").includes(
    "STANDARD_SESSION_EXERCISE_TARGET",
  ),
  "P0-4 generator regression suite exists",
);
assert(paidAuto.includes("automatedGloballyDisabled: false"), "P0-4 automation flag off in runner");
assert(
  readFileSync(join(root, "src/routes/_platform/route.tsx"), "utf8").includes("usePaidTrainingAutoAssign"),
  "P0-4 auto-assign wired in platform layout",
);
assert(
  readFileSync(join(root, "src/lib/platform/free-training-strategy-preview.ts"), "utf8").includes(
    "generateTrainingProgram",
  ),
  "P0-4 free preview uses strategy generator",
);

console.log("v1-product-closure tests passed");
