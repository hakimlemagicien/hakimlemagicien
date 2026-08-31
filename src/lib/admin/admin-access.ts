import { isRedirect, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  fallbackStaffSession,
  resolveRoutePermission,
  type StaffSession,
} from "@/lib/admin/admin-permissions";
import { fetchStaffSession } from "@/lib/admin/admin-staff-api";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";

/** Legacy identifier — existing admins map to super_admin via staff_members backfill. */
export const CURRENT_STAFF_ROLE = "admin" as const;

export const PLANNED_STAFF_ROLES = [
  "super_admin",
  "coach",
  "nutrition",
  "support",
  "finance",
  "read_only",
] as const;

export type AdminAccessErrorCode = "unauthenticated" | "forbidden";

export class AdminAccessError extends Error {
  readonly code: AdminAccessErrorCode;

  constructor(code: AdminAccessErrorCode) {
    super(code);
    this.name = "AdminAccessError";
    this.code = code;
  }
}

export type AdminSession = StaffSession;

export function isCurrentStaffRole(role: string | null | undefined): boolean {
  return role === CURRENT_STAFF_ROLE;
}

/**
 * Authoritative client-side staff check.
 * Portal access: legacy user_roles.admin OR staff_members (via RPC when migrated).
 */
export async function checkAdminAccess(): Promise<StaffSession> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    throw new AdminAccessError("unauthenticated");
  }

  const userId = session.user.id;
  const { data: roles, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (roleError) {
    console.error("[checkAdminAccess] user_roles:", roleError.message);
    throw new AdminAccessError("forbidden");
  }

  const isLegacyAdmin = roles?.some((row) => isCurrentStaffRole(row.role)) ?? false;

  try {
    const staffSession = await fetchStaffSession(userId);
    if (staffSession.staffRole) return staffSession;
  } catch (error) {
    console.error("[checkAdminAccess] staff session:", error);
  }

  if (isLegacyAdmin) {
    return fallbackStaffSession(userId);
  }

  throw new AdminAccessError("forbidden");
}

export function resolveAdminGuardRedirect(error: unknown): never {
  if (isRedirect(error)) throw error;
  const code =
    error instanceof AdminAccessError
      ? error.code
      : error instanceof Error && error.message === "unauthenticated"
        ? "unauthenticated"
        : "forbidden";

  if (code === "unauthenticated") {
    throw redirect({ to: "/auth" });
  }

  throw redirect({ to: "/app" });
}

export async function requireAdminRouteAccess(): Promise<StaffSession> {
  try {
    return await checkAdminAccess();
  } catch (error) {
    resolveAdminGuardRedirect(error);
  }
}

export async function requireAdminRoutePermission(pathname: string): Promise<StaffSession> {
  const session = await requireAdminRouteAccess();
  const permission = resolveRoutePermission(pathname);
  if (!hasAdminPermission(session, permission)) {
    throw redirect({
      to: "/admin/forbidden",
      search: { from: pathname, permission },
    });
  }
  return session;
}
