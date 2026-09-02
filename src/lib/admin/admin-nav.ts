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

/** Command Center is the daily entry — not nested under a section heading. */
export const ADMIN_NAV_PRIMARY: AdminNavItem = {
  id: "home",
  to: "/admin",
  label: "مركز التشغيل",
  status: "live",
  requiredPermission: "clients.basic_read",
};

/** Daily-ops groups. Section labels are visual only — never routes. */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "clients",
    label: "العملاء",
    items: [
      { id: "clients", to: "/admin/clients", label: "العملاء", status: "live", requiredPermission: "clients.read" },
      { id: "messages", to: "/admin/messages", label: "الرسائل", status: "live", requiredPermission: "messages.manage" },
      { id: "progress", to: "/admin/progress", label: "التقدم", status: "live", requiredPermission: "progress.read" },
    ],
  },
  {
    id: "training",
    label: "التدريب",
    items: [
      { id: "programs", to: "/admin/programs", label: "البرامج التدريبية", status: "live", requiredPermission: "training.manage" },
      { id: "exercises", to: "/admin/exercises", label: "مكتبة التمارين", status: "live", requiredPermission: "exercise.read" },
    ],
  },
  {
    id: "nutrition",
    label: "التغذية",
    items: [
      { id: "nutrition", to: "/admin/nutrition", label: "مكتبة الوجبات", status: "live", requiredPermission: "meal_library.manage" },
    ],
  },
  {
    id: "billing",
    label: "الاشتراكات والمدفوعات",
    items: [
      { id: "memberships", to: "/admin/memberships", label: "العضويات", status: "live", requiredPermission: "membership.read" },
      { id: "payments", to: "/admin/payments", label: "المدفوعات", status: "live", requiredPermission: "payments.read" },
    ],
  },
  {
    id: "content",
    label: "المحتوى",
    items: [
      { id: "content", to: "/admin/content", label: "المحتوى", status: "live", requiredPermission: "content.manage" },
      {
        id: "studio",
        to: "/admin/studio",
        label: "ستوديو التصميم",
        status: "live",
        requiredPermission: "content.manage",
      },
    ],
  },
  {
    id: "system",
    label: "الإدارة والنظام",
    items: [
      { id: "support", to: "/admin/support", label: "الدعم", status: "live", requiredPermission: "support.manage" },
      { id: "staff", to: "/admin/settings", label: "إدارة الفريق والصلاحيات", status: "live", requiredPermission: "staff.manage" },
      { id: "audit", to: "/admin/audit", label: "سجل العمليات", status: "live", requiredPermission: "audit.read" },
      { id: "notifications", to: "/admin/notifications", label: "الإشعارات", status: "foundation" },
      { id: "analytics", to: "/admin/analytics", label: "التحليلات", status: "foundation" },
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
] as const;

export function getAdminPlaceholder(moduleId: string) {
  return ADMIN_PLACEHOLDER_MODULES.find((item) => item.id === moduleId) ?? null;
}

export function listAdminNavItems(): AdminNavItem[] {
  return [ADMIN_NAV_PRIMARY, ...ADMIN_NAV_GROUPS.flatMap((group) => group.items)];
}

export function listAdminNavHrefs(): string[] {
  return listAdminNavItems().map((item) => item.to);
}

export function isAdminNavActive(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  const target = href.replace(/\/+$/, "") || "/";
  if (target === "/admin") return path === "/admin";
  if (!(path === target || path.startsWith(`${target}/`))) return false;
  const longerMatch = listAdminNavHrefs().some((other) => {
    const candidate = other.replace(/\/+$/, "") || "/";
    if (candidate === target || candidate === "/admin") return false;
    if (candidate.length <= target.length) return false;
    return path === candidate || path.startsWith(`${candidate}/`);
  });
  return !longerMatch;
}
