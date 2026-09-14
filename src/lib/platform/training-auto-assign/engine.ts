import {
  buildAdminResolverCatalog,
  buildResolverInputFromClient,
  recommendTemplateForClient,
  resolvableFromListItem,
} from "@/lib/admin/admin-template-ui";
import type { AdminProgramListItem } from "@/lib/admin/admin-programs-api";
import { getAdminProgramTemplate, listAdminProgramTemplates } from "@/lib/admin/admin-programs-api";
import { assignAdminClientProgram } from "@/lib/admin/admin-client-training-api";
import { loadClientTrainingStrategyInput } from "@/lib/platform/client-training-strategy-input";
import { mapClientTrainingLocation } from "@/lib/admin/admin-program-ops";
import { templateEnvironmentFromLocation, templateLevelFromProgramLevel } from "@/lib/platform/training-templates";
import type { TemplateResolverResult } from "@/lib/platform/training-templates";
import { supabase } from "@/integrations/supabase/client";
import {
  buildTrainingAssignIdempotencyKey,
  decideTrainingAssignment,
  fingerprintClientContext,
  type TrainingAssignmentClientKind,
  type TrainingAssignmentDecision,
} from "./types";
import { upsertTrainingAssignmentReview } from "./review-api";

export type ClientTrainingContextBundle = {
  clientId: string;
  quizGoal: string | null;
  level: string | null;
  environment: string | null;
  daysPerWeek: number | null;
  equipment: string[] | null;
  homeCapabilities: Record<string, boolean | "unknown"> | null;
  fatLossPriority: boolean;
};

export type ActiveAssignmentLite = {
  id: string;
  source_template_id: string | null;
  template_slug: string | null;
  progression_strategy: string | null;
  status: string;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Next calendar day — safe boundary when a session may be in progress. */
export function nextSafeStartsOn(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Lazy activation of due scheduled assignments happens inside
 * `activate_due_client_program_assignment` (called from client_get_my_training_runtime
 * and admin_get_client_overview). No separate cron required.
 */
export type ScheduledActivationStatus =
  | "noop"
  | "activated"
  | "deferred_in_progress"
  | "skipped_coach_override";

const DEFAULT_AUTO_LEVEL = "BEGINNER";
const DEFAULT_AUTO_DAYS = 3;

function mapPublishedRow(row: Record<string, unknown>): AdminProgramListItem {
  const metadata =
    row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : null;
  const templateContract =
    metadata?.template_contract && typeof metadata.template_contract === "object"
      ? (metadata.template_contract as Record<string, unknown>)
      : null;
  return {
    id: String(row.id),
    slug: String(row.slug),
    name_ar: String(row.name_ar ?? ""),
    name_en: (row.name_en as string | null) ?? null,
    goal: (row.goal as string | null) ?? null,
    level: (row.level as string | null) ?? null,
    duration_weeks: Number(row.duration_weeks ?? 0),
    days_per_week: Number(row.days_per_week ?? 0),
    version: Number(row.version ?? 1),
    is_published: Boolean(row.is_published),
    archived_at: (row.archived_at as string | null) ?? null,
    assignment_count: 0,
    updated_at: String(row.updated_at ?? ""),
    training_location:
      (typeof metadata?.training_location === "string" ? metadata.training_location : null) ??
      (typeof templateContract?.variant === "object" &&
      templateContract.variant &&
      typeof (templateContract.variant as { environment?: unknown }).environment === "string"
        ? String((templateContract.variant as { environment: string }).environment)
        : null),
    metadata,
    template_contract: templateContract,
    primary_strategy: typeof templateContract?.primary_strategy === "string" ? templateContract.primary_strategy : null,
    library_readiness:
      typeof templateContract?.library_readiness === "object" &&
      templateContract.library_readiness &&
      typeof (templateContract.library_readiness as { state?: unknown }).state === "string"
        ? String((templateContract.library_readiness as { state: string }).state)
        : null,
  };
}

/**
 * Load published templates for resolver.
 * Prefer client-readable SELECT (RLS: published only) so paid members can auto-assign.
 * Fall back to admin list RPCs for staff / service contexts.
 */
export async function loadPublishedResolverCatalog() {
  const { data, error } = await supabase
    .from("program_templates")
    .select(
      "id, slug, name_ar, name_en, goal, level, duration_weeks, days_per_week, version, is_published, archived_at, updated_at, metadata",
    )
    .eq("is_published", true)
    .is("archived_at", null)
    .limit(200);

  if (!error && data) {
    const fromList = (data as Record<string, unknown>[])
      .map(mapPublishedRow)
      .map(resolvableFromListItem)
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
    if (fromList.length > 0) {
      return fromList;
    }
  } else if (error) {
    console.warn("[training-auto-assign] client catalog select failed, trying admin path", error.message);
  }

  const listed = await listAdminProgramTemplates({ status: "published", limit: 100 });
  const details = await Promise.all(
    listed.rows.map(async (row) => {
      try {
        return await getAdminProgramTemplate(row.id);
      } catch {
        return null;
      }
    }),
  );
  return buildAdminResolverCatalog(
    details.filter((d): d is NonNullable<typeof d> => Boolean(d)),
    { includeFixtures: false, includePilots: false },
  );
}

export function strategyInputToClientBundle(
  clientId: string,
  strategy: NonNullable<Awaited<ReturnType<typeof loadClientTrainingStrategyInput>>>,
  answers?: Record<string, unknown> | null,
): ClientTrainingContextBundle {
  const ans = answers ?? {};
  const locationHint =
    strategy.trainingEnvironment ??
    strategy.trainingType ??
    strategy.locationPreference ??
    null;
  const location = locationHint ? mapClientTrainingLocation(locationHint) : "BOTH";
  const env =
    !locationHint || location === "BOTH"
      ? "BOTH"
      : templateEnvironmentFromLocation(location as "HOME" | "GYM") ?? String(location);
  const levelRaw = strategy.assessedTrainingLevel ?? null;
  const level =
    levelRaw && levelRaw !== "UNASSESSED"
      ? templateLevelFromProgramLevel(String(levelRaw)) ?? String(levelRaw)
      : null;
  const days =
    typeof strategy.trainingDaysPerWeek === "number" ? strategy.trainingDaysPerWeek : null;
  const equipment = Array.isArray(strategy.availableEquipment)
    ? strategy.availableEquipment
    : null;

  return {
    clientId,
    quizGoal: strategy.rawGoalId ?? strategy.profileGoal ?? null,
    level,
    environment: env,
    daysPerWeek: days,
    equipment,
    homeCapabilities: null,
    fatLossPriority: Boolean(ans.fat_loss_priority ?? ans.fatLossPriority),
  };
}

function recommendWithDefaults(
  context: ClientTrainingContextBundle,
  catalog: Awaited<ReturnType<typeof loadPublishedResolverCatalog>>,
  trainingType: "home" | "gym" | "both",
): TemplateResolverResult {
  return recommendTemplateForClient(
    {
      clientId: context.clientId,
      goal: context.quizGoal,
      trainingType,
      level: context.level ?? DEFAULT_AUTO_LEVEL,
      daysPerWeek: context.daysPerWeek ?? DEFAULT_AUTO_DAYS,
      fatLossPriority: context.fatLossPriority,
      homeCapabilities: context.homeCapabilities ?? undefined,
      availableEquipment: context.equipment,
    },
    catalog,
  );
}

function pickBestResolver(candidates: TemplateResolverResult[]): TemplateResolverResult {
  const scored = candidates.map((resolver) => {
    let score = 0;
    if (resolver.recommended_template_id) score += 100;
    if (resolver.status === "MATCHED" && resolver.compatibility_status === "SAFE" && !resolver.fallback_used) {
      score += 50;
    } else if (resolver.status === "MATCHED_WITH_REVIEW") {
      score += 30;
    } else if (resolver.fallback_class === "CONTEXTUAL_MATCH") {
      score += 20;
    }
    score -= (resolver.dimensions_changed?.length ?? 0) * 2;
    return { resolver, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.resolver ?? candidates[0]!;
}

export async function resolveDecisionForClient(input: {
  clientId: string;
  clientKind: TrainingAssignmentClientKind;
  activeAssignment?: ActiveAssignmentLite | null;
  catalog?: Awaited<ReturnType<typeof loadPublishedResolverCatalog>>;
}): Promise<{
  decision: TrainingAssignmentDecision;
  resolver: ReturnType<typeof recommendTemplateForClient>;
  context: ClientTrainingContextBundle | null;
  contextFingerprint: string;
}> {
  const strategy = await loadClientTrainingStrategyInput(input.clientId);
  if (!strategy) {
    const emptyResolver = recommendTemplateForClient({ clientId: input.clientId }, []);
    const decision = decideTrainingAssignment({
      clientKind: input.clientKind,
      resolver: emptyResolver,
      activeAssignment: input.activeAssignment,
    });
    return {
      decision: {
        ...decision,
        decision_state: "REVIEW_REQUIRED",
        reason_code: "MISSING_TRAINING_PROFILE",
        reason_summary: "لا يوجد training profile — مراجعة مطلوبة",
        should_assign: false,
      },
      resolver: emptyResolver,
      context: null,
      contextFingerprint: "missing-profile",
    };
  }

  // Reload answers for fat-loss flag only (strategy input already parsed days/equipment)
  const { data: profileRow } = await supabase
    .from("training_profiles")
    .select("answers")
    .eq("user_id", input.clientId)
    .maybeSingle();

  const context = strategyInputToClientBundle(
    input.clientId,
    strategy,
    (profileRow?.answers as Record<string, unknown> | null) ?? null,
  );
  const catalog = input.catalog ?? (await loadPublishedResolverCatalog());

  const envCandidates: Array<"home" | "gym" | "both"> =
    context.environment === "BOTH" || context.environment === "ANYWHERE"
      ? ["gym", "home"]
      : context.environment === "HOME"
        ? ["home"]
        : context.environment === "GYM"
          ? ["gym"]
          : ["gym", "home"];

  const resolver = pickBestResolver(
    envCandidates.map((trainingType) => recommendWithDefaults(context, catalog, trainingType)),
  );

  // Last resort: if catalog has published templates but strategy match failed, still assign one.
  const withLastResort =
    resolver.recommended_template_id || catalog.length === 0
      ? resolver
      : {
          ...resolver,
          status: "MATCHED_WITH_REVIEW" as const,
          recommended_template_id: catalog[0]!.id,
          recommended_template_slug: catalog[0]!.slug,
          fallback_used: true,
          fallback_class: "CONTEXTUAL_MATCH" as const,
          recommendation_reason: "LAST_RESORT_PUBLISHED_TEMPLATE",
          review_signals: Array.from(
            new Set([...(resolver.review_signals ?? []), "COACH_REVIEW_REQUIRED" as const]),
          ),
        };

  const decision = decideTrainingAssignment({
    clientKind: input.clientKind,
    resolver: withLastResort,
    activeAssignment: input.activeAssignment,
    coachOverrideProtected:
      Boolean(strategy.coachProtected) ||
      input.activeAssignment?.progression_strategy === "COACH_MANAGED",
  });

  return {
    decision,
    resolver: withLastResort,
    context,
    contextFingerprint: fingerprintClientContext({
      quizGoal: context.quizGoal,
      level: context.level ?? DEFAULT_AUTO_LEVEL,
      environment: context.environment,
      days: context.daysPerWeek ?? DEFAULT_AUTO_DAYS,
      equipment: context.equipment,
    }),
  };
}

export async function applyTrainingAssignmentDecision(input: {
  clientId: string;
  clientKind: TrainingAssignmentClientKind;
  decision: TrainingAssignmentDecision;
  resolver: ReturnType<typeof recommendTemplateForClient>;
  context: ClientTrainingContextBundle | null;
  contextFingerprint: string;
  activeAssignment?: ActiveAssignmentLite | null;
  /** When true, use client RPC for review upsert. */
  asClient?: boolean;
  /** Prefer tomorrow for replace to avoid mid-session swap. */
  deferActivation?: boolean;
  /** Already-created assignment id (skip assign RPC). */
  preAssignedAssignmentId?: string | null;
}): Promise<{
  decision: TrainingAssignmentDecision;
  assignmentId: string | null;
  reviewId: string | null;
  assigned: boolean;
}> {
  const { decision, resolver, context, activeAssignment } = input;
  let assignmentId: string | null = input.preAssignedAssignmentId ?? null;
  let assigned = Boolean(assignmentId);

  if (!assigned && decision.should_assign && decision.recommended_template_id) {
    const startsOn =
      decision.should_replace || input.deferActivation ? nextSafeStartsOn() : todayIsoDate();
    const detail = await assignAdminClientProgram({
      clientId: input.clientId,
      templateId: decision.recommended_template_id,
      startsOn,
      replace: decision.should_replace,
    });
    assignmentId = detail.id;
    assigned = true;
  }

  const idempotencyKey = buildTrainingAssignIdempotencyKey({
    clientId: input.clientId,
    decisionState: decision.decision_state,
    recommendedTemplateId: decision.recommended_template_id,
    activeAssignmentId: activeAssignment?.id ?? null,
    contextFingerprint: input.contextFingerprint,
  });

  let reviewId: string | null = null;
  try {
    const review = await upsertTrainingAssignmentReview({
      clientId: input.clientId,
      clientKind: input.clientKind,
      decisionState: decision.decision_state,
      idempotencyKey,
      asClient: input.asClient,
      payload: {
        quiz_goal: context?.quizGoal ?? null,
        mapped_training_goal: resolver.primary_strategy ?? null,
        training_level: context?.level ?? resolver.resolved_level ?? null,
        training_environment: context?.environment ?? resolver.resolved_environment ?? null,
        days_per_week: context?.daysPerWeek ?? resolver.resolved_days ?? null,
        equipment_summary: (context?.equipment ?? []).join(", ") || null,
        previous_template_id: activeAssignment?.source_template_id ?? null,
        previous_template_slug: activeAssignment?.template_slug ?? null,
        previous_assignment_id: activeAssignment?.id ?? null,
        recommended_template_id: decision.recommended_template_id,
        recommended_template_slug: decision.recommended_template_slug,
        assigned_template_id: assigned ? decision.recommended_template_id : null,
        assigned_template_slug: assigned ? decision.recommended_template_slug : null,
        assignment_id: assignmentId,
        assignment_source: input.clientKind === "EXISTING" && decision.should_replace ? "RECONCILE" : "AUTO",
        reason_code: decision.reason_code,
        reason_summary: decision.reason_summary,
        resolver_trace: {
          status: resolver.status,
          fallback_class: resolver.fallback_class,
          compatibility_status: resolver.compatibility_status,
          review_signals: resolver.review_signals,
          resolution_trace: resolver.resolution_trace,
          recommendation_reason: resolver.recommendation_reason,
          dimensions_changed: resolver.dimensions_changed,
        },
        client_context: context ?? {},
        effective_at: new Date().toISOString(),
      },
    });
    reviewId = review.id;
  } catch (error) {
    // Assignment must not fail solely because review inbox migration is missing.
    console.warn(
      "[training-auto-assign] review upsert skipped",
      error instanceof Error ? error.message : error,
    );
  }

  return {
    decision,
    assignmentId,
    reviewId,
    assigned,
  };
}

export { buildResolverInputFromClient };
