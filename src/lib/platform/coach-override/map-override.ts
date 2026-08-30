import type { StrategyResolutionOverrides, TrainingStrategyInput } from "@/lib/platform/strategy-matrix/types";
import type { CoachOverridePayload, CoachOverrideRequest, CoachOverrideType } from "./types";

export type MappedOverrideContext = {
  strategyInputPatch: Partial<TrainingStrategyInput>;
  strategyOverrides: StrategyResolutionOverrides;
};

function isTemporaryPayload(
  payload: CoachOverridePayload,
): payload is Extract<CoachOverridePayload, { validUntil?: string | null }> {
  return "validUntil" in payload || "trainingEnvironment" in payload;
}

export function mapCoachOverrideToStrategyContext(
  request: CoachOverrideRequest,
  baseInput: TrainingStrategyInput,
): MappedOverrideContext {
  const strategyOverrides: StrategyResolutionOverrides = {
    reason: "COACH_REQUEST",
    coachProtected: true,
  };
  const strategyInputPatch: Partial<TrainingStrategyInput> = {};

  const { overrideType, payload } = request;

  switch (overrideType) {
    case "TRAINING_FREQUENCY_CHANGE":
    case "TRAINING_DAYS_CHANGE": {
      const days = (payload as { trainingDaysPerWeek: number }).trainingDaysPerWeek;
      strategyOverrides.trainingDaysPerWeek = days;
      strategyInputPatch.trainingDaysPerWeek = days;
      break;
    }
    case "PREFERRED_WEEKDAYS_CHANGE": {
      const preferred = (payload as { preferredWeekdays: TrainingStrategyInput["preferredTrainingDays"] })
        .preferredWeekdays;
      strategyInputPatch.preferredTrainingDays = preferred ?? null;
      break;
    }
    case "SESSION_DURATION_CHANGE": {
      const minutes = (payload as { sessionDurationMinutes: number }).sessionDurationMinutes;
      strategyOverrides.sessionDurationMinutes = minutes;
      strategyInputPatch.sessionDurationMinutes = minutes;
      break;
    }
    case "EXERCISE_EXCLUDE": {
      const externalId = (payload as { externalId: string }).externalId;
      const excluded = [...new Set([...(baseInput.excludedExternalIds ?? []), externalId])];
      strategyOverrides.excludedExternalIds = excluded;
      strategyInputPatch.excludedExternalIds = excluded;
      break;
    }
    case "EXERCISE_LOCK": {
      const externalId = (payload as { externalId: string }).externalId;
      const locked = [...new Set([...(baseInput.lockedExternalIds ?? []), externalId])];
      strategyOverrides.lockedExternalIds = locked;
      strategyInputPatch.lockedExternalIds = locked;
      break;
    }
    case "EXERCISE_REPLACE": {
      const { fromExternalId, toExternalId } = payload as {
        fromExternalId: string;
        toExternalId: string;
      };
      const excluded = [...new Set([...(baseInput.excludedExternalIds ?? []), fromExternalId])];
      const locked = [...new Set([...(baseInput.lockedExternalIds ?? []), toExternalId])];
      strategyOverrides.excludedExternalIds = excluded;
      strategyOverrides.lockedExternalIds = locked;
      strategyInputPatch.excludedExternalIds = excluded;
      strategyInputPatch.lockedExternalIds = locked;
      break;
    }
    case "TRAINING_LOCATION_CHANGE": {
      const location = (payload as { trainingLocation: StrategyResolutionOverrides["trainingLocation"] })
        .trainingLocation;
      strategyOverrides.trainingLocation = location ?? null;
      if (location === "HOME") strategyInputPatch.trainingEnvironment = "home";
      else if (location === "GYM") strategyInputPatch.trainingEnvironment = "gym";
      else if (location === "BOTH") strategyInputPatch.trainingEnvironment = "anywhere";
      break;
    }
    case "AVAILABLE_EQUIPMENT_CHANGE": {
      const equipment = (payload as { availableEquipment: string[] | null }).availableEquipment;
      strategyOverrides.availableEquipment = equipment;
      strategyInputPatch.availableEquipment = equipment;
      break;
    }
    case "TEMPORARY_CONSTRAINT": {
      if (isTemporaryPayload(payload)) {
        if (payload.trainingEnvironment === "home") {
          strategyOverrides.trainingLocation = "HOME";
          strategyInputPatch.trainingEnvironment = "home";
        } else if (payload.trainingEnvironment === "gym") {
          strategyOverrides.trainingLocation = "GYM";
          strategyInputPatch.trainingEnvironment = "gym";
        } else if (payload.trainingEnvironment === "anywhere") {
          strategyOverrides.trainingLocation = "BOTH";
          strategyInputPatch.trainingEnvironment = "anywhere";
        }
        if (payload.availableEquipment !== undefined) {
          strategyOverrides.availableEquipment = payload.availableEquipment;
          strategyInputPatch.availableEquipment = payload.availableEquipment;
        }
      }
      break;
    }
    default: {
      const _exhaustive: never = overrideType;
      void _exhaustive;
    }
  }

  return { strategyInputPatch, strategyOverrides };
}

export function mergeStrategyInput(
  base: TrainingStrategyInput,
  patch: Partial<TrainingStrategyInput>,
): TrainingStrategyInput {
  return { ...base, ...patch };
}
