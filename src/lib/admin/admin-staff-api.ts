import { supabase } from "@/integrations/supabase/client";
import {
  ADMIN_PERMISSIONS,
  fallbackStaffSession,
  type AdminPermission,
  type StaffRole,
  type StaffSession,
} from "@/lib/admin/admin-permissions";

export type StaffMemberRow = {
  userId: string;
  email: string | null;
  displayName: string | null;
  staffRole: StaffRole;
  status: string;
  grantedAt: string;
  lastSignInAt: string | null;
};

function parseStaffSession(data: unknown, userId: string): StaffSession {
  if (!data || typeof data !== "object") return fallbackStaffSession(userId);
  const row = data as Record<string, unknown>;
  const staffRole = typeof row.staff_role === "string" ? (row.staff_role as StaffRole) : "super_admin";
  const permissions = Array.isArray(row.permissions)
    ? row.permissions.filter((p): p is AdminPermission => typeof p === "string" && ADMIN_PERMISSIONS.includes(p as AdminPermission))
    : fallbackStaffSession(userId).permissions;
  return {
    userId: typeof row.user_id === "string" ? row.user_id : userId,
    staffRole,
    permissions,
  };
}

export async function fetchStaffSession(userId: string): Promise<StaffSession> {
  const { data, error } = await supabase.rpc("admin_get_staff_session");
  if (error) {
    if (/admin_get_staff_session|42883|does not exist/i.test(error.message)) {
      return fallbackStaffSession(userId);
    }
    throw error;
  }
  return parseStaffSession(data, userId);
}

export async function listStaffMembers(): Promise<StaffMemberRow[]> {
  const { data, error } = await supabase.rpc("admin_list_staff_members");
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      userId: String(r.user_id ?? ""),
      email: typeof r.email === "string" ? r.email : null,
      displayName: typeof r.display_name === "string" ? r.display_name : null,
      staffRole: (typeof r.staff_role === "string" ? r.staff_role : "read_only") as StaffRole,
      status: typeof r.status === "string" ? r.status : "active",
      grantedAt: typeof r.granted_at === "string" ? r.granted_at : "",
      lastSignInAt: typeof r.last_sign_in_at === "string" ? r.last_sign_in_at : null,
    };
  });
}

export async function updateStaffRole(userId: string, staffRole: StaffRole, reason: string): Promise<void> {
  const { error } = await supabase.rpc("admin_update_staff_role", {
    p_user_id: userId,
    p_staff_role: staffRole,
    p_reason: reason,
  });
  if (error) throw error;
}

export function validateStaffPassword(password: string): string | null {
  const trimmed = password ?? "";
  if (trimmed.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  if (trimmed.length > 128) return "كلمة المرور طويلة جدًا";
  return null;
}

export async function setStaffPassword(userId: string, newPassword: string, reason: string): Promise<void> {
  const passwordError = validateStaffPassword(newPassword);
  if (passwordError) throw new Error(passwordError);
  if (reason.trim().length < 5) throw new Error("سبب التغيير مطلوب (5 أحرف على الأقل)");

  const { error } = await supabase.rpc("admin_set_staff_password", {
    p_user_id: userId,
    p_new_password: newPassword,
    p_reason: reason.trim(),
  });
  if (error) {
    const message = error.message ?? "";
    if (/password_too_short/i.test(message)) throw new Error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    if (/password_too_long/i.test(message)) throw new Error("كلمة المرور طويلة جدًا");
    if (/reason_required/i.test(message)) throw new Error("سبب التغيير مطلوب (5 أحرف على الأقل)");
    if (/not_staff|staff_inactive/i.test(message)) throw new Error("يمكن تغيير كلمة المرور لحسابات الطاقم النشطة فقط");
    if (/user_not_found/i.test(message)) throw new Error("الحساب غير موجود");
    if (/forbidden/i.test(message)) throw new Error("ليست لديك صلاحية تغيير كلمات مرور الطاقم");
    throw error;
  }
}
