import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AdminCard, AdminStatusBadge } from "@/components/admin/AdminPage";
import { supabase } from "@/integrations/supabase/client";
import { formatAdminDate } from "@/lib/admin/admin-status";
import { resolverStatusLabelAr } from "@/lib/admin/admin-template-ui";
import { progressionStrategyLabel } from "@/lib/platform/progression-strategy";
import {
  applyTrainingAssignmentDecision,
  resolveDecisionForClient,
  type TrainingAssignmentDecisionState,
} from "@/lib/platform/training-auto-assign";
import type { TemplateResolverStatus } from "@/lib/platform/training-templates";

const LABELS: Record<string, string> = {
  AUTO_ASSIGNED: "تعيين تلقائي",
  AUTO_UPDATED: "تحديث تلقائي",
  NO_CHANGE_REQUIRED: "لا تغيير مطلوب",
  REVIEW_REQUIRED: "مراجعة مطلوبة",
  COACH_OVERRIDE_ACTIVE: "تدخل مدرب نشط",
  BLOCKED_NO_EXACT_MATCH: "محظور — لا تطابق",
};

type LatestReview = {
  id: string;
  decision_state: TrainingAssignmentDecisionState;
  reason_summary: string | null;
  reason_code: string | null;
  recommended_template_slug: string | null;
  assigned_template_slug: string | null;
  previous_template_slug: string | null;
  assignment_source: string | null;
  resolver_trace: Record<string, unknown> | null;
  is_reviewed: boolean;
  effective_at: string;
  created_at: string;
};

async function fetchLatestReview(clientId: string): Promise<LatestReview | null> {
  const { data, error } = await (supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          order: (
            col: string,
            opts: { ascending: boolean },
          ) => {
            limit: (n: number) => {
              maybeSingle: () => Promise<{ data: LatestReview | null; error: Error | null }>;
            };
          };
        };
      };
    };
  })
    .from("training_assignment_reviews")
    .select(
      "id, decision_state, reason_summary, reason_code, recommended_template_slug, assigned_template_slug, previous_template_slug, assignment_source, resolver_trace, is_reviewed, effective_at, created_at",
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (isMissingReviewsRelation(error.message)) return null;
    throw error;
  }
  return data ?? null;
}

function isMissingReviewsRelation(message: string): boolean {
  return /training_assignment_reviews|admin_upsert_training_assignment_review|admin_list_training_assignment_reviews|does not exist|42P01|42883/i.test(
    message,
  );
}

function displayValue(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  return String(value);
}

function resolverSummaryAr(trace: Record<string, unknown> | null | undefined): string {
  if (!trace) return "—";
  const status = String(trace.status ?? "").trim();
  const compatibility = String(trace.compatibility_status ?? "").trim();
  const parts = [
    status ? resolverStatusLabelAr(status as TemplateResolverStatus) : "",
    compatibility ? resolverStatusLabelAr(compatibility as TemplateResolverStatus) : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

export function ClientTrainingAutoAssignPanel({
  clientId,
  activeTemplateSlug,
  assignmentVersion,
  progressionStrategy,
  assignmentSourceLabel,
  hasActiveProgram,
  onAssigned,
}: {
  clientId: string;
  activeTemplateSlug?: string | null;
  assignmentVersion?: number | null;
  progressionStrategy?: string | null;
  assignmentSourceLabel?: string | null;
  hasActiveProgram?: boolean;
  onAssigned?: () => void;
}) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reviewQuery = useQuery({
    queryKey: ["client-training-assignment-review", clientId],
    queryFn: () => fetchLatestReview(clientId),
  });

  const review = reviewQuery.data;
  const coachManaged = progressionStrategy === "COACH_MANAGED";
  const state = review?.decision_state;
  const tone =
    state === "AUTO_ASSIGNED" || state === "AUTO_UPDATED" || state === "NO_CHANGE_REQUIRED"
      ? ("success" as const)
      : state === "REVIEW_REQUIRED" || state === "BLOCKED_NO_EXACT_MATCH"
        ? ("review" as const)
        : ("foundation" as const);
  const managementLabel = coachManaged
    ? `${progressionStrategyLabel("COACH_MANAGED")} — محمي`
    : state
      ? (LABELS[state] ?? state)
      : "تلقائي";

  const items = [
    { label: "القالب النشط", value: displayValue(activeTemplateSlug) },
    { label: "إصدار التعيين", value: displayValue(assignmentVersion) },
    { label: "المصدر", value: displayValue(assignmentSourceLabel || review?.assignment_source) },
    { label: "حالة الإدارة", value: managementLabel },
    { label: "السابق", value: displayValue(review?.previous_template_slug) },
    { label: "الموصى به", value: displayValue(review?.recommended_template_slug) },
    { label: "آخر تعيين", value: displayValue(review?.assigned_template_slug) },
    {
      label: "المراجعة",
      value: review ? (review.is_reviewed ? "تمت المراجعة" : "غير مراجعة") : "لا إشعار بعد",
    },
    { label: "السريان", value: review?.effective_at ? formatAdminDate(review.effective_at) : "—" },
    { label: "المطابقة", value: resolverSummaryAr(review?.resolver_trace), wide: true },
    {
      label: "السبب",
      value: displayValue(review?.reason_summary ?? review?.reason_code),
      wide: true,
    },
  ];

  const runAutoAssign = async () => {
    setBusy(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const { decision, resolver, context, contextFingerprint } = await resolveDecisionForClient({
        clientId,
        clientKind: hasActiveProgram ? "EXISTING" : "NEW",
        activeAssignment: null,
      });
      if (!decision.should_assign || !decision.recommended_template_id) {
        setActionError(decision.reason_summary || "لا يوجد قالب مناسب للتعيين التلقائي.");
        await applyTrainingAssignmentDecision({
          clientId,
          clientKind: hasActiveProgram ? "EXISTING" : "NEW",
          decision,
          resolver,
          context,
          contextFingerprint,
        });
        await reviewQuery.refetch();
        return;
      }
      const result = await applyTrainingAssignmentDecision({
        clientId,
        clientKind: hasActiveProgram ? "EXISTING" : "NEW",
        decision: {
          ...decision,
          should_replace: Boolean(hasActiveProgram),
        },
        resolver,
        context,
        contextFingerprint,
      });
      setActionMessage(
        result.assigned
          ? `تم التعيين التلقائي: ${decision.recommended_template_slug ?? decision.recommended_template_id}`
          : decision.reason_summary,
      );
      await queryClient.invalidateQueries({ queryKey: ["client-training-assignment-review", clientId] });
      onAssigned?.();
    } catch (err) {
      console.error(err);
      setActionError(err instanceof Error ? err.message : "تعذر التعيين التلقائي.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminCard className="cc-assign-card">
      <div className="cc-assign-card__head">
        <div className="cc-assign-card__title-wrap">
          <h2 className="cc-assign-card__title">مركز تحكم التعيين</h2>
          {state ? <AdminStatusBadge tone={tone}>{LABELS[state] ?? state}</AdminStatusBadge> : null}
        </div>
        <div className="cc-assign-card__actions">
          <button
            type="button"
            className="cc-btn cc-btn--primary cc-btn--compact"
            disabled={busy || coachManaged}
            onClick={() => void runAutoAssign()}
          >
            {busy ? "جاري التعيين…" : hasActiveProgram ? "إعادة التعيين التلقائي" : "تعيين تلقائي الآن"}
          </button>
          <Link to="/admin/notifications" className="cc-btn cc-btn--compact">
            صندوق المراجعات
          </Link>
          <Link to="/admin/programs" className="cc-btn cc-btn--ghost cc-btn--compact">
            مكتبة القوالب
          </Link>
        </div>
      </div>
      <p className="cc-assign-card__hint">
        النظام يعيّن أفضل قالب منشور مناسب لهدف العميل تلقائياً بدون انتظار المدرب. الإدارة اليدوية تبقى متاحة عند الحاجة.
      </p>
      {actionMessage ? (
        <p className="cc-assign-card__hint" role="status">
          {actionMessage}
        </p>
      ) : null}
      {actionError ? (
        <p className="cc-field__error" role="alert">
          {actionError}
        </p>
      ) : null}
      <dl className="cc-assign-card__meta">
        {items.map((item) => (
          <div key={item.label} className={item.wide ? "cc-assign-card__item is-wide" : "cc-assign-card__item"}>
            <dt>{item.label}</dt>
            <dd title={item.value}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </AdminCard>
  );
}
