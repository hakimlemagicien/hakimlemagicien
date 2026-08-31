import { supabase } from "@/integrations/supabase/client";

export type AdminMemberSubscriptionRow = {
  userId: string;
  email: string | null;
  fullName: string | null;
  tier: string;
  subscriptionStatus: string;
  billingPeriodMonths: number | null;
  priceAmount: number | null;
  currency: string | null;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  nextRenewalAt: string | null;
  paidPeriodEnd: string | null;
  provider: string | null;
  isActive: boolean;
  lastPaymentStatus: string | null;
  lastPaymentAt: string | null;
  exceptionState: string | null;
};

export type AdminPspPaymentRow = {
  id: string;
  userId: string;
  email: string | null;
  tier: string | null;
  billingPeriodMonths: number | null;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  providerPaymentId: string | null;
  paidAt: string | null;
  createdAt: string;
  refundedAt: string | null;
};

export type AdminProviderEventRow = {
  id: string;
  provider: string;
  providerEventId: string;
  eventType: string;
  processingStatus: string;
  userId: string | null;
  email: string | null;
  receivedAt: string;
  processedAt: string | null;
  errorCode: string | null;
  errorSummary: string | null;
};

export type AdminPaymentExceptionRow = {
  exceptionId: string;
  exceptionType: string;
  priority: string;
  subjectLabel: string;
  detail: string;
  occurredAt: string;
  href: string;
};

function mapMemberSubscription(row: Record<string, unknown>): AdminMemberSubscriptionRow {
  return {
    userId: String(row.user_id ?? ""),
    email: typeof row.email === "string" ? row.email : null,
    fullName: typeof row.full_name === "string" ? row.full_name : null,
    tier: typeof row.tier === "string" ? row.tier : "unknown",
    subscriptionStatus: typeof row.subscription_status === "string" ? row.subscription_status : "unknown",
    billingPeriodMonths:
      row.billing_period_months === 3 || row.billing_period_months === 6 ? row.billing_period_months : null,
    priceAmount: typeof row.price_amount === "number" ? row.price_amount : Number(row.price_amount) || null,
    currency: typeof row.currency === "string" ? row.currency : null,
    autoRenew: Boolean(row.auto_renew),
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    currentPeriodStart: typeof row.current_period_start === "string" ? row.current_period_start : null,
    currentPeriodEnd: typeof row.current_period_end === "string" ? row.current_period_end : null,
    nextRenewalAt: typeof row.next_renewal_at === "string" ? row.next_renewal_at : null,
    paidPeriodEnd: typeof row.paid_period_end === "string" ? row.paid_period_end : null,
    provider: typeof row.provider === "string" ? row.provider : null,
    isActive: Boolean(row.is_active),
    lastPaymentStatus: typeof row.last_payment_status === "string" ? row.last_payment_status : null,
    lastPaymentAt: typeof row.last_payment_at === "string" ? row.last_payment_at : null,
    exceptionState: typeof row.exception_state === "string" ? row.exception_state : null,
  };
}

export async function fetchAdminMemberSubscriptions(opts?: {
  search?: string;
  offset?: number;
}): Promise<AdminMemberSubscriptionRow[]> {
  const { data, error } = await supabase.rpc("admin_list_member_subscriptions", {
    p_search: opts?.search?.trim() || null,
    p_limit: 25,
    p_offset: Math.max(opts?.offset ?? 0, 0),
  });
  if (error) throw error;
  return (data ?? []).map((row) => mapMemberSubscription(row as Record<string, unknown>));
}

export async function fetchAdminPspPayments(offset = 0): Promise<AdminPspPaymentRow[]> {
  const { data, error } = await supabase.rpc("admin_list_psp_payments", {
    p_limit: 25,
    p_offset: Math.max(offset, 0),
  });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id ?? ""),
      userId: String(r.user_id ?? ""),
      email: typeof r.email === "string" ? r.email : null,
      tier: typeof r.tier === "string" ? r.tier : null,
      billingPeriodMonths:
        r.billing_period_months === 3 || r.billing_period_months === 6 ? r.billing_period_months : null,
      amount: typeof r.amount === "number" ? r.amount : Number(r.amount) || 0,
      currency: typeof r.currency === "string" ? r.currency : "USD",
      status: typeof r.status === "string" ? r.status : "unknown",
      provider: typeof r.provider === "string" ? r.provider : null,
      providerPaymentId: typeof r.provider_payment_id === "string" ? r.provider_payment_id : null,
      paidAt: typeof r.paid_at === "string" ? r.paid_at : null,
      createdAt: typeof r.created_at === "string" ? r.created_at : "",
      refundedAt: typeof r.refunded_at === "string" ? r.refunded_at : null,
    };
  });
}

export async function fetchAdminProviderEvents(opts?: {
  status?: string;
  offset?: number;
}): Promise<AdminProviderEventRow[]> {
  const { data, error } = await supabase.rpc("admin_list_payment_provider_events", {
    p_status: opts?.status?.trim() || null,
    p_limit: 25,
    p_offset: Math.max(opts?.offset ?? 0, 0),
  });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id ?? ""),
      provider: typeof r.provider === "string" ? r.provider : "unknown",
      providerEventId: typeof r.provider_event_id === "string" ? r.provider_event_id : "",
      eventType: typeof r.event_type === "string" ? r.event_type : "",
      processingStatus: typeof r.processing_status === "string" ? r.processing_status : "",
      userId: typeof r.user_id === "string" ? r.user_id : null,
      email: typeof r.email === "string" ? r.email : null,
      receivedAt: typeof r.received_at === "string" ? r.received_at : "",
      processedAt: typeof r.processed_at === "string" ? r.processed_at : null,
      errorCode: typeof r.error_code === "string" ? r.error_code : null,
      errorSummary: typeof r.error_summary === "string" ? r.error_summary : null,
    };
  });
}

export async function fetchAdminPaymentExceptions(): Promise<AdminPaymentExceptionRow[]> {
  const { data, error } = await supabase.rpc("admin_list_payment_exceptions");
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      exceptionId: String(r.exception_id ?? ""),
      exceptionType: typeof r.exception_type === "string" ? r.exception_type : "",
      priority: typeof r.priority === "string" ? r.priority : "normal",
      subjectLabel: typeof r.subject_label === "string" ? r.subject_label : "",
      detail: typeof r.detail === "string" ? r.detail : "",
      occurredAt: typeof r.occurred_at === "string" ? r.occurred_at : "",
      href: typeof r.href === "string" ? r.href : "/admin/payments",
    };
  });
}

export function exceptionTypeLabel(type: string): string {
  if (type === "legacy_bank_pending") return "تحويل بنكي (Legacy)";
  if (type === "subscription_past_due") return "اشتراك متأخر";
  if (type === "cancel_provider_pending") return "إيقاف تجديد بانتظار المزود";
  if (type === "provider_event_failed") return "حدث مزود فاشل";
  if (type === "subscription_refunded") return "اشتراك مسترد";
  return type;
}

export function subscriptionStatusLabel(status: string): string {
  if (status === "active") return "نشط";
  if (status === "past_due") return "متأخر";
  if (status === "cancel_at_period_end") return "إيقاف تجديد";
  if (status === "refunded") return "مسترد";
  if (status === "expired" || status === "inactive") return "منتهٍ";
  return status;
}
