/**
 * New-account 2-hour program hold — contract checks.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  padHoldUnit,
  PROGRAM_PREPARATION_HOLD_MS,
  resolveProgramPreparationHold,
  stepForElapsedMs,
} from "./program-preparation-hold.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const start = new Date("2026-09-05T08:00:00.000Z");

const fresh = resolveProgramPreparationHold({
  createdAt: start.toISOString(),
  now: start,
});
assert(fresh.active, "new account is held");
assertEqual(fresh.hours, 2, "starts at 2 hours");
assertEqual(fresh.minutes, 0, "zero minutes at start");
assertEqual(fresh.currentStep, 2, "building step after quiz analysis");

const mid = resolveProgramPreparationHold({
  createdAt: start.toISOString(),
  now: start.getTime() + 60 * 60 * 1000,
});
assert(mid.active, "still held at 1 hour");
assertEqual(mid.hours, 1, "1 hour remaining");
assertEqual(mid.currentStep, 3, "quality review after 45%");

const done = resolveProgramPreparationHold({
  createdAt: start.toISOString(),
  now: start.getTime() + PROGRAM_PREPARATION_HOLD_MS,
});
assert(!done.active, "unlocks at 2 hours");
assertEqual(done.hours, 0, "zero hours after window");
assertEqual(done.currentStep, 4, "ready step after window");

const coach = resolveProgramPreparationHold({
  createdAt: start.toISOString(),
  now: start,
  coachAssigned: true,
});
assert(!coach.active, "coach assignment unlocks immediately");

assert(!resolveProgramPreparationHold({ createdAt: null, now: start }).active, "missing createdAt does not hold");
assert(!resolveProgramPreparationHold({ createdAt: "not-a-date", now: start }).active, "invalid date does not hold");

assertEqual(stepForElapsedMs(0), 2, "step 2 at start");
assertEqual(padHoldUnit(2), "02", "pad hours");
assertEqual(padHoldUnit(0), "00", "pad zero");

const olderAccount = resolveProgramPreparationHold({
  createdAt: new Date(start.getTime() - 3 * 60 * 60 * 1000).toISOString(),
  now: start,
});
assert(!olderAccount.active, "accounts older than 2h are not held");

const root = process.cwd();
const card = readFileSync(join(root, "src/components/platform/workout/ProgramPreparationHoldCard.tsx"), "utf8");
assert(card.includes("FlipDigits"), "live flipping countdown");
assert(card.includes("JourneyRadarCard"), "locked open journey radar");
assert(card.includes("hold-blip-label"), "active radar blip shows name");
assert(card.includes("flex-col items-center"), "blip label sits under the point");
assert(card.includes('active && "hold-station-bounce"'), "label bounces with the point");
assert(card.includes("JOURNEY_PATH"), "rtl journey path");
assert(card.includes("M304 58"), "path starts on the right");
assert(card.includes("304 - progress"), "dot travels right to left");
assert(card.includes('dir="rtl"'), "map reads right to left");
assert(card.includes("HoldWhyCard"), "explains countdown above radar");
assert(card.includes("OriginalPremiumCard"), "restores first premium promo");
assert(card.includes("التزام اليوم يصنع نتائج الغد"), "original Hakim quote");
assert(card.includes("8px-var(--platform-gutter)"), "matches goal hero side inset");
assert(card.includes("2*var(--platform-gutter)-16px"), "matches goal hero width");
assert(!card.includes("HOLD_DESIGN_OPTIONS"), "design gallery closed");
assert(!card.includes("bg-[#07140f]"), "dark closed radar removed");

const hook = readFileSync(join(root, "src/hooks/useProgramPreparationHold.ts"), "utf8");
assert(!hook.includes("isLocalProgramHoldPreview"), "no localhost force-preview");
assert(!hook.includes("createLocalHoldPreview"), "no fake createdAt preview");
assert(hook.includes("profileQuery.data?.createdAt"), "hold uses real account createdAt");

const copy = readFileSync(join(root, "src/lib/platform/training-product-copy.ts"), "utf8");
assert(copy.includes("جاري إعداد برنامجك"), "hold badge copy");
assert(copy.includes("نحن نجهّز لك برنامجك الشخصي"), "hold title copy");
assert(copy.includes("نقوم حالياً بتحليل بياناتك"), "hold body copy");
assert(copy.includes("ترقية الآن"), "upgrade CTA copy");
assert(!copy.includes("homeHoldWorkoutSubtitle"), "home no longer uses hold subtitle");

const workout = readFileSync(join(root, "src/routes/_platform/app/program/workout/index.tsx"), "utf8");
assert(workout.includes("ProgramPreparationHoldCard"), "workout shows hold room");
assert(workout.includes("hold.active"), "workout gates schedule on hold");
assert(workout.includes("<WorkoutGoalHero"), "workout keeps goal hero during hold");
assert(!workout.includes("isLocalProgramHoldPreview"), "workout does not force local hold preview");
assert(workout.includes("showUpgrade={!membership.is_paid}"), "upgrade only for free members");

const exercise = readFileSync(join(root, "src/routes/_platform/app/program/workout/exercise.tsx"), "utf8");
assert(!exercise.includes("isLocalProgramHoldPreview"), "exercise does not force local hold preview");

const platform = readFileSync(join(root, "src/routes/_platform/route.tsx"), "utf8");
assert(platform.includes("useProgramPreparationHold"), "platform delays auto-assign");
assert(
  platform.includes("enabled: !membership.loading && Boolean(userId) && !hold.active && !holdLoading"),
  "auto-assign waits for hold and profile createdAt",
);

const home = readFileSync(join(root, "src/routes/_platform/app/index.tsx"), "utf8");
assert(!home.includes("ProgramPreparationHoldCard"), "home does not show hold room");
assert(!home.includes("useProgramPreparationHold"), "home does not run hold room");
assert(home.includes("HomeNextSession"), "home keeps normal next session");

const homeHub = readFileSync(join(root, "src/lib/platform/home-hub.ts"), "utf8");
assert(!homeHub.includes("buildProgramHoldNextSession"), "home hub hold session removed");
assert(!homeHub.includes("programHoldActive"), "home hub ignore hold flag");

const holdLib = readFileSync(join(root, "src/lib/platform/program-preparation-hold.ts"), "utf8");
assert(!holdLib.includes("isLocalProgramHoldPreview"), "local preview helper removed");
assert(!holdLib.includes("createLocalHoldPreview"), "local preview factory removed");

console.log("program-preparation-hold.test.ts: all assertions passed");
