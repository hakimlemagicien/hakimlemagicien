import { getPaidTier, getTermOffer, type PaidTierId, type SubscriptionTermMonths } from "@/lib/pricing-presentation";
import { POLICY_META, POLICY_VERSION } from "./policy-catalog";

export const RENEWAL_REMINDER_MIN_DAYS = 7;

export type BillingPeriodMonths = SubscriptionTermMonths;

export type QuizLegacyTierId = "transform" | "pro" | "vip";

export const QUIZ_TIER_TO_PAID: Record<QuizLegacyTierId, PaidTierId> = {
  transform: "essential",
  pro: "premium",
  vip: "vip",
};

export const PAID_TIER_TO_QUIZ: Record<PaidTierId, QuizLegacyTierId> = {
  essential: "transform",
  premium: "pro",
  vip: "vip",
};

export type CheckoutDisclosure = {
  planId: PaidTierId;
  planName: string;
  billingPeriodMonths: BillingPeriodMonths;
  amount: number;
  currency: "USD";
  renewalAmount: number;
  autoRenew: true;
  renewalReminderDays: typeof RENEWAL_REMINDER_MIN_DAYS;
  termsVersion: string;
  refundPolicyVersion: string;
  privacyVersion: string;
  checkoutDisclosureVersion: string;
  renewalDisclosureVersion: string;
};

export function resolvePaidTierId(id: string | null | undefined): PaidTierId | null {
  if (id === "essential" || id === "premium" || id === "vip") return id;
  if (id === "transform" || id === "pro") return QUIZ_TIER_TO_PAID[id];
  return null;
}

export function buildCheckoutDisclosure(
  planId: PaidTierId,
  billingPeriodMonths: BillingPeriodMonths,
): CheckoutDisclosure {
  const plan = getPaidTier(planId);
  const offer = getTermOffer(planId, billingPeriodMonths);
  return {
    planId,
    planName: plan.name,
    billingPeriodMonths,
    amount: offer.totalPrice,
    currency: "USD",
    renewalAmount: offer.totalPrice,
    autoRenew: true,
    renewalReminderDays: RENEWAL_REMINDER_MIN_DAYS,
    termsVersion: POLICY_META.terms.version,
    refundPolicyVersion: POLICY_META.refund.version,
    privacyVersion: POLICY_META.privacy.version,
    checkoutDisclosureVersion: POLICY_META.checkout_disclosure.version,
    renewalDisclosureVersion: POLICY_META.renewal_disclosure.version,
  };
}

export function renewalReminderDueAt(nextRenewalAt: string | Date): Date {
  const date = typeof nextRenewalAt === "string" ? new Date(nextRenewalAt) : nextRenewalAt;
  const due = new Date(date);
  due.setUTCDate(due.getUTCDate() - RENEWAL_REMINDER_MIN_DAYS);
  return due;
}

export function isRenewalReminderWindowOpen(nextRenewalAt: string | Date, now = new Date()): boolean {
  const due = renewalReminderDueAt(nextRenewalAt);
  return now.getTime() >= due.getTime() && now.getTime() < new Date(nextRenewalAt).getTime();
}

export const CHECKOUT_DISCLOSURE_COPY = {
  ar: (d: CheckoutDisclosure) =>
    `${d.planName} لمدة ${d.billingPeriodMonths} أشهر مقابل ${d.amount} ${d.currency}. يتجدد تلقائياً بنفس السعر (${d.renewalAmount} ${d.currency}) ما لم تُلغِ التجديد. بعد تفعيل الفوترة التلقائية، التذكير قبل التجديد يكون قبل ${d.renewalReminderDays} أيام على الأقل.`,
  en: (d: CheckoutDisclosure) =>
    `${d.planName} for ${d.billingPeriodMonths} months at ${d.amount} ${d.currency}. Renews automatically at the same price (${d.renewalAmount} ${d.currency}) unless you cancel renewal. After automatic billing is enabled, renewal reminders are due at least ${d.renewalReminderDays} days before renewal.`,
};

export { POLICY_VERSION };
