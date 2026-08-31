import type { PaymentProviderAdapter } from "./provider-adapter";
import { paddleAdapter } from "./paddle-adapter";
import type { PaymentProviderId } from "./types";

const ADAPTERS: Record<PaymentProviderId, PaymentProviderAdapter> = {
  paddle: paddleAdapter,
  lemon_squeezy: paddleAdapter, // placeholder until a dedicated adapter exists
};

function readConfiguredProviderId(): PaymentProviderId | null {
  const env =
    typeof import.meta !== "undefined" && import.meta.env
      ? (import.meta.env as Record<string, string | undefined>)
      : undefined;
  const raw = env?.VITE_PAYMENT_PROVIDER?.trim();
  if (raw === "paddle" || raw === "lemon_squeezy") return raw;
  if (raw) return null;
  return "paddle";
}

export function getActivePaymentProvider(): PaymentProviderAdapter | null {
  const id = readConfiguredProviderId();
  if (!id) return null;
  return ADAPTERS[id] ?? null;
}

export function getPaymentProviderAvailability():
  | { available: true; provider: PaymentProviderId }
  | { available: false; code: "PAYMENT_PROVIDER_UNAVAILABLE" } {
  const adapter = getActivePaymentProvider();
  if (!adapter?.isConfigured()) {
    return { available: false, code: "PAYMENT_PROVIDER_UNAVAILABLE" };
  }
  return { available: true, provider: adapter.id };
}
