import assert from "node:assert/strict";
import { buildWorkoutCoachMessage, type WorkoutCoachInput } from "./workout-coach.ts";

const base: WorkoutCoachInput = {
  firstName: "سارة",
  female: true,
  phase: "exercise",
  setInProgress: false,
  exerciseIndex: 0,
  totalExercises: 4,
  exercise: { id: "e1", name: "بنش برس", sets: 4, repsMin: 15, repsMax: 20, weightKg: 40, isTimed: false },
  completedSetsCurrent: 0,
  currentSetNumber: 1,
  lastLog: null,
  nextExerciseName: "تفتيح دمبل",
  completedWorkingSets: 0,
  durationMin: 40,
};

const brief = buildWorkoutCoachMessage(base);
assert.equal(brief.moment, "brief");
const warmBrief = buildWorkoutCoachMessage({ ...base, exercise: { ...base.exercise, isWarmUp: true } });
assert.match(warmBrief.hint ?? "", /نبدأ بالإحماء/);
assert.doesNotMatch(warmBrief.hint ?? "", /5 دقائق/);
assert.deepEqual(
  brief.actions.map((a) => a.id),
  ["video", "start"],
);
assert.match(brief.text, /جاهزة/);

const set = buildWorkoutCoachMessage({ ...base, setInProgress: true });
assert.equal(set.moment, "set");
assert.match(set.text, /15–20/);

const last = buildWorkoutCoachMessage({ ...base, setInProgress: true, currentSetNumber: 4 });
assert.match(last.text, /آخر جولة/);

// Rest reacts to the logged reps and counts the next round from the log.
const log = { exerciseId: "e1", setNumber: 1, weightKg: 40, effort: "medium" as const };
const above = buildWorkoutCoachMessage({ ...base, phase: "rest", lastLog: { ...log, reps: 22 } });
assert.equal(above.moment, "rest-set");
assert.match(above.text, /فوق الهدف/);
assert.match(above.hint ?? "", /الجولة 2 من 4/);
const below = buildWorkoutCoachMessage({ ...base, phase: "rest", lastLog: { ...log, reps: 10 } });
assert.equal(below.tone, "care");
assert.match(below.text, /خفّفي/);

// Last set of the exercise → announce the next exercise.
const next = buildWorkoutCoachMessage({
  ...base,
  phase: "rest",
  completedSetsCurrent: 3,
  lastLog: { ...log, setNumber: 4, reps: 16 },
});
assert.equal(next.moment, "rest-exercise");
assert.match(next.hint ?? "", /تفتيح دمبل/);

const done = buildWorkoutCoachMessage({ ...base, phase: "complete", completedWorkingSets: 14 });
assert.equal(done.moment, "complete");
assert.match(done.text, /أنهيتِ الحصة/);

const partial = buildWorkoutCoachMessage({ ...base, phase: "complete", completedWorkingSets: 1, partial: true });
assert.match(partial.text, /جولة واحدة/);
assert.match(partial.text, /سجّلتِه/);
assert.match(done.text, /14 جولة/);

console.log("workout-coach: ok");
