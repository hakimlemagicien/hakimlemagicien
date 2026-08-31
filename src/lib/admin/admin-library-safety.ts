import { isInCore100Pool } from "@/lib/platform/strategy-matrix/core-100";

export type LibraryImpactWarning = {
  title: string;
  reason: string;
  isCore100: boolean;
  fields: string[];
  clientImpactKnown: false;
};

const EXERCISE_SENSITIVE_FIELDS = [
  "location_compatibility",
  "equipment_state",
  "required_equipment",
  "primary_muscle_canonical",
  "primary_movement_role",
  "mechanics",
  "v2_metadata_status",
  "beginner_eligible",
] as const;

const MEAL_SENSITIVE_FIELDS = ["allergens", "ingredients", "meal_type", "status"] as const;

function fieldChanged<T extends Record<string, unknown>>(
  before: T,
  after: T,
  key: keyof T,
): boolean {
  return JSON.stringify(before[key]) !== JSON.stringify(after[key]);
}

export function detectExerciseSensitiveChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): LibraryImpactWarning | null {
  const fields = EXERCISE_SENSITIVE_FIELDS.filter((key) => fieldChanged(before, after, key));
  if (fields.length === 0) return null;
  const externalId = String(after.external_id ?? before.external_id ?? "");
  const isCore100 = externalId ? isInCore100Pool(externalId) : false;
  return {
    title: isCore100 ? "تعديل حساس — تمرين Core 100" : "تعديل حساس على مكتبة التمارين",
    reason:
      "هذا التعديل قد يؤثر على اختيار التمرين داخل البرامج المولَّدة ومحرك Strategy Matrix. تأثير العملاء الحاليين غير محسوب تلقائيًا.",
    isCore100,
    fields: [...fields],
    clientImpactKnown: false,
  };
}

export function detectMealSensitiveChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  ingredientsDirty: boolean,
): LibraryImpactWarning | null {
  const fields = MEAL_SENSITIVE_FIELDS.filter((key) => fieldChanged(before, after, key));
  if (ingredientsDirty && !fields.includes("ingredients")) fields.push("ingredients");
  if (fields.length === 0) return null;
  return {
    title: "تعديل حساس على مكتبة الوجبات",
    reason:
      "تغيير المكوّنات أو مسببات الحساسية قد يؤثر على سلامة خطط العملاء المستقبلية. تأثير العملاء الحاليين غير محسوب تلقائيًا.",
    isCore100: false,
    fields,
    clientImpactKnown: false,
  };
}
