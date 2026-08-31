import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  exceptionSeverityLabel,
  exceptionTypeLabel,
  fetchAdminPaymentExceptions,
  formatExceptionAge,
  type AdminPaymentExceptionRow,
} from "@/lib/admin/admin-billing-ops-api";
import { exceptionRecommendedAction } from "@/lib/admin/admin-billing-ops-surfaces";
import { AdminEmptyState, AdminErrorState } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { formatBillingDate } from "@/lib/payments/billing-present";

export function AdminPaymentExceptionsPanel() {
  const [rows, setRows] = useState<AdminPaymentExceptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchAdminPaymentExceptions());
    } catch (err) {
      console.error(err);
      setError("تعذر جلب طابور الاستثناءات.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <AdminSkeletonRows rows={5} />;
  if (error) return <AdminErrorState message={error} onRetry={() => void load()} />;

  if (rows.length === 0) {
    return (
      <AdminEmptyState
        title="لا توجد استثناءات دفع تحتاج مراجعتك."
        body="يُعرض هنا فقط ما يأتي من بيانات حقيقية: تحويلات بنكية معلقة، تأخر اشتراك، أحداث مزود فاشلة، وغيرها."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button type="button" className="cc-btn" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" />
          تحديث
        </button>
      </div>
      <ul className="cc-billing-exception-list">
        {rows.map((row) => (
          <li key={row.exceptionId} className="cc-billing-exception-card">
            <div className="cc-billing-exception-card__main">
              <p className="cc-billing-exception-card__client">{row.subjectLabel}</p>
              <p className="cc-billing-exception-card__type">{exceptionTypeLabel(row.exceptionType)}</p>
              <p className="cc-billing-exception-card__reason">{row.detail}</p>
              <div className="cc-billing-exception-card__meta">
                <span>الأولوية: {exceptionSeverityLabel(row.priority)}</span>
                <span>{formatExceptionAge(row.occurredAt)}</span>
                <span>{formatBillingDate(row.occurredAt)}</span>
              </div>
              <p className="cc-billing-exception-card__action">
                الإجراء المقترح: {exceptionRecommendedAction(row.exceptionType)}
              </p>
            </div>
            {row.href.startsWith("/admin/clients/") ? (
              <a href={row.href} className="cc-btn cc-btn--primary cc-btn--compact">
                فتح العميل
              </a>
            ) : (
              <a href={row.href} className="cc-btn cc-btn--primary cc-btn--compact">
                {row.href.includes("legacy") ? "مراجعة Legacy" : "معالجة"}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
