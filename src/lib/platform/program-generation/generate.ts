import { resolveCanonicalGoal, musclePriorityFor } from "@/lib/platform/prescription/goal-profile";
import { resolveExercisePriority, prescribeWorkingSets } from "@/lib/platform/prescription/sets";
import { prescribeRest } from "@/lib/platform/prescription/effort-rest";
import { prescribeRepOrDuration, isStrengthEligible } from "@/lib/platform/prescription/ranges";
import type { ExerciseExperienceState } from "@/lib/platform/training-v2-contracts";
import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import { buildSessionBlueprints } from "./roles";
import { filterProgramCandidates, pickForSlot } from "./selection";
import { orderSessionExercises } from "./order";
import { estimateSessionMinutes, trimSessionToDuration } from "./duration";
import { defaultRegionalTargets, summarizeRegionalVolume } from "./volume";
import { validateTrainingProgram, canActivateProgram } from "./validate";
import { programDiff } from "./apply";
import { clientProgramExplanation, PROGRAM_COPY } from "./explanations";
import {
  PROGRAM_CONTEXT_VERSION,
  SUPPORTED_DAYS_PER_WEEK,
  type DaysPerWeek,
  type GeneratedExercise,
  type GeneratedSession,
  type ProgramCandidate,
  type ProgramGenerationContext,
  type ProgramGenerationResult,
} from "./types";

const MAX_ATTEMPTS = 3;

function catalogMap(exercises: ExerciseV2Metadata[]) {
  return new Map(exercises.map((item) => [item.external_id, item]));
}

function asDays(value: number): DaysPerWeek | null {
  return (SUPPORTED_DAYS_PER_WEEK as readonly number[]).includes(value) ? (value as DaysPerWeek) : null;
}

function prescribeExercise(input: {
  exercise: ExerciseV2Metadata;
  context: ProgramGenerationContext;
  sessionIndex: number;
  experience: ExerciseExperienceState;
  retained: boolean;
}): GeneratedExercise {
  const calibrating = input.experience === "NEW";
  const levelForSets = input.context.reconditioningActive ? "BEGINNER" : input.context.trainingLevel;
  const musclePriority = musclePriorityFor(
    resolveCanonicalGoal(input.context.goalId).canonicalId,
    input.exercise.primary_muscles,
  );
  const exercisePriority = resolveExercisePriority(musclePriority, input.exercise.mechanics);
  let sets = prescribeWorkingSets({
    trainingLevel: levelForSets,
    exerciseExperience: input.experience,
    exercisePriority,
    mechanics: input.exercise.mechanics,
    calibrating,
  });
  if (input.context.recoveryState === "POOR") sets = Math.max(2, sets - 1);
  const rest = prescribeRest({
    exercise: input.exercise,
    strengthEmphasis: isStrengthEligible({
      trainingLevel: input.context.trainingLevel,
      exerciseExperience: input.experience,
      mechanics: input.exercise.mechanics,
    }),
    calibrating,
  });
  const reps = prescribeRepOrDuration({
    exercise: input.exercise,
    trainingLevel: input.context.trainingLevel,
    strengthEligible: isStrengthEligible({
      trainingLevel: input.context.trainingLevel,
      exerciseExperience: input.experience,
      mechanics: input.exercise.mechanics,
    }),
  });
  return {
    external_id: input.exercise.external_id,
    session_index: input.sessionIndex,
    order_index: 0,
    sets,
    rest_seconds: rest.recommended_rest_seconds,
    reps_min: reps.rep_min,
    reps_max: reps.rep_max,
    duration_seconds: reps.duration_min,
    suggested_weight_kg: null,
    muscle_priority: musclePriority,
    exercise_priority: exercisePriority,
    movement_role: input.exercise.primary_movement_role,
    calibration_required: calibrating,
    retained: input.retained,
  };
}

function buildCandidate(context: ProgramGenerationContext, attempt: number): {
  candidate: ProgramCandidate | null;
  missingSlots: Array<{ role: string; muscleFamily: string }>;
} {
  const goal = resolveCanonicalGoal(context.goalId).canonicalId;
  const days = asDays(context.daysPerWeek);
  if (!goal || !days) return { candidate: null, missingSlots: [] };

  const pool = filterProgramCandidates({
    exercises: context.exercises,
    location: context.location,
    permittedLocations: context.permittedLocations,
    availableEquipment: context.availableEquipment,
    trainingLevel: context.trainingLevel,
    excludedExternalIds: context.excludedExternalIds,
    exercisePoolVersion: context.exercisePoolVersion,
    injuryIds: context.injuryIds,
    restrictedMuscles: context.restrictedMuscles,
  });
  const previousIds = new Set(context.previousExternalIds ?? []);
  const locked = new Set(context.lockedExternalIds ?? []);
  const experienceById = context.experienceById ?? {};
  const catalog = catalogMap(context.exercises);
  const blueprints = buildSessionBlueprints({
    goal,
    days,
    fromRegion: context.reallocation?.from_region,
    toRegion: context.reallocation?.to_region,
  });

  const missingSlots: Array<{ role: string; muscleFamily: string }> = [];
  const sessions: GeneratedSession[] = [];

  for (const [index, blueprint] of blueprints.entries()) {
    const usedIds = new Set<string>();
    const usedRoles = new Set<string>();
    const picked: GeneratedExercise[] = [];

    for (const slot of blueprint.slots) {
      const exercise = pickForSlot({
        slot,
        pool,
        usedIds,
        usedRoles,
        previousIds,
        lockedIds: locked,
        experienceById,
        fromRegion: context.reallocation?.from_region,
        toRegion: context.reallocation?.to_region,
      });
      if (!exercise) {
        if (slot.priority === "PRIMARY") missingSlots.push({ role: slot.movementRole ?? "ANY", muscleFamily: slot.muscleFamily });
        continue;
      }
      picked.push(
        prescribeExercise({
          exercise,
          context,
          sessionIndex: index,
          experience: experienceById[exercise.external_id] ?? (previousIds.has(exercise.external_id) ? "ESTABLISHED" : "NEW"),
          retained: previousIds.has(exercise.external_id),
        }),
      );
      usedIds.add(exercise.external_id);
      if (exercise.primary_movement_role) usedRoles.add(exercise.primary_movement_role);
    }

    if (attempt > 0 && picked.length > 3) {
      const droppable = [...picked].reverse().find((item) => item.exercise_priority === "OPTIONAL" || item.muscle_priority === "MAINTENANCE");
      if (droppable) {
        const filtered = picked.filter((item) => item.external_id !== droppable.external_id);
        picked.splice(0, picked.length, ...filtered);
      }
    }

    const ordered = orderSessionExercises(picked, catalog);
    const protectedIds = new Set(locked);
    for (const item of ordered) {
      if (item.muscle_priority === "PRIMARY" || item.exercise_priority === "REQUIRED" || item.exercise_priority === "HIGH") {
        protectedIds.add(item.external_id);
      }
    }
    const lower = ordered.find((item) =>
      ["HIP_EXTENSION", "SQUAT", "HINGE", "KNEE_FLEXION"].includes(item.movement_role ?? ""),
    );
    if (lower) protectedIds.add(lower.external_id);
    const requiredRole = ordered.find((item) => item.movement_role && blueprint.slots.some((slot) => slot.movementRole === item.movement_role && slot.priority === "PRIMARY"));
    if (requiredRole) protectedIds.add(requiredRole.external_id);
    const trimmed = trimSessionToDuration(ordered, context.availableMinutes, protectedIds);
    sessions.push({
      program_day_id: `program-day-${index}`,
      sequence_index: index,
      role: blueprint.role,
      title: blueprint.title,
      primary_regions: blueprint.primaryRegions,
      estimated_minutes: estimateSessionMinutes(trimmed),
      exercises: trimmed,
    });
  }

  return {
    candidate: {
      goal_id: goal,
      days_per_week: days,
      version: (context.previousProgram?.version ?? 0) + 1,
      context_version: PROGRAM_CONTEXT_VERSION,
      sessions,
    },
    missingSlots,
  };
}

export function generateTrainingProgram(context: ProgramGenerationContext): ProgramGenerationResult {
  const reason = context.reason ?? "INITIAL_PROGRAM_GENERATION";
  const emptyValidation = validateTrainingProgram(null, context);
  const mapped = resolveCanonicalGoal(context.goalId).canonicalId;

  if (context.waistStagnationSpotReduction) {
    return {
      status: "PROGRAM_GENERATION_BLOCKED",
      candidate: null,
      validation: validateTrainingProgram(null, context, { spotReductionAttempted: true }),
      regional_volume: {},
      movement_roles: [],
      generation_reason: reason,
      client_explanation: PROGRAM_COPY.BLOCKED,
      diff: programDiff(context.previousProgram, null),
    };
  }

  if (!mapped) {
    return {
      status: "PROGRAM_GENERATION_BLOCKED",
      candidate: null,
      validation: emptyValidation,
      regional_volume: {},
      movement_roles: [],
      generation_reason: reason,
      client_explanation: PROGRAM_COPY.BLOCKED,
      diff: programDiff(context.previousProgram, null),
    };
  }

  if (context.scheduleCapacityMismatch && !context.allowFrequencyAdaptation) {
    const review = validateTrainingProgram(null, context);
    return {
      status: "PROGRAM_REVIEW_REQUIRED",
      candidate: null,
      validation: {
        status: "INVALID",
        errors: review.errors,
        warnings: [
          ...review.warnings,
          {
            code: "SCHEDULE_CAPACITY_MISMATCH",
            severity: "warning",
            message: "Do not regenerate the same unrealistic frequency without review.",
          },
        ],
      },
      regional_volume: {},
      movement_roles: [],
      generation_reason: "SCHEDULE_CAPACITY_ADJUSTMENT",
      client_explanation: PROGRAM_COPY.BLOCKED,
      diff: programDiff(context.previousProgram, null),
    };
  }

  for (const id of context.lockedExternalIds ?? []) {
    const eligible = filterProgramCandidates({
      exercises: context.exercises,
      location: context.location,
      permittedLocations: context.permittedLocations,
      availableEquipment: context.availableEquipment,
      trainingLevel: context.trainingLevel,
      excludedExternalIds: context.excludedExternalIds,
      exercisePoolVersion: context.exercisePoolVersion,
      injuryIds: context.injuryIds,
      restrictedMuscles: context.restrictedMuscles,
    }).some((exercise) => exercise.external_id === id);
    if (!eligible) {
      const validation = validateTrainingProgram(null, context);
      const safetyBlocked = (context.excludedExternalIds ?? []).includes(id);
      return {
        status: "COACH_OVERRIDE_CONFLICT",
        candidate: null,
        validation: {
          status: "INVALID",
          errors: [
            ...validation.errors,
            {
              code: safetyBlocked ? "SAFETY_RESTRICTION_VIOLATION" : "NO_VALID_EXERCISE_CANDIDATE",
              severity: "error",
              message: safetyBlocked
                ? `Locked exercise ${id} is blocked by safety constraints.`
                : `Locked exercise ${id} is not eligible.`,
            },
          ],
          warnings: validation.warnings,
        },
        regional_volume: {},
        movement_roles: [],
        generation_reason: reason,
        client_explanation: PROGRAM_COPY.BLOCKED,
        diff: programDiff(context.previousProgram, null),
      };
    }
  }

  const targets = context.regionalTargets?.length
    ? context.regionalTargets
    : defaultRegionalTargets({
        goal: mapped,
        trainingLevel: context.trainingLevel,
        reconditioningActive: context.reconditioningActive,
        recoveryState: context.recoveryState,
      });
  const catalog = catalogMap(context.exercises);

  let last: ReturnType<typeof buildCandidate> | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    last = buildCandidate(context, attempt);
    const volume = last.candidate ? summarizeRegionalVolume(last.candidate.sessions, catalog) : {};
    const validation = validateTrainingProgram(last.candidate, context, {
      regionalVolume: volume,
      targets,
      missingSlots: last.missingSlots.filter((slot) => slot.muscleFamily),
    });
    if (last.candidate && validation.status !== "INVALID") {
      const movement = [...new Set(last.candidate.sessions.flatMap((session) => session.exercises.map((item) => item.movement_role).filter(Boolean)))] as string[];
      const status = canActivateProgram(validation, "READY") ? "READY" : "PROGRAM_GENERATION_BLOCKED";
      return {
        status,
        candidate: last.candidate,
        validation,
        regional_volume: volume,
        movement_roles: movement,
        generation_reason: reason,
        client_explanation: clientProgramExplanation({
          goal: mapped,
          reason,
          reallocation: context.reallocation,
          reconditioning: context.reconditioningActive,
        }),
        diff: programDiff(context.previousProgram, last.candidate),
      };
    }
  }

  const volume = last?.candidate ? summarizeRegionalVolume(last.candidate.sessions, catalog) : {};
  const validation = validateTrainingProgram(last?.candidate ?? null, context, {
    regionalVolume: volume,
    targets,
    missingSlots: last?.missingSlots,
  });
  return {
    status: "PROGRAM_GENERATION_BLOCKED",
    candidate: last?.candidate ?? null,
    validation,
    regional_volume: volume,
    movement_roles: last?.candidate
      ? ([...new Set(last.candidate.sessions.flatMap((session) => session.exercises.map((item) => item.movement_role).filter(Boolean)))] as string[])
      : [],
    generation_reason: reason,
    client_explanation: clientProgramExplanation({
      goal: mapped,
      reason,
      reallocation: context.reallocation,
      reconditioning: context.reconditioningActive,
    }),
    diff: programDiff(context.previousProgram, last?.candidate ?? null),
  };
}

export function generateTrainingProgramOrThrow(context: ProgramGenerationContext) {
  return generateTrainingProgram(context);
}
