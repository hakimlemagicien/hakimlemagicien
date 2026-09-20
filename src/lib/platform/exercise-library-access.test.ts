import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CLIENT_EXERCISE_LIBRARY_ENABLED,
  canAccessExerciseLibrary,
} from "./exercise-library-access.ts";

const root = process.cwd();
const hub = readFileSync(
  resolve(root, "src/components/platform/shared/ToolsHubOverlay.tsx"),
  "utf8",
);
const guard = readFileSync(resolve(root, "src/lib/platform/exercise-library-route-guard.ts"), "utf8");

assert.equal(CLIENT_EXERCISE_LIBRARY_ENABLED, false, "client library is temporarily disabled");
assert.equal(canAccessExerciseLibrary(), false, "all membership tiers share the disabled gate");
assert(hub.includes("canAccessExerciseLibrary()"), "tools hub uses the central feature gate");
assert(guard.includes("canAccessExerciseLibrary()"), "direct routes use the same feature gate");

console.log("exercise-library-access.test.ts: PASS");
