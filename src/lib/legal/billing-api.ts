import { supabase } from "@/integrations/supabase/client";
import type { PaidTierId, SubscriptionTermMonths } from "@/lib/pricing-presentation";
import { mapPaymentHistoryRow, type PaymentHistoryRow } from "@/lib/payments/billing-present";

export type BillingSnapshot = {
  plan: PaidTierId | "free" | "admin" | "vip" | string;
  billingPeriodMonths: SubscriptionTermMonths | null;
  priceAmount: number | null;
  currency: string;
  status: string;
  subscriptionStatus: string | null;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  nextRenewalAt: string | null;
  paidPeriodEnd: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  provider: string | null;
  providerConfirmationPending: boolean;
  paymentSucceededAt: string | null;
  subscriptionActivatedAt: string | null;
  premiumAccessGrantedAt: string | null;
  personalProgramStartedAt: string | null;
  personalProgramDeliveredAt: string | null;
};

export type CancelRenewalResult = {
  ok?: boolean;
  cancelAtPeriodEnd?: boolean;
  paidPeriodEnd?: string | null;
  providerConfirmationPending?: boolean;
};

export async function fetchMyBilling(): Promise<BillingSnapshot | null> {
  const { data, error } = await supabase.rpc("get_my_billing");
  if (error) {
    console.warn("[fetchMyBilling]", error.message);
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const months =
    row.billing_period_months === 6 || row.billing_period_months === 3
      ? (row.billing_period_months as SubscriptionTermMonths)
      : null;
  return {
    plan: String(row.plan ?? row.tier ?? "free"),
    billingPeriodMonths: months,
    priceAmount: typeof row.price_amount === "number" ? row.price_amount : Number(row.price_amount) || null,
    currency: typeof row.currency === "string" ? row.currency : "USD",
    status: typeof row.status === "string" ? row.status : String(row.subscription_status ?? "unknown"),
    subscriptionStatus:
      typeof row.subscription_status === "string" ? row.subscription_status : typeof row.status === "string" ? row.status : null,
    autoRenew: Boolean(row.auto_renew),
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    nextRenewalAt: typeof row.next_renewal_at === "string" ? row.next_renewal_at : null,
    paidPeriodEnd:
      typeof row.paid_period_end === "string"
        ? row.paid_period_end
        : typeof row.ends_at === "string"
          ? row.ends_at
          : null,
    currentPeriodStart: typeof row.current_period_start === "string" ? row.current_period_start : null,
    currentPeriodEnd:
      typeof row.current_period_end === "string"
        ? row.current_period_end
        : typeof row.paid_period_end === "string"
          ? row.paid_period_end
          : null,
    provider: typeof row.provider === "string" ? row.provider : null,
    providerConfirmationPending: Boolean(row.provider_confirmation_pending),
    paymentSucceededAt: typeof row.payment_succeeded_at === "string" ? row.payment_succeeded_at : null,
    subscriptionActivatedAt: typeof row.subscription_activated_at === "string" ? row.subscription_activated_at : null,
    premiumAccessGrantedAt: typeof row.premium_access_granted_at === "string" ? row.premium_access_granted_at : null,
    personalProgramStartedAt: typeof row.personal_program_started_at === "string" ? row.personal_program_started_at : null,
    personalProgramDeliveredAt:
      typeof row.personal_program_delivered_at === "string" ? row.personal_program_delivered_at : null,
  };
}

export async function fetchMyPaymentHistory(limit = 25): Promise<PaymentHistoryRow[]> {
  const { data, error } = await supabase.rpc("get_my_payment_history", { p_limit: limit });
  if (error) {
    console.warn("[fetchMyPaymentHistory]", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapPaymentHistoryRow(row as Record<string, unknown>));
}

export async function cancelMyRenewal(): Promise<CancelRenewalResult> {
  const { data, error } = await supabase.rpc("cancel_my_renewal");
  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    ok: Boolean(row.ok),
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    paidPeriodEnd: typeof row.paid_period_end === "string" ? row.paid_period_end : null,
    providerConfirmationPending: Boolean(row.provider_confirmation_pending),
  };
}
