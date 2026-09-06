import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";
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
import { directoryPlanLabelAr, directoryPlanTone } from "@/lib/admin/admin-client-ops";
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
  sidebar?: ReactNode;
};

function badgeTone(state: ReturnType<typeof resolveMembershipLifecycle>) {
  const tone = billingStatusTone(state);
  if (tone === "warning") return "waiting" as const;
  if (tone === "info") return "review" as const;
  if (tone === "danger") return "danger" as const;
  if (tone === "success") return "success" as const;
  return "neutral" as const;
}

export function ClientMembershipWorkspace({ clientId, overview, sidebar }: Props) {
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
  const lastPaid = payments.find((row) => row.status === "paid" || row.status === "completed" || row.paidAt);
  const periodLabel = subscription?.billingPeriodMonths ?? membership?.billing_period_months;

  const timeline = [
    membership?.starts_at
      ? { id: "start", label: "بداية العضوية", date: membership.starts_at, done: true }
      : null,
    lastPaid
      ? { id: "paid", label: "آخر دفعة ناجحة", date: lastPaid.paidAt ?? lastPaid.createdAt, done: true }
      : null,
    membership?.next_renewal_at
      ? { id: "renew", label: "التجديد القادم", date: membership.next_renewal_at, done: false }
      : membership?.paid_period_end
        ? { id: "end", label: "نهاية الفترة المدفوعة", date: membership.paid_period_end, done: false }
        : null,
  ].filter((item): item is { id: string; label: string; date: string; done: boolean } => Boolean(item));

  if (!membership) {
    return (
      <div className={sidebar ? "cc-membership-layout" : undefined}>
        <AdminEmptyState
          title="لا عضوية مسجّلة"
          body="لا توجد بيانات اشتراك لهذا العميل في النظام الحالي."
        />
        {sidebar}
      </div>
    );
  }

  return (
    <div className={sidebar ? "cc-membership-layout" : undefined}>
      <AdminSection>
        {banner ? (
          <div className="cc-notice cc-notice--info" role="status">
            <strong>{banner.title}</strong>
            <p>{banner.body}</p>
          </div>
        ) : null}

        <AdminCard className="cc-membership-current">
          <div className="cc-membership-current__head">
            <h2 className="cc-section__title">العضوية الحالية</h2>
            <AdminStatusBadge tone={badgeTone(lifecycle)}>
              {membership.is_active ? "نشطة" : billingStatusLabel(lifecycle)}
            </AdminStatusBadge>
          </div>
          <div className="cc-membership-current__plan">
            <span className="cc-membership-current__icon" aria-hidden>
              <Crown size={18} />
            </span>
            <div>
              <strong>
                <AdminStatusBadge tone={directoryPlanTone(membership.tier)}>
                  {directoryPlanLabelAr(membership.tier)}
                </AdminStatusBadge>
              </strong>
              <p dir="ltr">
                {subscription ? formatMembershipPlanPrice(subscription) : membershipPlanLabel(membership.tier)}
                {periodLabel ? ` · ${periodLabel} أشهر` : ""}
              </p>
              {membership.next_renewal_at ? (
                <p className="cc-meta">التجديد القادم {formatAdminDate(membership.next_renewal_at)}</p>
              ) : membership.paid_period_end ? (
                <p className="cc-meta">الفترة المدفوعة حتى {formatAdminDate(membership.paid_period_end)}</p>
              ) : null}
            </div>
          </div>
          <p className="cc-muted">
            بيانات الاشتراك الحالية — دون تعديل يدوي للصلاحيات أو تفعيل وهمي. مصدر الحقيقة:{" "}
            {membershipSourceLabel(membership.source)}
          </p>
          <dl className="cc-dl cc-dl--inline">
            <div>
              <dt>المزود</dt>
              <dd>{subscription?.provider || providerState.label}</dd>
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
          </dl>
          <Link to="/admin/memberships" className="cc-btn cc-btn--outline">
            إدارة الاشتراك
          </Link>
          {timeline.length > 0 ? (
            <ol className="cc-membership-timeline">
              {timeline.map((item) => (
                <li key={item.id} className={item.done ? "is-done" : undefined}>
                  <span>{item.label}</span>
                  <strong>{formatAdminDate(item.date)}</strong>
                </li>
              ))}
            </ol>
          ) : null}
        </AdminCard>

        {exceptions.length > 0 ? (
          <AdminCard>
            <h3 className="cc-section__title">استثناءات الدفع</h3>
            <ul className="cc-billing-exception-preview">
              {exceptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link to="/admin/payments" search={{ section: "exceptions" }} className="cc-card-footer-link">
              فتح الاستثناءات
            </Link>
          </AdminCard>
        ) : null}

        <AdminCard>
          <h3 className="cc-section__title">سجل الفواتير</h3>
          {loading ? <AdminSkeletonRows rows={3} /> : null}
          {!loading && payments.length === 0 ? (
            <p className="cc-muted">لا توجد معاملات مسجلة لهذا العميل.</p>
          ) : null}
          {!loading && payments.length > 0 ? (
            <AdminTable>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الوصف</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((row) => (
                  <tr key={row.id}>
                    <td>{formatBillingDate(row.paidAt ?? row.createdAt)}</td>
                    <td>
                      {membershipPlanLabel(row.tier ?? membership.tier)}
                      {row.billingPeriodMonths ? ` · ${row.billingPeriodMonths} أشهر` : ""}
                    </td>
                    <td dir="ltr" style={{ textAlign: "right" }}>
                      {row.amount} {row.currency}
                    </td>
                    <td>
                      <AdminStatusBadge tone={row.status === "paid" || row.status === "completed" ? "success" : "neutral"}>
                        {paymentHistoryStatusLabel(row.status)}
                      </AdminStatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : null}
          <Link to="/admin/payments" className="cc-card-footer-link">
            عرض جميع الفواتير
          </Link>
        </AdminCard>
      </AdminSection>
      {sidebar}
    </div>
  );
}
