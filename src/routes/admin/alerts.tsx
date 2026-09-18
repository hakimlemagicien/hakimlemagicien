import { createFileRoute } from "@tanstack/react-router";
import { AlertOctagon, AlertTriangle, ArrowUpLeft, CircleCheck, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminErrorState, AdminPageHeader, AdminStatusBadge } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { listOperationalAlerts, type OperationalAlert } from "@/lib/admin/admin-command-center-api";

export const Route = createFileRoute("/admin/alerts")({
  ssr: false,
  head: () => ({ meta: [{ title: "المشاكل والتنبيهات | مركز التشغيل" }] }),
  component: AlertsCenter,
});

const CATEGORY_LABELS: Record<string, string> = {
  program_missing: "برنامج مفقود",
  nutrition_missing: "تغذية مفقودة",
  assignment_failed: "فشل تعيين",
  promotion_configuration: "إعداد عرض",
  mapping_missing: "خريطة مفقودة",
  payment_issue: "مشكلة دفع",
  missing_media: "وسائط مفقودة",
};

function AlertsCenter() {
  const [rows, setRows] = useState<OperationalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "critical" | "important">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listOperationalAlerts());
    } catch (cause) {
      console.error(cause);
      setError("تعذر تحميل التنبيهات التشغيلية.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => void load(), [load]);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((row) => row.severity === filter)),
    [filter, rows],
  );
  const critical = rows.filter((row) => row.severity === "critical").length;
  const important = rows.filter((row) => row.severity === "important").length;

  return (
    <>
      <AdminPageHeader
        kicker="P0"
        title="المشاكل والتنبيهات"
        subtitle="كل مشكلة تقود مباشرة إلى شاشة الإصلاح المناسبة، بدون أرقام أو حالات مصطنعة."
        actions={
          <button type="button" className="cc-btn" onClick={() => void load()}>
            <RefreshCw size={16} /> تحديث
          </button>
        }
      />
      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? <AdminSkeletonRows rows={7} /> : null}
      {!loading && !error ? (
        <div className="cc-ops-stack">
          <div className="cc-command-metrics">
            <article className="is-critical">
              <AlertOctagon />
              <span>حرجة</span>
              <strong>{critical}</strong>
            </article>
            <article className="is-important">
              <AlertTriangle />
              <span>مهمة</span>
              <strong>{important}</strong>
            </article>
            <article>
              <CircleCheck />
              <span>المجموع</span>
              <strong>{rows.length}</strong>
            </article>
          </div>
          <div className="cc-seg" role="tablist" aria-label="تصفية التنبيهات">
            {(
              [
                ["all", "الكل"],
                ["critical", "حرجة"],
                ["important", "مهمة"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={filter === id}
                className={filter === id ? "is-active" : undefined}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <section className="cc-command-section">
            <div className="cc-alert-list">
              {visible.length ? (
                visible.map((row) => (
                  <article key={row.id} className={`cc-alert-row cc-alert-row--${row.severity}`}>
                    <div className="cc-alert-row__icon">
                      {row.severity === "critical" ? <AlertOctagon /> : <AlertTriangle />}
                    </div>
                    <div className="cc-alert-row__copy">
                      <div>
                        <strong>{row.title}</strong>
                        <AdminStatusBadge
                          tone={row.severity === "critical" ? "critical" : "review"}
                        >
                          {row.severity === "critical" ? "حرج" : "مهم"}
                        </AdminStatusBadge>
                      </div>
                      <p>{row.client_name || "مشكلة على مستوى النظام"}</p>
                      <small>
                        {CATEGORY_LABELS[row.category] ?? row.category} ·{" "}
                        {new Date(row.created_at).toLocaleString("ar-AE")}
                      </small>
                    </div>
                    <a className="cc-btn cc-btn--primary cc-btn--compact" href={row.deep_link}>
                      إصلاح <ArrowUpLeft size={14} />
                    </a>
                  </article>
                ))
              ) : (
                <div className="cc-alerts-clear">
                  <CircleCheck />
                  <strong>لا توجد مشاكل بهذا الفلتر</strong>
                  <span>سيظهر هنا فقط ما تدعمه بيانات النظام الحالية.</span>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
