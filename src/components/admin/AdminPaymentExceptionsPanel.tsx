import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  exceptionTypeLabel,
  fetchAdminPaymentExceptions,
  type AdminPaymentExceptionRow,
} from "@/lib/admin/admin-billing-ops-api";
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
        title="لا توجد استثناءات تشغيلية"
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
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.exceptionId} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black">{row.subjectLabel}</p>
                <p className="text-xs text-muted-foreground">{exceptionTypeLabel(row.exceptionType)}</p>
                <p className="mt-1 text-xs">{row.detail}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{formatBillingDate(row.occurredAt)}</p>
              </div>
              <a href={row.href} className="cc-btn cc-btn--primary text-xs">
                معالجة
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
