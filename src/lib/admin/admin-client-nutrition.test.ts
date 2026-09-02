import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  allergenOverlap,
  nutritionAttentionSignals,
  nutritionLogIsLegacyUnlinked,
  nutritionStatusLabel,
  parseWatchAllergens,
  scaleMacros,
  validateServings,
} from "../platform/nutrition-assignment";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(nutritionStatusLabel("active") === "نشط", "active nutrition label");
assert(nutritionStatusLabel("replaced") === "مستبدل", "replaced is a history status");
assert(!validateServings(1), "valid servings");
assert(validateServings(0) === "invalid_servings", "servings > 0");
assert(scaleMacros({ calories: 100, protein_g: 10, carbs_g: 20, fat_g: 5, servings: 2 }).calories === 200, "portion scales library macros");
assert(allergenOverlap(["Peanut"], ["peanut", "gluten"]).includes("peanut"), "direct allergen overlap is case-insensitive");
assert(allergenOverlap(["dairy"], ["peanut"]).length === 0, "no silent invented conflict");
assert(parseWatchAllergens("peanut، gluten, peanut").length === 2, "watch list is unique");
assert(nutritionAttentionSignals({ status: null, startsOn: null, snapshotComplete: null })[0] === "no_active_nutrition");
assert(
  nutritionAttentionSignals({
    status: "active",
    startsOn: "2026-08-01",
    snapshotComplete: true,
    allergenConflict: true,
  }).includes("allergen_conflict"),
  "allergen conflict is objective",
);
assert(nutritionLogIsLegacyUnlinked(null), "null assignment log is legacy/unlinked");
assert(!nutritionLogIsLegacyUnlinked("n1"), "linked nutrition log");

const root = process.cwd();
const workspace = readFileSync(join(root, "src/components/admin/ClientNutritionWorkspace.tsx"), "utf8");
assert(workspace.includes("تعيين خطة تغذية"), "assign action exists");
assert(workspace.includes("توليد Strategy V1"), "strategy v1 assign action exists");
assert(workspace.includes("generateAdminStrategyNutrition"), "strategy rpc wiring");
assert(workspace.includes("استبدال الوجبة"), "meal substitution exists");
assert(workspace.includes("محرر نسخة العميل"), "client copy editor exists");
assert(workspace.includes("تاريخ التغذية"), "nutrition history exists");
assert(workspace.includes("تعارض حساسية"), "allergen warning exists");
assert(!workspace.includes("window.confirm"), "no window.confirm");
assert(!workspace.includes("87%"), "no fake adherence");
assert(!workspace.includes("poor adherence"), "no invented adherence label");
assert(workspace.includes("onConfirm"), "sensitive actions confirm");
assert(workspace.includes("تعليمات ظاهرة للعميل"), "client-visible notes are distinct");
assert(workspace.includes("تبويب الملاحظات"), "coach notes stay separate");
assert(workspace.includes("LOCAL_ONLY") || workspace.includes("NUTRITION_WATER_SOURCE"), "water is not claimed server-side");

const client360 = readFileSync(join(root, "src/routes/admin/clients/$clientId.tsx"), "utf8");
assert(client360.includes("ClientNutritionWorkspace"), "client 360 nutrition workspace is wired");
assert(!client360.includes("ستتوفر ضمن مرحلة إدارة التغذية"), "placeholder nutrition copy is gone");
assert(client360.includes("lazy("), "nutrition workspace is route-split");

console.log("admin-client-nutrition tests passed");
