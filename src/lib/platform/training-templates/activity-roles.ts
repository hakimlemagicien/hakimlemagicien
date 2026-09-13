/**
 * Activity / block roles for Program Templates.
 * Not all roles use sets×reps semantics — prescription model is declared per role.
 */

export const TEMPLATE_ACTIVITY_ROLES = [
  "GENERAL_WARM_UP",
  "TARGETED_DYNAMIC_WARM_UP",
  "EXERCISE_SPECIFIC_RAMP_UP",
  "MAIN_RESISTANCE",
  "POST_WORKOUT_CARDIO",
  "AEROBIC_ENDURANCE_BLOCK",
  "CONTROLLED_AEROBIC_INTERVAL_BLOCK",
  "POWER_SKILL_BLOCK",
  "MOBILITY_ACTIVITY",
  "DAILY_ACTIVITY",
] as const;

export type TemplateActivityRole = (typeof TEMPLATE_ACTIVITY_ROLES)[number];

export const PRESCRIPTION_MODELS = [
  "SETS_REPS_LOAD",
  "DURATION",
  "DISTANCE",
  "TIME_HOLD",
  "QUALITY_REPS",
  "STEPS_OR_DAILY",
  "INTERVAL_STRUCTURE",
] as const;

export type PrescriptionModel = (typeof PRESCRIPTION_MODELS)[number];

export const DEFAULT_PRESCRIPTION_MODEL_FOR_ROLE: Record<TemplateActivityRole, PrescriptionModel> = {
  GENERAL_WARM_UP: "DURATION",
  TARGETED_DYNAMIC_WARM_UP: "DURATION",
  EXERCISE_SPECIFIC_RAMP_UP: "SETS_REPS_LOAD",
  MAIN_RESISTANCE: "SETS_REPS_LOAD",
  POST_WORKOUT_CARDIO: "DURATION",
  AEROBIC_ENDURANCE_BLOCK: "DURATION",
  CONTROLLED_AEROBIC_INTERVAL_BLOCK: "INTERVAL_STRUCTURE",
  POWER_SKILL_BLOCK: "QUALITY_REPS",
  MOBILITY_ACTIVITY: "DURATION",
  DAILY_ACTIVITY: "STEPS_OR_DAILY",
};

export function isTemplateActivityRole(value: unknown): value is TemplateActivityRole {
  return typeof value === "string" && (TEMPLATE_ACTIVITY_ROLES as readonly string[]).includes(value);
}

export function isPrescriptionModel(value: unknown): value is PrescriptionModel {
  return typeof value === "string" && (PRESCRIPTION_MODELS as readonly string[]).includes(value);
}

/** Shared Arabic labels for Admin + Client runtime presentation (presentation only). */
export const ACTIVITY_ROLE_LABELS_AR: Record<TemplateActivityRole, string> = {
  GENERAL_WARM_UP: "إحماء عام",
  TARGETED_DYNAMIC_WARM_UP: "إحماء ديناميكي مستهدف",
  EXERCISE_SPECIFIC_RAMP_UP: "تهيئة خاصة بالتمرين",
  MAIN_RESISTANCE: "مقاومة رئيسية",
  POST_WORKOUT_CARDIO: "كارديو بعد التمرين",
  AEROBIC_ENDURANCE_BLOCK: "تحمّل هوائي",
  CONTROLLED_AEROBIC_INTERVAL_BLOCK: "فترات هوائية محكمة",
  POWER_SKILL_BLOCK: "مهارة قوة",
  MOBILITY_ACTIVITY: "مرونة/حركة",
  DAILY_ACTIVITY: "نشاط يومي",
};

export function activityRoleLabelAr(role: string | null | undefined): string {
  if (!role) return "تمرين";
  if (isTemplateActivityRole(role)) return ACTIVITY_ROLE_LABELS_AR[role];
  return role;
}

/** Map legacy builder exercise roles → activity role (lossy; for compatibility only). */
export function activityRoleFromLegacyExerciseRole(
  role: string | null | undefined,
): TemplateActivityRole {
  if (role === "warmup") return "GENERAL_WARM_UP";
  if (role === "finisher") return "POST_WORKOUT_CARDIO";
  if (role === "accessory") return "MAIN_RESISTANCE";
  return "MAIN_RESISTANCE";
}
