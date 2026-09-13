import {
  buildAdminResolverCatalog,
  buildResolverInputFromClient,
  recommendTemplateForClient,
} from "@/lib/admin/admin-template-ui";
import { getAdminProgramTemplate, listAdminProgramTemplates } from "@/lib/admin/admin-programs-api";
import { assignAdminClientProgram } from "@/lib/admin/admin-client-training-api";
import { loadClientTrainingStrategyInput } from "@/lib/platform/client-training-strategy-input";
import { mapClientTrainingLocation } from "@/lib/admin/admin-program-ops";
import { templateEnvironmentFromLocation, templateLevelFromProgramLevel } from "@/lib/platform/training-templates";
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

export async function loadPublishedResolverCatalog() {
  const listed = await listAdminProgramTemplates({ status: "published", limit: 50 });
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
  const location = mapClientTrainingLocation(locationHint);
  const env =
    location === "BOTH"
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
  const { data: profileRow } = await (await import("@/integrations/supabase/client")).supabase
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
  const resolver = recommendTemplateForClient(
    {
      clientId: input.clientId,
      goal: context.quizGoal,
      trainingType: context.environment === "HOME" ? "home" : context.environment === "GYM" ? "gym" : "both",
      level: context.level,
      daysPerWeek: context.daysPerWeek,
      fatLossPriority: context.fatLossPriority,
      homeCapabilities: context.homeCapabilities ?? undefined,
      availableEquipment: context.equipment,
    },
    catalog,
  );

  const decision = decideTrainingAssignment({
    clientKind: input.clientKind,
    resolver,
    activeAssignment: input.activeAssignment,
    coachOverrideProtected:
      Boolean(strategy.coachProtected) ||
      input.activeAssignment?.progression_strategy === "COACH_MANAGED",
  });

  return {
    decision,
    resolver,
    context,
    contextFingerprint: fingerprintClientContext({
      quizGoal: context.quizGoal,
      level: context.level,
      environment: context.environment,
      days: context.daysPerWeek,
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
      },
      client_context: context ?? {},
      effective_at: new Date().toISOString(),
    },
  });

  return {
    decision,
    assignmentId,
    reviewId: review.id,
    assigned,
  };
}

export { buildResolverInputFromClient };
