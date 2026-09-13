/**
 * Canonical Locked Product Master — Phase 9 final reconciliation.
 *
 * Authority: Locked Product Master (TRAINING_PROGRAM_TEMPLATES) provided by product owner.
 * Historical label "36/36" is a numbering defect: 06 was split into 06A + 06B → 37 physical entries.
 *
 * Do NOT collapse to 33. Do NOT invent Glute HOME / GF Intermediate / Fat Loss Intermediate HOME.
 */

export type CanonicalTemplateStatus = "PILOT_ALREADY_IMPORTED" | "REMAINING";

export type CanonicalTemplateRow = {
  /** Historical locked-list index label (01–36 with 06A/06B). */
  historical_index: string;
  template_key: string;
  goal: string;
  level: "BEGINNER" | "INTERMEDIATE";
  environment: "GYM" | "HOME";
  days: 3 | 4 | 5;
  status: CanonicalTemplateStatus;
};

export const HISTORICAL_MASTER_LABEL = "36/36" as const;
export const ACTUAL_CANONICAL_ENTRY_COUNT = 37 as const;

export const COUNT_ROOT_CAUSE_AR =
  "التقسيم التاريخي رقم 06 انقسم إلى 06A و06B كقالبين مستقلين، بينما استمرت الترقيم حتى 36 — فالتسمية «36/36» عيب ترقيم وليست عددًا فيزيائيًا.";

/** Product variants that must NOT appear as canonical / in sequence denominators. */
export const NON_EXISTENT_VARIANTS_BY_PRODUCT_POLICY = [
  {
    rejected_key: "GLUTE_FOCUS_FOUNDATION_BEGINNER_HOME_3D",
    classification: "NON_EXISTENT_VARIANT_BY_PRODUCT_POLICY" as const,
    reason_ar: "سياسة المنتج: لا توجد متغيرات Glute HOME.",
  },
  {
    rejected_key: "GLUTE_FOCUS_PROGRESS_INTERMEDIATE_HOME_4D",
    classification: "NON_EXISTENT_VARIANT_BY_PRODUCT_POLICY" as const,
    reason_ar: "سياسة المنتج: لا توجد متغيرات Glute HOME.",
  },
  {
    rejected_key: "GENERAL_FITNESS_PROGRESS_INTERMEDIATE_GYM_4D",
    classification: "NON_EXISTENT_VARIANT_BY_PRODUCT_POLICY" as const,
    reason_ar: "المعتمد للياقة العامة: Foundation فقط — لا Intermediate.",
  },
  {
    rejected_key: "GENERAL_FITNESS_PROGRESS_INTERMEDIATE_HOME_4D",
    classification: "NON_EXISTENT_VARIANT_BY_PRODUCT_POLICY" as const,
    reason_ar: "المعتمد للياقة العامة: Foundation فقط — لا Intermediate.",
  },
  {
    rejected_key: "FAT_LOSS_PROGRESS_INTERMEDIATE_HOME_4D",
    classification: "NON_EXISTENT_VARIANT_BY_PRODUCT_POLICY" as const,
    reason_ar: "ماستر المنتج لا يتضمن Fat Loss Intermediate HOME.",
  },
  {
    rejected_key: "MUSCLE_GAIN_PROGRESS_INTERMEDIATE_GYM_5D",
    classification: "NON_EXISTENT_VARIANT_BY_PRODUCT_POLICY" as const,
    reason_ar: "استُبدل بهوية 06A/06B المنفصلتين — لا مفتاح عام يفقد التمييز.",
  },
  {
    rejected_key: "STRENGTH_PROGRESS_INTERMEDIATE_GYM_5D",
    classification: "NON_EXISTENT_VARIANT_BY_PRODUCT_POLICY" as const,
    reason_ar: "تقدم القوة المعتمد: GYM 4D (Pilot) — ليس 5D.",
  },
] as const;

/**
 * Locked Product Master — exact set. Order follows historical indices 01…36 (06A/06B).
 */
export const CANONICAL_LOCKED_TEMPLATE_MASTER: CanonicalTemplateRow[] = [
  { historical_index: "01", template_key: "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D", goal: "FAT_LOSS", level: "BEGINNER", environment: "GYM", days: 3, status: "PILOT_ALREADY_IMPORTED" },
  { historical_index: "02", template_key: "FAT_LOSS_FOUNDATION_BEGINNER_GYM_4D", goal: "FAT_LOSS", level: "BEGINNER", environment: "GYM", days: 4, status: "REMAINING" },
  { historical_index: "03", template_key: "FAT_LOSS_PROGRESS_INTERMEDIATE_GYM_4D", goal: "FAT_LOSS", level: "INTERMEDIATE", environment: "GYM", days: 4, status: "REMAINING" },
  { historical_index: "04", template_key: "FAT_LOSS_FOUNDATION_BEGINNER_HOME_3D", goal: "FAT_LOSS", level: "BEGINNER", environment: "HOME", days: 3, status: "REMAINING" },
  { historical_index: "05", template_key: "MUSCLE_GAIN_FOUNDATION_BEGINNER_GYM_3D", goal: "MUSCLE_GAIN", level: "BEGINNER", environment: "GYM", days: 3, status: "REMAINING" },
  { historical_index: "06A", template_key: "MUSCLE_GAIN_UPPER_LOWER_INTERMEDIATE_GYM_4D", goal: "MUSCLE_GAIN", level: "INTERMEDIATE", environment: "GYM", days: 4, status: "REMAINING" },
  { historical_index: "06B", template_key: "MUSCLE_GAIN_ADVANCED_SPLIT_INTERMEDIATE_GYM_5D", goal: "MUSCLE_GAIN", level: "INTERMEDIATE", environment: "GYM", days: 5, status: "REMAINING" },
  { historical_index: "07", template_key: "BODY_RECOMPOSITION_FOUNDATION_BEGINNER_GYM_3D", goal: "BODY_RECOMPOSITION", level: "BEGINNER", environment: "GYM", days: 3, status: "REMAINING" },
  { historical_index: "08", template_key: "BODY_RECOMPOSITION_PROGRESS_INTERMEDIATE_GYM_4D", goal: "BODY_RECOMPOSITION", level: "INTERMEDIATE", environment: "GYM", days: 4, status: "REMAINING" },
  { historical_index: "09", template_key: "GENERAL_FITNESS_FOUNDATION_BEGINNER_GYM_3D", goal: "GENERAL_FITNESS", level: "BEGINNER", environment: "GYM", days: 3, status: "REMAINING" },
  { historical_index: "10", template_key: "GENERAL_FITNESS_FOUNDATION_BEGINNER_HOME_3D", goal: "GENERAL_FITNESS", level: "BEGINNER", environment: "HOME", days: 3, status: "REMAINING" },
  { historical_index: "11", template_key: "STRENGTH_FOUNDATION_BEGINNER_GYM_3D", goal: "STRENGTH", level: "BEGINNER", environment: "GYM", days: 3, status: "REMAINING" },
  { historical_index: "12", template_key: "STRENGTH_PROGRESS_INTERMEDIATE_GYM_4D", goal: "STRENGTH", level: "INTERMEDIATE", environment: "GYM", days: 4, status: "PILOT_ALREADY_IMPORTED" },
  { historical_index: "13", template_key: "GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D", goal: "GLUTE_FOCUS", level: "BEGINNER", environment: "GYM", days: 3, status: "REMAINING" },
  { historical_index: "14", template_key: "GLUTE_FOCUS_PROGRESS_INTERMEDIATE_GYM_4D", goal: "GLUTE_FOCUS", level: "INTERMEDIATE", environment: "GYM", days: 4, status: "REMAINING" },
  { historical_index: "15", template_key: "ENDURANCE_FOUNDATION_BEGINNER_GYM_3D", goal: "ENDURANCE", level: "BEGINNER", environment: "GYM", days: 3, status: "REMAINING" },
  { historical_index: "16", template_key: "ENDURANCE_PROGRESS_INTERMEDIATE_GYM_4D", goal: "ENDURANCE", level: "INTERMEDIATE", environment: "GYM", days: 4, status: "REMAINING" },
  { historical_index: "17", template_key: "MOBILITY_FUNCTIONAL_FOUNDATION_BEGINNER_GYM_3D", goal: "MOBILITY_FUNCTIONAL", level: "BEGINNER", environment: "GYM", days: 3, status: "REMAINING" },
  { historical_index: "18", template_key: "MOBILITY_FUNCTIONAL_PROGRESS_INTERMEDIATE_GYM_4D", goal: "MOBILITY_FUNCTIONAL", level: "INTERMEDIATE", environment: "GYM", days: 4, status: "REMAINING" },
  { historical_index: "19", template_key: "HEALTHY_AGING_ACTIVE_LIFE_FOUNDATION_BEGINNER_GYM_3D", goal: "HEALTHY_AGING_ACTIVE_LIFE", level: "BEGINNER", environment: "GYM", days: 3, status: "REMAINING" },
  { historical_index: "20", template_key: "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_GYM_4D", goal: "HEALTHY_AGING_ACTIVE_LIFE", level: "INTERMEDIATE", environment: "GYM", days: 4, status: "REMAINING" },
  { historical_index: "21", template_key: "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_GYM_3D", goal: "ATHLETIC_PERFORMANCE", level: "BEGINNER", environment: "GYM", days: 3, status: "REMAINING" },
  { historical_index: "22", template_key: "ATHLETIC_PERFORMANCE_PROGRESS_INTERMEDIATE_GYM_4D", goal: "ATHLETIC_PERFORMANCE", level: "INTERMEDIATE", environment: "GYM", days: 4, status: "REMAINING" },
  { historical_index: "23", template_key: "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D", goal: "MUSCLE_GAIN", level: "BEGINNER", environment: "HOME", days: 3, status: "PILOT_ALREADY_IMPORTED" },
  { historical_index: "24", template_key: "MUSCLE_GAIN_PROGRESS_INTERMEDIATE_HOME_4D", goal: "MUSCLE_GAIN", level: "INTERMEDIATE", environment: "HOME", days: 4, status: "REMAINING" },
  { historical_index: "25", template_key: "BODY_RECOMPOSITION_FOUNDATION_BEGINNER_HOME_3D", goal: "BODY_RECOMPOSITION", level: "BEGINNER", environment: "HOME", days: 3, status: "REMAINING" },
  { historical_index: "26", template_key: "BODY_RECOMPOSITION_PROGRESS_INTERMEDIATE_HOME_4D", goal: "BODY_RECOMPOSITION", level: "INTERMEDIATE", environment: "HOME", days: 4, status: "REMAINING" },
  { historical_index: "27", template_key: "STRENGTH_FOUNDATION_BEGINNER_HOME_3D", goal: "STRENGTH", level: "BEGINNER", environment: "HOME", days: 3, status: "REMAINING" },
  { historical_index: "28", template_key: "STRENGTH_PROGRESS_INTERMEDIATE_HOME_4D", goal: "STRENGTH", level: "INTERMEDIATE", environment: "HOME", days: 4, status: "REMAINING" },
  { historical_index: "29", template_key: "ENDURANCE_FOUNDATION_BEGINNER_HOME_3D", goal: "ENDURANCE", level: "BEGINNER", environment: "HOME", days: 3, status: "REMAINING" },
  { historical_index: "30", template_key: "ENDURANCE_PROGRESS_INTERMEDIATE_HOME_4D", goal: "ENDURANCE", level: "INTERMEDIATE", environment: "HOME", days: 4, status: "REMAINING" },
  { historical_index: "31", template_key: "MOBILITY_FUNCTIONAL_FOUNDATION_BEGINNER_HOME_3D", goal: "MOBILITY_FUNCTIONAL", level: "BEGINNER", environment: "HOME", days: 3, status: "REMAINING" },
  { historical_index: "32", template_key: "MOBILITY_FUNCTIONAL_PROGRESS_INTERMEDIATE_HOME_4D", goal: "MOBILITY_FUNCTIONAL", level: "INTERMEDIATE", environment: "HOME", days: 4, status: "REMAINING" },
  { historical_index: "33", template_key: "HEALTHY_AGING_ACTIVE_LIFE_FOUNDATION_BEGINNER_HOME_3D", goal: "HEALTHY_AGING_ACTIVE_LIFE", level: "BEGINNER", environment: "HOME", days: 3, status: "REMAINING" },
  { historical_index: "34", template_key: "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_HOME_4D", goal: "HEALTHY_AGING_ACTIVE_LIFE", level: "INTERMEDIATE", environment: "HOME", days: 4, status: "REMAINING" },
  { historical_index: "35", template_key: "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_HOME_3D", goal: "ATHLETIC_PERFORMANCE", level: "BEGINNER", environment: "HOME", days: 3, status: "PILOT_ALREADY_IMPORTED" },
  { historical_index: "36", template_key: "ATHLETIC_PERFORMANCE_PROGRESS_INTERMEDIATE_HOME_4D", goal: "ATHLETIC_PERFORMANCE", level: "INTERMEDIATE", environment: "HOME", days: 4, status: "REMAINING" },
];

export const CANONICAL_TEMPLATE_COUNT = CANONICAL_LOCKED_TEMPLATE_MASTER.length; // 37
export const PILOT_COUNT = CANONICAL_LOCKED_TEMPLATE_MASTER.filter((r) => r.status === "PILOT_ALREADY_IMPORTED").length; // 4
export const REMAINING_CANONICAL_COUNT = CANONICAL_LOCKED_TEMPLATE_MASTER.filter((r) => r.status === "REMAINING").length; // 33

export const CANONICAL_REMAINING_KEYS = CANONICAL_LOCKED_TEMPLATE_MASTER.filter((r) => r.status === "REMAINING").map(
  (r) => r.template_key,
);

export const CANONICAL_PILOT_KEYS = CANONICAL_LOCKED_TEMPLATE_MASTER.filter(
  (r) => r.status === "PILOT_ALREADY_IMPORTED",
).map((r) => r.template_key);

export const CANONICAL_ALL_KEYS = CANONICAL_LOCKED_TEMPLATE_MASTER.map((r) => r.template_key);

/** Documentation correction metadata — not a product expansion. */
export const MASTER_COUNT_DOCUMENTATION = {
  historical_master_label: HISTORICAL_MASTER_LABEL,
  actual_canonical_entry_count: ACTUAL_CANONICAL_ENTRY_COUNT,
  root_cause_ar: COUNT_ROOT_CAUSE_AR,
  current_33_master_result: "REJECTED" as const,
  documentation_correction_not_product_expansion: true as const,
};

/** @deprecated — previous incorrect reconciliation; kept for report diffs only */
export const REJECTED_33_EXTRA_KEYS = [
  "FAT_LOSS_PROGRESS_INTERMEDIATE_HOME_4D",
  "MUSCLE_GAIN_PROGRESS_INTERMEDIATE_GYM_5D",
] as const;

/** @deprecated — keys missing from the rejected 33 master relative to product */
export const MISSING_FROM_REJECTED_33 = [
  "FAT_LOSS_FOUNDATION_BEGINNER_GYM_4D",
  "MUSCLE_GAIN_UPPER_LOWER_INTERMEDIATE_GYM_4D",
  "MUSCLE_GAIN_ADVANCED_SPLIT_INTERMEDIATE_GYM_5D",
  "ENDURANCE_PROGRESS_INTERMEDIATE_HOME_4D",
  "MOBILITY_FUNCTIONAL_PROGRESS_INTERMEDIATE_GYM_4D",
  "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_GYM_4D",
] as const;
