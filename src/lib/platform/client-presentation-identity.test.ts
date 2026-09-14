import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertNoCrossGenderMedia,
  canonicalGoalsForGender,
  resolveClientGoalLabelForGender,
  resolveClientPresentationIdentity,
} from "./client-presentation-identity.ts";
import {
  inferGoalIdFromText,
  resolveAuthoritativeHeroSlot,
} from "./hero-goal-slot.ts";

// TEST A — Male + Muscle Gain
const maleMuscle = resolveClientPresentationIdentity({
  gender: "male",
  goalId: "muscle",
  goalText: "بناء العضلات",
});
assert.equal(maleMuscle.gender, "male");
assert.equal(maleMuscle.mediaGoalId, "muscle");
assert.equal(maleMuscle.goalLabel, "بناء العضلات");
assert.equal(maleMuscle.goalLabel.includes("أنثوي"), false);
assert.equal(maleMuscle.slot?.goalId, "muscle");

// Male with corrupted female-only goal id still never shows feminine copy
const maleBodyCorrupt = resolveClientPresentationIdentity({
  gender: "male",
  goalId: "body",
  goalText: "جسم متناسق وأنثوي",
});
assert.equal(maleBodyCorrupt.gender, "male");
assert.notEqual(maleBodyCorrupt.goalLabel, "جسم متناسق وأنثوي");
assert.equal(maleBodyCorrupt.goalLabel.includes("أنثوي"), false);
assert.notEqual(maleBodyCorrupt.mediaGoalId, "body");

// TEST B — Female + Fat Loss
const femaleFat = resolveClientPresentationIdentity({
  gender: "female",
  goalId: "fat",
  goalText: "خسارة الدهون",
});
assert.equal(femaleFat.gender, "female");
assert.equal(femaleFat.mediaGoalId, "fat");
assert.equal(femaleFat.goalLabel, "خسارة الدهون");

// TEST C — Male + Fat Loss
const maleFat = resolveClientPresentationIdentity({
  gender: "male",
  goalId: "fat",
  goalText: "خسارة الدهون",
});
assert.equal(maleFat.mediaGoalId, "fat");
assert.equal(maleFat.goalLabel, "خسارة الدهون");

// TEST D — Female + Muscle Gain (media slot remaps to tone; label follows slot)
const femaleMuscle = resolveClientPresentationIdentity({
  gender: "female",
  goalId: "MUSCLE_GROWTH",
  goalText: "بناء العضلات",
});
assert.equal(femaleMuscle.gender, "female");
assert.equal(femaleMuscle.mediaGoalId, "tone");
assert.equal(femaleMuscle.goalLabel, "تحسين شكل الصدر");
assert.equal(femaleMuscle.goalLabel.includes("أنثوي"), false);

// TEST E — Unknown gender → no slot / no invented female media path
const unknown = resolveClientPresentationIdentity({
  gender: null,
  goalId: "MUSCLE_GROWTH",
  goalText: "بناء العضلات",
});
assert.equal(unknown.slot, null);
assert.equal(unknown.goalLabel, "بناء العضلات");
assert.equal(resolveAuthoritativeHeroSlot({ gender: null, goalId: "muscle" }), null);
assert.equal(inferGoalIdFromText("MUSCLE_GROWTH", null), null);

assert.ok(!canonicalGoalsForGender("male").includes("FEMININE_BALANCED_BODY"));
assert.ok(canonicalGoalsForGender("female").includes("FEMININE_BALANCED_BODY"));
assert.ok(assertNoCrossGenderMedia("/assets/hero-goals/hero-goal-man/بناء-العضلات/1.webp", "male"));
assert.equal(
  assertNoCrossGenderMedia("/assets/hero-goals/hero-goal-women/جسم-متناسق-وأنثوي/1.webp", "male"),
  false,
);
assert.equal(
  resolveClientGoalLabelForGender("male", "FEMININE_BALANCED_BODY").includes("أنثوي"),
  false,
);

const workoutSource = readFileSync(
  resolve(process.cwd(), "src/routes/_platform/app/program/workout/index.tsx"),
  "utf8",
);
assert.ok(workoutSource.includes("resolveClientPresentationIdentity"));
assert.equal(workoutSource.includes("quizProgress?.goalId,\n    trainingQuery.data?.goal"), false);

const homeSource = readFileSync(resolve(process.cwd(), "src/routes/_platform/app/index.tsx"), "utf8");
assert.ok(homeSource.includes("resolveClientPresentationIdentity"));

const workoutHeroSource = readFileSync(
  resolve(process.cwd(), "src/lib/platform/workout-goal-hero-images.ts"),
  "utf8",
);
assert.equal(
  resolveClientGoalLabelForGender(null, "body", "جسم متناسق وأنثوي").includes("أنثوي"),
  false,
);
assert.equal(resolveClientGoalLabelForGender(null, "body"), "غير محدد");

assert.ok(workoutHeroSource.includes("listHeroGoalAssets"));
assert.equal(workoutHeroSource.includes("coachPhoto"), false);
assert.equal(workoutHeroSource.includes("workout-goal-stack-1"), false);

console.log("client-presentation-identity.test.ts: A–E PASS");
