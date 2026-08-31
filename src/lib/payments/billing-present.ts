import { getTermOffer } from "@/lib/pricing-presentation";
import type { PaidTierId, SubscriptionTermMonths } from "@/lib/pricing-presentation";
import { getPaymentProviderAvailability } from "@/lib/payments/provider-registry";
import { isPublicPaidTier } from "@/lib/payments/catalog";

export type BillingLifecycleState =
  | "FREE"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCEL_AT_PERIOD_END"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED"
  | "PROVIDER_CONFIRMATION_PENDING"
  | "PAYMENT_PROVIDER_UNAVAILABLE"
  | "SUSPENDED";

export type BillingPresentationInput = {
  plan: string;
  status: string;
  subscriptionStatus?: string | null;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  providerConfirmationPending?: boolean;
};

export type PaymentHistoryRow = {
  id: string;
  paidAt: string | null;
  createdAt: string;
  tier: string;
  billingPeriodMonths: number | null;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
};

export function resolveBillingLifecycleState(input: BillingPresentationInput): BillingLifecycleState {
  const plan = input.plan?.toLowerCase() ?? "free";
  const status = (input.subscriptionStatus ?? input.status ?? "").toLowerCase();

  if (plan === "free" || status === "free") return "FREE";
  if (input.providerConfirmationPending && input.cancelAtPeriodEnd) return "PROVIDER_CONFIRMATION_PENDING";
  if (status === "past_due") return "PAST_DUE";
  if (status === "refunded") return "REFUNDED";
  if (status === "expired" || status === "cancelled" || status === "inactive") return "EXPIRED";
  if (status === "suspended") return "SUSPENDED";
  if (input.cancelAtPeriodEnd || status === "cancel_at_period_end") return "CANCEL_AT_PERIOD_END";
  if (status === "active" || status === "pending_confirmation") return "ACTIVE";
  return "ACTIVE";
}

export function isPaidBillingPlan(plan: string, status: string): boolean {
  const normalized = plan?.toLowerCase() ?? "free";
  return normalized !== "free" && status !== "free";
}

export function canRequestCancelRenewal(state: BillingLifecycleState): boolean {
  return state === "ACTIVE" || state === "PAST_DUE";
}

export function resolveCatalogPrice(
  plan: string,
  termMonths: SubscriptionTermMonths | null,
): { amount: number; currency: string } | null {
  if (!isPublicPaidTier(plan) || !termMonths) return null;
  const offer = getTermOffer(plan as PaidTierId, termMonths);
  return { amount: offer.totalPrice, currency: "USD" };
}

export function formatBillingPrice(plan: string, amount: number | null, currency: string): string {
  if (plan === "free" || amount === 0) return "$0";
  if (amount == null) return "—";
  return `$${amount} ${currency}`;
}

export function billingStatusLabel(state: BillingLifecycleState): string {
  switch (state) {
    case "FREE":
      return "خطة مجانية";
    case "ACTIVE":
      return "نشط";
    case "PAST_DUE":
      return "متأخر — يلزم متابعة الدفع";
    case "CANCEL_AT_PERIOD_END":
      return "تم إيقاف التجديد التلقائي";
    case "PROVIDER_CONFIRMATION_PENDING":
      return "طلب إيقاف التجديد — بانتظار تأكيد المزود";
    case "CANCELLED":
      return "ملغى";
    case "EXPIRED":
      return "منتهٍ";
    case "REFUNDED":
      return "مسترد";
    case "SUSPENDED":
      return "موقوف";
    case "PAYMENT_PROVIDER_UNAVAILABLE":
      return "مزود الدفع غير مربوط بعد";
    default:
      return state;
  }
}

export function billingBannerCopy(
  state: BillingLifecycleState,
  paidPeriodEnd: string | null,
): { title: string; body: string } | null {
  switch (state) {
    case "FREE":
      return null;
    case "CANCEL_AT_PERIOD_END":
    case "PROVIDER_CONFIRMATION_PENDING":
      return {
        title: "تم إيقاف التجديد التلقائي",
        body: `ستبقى مزايا باقتك متاحة حتى ${paidPeriodEnd ? formatBillingDate(paidPeriodEnd) : "نهاية الفترة المدفوعة"}. هذا ليس إنهاء وصول فوري ولا طلب استرداد.`,
      };
    case "PAST_DUE":
      return {
        title: "دفعة متأخرة",
        body: "حالة الاشتراك متأخرة. لا يتم إسقاط الوصول تلقائياً من الواجهة — تُحدَّث الصلاحيات وفق العقد الموثوق من الخادم والمزود لاحقاً.",
      };
    case "EXPIRED":
      return {
        title: "انتهت الباقة المدفوعة",
        body: "حسابك وتقدمك وسجلك محفوظان. الصلاحيات عادت إلى Free حتى التجديد.",
      };
    case "REFUNDED":
      return {
        title: "حالة مستردة",
        body: "تُعرض الحالة وفق سجل الدفع المعتمد. راجع سياسة الاسترداد الرسمية لأي أثر على الوصول.",
      };
    case "PAYMENT_PROVIDER_UNAVAILABLE":
      return {
        title: "ربط مزود الدفع قيد الإعداد",
        body: "لا يمكن إتمام دفع PSP مباشر حالياً. التفعيل التلقائي سيتوفر بعد ربط المزود في مرحلة لاحقة.",
      };
    default:
      return null;
  }
}

export function providerBindingStateLabel():
  | { code: "PROVIDER_BINDING_PENDING" | "PAYMENT_PROVIDER_UNAVAILABLE"; label: string }
  | { code: "BOUND"; label: string } {
  const availability = getPaymentProviderAvailability();
  if (!availability.available) {
    return {
      code: availability.code,
      label: "مزود الدفع غير مربوط بعد — لا تُعرض عناصر تحكم مزود وهمية",
    };
  }
  return { code: "BOUND", label: "مزود الدفع جاهز للربط التشغيلي" };
}

export function paymentHistoryStatusLabel(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "confirmed" || normalized === "approved" || normalized === "succeeded" || normalized === "paid") {
    return "مدفوع";
  }
  if (normalized === "failed" || normalized === "rejected") return "فشل";
  if (normalized === "refunded") return "مسترد";
  if (normalized === "pending" || normalized === "submitted") return "قيد المعالجة";
  return status;
}

export function formatBillingDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-AE", { dateStyle: "medium" }).format(date);
}

export function mapPaymentHistoryRow(row: Record<string, unknown>): PaymentHistoryRow {
  return {
    id: String(row.id ?? ""),
    paidAt: typeof row.paid_at === "string" ? row.paid_at : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    tier: typeof row.tier === "string" ? row.tier : "unknown",
    billingPeriodMonths:
      row.billing_period_months === 3 || row.billing_period_months === 6
        ? row.billing_period_months
        : null,
    amount: typeof row.amount === "number" ? row.amount : Number(row.amount) || 0,
    currency: typeof row.currency === "string" ? row.currency : "USD",
    status: typeof row.status === "string" ? row.status : "unknown",
    provider: typeof row.provider === "string" ? row.provider : null,
  };
}
