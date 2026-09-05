/**
 * Single client-facing catalog of quiz answers stored in training_profiles.answers.
 * App surfaces must read from here so clients are never re-asked for quiz data.
 */
import { resolveStrategyGoal } from "@/lib/platform/strategy-matrix/resolve-goal";
import {
  normalizeQuizActivityLevel,
  resolveClientTrainingDaysPerWeek,
  CLIENT_DEFAULT_TRAINING_DAYS_PER_WEEK,
  sanitizeTrainingLocationHints,
  type QuizActivityId,
} from "@/lib/platform/strategy-matrix/quiz-strategy-bridge";
import type { StrategySupportedDaysPerWeek } from "@/lib/platform/strategy-matrix/constants";
import type { TrainingV2CanonicalGoal } from "@/lib/platform/training-v2-contracts";
import type { ClientNutritionProfile } from "@/lib/platform/nutrition-strategy/types";

export type { QuizActivityId };
export { normalizeQuizActivityLevel } from "@/lib/platform/strategy-matrix/quiz-strategy-bridge";

export type ClientQuizAnswers = {
  gender: "male" | "female" | null;
  goalId: string | null;
  canonicalGoal: TrainingV2CanonicalGoal | null;
  challengeId: string | null;
  injuryIds: string[];
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
  birthDate: string | null;
  activityLevel: QuizActivityId | null;
  investment: string | null;
  bodyType: string | null;
  trainingEnvironment: "home" | "gym" | "anywhere" | null;
  trainingDaysPerWeek: StrategySupportedDaysPerWeek | null;
  selectedTierId: string | null;
};

export const QUIZ_ACTIVITY_LABELS_AR: Record<QuizActivityId, string> = {
  sedentary: "خامل تماماً",
  light: "نشاط خفيف",
  moderate: "نشاط متوسط",
  high: "نشاط عالي",
  veryhigh: "نشاط عالي جداً",
  athlete: "رياضي محترف",
};

export const QUIZ_ENVIRONMENT_LABELS_AR: Record<"home" | "gym" | "anywhere", string> = {
  home: "منزل",
  gym: "نادي رياضي",
  anywhere: "منزل ونادي",
};

export const QUIZ_CHALLENGE_LABELS_AR: Record<string, string> = {
  belly: "الكرش / دهون البطن",
  glutes: "المؤخرة",
  muscle: "بناء العضلات",
  arms: "الذراعين",
  chest: "الصدر",
  legs: "الأرجل",
  weight: "عدم نزول الوزن",
  consistency: "عدم الالتزام",
  time: "ضيق الوقت",
  energy: "ضعف الطاقة",
  motivation: "ضعف الحافز",
};

export const QUIZ_BODY_TYPE_LABELS_AR: Record<string, string> = {
  slim: "نحيف",
  average: "متوسط",
  athletic: "رياضي",
  overweight: "ممتلئ",
  curvy: "ممتلئ أنثوي",
  hourglass: "ساعة رملية",
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Map quiz activity → nutrition engine multipliers keys. */
export function nutritionActivityFromQuiz(
  activity: QuizActivityId | null,
): keyof typeof import("./nutrition-strategy/constants").ACTIVITY_MULTIPLIERS {
  if (activity === "sedentary") return "sedentary";
  if (activity === "light") return "light";
  if (activity === "moderate") return "moderate";
  if (activity === "high") return "active";
  if (activity === "veryhigh" || activity === "athlete") return "very_active";
  return "moderate";
}

export function approximateBirthDateFromAge(age: number, reference = new Date()): string | null {
  if (!Number.isFinite(age) || age < 10 || age > 100) return null;
  const year = reference.getFullYear() - Math.round(age);
  return `${year}-01-01`;
}

export function computeAgeFromBirthDateOrAge(input: {
  birthDate?: string | null;
  age?: number | null;
}): number | null {
  const birth = input.birthDate?.trim();
  if (birth) {
    const date = new Date(`${birth}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      const now = new Date();
      let age = now.getFullYear() - date.getFullYear();
      const m = now.getMonth() - date.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age -= 1;
      return age > 0 ? age : null;
    }
  }
  return input.age != null && Number.isFinite(input.age) ? Math.round(input.age) : null;
}

export function parseClientQuizAnswers(
  answers: Record<string, unknown> | null | undefined,
  profileGoal?: string | null,
): ClientQuizAnswers {
  const raw = answers ?? {};
  const goalId = asString(raw.goalId) ?? asString(raw.goal_id) ?? asString(profileGoal);
  const goalResolved = resolveStrategyGoal({ rawGoalId: goalId, profileGoal });
  const activityLevel = normalizeQuizActivityLevel(
    asString(raw.activityLevel) ?? asString(raw.activity_level),
  );
  const explicitDays =
    asNumber(raw.trainingDaysPerWeek) ?? asNumber(raw.training_days_per_week);
  const envRaw = asString(raw.trainingEnvironment);
  const trainingEnvironment =
    envRaw === "home" || envRaw === "gym" || envRaw === "anywhere" ? envRaw : null;
  const age = asNumber(raw.age);
  const birthDate =
    asString(raw.birthDate) ?? asString(raw.birth_date) ?? approximateBirthDateFromAge(age ?? NaN);
  const injuryRaw = raw.injuryIds;
  const injuryIds = Array.isArray(injuryRaw)
    ? injuryRaw.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  return {
    gender: raw.gender === "male" || raw.gender === "female" ? raw.gender : null,
    goalId,
    canonicalGoal: goalResolved.ok ? goalResolved.canonicalGoal : null,
    challengeId: asString(raw.challengeId) ?? asString(raw.challenge_id),
    injuryIds,
    age,
    heightCm: asNumber(raw.heightCm) ?? asNumber(raw.height_cm),
    weightKg: asNumber(raw.weightKg) ?? asNumber(raw.weight_kg),
    targetWeightKg: asNumber(raw.targetWeightKg) ?? asNumber(raw.target_weight_kg),
    birthDate,
    activityLevel,
    investment: asString(raw.investment),
    bodyType: asString(raw.bodyType) ?? asString(raw.body_type),
    trainingEnvironment,
    trainingDaysPerWeek: resolveClientTrainingDaysPerWeek({
      explicitDays,
      activityLevel,
    }),
    selectedTierId: asString(raw.selectedTierId) ?? asString(raw.selected_tier_id),
  };
}

export function quizAnswersReadyForTraining(quiz: ClientQuizAnswers): boolean {
  return Boolean(quiz.canonicalGoal && quiz.trainingEnvironment && quiz.trainingDaysPerWeek);
}

export function bodyFatCategoryFromQuizBodyType(
  bodyType: string | null,
): "high" | "moderate" | "low" | null {
  if (!bodyType) return null;
  if (bodyType === "overweight" || bodyType === "curvy") return "high";
  if (bodyType === "average" || bodyType === "hourglass") return "moderate";
  if (bodyType === "slim" || bodyType === "athletic") return "low";
  return null;
}

/**
 * Build nutrition engine profile from quiz answers when measurements exist.
 * Returns null if required biometrics are missing — never invents numbers.
 */
export function nutritionProfileFromQuizAnswers(
  quiz: ClientQuizAnswers,
): ClientNutritionProfile | null {
  const age = computeAgeFromBirthDateOrAge({ birthDate: quiz.birthDate, age: quiz.age });
  if (!quiz.gender || !quiz.heightCm || !quiz.weightKg || !age) return null;
  return {
    gender: quiz.gender,
    age,
    weight_kg: quiz.weightKg,
    height_cm: quiz.heightCm,
    activity_level: nutritionActivityFromQuiz(quiz.activityLevel),
    body_fat_category: bodyFatCategoryFromQuizBodyType(quiz.bodyType),
  };
}

export function challengeLabelAr(challengeId: string | null | undefined): string | null {
  if (!challengeId) return null;
  return QUIZ_CHALLENGE_LABELS_AR[challengeId] ?? challengeId;
}

export function bodyTypeLabelAr(bodyType: string | null | undefined): string | null {
  if (!bodyType) return null;
  return QUIZ_BODY_TYPE_LABELS_AR[bodyType] ?? bodyType;
}

export function trainingEnvironmentLabelAr(
  env: "home" | "gym" | "anywhere" | null | undefined,
): string | null {
  if (!env) return null;
  return QUIZ_ENVIRONMENT_LABELS_AR[env];
}

/** Ensure strategy location hints ignore contact-only fields when reading quiz pack. */
export function strategyLocationFromQuiz(quiz: ClientQuizAnswers) {
  return sanitizeTrainingLocationHints({
    trainingEnvironment: quiz.trainingEnvironment,
    trainingType: quiz.trainingEnvironment,
    locationPreference: null,
  });
}

export function trainingDaysLabelFromQuiz(quiz: ClientQuizAnswers): string | null {
  const days = quiz.trainingDaysPerWeek ?? CLIENT_DEFAULT_TRAINING_DAYS_PER_WEEK;
  return `${days} أيام/أسبوع`;
}
