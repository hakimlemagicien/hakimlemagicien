import { normalizePreferredTrainingDays } from "./weekdays";
import { resolveExercisePoolVersion } from "./core-100";
import { resolveStrategyEquipment, resolveStrategySafetyConstraints } from "./resolve-equipment";
import { resolveStrategySessionDuration } from "./resolve-duration";
import { resolveStrategyFrequency } from "./resolve-frequency";
import { resolveStrategyGoal } from "./resolve-goal";
import { resolveStrategyTrainingLevel } from "./resolve-level";
import { resolveStrategyTrainingLocation } from "./resolve-location";
import type {
  ResolvedTrainingStrategy,
  StrategyResolutionOverrides,
  StrategyResolutionResult,
  TrainingStrategyInput,
} from "./types";
import { MAAKFIT_TRAINING_STRATEGY_V1 } from "./version";

export function resolveTrainingStrategy(
  input: TrainingStrategyInput,
  overrides: StrategyResolutionOverrides = {},
): StrategyResolutionResult {
  const goal = resolveStrategyGoal({
    rawGoalId: input.rawGoalId,
    profileGoal: input.profileGoal,
  });
  if (!goal.ok) {
    return {
      ok: false,
      rawGoal: goal.rawGoal,
      errors: [{ code: goal.reason, message: goal.reason }],
    };
  }

  const level = resolveStrategyTrainingLevel(input.assessedTrainingLevel);

  const frequency = resolveStrategyFrequency({
    clientDaysPerWeek: input.trainingDaysPerWeek,
    coachDaysPerWeek: overrides.trainingDaysPerWeek,
  });
  if (!frequency.ok) {
    return {
      ok: false,
      rawGoal: goal.rawGoal,
      errors: [{ code: frequency.code, message: frequency.code }],
    };
  }

  const duration = resolveStrategySessionDuration({
    clientMinutes: input.sessionDurationMinutes,
    coachMinutes: overrides.sessionDurationMinutes,
  });
  if (!duration.ok) {
    return {
      ok: false,
      rawGoal: goal.rawGoal,
      errors: [{ code: duration.code, message: duration.code }],
    };
  }

  const location = resolveStrategyTrainingLocation({
    trainingEnvironment: input.trainingEnvironment,
    trainingType: input.trainingType,
    locationPreference: input.locationPreference,
    coachOverride: overrides.trainingLocation,
  });
  if (!location.ok) {
    return {
      ok: false,
      rawGoal: goal.rawGoal,
      errors: [{ code: location.code, message: location.code }],
    };
  }

  const equipment = resolveStrategyEquipment({
    availableEquipment: input.availableEquipment,
    coachEquipment: overrides.availableEquipment,
  });

  const safety = resolveStrategySafetyConstraints(input.injuryIds);

  const strategy: ResolvedTrainingStrategy = {
    strategyVersion: MAAKFIT_TRAINING_STRATEGY_V1,
    userId: input.userId ?? null,
    rawGoal: goal.rawGoal,
    canonicalGoal: goal.canonicalGoal,
    goalResolutionSource: goal.resolutionSource,
    trainingLevel: level.trainingLevel,
    trainingLevelSource: level.trainingLevelSource,
    trainingDaysPerWeek: frequency.trainingDaysPerWeek,
    frequencySource: frequency.frequencySource,
    preferredTrainingDays: normalizePreferredTrainingDays(input.preferredTrainingDays).days,
    sessionDurationMinutes: duration.sessionDurationMinutes,
    sessionDurationSource: duration.sessionDurationSource,
    trainingLocation: location.trainingLocation,
    permittedLocations: location.permittedLocations,
    availableEquipment: equipment.availableEquipment,
    equipmentSource: equipment.equipmentSource,
    safety,
    lockedExternalIds: [
      ...(input.lockedExternalIds ?? []),
      ...(overrides.lockedExternalIds ?? []),
    ],
    excludedExternalIds: [
      ...(input.excludedExternalIds ?? []),
      ...(overrides.excludedExternalIds ?? []),
      ...safety.blockedExternalIds,
    ],
    coachProtected: Boolean(overrides.coachProtected ?? input.coachProtected),
    exercisePoolVersion: resolveExercisePoolVersion(),
    generationReason: overrides.reason ?? "INITIAL_PROGRAM_GENERATION",
  };

  return { ok: true, strategy };
}
