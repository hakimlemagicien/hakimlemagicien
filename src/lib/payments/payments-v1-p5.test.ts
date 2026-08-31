import {
  FREE_ENTITLEMENTS,
  isExerciseUnlockedByEntitlements,
  isMealSlotUnlockedByEntitlements,
  isTrainingPreviewMode,
  mealSwapAllowanceLabel,
  normalizeEntitlements,
  shouldShowPremiumAlternatives,
  canRecordMealSwap,
} from "../platform/entitlements";
import { getPublicPaidTiers } from "../payments/catalog";
import { getTermOffer } from "../pricing-presentation";
import { buildTrustedCheckoutRequest } from "../payments/checkout-request";
import { buildCheckoutReturnContext } from "../payments/return-context";
import { preparePaidCheckout } from "../payments/payment-service";
import { resolveBrowserCheckoutReturn } from "../payments/payment-service";
import { getUpgradeSurfaceCopy } from "@/components/platform/upgrade/upgrade-ui";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const userId = "11111111-2222-3333-4444-555555555555";

// T1–T3 Free training
assert(isTrainingPreviewMode(FREE_ENTITLEMENTS), "T1 free enters training preview mode");
assert(
  isExerciseUnlockedByEntitlements(FREE_ENTITLEMENTS, 0, { isToday: true }),
  "T2 free exercise #1 available",
);
assert(
  !isExerciseUnlockedByEntitlements(FREE_ENTITLEMENTS, 1, { isToday: true }),
  "T3 free exercise #2+ locked",
);

// T8–T12 Nutrition free
assert(!FREE_ENTITLEMENTS.nutrition.fullDay, "T8 free nutrition preview");
assert(
  isMealSlotUnlockedByEntitlements(FREE_ENTITLEMENTS, {
    slotId: "breakfast",
    slotIndex: 0,
    dateKey: "2026-08-31",
    todayKey: "2026-08-31",
  }),
  "T9 one free meal/day",
);
assert(
  !isMealSlotUnlockedByEntitlements(FREE_ENTITLEMENTS, {
    slotId: "lunch",
    slotIndex: 1,
    dateKey: "2026-08-31",
    todayKey: "2026-08-31",
  }),
  "T10 remaining meals locked",
);

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

assert(essential.training.fullSession, "T13 essential complete training");
assert(essential.nutrition.fullDay, "T14 essential complete nutrition");
assert(mealSwapAllowanceLabel(essential)?.includes("1"), "T15 essential one swap/day");
assert(!canRecordMealSwap({ ...essential, nutrition: { ...essential.nutrition, swapsRemainingToday: 0 } }), "T16 second swap blocked");

const premium = normalizeEntitlements({
  tier: "premium",
  is_paid: true,
  training: { full_session: true },
  nutrition: { full_day: true, daily_swap_limit: null, multiple_alternatives: true },
  coach_chat: false,
});

assert(premium.training.fullSession, "T18 premium training");
assert(shouldShowPremiumAlternatives(premium), "T19 premium alternatives when supplied");
assert(!premium.coachChat, "T20 premium no coach chat");

// T21–T29 upgrade surfaces
assert(getPublicPaidTiers().length === 2, "T29 VIP absent public upgrade");
assert(getUpgradeSurfaceCopy("TRAINING").title.includes("حصتك"), "T7 training context copy");
assert(getUpgradeSurfaceCopy("NUTRITION").cta.includes("غذ"), "T12 nutrition context");

// T32–T35 pricing
assert(getTermOffer("essential", 3).totalPrice === 87, "T32");
assert(getTermOffer("essential", 6).totalPrice === 149, "T33");
assert(getTermOffer("premium", 3).totalPrice === 147, "T34");
assert(getTermOffer("premium", 6).totalPrice === 249, "T35");

// T36–T38 checkout
const noLegal = buildTrustedCheckoutRequest({
  userId,
  plan: "essential",
  termMonths: 3,
  returnContext: buildCheckoutReturnContext("DIRECT_UPGRADE"),
  legalAccepted: false,
});
assert(!noLegal.ok, "T36 legal required");

const provider = preparePaidCheckout({
  userId,
  plan: "premium",
  termMonths: 3,
  returnContext: buildCheckoutReturnContext("BILLING"),
  legalAccepted: true,
});
assert(!provider.ok, "T37 missing provider fails safely");

const browser = resolveBrowserCheckoutReturn(false);
assert(browser.trustedActivation === false, "T38 browser success cannot grant");

// T30–T31 VIP public blocked
const vipCheckout = buildTrustedCheckoutRequest({
  userId,
  plan: "vip",
  termMonths: 3,
  returnContext: buildCheckoutReturnContext("DIRECT_UPGRADE"),
  legalAccepted: true,
});
assert(!vipCheckout.ok && vipCheckout.code === "CHECKOUT_VIP_BLOCKED", "T31 VIP checkout blocked");

console.log("payments-v1-p5.test.ts: core T1–T38 assertions passed");
