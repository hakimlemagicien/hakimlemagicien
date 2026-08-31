import {
  FREE_TIER,
  getPaidTier,
  getTermOffer,
  PAID_TIERS,
  type PaidTierId,
  type SubscriptionTermMonths,
} from "@/lib/pricing-presentation";
import type { PublicPaidTierId } from "./types";

export const PUBLIC_PAID_TIER_IDS: PublicPaidTierId[] = ["essential", "premium"];

export function isPublicPaidTier(plan: string | null | undefined): plan is PublicPaidTierId {
  return plan === "essential" || plan === "premium";
}

export function assertPublicPaidTier(plan: string): PublicPaidTierId {
  if (!isPublicPaidTier(plan)) {
    throw new Error("CHECKOUT_VIP_BLOCKED");
  }
  return plan;
}

export function getPublicPaidTiers() {
  return PAID_TIERS.filter((tier): tier is typeof tier & { id: PublicPaidTierId } =>
    isPublicPaidTier(tier.id),
  );
}

export function resolveTrustedCatalogPrice(plan: PublicPaidTierId, termMonths: SubscriptionTermMonths) {
  const offer = getTermOffer(plan, termMonths);
  return {
    plan,
    termMonths,
    amountUsd: offer.totalPrice,
    currency: "USD" as const,
    tier: getPaidTier(plan),
    offer,
  };
}

export function isValidSubscriptionTerm(months: number): months is SubscriptionTermMonths {
  return months === 3 || months === 6;
}

export function resolveInternalTier(plan: PaidTierId) {
  return getPaidTier(plan);
}

export { FREE_TIER, getPaidTier, getTermOffer, PAID_TIERS };
