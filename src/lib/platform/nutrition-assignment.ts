export const NUTRITION_SLOT_KEYS = ["breakfast", "snack", "lunch", "dinner"] as const;
export type NutritionSlotKey = (typeof NUTRITION_SLOT_KEYS)[number];

export const NUTRITION_SLOT_LABELS: Record<NutritionSlotKey, string> = {
  breakfast: "الفطور",
  snack: "سناك",
  lunch: "الغداء",
  dinner: "العشاء",
};

export const NUTRITION_WATER_SOURCE = "LOCAL_ONLY" as const;
export const NUTRITION_MACRO_TARGETS = "DOMAIN_RULE_REQUIRED" as const;
export const NUTRITION_SHOPPING_FROM_ASSIGNMENT = "OPTIONAL_PHASE_7_EXTENSION" as const;

export function scaleMacros(input: {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  servings: number;
}) {
  const servings = Number.isFinite(input.servings) && input.servings > 0 ? input.servings : 1;
  return {
    calories: Math.round(input.calories * servings),
    protein: Math.round(input.protein_g * servings * 10) / 10,
    carbs: Math.round(input.carbs_g * servings * 10) / 10,
    fat: Math.round(input.fat_g * servings * 10) / 10,
  };
}

export function allergenOverlap(left: string[] | null | undefined, right: string[] | null | undefined): string[] {
  const a = new Set((left ?? []).map((item) => item.trim().toLowerCase()).filter(Boolean));
  return [...new Set((right ?? []).map((item) => item.trim()).filter((item) => a.has(item.toLowerCase())))];
}

export type NutritionAttentionSignal =
  | "no_active_nutrition"
  | "nutrition_starts_soon"
  | "allergen_conflict"
  | "library_allergen_review"
  | "legacy_nutrition";

export function nutritionAttentionSignals(input: {
  status: string | null;
  startsOn: string | null;
  snapshotComplete: boolean | null;
  allergenConflict?: boolean | null;
  libraryAllergenReview?: boolean | null;
  today?: string;
}): NutritionAttentionSignal[] {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  if (!input.status) return ["no_active_nutrition"];
  const signals: NutritionAttentionSignal[] = [];
  if (input.snapshotComplete === false) signals.push("legacy_nutrition");
  if (input.allergenConflict) signals.push("allergen_conflict");
  if (input.libraryAllergenReview) signals.push("library_allergen_review");
  if (input.status === "scheduled" && input.startsOn) {
    const diff = Math.floor(
      (Date.parse(`${input.startsOn}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
    );
    if (diff >= 0 && diff <= 7) signals.push("nutrition_starts_soon");
  }
  return signals;
}

export function nutritionSignalLabel(signal: NutritionAttentionSignal): string {
  if (signal === "no_active_nutrition") return "لا خطة تغذية نشطة";
  if (signal === "nutrition_starts_soon") return "خطة التغذية تبدأ قريباً";
  if (signal === "allergen_conflict") return "تعارض حساسية يحتاج مراجعة";
  if (signal === "library_allergen_review") return "تغيّرت حساسية وجبة في المكتبة وتحتاج مراجعة";
  return "تعيين تغذية بلا لقطة مكتملة";
}

export function validateServings(value: number): string | null {
  if (!Number.isFinite(value) || value <= 0) return "invalid_servings";
  return null;
}

export function nutritionStatusLabel(status: string): string {
  if (status === "scheduled") return "مجدول";
  if (status === "active") return "نشط";
  if (status === "completed") return "مكتمل";
  if (status === "replaced") return "مستبدل";
  if (status === "cancelled") return "ملغى";
  return status;
}

export function nutritionLogIsLegacyUnlinked(assignmentId: string | null): boolean {
  return !assignmentId;
}

export function parseWatchAllergens(raw: string): string[] {
  return [...new Set(raw.split(/[,،]/).map((item) => item.trim()).filter(Boolean))];
}
