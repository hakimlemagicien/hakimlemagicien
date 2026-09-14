import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  resolveClientGoalLabelForGender,
  resolveClientPresentationIdentity,
} from "./client-presentation-identity.ts";

// Female body goal + male coach stock was the production mix-up in the reference screenshots.
const femaleBody = resolveClientPresentationIdentity({
  gender: "female",
  goalId: "body",
  goalText: "جسم متناسق وأنثوي",
});
assert.equal(femaleBody.goalLabel, "جسم متناسق وأنثوي");
assert.equal(femaleBody.mediaGoalId, "body");

const maleCorrupt = resolveClientPresentationIdentity({
  gender: "male",
  goalId: "body",
  goalText: "جسم متناسق وأنثوي",
});
assert.equal(maleCorrupt.goalLabel.includes("أنثوي"), false);
assert.notEqual(maleCorrupt.mediaGoalId, "body");
assert.equal(resolveClientGoalLabelForGender("male", maleCorrupt.mediaGoalId).includes("أنثوي"), false);

const source = readFileSync(resolve(process.cwd(), "src/lib/platform/workout-goal-hero-images.ts"), "utf8");
assert.ok(source.includes("listHeroGoalAssets"), "workout cards fall back to same-gender catalog");
assert.equal(source.includes("coachPhoto"), false, "male coach must never pad female goal cards");
assert.ok(source.includes("assertNoCrossGenderMedia"), "CMS/content URLs are gender-gated");
assert.ok(
  source.includes("resolveClientGoalLabelForGender(gender, goalId)"),
  "photo alts follow media slot label",
);

console.log("workout-goal-hero-images.test.ts: PASS");
