export const FIRST_APP_PREPARATION_MINUTES = 120;
export const MISSING_TRAINING_DAYS_WINDOW_MINUTES = 10;

export const TRAINING_DAY_OPTIONS = [2, 3, 4, 5, 6] as const;
export type PreferredTrainingDays = (typeof TRAINING_DAY_OPTIONS)[number];

export const TRAINING_MEAL_WINDOWS = [
  "before_breakfast",
  "after_breakfast",
  "before_lunch",
  "after_lunch",
  "before_evening_meal",
  "after_evening_meal",
  "before_dinner",
  "after_dinner",
] as const;
export type TrainingMealWindow = (typeof TRAINING_MEAL_WINDOWS)[number];

export const TRAINING_MEAL_WINDOW_LABELS_AR: Record<TrainingMealWindow, string> = {
  before_breakfast: "قبل الفطور",
  after_breakfast: "بعد الفطور",
  before_lunch: "قبل الغداء",
  after_lunch: "بعد الغداء",
  before_evening_meal: "قبل وجبة المساء",
  after_evening_meal: "بعد وجبة المساء",
  before_dinner: "قبل العشاء",
  after_dinner: "بعد العشاء",
};

export type CustomerJourneyPhase =
  | "preparing"
  | "needs_training_days"
  | "complete_setup"
  | "ready"
  | "failed";

export type CustomerJourneyState = {
  phase: CustomerJourneyPhase;
  preparationStartedAt: string;
  preparationReadyAt: string;
  extraWindowEndsAt: string | null;
  preferredTrainingDays: PreferredTrainingDays | null;
  normalizedTrainingDays: number | null;
  trainingMealWindow: TrainingMealWindow | null;
  assignmentId: string | null;
  matchedTemplateId: string | null;
  failureCode: string | null;
  grandfathered: boolean;
};

export function normalizeTrainingDays(days: number): number {
  if (!Number.isInteger(days) || days < 2 || days > 6) {
    throw new Error("preferred_training_days must be an integer between 2 and 6");
  }
  return Math.max(3, days);
}

export type ProgramTemplateCandidate = {
  id: string;
  goal: string;
  level: string | null;
  gender: "male" | "female" | "all";
  daysPerWeek: number;
  version: number;
  published: boolean;
};

/**
 * Deterministic V1 matcher. Wrong goal or cross-gender candidates are never eligible.
 * Ties: nearest days, non-exceeding, exact gender, exact level, newest version, UUID.
 */
export function selectBestProgramTemplate(input: {
  preferredDays: number;
  gender: "male" | "female";
  goal: string;
  level?: string | null;
  templates: ProgramTemplateCandidate[];
}): ProgramTemplateCandidate | null {
  const requestedDays = normalizeTrainingDays(input.preferredDays);
  const compatible = input.templates.filter((template) => {
    if (!template.published || template.goal !== input.goal) return false;
    if (template.gender !== input.gender && template.gender !== "all") return false;
    if (input.level && template.level && template.level !== input.level) return false;
    return true;
  });

  compatible.sort((left, right) => {
    const distance =
      Math.abs(left.daysPerWeek - requestedDays) - Math.abs(right.daysPerWeek - requestedDays);
    if (distance !== 0) return distance;
    const exceeds =
      Number(left.daysPerWeek > requestedDays) - Number(right.daysPerWeek > requestedDays);
    if (exceeds !== 0) return exceeds;
    const gender = Number(right.gender === input.gender) - Number(left.gender === input.gender);
    if (gender !== 0) return gender;
    const level = Number(right.level === input.level) - Number(left.level === input.level);
    if (level !== 0) return level;
    if (left.version !== right.version) return right.version - left.version;
    return left.id.localeCompare(right.id);
  });
  return compatible[0] ?? null;
}

export type NutritionSlotId =
  | "breakfast"
  | "lunch"
  | "evening_meal"
  | "dinner"
  | "pre_workout"
  | "post_workout";

const MAIN_MEALS: NutritionSlotId[] = ["breakfast", "lunch", "evening_meal", "dinner"];

export function composeSixMealOrder(window: TrainingMealWindow): NutritionSlotId[] {
  const relation = window.startsWith("before_") ? "before" : "after";
  const anchor = window.slice(relation.length + 1) as NutritionSlotId;
  const result: NutritionSlotId[] = [];
  for (const meal of MAIN_MEALS) {
    if (meal !== anchor) {
      result.push(meal);
    } else if (relation === "before") {
      result.push("pre_workout", "post_workout", meal);
    } else {
      result.push(meal, "pre_workout", "post_workout");
    }
  }
  return result;
}

export function remainingSeconds(targetIso: string, nowMs = Date.now()) {
  return Math.max(0, Math.ceil((Date.parse(targetIso) - nowMs) / 1000));
}
