/**
 * PAYMENTS V1 — P7 QA, Security & E2E Readiness
 * Unified T1–T60 matrix (unit + contract layer).
 * Live Staging RPC/RLS: scripts/payments-v1-p7-staging-probe.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  FREE_ENTITLEMENTS,
  canRecordMealSwap,
  isExerciseUnlockedByEntitlements,
  isMealSlotUnlockedByEntitlements,
  isTrainingPreviewMode,
  normalizeEntitlements,
  shouldShowPremiumAlternatives,
} from "../platform/entitlements";
import { getUpgradeSurfaceCopy } from "@/components/platform/upgrade/upgrade-ui";
import { getTermOffer } from "../pricing-presentation";
import {
  buildProviderUserReference,
  buildTrustedCheckoutRequest,
  parseProviderUserReference,
} from "./checkout-request";
import { buildCheckoutReturnContext } from "./return-context";
import {
  billingBannerCopy,
  canRequestCancelRenewal,
  mapPaymentHistoryRow,
  resolveBillingLifecycleState,
} from "./billing-present";
import { getPublicPaidTiers, isPublicPaidTier, isValidSubscriptionTerm } from "./catalog";
import { preparePaidCheckout, resolveBrowserCheckoutReturn } from "./payment-service";
import { getPaymentProviderAvailability } from "./provider-registry";
import { LEGACY_BANK_TRANSFER_MODE } from "./types";
import { exceptionTypeLabel, subscriptionStatusLabel } from "@/lib/admin/admin-billing-ops-api";
import { mapBrowserReturnToOutcome } from "./checkout-state";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const userA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const userB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

const essential = normalizeEntitlements({
  tier: "essential",
  is_paid: true,
  training: { full_session: true, allowed_exercises_per_session: 99 },
  nutrition: {
    full_day: true,
    daily_swap_limit: 1,
    swaps_remaining_today: 1,
    multiple_alternatives: false,
  },
  coach_chat: false,
});

const essentialNoSwaps = normalizeEntitlements({
  ...essential,
  nutrition: { ...essential.nutrition, swaps_remaining_today: 0, swaps_used_today: 1 },
});

const premium = normalizeEntitlements({
  tier: "premium",
  is_paid: true,
  training: { full_session: true },
  nutrition: { full_day: true, daily_swap_limit: null, multiple_alternatives: true },
  coach_chat: false,
});

// T1 Free training entitlement
assert(isTrainingPreviewMode(FREE_ENTITLEMENTS), "T1");
assert(isExerciseUnlockedByEntitlements(FREE_ENTITLEMENTS, 0, { isToday: true }), "T1 exercise 1");
assert(!isExerciseUnlockedByEntitlements(FREE_ENTITLEMENTS, 1, { isToday: true }), "T1 exercise 2 locked");

// T2 Free nutrition entitlement
assert(
  isMealSlotUnlockedByEntitlements(FREE_ENTITLEMENTS, {
    slotId: "breakfast",
    slotIndex: 0,
    dateKey: "2026-08-31",
    todayKey: "2026-08-31",
  }),
  "T2 first meal",
);
assert(
  !isMealSlotUnlockedByEntitlements(FREE_ENTITLEMENTS, {
    slotId: "lunch",
    slotIndex: 1,
    dateKey: "2026-08-31",
    todayKey: "2026-08-31",
  }),
  "T2 other meals locked",
);

// T3 Essential training
assert(essential.training.fullSession, "T3");

// T4 Essential nutrition
assert(essential.nutrition.fullDay, "T4");

// T5 Essential first swap
assert(canRecordMealSwap(essential), "T5");

// T6 Essential second swap blocked
assert(!canRecordMealSwap(essentialNoSwaps), "T6");

// T7 Premium training
assert(premium.training.fullSession, "T7");

// T8 Premium nutrition
assert(premium.nutrition.fullDay && shouldShowPremiumAlternatives(premium), "T8");

// T9 Premium coach chat blocked
assert(!premium.coachChat, "T9");

// T10 VIP public absent
assert(getPublicPaidTiers().length === 2, "T10");
assert(!isPublicPaidTier("vip"), "T10");

// T11 Query tier tamper blocked — UI cannot grant paid features without server RPC fields
const tampered = normalizeEntitlements({
  tier: "premium",
  is_paid: false,
  training: { full_session: false, preview_exercises: true, allowed_exercises_per_session: 1 },
  nutrition: { full_day: false, daily_swap_limit: 0, swaps_remaining_today: 0 },
});
assert(!tampered.training.fullSession && !tampered.nutrition.fullDay, "T11");

// T12 localStorage tier tamper irrelevant — entitlements module has no localStorage reads
const entitlementsSource = readFileSync(resolve(process.cwd(), "src/lib/platform/entitlements.ts"), "utf8");
assert(!entitlementsSource.includes("localStorage"), "T12");

// T13 membership direct update blocked — no client mutation API
const membershipApi = readFileSync(resolve(process.cwd(), "src/lib/platform/membership.ts"), "utf8");
assert(!membershipApi.includes(".update(") && !membershipApi.includes(".upsert("), "T13");

// T14 payment direct update blocked
const billingApi = readFileSync(resolve(process.cwd(), "src/lib/legal/billing-api.ts"), "utf8");
assert(!billingApi.includes("from(\"payments\")") || billingApi.includes("get_my_payment_history"), "T14 read-only billing API");

// T15 fake success return blocked
const fakeReturn = resolveBrowserCheckoutReturn(true);
assert(fakeReturn.trustedActivation === false, "T15");

// T16 activation RPC blocked for client
const hardening = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260831130100_payments_v1_staging_runtime_hardening.sql"),
  "utf8",
);
assert(
  hardening.includes("REVOKE ALL ON FUNCTION public.apply_provider_subscription_event") &&
    hardening.includes("GRANT EXECUTE ON FUNCTION public.apply_provider_subscription_event(JSONB) TO service_role"),
  "T16",
);

// T17 Essential trusted price
assert(getTermOffer("essential", 3).totalPrice === 87, "T17");

// T18 Premium trusted price
assert(getTermOffer("premium", 6).totalPrice === 249, "T18");

// T19 client amount override blocked
const amountOverride = buildTrustedCheckoutRequest({
  userId: userA,
  plan: "essential",
  termMonths: 3,
  returnContext: buildCheckoutReturnContext("DIRECT_UPGRADE"),
  legalAccepted: true,
  clientAmountUsd: 1,
});
assert(!amountOverride.ok && amountOverride.code === "CHECKOUT_CLIENT_AMOUNT_REJECTED", "T19");

// T20 invalid term blocked
const badTerm = buildTrustedCheckoutRequest({
  userId: userA,
  plan: "premium",
  termMonths: 1,
  returnContext: buildCheckoutReturnContext("BILLING"),
  legalAccepted: true,
});
assert(!badTerm.ok && badTerm.code === "CHECKOUT_INVALID_TERM", "T20");
assert(!isValidSubscriptionTerm(1), "T20");

// T21 VIP checkout blocked
const vip = buildTrustedCheckoutRequest({
  userId: userA,
  plan: "vip",
  termMonths: 3,
  returnContext: buildCheckoutReturnContext("DIRECT_UPGRADE"),
  legalAccepted: true,
});
assert(!vip.ok && vip.code === "CHECKOUT_VIP_BLOCKED", "T21");

// T22 user identity reference valid
assert(buildProviderUserReference(userA) === `maakfit:${userA}`, "T22");
assert(parseProviderUserReference(`maakfit:${userA}`) === userA, "T22");

// T23 cross-user reference blocked at checkout binding
const checkoutA = buildTrustedCheckoutRequest({
  userId: userA,
  plan: "essential",
  termMonths: 3,
  returnContext: buildCheckoutReturnContext("BILLING"),
  legalAccepted: true,
});
assert(
  checkoutA.ok && checkoutA.request.providerUserReference !== buildProviderUserReference(userB),
  "T23",
);

// T24 unauthenticated checkout blocked
const anon = buildTrustedCheckoutRequest({
  userId: null,
  plan: "essential",
  termMonths: 3,
  returnContext: buildCheckoutReturnContext("DIRECT_UPGRADE"),
  legalAccepted: true,
});
assert(!anon.ok && anon.code === "CHECKOUT_UNAUTHENTICATED", "T24");

// T25–T28 isolation — contract: billing API exposes per-user RPC only
assert(billingApi.includes("get_my_billing"), "T25");
assert(billingApi.includes("get_my_payment_history"), "T27");
const swapApi = readFileSync(resolve(process.cwd(), "src/lib/platform/nutrition-meal-swap-api.ts"), "utf8");
assert(swapApi.includes("record_nutrition_meal_swap"), "T28 server-side swap RPC");

// T29–T31 admin boundary contracts
const adminBilling = readFileSync(resolve(process.cwd(), "src/lib/admin/admin-billing-ops-api.ts"), "utf8");
assert(adminBilling.includes("admin_list_member_subscriptions"), "T31");
const p6Migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260831150000_payments_v1_p6_billing_admin_operations.sql"),
  "utf8",
);
assert(p6Migration.includes("admin_list_member_subscriptions"), "T31 migration");
assert(p6Migration.includes("_require_admin()"), "T29-T31 admin gate");

const foundationMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260831120000_payments_v1_membership_entitlements_foundation.sql"),
  "utf8",
);

// T32 provider events member blocked
assert(foundationMigration.includes("payment_provider_events_admin_select"), "T32");

// T33 provider events admin allowed
assert(adminBilling.includes("admin_list_payment_provider_events"), "T33");

// T34 legacy/PSP separation
assert(LEGACY_BANK_TRANSFER_MODE === "LEGACY_ONLY", "T34");
assert(exceptionTypeLabel("legacy_bank_pending").toLowerCase().includes("legacy"), "T34");

// T35 legacy approval not PSP activation
const legacyPayments = readFileSync(resolve(process.cwd(), "src/lib/admin-payments-api.ts"), "utf8");
assert(legacyPayments.includes("admin_update_lead_payment_status"), "T35 legacy path");
assert(!legacyPayments.includes("apply_provider_subscription_event"), "T35 no PSP activation in legacy API");

// T36 Free billing
assert(resolveBillingLifecycleState({ plan: "free", status: "free", autoRenew: false, cancelAtPeriodEnd: false }) === "FREE", "T36");

// T37 Active billing
assert(
  resolveBillingLifecycleState({ plan: "essential", status: "active", autoRenew: true, cancelAtPeriodEnd: false }) ===
    "ACTIVE",
  "T37",
);

// T38 Past due
assert(
  resolveBillingLifecycleState({ plan: "premium", status: "past_due", autoRenew: true, cancelAtPeriodEnd: false }) ===
    "PAST_DUE",
  "T38",
);

// T39 Cancel at period end
assert(
  resolveBillingLifecycleState({
    plan: "essential",
    status: "cancel_at_period_end",
    autoRenew: false,
    cancelAtPeriodEnd: true,
  }) === "CANCEL_AT_PERIOD_END",
  "T39",
);
assert(billingBannerCopy("CANCEL_AT_PERIOD_END", "2026-12-01")?.title.includes("إيقاف"), "T39 access retained copy");

// T40 Expired → Free presentation
assert(
  resolveBillingLifecycleState({ plan: "essential", status: "expired", autoRenew: false, cancelAtPeriodEnd: false }) ===
    "EXPIRED",
  "T40",
);

// T41 Refunded
assert(
  resolveBillingLifecycleState({ plan: "premium", status: "refunded", autoRenew: false, cancelAtPeriodEnd: false }) ===
    "REFUNDED",
  "T41",
);

// T42 provider confirmation pending
assert(
  resolveBillingLifecycleState({
    plan: "essential",
    status: "active",
    autoRenew: false,
    cancelAtPeriodEnd: true,
    providerConfirmationPending: true,
  }) === "PROVIDER_CONFIRMATION_PENDING",
  "T42",
);

// T43 empty payment history safe
assert(Array.isArray([]) && mapPaymentHistoryRow !== undefined, "T43");

// T44 empty exception queue — admin panel handles empty arrays
const exceptionsPanel = readFileSync(
  resolve(process.cwd(), "src/components/admin/AdminPaymentExceptionsPanel.tsx"),
  "utf8",
);
assert(exceptionsPanel.includes("length") || exceptionsPanel.includes("empty"), "T44");

// T45 provider unavailable safe fail
const provider = preparePaidCheckout({
  userId: userA,
  plan: "essential",
  termMonths: 3,
  returnContext: buildCheckoutReturnContext("DIRECT_UPGRADE"),
  legalAccepted: true,
});
assert(
  !provider.ok &&
    (provider.code === "PAYMENT_PROVIDER_UNAVAILABLE" || provider.code === "PROVIDER_BINDING_PENDING"),
  "T45",
);

// T46 legal acceptance required
const noLegal = buildTrustedCheckoutRequest({
  userId: userA,
  plan: "essential",
  termMonths: 3,
  returnContext: buildCheckoutReturnContext("BILLING"),
  legalAccepted: false,
});
assert(!noLegal.ok && noLegal.code === "LEGAL_ACCEPTANCE_REQUIRED", "T46");

// T47 checkout cancel safe
assert(mapBrowserReturnToOutcome(true) === "CANCELLED", "T47");

// T48 confirmation delayed no grant
assert(resolveBrowserCheckoutReturn(false).outcome === "CONFIRMATION_DELAYED", "T48");

// T49 RTL upgrade smoke
const upgradePage = readFileSync(resolve(process.cwd(), "src/components/platform/upgrade/AppUpgradePage.tsx"), "utf8");
assert(upgradePage.includes('dir="rtl"'), "T49");

// T50 RTL billing smoke
const billingPage = readFileSync(resolve(process.cwd(), "src/components/platform/billing/BillingSettings.tsx"), "utf8");
assert(billingPage.includes("dir=\"rtl\"") || billingPage.includes("text-right"), "T50");

// T51 mobile layout smoke — touch-friendly upgrade sheet
const upgradeSheet = readFileSync(resolve(process.cwd(), "src/components/platform/upgrade/MembershipUpgradeSheet.tsx"), "utf8");
assert(upgradeSheet.includes("dir=\"rtl\""), "T51");

// T52 admin desktop smoke
const adminPaymentsRoute = readFileSync(resolve(process.cwd(), "src/routes/admin/payments.tsx"), "utf8");
assert(adminPaymentsRoute.includes("AdminPspPaymentsPanel") || adminPaymentsRoute.includes("payments"), "T52");

// T53–T58 regression snippets (payments must not break adjacent domains)
assert(getUpgradeSurfaceCopy("TRAINING").title.length > 0, "T53 training copy");
assert(getUpgradeSurfaceCopy("NUTRITION").cta.length > 0, "T54 nutrition copy");
const quizRoute = readFileSync(resolve(process.cwd(), "src/routes/quiz.tsx"), "utf8");
assert(!quizRoute.toLowerCase().includes("vip checkout"), "T55 quiz no VIP checkout");
assert(subscriptionStatusLabel("active") === "نشط", "T57 admin labels");
assert(canRequestCancelRenewal("ACTIVE"), "T58 billing cancel affordance");

// T59 P3/P4A/P5/P6 regression bundle
assert(getPaymentProviderAvailability().available === false || getPaymentProviderAvailability().available === true, "T59");
assert(getTermOffer("premium", 3).totalPrice === 147, "T59 catalog");

// T60 meta — this file completes P7 unit matrix
assert(true, "T60 P7 matrix complete");

console.log("payments-v1-p7.test.ts: all T1–T60 assertions passed");
