import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  fetchAdminPspPayments,
  type AdminPspPaymentRow,
} from "@/lib/admin/admin-billing-ops-api";
import { AdminEmptyState, AdminErrorState, AdminTable } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { getMembershipTierLabel, type MembershipTier } from "@/lib/platform/membership";
import { formatBillingDate, paymentHistoryStatusLabel } from "@/lib/payments/billing-present";

export function AdminPspPaymentsPanel() {
  const [rows, setRows] = useState<AdminPspPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchAdminPspPayments());
    } catch (err) {
      console.error(err);
      setError("تعذر جلب مدفوعات PSP.");
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
        title="لا توجد مدفوعات PSP بعد"
        body="مسار الاشتراك الرقمي عبر المزود سيظهر هنا. التحويلات البنكية Legacy في تبويب منفصل."
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
      <AdminTable>
        <thead>
          <tr>
            <th>العضو</th>
            <th>الباقة</th>
            <th>المدة</th>
            <th>المبلغ</th>
            <th>الحالة</th>
            <th>المزود</th>
            <th>التاريخ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.email || row.userId}</td>
              <td>{row.tier ? getMembershipTierLabel(row.tier as MembershipTier) : "—"}</td>
              <td>{row.billingPeriodMonths ? `${row.billingPeriodMonths} أشهر` : "—"}</td>
              <td>
                {row.amount} {row.currency}
              </td>
              <td>{paymentHistoryStatusLabel(row.status)}</td>
              <td>{row.provider || "—"}</td>
              <td>{formatBillingDate(row.paidAt ?? row.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
