import type {
  PaymentProviderId,
  ProviderCheckoutResult,
  ProviderCheckoutSession,
  ProviderProductMapping,
  PublicPaidTierId,
  TrustedCheckoutRequest,
} from "./types";
import type { SubscriptionTermMonths } from "@/lib/pricing-presentation";

export type ProviderConfiguration = {
  provider: PaymentProviderId;
  configured: boolean;
  clientTokenPresent: boolean;
  bindingReady: boolean;
};

export interface PaymentProviderAdapter {
  readonly id: PaymentProviderId;

  isConfigured(): boolean;

  getConfiguration(): ProviderConfiguration;

  mapProduct(plan: PublicPaidTierId, termMonths: SubscriptionTermMonths): ProviderProductMapping;

  createCheckoutSession(request: TrustedCheckoutRequest): Promise<ProviderCheckoutSession>;

  openCheckout(session: ProviderCheckoutSession): Promise<ProviderCheckoutResult>;

  normalizeCheckoutReturn(params: URLSearchParams): {
    outcome: "PROCESSING" | "CONFIRMATION_DELAYED" | "CANCELLED";
  };
}
