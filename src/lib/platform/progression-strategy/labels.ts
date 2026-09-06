import { explainProgression } from "@/lib/platform/progression/explanations";
import type { ProgressionReasonCode } from "@/lib/platform/progression/types";
import type {
  AutomationOwner,
  ProgramSource,
  ProgressionStatus,
  ProgressionStrategy,
} from "./types";

export const PROGRESSION_STRATEGY_OPTIONS: Array<{
  id: ProgressionStrategy;
  label_ar: string;
  description_ar: string;
}> = [
  {
    id: "SMART_PROGRESSION_EXERCISE_LOCKED",
    label_ar: "التطور الذكي — التمارين ثابتة",
    description_ar: "يراجع MAAKFIT الأداء ويطور الوصفة تلقائيًا مع الحفاظ على نفس التمارين.",
  },
  {
    id: "MATRIX_MANAGED_PROGRESSION",
    label_ar: "تطور Strategy Matrix",
    description_ar: "إدارة التطور باستخدام Training Strategy الحالية وقواعد Matrix المعتمدة.",
  },
  {
    id: "COACH_MANAGED",
    label_ar: "إدارة المدرب",
    description_ar: "يعرض النظام البيانات والتوصيات، بينما تتم التعديلات بواسطة المدرب.",
  },
];

export function progressionStrategyLabel(strategy: ProgressionStrategy): string {
  return PROGRESSION_STRATEGY_OPTIONS.find((item) => item.id === strategy)?.label_ar ?? strategy;
}

export function progressionStrategyDescription(strategy: ProgressionStrategy): string {
  return PROGRESSION_STRATEGY_OPTIONS.find((item) => item.id === strategy)?.description_ar ?? "";
}

export function programSourceLabel(source: ProgramSource): string {
  if (source === "STRATEGY_MATRIX") return "Strategy Matrix";
  if (source === "PROGRAM_TEMPLATE") return "Program Template";
  return "برنامج المدرب";
}

export function progressionStatusLabel(status: ProgressionStatus): string {
  if (status === "ACTIVE") return "نشط";
  if (status === "WAITING_FOR_DATA") return "بانتظار بيانات كافية";
  if (status === "REVIEW_REQUIRED") return "تحتاج مراجعة";
  return "متوقف";
}

export function automationOwnerLabel(owner: AutomationOwner): string {
  return owner === "AUTO" ? "تلقائي" : "المدرب فقط";
}

export function progressionDecisionLabel(reason: ProgressionReasonCode | "NO_DATA" | "EXERCISE_REVIEW_RECOMMENDED"): string {
  if (reason === "NO_DATA") return "بانتظار بيانات الأداء";
  if (reason === "EXERCISE_REVIEW_RECOMMENDED") {
    return "هذا التمرين يحتاج مراجعة المدرب قبل أي تغيير إضافي.";
  }
  return explainProgression(reason as ProgressionReasonCode);
}

export function clientProgressionHint(didProgress: boolean): string | null {
  if (!didProgress) return null;
  return "تم تحديث هدفك للجلسة القادمة";
}
