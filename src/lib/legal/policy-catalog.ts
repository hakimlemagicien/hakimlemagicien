export const POLICY_VERSION = "v1.0" as const;
export const POLICY_REFERENCE_LANGUAGE: "TBD" = "TBD";
export const LEGAL_ENTITY_STATUS = "TBD" as const;
export const GOVERNING_LAW_STATUS = "TBD" as const;
export const REGISTERED_ADDRESS_STATUS = "TBD" as const;

/** V1 launch: manual membership grant until Paddle provider validation completes. */
export { V1_LAUNCH_MODE, CHECKOUT_SELF_SERVE_ENABLED } from "@/lib/platform/launch-config";

/** Legacy string found in the repo — not the approved MAAKFIT legal entity. */
export const LEGACY_LEGAL_ENTITY_UNVERIFIED = "Hakim Coaching FZ-LLC";

export const CURRENT_SUPPORT_EMAIL = "support@hakimlemagicien.com";
export const CURRENT_SITE_ORIGIN = "https://hakimlemagicien.com";
export const CURRENT_WHATSAPP = "+971505129019";
export const CURRENT_WHATSAPP_URL = "https://wa.me/971505129019";

export const POLICY_EFFECTIVE_DATE_STATUS = "TBD_UNTIL_PUBLIC_RELEASE" as const;

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
    ? `Version ${POLICY_VERSION} · Effective date ${POLICY_EFFECTIVE_DATE_STATUS}`
    : `الإصدار ${POLICY_VERSION} · تاريخ السريان ${POLICY_EFFECTIVE_DATE_STATUS}`;
}
