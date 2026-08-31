import { Link } from "@tanstack/react-router";
import type { AdminClientOverview } from "@/lib/admin/admin-clients-api";
import { trainingLocationLabel } from "@/lib/admin/admin-client-ops";
import { AdminStatusBadge } from "@/components/admin/AdminPage";
import {
  formatAdminDate,
  formatRelativeAge,
  onboardingStatus,
  personInitials,
  planLabel,
  planStatusKind,
} from "@/lib/admin/admin-status";

type Props = {
  overview: AdminClientOverview;
  conversationId?: string | null;
  onAddNote?: () => void;
};

export function Client360Header({ overview, conversationId, onAddNote }: Props) {
  const status = onboardingStatus(overview.onboarding_completed_at);
  const lastActivity =
    overview.last_workout_at || overview.last_nutrition_at || overview.coaching?.last_message_at;

  return (
    <header className="cc-client-hero cc-client-hero--a4">
      <span className="cc-avatar cc-avatar--lg" aria-hidden>
        {personInitials(overview.full_name)}
      </span>
      <div className="cc-client-hero__text">
        <h2>{overview.full_name || "بدون اسم"}</h2>
        <p>{overview.email || overview.phone || "بدون بريد"}</p>
        <p>
          {overview.goal || "الهدف غير محدد"} · {trainingLocationLabel(overview.training_type)} · انضم{" "}
          {formatAdminDate(overview.created_at)}
        </p>
        <div className="cc-client-hero__badges">
          <AdminStatusBadge tone={status.kind}>{status.label}</AdminStatusBadge>
          {overview.membership?.tier ? (
            <AdminStatusBadge tone={planStatusKind(overview.membership.tier)}>
              {planLabel(overview.membership.tier)}
              {overview.membership.is_active ? "" : " — غير نشطة"}
            </AdminStatusBadge>
          ) : null}
          {lastActivity ? (
            <span className="cc-meta">آخر نشاط {formatRelativeAge(lastActivity)}</span>
          ) : null}
        </div>
      </div>
      <div className="cc-client-hero__actions">
        {conversationId ? (
          <Link
            to="/admin/messages/$conversationId"
            params={{ conversationId }}
            className="cc-btn cc-btn--primary"
          >
            إرسال رسالة
          </Link>
        ) : (
          <span className="cc-muted">لا محادثة تدريب مسجّلة</span>
        )}
        {onAddNote ? (
          <button type="button" className="cc-btn" onClick={onAddNote}>
            إضافة ملاحظة
          </button>
        ) : (
          <Link
            to="/admin/clients/$clientId"
            params={{ clientId: overview.id }}
            search={{ tab: "notes" }}
            className="cc-btn"
          >
            إضافة ملاحظة
          </Link>
        )}
      </div>
    </header>
  );
}
