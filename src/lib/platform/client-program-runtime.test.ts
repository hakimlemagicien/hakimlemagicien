import { readFileSync } from "node:fs";
import { join } from "node:path";
import { currentWeekNumber, formatRepsLabel, ISO_DAY_TO_WEEKDAY } from "./training-assignment";
import { runtimeToWeekdayPlans, type ClientTrainingRuntime } from "./assigned-program-api";
import { resolveWeekdayPlan } from "./weekly-workout-schedule";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(ISO_DAY_TO_WEEKDAY[1] === "mon", "ISO Monday maps to mon");
assert(formatRepsLabel({ reps_min: 10, reps_max: 10 }) === "10", "equal reps collapse");
assert(currentWeekNumber({ startsOn: null, durationWeeks: 8 }).week === 1, "no start date stays week 1");

const empty: ClientTrainingRuntime = {
  reason: "no_program",
  snapshotComplete: false,
  currentWeekNumber: null,
  assignment: null,
  days: [],
};
assert(runtimeToWeekdayPlans(empty).mon.isRestDay, "no program does not invent a training day");

const assigned: ClientTrainingRuntime = {
  reason: "ok",
  snapshotComplete: true,
  currentWeekNumber: 1,
  assignment: {
    id: "a1",
    status: "active",
    name_ar: "برنامج",
    starts_on: "2026-08-01",
    template_version: 1,
    duration_weeks: 8,
    days_per_week: 4,
  },
  days: [
    {
      day_number: 1,
      day_type: "workout",
      title_ar: "صدر",
      muscle_focus: "صدر",
      estimated_minutes: 40,
      estimated_calories: 300,
      exercises: [
        {
          id: "ex1",
          exercise_id: "db-1",
          external_id: "CH-001",
          name_ar: "بنش",
          sets: 4,
          reps_min: 8,
          reps_max: 10,
          reps_label: null,
          rest_seconds: 90,
          suggested_weight_kg: 40,
          notes_ar: "تحكم بالنزول",
        },
      ],
    },
  ],
};
const plans = runtimeToWeekdayPlans(assigned);
assert(!plans.mon.isRestDay, "assigned Monday workout is used");
assert(plans.mon.prescriptions[0]?.assignmentExerciseId === "ex1", "prescription keeps snapshot exercise id");
assert(plans.sun.isRestDay, "unmapped days stay rest");

const paidEmpty = resolveWeekdayPlan("mon", true);
assert(paidEmpty.isRestDay, "paid member without assignment does not receive seed week");
const freePreview = resolveWeekdayPlan("mon", false);
assert(!freePreview.isRestDay, "free preview remains a marketing preview");
assert(freePreview.prescriptions[0]?.external_id === "CH-001", "free preview still unlocks chest");

const root = process.cwd();
const workoutPage = readFileSync(join(root, "src/routes/_platform/app/program/workout/index.tsx"), "utf8");
assert(workoutPage.includes("client-training-runtime") || workoutPage.includes("useAssignedTrainingRuntime"), "workout route reads assignment runtime");
assert(workoutPage.includes("لا برنامج تدريبي معيَّن"), "no-program empty state exists");
assert(!workoutPage.includes("from \"@/components/admin"), "workout route does not import admin UI");
assert(!workoutPage.includes("admin_assign_client_program"), "client cannot assign");

const assignedApi = readFileSync(join(root, "src/lib/platform/assigned-program-api.ts"), "utf8");
assert(assignedApi.includes("client_get_my_training_runtime"), "client runtime RPC is used");
assert(!assignedApi.includes("@/lib/admin"), "client runtime does not import admin modules");

const logsApi = readFileSync(join(root, "src/lib/platform/workout-set-logs-api.ts"), "utf8");
assert(logsApi.includes("assignment_id"), "new logs can carry assignment context");
assert(logsApi.includes("assignment_exercise_id"), "new logs can carry snapshot exercise");

console.log("client-program-runtime tests passed");
