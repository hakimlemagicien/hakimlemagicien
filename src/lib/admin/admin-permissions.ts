/** A7 — central staff permission model (client policy layer; server is authoritative). */

export const STAFF_ROLES = [
  "super_admin",
  "coach",
  "nutrition",
  "support",
  "finance",
  "read_only",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ADMIN_PERMISSIONS = [
  "clients.read",
  "clients.basic_read",
  "clients.write",
  "client_notes.write",
  "training.manage",
  "nutrition.manage",
  "exercise.read",
  "exercise.content_edit",
  "exercise.safety_edit",
  "meal_library.manage",
  "meal.safety_edit",
  "membership.read",
  "payments.read",
  "legacy_payments.manage",
  "payment_audit.read",
  "content.manage",
  "support.manage",
  "messages.manage",
  "progress.read",
  "audit.read",
  "staff.manage",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export type AdminActionLevel = "SAFE" | "REVIEW" | "SENSITIVE" | "FORBIDDEN";

export type StaffSession = {
  userId: string;
  staffRole: StaffRole;
  permissions: AdminPermission[];
};

/** V1 coarse matrix — mirrors SQL staff_has_permission. */
const ROLE_PERMISSIONS: Record<StaffRole, readonly AdminPermission[]> = {
  super_admin: ADMIN_PERMISSIONS,
  coach: [
    "clients.read",
    "client_notes.write",
    "training.manage",
    "exercise.read",
    "messages.manage",
    "progress.read",
    "audit.read",
  ],
  nutrition: [
    "clients.read",
    "client_notes.write",
    "nutrition.manage",
    "meal_library.manage",
    "meal.safety_edit",
    "progress.read",
    "audit.read",
  ],
  support: [
    "clients.basic_read",
    "membership.read",
    "payments.read",
    "support.manage",
    "messages.manage",
    "audit.read",
  ],
  finance: [
    "clients.basic_read",
    "membership.read",
    "payments.read",
    "legacy_payments.manage",
    "payment_audit.read",
    "audit.read",
  ],
  read_only: [
    "clients.basic_read",
    "membership.read",
    "payments.read",
    "progress.read",
    "audit.read",
    "exercise.read",
  ],
};

export const FORBIDDEN_ADMIN_ACTIONS = [
  "matrix.bypass",
  "matrix.blocked_override",
  "payment.psp.mark_paid",
  "membership.activate_paid_manually",
  "entitlement.raw_mutation",
  "provider.webhook_truth_edit",
  "audit.delete",
  "rls.edit",
  "schema.edit",
] as const;

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: "مدير النظام",
  coach: "مدرب",
  nutrition: "تغذية",
  support: "دعم",
  finance: "مالية",
  read_only: "قراءة فقط",
};

export const ROUTE_REQUIRED_PERMISSION: Record<string, AdminPermission> = {
  "/admin": "clients.basic_read",
  "/admin/clients": "clients.read",
  "/admin/messages": "messages.manage",
  "/admin/progress": "progress.read",
  "/admin/training": "training.manage",
  "/admin/training/reviews": "progress.read",
  "/admin/programs": "training.manage",
  "/admin/exercises": "exercise.read",
  "/admin/nutrition/operations": "nutrition.manage",
  "/admin/nutrition": "meal_library.manage",
  "/admin/billing": "membership.read",
  "/admin/memberships": "membership.read",
  "/admin/payments": "payments.read",
  "/admin/content": "content.manage",
  "/admin/support": "support.manage",
  "/admin/audit": "audit.read",
  "/admin/settings": "staff.manage",
};

export function permissionsForRole(role: StaffRole): AdminPermission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function hasAdminPermission(
  session: Pick<StaffSession, "staffRole" | "permissions"> | null | undefined,
  permission: AdminPermission,
): boolean {
  if (!session) return false;
  if (session.staffRole === "super_admin") return true;
  return session.permissions.includes(permission);
}

export function canAdmin(
  session: Pick<StaffSession, "staffRole" | "permissions"> | null | undefined,
  permission: AdminPermission,
): boolean {
  return hasAdminPermission(session, permission);
}

export function canAccessNavItem(
  session: Pick<StaffSession, "staffRole" | "permissions"> | null | undefined,
  permission?: AdminPermission,
): boolean {
  if (!session) return false;
  if (!permission) return true;
  if (hasAdminPermission(session, permission)) return true;
  if (permission === "clients.read" && hasAdminPermission(session, "clients.basic_read")) return true;
  return false;
}

export function canAccessRoute(
  session: Pick<StaffSession, "staffRole" | "permissions"> | null | undefined,
  pathname: string,
): boolean {
  if (!session) return false;
  const permission = resolveRoutePermission(pathname);
  return canAccessNavItem(session, permission);
}

export function resolveRoutePermission(pathname: string): AdminPermission {
  const path = pathname.replace(/\/+$/, "") || "/admin";
  const entries = Object.entries(ROUTE_REQUIRED_PERMISSION).sort((a, b) => b[0].length - a[0].length);
  for (const [route, permission] of entries) {
    if (path === route || path.startsWith(`${route}/`)) return permission;
  }
  return "clients.read";
}

export function permissionDeniedMessage(permission: AdminPermission): string {
  if (permission.startsWith("payment") || permission.startsWith("legacy") || permission === "membership.read") {
    return "ليس لديك صلاحية تعديل بيانات الدفع.";
  }
  if (permission === "staff.manage") return "هذا الإجراء متاح لمدير النظام فقط.";
  if (permission === "training.manage") return "ليس لديك صلاحية عمليات التدريب.";
  if (permission === "nutrition.manage" || permission === "meal_library.manage") {
    return "ليس لديك صلاحية عمليات التغذية.";
  }
  return "ليس لديك صلاحية للوصول إلى هذا القسم.";
}

export function classifyAdminAction(actionId: string): AdminActionLevel {
  if (FORBIDDEN_ADMIN_ACTIONS.some((id) => actionId.includes(id))) return "FORBIDDEN";
  if (
    actionId.includes("legacy_payment") ||
    actionId.includes("staff_role") ||
    actionId.includes("coach_override") ||
    actionId.includes("assign_program") ||
    actionId.includes("assign_nutrition") ||
    actionId.includes("end_assignment") ||
    actionId.includes("safety_edit") ||
    actionId.includes("allergen")
  ) {
    return "SENSITIVE";
  }
  if (
    actionId.includes("note") ||
    actionId.includes("support_status") ||
    actionId.includes("content_publish")
  ) {
    return "REVIEW";
  }
  return "SAFE";
}

export function isForbiddenAdminAction(actionId: string): boolean {
  return classifyAdminAction(actionId) === "FORBIDDEN";
}

/** Legacy admin users map to super_admin when RPC unavailable (pre-migration). */
export function fallbackStaffSession(userId: string): StaffSession {
  return {
    userId,
    staffRole: "super_admin",
    permissions: [...ADMIN_PERMISSIONS],
  };
}
