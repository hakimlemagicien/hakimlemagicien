import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import {
  fetchAdminPspPayments,
  type AdminPspPaymentRow,
} from "@/lib/admin/admin-billing-ops-api";
import { providerDisplayLabel } from "@/lib/admin/admin-billing-ops-surfaces";
import { AdminEmptyState, AdminErrorState, AdminTable } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { getMembershipTierLabel, type MembershipTier } from "@/lib/platform/membership";
import { formatBillingDate, paymentHistoryStatusLabel } from "@/lib/payments/billing-present";
import { getPaymentProviderAvailability } from "@/lib/payments/provider-registry";

export function AdminPspPaymentsPanel() {
  const [rows, setRows] = useState<AdminPspPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const providerAvailable = getPaymentProviderAvailability().available;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchAdminPspPayments());
    } catch (err) {
      console.error(err);
      setError("تعذر تحميل بيانات المدفوعات.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <AdminSkeletonRows rows={6} />;
  if (error) return <AdminErrorState message={error} onRetry={() => void load()} />;

  if (rows.length === 0) {
    return (
      <AdminEmptyState
        title={providerAvailable ? "لا توجد مدفوعات PSP بعد" : "ستظهر معاملات مزود الدفع هنا بعد ربطه."}
        body="مسار الاشتراك الرقمي عبر المزود منفصل عن التحويلات البنكية Legacy."
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
      <AdminTable className="cc-table-wrap--desktop">
        <thead>
          <tr>
            <th>العميل</th>
            <th>الباقة</th>
            <th>المدة</th>
            <th>المبلغ</th>
            <th>الحالة</th>
            <th>المزود</th>
            <th>التاريخ</th>
            <th>إجراء</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.email || row.userId}</td>
              <td>{row.tier ? getMembershipTierLabel(row.tier as MembershipTier) : "—"}</td>
              <td>{row.billingPeriodMonths ? `${row.billingPeriodMonths} أشهر` : "—"}</td>
              <td dir="ltr" style={{ textAlign: "right" }}>
                {row.amount} {row.currency}
              </td>
              <td>{paymentHistoryStatusLabel(row.status)}</td>
              <td>{providerDisplayLabel(row.provider, providerAvailable)}</td>
              <td>{formatBillingDate(row.paidAt ?? row.createdAt)}</td>
              <td>
                <Link
                  to="/admin/clients/$clientId"
                  params={{ clientId: row.userId }}
                  search={{ tab: "membership" }}
                  className="cc-btn cc-btn--compact"
                >
                  فتح العميل
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>

      <div className="cc-mobile-cards">
        {rows.map((row) => (
          <article key={row.id} className="cc-ops-card">
            <strong>{row.email || row.userId}</strong>
            <p className="cc-meta">
              {row.tier ? getMembershipTierLabel(row.tier as MembershipTier) : "—"} ·{" "}
              {paymentHistoryStatusLabel(row.status)}
            </p>
            <p dir="ltr" style={{ textAlign: "right" }}>
              {row.amount} {row.currency}
            </p>
            <Link
              to="/admin/clients/$clientId"
              params={{ clientId: row.userId }}
              search={{ tab: "membership" }}
              className="cc-btn cc-btn--primary cc-btn--compact"
            >
              فتح العميل
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
