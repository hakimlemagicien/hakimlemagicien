import { Link } from "@tanstack/react-router";
import type { DashboardQuickStatusMetric } from "@/lib/admin/admin-dashboard";

type Props = {
  metrics: DashboardQuickStatusMetric[];
  loading?: boolean;
};

export function DashboardQuickStatus({ metrics, loading }: Props) {
  if (loading) {
    return (
      <div className="cc-kpi-grid" aria-busy="true" aria-label="جاري تحميل الملخص">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="cc-kpi-card cc-kpi-card--skeleton" />
        ))}
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <p className="cc-muted">لا توجد مقاييس موثوقة متاحة حالياً.</p>
    );
  }

  return (
    <div className="cc-kpi-grid" aria-label="ملخص سريع">
      {metrics.map((metric) => {
        const body = (
          <>
            <span className="cc-kpi-card__value">{metric.value.toLocaleString("ar-AE")}</span>
            <span className="cc-kpi-card__label">{metric.label}</span>
            <span className="cc-kpi-card__hint">{metric.hint}</span>
          </>
        );
        if (metric.href) {
          const useAnchor = metric.href.includes("#");
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
              className={["cc-kpi-card", `cc-kpi-card--${metric.tone}`].join(" ")}
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
