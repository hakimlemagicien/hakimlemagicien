import type { AdminOperationsSnapshot } from "@/lib/admin/admin-ops-api";
import type { AdminMemberSubscriptionRow, AdminPaymentExceptionRow } from "@/lib/admin/admin-billing-ops-api";
import {
  formatBillingPrice,
  resolveBillingLifecycleState,
  resolveCatalogPrice,
  type BillingLifecycleState,
} from "@/lib/payments/billing-present";
import type { SubscriptionTermMonths } from "@/lib/pricing-presentation";
import { isInternalVipTier } from "@/lib/admin/admin-client-ops";
import { planLabel } from "@/lib/admin/admin-status";

export type BillingQuickStatus = {
  activeSubscriptions: number;
  needsAttention: number;
  paymentExceptions: number;
  pastDue: number;
  legacyPending: number;
  fromSample: boolean;
  sampleSize: number;
};

export type MembershipFilterState = {
  plan: "all" | "essential" | "premium" | "vip" | "free";
  status: "all" | "active" | "past_due" | "cancel_at_period_end" | "cancelled" | "expired" | "refunded";
  needsAttention: boolean;
  autoRenew: "all" | "yes" | "no";
  provider: "all" | "legacy" | "psp" | "none";
};

export function buildBillingQuickStatus(
  snapshot: AdminOperationsSnapshot,
  memberships: AdminMemberSubscriptionRow[],
  exceptions: AdminPaymentExceptionRow[],
): BillingQuickStatus {
  const pastDue = memberships.filter((row) => row.subscriptionStatus === "past_due").length;
  const needsAttention = memberships.filter(membershipNeedsAttention).length;
  return {
    activeSubscriptions: memberships.filter((row) => row.isActive && row.subscriptionStatus === "active").length,
    needsAttention: Math.max(needsAttention, snapshot.subscriptionAttention),
    paymentExceptions: exceptions.length || snapshot.subscriptionAttention,
    pastDue: Math.max(pastDue, snapshot.subscriptionAttention),
    legacyPending: snapshot.legacyPendingPayments,
    fromSample: true,
    sampleSize: memberships.length,
  };
}

export function membershipNeedsAttention(row: AdminMemberSubscriptionRow): boolean {
  return Boolean(
    row.exceptionState ||
      row.subscriptionStatus === "past_due" ||
      row.subscriptionStatus === "refunded" ||
      (row.cancelAtPeriodEnd && !row.autoRenew),
  );
}

export function resolveMembershipLifecycle(row: AdminMemberSubscriptionRow): BillingLifecycleState {
  if (row.tier === "free") return "FREE";
  return resolveBillingLifecycleState({
    plan: row.tier,
    status: row.subscriptionStatus,
    subscriptionStatus: row.subscriptionStatus,
    autoRenew: row.autoRenew,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    providerConfirmationPending:
      row.cancelAtPeriodEnd && row.subscriptionStatus === "cancel_at_period_end",
  });
}

export function formatMembershipPlanPrice(row: AdminMemberSubscriptionRow): string {
  const term =
    row.billingPeriodMonths === 3 || row.billingPeriodMonths === 6
      ? (row.billingPeriodMonths as SubscriptionTermMonths)
      : null;
  const catalog = resolveCatalogPrice(row.tier, term);
  const stored = formatBillingPrice(row.tier, row.priceAmount, row.currency ?? "USD");
  if (!catalog) return stored;
  const catalogLabel = formatBillingPrice(row.tier, catalog.amount, catalog.currency);
  if (row.priceAmount != null && row.priceAmount !== catalog.amount && row.tier !== "vip") {
    return `${stored} · كتالوج ${catalogLabel}`;
  }
  return stored;
}

export function membershipPlanLabel(tier: string): string {
  if (isInternalVipTier(tier)) return "Internal VIP";
  return planLabel(tier);
}

export function membershipSourceLabel(source: string | null | undefined): string {
  if (!source) return "—";
  const normalized = source.toLowerCase();
  if (normalized.includes("legacy") || normalized.includes("bank")) return "LEGACY-MANUAL";
  if (normalized.includes("provider") || normalized.includes("paddle") || normalized.includes("psp")) {
    return "PROVIDER-VERIFIED";
  }
  if (normalized.includes("internal") || normalized.includes("override") || normalized.includes("vip")) {
    return "INTERNAL-OVERRIDE";
  }
  if (normalized.includes("admin")) return "ADMIN-REQUESTED";
  return source;
}

export function filterMembershipRows(
  rows: AdminMemberSubscriptionRow[],
  filters: MembershipFilterState,
): AdminMemberSubscriptionRow[] {
  return rows.filter((row) => {
    if (filters.plan !== "all" && row.tier !== filters.plan) return false;
    if (filters.status !== "all") {
      if (filters.status === "cancelled" && row.subscriptionStatus !== "cancelled") return false;
      if (filters.status === "expired" && row.subscriptionStatus !== "expired" && row.subscriptionStatus !== "inactive") {
        return false;
      }
      if (
        filters.status !== "cancelled" &&
        filters.status !== "expired" &&
        row.subscriptionStatus !== filters.status
      ) {
        return false;
      }
    }
    if (filters.needsAttention && !membershipNeedsAttention(row)) return false;
    if (filters.autoRenew === "yes" && !(row.autoRenew && !row.cancelAtPeriodEnd)) return false;
    if (filters.autoRenew === "no" && row.autoRenew && !row.cancelAtPeriodEnd) return false;
    if (filters.provider === "legacy" && !(row.provider ?? "").toLowerCase().includes("legacy")) return false;
    if (filters.provider === "psp" && !(row.provider ?? "").toLowerCase().match(/paddle|psp|provider/)) {
      return false;
    }
    if (filters.provider === "none" && row.provider) return false;
    return true;
  });
}

export function providerDisplayLabel(provider: string | null, providerAvailable: boolean): string {
  if (!provider) return "—";
  if (!providerAvailable && provider.toLowerCase().includes("paddle")) {
    return "PROVIDER_BINDING_PENDING";
  }
  return provider;
}

export const OFFICIAL_CATALOG_PRICES = {
  essential3: 87,
  essential6: 149,
  premium3: 147,
  premium6: 249,
} as const;

export function exceptionRecommendedAction(exceptionType: string): string {
  if (exceptionType === "legacy_bank_pending") return "مراجعة التحويل البنكي في Legacy";
  if (exceptionType === "subscription_past_due") return "فتح العميل ومراجعة الفوترة";
  if (exceptionType === "cancel_provider_pending") return "تأكيد حالة الإلغاء — بانتظار المزود";
  if (exceptionType === "provider_event_failed") return "مراجعة حدث المزود";
  if (exceptionType === "subscription_refunded") return "مراجعة سجل الاسترداد";
  return "مراجعة";
}
