import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import type { ProgramGenerationContext } from "@/lib/platform/program-generation/types";
import { exercisesForPoolVersion } from "./core-100";
import {
  aggregateSafetyConstraints,
  safetyBlockedExternalIds,
} from "./exercise-safety-rules";
import { primaryGeneratorLocation } from "./resolve-location";
import type { ResolvedTrainingStrategy } from "./types";

export function toProgramGenerationContext(
  strategy: ResolvedTrainingStrategy,
  extras: {
    exercises: ExerciseV2Metadata[];
  },
): ProgramGenerationContext {
  const poolExercises = exercisesForPoolVersion(extras.exercises, strategy.exercisePoolVersion);
  const safetyAgg = aggregateSafetyConstraints(strategy.safety.injuryIds);
  const dynamicSafetyBlocks = safetyBlockedExternalIds(
    poolExercises,
    safetyAgg,
    strategy.safety.restrictedMuscles,
  );
  const excluded = [
    ...strategy.excludedExternalIds,
    ...dynamicSafetyBlocks.filter((id) => !strategy.excludedExternalIds.includes(id)),
  ];

  return {
    goalId: strategy.canonicalGoal,
    trainingLevel: strategy.trainingLevel,
    daysPerWeek: strategy.trainingDaysPerWeek,
    availableMinutes: strategy.sessionDurationMinutes,
    location: primaryGeneratorLocation(strategy.trainingLocation),
    permittedLocations:
      strategy.permittedLocations.length > 1 ? strategy.permittedLocations : undefined,
    availableEquipment: strategy.availableEquipment,
    exercisePoolVersion: strategy.exercisePoolVersion,
    excludedExternalIds: excluded.length ? excluded : undefined,
    lockedExternalIds: strategy.lockedExternalIds.length ? strategy.lockedExternalIds : undefined,
    restrictedMuscles: strategy.safety.restrictedMuscles.length
      ? strategy.safety.restrictedMuscles
      : undefined,
    injuryIds: strategy.safety.injuryIds.length ? strategy.safety.injuryIds : undefined,
    coachProtected: strategy.coachProtected || undefined,
    exercises: poolExercises,
    reason: strategy.generationReason,
  };
}
