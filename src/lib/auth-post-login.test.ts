import assert from "node:assert/strict";

// Pure helpers only — avoid importing supabase client in unit tests.
const AUTH_CALLBACK_PATH = "/auth";
const QUIZ_ONBOARDING_LOCATION = { to: "/quiz" as const };

function getAuthCallbackRedirectUrl(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${AUTH_CALLBACK_PATH}`;
}

function hasOAuthIdentity(user: { identities?: Array<{ provider?: string }> } | null | undefined): boolean {
  if (!user) return false;
  return (user.identities ?? []).some((identity) => identity.provider && identity.provider !== "email");
}

assert.equal(AUTH_CALLBACK_PATH, "/auth");
assert.equal(QUIZ_ONBOARDING_LOCATION.to, "/quiz");
assert.equal(getAuthCallbackRedirectUrl("https://hakimlemagicien.com"), "https://hakimlemagicien.com/auth");
assert.equal(getAuthCallbackRedirectUrl("http://127.0.0.1:5173/"), "http://127.0.0.1:5173/auth");
assert.equal(hasOAuthIdentity({ identities: [{ provider: "google" }] }), true);
assert.equal(hasOAuthIdentity({ identities: [{ provider: "email" }] }), false);
assert.equal(hasOAuthIdentity(null), false);

console.log("auth-post-login tests passed");
