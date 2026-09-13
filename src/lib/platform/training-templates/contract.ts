/**
 * Unified Program Template Contract V1 — stored in program_templates.metadata.template_contract
 * Additive metadata; no second master table; no Training V2 renames.
 */

import {
  DEFAULT_PRESCRIPTION_MODEL_FOR_ROLE,
  isPrescriptionModel,
  isTemplateActivityRole,
  type PrescriptionModel,
  type TemplateActivityRole,
} from "./activity-roles";
import {
  isLegacyProgramGoal,
  legacyProgramGoalFromPrimaryStrategy,
  type LegacyProgramGoal,
} from "./legacy-program-goal";
import {
  isPrimaryTrainingStrategy,
  primaryStrategyToTemplateFamily,
  type PrimaryTrainingStrategy,
  type TemplateFamily,
} from "./primary-strategy";

export const TEMPLATE_CONTRACT_VERSION = 1 as const;

export const TEMPLATE_ENVIRONMENTS = ["GYM", "HOME"] as const;
export type TemplateEnvironment = (typeof TEMPLATE_ENVIRONMENTS)[number];

export const TEMPLATE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export type TemplateLevel = (typeof TEMPLATE_LEVELS)[number];

export const TEMPLATE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];

export const SMART_AUTO_VARIABLES = ["WEIGHT", "REPS"] as const;
export type SmartAutoVariable = (typeof SMART_AUTO_VARIABLES)[number];

export const COACH_CONTROL_VARIABLES = [
  "SETS",
  "REST",
  "EXERCISE_IDENTITY",
  "EXERCISE_REPLACEMENT",
  "TRAINING_DAYS",
  "CARDIO_STRUCTURE",
  "POWER_PROGRESSION",
  "MOBILITY_PROGRESSION",
  "SUPPORT_LEVEL",
  "CARRY_DISTANCE",
  "BAND_RESISTANCE",
  "ROM",
  "MOVEMENT_COMPLEXITY",
  "CARDIO_DURATION",
  "CARDIO_INTENSITY",
  "CARDIO_MODALITY",
  "INTERVAL_STRUCTURE",
] as const;
export type CoachControlVariable = (typeof COACH_CONTROL_VARIABLES)[number];

export const TEMPLATE_REVIEW_SIGNALS = [
  "COACH_REVIEW_REQUIRED",
  "EXERCISE_REVIEW_RECOMMENDED",
  "TRAINING_FREQUENCY_REVIEW_RECOMMENDED",
  "HOME_LOAD_LIMIT_REVIEW_REQUIRED",
  "EQUIPMENT_LIMIT_REVIEW_REQUIRED",
  "MOVEMENT_QUALITY_REVIEW_RECOMMENDED",
  "CARDIO_STRUCTURE_REVIEW_RECOMMENDED",
  "PROGRAM_LEVEL_REVIEW_RECOMMENDED",
  "TRAINING_ENVIRONMENT_REVIEW_RECOMMENDED",
  "EXERCISE_LIBRARY_ADDITION_REQUIRED",
] as const;
export type TemplateReviewSignal = (typeof TEMPLATE_REVIEW_SIGNALS)[number];

export const LIBRARY_READINESS_STATES = [
  "READY",
  "MISSING_MEDIA",
  "MISSING_EXERCISE",
  "REVIEW_REQUIRED",
] as const;
export type LibraryReadinessState = (typeof LIBRARY_READINESS_STATES)[number];

export const PREFERRED_DEMONSTRATORS = ["FEMALE", "STANDARD", "ANY"] as const;
export type PreferredDemonstrator = (typeof PREFERRED_DEMONSTRATORS)[number];

export const PREFERRED_MEDIA_VARIANTS = ["FEMALE", "STANDARD"] as const;
export type PreferredMediaVariant = (typeof PREFERRED_MEDIA_VARIANTS)[number];

export const HOME_REQUIREMENT_KEYS = [
  "equipment",
  "training_space",
  "available_load",
  "load_increment_granularity",
  "safe_band_anchor",
  "stable_bench_or_chair",
  "stable_elevated_surface",
] as const;
export type HomeRequirementKey = (typeof HOME_REQUIREMENT_KEYS)[number];

export type HomeRequirementDeclaration = {
  key: HomeRequirementKey;
  required: boolean;
  notes?: string;
};

export type ActivityRoleDeclaration = {
  role: TemplateActivityRole;
  prescription_model: PrescriptionModel;
  required: boolean;
  notes?: string;
};

export type ProgressionDeclaration = {
  compatible_strategies: Array<
    "SMART_PROGRESSION_EXERCISE_LOCKED" | "MATRIX_MANAGED_PROGRESSION" | "COACH_MANAGED"
  >;
  /** Only WEIGHT + REPS may be AUTO for SMART_PROGRESSION_EXERCISE_LOCKED. */
  smart_auto_variables: SmartAutoVariable[];
  coach_controlled_variables: CoachControlVariable[];
};

export type TransitionPolicy = {
  from_label?: string;
  to_label?: string;
  advisory: boolean;
  notes?: string;
};

export type MediaPreferenceDeclaration = {
  preferred_demonstrator: PreferredDemonstrator;
  preferred_media_variant: PreferredMediaVariant;
  /** Policy: never forks exercise identity / external_id. */
  duplicates_exercise_identity: false;
};

export type EligibilityDeclaration = {
  rules: string[];
  review_conditions: string[];
  equipment_requirements: string[];
  environment_requirements: TemplateEnvironment[];
  capability_requirements: HomeRequirementDeclaration[];
  /**
   * When a required HOME capability is unknown at resolve time → REVIEW_REQUIRED (not SAFE).
   */
  unknown_required_capability_policy: "REVIEW_REQUIRED";
};

export type LibraryReadinessDeclaration = {
  state: LibraryReadinessState;
  missing_exercise_count: number;
  missing_media_count: number;
  notes?: string;
};

/**
 * Machine-readable variant dimensions — never encoded only in the display name.
 * Level and days are independent (BEGINNER ≠ 3D).
 */
export type TemplateVariantDimensions = {
  level: TemplateLevel;
  environment: TemplateEnvironment;
  days_per_week: number;
};

export type ProgramTemplateContractV1 = {
  contract_version: typeof TEMPLATE_CONTRACT_VERSION;
  primary_strategy: PrimaryTrainingStrategy;
  template_family: TemplateFamily;
  /** Legacy DB column compatibility hint (cut|bulk|fitness|recomp). */
  legacy_program_goal: LegacyProgramGoal;
  variant: TemplateVariantDimensions;
  duration_weeks: number | null;
  target_gender: "male" | "female" | "all";
  target_audience: string;
  template_purpose: string;
  admin_summary: string;
  eligibility: EligibilityDeclaration;
  activity_roles: ActivityRoleDeclaration[];
  progression: ProgressionDeclaration;
  media_preference: MediaPreferenceDeclaration;
  review_signals: TemplateReviewSignal[];
  transition_policies: TransitionPolicy[];
  library_readiness: LibraryReadinessDeclaration;
  provenance?: {
    created_from?: string;
    reference_version?: string;
  };
};

export type TemplateContractValidationIssue = {
  code: string;
  message: string;
};

export type TemplateContractValidationResult = {
  ok: boolean;
  issues: TemplateContractValidationIssue[];
};

export const TEMPLATE_CONTRACT_METADATA_KEY = "template_contract" as const;

export function defaultSmartProgressionDeclaration(): ProgressionDeclaration {
  return {
    compatible_strategies: ["SMART_PROGRESSION_EXERCISE_LOCKED"],
    smart_auto_variables: ["WEIGHT", "REPS"],
    coach_controlled_variables: [
      "SETS",
      "REST",
      "EXERCISE_IDENTITY",
      "EXERCISE_REPLACEMENT",
      "TRAINING_DAYS",
      "CARDIO_STRUCTURE",
    ],
  };
}

export function defaultActivityRolesForResistanceTemplate(): ActivityRoleDeclaration[] {
  return [
    {
      role: "GENERAL_WARM_UP",
      prescription_model: DEFAULT_PRESCRIPTION_MODEL_FOR_ROLE.GENERAL_WARM_UP,
      required: true,
    },
    {
      role: "MAIN_RESISTANCE",
      prescription_model: DEFAULT_PRESCRIPTION_MODEL_FOR_ROLE.MAIN_RESISTANCE,
      required: true,
    },
  ];
}

export function buildAdminSummary(input: {
  primaryStrategy: PrimaryTrainingStrategy;
  level: TemplateLevel;
  environment: TemplateEnvironment;
  daysPerWeek: number;
}): string {
  const strategyLabel = input.primaryStrategy.replaceAll("_", " ");
  return `${strategyLabel} / ${input.level} / ${input.environment} / ${input.daysPerWeek} Days`;
}

export function createEmptyTemplateContract(input: {
  primaryStrategy: PrimaryTrainingStrategy;
  level: TemplateLevel;
  environment: TemplateEnvironment;
  daysPerWeek: number;
  durationWeeks?: number | null;
  targetGender?: "male" | "female" | "all";
  targetAudience: string;
  templatePurpose: string;
}): ProgramTemplateContractV1 {
  const family = primaryStrategyToTemplateFamily(input.primaryStrategy);
  return {
    contract_version: TEMPLATE_CONTRACT_VERSION,
    primary_strategy: input.primaryStrategy,
    template_family: family,
    legacy_program_goal: legacyProgramGoalFromPrimaryStrategy(input.primaryStrategy),
    variant: {
      level: input.level,
      environment: input.environment,
      days_per_week: input.daysPerWeek,
    },
    duration_weeks: input.durationWeeks ?? null,
    target_gender: input.targetGender ?? "all",
    target_audience: input.targetAudience,
    template_purpose: input.templatePurpose,
    admin_summary: buildAdminSummary({
      primaryStrategy: input.primaryStrategy,
      level: input.level,
      environment: input.environment,
      daysPerWeek: input.daysPerWeek,
    }),
    eligibility: {
      rules: [],
      review_conditions: [],
      equipment_requirements: [],
      environment_requirements: [input.environment],
      capability_requirements: [],
      unknown_required_capability_policy: "REVIEW_REQUIRED",
    },
    activity_roles: defaultActivityRolesForResistanceTemplate(),
    progression: defaultSmartProgressionDeclaration(),
    media_preference: {
      preferred_demonstrator: "ANY",
      preferred_media_variant: "STANDARD",
      duplicates_exercise_identity: false,
    },
    review_signals: [],
    transition_policies: [],
    library_readiness: {
      state: "REVIEW_REQUIRED",
      missing_exercise_count: 0,
      missing_media_count: 0,
    },
  };
}

function isTemplateLevel(value: unknown): value is TemplateLevel {
  return typeof value === "string" && (TEMPLATE_LEVELS as readonly string[]).includes(value);
}

function isTemplateEnvironment(value: unknown): value is TemplateEnvironment {
  return typeof value === "string" && (TEMPLATE_ENVIRONMENTS as readonly string[]).includes(value);
}

function includesOnly<T extends string>(values: unknown, allowed: readonly T[]): values is T[] {
  return Array.isArray(values) && values.every((item) => allowed.includes(item as T));
}

/**
 * Validate Smart Progression Exercise Locked: AUTO may only be WEIGHT + REPS.
 */
export function validateSmartAutoVariables(
  variables: unknown,
): TemplateContractValidationIssue[] {
  if (!Array.isArray(variables)) {
    return [{ code: "SMART_AUTO_INVALID", message: "smart_auto_variables must be an array" }];
  }
  const issues: TemplateContractValidationIssue[] = [];
  for (const item of variables) {
    if (item !== "WEIGHT" && item !== "REPS") {
      issues.push({
        code: "SMART_AUTO_EXPANDED",
        message: `Smart AUTO variable not allowed for Exercise Locked: ${String(item)}`,
      });
    }
  }
  return issues;
}

export function validateProgramTemplateContract(
  raw: unknown,
): TemplateContractValidationResult {
  const issues: TemplateContractValidationIssue[] = [];
  if (!raw || typeof raw !== "object") {
    return { ok: false, issues: [{ code: "CONTRACT_MISSING", message: "template_contract missing" }] };
  }
  const c = raw as Partial<ProgramTemplateContractV1>;

  if (c.contract_version !== TEMPLATE_CONTRACT_VERSION) {
    issues.push({ code: "CONTRACT_VERSION", message: "Unsupported contract_version" });
  }
  if (!isPrimaryTrainingStrategy(c.primary_strategy)) {
    issues.push({ code: "PRIMARY_STRATEGY", message: "Invalid primary_strategy" });
  }
  if (!isPrimaryTrainingStrategy(c.template_family)) {
    issues.push({ code: "TEMPLATE_FAMILY", message: "Invalid template_family" });
  }
  if (
    isPrimaryTrainingStrategy(c.primary_strategy) &&
    isPrimaryTrainingStrategy(c.template_family) &&
    c.primary_strategy !== c.template_family
  ) {
    issues.push({
      code: "FAMILY_MISMATCH",
      message: "template_family must match primary_strategy in V1",
    });
  }
  if (!isLegacyProgramGoal(c.legacy_program_goal)) {
    issues.push({ code: "LEGACY_GOAL", message: "Invalid legacy_program_goal" });
  }

  const variant = c.variant;
  if (!variant || typeof variant !== "object") {
    issues.push({ code: "VARIANT_MISSING", message: "variant dimensions required" });
  } else {
    if (!isTemplateLevel(variant.level)) {
      issues.push({ code: "LEVEL", message: "Invalid variant.level" });
    }
    if (!isTemplateEnvironment(variant.environment)) {
      issues.push({ code: "ENVIRONMENT", message: "Invalid variant.environment" });
    }
    if (
      typeof variant.days_per_week !== "number" ||
      !Number.isInteger(variant.days_per_week) ||
      variant.days_per_week < 1 ||
      variant.days_per_week > 7
    ) {
      issues.push({ code: "DAYS", message: "variant.days_per_week must be 1–7 integer" });
    }
    // Independence guard: do not infer level from days
    if (
      isTemplateLevel(variant.level) &&
      typeof variant.days_per_week === "number" &&
      ((variant.level === "BEGINNER" && variant.days_per_week === 3) ||
        (variant.level === "INTERMEDIATE" && variant.days_per_week === 4))
    ) {
      // Valid combinations exist; no issue — documented as independent fields.
    }
  }

  if (typeof c.target_audience !== "string" || !c.target_audience.trim()) {
    issues.push({ code: "TARGET_AUDIENCE", message: "target_audience is required" });
  }
  if (typeof c.template_purpose !== "string" || !c.template_purpose.trim()) {
    issues.push({ code: "TEMPLATE_PURPOSE", message: "template_purpose is required" });
  }
  if (typeof c.admin_summary !== "string" || !c.admin_summary.trim()) {
    issues.push({ code: "ADMIN_SUMMARY", message: "admin_summary is required" });
  }

  if (!c.eligibility || typeof c.eligibility !== "object") {
    issues.push({ code: "ELIGIBILITY", message: "eligibility required" });
  } else if (c.eligibility.unknown_required_capability_policy !== "REVIEW_REQUIRED") {
    issues.push({
      code: "HOME_UNKNOWN_POLICY",
      message: "unknown_required_capability_policy must be REVIEW_REQUIRED",
    });
  }

  if (!Array.isArray(c.activity_roles)) {
    issues.push({ code: "ACTIVITY_ROLES", message: "activity_roles must be an array" });
  } else {
    for (const role of c.activity_roles) {
      if (!isTemplateActivityRole(role?.role) || !isPrescriptionModel(role?.prescription_model)) {
        issues.push({
          code: "ACTIVITY_ROLE_ITEM",
          message: "Invalid activity role or prescription_model",
        });
      }
    }
  }

  if (!c.progression || typeof c.progression !== "object") {
    issues.push({ code: "PROGRESSION", message: "progression declaration required" });
  } else {
    issues.push(...validateSmartAutoVariables(c.progression.smart_auto_variables));
    if (!includesOnly(c.progression.coach_controlled_variables, COACH_CONTROL_VARIABLES)) {
      issues.push({
        code: "COACH_CONTROLS",
        message: "Invalid coach_controlled_variables entry",
      });
    }
  }

  if (!c.media_preference || typeof c.media_preference !== "object") {
    issues.push({ code: "MEDIA_PREFERENCE", message: "media_preference required" });
  } else if (c.media_preference.duplicates_exercise_identity !== false) {
    issues.push({
      code: "MEDIA_NO_FORK",
      message: "duplicates_exercise_identity must be false (one library)",
    });
  }

  if (!Array.isArray(c.review_signals)) {
    issues.push({ code: "REVIEW_SIGNALS", message: "review_signals must be an array" });
  } else if (!includesOnly(c.review_signals, TEMPLATE_REVIEW_SIGNALS)) {
    issues.push({ code: "REVIEW_SIGNAL_ITEM", message: "Unknown review signal" });
  }

  if (!c.library_readiness || typeof c.library_readiness !== "object") {
    issues.push({ code: "LIBRARY_READINESS", message: "library_readiness required" });
  }

  return { ok: issues.length === 0, issues };
}

/**
 * HOME unknown required capability → review semantics for Phase 3 resolver.
 */
export function resolveHomeCapabilityGate(input: {
  requirements: HomeRequirementDeclaration[];
  knownCapabilities: Partial<Record<HomeRequirementKey, boolean | "unknown">>;
}): { status: "SAFE" | "REVIEW_REQUIRED"; reasons: string[] } {
  const reasons: string[] = [];
  for (const req of input.requirements) {
    if (!req.required) continue;
    const known = input.knownCapabilities[req.key];
    if (known === true) continue;
    if (known === false) {
      reasons.push(`MISSING_CAPABILITY:${req.key}`);
    } else {
      reasons.push(`UNKNOWN_REQUIRED_CAPABILITY:${req.key}`);
    }
  }
  return {
    status: reasons.length === 0 ? "SAFE" : "REVIEW_REQUIRED",
    reasons,
  };
}

export function readTemplateContractFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): ProgramTemplateContractV1 | null {
  const raw = metadata?.[TEMPLATE_CONTRACT_METADATA_KEY];
  if (!raw || typeof raw !== "object") return null;
  const validation = validateProgramTemplateContract(raw);
  if (!validation.ok) return null;
  return raw as ProgramTemplateContractV1;
}

export function writeTemplateContractToMetadata(
  metadata: Record<string, unknown> | null | undefined,
  contract: ProgramTemplateContractV1,
): Record<string, unknown> {
  const next = { ...(metadata ?? {}) };
  next[TEMPLATE_CONTRACT_METADATA_KEY] = contract;
  // Keep legacy queryable keys in sync for existing Admin filters
  next.training_location = contract.variant.environment;
  next.target_gender = contract.target_gender;
  next.primary_strategy = contract.primary_strategy;
  next.template_family = contract.template_family;
  return next;
}

/** Map legacy location strings (HOME/GYM/BOTH/home/gym/anywhere) → template environment. */
export function templateEnvironmentFromLocation(
  location: string | null | undefined,
): TemplateEnvironment | null {
  const value = String(location ?? "")
    .trim()
    .toUpperCase();
  if (value === "HOME" || value === "HOME_ONLY") return "HOME";
  if (value === "GYM" || value === "GYM_ONLY") return "GYM";
  if (value === "BOTH" || value === "ANYWHERE" || value === "HYBRID") return null; // ambiguous — Phase 3 REVIEW
  return null;
}

export function templateLevelFromProgramLevel(
  level: string | null | undefined,
): TemplateLevel | null {
  const value = String(level ?? "")
    .trim()
    .toLowerCase();
  if (value === "beginner") return "BEGINNER";
  if (value === "intermediate") return "INTERMEDIATE";
  if (value === "advanced") return "ADVANCED";
  return null;
}

export function programLevelFromTemplateLevel(level: TemplateLevel): "beginner" | "intermediate" | "advanced" {
  if (level === "BEGINNER") return "beginner";
  if (level === "INTERMEDIATE") return "intermediate";
  return "advanced";
}
