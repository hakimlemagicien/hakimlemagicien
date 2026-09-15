import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const platformRoute = source("src/routes/_platform/route.tsx");
const platformNav = source("src/components/platform/layout/PlatformNav.tsx");
const nutritionRoute = source("src/routes/_platform/app/nutrition/index.tsx");

assert(
  platformRoute.includes("approvedPlatformUsers.has(session.user.id)"),
  "reuses a successful platform authorization during in-app navigation",
);
assert(
  platformRoute.includes("approvedPlatformUsers.add(session.user.id)"),
  "caches the user only after the platform gate succeeds",
);
assert.equal(
  platformNav.match(/preload="render"/g)?.length,
  2,
  "preloads both mobile navigation link variants",
);
assert(!nutritionRoute.includes("setBooting"), "does not add an artificial nutrition boot delay");
assert(!nutritionRoute.includes("280"), "does not retain the artificial 280 ms delay");
assert(
  nutritionRoute.includes("if (plan.runtimeLoading)"),
  "keeps the real nutrition loading state",
);

console.log("app-navigation-performance.test.ts: PASS");
