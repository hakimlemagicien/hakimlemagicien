import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const nutritionRoute = readFileSync(
  resolve(root, "src/routes/_platform/app/nutrition/index.tsx"),
  "utf8",
);
const holdBranch = nutritionRoute.slice(
  nutritionRoute.indexOf("if (hold.active)"),
  nutritionRoute.indexOf("if (plan.runtimeLoading)"),
);

assert(holdBranch.includes("<NutritionSafetySetup />"), "safety setup is visible during preparation");
assert(
  holdBranch.indexOf("<NutritionSafetySetup />") < holdBranch.indexOf("<ProgramPreparationHoldCard"),
  "allergy and training-time questions precede the preparation hold card",
);

console.log("nutrition-preparation-safety.test.ts: PASS");
