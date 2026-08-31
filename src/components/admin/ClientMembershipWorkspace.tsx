import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AdminCard, AdminEmptyState, AdminSection, AdminStatusBadge, AdminTable } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import type { AdminClientOverview } from "@/lib/admin/admin-clients-api";
import {
  exceptionTypeLabel,
  fetchAdminClientPspPayments,
  fetchAdminMemberSubscriptions,
  fetchAdminPaymentExceptions,
  type AdminMemberSubscriptionRow,
  type AdminPspPaymentRow,
} from "@/lib/admin/admin-billing-ops-api";
import {
  formatMembershipPlanPrice,
  membershipPlanLabel,
  membershipSourceLabel,
  resolveMembershipLifecycle,
} from "@/lib/admin/admin-billing-ops-surfaces";
import { formatAdminDate } from "@/lib/admin/admin-status";
import {
  billingBannerCopy,
  billingStatusLabel,
  billingStatusTone,
  formatBillingDate,
  paymentHistoryStatusLabel,
  providerBindingStateLabel,
} from "@/lib/payments/billing-present";

type Props = {
  clientId: string;
  overview: AdminClientOverview;
};

function badgeTone(state: ReturnType<typeof resolveMembershipLifecycle>) {
  const tone = billingStatusTone(state);
  if (tone === "warning") return "waiting" as const;
  if (tone === "info") return "review" as const;
  if (tone === "danger") return "danger" as const;
  if (tone === "success") return "success" as const;
  return "neutral" as const;
}

export function ClientMembershipWorkspace({ clientId, overview }: Props) {
  const membership = overview.membership;
  const [subscription, setSubscription] = useState<AdminMemberSubscriptionRow | null>(null);
  const [payments, setPayments] = useState<AdminPspPaymentRow[]>([]);
  const [exceptions, setExceptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subs, pspRows, exceptionRows] = await Promise.all([
        fetchAdminMemberSubscriptions({ search: overview.email ?? undefined }),
        fetchAdminClientPspPayments(clientId),
        fetchAdminPaymentExceptions(),
      ]);
      setSubscription(subs.find((row) => row.userId === clientId) ?? null);
      setPayments(pspRows);
      setExceptions(
        exceptionRows
          .filter((row) => row.subjectLabel === overview.email || row.href.includes(clientId))
          .map((row) => `${exceptionTypeLabel(row.exceptionType)}: ${row.detail}`),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [clientId, overview.email]);

  useEffect(() => {
    void load();
  }, [load]);

  const lifecycle = useMemo(() => {
    if (subscription) return resolveMembershipLifecycle(subscription);
    if (!membership) return "FREE" as const;
    return resolveMembershipLifecycle({
      userId: clientId,
      email: overview.email,
      fullName: overview.full_name,
      tier: membership.tier,
      subscriptionStatus: membership.is_active ? "active" : "inactive",
      billingPeriodMonths:
        membership.billing_period_months === 3 || membership.billing_period_months === 6
          ? membership.billing_period_months
          : null,
      priceAmount: null,
      currency: null,
      autoRenew: Boolean(membership.auto_renew),
      cancelAtPeriodEnd: Boolean(membership.cancel_at_period_end),
      currentPeriodStart: membership.starts_at,
      currentPeriodEnd: membership.ends_at,
      nextRenewalAt: membership.next_renewal_at ?? null,
      paidPeriodEnd: membership.paid_period_end ?? null,
      provider: null,
      isActive: membership.is_active,
      lastPaymentStatus: null,
      lastPaymentAt: null,
      exceptionState: null,
    });
  }, [subscription, membership, clientId, overview]);

  const banner = billingBannerCopy(
    lifecycle,
    subscription?.paidPeriodEnd ?? membership?.paid_period_end ?? membership?.ends_at ?? null,
  );
  const providerState = providerBindingStateLabel();

  if (!membership) {
    return (
      <AdminEmptyState
        title="لا عضوية مسجّلة"
        body="لا توجد بيانات اشتراك لهذا العميل في النظام الحالي."
      />
    );
  }

  return (
    <AdminSection>
      {banner ? (
        <div className="cc-notice cc-notice--info" role="status">
          <strong>{banner.title}</strong>
          <p>{banner.body}</p>
        </div>
      ) : null}

      <AdminCard>
        <h2 className="cc-section__title">العضوية والفوترة</h2>
        <p className="cc-muted">بيانات الاشتراك الحالية — دون تعديل يدوي للصلاحيات أو تفعيل وهمي. مصدر الحقيقة: {membershipSourceLabel(membership.source)}</p>
        <dl className="cc-dl">
          <div>
            <dt>الخطة</dt>
            <dd>
              <AdminStatusBadge tone={badgeTone(lifecycle)}>{membershipPlanLabel(membership.tier)}</AdminStatusBadge>
            </dd>
          </div>
          <div>
            <dt>الحالة</dt>
            <dd>
              <AdminStatusBadge tone={badgeTone(lifecycle)}>{billingStatusLabel(lifecycle)}</AdminStatusBadge>
            </dd>
          </div>
          <div>
            <dt>المدة</dt>
            <dd>
              {subscription?.billingPeriodMonths ?? membership.billing_period_months
                ? `${subscription?.billingPeriodMonths ?? membership.billing_period_months} أشهر`
                : "—"}
            </dd>
          </div>
          <div>
            <dt>السعر</dt>
            <dd dir="ltr" style={{ textAlign: "right" }}>
              {subscription ? formatMembershipPlanPrice(subscription) : "—"}
            </dd>
          </div>
          <div>
            <dt>الفترة المدفوعة</dt>
            <dd>
              {formatAdminDate(membership.starts_at)} —{" "}
              {membership.paid_period_end
                ? formatAdminDate(membership.paid_period_end)
                : membership.ends_at
                  ? formatAdminDate(membership.ends_at)
                  : "—"}
            </dd>
          </div>
          <div>
            <dt>التجديد</dt>
            <dd>
              {membership.cancel_at_period_end
                ? "تم طلب إيقاف التجديد التلقائي"
                : membership.auto_renew
                  ? "تجديد تلقائي"
                  : "—"}
            </dd>
          </div>
          <div>
            <dt>التجديد القادم</dt>
            <dd>{membership.next_renewal_at ? formatAdminDate(membership.next_renewal_at) : "—"}</dd>
          </div>
          <div>
            <dt>المزود</dt>
            <dd>{subscription?.provider || providerState.label}</dd>
          </div>
        </dl>
      </AdminCard>

      {exceptions.length > 0 ? (
        <AdminCard>
          <h3 className="cc-section__title">استثناءات الدفع</h3>
          <ul className="cc-billing-exception-preview">
            {exceptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </AdminCard>
      ) : null}

      <AdminCard>
        <h3 className="cc-section__title">سجل المدفوعات</h3>
        {loading ? <AdminSkeletonRows rows={3} /> : null}
        {!loading && payments.length === 0 ? (
          <p className="cc-muted">لا توجد معاملات مسجلة لهذا العميل.</p>
        ) : null}
        {!loading && payments.length > 0 ? (
          <AdminTable>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الباقة</th>
                <th>المدة</th>
                <th>المبلغ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((row) => (
                <tr key={row.id}>
                  <td>{formatBillingDate(row.paidAt ?? row.createdAt)}</td>
                  <td>{membershipPlanLabel(row.tier ?? membership.tier)}</td>
                  <td>{row.billingPeriodMonths ? `${row.billingPeriodMonths} أشهر` : "—"}</td>
                  <td dir="ltr" style={{ textAlign: "right" }}>
                    {row.amount} {row.currency}
                  </td>
                  <td>{paymentHistoryStatusLabel(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : null}
      </AdminCard>

      <div className="cc-client-actions-row">
        <Link to="/admin/billing" className="cc-btn">
          نظرة عامة
        </Link>
        <Link to="/admin/payments" search={{ section: "exceptions" }} className="cc-btn">
          الاستثناءات
        </Link>
        <Link to="/admin/audit" className="cc-btn">
          سجل العمليات
        </Link>
      </div>
    </AdminSection>
  );
}
