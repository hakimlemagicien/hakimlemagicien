import { getTermOffer } from "@/lib/pricing-presentation";
import type {
  PaymentProviderId,
  ProviderBindingStatus,
  ProviderProductMapping,
  PublicPaidTierId,
} from "./types";
import type { SubscriptionTermMonths } from "@/lib/pricing-presentation";
import { isPublicPaidTier } from "./catalog";

const PADDLE_PRICE_ENV: Record<
  PublicPaidTierId,
  Record<SubscriptionTermMonths, string>
> = {
  essential: {
    3: "VITE_PADDLE_PRICE_ESSENTIAL_3",
    6: "VITE_PADDLE_PRICE_ESSENTIAL_6",
  },
  premium: {
    3: "VITE_PADDLE_PRICE_PREMIUM_3",
    6: "VITE_PADDLE_PRICE_PREMIUM_6",
  },
};

function readViteEnv(name: string): string | undefined {
  const env =
    typeof import.meta !== "undefined" && import.meta.env
      ? (import.meta.env as Record<string, string | undefined>)
      : undefined;
  return env?.[name]?.trim() || undefined;
}

function resolvePaddlePriceId(plan: PublicPaidTierId, termMonths: SubscriptionTermMonths): string | null {
  const envName = PADDLE_PRICE_ENV[plan][termMonths];
  return readViteEnv(envName) ?? null;
}

export function resolvePublicProviderProductMapping(
  plan: PublicPaidTierId,
  termMonths: SubscriptionTermMonths,
  provider: PaymentProviderId = "paddle",
): ProviderProductMapping {
  const offer = getTermOffer(plan, termMonths);
  const providerPriceId =
    provider === "paddle" ? resolvePaddlePriceId(plan, termMonths) : null;
  const bindingStatus: ProviderBindingStatus = providerPriceId
    ? "BOUND"
    : "PROVIDER_BINDING_PENDING";

  return {
    provider,
    plan,
    termMonths,
    amountUsd: offer.totalPrice,
    currency: "USD",
    providerPriceId,
    bindingStatus,
  };
}

/** VIP and other non-public tiers must not resolve to a public provider checkout mapping. */
export function resolveProviderProductMappingForPlan(
  plan: string,
  termMonths: SubscriptionTermMonths,
  provider: PaymentProviderId = "paddle",
): ProviderProductMapping | null {
  if (!isPublicPaidTier(plan)) {
    return null;
  }
  return resolvePublicProviderProductMapping(plan, termMonths, provider);
}

export function isProviderBindingPending(mapping: ProviderProductMapping): boolean {
  return mapping.bindingStatus === "PROVIDER_BINDING_PENDING";
}
