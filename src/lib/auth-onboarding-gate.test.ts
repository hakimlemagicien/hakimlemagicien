import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { User } from "@supabase/supabase-js";
import {
  isOnboardingCompleteFromState,
  oauthPostAuthLocation,
  resolveAuthenticatedDestination,
} from "./auth-onboarding-gate.ts";
import { CREATE_PASSWORD_LOCATION, PASSWORD_SET_META_KEY, userHasOAuthIdentity } from "./auth-password-gate.ts";

assert.equal(isOnboardingCompleteFromState(null), false, "null incomplete");
assert.equal(isOnboardingCompleteFromState({}), false, "empty incomplete");
assert.equal(
  isOnboardingCompleteFromState({ onboarding_completed: false, has_training_profile: false }),
  false,
  "explicit incomplete",
);
assert.equal(
  isOnboardingCompleteFromState({ onboarding_completed: true, has_training_profile: true }),
  true,
  "explicit complete",
);
assert.equal(
  isOnboardingCompleteFromState({ has_training_profile: true }),
  true,
  "fallback has_training_profile",
);
assert.equal(
  isOnboardingCompleteFromState({ onboarding_completed: false, has_training_profile: true }),
  false,
  "onboarding_completed wins when false",
);

assert.deepEqual(oauthPostAuthLocation(false), { to: "/quiz" }, "NEW_GOOGLE_USER_ROUTE");
assert.deepEqual(oauthPostAuthLocation(true), { to: "/app" }, "EXISTING_GOOGLE_USER_ROUTE");
assert.deepEqual(
  oauthPostAuthLocation(isOnboardingCompleteFromState({ onboarding_completed: false })),
  { to: "/quiz" },
  "new user via official state",
);
assert.deepEqual(
  oauthPostAuthLocation(isOnboardingCompleteFromState({ onboarding_completed: true })),
  { to: "/app" },
  "existing user via official state",
);

function baseUser(partial: Partial<User> & Pick<User, "id" | "identities" | "user_metadata">): User {
  return {
    app_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
    ...partial,
  } as User;
}

const oauthUser = baseUser({
  id: "oauth-user",
  user_metadata: {},
  identities: [{ id: "g1", provider: "google" }] as User["identities"],
});
const emailUser = baseUser({
  id: "email-user",
  user_metadata: { [PASSWORD_SET_META_KEY]: true },
  identities: [{ id: "e1", provider: "email" }] as User["identities"],
});
const emailNeedsPassword = baseUser({
  id: "email-pw",
  user_metadata: { [PASSWORD_SET_META_KEY]: false },
  identities: [{ id: "e2", provider: "email" }] as User["identities"],
});

assert.equal(userHasOAuthIdentity(oauthUser), true, "google identity detected");
assert.equal(userHasOAuthIdentity(emailUser), false, "email-only is not OAuth");

assert.deepEqual(await resolveAuthenticatedDestination(emailUser), { to: "/app" }, "email/password unchanged");
assert.deepEqual(
  await resolveAuthenticatedDestination(emailNeedsPassword),
  CREATE_PASSWORD_LOCATION,
  "password gate still first",
);

const authExperience = readFileSync(resolve(process.cwd(), "src/components/auth/AuthExperience.tsx"), "utf8");
const platformRoute = readFileSync(resolve(process.cwd(), "src/routes/_platform/route.tsx"), "utf8");
const indexRoute = readFileSync(resolve(process.cwd(), "src/routes/index.tsx"), "utf8");
const gateSource = readFileSync(resolve(process.cwd(), "src/lib/auth-onboarding-gate.ts"), "utf8");

assert(gateSource.includes('rpc("get_my_onboarding_state")'), "uses official onboarding RPC");
assert(authExperience.includes("resolveAuthenticatedDestination"), "AuthExperience wired");
assert(platformRoute.includes("resolveAuthenticatedDestination"), "platform gate wired");
assert(indexRoute.includes("resolveAuthenticatedDestination"), "index gate wired");
assert(authExperience.includes('provider: "google" | "apple"'), "Apple OAuth entry unchanged");

console.log("auth-onboarding-gate.test.ts: PASS");
