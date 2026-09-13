import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AdminCard,
  AdminHonestEmpty,
  AdminPageHeader,
  AdminStatusBadge,
} from "@/components/admin/AdminPage";
import {
  listTrainingAssignmentReviews,
  markTrainingAssignmentReview,
  type TrainingAssignmentReviewRow,
} from "@/lib/platform/training-auto-assign";

const DECISION_LABELS: Record<string, string> = {
  AUTO_ASSIGNED: "تعيين تلقائي",
  AUTO_UPDATED: "تحديث تلقائي",
  NO_CHANGE_REQUIRED: "لا تغيير",
  REVIEW_REQUIRED: "مراجعة مطلوبة",
  COACH_OVERRIDE_ACTIVE: "تدخل مدرب نشط",
  BLOCKED_NO_EXACT_MATCH: "محظور — لا تطابق",
};

function DecisionBadge({ state }: { state: string }) {
  const tone =
    state === "AUTO_ASSIGNED" || state === "AUTO_UPDATED" || state === "NO_CHANGE_REQUIRED"
      ? ("success" as const)
      : state === "REVIEW_REQUIRED" || state === "BLOCKED_NO_EXACT_MATCH"
        ? ("review" as const)
        : ("foundation" as const);
  return <AdminStatusBadge tone={tone}>{DECISION_LABELS[state] ?? state}</AdminStatusBadge>;
}

function needsCoachAction(state: string): boolean {
  return state === "REVIEW_REQUIRED" || state === "BLOCKED_NO_EXACT_MATCH";
}

export function TrainingAssignmentReviewInbox() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"unreviewed" | "all" | "action">("unreviewed");

  const reviewsQuery = useQuery({
    queryKey: ["admin-training-assignment-reviews", filter],
    queryFn: async () => {
      const result = await listTrainingAssignmentReviews({
        reviewed: filter === "all" ? null : false,
        decisionState: null,
        limit: 100,
      });
      if (filter === "action") {
        const rows = result.rows.filter((r) => needsCoachAction(r.decision_state));
        return { rows, totalCount: rows.length };
      }
      return result;
    },
  });

  const markMutation = useMutation({
    mutationFn: (id: string) => markTrainingAssignmentReview({ reviewId: id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-training-assignment-reviews"] });
    },
  });

  const rows = reviewsQuery.data?.rows ?? [];
  const counts = useMemo(() => {
    const unread = rows.filter((r) => !r.is_reviewed).length;
    const action = rows.filter((r) => needsCoachAction(r.decision_state)).length;
    return { unread, action, total: reviewsQuery.data?.totalCount ?? rows.length };
  }, [rows, reviewsQuery.data?.totalCount]);

  return (
    <>
      <AdminPageHeader
        title="مراجعات التعيين التدريبي"
        subtitle="تعيين/تحديث تلقائي = للمراجعة فقط (البرنامج يعمل بدون موافقة). REVIEW/BLOCKED تحتاج تدخل مدرب."
        actions={<AdminStatusBadge tone="live">LIVE</AdminStatusBadge>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <AdminCard>
          <p className="cc-muted text-xs font-bold">غير مراجعة</p>
          <p className="text-2xl font-black">{counts.unread}</p>
        </AdminCard>
        <AdminCard>
          <p className="cc-muted text-xs font-bold">تحتاج تدخل</p>
          <p className="text-2xl font-black">{counts.action}</p>
        </AdminCard>
        <AdminCard>
          <p className="cc-muted text-xs font-bold">المعروضة</p>
          <p className="text-2xl font-black">{counts.total}</p>
        </AdminCard>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["unreviewed", "غير مراجعة"],
            ["action", "تحتاج تدخل"],
            ["all", "الكل"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${
              filter === id ? "border-primary bg-primary/10 text-primary" : "border-border"
            }`}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {reviewsQuery.isLoading ? (
        <p className="cc-muted">جاري التحميل…</p>
      ) : rows.length === 0 ? (
        <AdminHonestEmpty title="لا مراجعات" body="لا توجد عناصر في صندوق المراجعات بهذا الفلتر." />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <ReviewCard
              key={row.id}
              row={row}
              onMark={() => markMutation.mutate(row.id)}
              marking={markMutation.isPending}
            />
          ))}
        </div>
      )}
    </>
  );
}

function ReviewCard({
  row,
  onMark,
  marking,
}: {
  row: TrainingAssignmentReviewRow;
  onMark: () => void;
  marking: boolean;
}) {
  const needsAction = needsCoachAction(row.decision_state);
  const trace = row.resolver_trace ?? {};

  return (
    <AdminCard>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <strong>{row.client_name ?? row.client_id.slice(0, 8)}</strong>
        <DecisionBadge state={row.decision_state} />
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="cc-muted">معرّف العميل</dt>
          <dd className="font-mono text-xs">{row.client_id}</dd>
        </div>
        <div>
          <dt className="cc-muted">النوع</dt>
          <dd>{row.client_kind === "NEW" ? "عميل جديد" : "عميل حالي"}</dd>
        </div>
        <div>
          <dt className="cc-muted">الهدف</dt>
          <dd>
            {row.quiz_goal ?? "—"} → {row.mapped_training_goal ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="cc-muted">المستوى / المكان / الأيام</dt>
          <dd>
            {row.training_level ?? "—"} · {row.training_environment ?? "—"} · {row.days_per_week ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="cc-muted">المعدات</dt>
          <dd>{row.equipment_summary || "—"}</dd>
        </div>
        <div>
          <dt className="cc-muted">السبب</dt>
          <dd>{row.reason_summary ?? row.reason_code ?? "—"}</dd>
        </div>
        <div>
          <dt className="cc-muted">القالب السابق</dt>
          <dd>{row.previous_template_slug ?? "—"}</dd>
        </div>
        <div>
          <dt className="cc-muted">موصى / معيّن</dt>
          <dd>
            {row.recommended_template_slug ?? "—"} / {row.assigned_template_slug ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="cc-muted">ملخص Resolver</dt>
          <dd className="text-xs">
            {String(trace.status ?? "—")}
            {trace.compatibility_status ? ` · ${String(trace.compatibility_status)}` : ""}
            {trace.fallback_class ? ` · ${String(trace.fallback_class)}` : ""}
          </dd>
        </div>
        <div>
          <dt className="cc-muted">الوقت</dt>
          <dd>{new Date(row.created_at).toLocaleString("ar")}</dd>
        </div>
        <div>
          <dt className="cc-muted">الحالة</dt>
          <dd>
            {row.is_reviewed ? "تمت المراجعة" : "غير مراجعة"}
            {row.is_read ? " · مقروء" : " · غير مقروء"}
            {needsAction ? " · يحتاج تدخل" : " · للمراجعة فقط"}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to="/admin/clients/$clientId"
          params={{ clientId: row.client_id }}
          search={{ tab: "training" } as never}
          className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold"
        >
          عرض العميل
        </Link>
        {row.recommended_template_id ? (
          <Link
            to="/admin/programs"
            search={{ template: row.recommended_template_id } as never}
            className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold"
          >
            عرض القالب
          </Link>
        ) : null}
        {!row.is_reviewed ? (
          <button
            type="button"
            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
            disabled={marking}
            onClick={onMark}
          >
            تعليم كمراجع
          </button>
        ) : null}
      </div>
    </AdminCard>
  );
}
