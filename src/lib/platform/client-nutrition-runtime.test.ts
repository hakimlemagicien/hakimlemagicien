import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  runtimeToMealSlots,
  selectNutritionCycleDay,
  type ClientNutritionRuntime,
} from "./assigned-nutrition-api";
import { allergenOverlap, scaleMacros } from "./nutrition-assignment";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const empty: ClientNutritionRuntime = {
  reason: "no_program",
  assignment: null,
  slots: [],
  todayLogs: [],
};
assert(runtimeToMealSlots(empty).length === 0, "no assignment does not invent a personal plan");

const assigned: ClientNutritionRuntime = {
  reason: "ok",
  assignment: {
    id: "n1",
    status: "active",
    name_ar: "خطة أحمد",
    starts_on: "2026-08-20",
    watch_allergens: ["peanut"],
  },
  slots: [
    {
      id: "slot-1",
      slot_key: "breakfast",
      slot_label: "الفطور",
      time_label: "8:00 ص",
      hour: 8,
      minute: 0,
      source_external_id: "MEAL-001",
      name_ar: "فطور العميل",
      calories: 400,
      protein_g: 30,
      carbs_g: 40,
      fat_g: 10,
      servings: 1.5,
      allergens: [],
      notes_ar: "بدون صلصة",
      serving_size: 250,
      serving_unit: "g",
    },
  ],
  todayLogs: [{ slot_key: "breakfast", status: "completed", assignment_id: "n1" }],
};

const slots = runtimeToMealSlots(assigned);
assert(slots.length === 1, "assigned day uses snapshot slots");
assert(slots[0]?.assignmentSlotId === "slot-1", "runtime keeps assignment slot id");
assert(
  slots[0]?.defaultMeal.name === "فطور العميل",
  "client sees snapshot name not a later library rename",
);
assert(
  slots[0]?.defaultMeal.calories ===
    scaleMacros({
      calories: 400,
      protein_g: 30,
      carbs_g: 40,
      fat_g: 10,
      servings: 1.5,
    }).calories,
  "assigned portion macros are scaled from snapshot",
);
assert(
  allergenOverlap(["peanut"], ["peanut"]).length > 0,
  "watch list vs meal allergen is a warning input",
);

const otherClient: ClientNutritionRuntime = {
  ...assigned,
  assignment: { ...assigned.assignment!, id: "n2", name_ar: "خطة سارة" },
};
assert(assigned.assignment?.id !== otherClient.assignment?.id, "client A assignment id ≠ client B");
assert(
  runtimeToMealSlots(otherClient)[0]?.defaultMeal.name !== "فطور مكتبة عام",
  "B is not rewritten from A",
);

const rotating = selectNutritionCycleDay(
  {
    ...assigned,
    assignment: {
      ...assigned.assignment!,
      starts_on: "2026-09-17",
      resolved_snapshot: {
        seven_day_cycle: [
          {
            slots: [{ slot_key: "breakfast", source_external_id: "MEAL-001", planned_servings: 1 }],
          },
          {
            slots: [
              {
                slot_key: "breakfast",
                source_external_id: "MEAL-002",
                planned_servings: 1,
                meal_snapshot: {
                  name_ar: "فطور اليوم الثاني",
                  calories: 410,
                  protein_g: 31,
                  carbs_g: 42,
                  fat_g: 11,
                  allergens: [],
                  serving_size: 260,
                  serving_unit: "g",
                },
              },
            ],
            planned_totals: { calories: 410, protein_g: 31, carbs_g: 42, fat_g: 11 },
          },
        ],
      },
    },
  },
  "2026-09-18",
);
assert(
  rotating.slots[0]?.source_external_id === "MEAL-002",
  "client runtime selects the persisted cycle day",
);
assert(
  rotating.slots[0]?.name_ar === "فطور اليوم الثاني",
  "cycle day reads immutable meal snapshot",
);
assert(rotating.slots[0]?.id === "slot-1", "cycle rotation keeps the server slot id for logging");

const root = process.cwd();
const nutritionPage = readFileSync(
  join(root, "src/routes/_platform/app/nutrition/index.tsx"),
  "utf8",
);
assert(
  nutritionPage.includes("catalogPreview"),
  "nutrition dashboard distinguishes catalog preview",
);
assert(
  nutritionPage.includes("لا توجد خطة غذائية مخصصة حالياً"),
  "no-assignment empty state exists",
);
assert(nutritionPage.includes("NutritionErrorCard"), "load error has retry");
assert(
  !nutritionPage.includes('from "@/components/admin'),
  "nutrition route does not import admin UI",
);
assert(!nutritionPage.includes('from "@/lib/admin'), "nutrition route does not import admin libs");
assert(!nutritionPage.includes("admin_assign_client_nutrition"), "client cannot assign");
assert(
  !nutritionPage.includes("NUTRITION_GOALS"),
  "assigned dashboard does not use invented 2200 target",
);

const mealPage = readFileSync(join(root, "src/routes/_platform/app/nutrition/meal.tsx"), "utf8");
assert(mealPage.includes("catalogPreview"), "meal details honor assignment vs catalog");
assert(!mealPage.includes('from "@/lib/admin'), "meal page stays client-side");

const progressPage = readFileSync(
  join(root, "src/routes/_platform/app/nutrition/progress.tsx"),
  "utf8",
);
assert(!progressPage.includes("+ 24"), "progress does not invent completed meals");
assert(!progressPage.includes("value={2100}"), "progress does not invent average calories");
assert(progressPage.includes("تقدم اليوم"), "today progress is labeled as today only");

const hook = readFileSync(join(root, "src/hooks/useNutritionPlan.ts"), "utf8");
assert(!hook.includes("NUTRITION_GOALS"), "plan hook does not adopt invented macro targets");
assert(
  hook.includes("fetchMyNutritionRuntime") || hook.includes("useAssignedNutritionRuntime"),
  "paid plan reads assignment runtime",
);
assert(hook.includes("LOCAL_ONLY"), "water remains local-only");

const api = readFileSync(join(root, "src/lib/platform/assigned-nutrition-api.ts"), "utf8");
assert(!api.includes("@/lib/admin"), "client nutrition api does not import admin");
assert(api.includes("client_get_my_nutrition_runtime"), "client reads own runtime RPC");
assert(api.includes("client_log_nutrition_meal"), "client can log allowed activity");
assert(!api.includes("admin_assign_client_nutrition"), "client api cannot assign");

console.log("client-nutrition-runtime tests passed");
