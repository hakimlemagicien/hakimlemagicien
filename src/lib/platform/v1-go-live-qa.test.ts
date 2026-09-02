/**
 * V1 Go-Live automated QA — logic/contracts without live DB or orchestrator barrel.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveWeekdayPlan } from "./weekly-workout-schedule";
import { generateTrainingProgram, canActivateProgram } from "./program-generation";
import type { ProgramGenerationContext } from "./program-generation/types";
import { loadAuthoredV2Metadata, toV2Contract } from "./exercise-library-v2-validator";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const exercises = loadAuthoredV2Metadata().map((row) => toV2Contract(row, "placeholder"));
const assignmentGates = readFileSync(
  join(root, "src/lib/platform/training-strategy-hardening/assignment-gates.ts"),
  "utf8",
);
const orchestrator = readFileSync(
  join(root, "src/lib/platform/training-assignment-orchestrator/orchestrator.ts"),
  "utf8",
);
assert(orchestrator.includes("assignmentMode"), "orchestrator supports assignment modes");
const paidAutoRunner = readFileSync(join(root, "src/lib/platform/paid-training-auto-assign.ts"), "utf8");

function baseCtx(): ProgramGenerationContext {
  return {
    goalId: "GLUTE_GROWTH",
    trainingLevel: "INTERMEDIATE",
    daysPerWeek: 3,
    availableMinutes: 60,
    location: "GYM",
    availableEquipment: null,
    exercises,
    reason: "INITIAL_PROGRAM_GENERATION",
  };
}

assert(assignmentGates.includes("AUTOMATED_ASSIGNMENT_GLOBALLY_DISABLED = false"), "auto assign enabled");
assert(paidAutoRunner.includes('assignmentMode: "AUTOMATED"'), "paid runner uses AUTOMATED mode");
assert(paidAutoRunner.includes("automatedGloballyDisabled: false"), "paid runner enables automation");
assert(paidAutoRunner.includes("clientRecordProgramReviewRequired"), "exception review path");

const gen = generateTrainingProgram(baseCtx());
assert(gen.candidate && canActivateProgram(gen.validation, gen.status), "generator valid");
const payload = {
  goal_id: gen.candidate!.goal_id,
  days_per_week: gen.candidate!.days_per_week,
  version: gen.candidate!.version,
  name_ar: "برنامجك الشخصي",
  generation_reason: gen.generation_reason,
  sessions: gen.candidate!.sessions.map((session) => ({
    sequence_index: session.sequence_index,
    title: session.title,
    primary_regions: session.primary_regions,
    estimated_minutes: session.estimated_minutes,
    exercises: session.exercises.map((row) => ({
      external_id: row.external_id,
      sets: row.sets,
      reps_min: row.reps_min,
      reps_max: row.reps_max,
      rest_seconds: row.rest_seconds,
      suggested_weight_kg: null,
    })),
  })),
};

assert(typeof payload.goal_id === "string" && payload.goal_id.trim().length > 0, "assignment payload goal_id");
assert(Array.isArray(payload.sessions) && payload.sessions.length > 0, "assignment payload sessions");
assert(gen.status === "READY", "generation READY for assign gate");
assert(gen.validation.status !== "INVALID", "validation not INVALID");

const weekly = readFileSync(join(root, "src/lib/platform/weekly-workout-schedule.ts"), "utf8");
assert(!weekly.includes("FREE_CHEST_PREVIEW"), "no generic catalog");
assert(resolveWeekdayPlan("mon", false).isRestDay, "free without plans");

const workoutIndex = readFileSync(join(root, "src/routes/_platform/app/program/workout/index.tsx"), "utf8");
assert(workoutIndex.includes("showFreePreviewIncompleteProfile"), "incomplete profile UI");
assert(workoutIndex.includes("showFreePreviewError"), "error retry UI");
assert(!workoutIndex.includes("showFreeCatalogWeek"), "no catalog week");

const migration = readFileSync(
  join(root, "supabase/migrations/20260902130000_client_v1_auto_assign_training.sql"),
  "utf8",
);
assert(migration.includes("client_assign_generated_v2_program"), "client RPC");
assert(migration.includes("workout_not_entitled"), "entitlement RPC gate");

console.log("v1-go-live-qa tests passed");
