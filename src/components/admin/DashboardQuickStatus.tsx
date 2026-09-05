import { Link } from "@tanstack/react-router";
import { AlertCircle, Bell, CreditCard, MessageSquare, Users } from "lucide-react";
import type { DashboardKpiIcon, DashboardQuickStatusMetric } from "@/lib/admin/admin-dashboard";

type Props = {
  metrics: DashboardQuickStatusMetric[];
  loading?: boolean;
};

const KPI_ICONS: Record<DashboardKpiIcon, typeof Users> = {
  users: Users,
  messages: MessageSquare,
  subscriptions: CreditCard,
  payments: AlertCircle,
  attention: Bell,
};

function KpiIcon({ icon, tone }: { icon: DashboardKpiIcon; tone: DashboardQuickStatusMetric["tone"] }) {
  const Icon = KPI_ICONS[icon];
  return (
    <span className={["cc-kpi-card__icon", `cc-kpi-card__icon--${tone}`].join(" ")} aria-hidden>
      <Icon className="h-5 w-5" />
    </span>
  );
}

export function DashboardQuickStatus({ metrics, loading }: Props) {
  if (loading) {
    return (
      <div className="cc-kpi-grid" aria-busy="true" aria-label="جاري تحميل الملخص">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="cc-kpi-card cc-kpi-card--skeleton" />
        ))}
      </div>
    );
  }

  if (metrics.length === 0) {
    return <p className="cc-muted">لا توجد مقاييس موثوقة متاحة حالياً.</p>;
  }

  return (
    <div className="cc-kpi-grid" aria-label="ملخص سريع">
      {metrics.map((metric) => {
        const body = (
          <>
            <KpiIcon icon={metric.icon} tone={metric.tone} />
            <span className="cc-kpi-card__label">{metric.label}</span>
            <span className="cc-kpi-card__value">{metric.value.toLocaleString("ar-AE")}</span>
            <span className="cc-kpi-card__hint">
              {metric.value === 0 && metric.zeroHint ? metric.zeroHint : metric.hint}
            </span>
          </>
        );
        if (metric.href) {
          const useAnchor = metric.href.includes("#") || metric.href.includes("?");
          if (useAnchor) {
            return (
              <a
                key={metric.id}
                href={metric.href}
                className={["cc-kpi-card", `cc-kpi-card--${metric.tone}`].join(" ")}
              >
                {body}
              </a>
            );
          }
          return (
            <Link
              key={metric.id}
              to={metric.href}
              preload={false}
              className={["cc-kpi-card", `cc-kpi-card--${metric.tone}`, `cc-kpi-card--${metric.id}`].join(" ")}
            >
              {body}
            </Link>
          );
        }
        return (
          <div key={metric.id} className={["cc-kpi-card", `cc-kpi-card--${metric.tone}`].join(" ")}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
