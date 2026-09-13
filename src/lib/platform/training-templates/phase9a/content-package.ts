/**
 * Phase 9A — Content readiness package (specification only).
 * Does NOT invent exercise sequences or IDs. Does NOT import templates.
 */

import exerciseLibraryV2Json from "../../../../../scripts/exercise-library-v2-metadata.json";
import { CORE_100_EXTERNAL_IDS } from "@/lib/platform/strategy-matrix/config/core-100-external-ids";
import { APPROVED_36_TEMPLATE_REFS } from "../phase8/approved-36-reference";
import { PILOT_4_DEFINITIONS } from "../pilot-4/definitions";

export type ContentStatus =
  | "APPROVED_EXISTING"
  | "APPROVED_ADDITION_SPEC_REQUIRED"
  | "CANDIDATE_FOR_PM_REVIEW"
  | "UNRESOLVED";

export type ImportReadiness =
  | "ALREADY_IMPORTED"
  | "READY_FOR_PHASE9_IMPORT"
  | "READY_FOR_PHASE9_IMPORT_WITH_REVIEW_FLAG"
  | "CONTENT_ADDITION_REQUIRED"
  | "PM_SEQUENCE_APPROVAL_REQUIRED"
  | "BLOCKED_BY_REFERENCE";

export type ReleaseReadiness =
  | "RELEASE_READY"
  | "RELEASE_WITH_KNOWN_MEDIA_GAP"
  | "FEMALE_MEDIA_REQUIRED"
  | "RUNTIME_UI_FIX_REQUIRED"
  | "CONTENT_BLOCKED";

export type AdditionSpec = {
  spec_id: string;
  classification: "EXERCISE_LIBRARY_ADDITION_REQUIRED";
  content_status: "APPROVED_ADDITION_SPEC_REQUIRED";
  display_name_en: string;
  display_name_ar: string;
  display_name_ar_status: "PROPOSED_PENDING_PM" | "APPROVED";
  activity_type: string;
  environment: "GYM" | "HOME" | "BOTH";
  equipment: string[];
  prescription_model: "DURATION";
  expected_template_roles: string[];
  sets_reps: "NOT_REQUIRED";
  external_id: "DO_NOT_INVENT";
  duplicate_check: Array<{
    external_id: string;
    name_en: string;
    match: "NO_MATCH" | "POSSIBLE_DUPLICATE" | "EXISTING_EXERCISE_USABLE";
    why_not_sufficient: string;
  }>;
  shared_by_templates: string[];
  reason: string;
};

type V2Row = {
  external_id: string;
  name_en: string;
  name_ar: string;
  exercise_type: string;
  group: string;
  primary_muscle_canonical?: string;
  primary_movement_role?: string;
  required_equipment?: string[];
  location_compatibility?: string[];
  supports_timed_prescription?: boolean;
  loading_type?: string;
  is_bodyweight?: boolean;
};

const V2 = exerciseLibraryV2Json as V2Row[];
const V2_BY_ID = new Map(V2.map((r) => [r.external_id, r]));
const CORE = new Set(CORE_100_EXTERNAL_IDS);
const PILOT_KEYS = new Set(PILOT_4_DEFINITIONS.map((d) => d.key));

/** Session structure policies stated in Phase 9A Training brief — NOT exercise sequences. */
export const STRUCTURE_POLICY_FROM_PHASE9A_BRIEF = {
  shared_invariants: {
    warmups_per_session: 3,
    main_resistance_per_session: 6,
    smart_auto: ["WEIGHT", "REPS"],
    note: "Exact MAIN_RESISTANCE external_id lists exist ONLY for Pilot 4 in-repo.",
  },
  FAT_LOSS_GYM: {
    general_warm_up: "Treadmill Brisk Walk 10 min",
    targeted_dynamic_warm_ups: 2,
    main_resistance: 6,
    post_workout_cardio: "Treadmill Brisk Walk 15 min",
    do_not_substitute: ["CR-001 Treadmill Run"],
  },
  FAT_LOSS_HOME: {
    cardio: "Approved HOME cardio pool (machine-independent); no treadmill forced",
  },
  MUSCLE_GAIN: {
    post_cardio: "NOT_MANDATORY",
    failure: "NOT_MANDATORY",
  },
  BODY_RECOMPOSITION: {
    warm_up_duration_min: "5-10",
    post_cardio_min: 10,
    weekly_post_3d_min: 30,
    weekly_post_4d_min: 40,
  },
  GENERAL_FITNESS_FOUNDATION: {
    warm_up_duration_min: "5-10",
    post_moderate_cardio_min: 10,
    beginner_hiit: "NOT_MANDATORY",
    gym_modalities: ["treadmill", "bike"],
    home_modalities: ["brisk_walk", "march", "low_impact"],
  },
  STRENGTH: {
    general_warm_ups: 3,
    ramp_up: "same exercise identity when applicable; not working volume; not Smart",
    cardio: "NOT_MANDATORY",
    failure_testing: "NOT_MANDATORY",
  },
  ENDURANCE: {
    roles: ["AEROBIC_ENDURANCE_BLOCK", "CONTROLLED_AEROBIC_INTERVAL_BLOCK"],
    intervals_are_not_hiit: true,
    cardio_progression: "COACH_CONTROLLED",
    home: "no machines required",
  },
  MOBILITY_FUNCTIONAL: {
    definition: "CONTROLLED_USABLE_ROM; ROM_QUALITY > ROM_DEPTH; not exhaustion",
    static_stretch_finisher: "NOT_MANDATORY",
  },
  HEALTHY_AGING_ACTIVE_LIFE: {
    foundation_3d_post_aerobic_min: 10,
    intermediate_post_aerobic_min: 15,
    note: "Phase 9A brief mentions Intermediate 4D post 15; locked provisional key is INTERMEDIATE_HOME_3D — PM must reconcile days.",
  },
  ATHLETIC_PERFORMANCE: {
    power: "readiness dependent",
    not_required_unless_approved: ["jumping", "sprinting", "olympic_lifts", "hiit"],
  },
  GLUTE_FOCUS: {
    locked_existing: [
      "GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D",
      "GLUTE_FOCUS_PROGRESS_INTERMEDIATE_GYM_4D",
    ],
    create_home_variants: false,
  },
} as const;

export const ADDITION_SPECS: AdditionSpec[] = [
  {
    spec_id: "ADD_TREADMILL_BRISK_WALK",
    classification: "EXERCISE_LIBRARY_ADDITION_REQUIRED",
    content_status: "APPROVED_ADDITION_SPEC_REQUIRED",
    display_name_en: "Treadmill Brisk Walk",
    display_name_ar: "مشي سريع على جهاز المشي",
    display_name_ar_status: "PROPOSED_PENDING_PM",
    activity_type: "CARDIO / WALK",
    environment: "GYM",
    equipment: ["TREADMILL"],
    prescription_model: "DURATION",
    expected_template_roles: ["GENERAL_WARM_UP", "POST_WORKOUT_CARDIO"],
    sets_reps: "NOT_REQUIRED",
    external_id: "DO_NOT_INVENT",
    duplicate_check: [
      {
        external_id: "CR-001",
        name_en: "Treadmill Run",
        match: "POSSIBLE_DUPLICATE",
        why_not_sufficient:
          "Run ≠ brisk walk intensity/intent. Fat Loss policy forbids silent substitution.",
      },
      {
        external_id: "CR-015",
        name_en: "Incline Walk",
        match: "POSSIBLE_DUPLICATE",
        why_not_sufficient: "Incline walk is a different stimulus; not approved as brisk-walk identity.",
      },
    ],
    shared_by_templates: [
      "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D",
      "FAT_LOSS_PROGRESS_INTERMEDIATE_GYM_4D",
      // also future GYM templates that adopt brisk-walk start/post per brief
    ],
    reason:
      "Fat Loss GYM requires distinct Treadmill Brisk Walk 10 min start + 15 min post every session.",
  },
  {
    spec_id: "ADD_HOME_BRISK_WALK",
    classification: "EXERCISE_LIBRARY_ADDITION_REQUIRED",
    content_status: "APPROVED_ADDITION_SPEC_REQUIRED",
    display_name_en: "Brisk Walk (Outdoor / Neighborhood / Indoor Fallback)",
    display_name_ar: "مشي سريع (خارجي / حي / بديل داخلي آمن)",
    display_name_ar_status: "PROPOSED_PENDING_PM",
    activity_type: "CARDIO / WALK",
    environment: "HOME",
    equipment: ["NO_EQUIPMENT"],
    prescription_model: "DURATION",
    expected_template_roles: [
      "GENERAL_WARM_UP",
      "POST_WORKOUT_CARDIO",
      "AEROBIC_ENDURANCE_BLOCK",
    ],
    sets_reps: "NOT_REQUIRED",
    external_id: "DO_NOT_INVENT",
    duplicate_check: [
      {
        external_id: "WU-023",
        name_en: "March in Place",
        match: "POSSIBLE_DUPLICATE",
        why_not_sufficient:
          "March in Place is a warm-up drill / in-place pattern — not a neighborhood brisk walk modality.",
      },
      {
        external_id: "CR-016",
        name_en: "Outdoor Run",
        match: "POSSIBLE_DUPLICATE",
        why_not_sufficient: "Run ≠ walk; GYM-tagged in V2; unsuitable as default HOME brisk walk.",
      },
      {
        external_id: "WU-015",
        name_en: "Light Jog",
        match: "POSSIBLE_DUPLICATE",
        why_not_sufficient: "Jog is higher impact than brisk walk for Fat Loss / Healthy Aging defaults.",
      },
    ],
    shared_by_templates: [
      "FAT_LOSS_FOUNDATION_BEGINNER_HOME_3D",
      "FAT_LOSS_PROGRESS_INTERMEDIATE_HOME_4D",
      "ENDURANCE_FOUNDATION_BEGINNER_HOME_3D",
      "GENERAL_FITNESS_FOUNDATION_BEGINNER_HOME_3D",
      "GENERAL_FITNESS_PROGRESS_INTERMEDIATE_HOME_4D",
      "BODY_RECOMPOSITION_FOUNDATION_BEGINNER_HOME_3D",
      "BODY_RECOMPOSITION_PROGRESS_INTERMEDIATE_HOME_4D",
      "HEALTHY_AGING_ACTIVE_LIFE_FOUNDATION_BEGINNER_HOME_3D",
      "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_HOME_3D",
    ],
    reason:
      "HOME programs needing machine-independent low-impact aerobic work require a canonical brisk-walk activity.",
  },
];

export const HOME_CARDIO_POOL = [
  {
    name: "Brisk Walk (Outdoor / Neighborhood / Indoor Fallback)",
    status: "ADDITION_REQUIRED" as const,
    spec_id: "ADD_HOME_BRISK_WALK",
    note: "Genuinely required for approved HOME Fat Loss / Endurance / Fitness / Recomp / Healthy Aging cardio policies.",
  },
  {
    name: "March in Place",
    status: "EXISTING_LIBRARY_RECORD" as const,
    external_id: "WU-023",
    name_en: "March in Place",
    name_ar: "مشي في المكان",
    exercise_type: "warmup",
    note: "Valid low-impact option; not a full substitute for neighborhood brisk walk.",
  },
  {
    name: "Light Jog",
    status: "EXISTING_LIBRARY_RECORD" as const,
    external_id: "WU-015",
    name_en: "Light Jog",
    name_ar: "جري خفيف",
    exercise_type: "warmup",
    note: "Existing; higher impact — not default for Beginner Fat Loss / Healthy Aging.",
  },
  {
    name: "Jump Rope",
    status: "EXISTING_LIBRARY_RECORD" as const,
    external_id: "CR-005",
    note: "HOME+GYM; equipment + impact — not Beginner mandatory HIIT/low-impact default.",
  },
  {
    name: "Burpees",
    status: "EXISTING_LIBRARY_RECORD" as const,
    external_id: "CR-006",
    note: "High impact — NOT_REQUIRED as default HOME cardio for Foundation.",
  },
  {
    name: "Mountain Climbers",
    status: "EXISTING_LIBRARY_RECORD" as const,
    external_id: "CR-007",
    note: "High impact — NOT_REQUIRED as default HOME cardio for Foundation.",
  },
  {
    name: "Treadmill modalities at HOME",
    status: "NOT_REQUIRED" as const,
    note: "Do not force treadmill for HOME templates.",
  },
];

function libraryRow(externalId: string) {
  const row = V2_BY_ID.get(externalId);
  if (!row) return null;
  return {
    external_id: row.external_id,
    slug: row.name_en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    name_en: row.name_en,
    name_ar: row.name_ar,
    equipment: row.required_equipment ?? [],
    movement_purpose: row.primary_movement_role ?? row.exercise_type,
    environment_compatibility: row.location_compatibility ?? [],
    in_core_100: CORE.has(row.external_id),
    content_status: "APPROVED_EXISTING" as const,
  };
}

export function gluteCandidatePool() {
  const rows = V2.filter(
    (e) => e.group === "Glutes" || e.primary_muscle_canonical === "GLUTES",
  );
  return rows.map((e) => ({
    ...libraryRow(e.external_id)!,
    content_status: "CANDIDATE_FOR_PM_REVIEW" as const,
    in_core_100: CORE.has(e.external_id),
  }));
}

export function femaleMediaManifestForGluteGym() {
  const candidates = gluteCandidatePool().filter((c) =>
    (c.environment_compatibility as string[]).includes("GYM"),
  );
  // Prefer Core 100 glutes + common accessories as media production priority set (candidates, not approved sequence)
  const coreFirst = [
    ...candidates.filter((c) => c.in_core_100),
    ...candidates.filter((c) => !c.in_core_100),
  ];
  const unique = coreFirst.slice(0, 24);
  return {
    templates: [
      "GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D",
      "GLUTE_FOCUS_PROGRESS_INTERMEDIATE_GYM_4D",
    ],
    preferred_demonstrator: "FEMALE",
    preferred_media_variant: "FEMALE",
    fallback_order: ["FEMALE", "STANDARD", "MEDIA_MISSING"],
    note: "Canonical exercise identity remains single — media variants only. Set is CANDIDATE until PM approves exact Glute sequences.",
    REQUIRED_EXERCISE_SET_FOR_FEMALE_MEDIA: unique.map((u) => ({
      external_id: u.external_id,
      name_en: u.name_en,
      content_status: "CANDIDATE_FOR_PM_REVIEW" as const,
      FEMALE_MEDIA_AVAILABLE: false,
      STANDARD_MEDIA_ASSUMED: "PLACEHOLDER_OR_STANDARD_ONLY",
    })),
    TOTAL_UNIQUE_EXERCISES: unique.length,
    FEMALE_MEDIA_AVAILABLE: 0,
    STANDARD_ONLY: unique.length,
    MEDIA_MISSING: 0,
    FEMALE_MEDIA_COVERAGE_PERCENT: 0,
  };
}

function homeCapabilityFlags(environment: string) {
  if (environment !== "HOME") {
    return {
      CLIENT_COMPATIBILITY_REVIEW_REQUIRED: false,
      dependencies: [] as string[],
    };
  }
  return {
    CLIENT_COMPATIBILITY_REVIEW_REQUIRED: true,
    dependencies: [
      "TRAINING_SPACE",
      "AVAILABLE_LOAD",
      "LOAD_INCREMENT_GRANULARITY",
      "SAFE_BAND_ANCHOR",
      "STABLE_BENCH_OR_CHAIR",
      "STABLE_ELEVATED_SURFACE",
    ],
    note: "Global metadata thinness does not alone block content; client assignment still REVIEW_REQUIRED when capability unknown.",
  };
}

function runtimeRoleFlags(primary: string) {
  const rolesUsed: string[] = ["GENERAL_WARM_UP", "TARGETED_DYNAMIC_WARM_UP", "MAIN_RESISTANCE"];
  if (primary === "FAT_LOSS" || primary === "BODY_RECOMPOSITION" || primary === "GENERAL_FITNESS" || primary === "HEALTHY_AGING_ACTIVE_LIFE") {
    rolesUsed.push("POST_WORKOUT_CARDIO");
  }
  if (primary === "ENDURANCE") {
    rolesUsed.push("AEROBIC_ENDURANCE_BLOCK", "CONTROLLED_AEROBIC_INTERVAL_BLOCK");
  }
  if (primary === "STRENGTH") rolesUsed.push("EXERCISE_SPECIFIC_RAMP_UP");
  if (primary === "ATHLETIC_PERFORMANCE") rolesUsed.push("POWER_SKILL_BLOCK");
  if (primary === "MOBILITY_FUNCTIONAL") rolesUsed.push("MOBILITY_ACTIVITY");

  const importBlocker = rolesUsed.includes("CONTROLLED_AEROBIC_INTERVAL_BLOCK")
    ? "CONTROLLED_AEROBIC_INTERVAL_BLOCK is NOT_SUPPORTED in client UI — does not block DB import if PM accepts generic display, but flags RELEASE."
    : null;
  const releaseBlockers = [
    ...rolesUsed
      .filter((r) => r !== "MAIN_RESISTANCE")
      .map((r) => `${r}:GENERIC_RENDERING`),
    ...(rolesUsed.includes("CONTROLLED_AEROBIC_INTERVAL_BLOCK")
      ? ["CONTROLLED_AEROBIC_INTERVAL_BLOCK:NOT_SUPPORTED"]
      : []),
    ...(rolesUsed.includes("DAILY_ACTIVITY") ? ["DAILY_ACTIVITY:NOT_SUPPORTED"] : []),
  ];

  return {
    roles_expected_by_structure_policy: rolesUsed,
    IMPORT_IMPACT: importBlocker ? "REVIEW_FLAG" : "NONE",
    CLIENT_DISPLAY_IMPACT: "GENERIC_OR_UNSUPPORTED_FOR_NON_MAIN_ROLES",
    RELEASE_IMPACT: "RUNTIME_UI_FIX_REQUIRED",
    import_blocker_detail: importBlocker,
    release_blockers: releaseBlockers,
  };
}

function classifyRemainingTemplate(ref: (typeof APPROVED_36_TEMPLATE_REFS)[number]) {
  const review_reasons: string[] = [];
  const content_blockers: Array<{
    session: string;
    activity: string;
    missing_library_item: string;
    why_existing_cannot_satisfy: string;
    addition_spec_id: string | null;
    shared: boolean;
  }> = [];

  let import_readiness: ImportReadiness = "PM_SEQUENCE_APPROVAL_REQUIRED";
  let release_readiness: ReleaseReadiness = "CONTENT_BLOCKED";
  let sequence_status:
    | "APPROVED_EXISTING_SEQUENCE"
    | "NO_APPROVED_SEQUENCE_IN_REPO"
    | "INTENTIONAL_HOME_VARIANT_NOT_TO_CREATE"
    | "GLUTE_SEQUENCE_REVIEW_REQUIRED" = "NO_APPROVED_SEQUENCE_IN_REPO";

  // Glute HOME — Phase 9A: do not create; Phase 8 blocked these
  if (ref.family === "GLUTE_FOCUS" && ref.environment === "HOME") {
    import_readiness = "BLOCKED_BY_REFERENCE";
    sequence_status = "INTENTIONAL_HOME_VARIANT_NOT_TO_CREATE";
    release_readiness = "CONTENT_BLOCKED";
    review_reasons.push(
      "Phase 9A forbids creating Glute HOME templates. Locked existing Glute set is GYM-only. Coverage gap ≠ content to invent.",
    );
  } else if (ref.family === "GLUTE_FOCUS" && ref.environment === "GYM") {
    import_readiness = "PM_SEQUENCE_APPROVAL_REQUIRED";
    sequence_status = "GLUTE_SEQUENCE_REVIEW_REQUIRED";
    release_readiness = "FEMALE_MEDIA_REQUIRED";
    review_reasons.push(
      "No approved exact Glute GYM exercise sequence in-repo. Do not invent. Female media completeness required before release.",
    );
  } else if (
    ref.primary_strategy === "FAT_LOSS" &&
    ref.environment === "GYM"
  ) {
    import_readiness = "CONTENT_ADDITION_REQUIRED";
    review_reasons.push("Requires Treadmill Brisk Walk library addition before import approval.");
    review_reasons.push("Exact MAIN_RESISTANCE sequence not approved in-repo (PM_SEQUENCE still required after addition).");
    content_blockers.push({
      session: "EVERY_WORKOUT",
      activity: "GENERAL_WARM_UP (10 min) + POST_WORKOUT_CARDIO (15 min)",
      missing_library_item: "Treadmill Brisk Walk",
      why_existing_cannot_satisfy: "CR-001 is Treadmill Run; CR-015 is Incline Walk — policy forbids substitution.",
      addition_spec_id: "ADD_TREADMILL_BRISK_WALK",
      shared: true,
    });
    release_readiness = "CONTENT_BLOCKED";
  } else if (ref.primary_strategy === "FAT_LOSS" && ref.environment === "HOME") {
    import_readiness = "CONTENT_ADDITION_REQUIRED";
    review_reasons.push("Requires HOME Brisk Walk addition for approved HOME cardio logic.");
    review_reasons.push("Exact exercise sequence not approved in-repo.");
    content_blockers.push({
      session: "EVERY_WORKOUT_CARDIO_SLOT",
      activity: "POST_WORKOUT_CARDIO / GENERAL_WARM_UP cardio as applicable",
      missing_library_item: "Brisk Walk (Outdoor / Neighborhood / Indoor Fallback)",
      why_existing_cannot_satisfy:
        "WU-023 March in Place is warm-up in-place; Jump Rope/Burpees/Mountain Climbers are high-impact and not default Foundation cardio.",
      addition_spec_id: "ADD_HOME_BRISK_WALK",
      shared: true,
    });
    release_readiness = "CONTENT_BLOCKED";
  } else if (ref.template_key === "ENDURANCE_FOUNDATION_BEGINNER_HOME_3D") {
    import_readiness = "CONTENT_ADDITION_REQUIRED";
    review_reasons.push("HOME Endurance needs machine-free aerobic modality; brisk walk addition required.");
    review_reasons.push("Exact AEROBIC_ENDURANCE / interval sequence not approved in-repo.");
    content_blockers.push({
      session: "AEROBIC_SESSIONS",
      activity: "AEROBIC_ENDURANCE_BLOCK",
      missing_library_item: "Brisk Walk (Outdoor / Neighborhood / Indoor Fallback)",
      why_existing_cannot_satisfy: "No approved machine-free brisk-walk cardio record; high-impact CR-* not suitable as sole Foundation modality.",
      addition_spec_id: "ADD_HOME_BRISK_WALK",
      shared: true,
    });
    release_readiness = "CONTENT_BLOCKED";
  } else {
    import_readiness = "PM_SEQUENCE_APPROVAL_REQUIRED";
    review_reasons.push("No approved exact exercise sequence in repository (official content pack absent).");
    review_reasons.push("Phase 9A forbids improvising MAIN_RESISTANCE lists from plausible library rows.");
    if (ref.environment === "HOME") {
      review_reasons.push("HOME capability client review will apply at assignment (not a substitute for sequence approval).");
    }
    if (
      ref.environment === "HOME" &&
      ["GENERAL_FITNESS", "BODY_RECOMPOSITION", "HEALTHY_AGING_ACTIVE_LIFE"].includes(ref.primary_strategy)
    ) {
      review_reasons.push(
        "Structure policy expects HOME cardio from pool; ADD_HOME_BRISK_WALK likely needed once sequence is approved.",
      );
    }
    release_readiness = "CONTENT_BLOCKED";
  }

  // Media / runtime release layering (does not unlock import without sequence)
  if (ref.female_media_policy === "FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE") {
    if (release_readiness !== "CONTENT_BLOCKED" || sequence_status === "GLUTE_SEQUENCE_REVIEW_REQUIRED") {
      release_readiness = "FEMALE_MEDIA_REQUIRED";
    }
  }

  const weekly_split =
    ref.days_per_week === 3
      ? "SESSION_A / SESSION_B / SESSION_C (+ rest)"
      : ref.days_per_week === 4
        ? "SESSION_A / SESSION_B / SESSION_C / SESSION_D (+ rest)"
        : "SESSION_A … SESSION_E (+ rest)";

  return {
    TEMPLATE_KEY: ref.template_key,
    PRIMARY_STRATEGY: ref.primary_strategy,
    LEVEL: ref.level,
    ENVIRONMENT: ref.environment,
    DAYS: ref.days_per_week,
    WEEKLY_SPLIT: weekly_split,
    PILOT_STATUS: PILOT_KEYS.has(ref.template_key) ? "ALREADY_IMPORTED" : "NOT_IMPORTED",
    EXACT_APPROVED_EXERCISE_SEQUENCE_EXISTS: false,
    SEQUENCE_STATUS: sequence_status,
    STRUCTURE_POLICY_AVAILABLE: true,
    STRUCTURE_POLICY_SOURCE: "PHASE_9A_BRIEF + Pilot invariants where applicable",
    SESSION_EXERCISE_MAP: {
      status: "NOT_EMITTED",
      reason:
        "Emitting named MAIN_RESISTANCE sequences would invent unapproved programming. Await PM sequence approval.",
      roles_required_by_structure:
        STRUCTURE_POLICY_FROM_PHASE9A_BRIEF.shared_invariants,
    },
    LIBRARY_MAPPING_STATUS: sequence_status === "INTENTIONAL_HOME_VARIANT_NOT_TO_CREATE"
      ? "N_A_DO_NOT_CREATE"
      : "AWAITING_APPROVED_SEQUENCE",
    IMPORT_READINESS: import_readiness,
    RELEASE_READINESS: release_readiness,
    TEMPLATE_CONTENT_READY: false,
    CLIENT_COMPATIBILITY_REVIEW_REQUIRED: homeCapabilityFlags(ref.environment).CLIENT_COMPATIBILITY_REVIEW_REQUIRED,
    HOME_CAPABILITY: homeCapabilityFlags(ref.environment),
    RUNTIME_ROLES: runtimeRoleFlags(ref.primary_strategy),
    REVIEW_REASONS: review_reasons,
    CONTENT_BLOCKERS: content_blockers,
    MEDIA_STATUS: "MEDIA_PARTIAL_LIBRARY_WIDE",
    FEMALE_MEDIA_STATUS:
      ref.female_media_policy === "FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE"
        ? "FEMALE_MEDIA_REQUIRED_0_PERCENT"
        : "STANDARD_OK_POLICY",
  };
}

export function runPhase9aContentPackage() {
  const remaining = APPROVED_36_TEMPLATE_REFS.filter((r) => !PILOT_KEYS.has(r.template_key));
  const pilots = APPROVED_36_TEMPLATE_REFS.filter((r) => PILOT_KEYS.has(r.template_key)).map((r) => ({
    TEMPLATE_KEY: r.template_key,
    IMPORT_READINESS: "ALREADY_IMPORTED" as const,
    RELEASE_READINESS:
      r.template_key === "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D"
        ? ("RELEASE_WITH_KNOWN_MEDIA_GAP" as const)
        : ("RELEASE_WITH_KNOWN_MEDIA_GAP" as const),
    NOTE:
      r.template_key === "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D"
        ? "Already imported using CR-001; ADD_TREADMILL_BRISK_WALK still required for policy-correct cardio identity. Do not re-import. Do not change approved program policy in this phase."
        : "Already imported and validated. Reference-only for format/quality. Do not re-import.",
    FAT_LOSS_CARDIO_IDENTITY_GAP: r.template_key === "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D",
  }));

  const templates = remaining.map(classifyRemainingTemplate);

  const counts = {
    READY_FOR_PHASE9_IMPORT: templates.filter((t) => t.IMPORT_READINESS === "READY_FOR_PHASE9_IMPORT").length,
    READY_FOR_PHASE9_IMPORT_WITH_REVIEW_FLAG: templates.filter(
      (t) => t.IMPORT_READINESS === "READY_FOR_PHASE9_IMPORT_WITH_REVIEW_FLAG",
    ).length,
    CONTENT_ADDITION_REQUIRED: templates.filter((t) => t.IMPORT_READINESS === "CONTENT_ADDITION_REQUIRED").length,
    PM_SEQUENCE_APPROVAL_REQUIRED: templates.filter(
      (t) => t.IMPORT_READINESS === "PM_SEQUENCE_APPROVAL_REQUIRED",
    ).length,
    BLOCKED_BY_REFERENCE: templates.filter((t) => t.IMPORT_READINESS === "BLOCKED_BY_REFERENCE").length,
  };

  const female = femaleMediaManifestForGluteGym();

  const contentAdditionDetail = templates
    .filter((t) => t.IMPORT_READINESS === "CONTENT_ADDITION_REQUIRED")
    .map((t) => ({
      template: t.TEMPLATE_KEY,
      blockers: t.CONTENT_BLOCKERS,
      also_needs_pm_sequence: true,
    }));

  const blockedDetail = templates
    .filter((t) => t.IMPORT_READINESS === "BLOCKED_BY_REFERENCE")
    .map((t) => ({
      template: t.TEMPLATE_KEY,
      unresolved_references: [
        {
          type: "TEMPLATE_VARIANT_NOT_TO_CREATE",
          detail:
            "Glute HOME is an intentional coverage gap. Phase 9A forbids silently creating HOME Glute sequences/templates.",
        },
      ],
      pm_decision_request:
        "Confirm Glute HOME remains OUT OF locked import set (coverage gap only). Do not authorize content invention. Keep locked master count 36 only if PM redefines which keys compose the 36 — or keep keys as non-importable placeholders.",
    }));

  const gluteGym = templates.filter(
    (t) => t.PRIMARY_STRATEGY === "GLUTE_FOCUS" && t.ENVIRONMENT === "GYM",
  );

  // Cross-template unique sets: only addition specs + unresolved (no invented existing exercise lists)
  const uniqueExistingFromPool = [
    ...HOME_CARDIO_POOL.filter((p) => p.status === "EXISTING_LIBRARY_RECORD" && "external_id" in p).map(
      (p) => (p as { external_id: string }).external_id,
    ),
    "CR-001",
    "CR-002",
    "CR-015",
  ];

  const emptyBatches = {
    note: "Phase 9B batches may only contain templates with approved sequences. None of the remaining 32 qualify yet.",
    RECOMMENDED_BATCH_A: [] as string[],
    RECOMMENDED_BATCH_B: [] as string[],
    RECOMMENDED_BATCH_C: [] as string[],
    RECOMMENDED_BATCH_D: [] as string[],
    RECOMMENDED_BATCH_E: [] as string[],
  };

  const pmDecisions = [
    {
      id: "PM_SEQ_PACK_01",
      title: "Approve exact exercise sequences for remaining non-Pilot templates",
      templates_affected: templates
        .filter((t) => t.IMPORT_READINESS !== "BLOCKED_BY_REFERENCE")
        .map((t) => t.TEMPLATE_KEY),
      why: "Official content pack not in repository. Improvisation forbidden.",
    },
    {
      id: "PM_ADD_AR_01",
      title: "Approve Arabic display names for addition specs",
      items: ["Treadmill Brisk Walk", "HOME Brisk Walk"],
      why: "Arabic names in package are PROPOSED_PENDING_PM.",
    },
    {
      id: "PM_GLUTE_GYM_01",
      title: "Approve Glute Focus GYM Foundation 3D + Progress 4D sequences",
      templates_affected: gluteGym.map((t) => t.TEMPLATE_KEY),
      deliverable: "GLUTE_SEQUENCE_REVIEW_REQUIRED resolution",
      candidates_available: gluteCandidatePool().length,
    },
    {
      id: "PM_GLUTE_HOME_01",
      title: "Confirm Glute HOME remains intentional coverage gap (do not create)",
      templates_affected: blockedDetail.map((b) => b.template),
    },
    {
      id: "PM_HEALTHY_AGING_DAYS_01",
      title: "Reconcile Healthy Aging Intermediate days (brief 4D vs locked key 3D)",
      template: "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_HOME_3D",
    },
    {
      id: "PM_FAT_LOSS_PILOT_CARDIO_01",
      title: "After ADD_TREADMILL_BRISK_WALK exists: migrate Pilot Fat Loss cardio identity CR-001 → new activity (separate change control)",
      template: "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D",
    },
  ];

  return {
    phase: "9A/10",
    phase_name: "CONTENT_READINESS_CLOSURE_BEFORE_BULK_IMPORT",
    generated_at: new Date().toISOString(),
    constraints: {
      templates_imported: 0,
      exercises_created: 0,
      media_created: 0,
      bulk_import_authorized: false,
      no_invented_ids: true,
      no_invented_sequences: true,
    },
    locked_master_count: 36,
    pilot_4: pilots,
    remaining_reviewed: remaining.length,
    structure_policy_from_phase9a_brief: STRUCTURE_POLICY_FROM_PHASE9A_BRIEF,
    addition_specs: ADDITION_SPECS,
    home_cardio_pool: HOME_CARDIO_POOL,
    home_cardio_pool_status: "GAPS",
    treadmill_brisk_walk: "ADDITION_SPEC_CREATED",
    home_brisk_walk: "ADDITION_SPEC_CREATED",
    templates,
    content_addition_required_detail: contentAdditionDetail,
    blocked_by_reference_detail: blockedDetail,
    glute_content_result: {
      gym_templates: gluteGym.map((t) => ({
        key: t.TEMPLATE_KEY,
        status: "GLUTE_SEQUENCE_REVIEW_REQUIRED",
        import_readiness: t.IMPORT_READINESS,
        movement_requirements:
          "Glute-primary resistance emphasis with standard warm-ups; exact lifts TBD by PM. Prefer Core 100 glute + compound accessories from existing library — candidates only.",
        candidate_existing_count: gluteCandidatePool().length,
        unresolved_decisions: [
          "Weekly split emphasis (glute volume distribution)",
          "Accessory selection",
          "Whether cable/smith specialty equipment is assumed available",
        ],
        media_requirement: "FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE",
      })),
      home_templates: blockedDetail,
      do_not_create_home: true,
    },
    female_media_manifest: female,
    home_capability_review_map: templates
      .filter((t) => t.ENVIRONMENT === "HOME")
      .map((t) => ({
        template: t.TEMPLATE_KEY,
        TEMPLATE_CONTENT_READY: t.TEMPLATE_CONTENT_READY,
        CLIENT_COMPATIBILITY_REVIEW_REQUIRED: t.CLIENT_COMPATIBILITY_REVIEW_REQUIRED,
        dependencies: t.HOME_CAPABILITY.dependencies,
      })),
    runtime_role_issues: {
      import_blockers: templates
        .filter((t) => t.RUNTIME_ROLES.IMPORT_IMPACT !== "NONE")
        .map((t) => ({ template: t.TEMPLATE_KEY, detail: t.RUNTIME_ROLES.import_blocker_detail })),
      release_blockers_summary: [
        "Most non-MAIN roles: GENERIC_RENDERING on client",
        "CONTROLLED_AEROBIC_INTERVAL_BLOCK: NOT_SUPPORTED",
        "DAILY_ACTIVITY: NOT_SUPPORTED",
      ],
      developer_followups: [
        "Render activity_role labels for warm-up, ramp-up, cardio, power, mobility",
        "Add support for CONTROLLED_AEROBIC_INTERVAL_BLOCK before Endurance release",
      ],
    },
    import_readiness_counts: counts,
    release_readiness_counts: {
      CONTENT_BLOCKED: templates.filter((t) => t.RELEASE_READINESS === "CONTENT_BLOCKED").length,
      FEMALE_MEDIA_REQUIRED: templates.filter((t) => t.RELEASE_READINESS === "FEMALE_MEDIA_REQUIRED").length,
      RUNTIME_UI_FIX_REQUIRED: templates.filter((t) => t.RELEASE_READINESS === "RUNTIME_UI_FIX_REQUIRED").length,
      RELEASE_WITH_KNOWN_MEDIA_GAP: 0,
      RELEASE_READY: 0,
    },
    cross_template_unique: {
      TOTAL_UNIQUE_EXISTING_EXERCISES: new Set(uniqueExistingFromPool).size,
      TOTAL_UNIQUE_ADDITION_SPECS: ADDITION_SPECS.length,
      TOTAL_UNIQUE_UNRESOLVED: templates.filter(
        (t) =>
          t.SEQUENCE_STATUS === "NO_APPROVED_SEQUENCE_IN_REPO" ||
          t.SEQUENCE_STATUS === "GLUTE_SEQUENCE_REVIEW_REQUIRED",
      ).length,
      note: "Existing exercise count is pool/reference only — not a fabricated 32-template prescription set.",
    },
    batches: emptyBatches,
    pm_decisions_required: pmDecisions,
    phase_9b_ready: "NO" as const,
    why_phase_9b_not_ready:
      "0 remaining templates have approved exact exercise sequences. Safe import set is empty until PM approves content pack + library additions land.",
  };
}

export type Phase9aContentPackage = ReturnType<typeof runPhase9aContentPackage>;
