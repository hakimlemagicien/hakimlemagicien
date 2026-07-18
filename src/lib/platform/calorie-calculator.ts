export const CALORIE_CALCULATOR_VERSION = "1.0.0";

export type CaloriePreviewGoal = "cut" | "maintain" | "bulk";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const GOAL_CALORIE_ADJUSTMENT: Record<CaloriePreviewGoal, number> = {
  cut: -300,
  maintain: 0,
  bulk: 300,
};

export type CalorieCalculatorInput = {
  gender: "male" | "female";
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  actualGoal: CaloriePreviewGoal;
};

export type MacroBreakdown = {
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  proteinKcal: number;
  carbsKcal: number;
  fatKcal: number;
};

export type CalorieCalculatorResult = {
  bmr: number;
  tdee: number;
  targetCalories: number;
  previewGoal: CaloriePreviewGoal;
  isPreview: boolean;
  macros: MacroBreakdown | null;
  version: string;
};

export const PREVIEW_GOAL_LABELS_AR: Record<CaloriePreviewGoal, string> = {
  cut: "خسارة الدهون",
  maintain: "الحفاظ على الوزن",
  bulk: "بناء العضلات",
};

export function mapGoalIdToPreviewGoal(goalId: string | null | undefined): CaloriePreviewGoal {
  const key = goalId?.toLowerCase() ?? "";
  if (key === "cut" || key === "fat-loss" || key === "fat_loss") return "cut";
  if (key === "bulk" || key === "muscle") return "bulk";
  return "maintain";
}

export function mapActivityLevel(value: string | null | undefined): ActivityLevel | null {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/-/g, "_");
  if (normalized in ACTIVITY_MULTIPLIERS) return normalized as ActivityLevel;
  if (normalized === "very active" || normalized === "veryactive") return "very_active";
  return null;
}

export function computeAgeFromBirthDate(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 14 && age <= 100 ? age : null;
}

export type CalorieInputValidation = {
  complete: boolean;
  missing: string[];
};

export function validateCalorieInput(partial: {
  gender?: "male" | "female" | null;
  age?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  activityLevel?: ActivityLevel | null;
  goal?: CaloriePreviewGoal | null;
}): CalorieInputValidation {
  const missing: string[] = [];
  if (!partial.gender) missing.push("الجنس");
  if (!partial.age) missing.push("العمر أو تاريخ الميلاد");
  if (!partial.heightCm) missing.push("الطول");
  if (!partial.weightKg) missing.push("الوزن الحالي");
  if (!partial.activityLevel) missing.push("مستوى النشاط");
  if (!partial.goal) missing.push("الهدف");
  return { complete: missing.length === 0, missing };
}

export function computeBmr(input: Pick<CalorieCalculatorInput, "gender" | "age" | "weightKg" | "heightCm">): number {
  const { gender, age, weightKg, heightCm } = input;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === "male" ? base + 5 : base - 161);
}

export function computeTdee(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function computeTargetCalories(tdee: number, previewGoal: CaloriePreviewGoal): number {
  return Math.max(1200, Math.round(tdee + GOAL_CALORIE_ADJUSTMENT[previewGoal]));
}

export function computeMacros(targetCalories: number, weightKg: number): MacroBreakdown | null {
  if (targetCalories <= 0 || weightKg <= 0) return null;

  const proteinG = Math.round(weightKg * 2);
  const proteinKcal = proteinG * 4;
  const fatKcal = Math.round(targetCalories * 0.25);
  const fatG = Math.round(fatKcal / 9);
  const carbsKcal = targetCalories - proteinKcal - fatKcal;

  if (carbsKcal < 0) return null;

  const carbsG = Math.round(carbsKcal / 4);
  const totalKcal = proteinKcal + fatKcal + carbsG * 4;
  const safeTotal = totalKcal > 0 ? totalKcal : targetCalories;

  return {
    proteinG,
    carbsG,
    fatG,
    proteinKcal,
    carbsKcal: carbsG * 4,
    fatKcal,
    proteinPct: Math.round((proteinKcal / safeTotal) * 100),
    carbsPct: Math.round(((carbsG * 4) / safeTotal) * 100),
    fatPct: Math.round((fatKcal / safeTotal) * 100),
  };
}

export function computeCalorieCalculatorResult(
  input: CalorieCalculatorInput,
  previewGoal: CaloriePreviewGoal,
): CalorieCalculatorResult {
  const bmr = computeBmr(input);
  const tdee = computeTdee(bmr, input.activityLevel);
  const targetCalories = computeTargetCalories(tdee, previewGoal);
  const macros = computeMacros(targetCalories, input.weightKg);

  return {
    bmr,
    tdee,
    targetCalories,
    previewGoal,
    isPreview: previewGoal !== input.actualGoal,
    macros,
    version: CALORIE_CALCULATOR_VERSION,
  };
}

/** Self-check examples for QA / manual verification. */
export function calorieCalculatorSelfChecks(): { name: string; pass: boolean }[] {
  const male: CalorieCalculatorInput = {
    gender: "male",
    age: 28,
    weightKg: 82,
    heightCm: 178,
    activityLevel: "moderate",
    actualGoal: "cut",
  };
  const result = computeCalorieCalculatorResult(male, "cut");
  const bmrExpected = Math.round(10 * 82 + 6.25 * 178 - 5 * 28 + 5);
  return [
    { name: "BMR male sample", pass: result.bmr === bmrExpected },
    { name: "TDEE uses multiplier", pass: result.tdee === Math.round(bmrExpected * 1.55) },
    { name: "Cut adjustment -300", pass: result.targetCalories === result.tdee - 300 },
    { name: "Preview flag", pass: result.isPreview === false },
    {
      name: "Preview differs from actual",
      pass: computeCalorieCalculatorResult(male, "bulk").isPreview === true,
    },
    { name: "Macros present", pass: result.macros !== null && result.macros.proteinG === 164 },
  ];
}
