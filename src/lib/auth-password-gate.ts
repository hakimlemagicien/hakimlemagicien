import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const PASSWORD_SET_META_KEY = "password_set";

const PASSWORD_REQUIRED_SESSION_KEY = "hakim_password_required_v1";

export const CREATE_PASSWORD_LOCATION = {
  to: "/quiz" as const,
  search: { step: "createPassword" as const },
};

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

/** Immediate client mark so /app cannot open before user_metadata catches up. */
export function markPasswordRequiredLocally(): void {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.setItem(PASSWORD_REQUIRED_SESSION_KEY, "1");
  } catch {
    // no-op
  }
}

export function clearPasswordRequiredLocally(): void {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.removeItem(PASSWORD_REQUIRED_SESSION_KEY);
  } catch {
    // no-op
  }
}

function isPasswordRequiredLocally(): boolean {
  if (!canUseSessionStorage()) return false;
  try {
    return window.sessionStorage.getItem(PASSWORD_REQUIRED_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function hasOAuthIdentity(user: User): boolean {
  return (user.identities ?? []).some((identity) => identity.provider && identity.provider !== "email");
}

export function userNeedsPasswordSetup(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.user_metadata?.[PASSWORD_SET_META_KEY] === true) return false;
  if (hasOAuthIdentity(user)) return false;
  if (user.user_metadata?.[PASSWORD_SET_META_KEY] === false) return true;
  return isPasswordRequiredLocally();
}

/** Mark email-OTP onboarding users so /app rejects them until they set a password. */
export async function markPasswordRequiredIfUnset(): Promise<void> {
  markPasswordRequiredLocally();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;
  if (user.user_metadata?.[PASSWORD_SET_META_KEY] === true) {
    clearPasswordRequiredLocally();
    return;
  }
  if (user.user_metadata?.[PASSWORD_SET_META_KEY] === false) return;
  if (hasOAuthIdentity(user)) {
    clearPasswordRequiredLocally();
    return;
  }

  const { error } = await supabase.auth.updateUser({
    data: { [PASSWORD_SET_META_KEY]: false },
  });
  if (error) {
    console.error("[auth] failed to mark password as required:", error);
  }
}
