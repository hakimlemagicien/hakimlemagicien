/**
 * Admin Template UI presentation helpers (Phase 4).
 * Read-only display + resolver wiring. No assignment side effects.
 */

import { programTemplateContractFromMetadata } from "@/lib/admin/admin-program-builder";
import type { AdminProgramDetail, AdminProgramListItem } from "@/lib/admin/admin-programs-api";
import { mapClientTrainingLocation, type ProgramLocation } from "@/lib/admin/admin-program-ops";
import {
  PHASE3_FIXTURE_TEMPLATES,
  PRIMARY_TRAINING_STRATEGIES,
  activityRoleFromLegacyExerciseRole,
  isLegacyProgramGoal,
  listAssignableFixtureTemplates,
  listPilotResolvableTemplates,
  mergeResolverCatalogPreferringPilots,
  primaryStrategyFromLegacyProgramGoal,
  resolveProgramTemplate,
  templateEnvironmentFromLocation,
  templateLevelFromProgramLevel,
  type LibraryReadinessState,
  type PrimaryTrainingStrategy,
  type ProgramTemplateContractV1,
  type ResolvableTemplateRecord,
  type TemplateEnvironment,
  type TemplateLevel,
  type TemplateResolverInput,
  type TemplateResolverResult,
  type TemplateResolverStatus,
} from "@/lib/platform/training-templates";

export { PRIMARY_TRAINING_STRATEGIES };
export type { PrimaryTrainingStrategy, TemplateResolverResult, TemplateResolverStatus };

export type TemplatePresentation = {
  has_contract: boolean;
  is_legacy: boolean;
  name: string;
  primary_strategy: PrimaryTrainingStrategy | null;
  primary_strategy_label: string;
  level: TemplateLevel | null;
  level_label: string;
  environment: TemplateEnvironment | null;
  environment_label: string;
  days: number | null;
  days_label: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  status_label: string;
  version: number;
  library_readiness: LibraryReadinessState | null;
  library_readiness_label: string;
  target_audience: string | null;
  template_purpose: string | null;
  admin_summary: string | null;
  contract: ProgramTemplateContractV1 | null;
};

const STRATEGY_LABELS_AR: Record<PrimaryTrainingStrategy, string> = {
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
};

const LEVEL_LABELS_AR: Record<TemplateLevel, string> = {
  BEGINNER: "مبتدئ",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدم",
};

const ENV_LABELS_AR: Record<TemplateEnvironment, string> = {
  GYM: "صالة",
  HOME: "منزل",
};

const READINESS_LABELS_AR: Record<LibraryReadinessState, string> = {
  READY: "جاهز",
  MISSING_MEDIA: "وسائط ناقصة",
  MISSING_EXERCISE: "تمارين ناقصة",
  REVIEW_REQUIRED: "يتطلب مراجعة",
};

const RESOLVER_STATUS_LABELS_AR: Record<TemplateResolverStatus, string> = {
  MATCHED: "تطابق تام",
  MATCHED_WITH_REVIEW: "تطابق مع مراجعة",
  NO_EXACT_MATCH: "لا تطابق تام",
  NO_COMPATIBLE_TEMPLATE: "لا قالب متوافق",
  INSUFFICIENT_CONTEXT: "سياق غير كافٍ",
  BLOCKED: "محظور",
};

const ACTIVITY_ROLE_LABELS_AR: Record<string, string> = {
  GENERAL_WARM_UP: "إحماء عام",
  TARGETED_DYNAMIC_WARM_UP: "إحماء ديناميكي مستهدف",
  EXERCISE_SPECIFIC_RAMP_UP: "تهيئة خاصة بالتمرين",
  MAIN_RESISTANCE: "مقاومة رئيسية",
  POST_WORKOUT_CARDIO: "كارديو بعد التمرين",
  AEROBIC_ENDURANCE_BLOCK: "تحمّل هوائي",
  CONTROLLED_AEROBIC_INTERVAL_BLOCK: "فترات هوائية محكمة",
  POWER_SKILL_BLOCK: "مهارة قوة",
  MOBILITY_ACTIVITY: "مرونة/حركة",
  DAILY_ACTIVITY: "نشاط يومي",
  warmup: "إحماء",
  main: "رئيسي",
  accessory: "مساعد",
  finisher: "ختام",
};

export function primaryStrategyLabelAr(strategy: PrimaryTrainingStrategy | null | undefined): string {
  if (!strategy) return "—";
  return STRATEGY_LABELS_AR[strategy] ?? strategy;
}

export function templateLevelLabelAr(level: TemplateLevel | null | undefined): string {
  if (!level) return "—";
  return LEVEL_LABELS_AR[level] ?? level;
}

export function templateEnvironmentLabelAr(env: TemplateEnvironment | null | undefined): string {
  if (!env) return "—";
  return ENV_LABELS_AR[env] ?? env;
}

export function libraryReadinessLabelAr(state: LibraryReadinessState | null | undefined): string {
  if (!state) return "غير معروف";
  return READINESS_LABELS_AR[state] ?? state;
}

export function resolverStatusLabelAr(status: TemplateResolverStatus): string {
  return RESOLVER_STATUS_LABELS_AR[status] ?? status;
}

export function activityRoleLabelAr(role: string | null | undefined): string {
  if (!role) return "تمرين";
  return ACTIVITY_ROLE_LABELS_AR[role] ?? role;
}

export function daysBadgeLabel(days: number | null | undefined): string {
  if (days == null || !Number.isFinite(days)) return "—";
  return `${days} أيام`;
}

function statusFromRow(row: Pick<AdminProgramListItem, "is_published" | "archived_at">): {
  status: TemplatePresentation["status"];
  status_label: string;
} {
  if (row.archived_at) return { status: "ARCHIVED", status_label: "مؤرشف" };
  if (row.is_published) return { status: "PUBLISHED", status_label: "منشور" };
  return { status: "DRAFT", status_label: "مسودة" };
}

/** Prefer contract; fall back to legacy list columns (no name parsing). */
export function presentProgramTemplate(input: {
  name_ar: string;
  goal?: string | null;
  level?: string | null;
  days_per_week?: number | null;
  training_location?: string | null;
  version?: number;
  is_published?: boolean;
  archived_at?: string | null;
  metadata?: Record<string, unknown> | null;
}): TemplatePresentation {
  const contract = input.metadata != null ? programTemplateContractFromMetadata(input.metadata) : null;
  const { status, status_label } = statusFromRow({
    is_published: Boolean(input.is_published),
    archived_at: input.archived_at ?? null,
  });

  if (contract) {
    return {
      has_contract: true,
      is_legacy: false,
      name: input.name_ar,
      primary_strategy: contract.primary_strategy,
      primary_strategy_label: primaryStrategyLabelAr(contract.primary_strategy),
      level: contract.variant.level,
      level_label: templateLevelLabelAr(contract.variant.level),
      environment: contract.variant.environment,
      environment_label: templateEnvironmentLabelAr(contract.variant.environment),
      days: contract.variant.days_per_week,
      days_label: daysBadgeLabel(contract.variant.days_per_week),
      status,
      status_label,
      version: input.version ?? 1,
      library_readiness: contract.library_readiness.state,
      library_readiness_label: libraryReadinessLabelAr(contract.library_readiness.state),
      target_audience: contract.target_audience?.trim() || null,
      template_purpose: contract.template_purpose?.trim() || null,
      admin_summary: contract.admin_summary?.trim() || null,
      contract,
    };
  }

  const legacyGoal = isLegacyProgramGoal(input.goal) ? input.goal : null;
  const strategy = legacyGoal ? primaryStrategyFromLegacyProgramGoal(legacyGoal) : null;
  const level = templateLevelFromProgramLevel(String(input.level ?? ""));
  const environment = templateEnvironmentFromLocation(String(input.training_location ?? "").toUpperCase());

  return {
    has_contract: false,
    is_legacy: true,
    name: input.name_ar,
    primary_strategy: strategy,
    primary_strategy_label: strategy ? primaryStrategyLabelAr(strategy) : "تصنيف قديم",
    level,
    level_label: level ? templateLevelLabelAr(level) : String(input.level ?? "—"),
    environment,
    environment_label: environment
      ? templateEnvironmentLabelAr(environment)
      : String(input.training_location ?? "—"),
    days: input.days_per_week ?? null,
    days_label: daysBadgeLabel(input.days_per_week),
    status,
    status_label,
    version: input.version ?? 1,
    library_readiness: null,
    library_readiness_label: "عقد غير متوفر",
    target_audience: null,
    template_purpose: null,
    admin_summary: null,
    contract: null,
  };
}

export function presentListItem(row: AdminProgramListItem): TemplatePresentation {
  return presentProgramTemplate({
    ...row,
    metadata: row.metadata ?? (row.template_contract ? { template_contract: row.template_contract } : null),
  });
}

export function presentDetail(detail: AdminProgramDetail): TemplatePresentation {
  return presentProgramTemplate({ ...detail, metadata: detail.metadata });
}

export type TemplateUiFilters = {
  primary_strategy?: string;
  level?: string;
  environment?: string;
  days?: string;
  status?: string;
  library_readiness?: string;
};

export function matchesTemplatePresentation(
  presentation: TemplatePresentation,
  filters: TemplateUiFilters,
): boolean {
  if (filters.primary_strategy && presentation.primary_strategy !== filters.primary_strategy) {
    return false;
  }
  if (filters.level) {
    const mapped = templateLevelFromProgramLevel(filters.level);
    const want = (mapped ?? filters.level.toUpperCase()) as string;
    if (presentation.level !== want) return false;
  }
  if (filters.environment) {
    if (presentation.environment !== filters.environment.toUpperCase()) return false;
  }
  if (filters.days && String(presentation.days ?? "") !== filters.days) return false;
  if (filters.status) {
    const map: Record<string, TemplatePresentation["status"]> = {
      draft: "DRAFT",
      published: "PUBLISHED",
      archived: "ARCHIVED",
      DRAFT: "DRAFT",
      PUBLISHED: "PUBLISHED",
      ARCHIVED: "ARCHIVED",
    };
    if (presentation.status !== (map[filters.status] ?? filters.status)) return false;
  }
  if (filters.library_readiness) {
    if (presentation.library_readiness !== filters.library_readiness) return false;
  }
  return true;
}

const QUIZ_GOAL_IDS = new Set([
  "fat",
  "muscle",
  "fitness",
  "athletic",
  "shape",
  "gain",
  "glutes",
  "waist",
  "body",
  "fit",
  "tone",
]);

/** Map client overview.goal → quiz goal id for resolver (fail closed if unknown). */
export function quizGoalIdFromClientGoal(goal: string | null | undefined): string | null {
  const raw = String(goal ?? "").trim().toLowerCase();
  if (!raw) return null;
  if (QUIZ_GOAL_IDS.has(raw)) return raw;
  if (raw.includes("glute") || raw.includes("أرداف")) return "glutes";
  if (raw.includes("waist") || raw.includes("خصر")) return "waist";
  if (raw.includes("tone") || raw.includes("تنسيق")) return "tone";
  if (raw.includes("athletic") || raw.includes("رياضي")) return "athletic";
  if (raw.includes("gain") || raw.includes("وزن صحي")) return "gain";
  if (raw.includes("shape") || raw.includes("body") || raw.includes("تركيب")) return "shape";
  if (raw.includes("fit") && !raw.includes("fat")) return "fit";
  if (raw.includes("fitness") || raw.includes("لياقة")) return "fitness";
  if (raw.includes("muscle") || raw.includes("bulk") || raw.includes("تضخيم") || raw.includes("عضلات")) {
    return "muscle";
  }
  if (raw.includes("fat") || raw.includes("cut") || raw.includes("loss") || raw.includes("تنشيف")) {
    return "fat";
  }
  return null;
}

export function resolvableFromDetail(detail: AdminProgramDetail): ResolvableTemplateRecord | null {
  const contract = programTemplateContractFromMetadata(detail.metadata);
  if (!contract) return null;
  const status = detail.archived_at ? "ARCHIVED" : detail.is_published ? "PUBLISHED" : "DRAFT";
  return {
    id: detail.id,
    slug: detail.slug,
    version: detail.version,
    status,
    is_published: detail.is_published && !detail.archived_at,
    archived: Boolean(detail.archived_at),
    version_group_id: detail.slug,
    contract,
    equipment_tags:
      typeof detail.equipment === "string" && detail.equipment.trim()
        ? detail.equipment.split(/[,\s]+/).filter(Boolean)
        : undefined,
  };
}

/** List-row → resolvable when list RPC projects template_contract (Phase 6 DB pilots). */
export function resolvableFromListItem(item: AdminProgramListItem): ResolvableTemplateRecord | null {
  const contract = programTemplateContractFromMetadata(
    item.template_contract ? { template_contract: item.template_contract } : item.metadata,
  );
  if (!contract) return null;
  const status = item.archived_at ? "ARCHIVED" : item.is_published ? "PUBLISHED" : "DRAFT";
  return {
    id: item.id,
    slug: item.slug,
    version: item.version,
    status,
    is_published: item.is_published && !item.archived_at,
    archived: Boolean(item.archived_at),
    version_group_id: item.slug,
    contract,
  };
}

/**
 * Catalog for Admin resolver (Phase 6):
 * Prefer DB contract records; optional in-memory pilots for offline/dev/tests only;
 * fixtures fill non-overlapping gaps when includeFixtures is true.
 */
export function buildAdminResolverCatalog(
  details: AdminProgramDetail[] = [],
  options?: { includeFixtures?: boolean; includePilots?: boolean },
): ResolvableTemplateRecord[] {
  const fromDb = details.map(resolvableFromDetail).filter((row): row is ResolvableTemplateRecord => Boolean(row));
  const includeFixtures = options?.includeFixtures !== false;
  // Phase 6: real DB is source for pilots — in-memory pilots opt-in only.
  const includePilots = options?.includePilots === true;
  const pilots = includePilots ? listPilotResolvableTemplates() : [];
  const withPilots = mergeResolverCatalogPreferringPilots(fromDb, pilots);
  if (!includeFixtures) {
    return withPilots.filter((t) => t.status === "PUBLISHED" && t.is_published && !t.archived);
  }
  const fixtures = listAssignableFixtureTemplates(PHASE3_FIXTURE_TEMPLATES);
  // DB (+ optional in-memory pilots) preferred; fixtures only for non-overlapping gaps.
  return mergeResolverCatalogPreferringPilots(fixtures, withPilots);
}

export function buildResolverInputFromClient(input: {
  clientId?: string;
  goal?: string | null;
  trainingType?: string | null;
  level?: string | null;
  daysPerWeek?: number | null;
  fatLossPriority?: boolean;
  homeCapabilities?: TemplateResolverInput["home_capabilities"];
  availableEquipment?: string[] | null;
  coachOverride?: TemplateResolverInput["coach_override"];
  primary_strategy?: TemplateResolverInput["primary_strategy"];
}): TemplateResolverInput {
  const location = mapClientTrainingLocation(input.trainingType);
  const env: TemplateResolverInput["training_environment"] =
    location === "BOTH" ? "BOTH" : (location as TemplateEnvironment);
  return {
    client_id: input.clientId ?? null,
    quiz_goal_id: quizGoalIdFromClientGoal(input.goal),
    primary_strategy: input.primary_strategy ?? null,
    fat_loss_priority: input.fatLossPriority ?? false,
    training_level: templateLevelFromProgramLevel(String(input.level ?? "")) ?? input.level,
    training_environment: env,
    training_days_per_week: input.daysPerWeek ?? null,
    home_capabilities: input.homeCapabilities ?? null,
    available_equipment: input.availableEquipment ?? null,
    coach_override: input.coachOverride ?? null,
  };
}

export function recommendTemplateForClient(
  client: Parameters<typeof buildResolverInputFromClient>[0],
  catalog?: ResolvableTemplateRecord[],
  catalogOptions?: { includeFixtures?: boolean; includePilots?: boolean },
): TemplateResolverResult {
  return resolveProgramTemplate(
    buildResolverInputFromClient(client),
    // Default catalog excludes in-memory pilots unless catalogOptions.includePilots is true.
    catalog ?? buildAdminResolverCatalog([], catalogOptions),
  );
}

export type RecommendationReasonCheck = {
  id: string;
  label: string;
  ok: boolean;
};

export function buildRecommendationChecks(result: TemplateResolverResult): RecommendationReasonCheck[] {
  const reason = result.recommendation_reason;
  const exact = result.status === "MATCHED" || result.status === "MATCHED_WITH_REVIEW";
  return [
    {
      id: "goal",
      label: `الهدف: ${primaryStrategyLabelAr(reason.goal)}`,
      ok: Boolean(reason.goal) && (exact || result.resolution_trace.strategy_filtered_count > 0),
    },
    {
      id: "level",
      label: `المستوى: ${templateLevelLabelAr(reason.level)}`,
      ok: Boolean(reason.level) && (exact || result.resolution_trace.level_filtered_count > 0),
    },
    {
      id: "environment",
      label: `المكان: ${templateEnvironmentLabelAr(reason.environment)}`,
      ok: Boolean(reason.environment) && (exact || result.resolution_trace.environment_filtered_count > 0),
    },
    {
      id: "days",
      label: `الأيام: ${reason.days ?? "—"}`,
      ok: reason.days != null && (exact || result.resolution_trace.days_filtered_count > 0),
    },
    {
      id: "equipment",
      label: `المعدات: ${reason.equipment}`,
      ok: reason.equipment === "SUPPORTED",
    },
    {
      id: "capability",
      label: `القدرات: ${reason.capability}`,
      ok: reason.capability === "COMPATIBLE" || reason.capability === "N/A",
    },
    {
      id: "ready",
      label: "جاهزية المكتبة",
      ok: exact,
    },
  ];
}

export function mapLegacyExerciseRoleToActivityLabel(role: string | null | undefined): string {
  return activityRoleLabelAr(activityRoleFromLegacyExerciseRole(role));
}

export function locationNeedsClarification(trainingType: string | null | undefined): boolean {
  return mapClientTrainingLocation(trainingType) === "BOTH";
}

export type DemoRecommendationScenario =
  | "exact_match"
  | "no_exact_match"
  | "review_required"
  | "insufficient_context"
  | "coach_override"
  | "legacy_template";

export function runDemoRecommendationScenario(scenario: DemoRecommendationScenario): {
  title: string;
  client: Parameters<typeof buildResolverInputFromClient>[0];
  result: TemplateResolverResult;
  legacyNote?: string;
} {
  const catalog = buildAdminResolverCatalog([], { includeFixtures: true, includePilots: true });
  switch (scenario) {
    case "exact_match": {
      const client = {
        goal: "muscle",
        trainingType: "home_only",
        level: "beginner",
        daysPerWeek: 3,
      };
      return {
        title: "تطابق تام — بناء عضلات / مبتدئ / منزل / 3",
        client,
        result: recommendTemplateForClient(client, catalog),
      };
    }
    case "no_exact_match": {
      const client = {
        goal: "glutes",
        trainingType: "home_only",
        level: "beginner",
        daysPerWeek: 3,
      };
      return {
        title: "لا تطابق تام — تركيز أرداف منزل",
        client,
        result: recommendTemplateForClient(client, catalog),
      };
    }
    case "review_required": {
      const client = {
        goal: "muscle",
        trainingType: "home_only",
        level: "beginner",
        daysPerWeek: 3,
        homeCapabilities: { safe_band_anchor: "unknown" as const },
      };
      const bandOnly = catalog.filter(
        (row) =>
          row.id === "tpl-home-band-req" ||
          row.slug.includes("BAND_ANCHOR") ||
          (row.contract.eligibility.capability_requirements ?? []).some((c) => c.key === "safe_band_anchor"),
      );
      return {
        title: "مراجعة مطلوبة — قدرة منزلية غير معروفة",
        client,
        result: recommendTemplateForClient(client, bandOnly.length ? bandOnly : catalog),
      };
    }
    case "insufficient_context": {
      const client = {
        goal: "muscle",
        trainingType: "gym_and_home",
        level: "beginner",
        daysPerWeek: 3,
      };
      return {
        title: "سياق غير كافٍ — BOTH / ANYWHERE",
        client,
        result: recommendTemplateForClient(client, catalog),
      };
    }
    case "coach_override": {
      const client = {
        goal: "muscle",
        trainingType: "home_only",
        level: "beginner",
        daysPerWeek: 3,
        coachOverride: {
          selected_template_id: "tpl-mg-beg-gym-3",
          reason: "المدرب اختار نسخة الصالة مؤقتاً",
        },
      };
      return {
        title: "تجاوز المدرب",
        client,
        result: recommendTemplateForClient(client, catalog),
      };
    }
    case "legacy_template": {
      const client = {
        goal: "muscle",
        trainingType: "home_only",
        level: "beginner",
        daysPerWeek: 3,
      };
      return {
        title: "قالب قديم بدون عقد",
        client,
        result: recommendTemplateForClient(client, catalog),
        legacyNote: "القوالب بدون metadata.template_contract تُعرض كـ LEGACY — لا جمهور/غرض مُختلق.",
      };
    }
  }
}

export function programLocationToEnvFilter(location: ProgramLocation | string | null): string {
  const value = String(location ?? "").toUpperCase();
  if (value === "HOME" || value === "GYM") return value;
  return "";
}
