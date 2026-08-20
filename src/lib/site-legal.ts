import {
  CURRENT_SUPPORT_EMAIL,
  CURRENT_WHATSAPP,
  CURRENT_WHATSAPP_URL,
  LEGAL_ROUTES as CATALOG_LEGAL_ROUTES,
  LEGAL_ENTITY_STATUS,
  GOVERNING_LAW_STATUS,
  POLICY_VERSION,
  policyLastUpdatedLabel,
} from "@/lib/legal/policy-catalog";

/** Product / platform brand (user-facing). */
export const SITE_BRAND = "MAAKFIT";
/** Human coach identity inside MAAKFIT — do not treat as product brand. */
export const SITE_COACH_NAME = "Coach Hakim";
export const SITE_COACH_NAME_AR = "الكوتش حكيم";

/**
 * LEGACY / NEEDS CEO VERIFICATION — do not publish as the MAAKFIT legal entity.
 * Bank account holders may still show this until a dedicated billing entity decision.
 */
export const SITE_LEGAL_ENTITY_LEGACY_UNVERIFIED = "Hakim Coaching FZ-LLC";
export const SITE_LEGAL_ENTITY = LEGAL_ENTITY_STATUS;
export const SITE_JURISDICTION = GOVERNING_LAW_STATUS;
export const SITE_SUPPORT_EMAIL = CURRENT_SUPPORT_EMAIL;
export const SITE_WHATSAPP = CURRENT_WHATSAPP;
export const SITE_WHATSAPP_URL = CURRENT_WHATSAPP_URL;
export const SITE_LAST_UPDATED = policyLastUpdatedLabel("ar");
export const SITE_POLICY_VERSION = POLICY_VERSION;

export const PAYMENT_PROCESSING_SUMMARY = `مدفوعات MAAKFIT في V1 جاهزة للربط مع مزود دفع معتمد لاحقاً. حتى اعتماد المزود، التحويل البنكي اليدوي يبقى مساراً تشغيلياً لمراجعة الإيصالات وليس عرضاً لمزود دفع نهائي.`;

export const PAYMENT_MANUAL_DISCLOSURE = `مراجعة التحويل البنكي عادة 24–48 ساعة في أيام العمل. لا تُفتح المزايا المدفوعة قبل التأكيد. للاستفسار: ${SITE_SUPPORT_EMAIL}.`;

export const PAYMENT_PADDLE_DISCLOSURE = PAYMENT_MANUAL_DISCLOSURE;

export const LEGAL_ROUTES = CATALOG_LEGAL_ROUTES;

export const PRODUCT_SUMMARY = {
  type: "منصة رقمية للياقة والتغذية والصحة العامة (خدمة رقمية — ليست خدمة طبية)",
  duration: "3 أشهر أو 6 أشهر حسب الباقة",
  billing: "دفعة للفترة المختارة — قابلة للتجديد التلقائي وفق موافقتك عند الدفع",
  delivery:
    "بعد تأكيد الدفع أو اعتماد التحويل، تُفعَّل المزايا داخل تطبيق MAAKFIT حسب الباقة. البرنامج يمكن أن يتطور مع تقدمك.",
  includes: [
    "برنامج تدريبي رقمي حسب الباقة",
    "تغذية رقمية حسب الباقة",
    "تتبع التقدم داخل التطبيق",
    "دعم حساب/فوترة لجميع الباقات",
    "دردشة الكوتش في Premium وVIP فقط",
  ],
} as const;
