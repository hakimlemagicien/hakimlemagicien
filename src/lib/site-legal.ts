export const SITE_BRAND = "Hakim Le Magicien";
export const SITE_LEGAL_ENTITY = "Hakim Coaching FZ-LLC";
export const SITE_JURISDICTION = "الإمارات العربية المتحدة";
export const SITE_SUPPORT_EMAIL = "support@hakimlemagicien.com";
export const SITE_WHATSAPP = "+971505129019";
export const SITE_WHATSAPP_URL = "https://wa.me/971505129019";
export const SITE_LAST_UPDATED = "3 يوليو 2026";

export const PAYMENT_PROCESSING_SUMMARY = `تعالج جميع المدفوعات على موقع ${SITE_BRAND} عبر مزود دفع عالمي معتمد يضمن حماية معلومات الدفع والامتثال للمعايير الدولية.`;

export const PAYMENT_PADDLE_DISCLOSURE = `وفي الحالات التي تتم فيها معالجة الدفع عبر Paddle، قد تنطبق سياسات Paddle باعتبارها مزود خدمة الدفع الرسمي. أما سياسة الاسترجاع المنشورة على موقع ${SITE_BRAND} فهي المرجع الأساسي لعملائنا.`;

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
    "خلال 24–48 ساعة من تأكيد الدفع، تصلك خطة العمل والبرنامج عبر الواتساب والبريد الإلكتروني مع متابعة دورية حسب الباقة المختارة.",
  includes: [
    "خطة تدريب مخصصة وفق هدفك وجسمك",
    "خطة تغذية مخصصة",
    "متابعة ومراجعات دورية حسب مستوى الباقة",
    "دعم عبر واتساب",
    "تعديلات على الخطة حسب التقدم",
  ],
} as const;
