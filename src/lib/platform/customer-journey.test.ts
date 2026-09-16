import {
  composeSixMealOrder,
  normalizeTrainingDays,
  selectBestProgramTemplate,
} from "./customer-journey";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function equal(actual: unknown, expected: unknown, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(`${message}: ${JSON.stringify(actual)}`);
}

equal(normalizeTrainingDays(2), 3, "two days normalize to three");
equal(normalizeTrainingDays(4), 4, "four days remain four");

const templates = [
  {
    id: "wrong-gender",
    goal: "bulk",
    level: "beginner",
    gender: "female" as const,
    daysPerWeek: 6,
    version: 9,
    published: true,
  },
  {
    id: "wrong-goal",
    goal: "cut",
    level: "beginner",
    gender: "male" as const,
    daysPerWeek: 6,
    version: 9,
    published: true,
  },
  {
    id: "male-4",
    goal: "bulk",
    level: "beginner",
    gender: "male" as const,
    daysPerWeek: 4,
    version: 1,
    published: true,
  },
  {
    id: "male-5",
    goal: "bulk",
    level: "beginner",
    gender: "male" as const,
    daysPerWeek: 5,
    version: 1,
    published: true,
  },
];
equal(
  selectBestProgramTemplate({
    preferredDays: 4,
    gender: "male",
    goal: "bulk",
    level: "beginner",
    templates,
  })?.id,
  "male-4",
  "scenario A exact compatible four-day template",
);
equal(
  selectBestProgramTemplate({
    preferredDays: 6,
    gender: "male",
    goal: "bulk",
    level: "beginner",
    templates,
  })?.id,
  "male-5",
  "scenario C nearest five-day fallback",
);
assert(
  selectBestProgramTemplate({
    preferredDays: 6,
    gender: "female",
    goal: "cut",
    level: "beginner",
    templates,
  }) === null,
  "wrong goal/gender never crosses fallback boundary",
);
equal(
  composeSixMealOrder("after_lunch"),
  ["breakfast", "lunch", "pre_workout", "post_workout", "evening_meal", "dinner"],
  "scenario G after-lunch pre/post placement",
);
equal(
  composeSixMealOrder("before_breakfast"),
  ["pre_workout", "post_workout", "breakfast", "lunch", "evening_meal", "dinner"],
  "before-breakfast placement",
);

console.log("customer-journey.test.ts: all assertions passed");
