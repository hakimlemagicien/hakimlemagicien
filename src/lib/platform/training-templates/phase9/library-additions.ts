/**
 * Phase 9 library additions — resolved catalog identities (PREFIX-NNN pattern).
 * CR-026 / CR-027 follow Cardio sequence after CR-025. Distinct from CR-001 Run.
 */

export const PHASE9_LIBRARY_ADDITION_RESOLUTIONS = {
  ADD_TREADMILL_BRISK_WALK: "CR-026",
  ADD_HOME_BRISK_WALK: "CR-027",
} as const;

export type Phase9AdditionSpecId = keyof typeof PHASE9_LIBRARY_ADDITION_RESOLUTIONS;

export const TREADMILL_BRISK_WALK_EXTERNAL_ID = PHASE9_LIBRARY_ADDITION_RESOLUTIONS.ADD_TREADMILL_BRISK_WALK;
export const HOME_BRISK_WALK_EXTERNAL_ID = PHASE9_LIBRARY_ADDITION_RESOLUTIONS.ADD_HOME_BRISK_WALK;

export const PHASE9_LIBRARY_ADDITION_SPECS = [
  {
    spec_id: "ADD_TREADMILL_BRISK_WALK" as const,
    external_id: TREADMILL_BRISK_WALK_EXTERNAL_ID,
    name_en: "Treadmill Brisk Walk",
    name_ar: "مشي سريع على جهاز المشي",
    equipment: "TREADMILL",
    environment: "GYM" as const,
    must_differ_from: ["CR-001"],
  },
  {
    spec_id: "ADD_HOME_BRISK_WALK" as const,
    external_id: HOME_BRISK_WALK_EXTERNAL_ID,
    name_en: "Brisk Walk (Outdoor / Neighborhood / Indoor Fallback)",
    name_ar: "مشي سريع (خارجي / حي / بديل داخلي آمن)",
    equipment: "NO_EQUIPMENT",
    environment: "HOME" as const,
    must_differ_from: ["CR-001", "CR-016"],
  },
];
