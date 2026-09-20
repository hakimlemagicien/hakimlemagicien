import assert from "node:assert/strict";
import {
  cleanPasswordFlowLocation,
  getPasswordFlowIntent,
  passwordRecoveryRedirectUrl,
} from "./auth-flow-intent.ts";

assert.equal(
  getPasswordFlowIntent("https://maakfit.com/auth?flow=password-recovery&code=pkce-code"),
  "recovery",
  "explicit recovery marker survives PKCE callbacks that only contain code",
);
assert.equal(
  getPasswordFlowIntent("https://maakfit.com/auth#type=recovery&access_token=token"),
  "recovery",
  "legacy recovery hash remains supported",
);
assert.equal(
  getPasswordFlowIntent("https://maakfit.com/auth?type=invite&code=invite-code"),
  "invite",
  "invite links require password creation",
);
assert.equal(
  getPasswordFlowIntent("https://maakfit.com/auth?code=oauth-code"),
  null,
  "ordinary OAuth callbacks are not treated as password recovery",
);
assert.equal(
  passwordRecoveryRedirectUrl("https://maakfit.com"),
  "https://maakfit.com/auth?flow=password-recovery",
);
assert.equal(
  cleanPasswordFlowLocation(
    "https://maakfit.com/auth?flow=password-recovery&code=pkce-code&type=recovery#access_token=secret",
  ),
  "/auth",
  "one-time recovery material is removed after password save",
);

console.log("auth-flow-intent.test.ts: PASS");
