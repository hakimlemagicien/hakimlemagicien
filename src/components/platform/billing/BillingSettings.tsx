import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LEGAL_ROUTES } from "@/lib/site-legal";
import { cancelMyRenewal, fetchMyBilling, type BillingSnapshot } from "@/lib/legal/billing-api";
import { RENEWAL_REMINDER_MIN_DAYS } from "@/lib/legal/billing";
import { getMembershipTierLabel, type MembershipTier } from "@/lib/platform/membership";
import { formatOfficialTotal } from "@/lib/pricing-presentation";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-AE", { dateStyle: "medium" }).format(date);
}

function statusLabel(status: string, cancelAtPeriodEnd: boolean) {
  if (status === "suspended") return "موقوف";
  if (cancelAtPeriodEnd || status === "cancel_at_period_end") return "سيتوقف التجديد — الوصول حتى نهاية الفترة المدفوعة";
  if (status === "active") return "نشط";
  if (status === "free") return "خطة مجانية";
  return status;
}

export function BillingSettings() {
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchMyBilling();
    setBilling(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const paid = Boolean(billing && billing.plan !== "free" && billing.status !== "free");

  const handleCancel = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await cancelMyRenewal();
      setNotice(
        `تم إلغاء التجديد. يستمر وصولك حتى ${formatDate(result.paid_period_end ?? billing?.paidPeriodEnd ?? null)}. هذا ليس طلب استرداد وليس حذف حساب.`,
      );
      setConfirmCancel(false);
      await load();
    } catch (err) {
      setError("تعذر إلغاء التجديد الآن. يمكنك طلب ذلك من صفحة التواصل.");
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
          إلغاء التجديد لا يحذف الحساب ولا يقدّم طلب استرداد. بعد تفعيل الفوترة التلقائية، التذكير قبل التجديد يكون قبل {RENEWAL_REMINDER_MIN_DAYS} أيام على الأقل.
        </p>
      </header>

      <div className="grid gap-2 rounded-3xl border border-border bg-card p-4 text-sm">
        <Row label="الباقة الحالية" value={getMembershipTierLabel((billing?.plan as MembershipTier) || "free")} />
        <Row
          label="مدة الفوترة"
          value={billing?.billingPeriodMonths ? `${billing.billingPeriodMonths} أشهر` : "—"}
        />
        <Row
          label="السعر"
          value={
            billing?.priceAmount != null
              ? `${formatOfficialTotal(billing.priceAmount)} ${billing.currency}`
              : "—"
          }
        />
        <Row label="حالة الاشتراك" value={statusLabel(billing?.status ?? "unknown", Boolean(billing?.cancelAtPeriodEnd))} />
        <Row label="التجديد التلقائي" value={billing?.autoRenew && !billing.cancelAtPeriodEnd ? "مفعّل" : "غير مفعّل"} />
        <Row label="موعد التجديد التالي" value={formatDate(billing?.nextRenewalAt ?? null)} />
        <Row label="نهاية الفترة المدفوعة" value={formatDate(billing?.paidPeriodEnd ?? null)} />
      </div>

      {notice ? <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">{notice}</p> : null}
      {error ? <p className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">{error}</p> : null}

      {paid ? (
        <div className="space-y-2">
          {!confirmCancel ? (
            <button
              type="button"
              className="flex h-11 w-full items-center justify-center rounded-2xl border border-border text-sm font-black"
              onClick={() => setConfirmCancel(true)}
            >
              إلغاء التجديد
            </button>
          ) : (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-black text-amber-950">تأكيد إلغاء التجديد</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-900">
                لن تُخصم دورة جديدة. يبقى وصولك حتى نهاية الفترة المدفوعة ({formatDate(billing?.paidPeriodEnd ?? null)}).
                هذا ليس استرداداً وليس حذف حساب.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="h-10 rounded-2xl bg-foreground text-xs font-black text-background disabled:opacity-60"
                  disabled={busy}
                  onClick={() => void handleCancel()}
                >
                  {busy ? "جاري…" : "تأكيد الإلغاء"}
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
      ) : (
        <p className="text-xs text-muted-foreground">لا يوجد اشتراك مدفوع حالياً.</p>
      )}

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
