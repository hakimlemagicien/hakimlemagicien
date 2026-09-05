/**
 * Client Strategy Matrix self-setup — source/contract checks, no live DB.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const setup = readFileSync(join(root, "src/lib/platform/client-training-strategy-setup.ts"), "utf8");
assert(setup.includes("saveMyTrainingStrategySetup"), "client can save strategy setup");
assert(setup.includes("UNMAPPED_LEGACY_GOAL"), "unmapped goal is client-fixable");
assert(setup.includes("MISSING_PROFILE_DATA"), "missing profile is client-fixable");
assert(setup.includes("trainingDaysPerWeek"), "days per week captured");
assert(setup.includes("trainingEnvironment"), "training environment captured");
assert(setup.includes("needDays: false"), "client never asked for days");
assert(setup.includes("needEnvironment: false"), "client never asked for place");
assert(setup.includes("CLIENT_DEFAULT_TRAINING_DAYS_PER_WEEK"), "defaults to 5 days");
assert(setup.includes("CLIENT_DEFAULT_TRAINING_ENVIRONMENT"), "defaults environment");

assert(setup.includes("parseClientQuizAnswers"), "setup gaps use quiz catalog");
assert(setup.includes("resolveStrategyTrainingLocation"), "setup resolves location from quiz hints");
assert(setup.includes("sanitizeTrainingLocationHints"), "setup sanitizes contact/service location noise");

const card = readFileSync(
  join(root, "src/components/platform/workout/ClientTrainingStrategySetupCard.tsx"),
  "utf8",
);
assert(card.includes("احفظ وفعّل برنامجي") || card.includes("strategySetupCta"), "setup CTA present");
assert(!card.includes("أيام التدريب أسبوعياً"), "no days question on card");
assert(!card.includes("مكان التدريب"), "no place question on card");

const workout = readFileSync(join(root, "src/routes/_platform/app/program/workout/index.tsx"), "utf8");
assert(workout.includes("ClientTrainingStrategySetupCard"), "workout shows strategy setup card");
assert(!workout.includes("سيظهر تمرينك هنا بعد أن يعيّن المدرب برنامجاً"), "coach-wait copy gone");
assert(!workout.includes("لا برنامج تدريبي معيَّن"), "no-program coach empty removed");
assert(workout.includes("initialAnswers"), "workout passes full quiz answers pack");
assert(workout.includes("strategySetupAnswers"), "workout merges quiz progress + training answers");
assert(workout.includes("showStrategySetup"), "unified strategy setup gate");
assert(workout.includes("runPaidTrainingAutoAssignment"), "paid retry after setup");

const copy = readFileSync(join(root, "src/lib/platform/training-product-copy.ts"), "utf8");
assert(copy.includes("strategySetupTitle"), "setup copy exists");

const homeHub = readFileSync(join(root, "src/lib/platform/home-hub.ts"), "utf8");
assert(homeHub.includes("strategySetupCta"), "home hub CTA points client to setup");

const exercise = readFileSync(join(root, "src/routes/_platform/app/program/workout/exercise.tsx"), "utf8");
assert(exercise.includes("strategySetupTitle") || exercise.includes("strategySetupCta"), "exercise empty routes to setup");

console.log("client-training-strategy-setup.test.ts: all assertions passed");
