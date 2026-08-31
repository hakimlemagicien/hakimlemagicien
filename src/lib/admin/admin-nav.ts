import type { AdminPermission } from "@/lib/admin/admin-permissions";

export type AdminNavStatus = "live" | "foundation";

export type AdminNavItem = {
  id: string;
  to: string;
  label: string;
  status: AdminNavStatus;
  requiredPermission?: AdminPermission;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

/** A2.1 — seven primary sections with sub-navigation. */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "home",
    label: "الرئيسية",
    items: [{ id: "home", to: "/admin", label: "مركز التشغيل", status: "live", requiredPermission: "clients.basic_read" }],
  },
  {
    id: "clients",
    label: "العملاء",
    items: [
      { id: "clients", to: "/admin/clients", label: "العملاء", status: "live", requiredPermission: "clients.read" },
      { id: "coaching", to: "/admin/messages", label: "الرسائل", status: "live", requiredPermission: "messages.manage" },
    ],
  },
  {
    id: "training",
    label: "التدريب",
    items: [
      { id: "training-ops", to: "/admin/training", label: "نظرة عامة", status: "live", requiredPermission: "training.manage" },
      { id: "training-reviews", to: "/admin/training/reviews", label: "مراجعات التدريب", status: "live", requiredPermission: "progress.read" },
      { id: "programs", to: "/admin/programs", label: "البرامج", status: "live", requiredPermission: "training.manage" },
      { id: "exercises", to: "/admin/exercises", label: "مكتبة التمارين", status: "live", requiredPermission: "exercise.read" },
    ],
  },
  {
    id: "nutrition",
    label: "التغذية",
    items: [
      { id: "nutrition-ops", to: "/admin/nutrition/operations", label: "نظرة عامة", status: "live", requiredPermission: "nutrition.manage" },
      { id: "nutrition", to: "/admin/nutrition", label: "مكتبة الوجبات", status: "live", requiredPermission: "meal_library.manage" },
    ],
  },
  {
    id: "billing",
    label: "الاشتراكات والمدفوعات",
    items: [
      { id: "billing-overview", to: "/admin/billing", label: "نظرة عامة", status: "live", requiredPermission: "membership.read" },
      { id: "memberships", to: "/admin/memberships", label: "العضويات", status: "live", requiredPermission: "membership.read" },
      { id: "payments", to: "/admin/payments", label: "المدفوعات", status: "live", requiredPermission: "payments.read" },
    ],
  },
  {
    id: "content",
    label: "المحتوى والمكتبات",
    items: [{ id: "content", to: "/admin/content", label: "المحتوى", status: "live", requiredPermission: "content.manage" }],
  },
  {
    id: "system",
    label: "الإدارة والنظام",
    items: [
      { id: "support", to: "/admin/support", label: "الدعم", status: "live", requiredPermission: "support.manage" },
      { id: "audit", to: "/admin/audit", label: "سجل العمليات", status: "live", requiredPermission: "audit.read" },
      { id: "notifications", to: "/admin/notifications", label: "الإشعارات", status: "foundation" },
      { id: "analytics", to: "/admin/analytics", label: "التحليلات", status: "foundation" },
      { id: "settings", to: "/admin/settings", label: "الإعدادات", status: "live", requiredPermission: "staff.manage" },
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
    id: "settings",
    path: "/admin/settings",
    title: "الإعدادات",
    purpose: "إدارة أدوار الطاقم والصلاحيات التشغيلية.",
    summary: "عرض الفريق وتغيير الأدوار مع تأكيد وسبب وتدقيق.",
    later: "دعوات البريد وصلاحيات أدق عند الحاجة.",
    source: "staff_members + admin_update_staff_role على Staging.",
    contract: "RBAC_V1",
  },
] as const;

export function getAdminPlaceholder(moduleId: string) {
  return ADMIN_PLACEHOLDER_MODULES.find((item) => item.id === moduleId) ?? null;
}

export function listAdminNavHrefs(): string[] {
  return ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.to));
}

export function isAdminNavActive(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  const target = href.replace(/\/+$/, "") || "/";
  if (target === "/admin") return path === "/admin";
  return path === target || path.startsWith(`${target}/`);
}
