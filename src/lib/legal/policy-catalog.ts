import { PRODUCTION_APP_ORIGIN } from "@/lib/env/assert-environment";

export const POLICY_VERSION = "v1.0" as const;
export const POLICY_REFERENCE_LANGUAGE = "ar" as const;
export const LEGAL_OPERATOR = "Abdelhakim Ait Boukrim" as const;
export const OPERATOR_TYPE = "INDIVIDUAL" as const;
export const LEGAL_ENTITY_STATUS = LEGAL_OPERATOR;
export const PUBLIC_LOCATION = "MAG 5, Dubai South, Dubai, United Arab Emirates" as const;
export const REGISTERED_ADDRESS_STATUS = PUBLIC_LOCATION;
export const GOVERNING_LAW_STATUS =
  "the laws of the United Arab Emirates as applicable in the Emirate of Dubai" as const;
export const JURISDICTION = "the courts of Dubai, United Arab Emirates" as const;
export const PAYMENT_PROVIDER_STATUS = "THIRD_PARTY_PAYMENT_PROVIDERS" as const;

/** V1 launch: manual membership grant until payment-provider validation completes. */
export { V1_LAUNCH_MODE, CHECKOUT_SELF_SERVE_ENABLED } from "@/lib/platform/launch-config";

/** Official product support mailbox (maakfit.com). */
export const CURRENT_SUPPORT_EMAIL = "support@maakfit.com";
export const CURRENT_SITE_ORIGIN = PRODUCTION_APP_ORIGIN;
export const CURRENT_WHATSAPP = "+971505129019";
export const CURRENT_WHATSAPP_URL = "https://wa.me/971505129019";

export const POLICY_EFFECTIVE_DATE_STATUS = "2026-10-01" as const;
export const POLICY_EFFECTIVE_DATE_AR = "1 أكتوبر 2026" as const;
export const POLICY_EFFECTIVE_DATE_EN = "October 1, 2026" as const;

export type LegalLocale = "ar" | "en";
export type PolicyKind = "terms" | "privacy" | "refund";

export const LEGAL_ROUTES = {
  privacy: "/privacy",
  terms: "/terms",
  refund: "/refund",
  contact: "/contact",
} as const;

export const CHECKOUT_CONSENT_COPY = {
  ar: "أوافق على شروط وأحكام MAAKFIT وسياسة الاسترداد والإلغاء، وأفهم شروط التجديد الخاصة باشتراكي.",
  en: "I agree to MAAKFIT Terms & Conditions and the Refund & Cancellation Policy, and I understand the renewal terms of my subscription.",
} as const;

export const POLICY_META = {
  terms: { version: POLICY_VERSION, kind: "terms" as const },
  privacy: { version: POLICY_VERSION, kind: "privacy" as const },
  refund: { version: POLICY_VERSION, kind: "refund" as const },
  checkout_disclosure: { version: POLICY_VERSION, kind: "checkout_disclosure" as const },
  renewal_disclosure: { version: POLICY_VERSION, kind: "renewal_disclosure" as const },
} as const;

export function policyLastUpdatedLabel(locale: LegalLocale): string {
  return locale === "en"
    ? `Version ${POLICY_VERSION} · Effective ${POLICY_EFFECTIVE_DATE_EN}`
    : `الإصدار ${POLICY_VERSION} · يسري من ${POLICY_EFFECTIVE_DATE_AR}`;
}
