import type { StrategySupportedDaysPerWeek } from "@/lib/platform/strategy-matrix/constants";
import { isStrategySupportedDaysPerWeek } from "@/lib/platform/strategy-matrix/constants";

/** Contact-city quiz fields — not training place (home/gym). */
const CONTACT_LOCATION_VALUES = new Set(["dubai", "remote", "دبي", "عن بعد"]);

/** Legacy service-mode fields — not Strategy Matrix training location. */
const NON_TRAINING_TYPE_VALUES = new Set(["online", "inperson", "in-person", "offline"]);

export type QuizActivityId =
  | "sedentary"
  | "light"
  | "moderate"
  | "high"
  | "veryhigh"
  | "athlete";

/** Normalize quiz + legacy profile activity ids to one canonical quiz set. */
export function normalizeQuizActivityLevel(raw: string | null | undefined): QuizActivityId | null {
  const key = raw?.trim().toLowerCase() ?? "";
  if (!key) return null;
  if (key === "sedentary" || key === "light" || key === "moderate") return key;
  if (key === "high" || key === "active") return "high";
  if (key === "veryhigh" || key === "very_active" || key === "very-active") return "veryhigh";
  if (key === "athlete") return "athlete";
  return null;
}

/**
 * Quiz activityLevel → supported training days (legacy heuristic).
 * Product default for new clients is 5 days — see resolveClientTrainingDaysPerWeek.
 */
export function trainingDaysFromQuizActivityLevel(
  activityLevel: string | null | undefined,
): StrategySupportedDaysPerWeek | null {
  const key = normalizeQuizActivityLevel(activityLevel);
  if (!key) return null;
  if (key === "sedentary" || key === "light" || key === "moderate") return 3;
  if (key === "high") return 4;
  if (key === "veryhigh" || key === "athlete") return 5;
  return null;
}

export function isContactOnlyLocationPreference(value: string | null | undefined): boolean {
  const key = value?.trim().toLowerCase() ?? "";
  return Boolean(key) && CONTACT_LOCATION_VALUES.has(key);
}

export function isNonTrainingTypeHint(value: string | null | undefined): boolean {
  const key = value?.trim().toLowerCase() ?? "";
  return Boolean(key) && NON_TRAINING_TYPE_VALUES.has(key);
}

/** Product default: 5 training days/week. Admin can change later via coach override. */
export const CLIENT_DEFAULT_TRAINING_DAYS_PER_WEEK: StrategySupportedDaysPerWeek = 5;

/** Prefer explicit days (admin/client override); else product default of 5. Never ask the client. */
export function resolveClientTrainingDaysPerWeek(input: {
  explicitDays?: number | null;
  activityLevel?: string | null;
}): StrategySupportedDaysPerWeek {
  if (input.explicitDays != null && Number.isFinite(input.explicitDays)) {
    const normalized = Math.round(input.explicitDays);
    if (isStrategySupportedDaysPerWeek(normalized)) return normalized;
  }
  void input.activityLevel;
  return CLIENT_DEFAULT_TRAINING_DAYS_PER_WEEK;
}

/** Strip contact/service noise so location resolver only sees training place signals. */
export function sanitizeTrainingLocationHints(input: {
  trainingEnvironment?: "home" | "gym" | "anywhere" | null;
  trainingType?: string | null;
  locationPreference?: string | null;
}): {
  trainingEnvironment: "home" | "gym" | "anywhere" | null;
  trainingType: string | null;
  locationPreference: string | null;
} {
  return {
    trainingEnvironment: input.trainingEnvironment ?? null,
    trainingType: isNonTrainingTypeHint(input.trainingType) ? null : input.trainingType?.trim() || null,
    locationPreference: isContactOnlyLocationPreference(input.locationPreference)
      ? null
      : input.locationPreference?.trim() || null,
  };
}
