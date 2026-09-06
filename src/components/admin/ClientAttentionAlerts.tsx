import { Link } from "@tanstack/react-router";
import { Dumbbell, MessageCircle, LifeBuoy, Target, Utensils, CreditCard } from "lucide-react";
import { AdminPriorityBadge } from "@/components/admin/AdminPage";
import type { ClientAttentionAlert } from "@/lib/admin/admin-client-ops";
import { normalizeClient360Tab } from "@/lib/admin/admin-architecture";

type Props = {
  alerts: ClientAttentionAlert[];
};

function alertIcon(id: string) {
  if (id.startsWith("training")) return Dumbbell;
  if (id.startsWith("nutrition")) return Utensils;
  if (id.startsWith("membership")) return CreditCard;
  if (id.startsWith("coaching")) return MessageCircle;
  if (id.startsWith("support")) return LifeBuoy;
  if (id.includes("goal")) return Target;
  return MessageCircle;
}

function AlertAction({ alert }: { alert: ClientAttentionAlert }) {
  const className = "cc-btn cc-btn--outline cc-btn--compact";
  const clientTab = alert.href.match(/^\/admin\/clients\/([^/?]+)\?tab=([a-z]+)$/);
  if (clientTab) {
    return (
      <Link
        to="/admin/clients/$clientId"
        params={{ clientId: clientTab[1] }}
        search={{ tab: normalizeClient360Tab(clientTab[2]) }}
        className={className}
      >
        {alert.actionLabel}
      </Link>
    );
  }
  const message = alert.href.match(/^\/admin\/messages\/([^/?]+)$/);
  if (message) {
    return (
      <Link to="/admin/messages/$conversationId" params={{ conversationId: message[1] }} className={className}>
        {alert.actionLabel}
      </Link>
    );
  }
  if (alert.href.startsWith("/admin/messages")) {
    return (
      <Link to="/admin/messages" className={className}>
        {alert.actionLabel}
      </Link>
    );
  }
  if (alert.href.startsWith("/admin/support")) {
    return (
      <Link to="/admin/support" className={className}>
        {alert.actionLabel}
      </Link>
    );
  }
  return (
    <a href={alert.href} className={className}>
      {alert.actionLabel}
    </a>
  );
}

export function ClientAttentionAlerts({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="cc-client-attention-empty">
        <p className="cc-muted">كل شيء تحت السيطرة — لا توجد حالات تتطلب تدخلك حاليًا.</p>
      </div>
    );
  }

  return (
    <ul className="cc-client-attention-list">
      {alerts.map((alert) => {
        const Icon = alertIcon(alert.id);
        return (
          <li key={alert.id} className="cc-client-attention-item">
            <span className="cc-client-attention-item__icon" aria-hidden>
              <Icon size={16} />
            </span>
            <div className="cc-client-attention-item__body">
              <div className="cc-client-attention-item__head">
                <strong>{alert.title}</strong>
                <AdminPriorityBadge priority={alert.priority} />
              </div>
              <p className="cc-muted">{alert.reason}</p>
            </div>
            <AlertAction alert={alert} />
          </li>
        );
      })}
    </ul>
  );
}
