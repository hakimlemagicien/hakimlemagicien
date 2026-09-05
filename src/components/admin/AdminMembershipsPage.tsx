import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { BillingOpsSubnav } from "@/components/admin/BillingOpsSubnav";
import { ProviderBindingBanner } from "@/components/admin/ProviderBindingBanner";
import {
  fetchAdminMemberSubscriptions,
  type AdminMemberSubscriptionRow,
} from "@/lib/admin/admin-billing-ops-api";
import {
  AdminConceptKpiRow,
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import {
  filterMembershipRows,
  formatMembershipPlanPrice,
  membershipNeedsAttention,
  membershipPlanLabel,
  providerDisplayLabel,
  resolveMembershipLifecycle,
  type MembershipFilterState,
} from "@/lib/admin/admin-billing-ops-surfaces";
import {
  billingStatusLabel,
  billingStatusTone,
  formatBillingDate,
  paymentHistoryStatusLabel,
} from "@/lib/payments/billing-present";
import { getPaymentProviderAvailability } from "@/lib/payments/provider-registry";

const DEFAULT_FILTERS: MembershipFilterState = {
  plan: "all",
  status: "all",
  needsAttention: false,
  autoRenew: "all",
  provider: "all",
};

function badgeTone(state: ReturnType<typeof resolveMembershipLifecycle>) {
  const tone = billingStatusTone(state);
  if (tone === "warning") return "waiting" as const;
  if (tone === "info") return "review" as const;
  if (tone === "danger") return "danger" as const;
  if (tone === "success") return "success" as const;
  return "neutral" as const;
}

export function AdminMembershipsPage() {
  const [rows, setRows] = useState<AdminMemberSubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<MembershipFilterState>(DEFAULT_FILTERS);
  const providerAvailable = getPaymentProviderAvailability().available;

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

  const filteredRows = useMemo(() => filterMembershipRows(rows, filters), [rows, filters]);
  const activeCount = rows.filter((row) => row.isActive && row.subscriptionStatus === "active").length;
  const attentionCount = rows.filter(membershipNeedsAttention).length;
  const renewalsSoon = rows.filter((row) => {
    const stamp = row.nextRenewalAt || row.currentPeriodEnd;
    if (!stamp) return false;
    const at = new Date(stamp).getTime();
    const now = Date.now();
    return Number.isFinite(at) && at >= now && at <= now + 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <>
      <AdminPageHeader
        kicker="الاشتراكات والمدفوعات"
        title="العضويات والمدفوعات"
        subtitle="إدارة الاشتراكات والتحصيل من البيانات الحقيقية — بدون إيراد شهري مخترع."
        actions={
          <button type="button" onClick={() => void load()} disabled={loading} className="cc-btn">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        }
      />
      <AdminConceptKpiRow
        loading={loading}
        metrics={[
          {
            id: "active",
            label: "اشتراكات نشطة",
            value: activeCount.toLocaleString("ar-AE"),
            hint: "من القائمة المحمّلة",
            tone: activeCount > 0 ? "positive" : "neutral",
          },
          {
            id: "attention",
            label: "تحتاج انتباه",
            value: attentionCount.toLocaleString("ar-AE"),
            hint: "past_due أو إيقاف تجديد",
            tone: attentionCount > 0 ? "attention" : "neutral",
          },
          {
            id: "renewals",
            label: "تجديدات هذا الأسبوع",
            value: renewalsSoon.toLocaleString("ar-AE"),
            hint: "من تاريخ التجديد المسجّل",
          },
          {
            id: "revenue",
            label: "الإيراد الشهري",
            value: "—",
            hint: "لا MRR معتمد في هذه الشاشة",
            tone: "unavailable",
          },
        ]}
      />
      <BillingOpsSubnav />
      <ProviderBindingBanner />

      <div className="cc-toolbar cc-toolbar--wrap">
        <input
          type="search"
          className="cc-input"
          placeholder="بحث بالبريد أو الاسم"
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

      <div className="cc-filter-row" role="group" aria-label="تصفية العضويات">
        <select
          className="cc-input"
          value={filters.plan}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, plan: event.target.value as MembershipFilterState["plan"] }))
          }
        >
          <option value="all">كل الخطط</option>
          <option value="essential">Essential</option>
          <option value="premium">Premium</option>
          <option value="vip">Internal VIP</option>
        </select>
        <select
          className="cc-input"
          value={filters.status}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, status: event.target.value as MembershipFilterState["status"] }))
          }
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="past_due">متأخر</option>
          <option value="cancel_at_period_end">إيقاف تجديد</option>
          <option value="cancelled">ملغى</option>
          <option value="expired">منتهٍ</option>
          <option value="refunded">مسترد</option>
        </select>
        <select
          className="cc-input"
          value={filters.autoRenew}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, autoRenew: event.target.value as MembershipFilterState["autoRenew"] }))
          }
        >
          <option value="all">كل التجديد</option>
          <option value="yes">تجديد تلقائي</option>
          <option value="no">بدون تجديد</option>
        </select>
        <label className="cc-filter-check">
          <input
            type="checkbox"
            checked={filters.needsAttention}
            onChange={(event) => setFilters((prev) => ({ ...prev, needsAttention: event.target.checked }))}
          />
          تحتاج انتباهًا
        </label>
      </div>

      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? <AdminSkeletonRows rows={8} /> : null}

      {!loading && filteredRows.length === 0 ? (
        <AdminEmptyState
          title="لا توجد عضويات مطابقة"
          body="جرّب تغيير البحث أو الفلاتر. العضويات المدفوعة النشطة تظهر هنا تلقائيًا."
        />
      ) : null}

      {!loading && filteredRows.length > 0 ? (
        <>
          <AdminTable className="cc-table-wrap--desktop">
            <thead>
              <tr>
                <th>العميل</th>
                <th>الباقة</th>
                <th>الحالة</th>
                <th>المدة / السعر</th>
                <th>نهاية الفترة</th>
                <th>المزود</th>
                <th>انتباه</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const lifecycle = resolveMembershipLifecycle(row);
                return (
                  <tr key={row.userId}>
                    <td>
                      <div className="font-bold">{row.fullName || "—"}</div>
                      <div className="text-xs text-muted-foreground">{row.email || row.userId}</div>
                    </td>
                    <td>{membershipPlanLabel(row.tier)}</td>
                    <td>
                      <AdminStatusBadge tone={badgeTone(lifecycle)}>
                        {billingStatusLabel(lifecycle)}
                      </AdminStatusBadge>
                    </td>
                    <td>
                      <div>{row.billingPeriodMonths ? `${row.billingPeriodMonths} أشهر` : "—"}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr" style={{ textAlign: "right" }}>
                        {formatMembershipPlanPrice(row)}
                      </div>
                    </td>
                    <td>{formatBillingDate(row.currentPeriodEnd ?? row.paidPeriodEnd)}</td>
                    <td>{providerDisplayLabel(row.provider, providerAvailable)}</td>
                    <td>{membershipNeedsAttention(row) ? "نعم" : "—"}</td>
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
                );
              })}
            </tbody>
          </AdminTable>

          <div className="cc-mobile-cards cc-mobile-membership-cards">
            {filteredRows.map((row) => {
              const lifecycle = resolveMembershipLifecycle(row);
              return (
                <article key={row.userId} className="cc-ops-card">
                  <header className="cc-ops-card__header">
                    <strong>{row.fullName || row.email || "عميل"}</strong>
                    <AdminStatusBadge tone={badgeTone(lifecycle)}>{billingStatusLabel(lifecycle)}</AdminStatusBadge>
                  </header>
                  <dl className="cc-ops-card__dl">
                    <div>
                      <dt>الباقة</dt>
                      <dd>{membershipPlanLabel(row.tier)}</dd>
                    </div>
                    <div>
                      <dt>المدة</dt>
                      <dd>{row.billingPeriodMonths ? `${row.billingPeriodMonths} أشهر` : "—"}</dd>
                    </div>
                    <div>
                      <dt>السعر</dt>
                      <dd dir="ltr" style={{ textAlign: "right" }}>
                        {formatMembershipPlanPrice(row)}
                      </dd>
                    </div>
                    <div>
                      <dt>آخر دفعة</dt>
                      <dd>{paymentHistoryStatusLabel(row.lastPaymentStatus ?? "—")}</dd>
                    </div>
                  </dl>
                  <Link
                    to="/admin/clients/$clientId"
                    params={{ clientId: row.userId }}
                    search={{ tab: "membership" }}
                    className="cc-btn cc-btn--primary cc-btn--compact"
                  >
                    فتح العميل
                  </Link>
                </article>
              );
            })}
          </div>
        </>
      ) : null}
    </>
  );
}
