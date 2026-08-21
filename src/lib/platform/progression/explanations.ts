import type { ProgressionReasonCode } from "./types";

export const PROGRESSION_EXPLANATIONS_AR: Partial<Record<ProgressionReasonCode, string>> = {
  REP_RANGE_NOT_MAXED: "حافظنا على نفس الوزن حتى تكمل نطاق التكرارات بثبات.",
  TOP_RANGE_MASTERED:
    "أكملت الحد الأعلى من التكرارات، لذلك سنزيد الوزن بشكل بسيط في المرة القادمة.",
  TOP_RANGE_EASY: "أكملت الحد الأعلى بسهولة، وسنزيد الحمل بأقل زيادة متاحة.",
  EFFORT_TOO_HIGH: "سنحافظ على نفس الحمل لأن الجهد كان مرتفعًا جدًا رغم الوصول للعدد.",
  NEW_LOAD_TOLERATED: "الحمل الجديد مناسب حتى لو انخفضت التكرارات داخل النطاق.",
  NEW_LOAD_NOT_TOLERATED: "سنعدل الحمل ليبقى الأداء داخل النطاق المناسب.",
  BELOW_REP_MIN: "سنخفض الحمل قليلًا لأن التكرارات كانت تحت الحد الأدنى بشكل متكرر.",
  RECOVERY_HOLD: "لن نزيد الحمل الآن حتى تتحسن جاهزية الاستشفاء.",
  SAFETY_BLOCK: "لن نزيد الحمل بسبب إشارة سلامة. راعِ التنفيذ المريح.",
  MISSING_EFFORT: "نحتاج تقييم الجهد قبل زيادة الحمل.",
  MISSING_REPS: "لا يمكن زيادة الحمل دون تكرارات مسجّلة.",
  MISSING_LOAD: "لا يمكن حساب تقدّم الحمل دون حمل فعلي.",
  INSUFFICIENT_HISTORY: "نبقي الوصفة الحالية حتى تتوفر بيانات كافية.",
  PLATEAU_SUSPECTED: "لا يوجد تقدّم واضح في هذا التمرين. سنراجع لاحقًا دون زيادة حجم تلقائي.",
  BODYWEIGHT_REP_CEILING: "وصلت لسقف تكرارات مناسب. يمكن الانتقال لتنويع أصعب عند الجاهزية.",
  DURATION_RANGE_NOT_MAXED: "سنزيد المدة داخل النطاق المعتمد.",
  DURATION_RANGE_MASTERED:
    "أكملت مدة الهدف بثبات. يمكن زيادة الصعوبة لاحقًا إن كان التمرين يدعم ذلك.",
  EQUIPMENT_INCREMENT_LIMITED: "الزيادة المتاحة كبيرة جدًا، لذلك نبقي الحمل الحالي.",
  COACH_OVERRIDE: "نعتمد وصف المدرب الحالي دون تعديل تلقائي.",
  RECONDITIONING_HOLD: "مرحلة إعادة تهيئة — لا نعيد أعلى حمل سابق تلقائيًا.",
  DELOAD_HOLD: "التقدّم متوقف أثناء فترة التخفيف.",
  PARTIAL_SESSION: "الحصة غير مكتملة، لذلك لن نزيد الحمل.",
  ONE_WEAK_SET: "مجموعة أخيرة أضعف لا تكفي وحدها لخفض الحمل.",
  SINGLE_SESSION_VARIANCE: "جلسة أضعف مرة واحدة لا تعني تراجعًا.",
  REPEATED_DECLINE: "تكرار انخفاض الأداء يستدعي مراجعة الاستشفاء لا زيادة الحجم.",
  TECHNIQUE_DEGRADED: "لن نزيد الحمل بينما جودة التنفيذ منخفضة.",
  KEEP_CURRENT_SAFE_PRESCRIPTION: "نبقي الوصفة الآمنة الحالية.",
  ENGINE_ERROR: "تعذّر حساب التقدّم. نُبقي الوصفة الحالية.",
  MANUAL_HIGH_LOAD_REJECTED: "الحمل الأعلى الذي اخترته لم يناسب النطاق، لذلك لن نعتمده كأساس.",
};

export function explainProgression(code: ProgressionReasonCode) {
  return PROGRESSION_EXPLANATIONS_AR[code] ?? "سنحافظ على الوصفة الحالية بناءً على أدائك.";
}
