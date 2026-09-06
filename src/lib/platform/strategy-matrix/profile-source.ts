import type { PreferredWeekdayId } from "./constants";
import {
  resolveClientTrainingDaysPerWeek,
  sanitizeTrainingLocationHints,
} from "./quiz-strategy-bridge";
import type { TrainingStrategyInput } from "./types";

export type ParsedTrainingProfileAnswers = {
  goalId?: string | null;
  gender?: "male" | "female" | null;
  injuryIds?: string[];
  trainingEnvironment?: "home" | "gym" | "anywhere" | null;
  sessionDurationMinutes?: number | null;
  trainingDaysPerWeek?: number | null;
  preferredTrainingDays?: PreferredWeekdayId[] | null;
  availableEquipment?: string[] | null;
  activityLevel?: string | null;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseTrainingEnvironment(
  value: unknown,
): "home" | "gym" | "anywhere" | null {
  if (value === "home" || value === "gym" || value === "anywhere") return value;
  return null;
}

function parsePreferredDays(value: unknown): PreferredWeekdayId[] | null {
  if (!Array.isArray(value)) return null;
  const days = value.filter((item): item is PreferredWeekdayId => typeof item === "string");
  return days.length ? days : null;
}

/** Normalizes `training_profiles.answers` JSONB into Strategy-friendly fields. */
export function parseTrainingProfileAnswers(
  answers: Record<string, unknown> | null | undefined,
): ParsedTrainingProfileAnswers {
  if (!answers) return {};
  const injuryRaw = answers.injuryIds;
  const injuryIds = Array.isArray(injuryRaw)
    ? injuryRaw.filter((item): item is string => typeof item === "string")
    : undefined;

  const explicitDays =
    asNumber(answers.trainingDaysPerWeek) ?? asNumber(answers.training_days_per_week);
  const activityLevel = asString(answers.activityLevel) ?? asString(answers.activity_level);

  return {
    goalId: asString(answers.goalId) ?? asString(answers.goal_id),
    gender:
      answers.gender === "male" || answers.gender === "female" ? answers.gender : null,
    injuryIds,
    trainingEnvironment: parseTrainingEnvironment(answers.trainingEnvironment),
    sessionDurationMinutes:
      asNumber(answers.sessionDurationMinutes) ?? asNumber(answers.session_duration_minutes),
    trainingDaysPerWeek: resolveClientTrainingDaysPerWeek({
      explicitDays,
      activityLevel,
    }),
    preferredTrainingDays: parsePreferredDays(answers.preferredTrainingDays),
    availableEquipment: Array.isArray(answers.availableEquipment)
      ? answers.availableEquipment.filter((item): item is string => typeof item === "string")
      : null,
    activityLevel,
  };
}

export function trainingStrategyInputFromProfileRow(input: {
  userId: string;
  goal?: string | null;
  trainingType?: string | null;
  locationPreference?: string | null;
  answers?: Record<string, unknown> | null;
  assessedTrainingLevel?: TrainingStrategyInput["assessedTrainingLevel"];
}): TrainingStrategyInput {
  const parsed = parseTrainingProfileAnswers(input.answers);
  const location = sanitizeTrainingLocationHints({
    trainingEnvironment: parsed.trainingEnvironment ?? null,
    trainingType: input.trainingType ?? null,
    locationPreference: input.locationPreference ?? null,
  });

  return {
    userId: input.userId,
    rawGoalId: parsed.goalId ?? input.goal ?? null,
    profileGoal: input.goal ?? null,
    gender: parsed.gender ?? null,
    assessedTrainingLevel: input.assessedTrainingLevel ?? null,
    trainingDaysPerWeek: parsed.trainingDaysPerWeek ?? null,
    preferredTrainingDays: parsed.preferredTrainingDays ?? null,
    sessionDurationMinutes: parsed.sessionDurationMinutes ?? null,
    trainingEnvironment: location.trainingEnvironment,
    trainingType: location.trainingType,
    locationPreference: location.locationPreference,
    availableEquipment: parsed.availableEquipment ?? null,
    injuryIds: parsed.injuryIds ?? null,
  };
}
