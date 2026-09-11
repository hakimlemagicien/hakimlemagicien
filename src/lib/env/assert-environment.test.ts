import assert from "node:assert/strict";
import {
  LEGACY_PRODUCTION_APP_ORIGIN,
  PRODUCTION_APP_ORIGIN,
  STAGING_APP_ORIGIN,
  productionCanonicalUrl,
  resolveAppOrigin,
} from "./assert-environment.ts";

assert.equal(PRODUCTION_APP_ORIGIN, "https://maakfit.com", "canonical production origin is maakfit.com");
assert.equal(
  LEGACY_PRODUCTION_APP_ORIGIN,
  "https://hakimlemagicien.com",
  "legacy origin kept for dual-host cutover",
);

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
  resolveAppOrigin("production", "https://maakfit.com"),
  PRODUCTION_APP_ORIGIN,
  "production uses current origin on canonical host",
);
assert.equal(
  resolveAppOrigin("production", LEGACY_PRODUCTION_APP_ORIGIN),
  LEGACY_PRODUCTION_APP_ORIGIN,
  "production keeps legacy host when the visitor is still there",
);
assert.equal(
  resolveAppOrigin("development", "http://localhost:5173"),
  "http://localhost:5173",
  "local keeps window origin",
);
assert.equal(resolveAppOrigin("production", null), PRODUCTION_APP_ORIGIN, "ssr production fallback");
assert.equal(resolveAppOrigin("", null), PRODUCTION_APP_ORIGIN, "empty env falls back to production origin");
assert.equal(productionCanonicalUrl("/"), "https://maakfit.com/", "root canonical");
assert.equal(productionCanonicalUrl("/quiz"), "https://maakfit.com/quiz", "quiz canonical");

console.log("assert-environment origin tests passed");
