import assert from "node:assert/strict";
import {
  PRODUCTION_APP_ORIGIN,
  STAGING_APP_ORIGIN,
  resolveAppOrigin,
} from "./assert-environment.ts";

assert.equal(
  resolveAppOrigin("staging", "https://hakimlemagicien-preview.vercel.app"),
  STAGING_APP_ORIGIN,
  "staging ignores Preview origin",
);
assert.equal(
  resolveAppOrigin("staging", "https://staging.hakimlemagicien.com"),
  STAGING_APP_ORIGIN,
  "staging stays on canonical host",
);
assert.equal(
  resolveAppOrigin("production", "https://hakimlemagicien.com"),
  PRODUCTION_APP_ORIGIN,
  "production uses current origin",
);
assert.equal(
  resolveAppOrigin("development", "http://localhost:5173"),
  "http://localhost:5173",
  "local keeps window origin",
);
assert.equal(resolveAppOrigin("production", null), PRODUCTION_APP_ORIGIN, "ssr production fallback");
assert.equal(resolveAppOrigin("", null), PRODUCTION_APP_ORIGIN, "empty env falls back to production origin");

console.log("assert-environment origin tests passed");
