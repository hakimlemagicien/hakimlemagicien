import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  CREATE_PASSWORD_LOCATION,
  userHasOAuthIdentity,
  userNeedsPasswordSetup,
} from "@/lib/auth-password-gate";
import { checkAdminAccess, sanitizeAdminReturnPath } from "@/lib/admin/admin-access";

export type PostAuthLocation =
  | typeof CREATE_PASSWORD_LOCATION
  | { to: "/app" }
  | { to: "/quiz" }
  | { to: "/admin" }
  | { href: string };

/** Parse official get_my_onboarding_state payload — no duplicate onboarding rules. */
export function isOnboardingCompleteFromState(state: unknown): boolean {
  if (!state || typeof state !== "object") return false;
  const row = state as { onboarding_completed?: unknown; has_training_profile?: unknown };
  if (typeof row.onboarding_completed === "boolean") return row.onboarding_completed;
  if (typeof row.has_training_profile === "boolean") return row.has_training_profile;
  return false;
}

/** OAuth-only destination once onboarding completeness is known. */
export function oauthPostAuthLocation(
  onboardingComplete: boolean,
): { to: "/app" } | { to: "/quiz" } {
  return onboardingComplete ? { to: "/app" } : { to: "/quiz" };
}

const completedOnboardingUsers = new Set<string>();
const onboardingRequests = new Map<string, Promise<boolean>>();

/**
 * Official contract: public.get_my_onboarding_state().
 * On RPC failure treat as incomplete so new OAuth users are not dumped into /app.
 */
export async function fetchMyOnboardingComplete(userId?: string): Promise<boolean> {
  if (userId && completedOnboardingUsers.has(userId)) return true;

  const requestKey = userId ?? "current-user";
  const existingRequest = onboardingRequests.get(requestKey);
  if (existingRequest) return existingRequest;

  const request = Promise.resolve(supabase.rpc("get_my_onboarding_state"))
    .then(({ data, error }) => {
      if (error) {
        console.error("[auth] get_my_onboarding_state failed:", error);
        return false;
      }
      const complete = isOnboardingCompleteFromState(data);
      // Completion is monotonic. Cache only the completed state so an
      // unfinished OAuth user can finish the quiz without a stale redirect.
      if (complete && userId) completedOnboardingUsers.add(userId);
      return complete;
    })
    .finally(() => {
      onboardingRequests.delete(requestKey);
    });

  onboardingRequests.set(requestKey, request);
  return request;
}

async function staffPostAuthLocation(
  preferredRedirect?: string | null,
): Promise<PostAuthLocation | null> {
  try {
    await checkAdminAccess();
  } catch {
    return null;
  }
  const safe = sanitizeAdminReturnPath(preferredRedirect);
  if (safe === "/admin") return { to: "/admin" };
  return { href: safe };
}

/**
 * Email/password → /app (or create-password) unchanged for clients.
 * Staff → /admin (or safe redirect back into admin).
 * OAuth identity → /quiz until onboarding_completed, else /app — unless staff.
 */
export async function resolveAuthenticatedDestination(
  user: User,
  options?: { redirect?: string | null },
): Promise<PostAuthLocation> {
  if (userNeedsPasswordSetup(user)) return CREATE_PASSWORD_LOCATION;

  // An explicit member-app intent must win over the staff default so the same
  // account can review the customer experience without losing admin access.
  if (options?.redirect === "/app") {
    if (!userHasOAuthIdentity(user)) return { to: "/app" };
    return oauthPostAuthLocation(await fetchMyOnboardingComplete(user.id));
  }

  const staffDestination = await staffPostAuthLocation(options?.redirect);
  if (staffDestination) return staffDestination;

  if (!userHasOAuthIdentity(user)) return { to: "/app" };
  return oauthPostAuthLocation(await fetchMyOnboardingComplete(user.id));
}
