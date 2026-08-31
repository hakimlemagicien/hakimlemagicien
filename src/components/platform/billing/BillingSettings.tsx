import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LEGAL_ROUTES } from "@/lib/site-legal";
import {
  cancelMyRenewal,
  fetchMyBilling,
  fetchMyPaymentHistory,
  type BillingSnapshot,
} from "@/lib/legal/billing-api";
import { RENEWAL_REMINDER_MIN_DAYS } from "@/lib/legal/billing";
import { getMembershipTierLabel, type MembershipTier } from "@/lib/platform/membership";
import {
  billingBannerCopy,
  billingStatusLabel,
  canRequestCancelRenewal,
  formatBillingDate,
  formatBillingPrice,
  isPaidBillingPlan,
  paymentHistoryStatusLabel,
  providerBindingStateLabel,
  resolveBillingLifecycleState,
  resolveCatalogPrice,
} from "@/lib/payments/billing-present";
import { getPaymentProviderAvailability } from "@/lib/payments/provider-registry";

export function BillingSettings() {
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof fetchMyPaymentHistory>>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [providerPending, setProviderPending] = useState(false);

  const load = async () => {
    setLoading(true);
    const [billingData, historyRows] = await Promise.all([fetchMyBilling(), fetchMyPaymentHistory()]);
    setBilling(billingData);
    setHistory(historyRows);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const lifecycle = useMemo(
    () =>
      resolveBillingLifecycleState({
        plan: billing?.plan ?? "free",
        status: billing?.status ?? "free",
        subscriptionStatus: billing?.subscriptionStatus,
        autoRenew: Boolean(billing?.autoRenew),
        cancelAtPeriodEnd: Boolean(billing?.cancelAtPeriodEnd),
        providerConfirmationPending: providerPending || billing?.providerConfirmationPending,
      }),
    [billing, providerPending],
  );

  const paid = isPaidBillingPlan(billing?.plan ?? "free", billing?.status ?? "free");
  const catalogPrice = resolveCatalogPrice(billing?.plan ?? "free", billing?.billingPeriodMonths);
  const displayPrice = paid
    ? formatBillingPrice(billing?.plan ?? "free", billing?.priceAmount ?? catalogPrice?.amount ?? null, billing?.currency ?? "USD")
    : "$0";
  const banner = billingBannerCopy(lifecycle, billing?.paidPeriodEnd ?? billing?.currentPeriodEnd ?? null);
  const providerState = providerBindingStateLabel();
  const providerAvailable = getPaymentProviderAvailability().available;

  const handleCancel = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await cancelMyRenewal();
      setProviderPending(Boolean(result.providerConfirmationPending));
      setNotice(
        `تم إيقاف التجديد التلقائي. يستمر وصولك حتى ${formatBillingDate(result.paidPeriodEnd ?? billing?.paidPeriodEnd ?? null)}.${
          result.providerConfirmationPending ? " الطلب مسجّل — تأكيد المزود سيتم لاحقاً عند الربط." : ""
        } هذا ليس طلب استرداد ولا حذف حساب.`,
      );
      setConfirmCancel(false);
      await load();
    } catch (err) {
      setError("تعذر تسجيل طلب إيقاف التجديد الآن. يمكنك طلب ذلك من صفحة التواصل.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm font-bold text-muted-foreground">جاري تحميل الفوترة…</p>;
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-black text-foreground">الاشتراك والفوترة</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          إيقاف التجديد لا يحذف الحساب ولا يقدّم طلب استرداد. التذكير قبل التجديد يكون قبل {RENEWAL_REMINDER_MIN_DAYS} أيام على الأقل.
        </p>
      </header>

      {!providerAvailable ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
          {providerState.label}
        </div>
      ) : null}

      {banner ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2">
          <p className="text-xs font-black text-sky-950">{banner.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-sky-900">{banner.body}</p>
        </div>
      ) : null}

      <div className="grid gap-2 rounded-3xl border border-border bg-card p-4 text-sm">
        <Row label="الباقة الحالية" value={getMembershipTierLabel((billing?.plan as MembershipTier) || "free")} />
        <Row
          label="مدة الفوترة"
          value={billing?.billingPeriodMonths ? `${billing.billingPeriodMonths} أشهر` : paid ? "—" : "—"}
        />
        <Row label="السعر" value={displayPrice} />
        <Row label="حالة الاشتراك" value={billingStatusLabel(lifecycle)} />
        <Row label="التجديد التلقائي" value={billing?.autoRenew && !billing.cancelAtPeriodEnd ? "مفعّل" : "غير مفعّل"} />
        <Row
          label="بداية الفترة الحالية"
          value={formatBillingDate(billing?.currentPeriodStart ?? billing?.subscriptionActivatedAt ?? null)}
        />
        <Row label="موعد التجديد التالي" value={paid ? formatBillingDate(billing?.nextRenewalAt ?? null) : "—"} />
        <Row label="نهاية الفترة المدفوعة" value={paid ? formatBillingDate(billing?.paidPeriodEnd ?? billing?.currentPeriodEnd ?? null) : "—"} />
        {billing?.provider ? <Row label="المزود" value={billing.provider} /> : null}
        {lifecycle === "PROVIDER_CONFIRMATION_PENDING" ? (
          <Row label="تأكيد المزود" value="بانتظار التأكيد — الطلب مسجّل" />
        ) : null}
      </div>

      {notice ? <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">{notice}</p> : null}
      {error ? <p className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">{error}</p> : null}

      {paid && canRequestCancelRenewal(lifecycle) ? (
        <div className="space-y-2">
          {!confirmCancel ? (
            <button
              type="button"
              className="flex h-11 w-full items-center justify-center rounded-2xl border border-border text-sm font-black"
              onClick={() => setConfirmCancel(true)}
            >
              إيقاف التجديد التلقائي
            </button>
          ) : (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-black text-amber-950">تأكيد إيقاف التجديد</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-900">
                لن تُخصم دورة جديدة. يبقى وصولك حتى نهاية الفترة المدفوعة (
                {formatBillingDate(billing?.paidPeriodEnd ?? null)}). هذا ليس استرداداً وليس حذف حساب.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="h-10 rounded-2xl bg-foreground text-xs font-black text-background disabled:opacity-60"
                  disabled={busy}
                  onClick={() => void handleCancel()}
                >
                  {busy ? "جاري…" : "تأكيد الإيقاف"}
                </button>
                <button
                  type="button"
                  className="h-10 rounded-2xl border border-border text-xs font-black"
                  onClick={() => setConfirmCancel(false)}
                >
                  إبقاء التجديد
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {!paid ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">لا يوجد اشتراك مدفوع حالياً.</p>
          <Link
            to="/app/upgrade"
            search={{ surface: "BILLING" }}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-black text-primary-foreground"
          >
            عرض الباقات
          </Link>
        </div>
      ) : lifecycle === "EXPIRED" || lifecycle === "REFUNDED" ? (
        <Link
          to="/app/upgrade"
          search={{ surface: "BILLING" }}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-black text-primary-foreground"
        >
          تجديد / عرض الباقات
        </Link>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-black text-foreground">سجل المدفوعات</h2>
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">لا يوجد سجل مدفوعات متاح حالياً.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-right font-bold">التاريخ</th>
                  <th className="px-3 py-2 text-right font-bold">الباقة</th>
                  <th className="px-3 py-2 text-right font-bold">المدة</th>
                  <th className="px-3 py-2 text-right font-bold">المبلغ</th>
                  <th className="px-3 py-2 text-right font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-t border-border/60">
                    <td className="px-3 py-2">{formatBillingDate(row.paidAt ?? row.createdAt)}</td>
                    <td className="px-3 py-2">{getMembershipTierLabel(row.tier as MembershipTier)}</td>
                    <td className="px-3 py-2">{row.billingPeriodMonths ? `${row.billingPeriodMonths} أشهر` : "—"}</td>
                    <td className="px-3 py-2">
                      {formatBillingPrice(row.tier, row.amount, row.currency)}
                    </td>
                    <td className="px-3 py-2">{paymentHistoryStatusLabel(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <nav className="flex flex-wrap gap-3 text-xs font-black text-primary">
        <Link to={LEGAL_ROUTES.terms}>الشروط</Link>
        <Link to={LEGAL_ROUTES.refund}>الاسترداد والإلغاء</Link>
        <Link to={LEGAL_ROUTES.contact}>طلب استرداد / دعم الفوترة</Link>
        <Link to="/app/profile">حذف الحساب من الإعدادات</Link>
      </nav>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      <strong className="max-w-[60%] text-end text-xs font-black text-foreground">{value}</strong>
    </div>
  );
}
