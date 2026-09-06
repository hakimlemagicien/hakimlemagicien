import {
  assessTemplateCompatibility,
  buildSevenDayWeek,
  countWorkoutDays,
  mapClientGoalToProgramGoal,
  mapClientTrainingLocation,
  rebuildWeekKeepingWorkouts,
  sessionPresentationForDay,
  templateLocationFromMetadata,
  weekMatchesDaysPerWeek,
  assessClientProgramEditImpact,
} from "./admin-program-ops";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(templateLocationFromMetadata({ training_location: "gym" }) === "GYM", "location from metadata");
assert(mapClientTrainingLocation("home_only") === "HOME", "client home");
assert(mapClientGoalToProgramGoal("fat_loss") === "cut", "goal mapping");

const week = buildSevenDayWeek(3);
assert(week.length === 7, "seven day week");
assert(countWorkoutDays(week) === 3, "3 training days");
assert(weekMatchesDaysPerWeek(week, 3), "days match definition");
assert(week.filter((day) => day.day_type === "rest").length === 4, "rest days present");

const rest = sessionPresentationForDay({ day_type: "rest", exercises: [] });
assert(rest.visualKey === "REST", "rest presentation");

const legs = sessionPresentationForDay({
  day_type: "workout",
  muscle_focus: "أرجل",
  exercises: [{ exercise_external_id: "LE-002" }, { exercise_external_id: "GL-003" }],
});
assert(legs.displayNameAr.includes("رجل") || legs.visualKey === "LEGS", "legs session name");

const safe = assessTemplateCompatibility({
  template: { goal: "cut", level: "beginner", days_per_week: 3, training_location: "GYM", weeks: [{ week_number: 1, title_ar: null, notes_ar: null, days: week }] },
  client: { goal: "fat_loss", level: "beginner", trainingType: "gym", daysPerWeek: 3 },
});
assert(safe.status === "SAFE", "compatible template");

const impact = assessTemplateCompatibility({
  template: { goal: "cut", level: "beginner", days_per_week: 5, training_location: "GYM" },
  client: { goal: "cut", trainingType: "home", daysPerWeek: 3 },
});
assert(impact.status === "HIGH_IMPACT", "days/location mismatch is high impact");
assert(impact.reasons.length > 0, "reasons listed");

const rebuilt = rebuildWeekKeepingWorkouts(
  { week_number: 1, title_ar: null, notes_ar: null, days: week.map((day, index) => (index === 1 ? { ...day, exercises: [{ exercise_id: "x", sort_order: 0, sets: 3, reps_min: 8, reps_max: 10, reps_label: null, rest_seconds: 60, suggested_weight_kg: null, notes_ar: null }] } : day)) },
  4,
);
assert(rebuilt.days.length === 7, "rebuild stays 7 days");
assert(countWorkoutDays(rebuilt.days) === 4, "rebuild honors days per week");

const editSafe = assessClientProgramEditImpact({
  beforeDays: [{ day_type: "workout", exercises: [{ exercise_id: "a", exercise_name_ar: "A" }] }],
  afterDays: [{ day_type: "workout", exercises: [{ exercise_id: "a", exercise_name_ar: "A" }] }],
});
assert(editSafe.status === "SAFE", "prescription-only is safe");

const editReview = assessClientProgramEditImpact({
  beforeDays: [{ day_type: "workout", exercises: [{ exercise_id: "a", exercise_name_ar: "A" }] }],
  afterDays: [{ day_type: "workout", exercises: [{ exercise_id: "b", exercise_name_ar: "B" }] }],
});
assert(editReview.status === "REVIEW", "single replace is review");
assert(editReview.replacements[0]?.from === "A", "before name");

const empty = assessClientProgramEditImpact({
  beforeDays: [{ day_type: "workout", exercises: [{ exercise_id: "a" }] }],
  afterDays: [{ day_type: "workout", exercises: [] }],
});
assert(empty.emptyWorkoutDays, "empty workout flagged");
assert(empty.status === "HIGH_IMPACT", "empty workout is high impact");

console.log("admin-program-ops.test.ts: all assertions passed");
