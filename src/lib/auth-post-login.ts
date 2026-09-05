import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  CREATE_PASSWORD_LOCATION,
  userNeedsPasswordSetup,
} from "@/lib/auth-password-gate";

export { hasOAuthIdentity } from "@/lib/auth-password-gate";

/** OAuth + password-recovery callback lands on /auth (PKCE exchange happens there). */
export const AUTH_CALLBACK_PATH = "/auth";

/** Incomplete onboarding users continue the official quiz funnel here. */
export const QUIZ_ONBOARDING_LOCATION = {
  to: "/quiz" as const,
};

export type PostAuthDestination =
  | typeof CREATE_PASSWORD_LOCATION
  | typeof QUIZ_ONBOARDING_LOCATION
  | { to: "/app" };

export function getAuthCallbackRedirectUrl(origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${AUTH_CALLBACK_PATH}`;
}

export async function fetchOnboardingCompleted(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[auth] failed to read onboarding_completed_at:", error);
    // Fail closed for app entry: prefer quiz over incomplete /app.
    return false;
  }

  return Boolean(data?.onboarding_completed_at);
}

/**
 * Decides where a signed-in user should go.
 * Password setup still wins; then onboarding quiz; then /app.
 */
export async function resolvePostAuthDestination(user: User | null | undefined): Promise<PostAuthDestination> {
  if (!user) return QUIZ_ONBOARDING_LOCATION;
  if (userNeedsPasswordSetup(user)) return CREATE_PASSWORD_LOCATION;

  const completed = await fetchOnboardingCompleted(user.id);
  if (!completed) return QUIZ_ONBOARDING_LOCATION;
  return { to: "/app" };
}
