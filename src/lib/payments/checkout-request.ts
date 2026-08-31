import { buildCheckoutDisclosure } from "@/lib/legal/billing";
import {
  isPublicPaidTier,
  isValidSubscriptionTerm,
  resolveTrustedCatalogPrice,
} from "./catalog";
import { buildCheckoutReturnUrl } from "./return-context";
import type {
  CheckoutReturnContext,
  PaymentErrorCode,
  PublicPaidTierId,
  TrustedCheckoutRequest,
} from "./types";
import { PAYMENTS_CATALOG_VERSION } from "./types";

export type CheckoutRequestInput = {
  userId: string | null | undefined;
  plan: string;
  termMonths: number;
  returnContext: CheckoutReturnContext;
  legalAccepted: boolean;
  /** Client-supplied amounts are never trusted. */
  clientAmountUsd?: number;
};

export type CheckoutRequestResult =
  | { ok: true; request: TrustedCheckoutRequest }
  | { ok: false; code: PaymentErrorCode; message: string };

function fail(code: PaymentErrorCode, message: string): CheckoutRequestResult {
  return { ok: false, code, message };
}

export function buildProviderUserReference(userId: string): string {
  return `maakfit:${userId}`;
}

export function parseProviderUserReference(reference: string): string | null {
  const prefix = "maakfit:";
  if (!reference.startsWith(prefix)) return null;
  const userId = reference.slice(prefix.length).trim();
  return userId || null;
}

export function buildTrustedCheckoutRequest(input: CheckoutRequestInput): CheckoutRequestResult {
  if (!input.userId?.trim()) {
    return fail("CHECKOUT_UNAUTHENTICATED", "Paid checkout requires an authenticated MAAKFIT user.");
  }

  if (input.clientAmountUsd !== undefined) {
    return fail(
      "CHECKOUT_CLIENT_AMOUNT_REJECTED",
      "Client-provided amount is not trusted for checkout.",
    );
  }

  if (!input.legalAccepted) {
    return fail("LEGAL_ACCEPTANCE_REQUIRED", "Legal acceptance is required before provider handoff.");
  }

  if (input.plan === "vip") {
    return fail("CHECKOUT_VIP_BLOCKED", "VIP is not available for public Commercial V1 checkout.");
  }

  let plan: PublicPaidTierId;
  if (input.plan === "transform") {
    plan = "essential";
  } else if (input.plan === "pro") {
    plan = "premium";
  } else if (isPublicPaidTier(input.plan)) {
    plan = input.plan;
  } else {
    return fail("CHECKOUT_INVALID_PLAN", `Invalid checkout plan: ${input.plan}`);
  }

  if (!isValidSubscriptionTerm(input.termMonths)) {
    return fail("CHECKOUT_INVALID_TERM", `Invalid subscription term: ${input.termMonths}`);
  }

  const catalog = resolveTrustedCatalogPrice(plan, input.termMonths);
  const disclosure = buildCheckoutDisclosure(plan, input.termMonths);
  const returnUrl = buildCheckoutReturnUrl(input.returnContext);
  const providerUserReference = buildProviderUserReference(input.userId);

  return {
    ok: true,
    request: {
      userId: input.userId,
      plan,
      termMonths: input.termMonths,
      amountUsd: catalog.amountUsd,
      currency: "USD",
      disclosure,
      returnContext: input.returnContext,
      returnUrl,
      catalogVersion: PAYMENTS_CATALOG_VERSION,
      providerUserReference,
    },
  };
}
