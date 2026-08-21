import { generateTrainingProgram, canActivateProgram } from "@/lib/platform/program-generation";
import type {
  ProgramGenerationContext,
  ProgramGenerationResult,
} from "@/lib/platform/program-generation";
import type { GoalResponseDecision } from "@/lib/platform/goal-intelligence/types";
import type { WeeklyVolumeDecision } from "@/lib/platform/volume/types";
import { programAdaptationJustified } from "./evaluate";

export function shouldRequestProgramGeneration(
  volume: WeeklyVolumeDecision,
  goal: GoalResponseDecision,
) {
  return programAdaptationJustified({ volume, goal }).justified;
}

export function generateAuthorizedProgramCandidate(context: ProgramGenerationContext): {
  result: ProgramGenerationResult;
  assignable: boolean;
  blockReason: string | null;
} {
  const result = generateTrainingProgram(context);
  const assignable = canActivateProgram(result.validation, result.status);
  if (!assignable) {
    const first = result.validation.errors[0]?.code ?? result.status;
    return { result, assignable: false, blockReason: first };
  }
  if (
    result.candidate?.sessions.some((session) =>
      session.exercises.some((row) => row.suggested_weight_kg != null),
    )
  ) {
    return { result, assignable: false, blockReason: "FIXED_LOAD_FORBIDDEN" };
  }
  return { result, assignable: true, blockReason: null };
}

export function assignmentPayloadFromResult(result: ProgramGenerationResult, nameAr: string) {
  if (!result.candidate) return null;
  return {
    goal_id: result.candidate.goal_id,
    days_per_week: result.candidate.days_per_week,
    version: result.candidate.version,
    name_ar: nameAr,
    generation_reason: result.generation_reason,
    sessions: result.candidate.sessions.map((session) => ({
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
}
