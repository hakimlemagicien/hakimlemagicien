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
