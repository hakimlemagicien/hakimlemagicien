/**
 * Arabic display labels for template-contract tokens.
 * Engine/contract values stay English; Admin UI never shows raw snake_case.
 */

const TOKEN_LABELS_AR: Record<string, string> = {
  GYM: "صالة",
  HOME: "منزل",
  BEGINNER: "مبتدئ",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدم",
  FAT_LOSS: "خسارة الدهون",
  MUSCLE_GAIN: "بناء العضلات",
  GENERAL_FITNESS: "لياقة عامة",
  ATHLETIC_PERFORMANCE: "أداء رياضي",
  BODY_RECOMPOSITION: "إعادة تركيب الجسم",
  GLUTE_FOCUS: "تركيز الأرداف",
  STRENGTH: "قوة",
  ENDURANCE: "تحمّل",
  MOBILITY_FUNCTIONAL: "حركة ووظيفة",
  HEALTHY_AGING_ACTIVE_LIFE: "شيخوخة نشطة",
  READY: "جاهز",
  MISSING_MEDIA: "وسائط ناقصة",
  MISSING_EXERCISE: "تمارين ناقصة",
  REVIEW_REQUIRED: "يتطلب مراجعة",
  ANY: "أي مُظهر",
  STANDARD: "قياسي",
  FEMALE: "أنثوي",
  MALE: "ذكوري",
  SMART_PROGRESSION_EXERCISE_LOCKED: "تقدّم ذكي مع ثبات التمرين",
  WEIGHT: "الوزن",
  REPS: "التكرارات",
  SETS: "المجموعات",
  REST: "الراحة",
  EXERCISE_IDENTITY: "هوية التمرين",
  EXERCISE_REPLACEMENT: "استبدال التمرين",
  TRAINING_DAYS: "أيام التدريب",
  CARDIO_STRUCTURE: "هيكل الكارديو",
  CARDIO_DURATION: "مدة الكارديو",
  CARDIO_INTENSITY: "شدة الكارديو",
  CARDIO_MODALITY: "نوع الكارديو",
  GYM_ACCESS_REQUIRED: "يتطلب وصولاً للصالة",
  HOME_SPACE_REQUIRED: "يتطلب مساحة منزلية",
  FAT_LOSS_PROGRESS_REVIEW_REQUIRED: "مراجعة تقدّم خسارة الدهون مطلوبة",
  treadmill: "جهاز مشي",
  dumbbells: "دمبل",
  machines: "أجهزة",
  dumbbells_or_machines: "دمبل أو أجهزة",
  barbell: "بار",
  bodyweight: "وزن الجسم",
  bands: "حبال مقاومة",
  SPACE_REQUIRED: "مساحة مطلوبة",
  BODYWEIGHT: "وزن الجسم",
  NO_EQUIPMENT: "بدون معدات",
};

const VARIANT_CODE = /^(BEGINNER|INTERMEDIATE|ADVANCED)_(GYM|HOME)_(\d+)D$/i;

function hasArabic(value: string): boolean {
  return /[\u0600-\u06FF]/.test(value);
}

export function contractTokenLabelAr(token: string | null | undefined): string {
  const raw = String(token ?? "").trim();
  if (!raw) return "—";
  if (hasArabic(raw)) return raw;
  const exact = TOKEN_LABELS_AR[raw] ?? TOKEN_LABELS_AR[raw.toUpperCase()];
  if (exact) return exact;
  const variant = raw.match(VARIANT_CODE);
  if (variant) {
    const level = TOKEN_LABELS_AR[variant[1].toUpperCase()] ?? variant[1];
    const env = TOKEN_LABELS_AR[variant[2].toUpperCase()] ?? variant[2];
    return `${level} ${env} ${variant[3]} أيام`;
  }
  return TOKEN_LABELS_AR[raw.toLowerCase()] ?? raw.replaceAll("_", " ");
}

export function contractTokenListAr(tokens: readonly string[] | null | undefined): string {
  if (!tokens?.length) return "—";
  return tokens.map((token) => contractTokenLabelAr(token)).join(" · ");
}

export function contractNoteLabelAr(note: string | null | undefined): string {
  const raw = String(note ?? "").trim();
  if (!raw) return "";
  if (hasArabic(raw)) return raw;
  return raw
    .replaceAll("Coach decides when to advance days/level — no silent day change.", "المدرب يقرر الترقية — بدون تغيير صامت للأيام.")
    .replaceAll("Poor fat-loss progress →", "ضعف تقدّم خسارة الدهون ←")
    .replaceAll("FAT_LOSS_PROGRESS_REVIEW_REQUIRED", contractTokenLabelAr("FAT_LOSS_PROGRESS_REVIEW_REQUIRED"))
    .replaceAll("BEGINNER_GYM_3D", contractTokenLabelAr("BEGINNER_GYM_3D"))
    .replaceAll("INTERMEDIATE_GYM_4D", contractTokenLabelAr("INTERMEDIATE_GYM_4D"))
    .replace(/[A-Z][A-Z0-9_]+/g, (token) => contractTokenLabelAr(token));
}

export function preferArabicCopy(value: string | null | undefined, fallbackAr: string): string {
  const raw = String(value ?? "").trim();
  if (!raw) return fallbackAr;
  if (hasArabic(raw)) return raw;
  return fallbackAr;
}

export function buildAdminSummaryAr(input: {
  strategyLabel: string;
  levelLabel: string;
  environmentLabel: string;
  daysLabel: string;
}): string {
  return `${input.strategyLabel} / ${input.levelLabel} / ${input.environmentLabel} / ${input.daysLabel}`;
}

export function synthesizeAudienceAr(input: {
  strategyLabel: string;
  levelLabel: string;
  environmentLabel: string;
}): string {
  return `عميل ${input.levelLabel} يتدرّب في ${input.environmentLabel} بهدف ${input.strategyLabel}.`;
}

export function synthesizePurposeAr(input: {
  strategyLabel: string;
  levelLabel: string;
  environmentLabel: string;
  daysLabel: string;
}): string {
  return `قالب ${input.strategyLabel} بمستوى ${input.levelLabel} — ${input.daysLabel} في ${input.environmentLabel}.`;
}
