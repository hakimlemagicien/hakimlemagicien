import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import {
  fetchAdminMemberSubscriptions,
  subscriptionStatusLabel,
  type AdminMemberSubscriptionRow,
} from "@/lib/admin/admin-billing-ops-api";
import { AdminEmptyState, AdminErrorState, AdminPageHeader, AdminTable } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { getMembershipTierLabel, type MembershipTier } from "@/lib/platform/membership";
import { formatBillingDate } from "@/lib/payments/billing-present";

export function AdminMembershipsPage() {
  const [rows, setRows] = useState<AdminMemberSubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminMemberSubscriptions({ search });
      setRows(data);
    } catch (err) {
      console.error(err);
      setError("تعذر جلب العضويات. تأكد من تطبيق migration P6 على Staging.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <AdminPageHeader
        kicker="الأعمال"
        title="العضويات"
        subtitle="رؤية تشغيلية للاشتراكات — قراءة فقط. لا تعديل يدوي لحقيقة الدفع."
        actions={
          <button type="button" onClick={() => void load()} disabled={loading} className="cc-btn">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        }
      />

      <div className="cc-toolbar">
        <input
          type="search"
          className="cc-input"
          placeholder="بحث بالبريد أو الاسم أو الباقة"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void load();
          }}
        />
        <button type="button" className="cc-btn" onClick={() => void load()}>
          بحث
        </button>
      </div>

      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? <AdminSkeletonRows rows={8} /> : null}

      {!loading && rows.length === 0 ? (
        <AdminEmptyState
          title="لا توجد عضويات مدفوعة"
          body="عند تفعيل اشتراكات Essential/Premium/VIP الداخلية ستظهر هنا مع حالتها التشغيلية."
        />
      ) : null}

      {!loading && rows.length > 0 ? (
        <AdminTable className="cc-table-wrap--desktop">
          <thead>
            <tr>
              <th>العضو</th>
              <th>الباقة</th>
              <th>الحالة</th>
              <th>المدة</th>
              <th>تجديد تلقائي</th>
              <th>نهاية الفترة</th>
              <th>المزود</th>
              <th>آخر دفعة</th>
              <th>استثناء</th>
              <th>ملف</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId}>
                <td>
                  <div className="font-bold">{row.fullName || "—"}</div>
                  <div className="text-xs text-muted-foreground">{row.email || row.userId}</div>
                </td>
                <td>{getMembershipTierLabel(row.tier as MembershipTier)}</td>
                <td>{subscriptionStatusLabel(row.subscriptionStatus)}</td>
                <td>{row.billingPeriodMonths ? `${row.billingPeriodMonths} أشهر` : "—"}</td>
                <td>{row.autoRenew && !row.cancelAtPeriodEnd ? "نعم" : "لا"}</td>
                <td>{formatBillingDate(row.currentPeriodEnd ?? row.paidPeriodEnd)}</td>
                <td>{row.provider || "—"}</td>
                <td>
                  <div>{row.lastPaymentStatus || "—"}</div>
                  <div className="text-xs text-muted-foreground">{formatBillingDate(row.lastPaymentAt)}</div>
                </td>
                <td>{row.exceptionState || "—"}</td>
                <td>
                  <Link to="/admin/clients/$clientId" params={{ clientId: row.userId }} className="cc-link">
                    فتح
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      ) : null}
    </>
  );
}
