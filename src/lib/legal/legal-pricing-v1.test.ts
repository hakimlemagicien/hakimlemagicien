import { PAID_TIERS, getTermOffer } from "../pricing-presentation";
import {
  CHECKOUT_CONSENT_COPY,
  CURRENT_SITE_ORIGIN,
  CURRENT_SUPPORT_EMAIL,
  LEGAL_ENTITY_STATUS,
  LEGAL_OPERATOR,
  GOVERNING_LAW_STATUS,
  JURISDICTION,
  PAYMENT_PROVIDER_STATUS,
  POLICY_EFFECTIVE_DATE_STATUS,
  POLICY_REFERENCE_LANGUAGE,
  POLICY_VERSION,
  PUBLIC_LOCATION,
} from "./policy-catalog";
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

assert(
  resolveActiveQuizStep("offlinePackages") === "pricing",
  "in-person packages are not an active offering",
);
assert(
  resolveActiveQuizStep("trainingType") === "pricing",
  "in-person training type is not an active offering",
);
assert(
  resolveActiveQuizStep("pricingDubai") === "pricing",
  "dubai pricing step is not an active offering",
);
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
assert(
  !PAID_TIERS.some((tier) => /unlimited/i.test(tier.features.join(" "))),
  "no unlimited coaching",
);

assert(resolvePaidTierId("transform") === "essential", "legacy transform maps to essential");
assert(QUIZ_TIER_TO_PAID.pro === "premium", "legacy pro maps to premium");

const checkout = buildCheckoutDisclosure("premium", 3);
assert(checkout.amount === 147 && checkout.renewalAmount === 147, "renewal price visible");
assert(checkout.autoRenew === true, "auto renew disclosed");
assert(checkout.renewalReminderDays === RENEWAL_REMINDER_MIN_DAYS, "7 day reminder");

const soon = new Date();
soon.setUTCDate(soon.getUTCDate() + 3);
assert(
  isRenewalReminderWindowOpen(soon.toISOString(), new Date()),
  "reminder window open inside 7 days",
);

assert(LEGAL_OPERATOR === "Abdelhakim Ait Boukrim", "approved individual operator");
assert(LEGAL_ENTITY_STATUS === LEGAL_OPERATOR, "approved individual legal operator");
assert(PUBLIC_LOCATION === "MAG 5, Dubai South, Dubai, United Arab Emirates", "public location");
assert(
  GOVERNING_LAW_STATUS ===
    "the laws of the United Arab Emirates as applicable in the Emirate of Dubai",
  "approved governing law",
);
assert(JURISDICTION === "the courts of Dubai, United Arab Emirates", "approved jurisdiction");
assert(
  PAYMENT_PROVIDER_STATUS === "THIRD_PARTY_PAYMENT_PROVIDERS",
  "payment provider remains generic",
);
assert(POLICY_EFFECTIVE_DATE_STATUS === "2026-10-01", "actual publication date");
assert(POLICY_REFERENCE_LANGUAGE === "ar", "Arabic is the reference language");
assert(POLICY_VERSION === "v1.0", "policy version");
assert(
  CURRENT_SITE_ORIGIN === "https://maakfit.com",
  "legal origin follows canonical product domain",
);
assert(CURRENT_SUPPORT_EMAIL === "support@maakfit.com", "official support mailbox");
assert(
  !CURRENT_SUPPORT_EMAIL.includes("hakimlemagicien.com"),
  "support email cut over from legacy domain",
);
assert(CHECKOUT_CONSENT_COPY.ar.includes("MAAKFIT"), "official consent copy");

const termsAr = getLegalDocument("terms", "ar");
const termsEn = getLegalDocument("terms", "en");
const publicPolicyText = (["terms", "privacy", "refund"] as const)
  .flatMap((kind) => (["ar", "en"] as const).map((locale) => getLegalDocument(kind, locale)))
  .flatMap((document) => [
    document.title,
    document.description,
    ...document.sections.flatMap((section) => [section.title, ...section.body]),
  ])
  .join(" ");
assert(termsAr.sections.length >= 10 && termsEn.sections.length >= 10, "terms bilingual");
assert(termsAr.title.includes("MAAKFIT") && termsEn.title.includes("MAAKFIT"), "product brand");
assert(
  termsAr.sections.some((s) => s.body.join(" ").includes("support@maakfit.com")),
  "terms contact uses maakfit support",
);
assert(
  getLegalDocument("privacy", "ar").sections.some((s) =>
    s.body.join(" ").includes("support@maakfit.com"),
  ),
  "privacy contact uses maakfit support",
);
assert(
  getLegalDocument("refund", "ar").sections.some((s) =>
    s.body.join(" ").includes("support@maakfit.com"),
  ),
  "refund contact uses maakfit support",
);
assert(
  !termsAr.sections.some((s) => s.body.join(" ").includes("FZ-LLC")),
  "no legacy entity in terms",
);
assert(
  !getLegalDocument("privacy", "ar").sections.some((s) =>
    /100%\s*secure|آمنة 100%/i.test(s.body.join(" ")),
  ),
  "no 100% secure claim",
);
assert(
  getLegalDocument("refund", "ar").sections.some((s) => s.body.join(" ").includes("14")),
  "14 day eligible window",
);
assert(
  !getLegalDocument("refund", "ar").title.includes("ضمان استرجاع"),
  "not a money-back guarantee title",
);
assert(
  !/\bTBD\b|TBD_|_PENDING_/i.test(publicPolicyText),
  "no internal placeholder token is public",
);
assert(
  !/Hakim Coaching|support@hakimlemagicien\.com/i.test(publicPolicyText),
  "no legacy public brand or email",
);
assert(
  /Supabase/.test(publicPolicyText) &&
    /Vercel/.test(publicPolicyText) &&
    /Resend/.test(publicPolicyText),
  "actual service providers disclosed",
);
assert(!/Stripe|Paddle/.test(publicPolicyText), "no unselected payment provider named");
assert(
  /FREE/.test(publicPolicyText) && /PLUS/.test(publicPolicyText) && /PRO/.test(publicPolicyText),
  "current public plans are disclosed",
);
assert(
  !/\bVIP\b|\bEssential\b|\bPremium\b|Coaching Chat|Coach Hakim|دردشة الكوتش|الكوتش/i.test(
    publicPolicyText,
  ),
  "no old plan or human-coaching references in public policies",
);
assert(
  !/artificial intelligence|\bAI\b|ذكاء اصطناعي/i.test(publicPolicyText),
  "no unsupported AI claim in public policies",
);
assert(publicPolicyText.includes(LEGAL_OPERATOR), "approved operator is public");
assert(publicPolicyText.includes(PUBLIC_LOCATION), "approved public location is disclosed");
assert(
  publicPolicyText.includes("قوانين دولة الإمارات العربية المتحدة") &&
    publicPolicyText.includes("the laws of the United Arab Emirates"),
  "governing law is bilingual",
);
assert(
  publicPolicyText.includes("محاكم دبي") && publicPolicyText.includes("courts of Dubai"),
  "jurisdiction is bilingual",
);
assert(
  publicPolicyText.includes("1 أكتوبر 2026") && publicPolicyText.includes("October 1, 2026"),
  "effective date is bilingual",
);
assert(
  /الحساسية/.test(publicPolicyText) && /allerg/.test(publicPolicyText),
  "allergy responsibility disclosed",
);
assert(
  /أكواد الخصم/.test(publicPolicyText) && /promo codes/.test(publicPolicyText),
  "promotion and promo code terms disclosed",
);

assert(isForbiddenSupportContent("card number 4242424242424242"), "reject card numbers");
assert(!isForbiddenSupportContent("أحتاج مساعدة في تفعيل الباقة"), "allow normal support text");

console.log("legal-pricing-v1 tests passed");
