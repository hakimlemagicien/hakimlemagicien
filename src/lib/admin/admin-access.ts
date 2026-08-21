import { isRedirect, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/** Current production staff role. Future RBAC expands the DB enum — do not invent roles here. */
export const CURRENT_STAFF_ROLE = "admin" as const;

export const PLANNED_STAFF_ROLES = [
  "owner",
  "head_coach",
  "coach",
  "nutrition_editor",
  "content_editor",
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

export type AdminSession = {
  userId: string;
  role: typeof CURRENT_STAFF_ROLE;
};

export function isCurrentStaffRole(role: string | null | undefined): boolean {
  return role === CURRENT_STAFF_ROLE;
}

/**
 * Authoritative client-side staff check against user_roles.
 * RLS still governs data. Hidden UI is not sufficient.
 */
export async function checkAdminAccess(): Promise<AdminSession> {
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

  const isAdmin = roles?.some((row) => isCurrentStaffRole(row.role)) ?? false;
  if (!isAdmin) {
    throw new AdminAccessError("forbidden");
  }

  return { userId, role: CURRENT_STAFF_ROLE };
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

export async function requireAdminRouteAccess(): Promise<AdminSession> {
  try {
    return await checkAdminAccess();
  } catch (error) {
    resolveAdminGuardRedirect(error);
  }
}
