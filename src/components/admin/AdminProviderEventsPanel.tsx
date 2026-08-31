import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import {
  fetchAdminProviderEvents,
  type AdminProviderEventRow,
} from "@/lib/admin/admin-billing-ops-api";
import { providerDisplayLabel } from "@/lib/admin/admin-billing-ops-surfaces";
import { AdminEmptyState, AdminErrorState, AdminTable } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { formatBillingDate } from "@/lib/payments/billing-present";
import { getPaymentProviderAvailability } from "@/lib/payments/provider-registry";

const STATUS_OPTIONS = ["", "received", "processing", "processed", "failed", "skipped"] as const;

export function AdminProviderEventsPanel() {
  const [rows, setRows] = useState<AdminProviderEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const providerAvailable = getPaymentProviderAvailability().available;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchAdminProviderEvents({ status: status || undefined }));
    } catch (err) {
      console.error(err);
      setError("تعذر جلب أحداث المزود.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-3">
      <div className="cc-toolbar">
        <select className="cc-input" value={status} onChange={(event) => setStatus(event.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option || "all"} value={option}>
              {option || "كل الحالات"}
            </option>
          ))}
        </select>
        <button type="button" className="cc-btn" onClick={() => void load()}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      {loading ? <AdminSkeletonRows rows={5} /> : null}
      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}

      {!loading && !error && rows.length === 0 ? (
        <AdminEmptyState
          title="لا توجد أحداث مزود مسجلة."
          body={
            providerAvailable
              ? "عند ربط Webhook لاحقاً ستظهر هنا الحالات التشغيلية دون عرض payload حساس."
              : "ستظهر أحداث المزود هنا بعد ربط مزود الدفع."
          }
        />
      ) : null}

      {!loading && rows.length > 0 ? (
        <AdminTable>
          <thead>
            <tr>
              <th>المزود</th>
              <th>نوع الحدث</th>
              <th>الحالة</th>
              <th>العضو</th>
              <th>استُلم</th>
              <th>عُولج</th>
              <th>خطأ</th>
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{providerDisplayLabel(row.provider, providerAvailable)}</td>
                <td>{row.eventType}</td>
                <td>{row.processingStatus}</td>
                <td>{row.email || row.userId || "—"}</td>
                <td>{formatBillingDate(row.receivedAt)}</td>
                <td>{formatBillingDate(row.processedAt)}</td>
                <td className="max-w-[200px] truncate">{row.errorSummary || row.errorCode || "—"}</td>
                <td>
                  {row.userId ? (
                    <Link
                      to="/admin/clients/$clientId"
                      params={{ clientId: row.userId }}
                      search={{ tab: "membership" }}
                      className="cc-btn cc-btn--compact"
                    >
                      فتح العميل
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      ) : null}
    </div>
  );
}
