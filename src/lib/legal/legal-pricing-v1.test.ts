import { PAID_TIERS, getTermOffer } from "../pricing-presentation";
import { CHECKOUT_CONSENT_COPY, LEGAL_ENTITY_STATUS, GOVERNING_LAW_STATUS, POLICY_VERSION } from "./policy-catalog";
import { getLegalDocument } from "./policy-content";
import {
  QUIZ_TIER_TO_PAID,
  RENEWAL_REMINDER_MIN_DAYS,
  buildCheckoutDisclosure,
  isRenewalReminderWindowOpen,
  resolvePaidTierId,
} from "./billing";
import { resolveActiveQuizStep } from "../quiz-step-progress";
import { isForbiddenSupportContent } from "./support-guards";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(resolveActiveQuizStep("offlinePackages") === "pricing", "in-person packages are not an active offering");
assert(resolveActiveQuizStep("trainingType") === "pricing", "in-person training type is not an active offering");
assert(resolveActiveQuizStep("pricingDubai") === "pricing", "dubai pricing step is not an active offering");
assert(resolveActiveQuizStep("pricing") === "pricing", "digital pricing remains");
assert(getTermOffer("essential", 3).totalPrice === 87, "essential 3mo");
assert(getTermOffer("essential", 6).totalPrice === 149, "essential 6mo");
assert(getTermOffer("premium", 3).totalPrice === 147, "premium 3mo");
assert(getTermOffer("premium", 6).totalPrice === 249, "premium 6mo");
assert(getTermOffer("vip", 3).totalPrice === 397, "vip 3mo");
assert(getTermOffer("vip", 6).totalPrice === 647, "vip 6mo");
assert(
  PAID_TIERS.every((tier) => !tier.features.some((f) => /24\/7/.test(f) && !/ليس|not/i.test(f))),
  "no 24/7 claim",
);
assert(!PAID_TIERS.some((tier) => /unlimited/i.test(tier.features.join(" "))), "no unlimited coaching");

assert(resolvePaidTierId("transform") === "essential", "legacy transform maps to essential");
assert(QUIZ_TIER_TO_PAID.pro === "premium", "legacy pro maps to premium");

const checkout = buildCheckoutDisclosure("premium", 3);
assert(checkout.amount === 147 && checkout.renewalAmount === 147, "renewal price visible");
assert(checkout.autoRenew === true, "auto renew disclosed");
assert(checkout.renewalReminderDays === RENEWAL_REMINDER_MIN_DAYS, "7 day reminder");

const soon = new Date();
soon.setUTCDate(soon.getUTCDate() + 3);
assert(isRenewalReminderWindowOpen(soon.toISOString(), new Date()), "reminder window open inside 7 days");

assert(LEGAL_ENTITY_STATUS === "TBD", "do not invent legal entity");
assert(GOVERNING_LAW_STATUS === "TBD", "do not invent governing law");
assert(POLICY_VERSION === "v1.0", "policy version");
assert(CHECKOUT_CONSENT_COPY.ar.includes("MAAKFIT"), "official consent copy");

const termsAr = getLegalDocument("terms", "ar");
const termsEn = getLegalDocument("terms", "en");
assert(termsAr.sections.length >= 10 && termsEn.sections.length >= 10, "terms bilingual");
assert(termsAr.title.includes("MAAKFIT") && termsEn.title.includes("MAAKFIT"), "product brand");
assert(!termsAr.sections.some((s) => s.body.join(" ").includes("FZ-LLC")), "no legacy entity in terms");
assert(!getLegalDocument("privacy", "ar").sections.some((s) => /100%\s*secure|آمنة 100%/i.test(s.body.join(" "))), "no 100% secure claim");
assert(getLegalDocument("refund", "ar").sections.some((s) => s.body.join(" ").includes("14")), "14 day eligible window");
assert(!getLegalDocument("refund", "ar").title.includes("ضمان استرجاع"), "not a money-back guarantee title");

assert(isForbiddenSupportContent("card number 4242424242424242"), "reject card numbers");
assert(!isForbiddenSupportContent("أحتاج مساعدة في تفعيل الباقة"), "allow normal support text");

console.log("legal-pricing-v1 tests passed");
