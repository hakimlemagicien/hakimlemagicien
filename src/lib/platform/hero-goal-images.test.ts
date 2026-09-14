import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  inferGoalIdFromText,
  normalizeHeroGender,
  resolveAuthoritativeHeroSlot,
} from "./hero-goal-slot.ts";

const maleMuscle = resolveAuthoritativeHeroSlot({
  gender: "male",
  goalId: "muscle",
  goalText: "بناء العضلات",
});
assert.equal(maleMuscle?.gender, "male");
assert.equal(maleMuscle?.goalId, "muscle");

const maleFromArabic = resolveAuthoritativeHeroSlot({
  gender: "ذكر",
  goalText: "تضخيم العضلات",
});
assert.equal(maleFromArabic?.gender, "male");
assert.equal(maleFromArabic?.goalId, "muscle");

assert.equal(
  resolveAuthoritativeHeroSlot({ gender: "female", goalId: "glutes" })?.goalId,
  "glutes",
);

assert.equal(resolveAuthoritativeHeroSlot({ gender: null, goalId: "muscle" }), null);
assert.equal(normalizeHeroGender("female"), "female");
assert.equal(normalizeHeroGender("male"), "male");
assert.equal(inferGoalIdFromText("بناء العضلات", "male"), "muscle");

const source = readFileSync(resolve(process.cwd(), "src/lib/platform/hero-goal-images.ts"), "utf8");
assert.equal(
  source.includes('input?.gender === "female" || quiz?.gender === "female"'),
  false,
  "quiz gender must never override a signed-in profile",
);
assert.equal(source.includes("allowDeviceQuizFallback"), true);
assert.equal(
  readFileSync(resolve(process.cwd(), "src/routes/_platform/app/index.tsx"), "utf8").includes(
    "useLockedHeroGoalImage",
  ),
  true,
  "home waits for locked hero image",
);
assert.equal(
  readFileSync(resolve(process.cwd(), "src/hooks/useLockedHeroGoalImage.ts"), "utf8").includes(
    "preloadHeroGoalImage",
  ),
  true,
  "hero image is preloaded before paint",
);

console.log("hero-goal-images.test.ts: all assertions passed");
