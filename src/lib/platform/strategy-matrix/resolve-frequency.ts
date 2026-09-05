import {
  isStrategySupportedDaysPerWeek,
  type StrategySupportedDaysPerWeek,
} from "./constants";
import { CLIENT_DEFAULT_TRAINING_DAYS_PER_WEEK } from "./quiz-strategy-bridge";
import type { StrategyFrequencySource } from "./types";

export function resolveStrategyFrequency(input: {
  clientDaysPerWeek?: number | null;
  coachDaysPerWeek?: number | null;
}):
  | {
      ok: true;
      trainingDaysPerWeek: StrategySupportedDaysPerWeek;
      frequencySource: Exclude<StrategyFrequencySource, "UNRESOLVED">;
    }
  | { ok: false; code: "MISSING_TRAINING_FREQUENCY" | "UNSUPPORTED_TRAINING_FREQUENCY" } {
  const coach = input.coachDaysPerWeek;
  if (coach != null && Number.isFinite(coach)) {
    const normalized = coach === 6 ? 5 : Math.round(coach);
    if (!isStrategySupportedDaysPerWeek(normalized)) {
      return { ok: false, code: "UNSUPPORTED_TRAINING_FREQUENCY" };
    }
    return {
      ok: true,
      trainingDaysPerWeek: normalized,
      frequencySource: "COACH_OVERRIDE",
    };
  }

  const client = input.clientDaysPerWeek;
  if (client != null && Number.isFinite(client)) {
    const normalized = Math.round(client);
    if (!isStrategySupportedDaysPerWeek(normalized)) {
      return { ok: false, code: "UNSUPPORTED_TRAINING_FREQUENCY" };
    }
    return {
      ok: true,
      trainingDaysPerWeek: normalized,
      frequencySource: "CLIENT",
    };
  }

  // Product default: 5 days/week. Admin can change later via coach override.
  return {
    ok: true,
    trainingDaysPerWeek: CLIENT_DEFAULT_TRAINING_DAYS_PER_WEEK,
    frequencySource: "CLIENT",
  };
}
