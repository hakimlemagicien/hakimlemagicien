import { isRedirect, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  fallbackStaffSession,
  resolveRoutePermission,
  type StaffSession,
} from "@/lib/admin/admin-permissions";
import { fetchStaffSession } from "@/lib/admin/admin-staff-api";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { isFounderReviewEmail, resolveAuthEmail } from "@/lib/platform/membership";

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

/** Only allow same-origin admin paths as post-login return targets. */
export function sanitizeAdminReturnPath(path: string | null | undefined): string {
  if (!path || typeof path !== "string") return "/admin";
  const trimmed = path.trim();
  if (!trimmed.startsWith("/admin")) return "/admin";
  if (trimmed.startsWith("//") || trimmed.includes("://")) return "/admin";
  return trimmed.slice(0, 512);
}

function isAuthFailureMessage(message: string): boolean {
  return /jwt|session|auth|token|not authenticated|invalid claim|refresh/i.test(message);
}

async function resolveAuthUser(): Promise<{ id: string; email: string | null }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!userError && user?.id) {
    return { id: user.id, email: resolveAuthEmail(user) };
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user?.id) {
    throw new AdminAccessError("unauthenticated");
  }

  if (userError && isAuthFailureMessage(userError.message)) {
    throw new AdminAccessError("unauthenticated");
  }

  return { id: session.user.id, email: resolveAuthEmail(session.user) };
}

/**
 * Authoritative client-side staff check.
 * Portal access: staff_members (RPC) OR legacy user_roles.admin
 * OR founder review email (same contract as grant_founder_review_access).
 * Auth/network failures → unauthenticated (re-login), not forbidden.
 */
export async function checkAdminAccess(): Promise<StaffSession> {
  let authUser: { id: string; email: string | null };
  try {
    authUser = await resolveAuthUser();
  } catch (error) {
    if (error instanceof AdminAccessError) throw error;
    console.error("[checkAdminAccess] auth:", error);
    throw new AdminAccessError("unauthenticated");
  }

  const userId = authUser.id;

  let staffSession: StaffSession | null = null;
  try {
    staffSession = await fetchStaffSession(userId);
    if (staffSession.staffRole) return staffSession;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[checkAdminAccess] staff session:", message);
    if (isAuthFailureMessage(message)) {
      throw new AdminAccessError("unauthenticated");
    }
  }

  const { data: roles, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (roleError) {
    console.error("[checkAdminAccess] user_roles:", roleError.message);
    if (isAuthFailureMessage(roleError.message)) {
      throw new AdminAccessError("unauthenticated");
    }
    // Transient DB error with a known staff session from a partial parse — keep trying staff path.
    if (staffSession?.staffRole) return staffSession;
    if (isFounderReviewEmail(authUser.email)) {
      return fallbackStaffSession(userId);
    }
    throw new AdminAccessError("unauthenticated");
  }

  const isLegacyAdmin = roles?.some((row) => isCurrentStaffRole(row.role)) ?? false;
  if (isLegacyAdmin) {
    return fallbackStaffSession(userId);
  }

  // Founder review account must reach /admin on every origin (localhost + production).
  if (isFounderReviewEmail(authUser.email)) {
    return fallbackStaffSession(userId);
  }

  throw new AdminAccessError("forbidden");
}

export function resolveAdminGuardRedirect(
  error: unknown,
  returnPath = "/admin",
): never {
  if (isRedirect(error)) throw error;
  const code =
    error instanceof AdminAccessError
      ? error.code
      : error instanceof Error && error.message === "unauthenticated"
        ? "unauthenticated"
        : "forbidden";

  if (code === "unauthenticated") {
    throw redirect({
      to: "/auth",
      search: {
        view: "login",
        redirect: sanitizeAdminReturnPath(returnPath),
      },
    });
  }

  throw redirect({ to: "/app" });
}

export async function requireAdminRouteAccess(ctx?: {
  location?: { pathname: string; searchStr?: string };
}): Promise<StaffSession> {
  try {
    return await checkAdminAccess();
  } catch (error) {
    const path = ctx?.location
      ? `${ctx.location.pathname}${ctx.location.searchStr ?? ""}`
      : "/admin";
    resolveAdminGuardRedirect(error, path);
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
