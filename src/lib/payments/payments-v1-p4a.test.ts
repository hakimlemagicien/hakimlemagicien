import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FREE_TIER, getPaidTier, getTermOffer } from "../pricing-presentation";
import {
  buildTrustedCheckoutRequest,
  buildProviderUserReference,
  parseProviderUserReference,
} from "./checkout-request";
import { CheckoutStateMachine, canTransitionToSuccessConfirmed, mapBrowserReturnToOutcome } from "./checkout-state";
import {
  getPublicPaidTiers,
  isPublicPaidTier,
  isValidSubscriptionTerm,
  resolveTrustedCatalogPrice,
} from "./catalog";
import {
  buildCheckoutReturnContext,
  buildCheckoutReturnUrl,
  defaultReturnPath,
} from "./return-context";
import {
  isProviderBindingPending,
  resolveProviderProductMappingForPlan,
  resolvePublicProviderProductMapping,
} from "./provider-product-map";
import { getPaymentProviderAvailability } from "./provider-registry";
import { preparePaidCheckout, resolveBrowserCheckoutReturn } from "./payment-service";
import { LEGACY_BANK_TRANSFER_MODE } from "./types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const userId = "11111111-2222-3333-4444-555555555555";

// T1
assert(FREE_TIER.id === "free", "T1 free catalog exists");

// T2–T5
assert(getTermOffer("essential", 3).totalPrice === 87, "T2 essential 3 = $87");
assert(getTermOffer("essential", 6).totalPrice === 149, "T3 essential 6 = $149");
assert(getTermOffer("premium", 3).totalPrice === 147, "T4 premium 3 = $147");
assert(getTermOffer("premium", 6).totalPrice === 249, "T5 premium 6 = $249");

// T6
assert(resolveProviderProductMappingForPlan("vip", 3) === null, "T6 VIP cannot resolve public checkout");
const vipRequest = buildTrustedCheckoutRequest({
  userId,
  plan: "vip",
  termMonths: 3,
  returnContext: buildCheckoutReturnContext("DIRECT_UPGRADE"),
  legalAccepted: true,
});
assert(!vipRequest.ok && vipRequest.code === "CHECKOUT_VIP_BLOCKED", "T6 VIP checkout blocked");

// T7
const invalidPlan = buildTrustedCheckoutRequest({
  userId,
  plan: "enterprise",
  termMonths: 3,
  returnContext: buildCheckoutReturnContext("DIRECT_UPGRADE"),
  legalAccepted: true,
});
assert(!invalidPlan.ok && invalidPlan.code === "CHECKOUT_INVALID_PLAN", "T7 invalid plan rejected");

// T8
const invalidTerm = buildTrustedCheckoutRequest({
  userId,
  plan: "essential",
  termMonths: 12,
  returnContext: buildCheckoutReturnContext("DIRECT_UPGRADE"),
  legalAccepted: true,
});
assert(!invalidTerm.ok && invalidTerm.code === "CHECKOUT_INVALID_TERM", "T8 invalid term rejected");
assert(!isValidSubscriptionTerm(12), "T8 term guard");

// T9
const anon = buildTrustedCheckoutRequest({
  userId: null,
  plan: "essential",
  termMonths: 3,
  returnContext: buildCheckoutReturnContext("DIRECT_UPGRADE"),
  legalAccepted: true,
});
assert(!anon.ok && anon.code === "CHECKOUT_UNAUTHENTICATED", "T9 anonymous paid checkout rejected");

// T10
const accepted = buildTrustedCheckoutRequest({
  userId,
  plan: "premium",
  termMonths: 6,
  returnContext: buildCheckoutReturnContext("BILLING"),
  legalAccepted: true,
});
assert(accepted.ok, "T10 authenticated checkout request accepted structurally");
assert(accepted.ok && accepted.request.amountUsd === 249, "T10 catalog amount resolved");

// T11
const clientAmount = buildTrustedCheckoutRequest({
  userId,
  plan: "essential",
  termMonths: 3,
  returnContext: buildCheckoutReturnContext("DIRECT_UPGRADE"),
  legalAccepted: true,
  clientAmountUsd: 1,
});
assert(!clientAmount.ok && clientAmount.code === "CHECKOUT_CLIENT_AMOUNT_REJECTED", "T11 client amount rejected");

// T12
assert(
  accepted.ok && accepted.request.providerUserReference === buildProviderUserReference(userId),
  "T12 trusted user reference",
);
assert(parseProviderUserReference(`maakfit:${userId}`) === userId, "T12 parse user reference");

// T13
const noLegal = buildTrustedCheckoutRequest({
  userId,
  plan: "essential",
  termMonths: 3,
  returnContext: buildCheckoutReturnContext("DIRECT_UPGRADE"),
  legalAccepted: false,
});
assert(!noLegal.ok && noLegal.code === "LEGAL_ACCEPTANCE_REQUIRED", "T13 legal acceptance required");

// T14–T17 return contexts
const trainingCtx = buildCheckoutReturnContext("TRAINING");
assert(trainingCtx.surface === "TRAINING" && defaultReturnPath("TRAINING").includes("/app/program"), "T14 training");
const nutritionCtx = buildCheckoutReturnContext("NUTRITION");
assert(nutritionCtx.surface === "NUTRITION" && defaultReturnPath("NUTRITION").includes("/app/nutrition"), "T15 nutrition");
const upgradeCtx = buildCheckoutReturnContext("DIRECT_UPGRADE");
assert(upgradeCtx.surface === "DIRECT_UPGRADE" && defaultReturnPath("DIRECT_UPGRADE") === "/app/upgrade", "T16 direct upgrade");
const billingCtx = buildCheckoutReturnContext("BILLING");
assert(billingCtx.surface === "BILLING" && defaultReturnPath("BILLING") === "/app/billing", "T17 billing");
assert(buildCheckoutReturnUrl(billingCtx).includes("checkout=return"), "T17 return url marker");

// T18
const providerAvailability = getPaymentProviderAvailability();
assert(!providerAvailability.available, "T18 missing provider fails safely in test env");
const preparedUnavailable = preparePaidCheckout({
  userId,
  plan: "essential",
  termMonths: 3,
  returnContext: buildCheckoutReturnContext("DIRECT_UPGRADE"),
  legalAccepted: true,
});
assert(
  !preparedUnavailable.ok &&
    (preparedUnavailable.code === "PAYMENT_PROVIDER_UNAVAILABLE" ||
      preparedUnavailable.code === "PROVIDER_BINDING_PENDING"),
  "T18 prepare fails without live provider binding",
);

// T19
const mapping = resolvePublicProviderProductMapping("essential", 3);
assert(isProviderBindingPending(mapping), "T19 missing provider mapping fails safely (binding pending)");
assert(mapping.providerPriceId === null, "T19 no fake paddle price id");

// T20
const browserReturn = resolveBrowserCheckoutReturn(false);
assert(browserReturn.trustedActivation === false, "T20 browser return cannot activate membership");
assert(browserReturn.outcome === "CONFIRMATION_DELAYED", "T20 delayed confirmation");
assert(mapBrowserReturnToOutcome(true) === "CANCELLED", "T20 cancelled return");
assert(!canTransitionToSuccessConfirmed(false), "T20 no success without provider event");

// T21 — RPC is service_role only in migration
const p3Migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260831130100_payments_v1_staging_runtime_hardening.sql"),
  "utf8",
);
assert(
  p3Migration.includes("REVOKE ALL ON FUNCTION public.apply_provider_subscription_event") &&
    p3Migration.includes("GRANT EXECUTE ON FUNCTION public.apply_provider_subscription_event(JSONB) TO service_role"),
  "T21 client cannot invoke apply_provider_subscription_event",
);

// T22 — internal VIP catalog remains
assert(getPaidTier("vip").id === "vip", "T22 VIP internal tier intact");
assert(getTermOffer("vip", 3).totalPrice === 397, "T22 VIP pricing catalog intact");
assert(getPublicPaidTiers().every((t) => isPublicPaidTier(t.id)), "T22 public tiers exclude VIP");

// Catalog contract
assert(getPublicPaidTiers().length === 2, "single public paid catalog surface");
assert(
  resolveTrustedCatalogPrice("essential", 3).amountUsd === 87,
  "catalog resolves trusted price",
);

// State machine
const machine = new CheckoutStateMachine();
assert(machine.state === "IDLE", "checkout idle");
machine.transition("PREPARING");
machine.transition("READY");
assert(machine.state === "READY", "checkout ready state");

// Legacy bank mode
assert(LEGACY_BANK_TRANSFER_MODE === "LEGACY_ONLY", "legacy bank classified");

// Security — no webhook secret in vite env names used by payments module
const envExample = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
assert(!envExample.includes("VITE_PADDLE_WEBHOOK"), "no webhook secret in VITE vars");
assert(envExample.includes("VITE_PADDLE_PRICE_ESSENTIAL_3"), "env contract essential 3");
assert(!envExample.includes("VITE_PADDLE_PRICE_TRANSFORM"), "legacy transform env removed");

console.log("payments-v1-p4a.test.ts: all T1–T22 assertions passed");
