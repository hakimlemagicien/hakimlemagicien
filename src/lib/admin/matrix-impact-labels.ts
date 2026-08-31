import type { CoachOverrideReviewStatus, CoachOverrideType } from "@/lib/platform/coach-override/types";

export function reviewStatusLabelAr(status: CoachOverrideReviewStatus): string {
  if (status === "SAFE") return "تعديل متوافق";
  if (status === "SAFE_WITH_IMPACT") return "مسموح مع أثر تدريبي";
  if (status === "ALTERNATIVE_RECOMMENDED") return "بديل أوضح موصى به";
  if (status === "BLOCKED") return "التعديل ممنوع";
  return status;
}

export function reviewStatusTone(status: CoachOverrideReviewStatus): string {
  if (status === "SAFE") return "safe";
  if (status === "SAFE_WITH_IMPACT") return "impact";
  if (status === "ALTERNATIVE_RECOMMENDED") return "alternative";
  if (status === "BLOCKED") return "blocked";
  return "neutral";
}

export function overrideTypeLabelAr(type: CoachOverrideType): string {
  const labels: Record<CoachOverrideType, string> = {
    TRAINING_DAYS_CHANGE: "تغيير أيام التدريب",
    PREFERRED_WEEKDAYS_CHANGE: "أيام التفضيل",
    SESSION_DURATION_CHANGE: "مدة الجلسة",
    EXERCISE_REPLACE: "استبدال تمرين",
    EXERCISE_EXCLUDE: "استبعاد تمرين",
    EXERCISE_LOCK: "قفل تمرين",
    TRAINING_LOCATION_CHANGE: "بيئة التدريب",
    AVAILABLE_EQUIPMENT_CHANGE: "المعدات المتاحة",
    TRAINING_FREQUENCY_CHANGE: "تكرار أسبوعي",
    TEMPORARY_CONSTRAINT: "قيود مؤقتة",
  };
  return labels[type] ?? type;
}
