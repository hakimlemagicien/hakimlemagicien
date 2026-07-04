export const SITE_BRAND = "Hakim Le Magicien";
export const SITE_LEGAL_ENTITY = "Hakim Coaching FZ-LLC";
export const SITE_JURISDICTION = "الإمارات العربية المتحدة";
export const SITE_SUPPORT_EMAIL = "support@hakimlemagicien.com";
export const SITE_WHATSAPP = "+971505129019";
export const SITE_WHATSAPP_URL = "https://wa.me/971505129019";
export const SITE_LAST_UPDATED = "3 يوليو 2026";

export const PAYMENT_PROCESSING_SUMMARY = `تعالج ${SITE_BRAND} المدفوعات حالياً عبر التحويل البنكي المباشر إلى حسابات الشركة الرسمية. بعد استلام إثبات الدفع، نراجع التحويل يدوياً ونفعّل برنامجك.`;

export const PAYMENT_MANUAL_DISCLOSURE = `مدة مراجعة التحويل البنكي عادة 24–48 ساعة في أيام العمل. لن يبدأ تجهيز برنامجك قبل تأكيد استلام المبلغ. للاستفسار: ${SITE_SUPPORT_EMAIL} أو واتساب ${SITE_WHATSAPP}.`;

export const PAYMENT_PADDLE_DISCLOSURE = PAYMENT_MANUAL_DISCLOSURE;

export const LEGAL_ROUTES = {
  privacy: "/privacy",
  terms: "/terms",
  refund: "/refund",
} as const;

export const PRODUCT_SUMMARY = {
  type: "برنامج تدريب وتغذية رقمي مخصص (خدمة رقمية)",
  duration: "90 يوماً",
  billing: "دفعة واحدة — بدون تجديد تلقائي",
  delivery:
    "خلال 24–48 ساعة من تأكيد استلام التحويل البنكي، تصلك خطة العمل والبرنامج عبر الواتساب والبريد الإلكتروني مع متابعة دورية حسب الباقة المختارة.",
  includes: [
    "خطة تدريب مخصصة وفق هدفك وجسمك",
    "خطة تغذية مخصصة",
    "متابعة ومراجعات دورية حسب مستوى الباقة",
    "دعم عبر واتساب",
    "تعديلات على الخطة حسب التقدم",
  ],
} as const;
