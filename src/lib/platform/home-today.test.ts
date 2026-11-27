import assert from "node:assert/strict";
import { matchGuideAnswer, resolveGuidePage } from "./guide-chat.ts";
import { buildStageLine, buildTodayPlan } from "./home-today.ts";
import type { NextSessionState } from "./home-hub.ts";
import type { PlatformActivitySnapshot } from "./platform-activity.ts";

const activity = {
  activityStreak: 3,
  mealsDone: 0,
  mealsTotal: 4,
  workoutDone: 0,
  daysIn: 12,
  lastWeighInDate: "2026-11-25",
  currentWeight: 82,
  waterGlassMl: 250,
} as unknown as PlatformActivitySnapshot;

const session: NextSessionState = {
  kind: "workout",
  eyebrow: "",
  title: "الجزء العلوي",
  meta: "35 دقيقة",
  href: "/app/program/workout",
  cta: "ابدأ الآن",
};

const at = (iso: string) => new Date(iso);

function plan(over: Partial<PlatformActivitySnapshot>, opts: { gender?: string; waterMl?: number; date?: Date } = {}) {
  return buildTodayPlan({
    firstName: "سارة",
    gender: opts.gender ?? "female",
    goalLabel: "خسارة الدهون",
    activity: { ...activity, ...over },
    session,
    water: { totalMl: opts.waterMl ?? 500, goalMl: 2500 },
    nextMealName: "شوفان بالموز",
    date: opts.date ?? at("2026-11-27T14:00:00"),
  });
}

// Weekly weigh-in: hidden when weighed recently, shown (and first in the morning) when due.
assert.equal(plan({}).tasks.some((t) => t.id === "weight"), false);
const due = plan({ lastWeighInDate: "2026-11-15" }, { date: at("2026-11-27T07:00:00") });
assert.equal(due.tasks.some((t) => t.id === "weight"), true);
assert.equal(due.next.taskId, "weight");

// Next step and Hakim's line follow the stage reached.
const p1 = plan({});
assert.equal(p1.next.taskId, "workout");
assert.equal(p1.next.label, "ابدأ تمرين اليوم");
assert.equal(buildStageLine(p1, { date: at("2026-11-27T14:00:00") }).stage, "workout");

const p2 = plan({ workoutDone: 1 });
assert.equal(p2.next.taskId, "meals");
const meals = buildStageLine(p2, { date: at("2026-11-27T15:00:00") });
assert.equal(meals.stage, "meals");
assert.match(meals.text, /تعبتِ/); // feminine wording
assert.match(meals.text, /شوفان بالموز/);

const p3 = plan({ workoutDone: 1, mealsDone: 4 }, { waterMl: 2600 });
assert.equal(p3.next.taskId, "all-done");
assert.equal(buildStageLine(p3).stage, "all-done");

// Water reaction speaks at the water stage.
const water = buildStageLine(p1, { event: { type: "water", leftGlasses: 7, goalReached: false } });
assert.equal(water.stage, "water");
assert.match(water.text, /7 أكواب/);

// Guide chat: page-based suggestions and colloquial matching.
assert.equal(resolveGuidePage("/app").id, "home");
assert.equal(resolveGuidePage("/app/nutrition/meal").id, "nutrition");
assert.equal(resolveGuidePage("/app/program/workout").id, "workout");
assert.equal(resolveGuidePage("/app/support/chat").id, "general");
assert.equal(matchGuideAnswer("وزني ما نزل هذا الاسبوع ليش")?.id, "progress-plateau");
assert.equal(matchGuideAnswer("ركبتي توجعني في السكوات")?.id, "workout-pain");
assert.equal(matchGuideAnswer("كيف الغي الاشتراك")?.id, "billing-manage");
assert.equal(matchGuideAnswer("ما احب الدجاج ابغى بديل")?.id, "nutrition-swap");
assert.equal(matchGuideAnswer("سؤال عشوائي تماما"), null);

console.log("home-today + guide-chat: ok");
