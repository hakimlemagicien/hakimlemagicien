import { resolveCanonicalGoal, getGoalMuscleProfile } from "@/lib/platform/prescription/goal-profile";
import { GOAL_COPY } from "@/lib/platform/goal-intelligence/explanations";
import { explainProgression } from "@/lib/platform/progression/explanations";
import { CONTINUITY_COPY } from "@/lib/platform/continuity/explanations";
import { PROGRAM_COPY } from "@/lib/platform/program-generation/explanations";
import type { TrainingV2CanonicalGoal } from "@/lib/platform/training-v2-contracts";
import type { GoalResponseState } from "@/lib/platform/goal-intelligence/types";
import type { ProgressionAction, ProgressionReasonCode } from "@/lib/platform/progression/types";
import type { VolumeAction } from "@/lib/platform/volume/types";
import type { ContinuityAction } from "@/lib/platform/continuity/types";
import type { ClientExplanation, ClientGoalTone } from "./types";

export const GOAL_DISPLAY_NAMES: Record<TrainingV2CanonicalGoal, string> = {
  GLUTE_GROWTH: "نمو المؤخرة",
  SLIM_TONED_WAIST: "خصر مشدود",
  TONED_ARMS_UPPER_BODY: "ذراعان وجزء علوي",
  FEMININE_BALANCED_BODY: "جسم متوازن",
  FAT_LOSS: "خسارة الدهون",
  POSTURE_TONED_BACK: "ظهر وقوام مشدود",
  MUSCLE_GROWTH: "بناء العضلات",
  FITNESS_ENERGY: "لياقة وطاقة",
  ATHLETIC_PHYSIQUE: "قوام رياضي",
  BODY_RESHAPE: "تغيير الشكل",
  HEALTHY_WEIGHT_GAIN: "زيادة وزن صحي",
};

export const REGION_LABELS: Record<string, string> = {
  GLUTES: "المؤخرة",
  QUADRICEPS: "مقدمة الفخذ",
  HAMSTRINGS: "الخلفية",
  BICEPS: "الذراعان",
  TRICEPS: "الترايسبس",
  SHOULDERS: "الكتفان",
  UPPER_BACK: "أعلى الظهر",
  LATS: "الظهر",
  CORE: "الجذع",
  CHEST: "الصدر",
};

export function goalDisplayName(goalId: string | null | undefined) {
  const mapped = resolveCanonicalGoal(goalId).canonicalId;
  if (!mapped) return "هدفك التدريبي";
  return GOAL_DISPLAY_NAMES[mapped];
}

export function mapGoalStatus(state: GoalResponseState | null | undefined): ClientExplanation & {
  tone: ClientGoalTone;
  status_key: string;
} {
  if (!state || state === "INSUFFICIENT_DATA") {
    return {
      title: "نحتاج المزيد من البيانات",
      short_reason: "نحتاج إلى بعض الحصص الإضافية حتى نقيس استجابتك بدقة.",
      client_action: "أكمل حصصك القادمة كالمعتاد.",
      importance: "normal",
      tone: "neutral",
      status_key: "INSUFFICIENT_DATA",
    };
  }
  if (state === "ON_TRACK") {
    return {
      title: "تقدمك يسير في الاتجاه الصحيح",
      short_reason: GOAL_COPY.ON_TRACK,
      client_action: "استمر على نفس الخطة.",
      importance: "normal",
      tone: "positive",
      status_key: state,
    };
  }
  if (state === "PARTIAL_RESPONSE" || state === "REGIONAL_UNDER_RESPONSE") {
    return {
      title: "قمنا بتعديل التركيز التدريبي",
      short_reason: GOAL_COPY.PARTIAL,
      client_action: "ستلاحظ تركيزًا أوضح على مناطق هدفك في الحصص القادمة.",
      importance: "normal",
      tone: "caution",
      status_key: state,
    };
  }
  if (state === "ADHERENCE_LIMITED") {
    return {
      title: "نحتاج انتظامًا أوضح قبل التقييم",
      short_reason: "لم نُكمل عددًا كافيًا من الحصص بعد لتقييم الهدف بدقة.",
      client_action: "افتح البرنامج وأكمل الحصة التالية عندما يناسبك.",
      importance: "normal",
      tone: "neutral",
      status_key: state,
    };
  }
  if (state === "RECOVERY_LIMITED") {
    return {
      title: "نحتاج إلى مزيد من التعافي",
      short_reason: "سنثبت الحمل حاليًا لدعم التعافي قبل أي زيادة.",
      client_action: "ركّز على النوم والحصص الحالية دون الضغط لرفع الأوزان.",
      importance: "high",
      tone: "caution",
      status_key: state,
    };
  }
  if (state === "PROGRAM_LIMITED") {
    return {
      title: "الخطة تحتاج مراجعة هيكل",
      short_reason: GOAL_COPY.PROGRAM,
      client_action: "افتح برنامجك لمعرفة التركيز الحالي.",
      importance: "high",
      tone: "caution",
      status_key: state,
    };
  }
  if (state === "BODY_COMPOSITION_LIMITED" || state === "NUTRITION_REVIEW_REQUIRED") {
    return {
      title: "جانب التدريب يسير جيدًا",
      short_reason: GOAL_COPY.BODY,
      client_action: "التدريب يستمر. مراجعة التغذية/تكوين الجسم منفصلة وليست تعليمات سعرات.",
      importance: "normal",
      tone: "neutral",
      status_key: state,
    };
  }
  if (state === "TRADEOFF_DETECTED") {
    return {
      title: "نراجع التوازن بين أهدافك",
      short_reason: GOAL_COPY.TRADEOFF,
      client_action: "لا تغيير صامت للسعرات من التدريب.",
      importance: "high",
      tone: "caution",
      status_key: state,
    };
  }
  if (state === "SAFETY_REVIEW") {
    return {
      title: "نراجع السلامة أولاً",
      short_reason: GOAL_COPY.SAFETY,
      client_action: "اتبع تعليمات التنفيذ المريح. لا زيادة حمل الآن.",
      importance: "high",
      tone: "caution",
      status_key: state,
    };
  }
  if (state === "COACH_REVIEW_REQUIRED") {
    return {
      title: "خطتك بانتظار مراجعة المدرب",
      short_reason: GOAL_COPY.COACH,
      client_action: "يمكنك متابعة الحصص الحالية دون تغيير صامت.",
      importance: "high",
      tone: "caution",
      status_key: state,
    };
  }
  if (state === "STAGNANT_REVIEW") {
    return {
      title: "نراجع الاستجابة الحالية",
      short_reason: GOAL_COPY.STAGNANT,
      client_action: "استمر على الحصص الحالية حتى تكتمل المراجعة.",
      importance: "normal",
      tone: "caution",
      status_key: state,
    };
  }
  return {
    title: "تقدّمك قيد المتابعة",
    short_reason: GOAL_COPY.INSUFFICIENT,
    client_action: "أكمل الحصص القادمة.",
    importance: "normal",
    tone: "neutral",
    status_key: state,
  };
}

export function mapProgressionAction(
  action: ProgressionAction,
  reason: ProgressionReasonCode,
): ClientExplanation {
  const engine = explainProgression(reason);
  if (action === "INCREASE_LOAD" || action === "INCREASE_REPS" || action === "INCREASE_DURATION") {
    return {
      title: "تقدم في الأداء",
      short_reason: engine,
      client_action: "ستجد الوصفة المحدّثة في الحصة القادمة.",
      importance: "normal",
    };
  }
  if (action === "DECREASE_LOAD") {
    return {
      title: "عدّلنا الحمل ليبقى مناسبًا",
      short_reason: engine,
      client_action: "هذا ضبط للأداء والتعافي، وليس تراجعًا.",
      importance: "normal",
    };
  }
  if (action === "KEEP_LOAD" || action === "KEEP_DURATION") {
    return {
      title: "نثبت الأداء الحالي",
      short_reason: engine,
      client_action: "الحفاظ على الوزن حتى يثبت الحد الأعلى من التكرارات خطوة صحيحة.",
      importance: "low",
    };
  }
  if (action === "HOLD_PROGRESSION" || action === "RECOVERY_REVIEW") {
    return {
      title: "سنثبت التقدم مؤقتًا لدعم التعافي",
      short_reason: engine,
      client_action: "لا حاجة لزيادة الحمل الآن.",
      importance: "normal",
    };
  }
  if (action === "RECALIBRATE") {
    return {
      title: "نضبط الحمل من أدائك الحالي",
      short_reason: engine,
      client_action: "لن نعيد أعلى رقم سابق تلقائيًا.",
      importance: "normal",
    };
  }
  return {
    title: "وصفة التمرين محدّثة حسب أدائك",
    short_reason: engine,
    client_action: "افتح الحصة التالية للمتابعة.",
    importance: "low",
  };
}

export function mapVolumeAction(action: VolumeAction): ClientExplanation | null {
  if (action === "DELOAD_REVIEW") {
    return {
      title: "تخفيف مؤقت لدعم الأداء",
      short_reason: "سنخفف الضغط التدريبي مؤقتًا لمساعدتك على استعادة الأداء.",
      client_action: "اتبع الحصص المخفّفة كخطة تعافٍ، لا كعقوبة.",
      importance: "high",
    };
  }
  if (action === "HOLD_VOLUME_PROGRESSION") {
    return {
      title: "نثبت الحجم التدريبي",
      short_reason: "سنثبت التقدم مؤقتًا لدعم التعافي.",
      client_action: "لا زيادة في عدد المجموعات الآن.",
      importance: "normal",
    };
  }
  if (action === "REDUCE_VOLUME") {
    return {
      title: "خفّفنا الحجم هذا الأسبوع",
      short_reason: "تم تخفيف الحجم التدريبي هذا الأسبوع لتحسين التعافي.",
      client_action: "التركيز على جودة التنفيذ.",
      importance: "normal",
    };
  }
  if (action === "ADD_SMALL_VOLUME") {
    return {
      title: "زيادة بسيطة في التركيز",
      short_reason: "زدنا التركيز قليلًا ضمن قدرتك على التعافي.",
      client_action: "ستلاحظ مجموعة إضافية في التمارين ذات الأولوية.",
      importance: "low",
    };
  }
  if (action === "REALLOCATE_VOLUME") {
    return {
      title: "أعدنا توزيع التركيز",
      short_reason: "نقلنا التركيز بين المناطق دون زيادة إجمالي الضغط.",
      client_action: "راجع الحصص القادمة.",
      importance: "normal",
    };
  }
  if (action === "RECONDITIONING") {
    return {
      title: "عودة تدريجية",
      short_reason: PROGRAM_COPY.RECONDITIONING,
      client_action: "سنعود تدريجيًا إلى مستواك السابق بناءً على أدائك الحالي.",
      importance: "high",
    };
  }
  return null;
}

export function mapContinuityAction(action: ContinuityAction): ClientExplanation {
  const text = CONTINUITY_COPY[action] ?? CONTINUITY_COPY.CONTINUE_SEQUENCE;
  if (action === "ENTER_RECONDITIONING") {
    return {
      title: "عودة تدريجية",
      short_reason: text,
      client_action: "ابدأ من الحصة الحالية دون مقارنة بأعلى رقم سابق.",
      importance: "high",
    };
  }
  if (action === "RESUME_SESSION") {
    return {
      title: "حصة قيد التنفيذ",
      short_reason: text,
      client_action: "افتح التمرين لإكمال ما بدأته.",
      importance: "high",
    };
  }
  if (action === "RESCHEDULE_SESSION" || action === "DEFER_SESSION") {
    return {
      title: "حدّثنا ترتيب الحصص",
      short_reason: text,
      client_action: "افتح البرنامج لمعرفة الحصة التالية. لا يوجد دين تعويض.",
      importance: "normal",
    };
  }
  if (action === "ADVANCE_AFTER_PARTIAL") {
    return {
      title: "حفظنا ما أنجزته",
      short_reason: "أكملت الجزء الأساسي من الحصة، وتم حفظ كل ما أنجزته.",
      client_action: "تابع من الحصة التالية.",
      importance: "normal",
    };
  }
  return {
    title: "ترتيب الحصص محدّث",
    short_reason: text,
    client_action: "افتح برنامجك لمعرفة الخطوة التالية.",
    importance: "low",
  };
}

export function reallocationCopy(from: string, to: string, goal: TrainingV2CanonicalGoal | null) {
  const fromL = REGION_LABELS[from] ?? from;
  const toL = REGION_LABELS[to] ?? to;
  if (goal === "GLUTE_GROWTH" || to.includes("GLUTE")) {
    return "لاحظنا أن الجزء الأمامي من الساق يتقدم أسرع من الهدف الأساسي، لذلك أعدنا توزيع بعض التمارين لزيادة التركيز على المؤخرة دون زيادة إجمالي الضغط التدريبي.";
  }
  if (goal === "TONED_ARMS_UPPER_BODY" || to.includes("BICEP") || to.includes("TRICEP")) {
    return "أعدنا توزيع تمارين الجزء العلوي لأن الذراعين يتقدمان بوتيرة أبطأ من الكتفين.";
  }
  return `أعدنا توزيع التركيز من ${fromL} إلى ${toL} دون زيادة الحجم الكلي.`;
}

export function goalSignals(goal: TrainingV2CanonicalGoal | null) {
  if (!goal) return { regional: [] as string[], body: false };
  const profile = getGoalMuscleProfile(goal);
  if (goal === "GLUTE_GROWTH") return { regional: ["GLUTES", "QUADRICEPS"], body: true };
  if (goal === "TONED_ARMS_UPPER_BODY") return { regional: ["BICEPS", "TRICEPS", "SHOULDERS", "UPPER_BACK"], body: false };
  if (goal === "SLIM_TONED_WAIST") return { regional: ["CORE"], body: true };
  if (goal === "POSTURE_TONED_BACK") return { regional: ["UPPER_BACK", "LATS", "CORE"], body: false };
  if (goal === "FEMININE_BALANCED_BODY") return { regional: ["GLUTES", "UPPER_BACK", "CORE"], body: true };
  return { regional: profile.secondary.slice(0, 4), body: goal === "FAT_LOSS" };
}

export const FORBIDDEN_CLIENT_PHRASES = [
  "genetically",
  "وراثيًا بطيئة",
  "Calories burned",
  "سعرات التمرين",
  "You failed",
  "فشلت",
  "You owe",
  "تعويض الحصة المفقودة",
  "Beginner",
  "مبتدئ",
  "medically corrected",
  "تصحيح طبي",
  "Overall Goal Score",
  "body-fat estimate",
  "خفض 200 سعرة",
];
