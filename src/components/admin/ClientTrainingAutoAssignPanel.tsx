import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AdminCard, AdminStatusBadge } from "@/components/admin/AdminPage";
import { supabase } from "@/integrations/supabase/client";
import type { TrainingAssignmentDecisionState } from "@/lib/platform/training-auto-assign";

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
  if (error) throw error;
  return data ?? null;
}

export function ClientTrainingAutoAssignPanel({
  clientId,
  activeTemplateSlug,
  assignmentVersion,
  progressionStrategy,
  assignmentSourceLabel,
}: {
  clientId: string;
  activeTemplateSlug?: string | null;
  assignmentVersion?: number | null;
  progressionStrategy?: string | null;
  assignmentSourceLabel?: string | null;
}) {
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

  return (
    <AdminCard>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="cc-section__title" style={{ margin: 0 }}>
          مركز تحكم التعيين
        </h2>
        {state ? <AdminStatusBadge tone={tone}>{LABELS[state] ?? state}</AdminStatusBadge> : null}
      </div>
      <p className="cc-muted">
        تغيير قالب العميل يتم عبر التعيين/إعادة التعيين/تدخل المدرب فقط — بدون Deploy. القالب الرئيسي لا يغيّر
        اللقطات التاريخية.
      </p>
      <dl className="cc-dl">
        <div>
          <dt>القالب النشط</dt>
          <dd>{activeTemplateSlug || "—"}</dd>
        </div>
        <div>
          <dt>إصدار التعيين</dt>
          <dd>{assignmentVersion ?? "—"}</dd>
        </div>
        <div>
          <dt>مصدر التعيين</dt>
          <dd>{assignmentSourceLabel || review?.assignment_source || "—"}</dd>
        </div>
        <div>
          <dt>حالة Auto / Override</dt>
          <dd>{coachManaged ? "COACH_OVERRIDE_ACTIVE (محمي)" : state ? LABELS[state] ?? state : "—"}</dd>
        </div>
        <div>
          <dt>القالب السابق (آخر قرار)</dt>
          <dd>{review?.previous_template_slug ?? "—"}</dd>
        </div>
        <div>
          <dt>الموصى به</dt>
          <dd>{review?.recommended_template_slug ?? "—"}</dd>
        </div>
        <div>
          <dt>المعيَّن (آخر قرار)</dt>
          <dd>{review?.assigned_template_slug ?? "—"}</dd>
        </div>
        <div>
          <dt>سبب التوصية</dt>
          <dd>{review?.reason_summary ?? review?.reason_code ?? "—"}</dd>
        </div>
        <div>
          <dt>ملخص Resolver</dt>
          <dd className="text-xs">
            {review?.resolver_trace
              ? `${String(review.resolver_trace.status ?? "—")} · ${String(review.resolver_trace.compatibility_status ?? "—")}`
              : "—"}
          </dd>
        </div>
        <div>
          <dt>تاريخ السريان</dt>
          <dd>{review?.effective_at ? new Date(review.effective_at).toLocaleString("ar") : "—"}</dd>
        </div>
        <div>
          <dt>مراجعة الأدمن</dt>
          <dd>{review ? (review.is_reviewed ? "تمت المراجعة" : "غير مراجعة") : "لا إشعار بعد"}</dd>
        </div>
      </dl>
      <div className="cc-row-actions" style={{ marginTop: 12 }}>
        <Link to="/admin/notifications" className="cc-btn">
          صندوق المراجعات
        </Link>
        <Link to="/admin/programs" className="cc-btn cc-btn--ghost">
          مكتبة القوالب
        </Link>
      </div>
    </AdminCard>
  );
}
