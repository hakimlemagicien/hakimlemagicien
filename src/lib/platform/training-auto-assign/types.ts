/**
 * Training Auto-Assign + Admin Review — decision states and pure decision logic.
 * Reuses Template Resolver. Never invents context. No silent downgrade.
 */

import type { TemplateResolverResult, TemplateResolverStatus } from "@/lib/platform/training-templates";

export const TRAINING_ASSIGNMENT_DECISION_STATES = [
  "AUTO_ASSIGNED",
  "AUTO_UPDATED",
  "NO_CHANGE_REQUIRED",
  "REVIEW_REQUIRED",
  "COACH_OVERRIDE_ACTIVE",
  "BLOCKED_NO_EXACT_MATCH",
] as const;

export type TrainingAssignmentDecisionState =
  (typeof TRAINING_ASSIGNMENT_DECISION_STATES)[number];

export type TrainingAssignmentClientKind = "NEW" | "EXISTING";

export type TrainingAssignmentSource = "AUTO" | "COACH" | "RECONCILE" | "SYSTEM";

export type ActiveAssignmentSnapshot = {
  id: string;
  source_template_id: string | null;
  template_slug?: string | null;
  progression_strategy?: string | null;
  status: string;
};

export type DecideTrainingAssignmentInput = {
  clientKind: TrainingAssignmentClientKind;
  resolver: TemplateResolverResult;
  activeAssignment?: ActiveAssignmentSnapshot | null;
  /** True when coach override must be preserved (e.g. COACH_MANAGED). */
  coachOverrideProtected?: boolean;
};

export type TrainingAssignmentDecision = {
  decision_state: TrainingAssignmentDecisionState;
  should_assign: boolean;
  should_replace: boolean;
  recommended_template_id: string | null;
  recommended_template_slug: string | null;
  reason_code: string;
  reason_summary: string;
  requires_admin_approval: false; // Safe exact match never waits on admin
  admin_review_only: boolean;
};

function isExactSafeMatch(resolver: TemplateResolverResult): boolean {
  return (
    resolver.status === "MATCHED" &&
    Boolean(resolver.recommended_template_id) &&
    resolver.compatibility_status === "SAFE" &&
    !resolver.fallback_used
  );
}

function mapResolverToBlockedOrReview(status: TemplateResolverStatus): {
  state: TrainingAssignmentDecisionState;
  code: string;
  summary: string;
} {
  if (status === "INSUFFICIENT_CONTEXT") {
    return {
      state: "REVIEW_REQUIRED",
      code: "INSUFFICIENT_CONTEXT",
      summary: "سياق التدريب غير كافٍ — لا تخمين تلقائي",
    };
  }
  if (status === "NO_EXACT_MATCH" || status === "NO_COMPATIBLE_TEMPLATE") {
    return {
      state: "BLOCKED_NO_EXACT_MATCH",
      code: status,
      summary: "لا يوجد قالب مطابق آمن — لا تخفيض صامت",
    };
  }
  if (status === "MATCHED_WITH_REVIEW") {
    return {
      state: "REVIEW_REQUIRED",
      code: "MATCHED_WITH_REVIEW",
      summary: "تطابق مع إشارات مراجعة — يتطلب تدخل مدرب",
    };
  }
  return {
    state: "REVIEW_REQUIRED",
    code: status,
    summary: "تعيين تلقائي غير آمن — مراجعة مطلوبة",
  };
}

/**
 * Pure decision: Template Resolver result + active assignment → action.
 */
export function decideTrainingAssignment(
  input: DecideTrainingAssignmentInput,
): TrainingAssignmentDecision {
  const { resolver, activeAssignment, clientKind, coachOverrideProtected } = input;

  if (coachOverrideProtected || activeAssignment?.progression_strategy === "COACH_MANAGED") {
    return {
      decision_state: "COACH_OVERRIDE_ACTIVE",
      should_assign: false,
      should_replace: false,
      recommended_template_id: resolver.recommended_template_id,
      recommended_template_slug: resolver.recommended_template_slug,
      reason_code: "COACH_OVERRIDE_PROTECTED",
      reason_summary: "تدخل المدرب محمي — لا استبدال تلقائي",
      requires_admin_approval: false,
      admin_review_only: true,
    };
  }

  if (!isExactSafeMatch(resolver)) {
    const mapped = mapResolverToBlockedOrReview(resolver.status);
    return {
      decision_state: mapped.state,
      should_assign: false,
      should_replace: false,
      recommended_template_id: resolver.recommended_template_id,
      recommended_template_slug: resolver.recommended_template_slug,
      reason_code: mapped.code,
      reason_summary: mapped.summary,
      requires_admin_approval: false,
      admin_review_only: true,
    };
  }

  const recommendedId = resolver.recommended_template_id!;
  const recommendedSlug = resolver.recommended_template_slug;

  if (activeAssignment?.source_template_id === recommendedId) {
    return {
      decision_state: "NO_CHANGE_REQUIRED",
      should_assign: false,
      should_replace: false,
      recommended_template_id: recommendedId,
      recommended_template_slug: recommendedSlug,
      reason_code: "ALREADY_CORRECT_TEMPLATE",
      reason_summary: "القالب الحالي مطابق للتوصية — لا تعيين جديد",
      requires_admin_approval: false,
      admin_review_only: false,
    };
  }

  if (clientKind === "NEW" || !activeAssignment) {
    return {
      decision_state: "AUTO_ASSIGNED",
      should_assign: true,
      should_replace: false,
      recommended_template_id: recommendedId,
      recommended_template_slug: recommendedSlug,
      reason_code: "EXACT_SAFE_MATCH",
      reason_summary: "تطابق تام وآمن — تعيين تلقائي بدون موافقة أدمن",
      requires_admin_approval: false,
      admin_review_only: true,
    };
  }

  return {
    decision_state: "AUTO_UPDATED",
    should_assign: true,
    should_replace: true,
    recommended_template_id: recommendedId,
    recommended_template_slug: recommendedSlug,
    reason_code: "EXACT_SAFE_MATCH_DIFFERENT_TEMPLATE",
    reason_summary: "قالب مختلف مطابق وآمن — تحديث عبر snapshot جديد",
    requires_admin_approval: false,
    admin_review_only: true,
  };
}

/** Stable idempotency key for reconcile / auto-assign (no duplicate on rerun). */
export function buildTrainingAssignIdempotencyKey(input: {
  clientId: string;
  decisionState: TrainingAssignmentDecisionState;
  recommendedTemplateId: string | null;
  activeAssignmentId: string | null;
  contextFingerprint: string;
}): string {
  return [
    input.clientId,
    input.decisionState,
    input.recommendedTemplateId ?? "none",
    input.activeAssignmentId ?? "none",
    input.contextFingerprint,
  ].join(":");
}

export function fingerprintClientContext(input: {
  quizGoal?: string | null;
  level?: string | null;
  environment?: string | null;
  days?: number | null;
  equipment?: string[] | null;
}): string {
  return [
    input.quizGoal ?? "",
    input.level ?? "",
    input.environment ?? "",
    input.days ?? "",
    (input.equipment ?? []).slice().sort().join(","),
  ].join("|");
}
