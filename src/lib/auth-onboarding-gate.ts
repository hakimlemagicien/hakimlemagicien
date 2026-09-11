import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { CREATE_PASSWORD_LOCATION, userHasOAuthIdentity, userNeedsPasswordSetup } from "@/lib/auth-password-gate";

export type PostAuthLocation =
  | typeof CREATE_PASSWORD_LOCATION
  | { to: "/app" }
  | { to: "/quiz" };

/** Parse official get_my_onboarding_state payload — no duplicate onboarding rules. */
export function isOnboardingCompleteFromState(state: unknown): boolean {
  if (!state || typeof state !== "object") return false;
  const row = state as { onboarding_completed?: unknown; has_training_profile?: unknown };
  if (typeof row.onboarding_completed === "boolean") return row.onboarding_completed;
  if (typeof row.has_training_profile === "boolean") return row.has_training_profile;
  return false;
}

/** OAuth-only destination once onboarding completeness is known. */
export function oauthPostAuthLocation(onboardingComplete: boolean): { to: "/app" } | { to: "/quiz" } {
  return onboardingComplete ? { to: "/app" } : { to: "/quiz" };
}

/**
 * Official contract: public.get_my_onboarding_state().
 * On RPC failure treat as incomplete so new OAuth users are not dumped into /app.
 */
export async function fetchMyOnboardingComplete(): Promise<boolean> {
  const { data, error } = await supabase.rpc("get_my_onboarding_state");
  if (error) {
    console.error("[auth] get_my_onboarding_state failed:", error);
    return false;
  }
  return isOnboardingCompleteFromState(data);
}

/**
 * Email/password → /app (or create-password) unchanged.
 * OAuth identity → /quiz until onboarding_completed, else /app.
 */
export async function resolveAuthenticatedDestination(user: User): Promise<PostAuthLocation> {
  if (userNeedsPasswordSetup(user)) return CREATE_PASSWORD_LOCATION;
  if (!userHasOAuthIdentity(user)) return { to: "/app" };
  return oauthPostAuthLocation(await fetchMyOnboardingComplete());
}
