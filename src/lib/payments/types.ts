import type { CheckoutDisclosure } from "@/lib/legal/billing";
import type { PaidTierId, SubscriptionTermMonths } from "@/lib/pricing-presentation";

/** Public Commercial V1 paid tiers — VIP excluded. */
export type PublicPaidTierId = "essential" | "premium";

export type PaymentProviderId = "paddle" | "lemon_squeezy";

export type CheckoutReturnSurface =
  | "TRAINING"
  | "NUTRITION"
  | "DIRECT_UPGRADE"
  | "BILLING";

export type CheckoutReturnContext = {
  surface: CheckoutReturnSurface;
  /** Optional in-app path segment after payment (e.g. /app/program/workout). */
  returnPath?: string;
};

export type TrustedCheckoutRequest = {
  userId: string;
  plan: PublicPaidTierId;
  termMonths: SubscriptionTermMonths;
  amountUsd: number;
  currency: "USD";
  disclosure: CheckoutDisclosure;
  returnContext: CheckoutReturnContext;
  returnUrl: string;
  catalogVersion: string;
  providerUserReference: string;
};

export type ProviderBindingStatus = "BOUND" | "PROVIDER_BINDING_PENDING";

export type ProviderProductMapping = {
  provider: PaymentProviderId;
  plan: PublicPaidTierId;
  termMonths: SubscriptionTermMonths;
  amountUsd: number;
  currency: "USD";
  providerPriceId: string | null;
  bindingStatus: ProviderBindingStatus;
};

export type ProviderCheckoutSession = {
  provider: PaymentProviderId;
  bindingStatus: ProviderBindingStatus;
  priceId?: string;
  customData: Record<string, string>;
  customerEmail?: string;
};

export type ProviderCheckoutResult =
  | { ok: true; state: "OPENING" | "READY" }
  | { ok: false; code: PaymentErrorCode; message: string };

export type PaymentErrorCode =
  | "PAYMENT_PROVIDER_UNAVAILABLE"
  | "PROVIDER_BINDING_PENDING"
  | "PROVIDER_MAPPING_MISSING"
  | "CHECKOUT_VALIDATION_FAILED"
  | "CHECKOUT_UNAUTHENTICATED"
  | "CHECKOUT_VIP_BLOCKED"
  | "CHECKOUT_INVALID_PLAN"
  | "CHECKOUT_INVALID_TERM"
  | "CHECKOUT_CLIENT_AMOUNT_REJECTED"
  | "LEGAL_ACCEPTANCE_REQUIRED"
  | "PROVIDER_INITIALIZATION_FAILED";

export type CheckoutState =
  | "IDLE"
  | "PREPARING"
  | "READY"
  | "OPENING"
  | "PROCESSING"
  | "CONFIRMATION_DELAYED"
  | "SUCCESS_CONFIRMED"
  | "FAILED"
  | "CANCELLED";

/** Browser return only — never trusted activation (P5 applies provider events). */
export type CheckoutReturnOutcome = "PROCESSING" | "CONFIRMATION_DELAYED" | "CANCELLED";

export const PAYMENTS_CATALOG_VERSION = "v1.0" as const;

export const LEGACY_BANK_TRANSFER_MODE = "LEGACY_ONLY" as const;

/** Internal tier ids including VIP — for legacy/founder paths only. */
export type InternalPaidTierId = PaidTierId;
