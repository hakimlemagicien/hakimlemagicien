import { Link } from "@tanstack/react-router";
import { MoreHorizontal, StickyNote } from "lucide-react";
import type { AdminClientOverview } from "@/lib/admin/admin-clients-api";
import { presentClientTrainingGoal } from "@/lib/admin/admin-client-goal";
import { AdminClientAvatar } from "@/components/admin/AdminClientAvatar";
import { AdminStatusBadge } from "@/components/admin/AdminPage";
import { formatAdminDate } from "@/lib/admin/admin-status";
import {
  clientAccountStatusLabel,
  clientAccountStatusTone,
  normalizeClientAccountStatus,
} from "@/lib/admin/admin-client-account";
import { directoryPlanLabelAr, directoryPlanTone, trainingLocationLabel } from "@/lib/admin/admin-client-ops";

type Props = {
  overview: AdminClientOverview;
  conversationId?: string | null;
  onAddNote?: () => void;
};

export function Client360Header({ overview, conversationId, onAddNote }: Props) {
  const account = normalizeClientAccountStatus(overview.account_status);
  const plan = overview.membership?.tier;

  return (
    <header className="cc-client-hero cc-client-hero--a4">
      <AdminClientAvatar name={overview.full_name} avatarPath={overview.avatar_path} size="lg" />
      <div className="cc-client-hero__text">
        <h2>{overview.full_name || "بدون اسم"}</h2>
        <p>{overview.email || overview.phone || "بدون بريد"}</p>
        <p>
          {presentClientTrainingGoal(overview.goal).displayAr} · {trainingLocationLabel(overview.training_type)} · انضم{" "}
          {formatAdminDate(overview.created_at)}
        </p>
        <div className="cc-client-hero__badges">
          <AdminStatusBadge tone={clientAccountStatusTone(account)}>
            {clientAccountStatusLabel(account)}
          </AdminStatusBadge>
          {plan ? (
            <AdminStatusBadge tone={directoryPlanTone(plan)}>{directoryPlanLabelAr(plan)}</AdminStatusBadge>
          ) : null}
        </div>
      </div>
      <div className="cc-client-hero__actions">
        {onAddNote ? (
          <button type="button" className="cc-btn cc-btn--primary" onClick={onAddNote}>
            <StickyNote size={15} aria-hidden />
            إضافة ملاحظة
          </button>
        ) : (
          <Link
            to="/admin/clients/$clientId"
            params={{ clientId: overview.id }}
            search={{ tab: "notes" }}
            className="cc-btn cc-btn--primary"
          >
            إضافة ملاحظة
          </Link>
        )}
        {conversationId ? (
          <Link
            to="/admin/messages/$conversationId"
            params={{ conversationId }}
            className="cc-btn"
          >
            إرسال رسالة
          </Link>
        ) : null}
        <details className="cc-row-menu">
          <summary className="cc-row-menu__trigger" aria-label="المزيد">
            <MoreHorizontal size={16} aria-hidden />
          </summary>
          <div className="cc-row-menu__panel">
            <Link to="/admin/clients/$clientId" params={{ clientId: overview.id }} search={{ tab: "training" }}>
              التدريب
            </Link>
            <Link to="/admin/clients/$clientId" params={{ clientId: overview.id }} search={{ tab: "nutrition" }}>
              التغذية
            </Link>
            <Link to="/admin/clients/$clientId" params={{ clientId: overview.id }} search={{ tab: "membership" }}>
              العضوية والفوترة
            </Link>
            <Link to="/admin/clients/$clientId" params={{ clientId: overview.id }} search={{ tab: "activity" }}>
              النشاط
            </Link>
            {conversationId ? (
              <Link to="/admin/messages/$conversationId" params={{ conversationId }}>
                إرسال رسالة
              </Link>
            ) : (
              <span className="cc-muted">لا محادثة تدريب مسجّلة</span>
            )}
          </div>
        </details>
      </div>
    </header>
  );
}
