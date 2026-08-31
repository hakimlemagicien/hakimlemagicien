import { Link } from "@tanstack/react-router";
import { AdminCard, AdminEmptyState, AdminPriorityBadge } from "@/components/admin/AdminPage";
import type { ClientAttentionAlert } from "@/lib/admin/admin-client-ops";

type Props = {
  alerts: ClientAttentionAlert[];
};

export function ClientAttentionAlerts({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <AdminCard className="cc-client-attention-empty">
        <p className="cc-muted">كل شيء تحت السيطرة — لا توجد حالات تتطلب تدخلك حاليًا.</p>
      </AdminCard>
    );
  }

  return (
    <ul className="cc-client-attention-list">
      {alerts.map((alert) => (
        <li key={alert.id}>
          <AdminCard className="cc-client-attention-item">
            <div className="cc-client-attention-item__head">
              <strong>{alert.title}</strong>
              <AdminPriorityBadge priority={alert.priority} />
            </div>
            <p className="cc-muted">{alert.reason}</p>
            <a href={alert.href} className="cc-btn cc-btn--ghost cc-btn--compact">
              {alert.actionLabel}
            </a>
          </AdminCard>
        </li>
      ))}
    </ul>
  );
}
