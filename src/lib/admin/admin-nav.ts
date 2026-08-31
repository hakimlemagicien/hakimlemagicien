export type AdminNavStatus = "live" | "foundation";

export type AdminNavItem = {
  id: string;
  to: string;
  label: string;
  status: AdminNavStatus;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "home",
    label: "الرئيسية",
    items: [{ id: "home", to: "/admin", label: "مركز التشغيل", status: "live" }],
  },
  {
    id: "operations",
    label: "العملاء والمتابعة",
    items: [
      { id: "clients", to: "/admin/clients", label: "العملاء", status: "live" },
      { id: "coaching", to: "/admin/messages", label: "الرسائل", status: "live" },
      { id: "progress", to: "/admin/progress", label: "التقدم", status: "foundation" },
    ],
  },
  {
    id: "content",
    label: "المحتوى",
    items: [
      { id: "programs", to: "/admin/programs", label: "البرامج", status: "live" },
      { id: "exercises", to: "/admin/exercises", label: "التمارين", status: "live" },
      { id: "nutrition", to: "/admin/nutrition", label: "التغذية", status: "live" },
      { id: "content", to: "/admin/content", label: "المحتوى", status: "live" },
    ],
  },
  {
    id: "business",
    label: "الأعمال",
    items: [
      { id: "memberships", to: "/admin/memberships", label: "العضويات", status: "live" },
      { id: "billing", to: "/admin/payments", label: "الفوترة", status: "live" },
      { id: "support", to: "/admin/support", label: "الدعم", status: "live" },
    ],
  },
  {
    id: "system",
    label: "النظام",
    items: [
      { id: "notifications", to: "/admin/notifications", label: "الإشعارات", status: "foundation" },
      { id: "analytics", to: "/admin/analytics", label: "التحليلات", status: "foundation" },
      { id: "audit", to: "/admin/audit", label: "سجل العمليات", status: "live" },
      { id: "settings", to: "/admin/settings", label: "الإعدادات", status: "foundation" },
    ],
  },
];

export const ADMIN_PLACEHOLDER_MODULES = [
  {
    id: "progress",
    path: "/admin/progress",
    title: "التقدم",
    purpose: "متابعة مراجعات التقدم التي تحتاج إجراء من الكوتش.",
    summary: "قواعد الاستحقاق العلمية غير معتمدة بعد، لذلك لا تُعرض تنبيهات وهمية.",
    later: "طابور مراجعات مستحقة مربوط بملف العميل عند اعتماد القاعدة.",
    source: "لا إشارة تقدّم جاهزة من طبقة البيانات الحالية.",
    contract: "DOMAIN_RULE_REQUIRED",
  },
  {
    id: "memberships",
    path: "/admin/memberships",
    title: "العضويات",
    purpose: "الاطلاع على خطط العملاء ومستوى الخدمة.",
    summary: "يُعاد استخدام نظام العضوية الحالي. لا منطق اشتراك جديد هنا.",
    later: "جدول عضويات وفلاتر الخطة والحالة من المصدر المعتمد.",
    source: "مراجعة التحويل البنكي متاحة الآن من الفوترة.",
    contract: "REUSE_MEMBERSHIP",
  },
  {
    id: "support",
    path: "/admin/support",
    title: "الدعم",
    purpose: "تذاكر الدعم العامة، منفصلة عن صندوق التدريب الخاص.",
    summary: "صندوق الكوتش يبقى في الرسائل. الدعم مسار مستقل.",
    later: "قائمة تذاكر وحالات وحل من مركز التشغيل.",
    source: "لا نظام تذاكر داخل Admin حالياً.",
    contract: "NOTIFICATION_CHANNELS",
  },
  {
    id: "notifications",
    path: "/admin/notifications",
    title: "الإشعارات",
    purpose: "تنبيهات الطاقم التشغيلية داخل الإدارة.",
    summary: "تنبيه الأدمن منفصل عن إشعار العميل والحدث النظامي.",
    later: "مركز إشعارات للطاقم مع حالات القراءة.",
    source: "لا قائمة إشعارات إدارية معروضة بعد.",
    contract: "NOTIFICATION_CHANNELS",
  },
  {
    id: "analytics",
    path: "/admin/analytics",
    title: "التحليلات",
    purpose: "ملخصات تشغيلية مبنية على بيانات حقيقية فقط.",
    summary: "لا رسوم وهمية ولا مؤشرات مخترعة في هذه المرحلة.",
    later: "عدادات وقوائم معتمدة على الاستعلامات الحقيقية.",
    source: "ملخص اليوم يظهر في مركز التشغيل من الرسائل والمدفوعات فقط.",
    contract: "NO_FAKE_BI",
  },
  {
    id: "audit",
    path: "/admin/audit",
    title: "سجل العمليات",
    purpose: "سجل قراءة فقط للأحداث التشغيلية.",
    summary: "العقد المستهدف هو أحداث التدقيق الحالية دون نظام موازٍ.",
    later: "جدول حدث / فاعل / هدف / وقت / فئة مع ترقيم صفحات.",
    source: "عقد البيانات غير جاهز للعرض الآمن من الواجهة حالياً — لا قائمة وهمية.",
    contract: "REUSE_AUDIT_EVENTS",
  },
  {
    id: "settings",
    path: "/admin/settings",
    title: "الإعدادات",
    purpose: "إعدادات حساب الطاقم والتشغيل، دون تغيير الأدوار في قاعدة البيانات الآن.",
    summary: "أساس بصري جاهز للحساب، الفريق، الصلاحيات، الإشعارات، والمنصة.",
    later: "إدارة الفريق والصلاحيات عند اعتماد نموذج RBAC.",
    source: "لا تغيير على أدوار قاعدة البيانات في هذه المرحلة.",
    contract: "RBAC_FOUNDATION",
  },
] as const;

export function getAdminPlaceholder(moduleId: string) {
  return ADMIN_PLACEHOLDER_MODULES.find((item) => item.id === moduleId) ?? null;
}

export function listAdminNavHrefs(): string[] {
  return ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.to));
}

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
