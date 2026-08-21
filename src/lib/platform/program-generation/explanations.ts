import type { TrainingV2CanonicalGoal } from "@/lib/platform/training-v2-contracts";
import type { GenerationReasonCode } from "./types";

export const PROGRAM_COPY = {
  INITIAL: "تم بناء برنامج مقاومة يتبع أولوية الهدف وحجم التدريب القابل للتعافي.",
  GLUTE: "تم زيادة التركيز التدريبي على المؤخرة مع الحفاظ على حجم الجزء السفلي ضمن قدرتك على التعافي.",
  ARMS_REALLOCATION: "أعدنا توزيع تمارين الجزء العلوي لأن الذراعين يتقدمان بوتيرة أبطأ من الكتفين.",
  FAT_LOSS: "البرنامج يعتمد تدريب المقاومة القابل للتعافي. عجز الطاقة مسؤولية التغذية وليس حرق السعرات داخل التمرين.",
  WAIST: "التدريب يدعم وظيفة الجذع والمقاومة الكاملة. لا يوجد حرق موضعي للدهون من تمارين البطن.",
  POSTURE: "التركيز على السحب والجزء الخلفي والجذع. هذا تدريب وليست خطة علاجية.",
  RECONDITIONING: "أبقينا مستواك التدريبي، مع تخفيض الكثافة الحالية حتى يعود التعافي.",
  BLOCKED: "لا يمكن تفعيل برنامج غير صالح. راجع القيود أو المكتبة أو المدة المتاحة.",
} as const;

export function clientProgramExplanation(input: {
  goal: TrainingV2CanonicalGoal;
  reason: GenerationReasonCode;
  reallocation?: { from_region?: string | null; to_region?: string | null } | null;
  reconditioning?: boolean;
}): string {
  if (input.reconditioning) return PROGRAM_COPY.RECONDITIONING;
  if (input.goal === "FAT_LOSS") return PROGRAM_COPY.FAT_LOSS;
  if (input.goal === "SLIM_TONED_WAIST") return PROGRAM_COPY.WAIST;
  if (input.goal === "POSTURE_TONED_BACK") return PROGRAM_COPY.POSTURE;
  const to = input.reallocation?.to_region?.toUpperCase() ?? "";
  const from = input.reallocation?.from_region?.toUpperCase() ?? "";
  if ((to.includes("BICEP") || to.includes("TRICEP")) && from.includes("SHOULDER")) {
    return PROGRAM_COPY.ARMS_REALLOCATION;
  }
  if (input.goal === "GLUTE_GROWTH") return PROGRAM_COPY.GLUTE;
  return PROGRAM_COPY.INITIAL;
}
