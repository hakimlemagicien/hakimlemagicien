import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Crown, ShieldCheck } from "lucide-react";
import {
  AdminConfirmDialog,
  AdminSkeletonRows,
  type AdminConfirmRequest,
} from "@/components/admin/AdminConfirmDialog";
import { AdminCard, AdminEmptyState, AdminSection, AdminStatusBadge, AdminTable } from "@/components/admin/AdminPage";
import { RequirePermission } from "@/components/admin/StaffPermissionsContext";
import { TrainingToolCard, type TrainingToolCardTone } from "@/components/admin/TrainingToolCard";
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
import {
  applyAdminMembershipOverride,
  estimateMembershipEndDate,
  MEMBERSHIP_OVERRIDE_PERIODS,
  MEMBERSHIP_OVERRIDE_TIERS,
  parseMembershipOverrideError,
  type MembershipOverridePeriod,
  type MembershipOverrideTier,
} from "@/lib/admin/admin-membership-override-api";
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
  onUpdated?: () => Promise<void> | void;
};

const TIER_OPTIONS: Array<{ id: MembershipOverrideTier; label: string; hint: string }> = [
  { id: "free", label: "FREE", hint: "معاينة مجانية" },
  { id: "essential", label: "PLUS", hint: "أساسي مدفوع" },
  { id: "premium", label: "PRO", hint: "كامل المزايا" },
  { id: "vip", label: "VIP", hint: "داخلي / خاص" },
];

function badgeTone(state: ReturnType<typeof resolveMembershipLifecycle>) {
  const tone = billingStatusTone(state);
  if (tone === "warning") return "waiting" as const;
  if (tone === "info") return "review" as const;
  if (tone === "danger") return "danger" as const;
  if (tone === "success") return "success" as const;
  return "neutral" as const;
}

function normalizeOverrideTier(tier: string | null | undefined): MembershipOverrideTier {
  const value = String(tier ?? "").toLowerCase();
  if ((MEMBERSHIP_OVERRIDE_TIERS as readonly string[]).includes(value)) {
    return value as MembershipOverrideTier;
  }
  return "free";
}

function MembershipOverridePanel({
  clientId,
  clientName,
  currentTier,
  currentPeriodMonths,
  onApplied,
}: {
  clientId: string;
  clientName: string;
  currentTier: string | null | undefined;
  currentPeriodMonths: number | null | undefined;
  onApplied: () => Promise<void> | void;
}) {
  const [tier, setTier] = useState<MembershipOverrideTier>(() => normalizeOverrideTier(currentTier));
  const [period, setPeriod] = useState<MembershipOverridePeriod>(() =>
    currentPeriodMonths === 6 ? 6 : 3,
  );
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState<AdminConfirmRequest | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTier(normalizeOverrideTier(currentTier));
    setPeriod(currentPeriodMonths === 6 ? 6 : 3);
  }, [currentTier, currentPeriodMonths, clientId]);

  const endsAt = useMemo(() => estimateMembershipEndDate(tier, tier === "free" ? null : period), [tier, period]);
  const reasonOk = reason.trim().length >= 5;
  const unchanged =
    tier === normalizeOverrideTier(currentTier) &&
    (tier === "free" || period === (currentPeriodMonths === 6 ? 6 : currentPeriodMonths === 3 ? 3 : period));

  const openConfirm = () => {
    setError(null);
    setNotice(null);
    if (!reasonOk) {
      setError("السبب إلزامي (5 أحرف على الأقل).");
      return;
    }
    setConfirm({
      title: "تطبيق عضوية جديدة",
      subjectLabel: clientName,
      body: `سيتم استبدال العضوية الحالية بعضوية ${directoryPlanLabelAr(tier)}${
        tier === "free" ? " بدون مدة" : ` لمدة ${period} أشهر`
      }.`,
      impact:
        "هذا تفعيل داخلي (admin_override) — لا ينشئ دفعة مزوّد ولا يعدّل حقيقة الدفع. يُسجَّل في التدقيق مع السبب.",
      confirmLabel: "تطبيق العضوية",
      tone: "primary",
      diff: [
        {
          label: "المستوى",
          before: directoryPlanLabelAr(currentTier),
          after: directoryPlanLabelAr(tier),
        },
        {
          label: "المدة",
          before: currentPeriodMonths ? `${currentPeriodMonths} أشهر` : "—",
          after: tier === "free" ? "بدون مدة" : `${period} أشهر`,
        },
        {
          label: "الانتهاء",
          before: "—",
          after: endsAt ? formatAdminDate(endsAt.toISOString()) : "مفتوح (FREE)",
        },
      ],
      onConfirm: async () => {
        try {
          const result = await applyAdminMembershipOverride({
            clientId,
            tier,
            billingPeriodMonths: tier === "free" ? null : period,
            reason,
          });
          setNotice(
            `تم تطبيق ${directoryPlanLabelAr(result.tier)}${
              result.endsAt ? ` حتى ${formatAdminDate(result.endsAt)}` : ""
            }.`,
          );
          setReason("");
          await onApplied();
        } catch (err) {
          throw new Error(parseMembershipOverrideError(err));
        }
      },
    });
  };

  return (
    <>
      <AdminCard className="cc-membership-control" id="cc-membership-control">
        <div className="cc-membership-control__head">
          <div>
            <p className="cc-membership-control__eyebrow">تحكم كامل</p>
            <h2 className="cc-membership-control__title">تفعيل / تغيير العضوية</h2>
            <p className="cc-muted">
              اختر المستوى والمدة ثم أكّد. للعضوية المدفوعة: 3 أو 6 أشهر فقط.
            </p>
          </div>
          <span className="cc-membership-control__badge" aria-hidden>
            <ShieldCheck size={18} />
          </span>
        </div>

        <div className="cc-membership-control__block">
          <p className="cc-membership-control__label">المستوى</p>
          <div className="cc-membership-control__chips" role="radiogroup" aria-label="مستوى العضوية">
            {TIER_OPTIONS.map((option) => {
              const active = tier === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={active ? "cc-membership-chip is-active" : "cc-membership-chip"}
                  onClick={() => setTier(option.id)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        {tier !== "free" ? (
          <div className="cc-membership-control__block">
            <p className="cc-membership-control__label">المدة</p>
            <div className="cc-membership-control__chips cc-membership-control__chips--period" role="radiogroup" aria-label="مدة العضوية">
              {MEMBERSHIP_OVERRIDE_PERIODS.map((months) => {
                const active = period === months;
                return (
                  <button
                    key={months}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={active ? "cc-membership-chip is-active" : "cc-membership-chip"}
                    onClick={() => setPeriod(months)}
                  >
                    <strong>{months} أشهر</strong>
                    <span>من تاريخ التطبيق</span>
                  </button>
                );
              })}
            </div>
            {endsAt ? (
              <p className="cc-membership-control__estimate">
                تنتهي تقريباً في <strong>{formatAdminDate(endsAt.toISOString())}</strong>
              </p>
            ) : null}
          </div>
        ) : (
          <p className="cc-membership-control__estimate">FREE بدون تاريخ انتهاء مدفوع.</p>
        )}

        <label className="cc-membership-control__reason" htmlFor="membership-override-reason">
          <span className="cc-membership-control__label">السبب (إلزامي · يظهر في التدقيق)</span>
          <textarea
            id="membership-override-reason"
            className="cc-input"
            rows={3}
            maxLength={1000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="مثال: دفع يدوي خارج المنصة · تفعيل تجريبي · تعويض…"
          />
        </label>

        <div className="cc-membership-control__actions">
          <button
            type="button"
            className="cc-btn cc-btn--primary"
            disabled={!reasonOk}
            onClick={openConfirm}
          >
            تطبيق العضوية
          </button>
          {unchanged ? <span className="cc-muted">نفس المستوى الحالي — يمكنك التجديد بنفس المدة.</span> : null}
        </div>

        {notice ? (
          <p className="cc-inline-alert cc-inline-alert--ok" role="status">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="cc-inline-alert" role="alert">
            {error}
          </p>
        ) : null}

        <p className="cc-membership-control__foot">
          لا يلمس اشتراكات مزوّد الدفع النشطة. إن وُجد اشتراك PSP سيُرفض الطلب تلقائياً.
        </p>
      </AdminCard>

      <AdminConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

export function ClientMembershipWorkspace({ clientId, overview, sidebar, onUpdated }: Props) {
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

  const refreshAll = useCallback(async () => {
    await onUpdated?.();
    await load();
  }, [onUpdated, load]);

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
  const clientName = overview.full_name || overview.email || "العميل";

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

  const membershipTone: TrainingToolCardTone = membership?.is_active
    ? lifecycle === "PAST_DUE" || lifecycle === "CANCEL_AT_PERIOD_END"
      ? "warn"
      : "ok"
    : "attention";
  const membershipStatus = membership?.is_active
    ? lifecycle === "PAST_DUE"
      ? "يحتاج تدخل"
      : lifecycle === "CANCEL_AT_PERIOD_END"
        ? "ينتهي قريباً"
        : "يعمل جيداً"
    : "غير نشطة";

  return (
    <div className={sidebar ? "cc-membership-layout" : undefined}>
      <AdminSection>
        {banner ? (
          <div className="cc-notice cc-notice--info" role="status">
            <strong>{banner.title}</strong>
            <p>{banner.body}</p>
          </div>
        ) : null}

        <RequirePermission
          permission="memberships.manage"
          fallback={
            <AdminCard className="cc-membership-control cc-membership-control--locked">
              <h2 className="cc-membership-control__title">تفعيل / تغيير العضوية</h2>
              <p className="cc-muted">متاح لمدير النظام فقط. يمكنك مراجعة الحالة أدناه دون تعديل.</p>
            </AdminCard>
          }
        >
          <MembershipOverridePanel
            clientId={clientId}
            clientName={clientName}
            currentTier={membership?.tier}
            currentPeriodMonths={
              membership?.billing_period_months === 3 || membership?.billing_period_months === 6
                ? membership.billing_period_months
                : null
            }
            onApplied={refreshAll}
          />
        </RequirePermission>

        <div className="cc-tool-cards" aria-label="العضوية والفوترة">
          {membership ? (
            <TrainingToolCard
              title="العضوية الحالية"
              preview={`${directoryPlanLabelAr(membership.tier)}${
                membership.next_renewal_at
                  ? ` · تجديد ${formatAdminDate(membership.next_renewal_at)}`
                  : membership.paid_period_end
                    ? ` · حتى ${formatAdminDate(membership.paid_period_end)}`
                    : ""
              }`}
              statusLabel={membershipStatus}
              tone={membershipTone}
            >
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
                  مصدر الحقيقة: {membershipSourceLabel(membership.source)}. التفعيل اليدوي من البطاقة أعلاه فقط —
                  بدون تزييف دفعات المزود.
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
                <Link to="/admin/memberships" className="cc-btn cc-btn--ghost cc-btn--compact">
                  مركز العضويات
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
            </TrainingToolCard>
          ) : (
            <AdminEmptyState
              title="لا عضوية مسجّلة"
              body="فعّل عضوية من البطاقة أعلاه ليظهر للعميل الوصول المناسب في التطبيق."
            />
          )}

          {exceptions.length > 0 ? (
            <TrainingToolCard
              title="استثناءات الدفع"
              preview={`${exceptions.length} استثناء يحتاج مراجعة`}
              statusLabel="يحتاج تدخل"
              tone="attention"
            >
              <AdminCard>
                <ul className="cc-billing-exception-preview">
                  {exceptions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link to="/admin/payments" search={{ section: "exceptions" }} className="cc-card-footer-link">
                  فتح الاستثناءات
                </Link>
              </AdminCard>
            </TrainingToolCard>
          ) : null}

          <TrainingToolCard
            title="سجل الفواتير"
            preview={
              loading
                ? "جاري التحميل…"
                : payments.length > 0
                  ? `${payments.length} معاملة`
                  : "لا معاملات مسجلة"
            }
            statusLabel={payments.length > 0 ? "متوفر" : "فارغ"}
            tone="neutral"
          >
            <AdminCard>
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
                          {membershipPlanLabel(row.tier ?? membership?.tier ?? "free")}
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
          </TrainingToolCard>
        </div>
      </AdminSection>
      {sidebar}
    </div>
  );
}
