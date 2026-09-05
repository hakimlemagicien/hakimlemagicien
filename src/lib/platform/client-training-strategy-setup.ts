import { supabase } from "@/integrations/supabase/client";
import { parseClientQuizAnswers } from "@/lib/platform/client-quiz-answers";
import {
  CLIENT_DEFAULT_TRAINING_DAYS_PER_WEEK,
  sanitizeTrainingLocationHints,
} from "@/lib/platform/strategy-matrix/quiz-strategy-bridge";
import { resolveStrategyTrainingLocation } from "@/lib/platform/strategy-matrix/resolve-location";
import {
  isCanonicalTrainingGoal,
  TRAINING_V2_CANONICAL_GOALS,
  TRAINING_V2_GOAL_LABELS_AR,
  type TrainingV2CanonicalGoal,
} from "@/lib/platform/training-v2-contracts";

export type ClientTrainingEnvironment = "home" | "gym" | "anywhere";

/** Prefer quiz place; else gym — never ask the client again. */
export const CLIENT_DEFAULT_TRAINING_ENVIRONMENT: ClientTrainingEnvironment = "gym";

function environmentFromLocationHint(
  trainingEnvironment: string | null | undefined,
  trainingType: string | null | undefined,
  locationPreference: string | null | undefined,
): ClientTrainingEnvironment {
  if (
    trainingEnvironment === "home" ||
    trainingEnvironment === "gym" ||
    trainingEnvironment === "anywhere"
  ) {
    return trainingEnvironment;
  }
  const sanitized = sanitizeTrainingLocationHints({
    trainingEnvironment: null,
    trainingType: trainingType ?? null,
    locationPreference: locationPreference ?? null,
  });
  const resolved = resolveStrategyTrainingLocation(sanitized);
  if (resolved.ok) {
    if (resolved.trainingLocation === "HOME") return "home";
    if (resolved.trainingLocation === "GYM") return "gym";
    if (resolved.trainingLocation === "BOTH") return "anywhere";
  }
  return CLIENT_DEFAULT_TRAINING_ENVIRONMENT;
}

export const CLIENT_STRATEGY_SETUP_REASONS = [
  "MISSING_PROFILE_DATA",
  "MISSING_GOAL",
  "UNMAPPED_LEGACY_GOAL",
  "UNKNOWN_GOAL",
  "MISSING_TRAINING_FREQUENCY",
  "UNKNOWN_TRAINING_LOCATION",
] as const;

export type ClientStrategySetupReason = (typeof CLIENT_STRATEGY_SETUP_REASONS)[number];

export type ClientStrategySetupInput = {
  goal: TrainingV2CanonicalGoal;
  trainingDaysPerWeek: 3 | 4 | 5;
  trainingEnvironment: ClientTrainingEnvironment;
};

export type ClientStrategySetupGaps = {
  /** Only goal may still need a client pick when quiz goal is unmapped. */
  needGoal: boolean;
  /** Always false — days default to 5; admin can change later. */
  needDays: false;
  /** Always false — place from quiz or gym default. */
  needEnvironment: false;
  resolvedGoal: TrainingV2CanonicalGoal | null;
  resolvedDays: 3 | 4 | 5;
  resolvedEnvironment: ClientTrainingEnvironment;
  isComplete: boolean;
};

export const CLIENT_GOAL_PICKER_OPTIONS: Array<{
  id: TrainingV2CanonicalGoal;
  labelAr: string;
}> = TRAINING_V2_CANONICAL_GOALS.map((id) => ({
  id,
  labelAr: TRAINING_V2_GOAL_LABELS_AR[id],
}));

export function isClientFixableStrategyReason(reason: string | null | undefined): boolean {
  if (!reason) return false;
  return (CLIENT_STRATEGY_SETUP_REASONS as readonly string[]).includes(reason);
}

/**
 * Days + environment are never re-asked.
 * Days default to 5 (admin can change). Environment from quiz or gym.
 * Only an unmapped/missing goal can still require a client pick.
 */
export function assessClientStrategySetupGaps(input: {
  goal?: string | null;
  goalId?: string | null;
  trainingDaysPerWeek?: number | null;
  activityLevel?: string | null;
  trainingEnvironment?: string | null;
  trainingType?: string | null;
  locationPreference?: string | null;
  answers?: Record<string, unknown> | null;
}): ClientStrategySetupGaps {
  const quiz = parseClientQuizAnswers(
    {
      ...(input.answers ?? {}),
      goalId: input.goalId ?? (input.answers?.goalId as string | undefined) ?? null,
      activityLevel: input.activityLevel ?? (input.answers?.activityLevel as string | undefined) ?? null,
      trainingEnvironment:
        input.trainingEnvironment ?? (input.answers?.trainingEnvironment as string | undefined) ?? null,
      trainingDaysPerWeek:
        input.trainingDaysPerWeek ?? (input.answers?.trainingDaysPerWeek as number | undefined) ?? null,
    },
    input.goal,
  );

  const resolvedGoal = quiz.canonicalGoal;
  const resolvedDays = quiz.trainingDaysPerWeek ?? CLIENT_DEFAULT_TRAINING_DAYS_PER_WEEK;
  const resolvedEnvironment = environmentFromLocationHint(
    quiz.trainingEnvironment,
    input.trainingType ?? (input.answers?.trainingType as string | undefined) ?? null,
    input.locationPreference ?? (input.answers?.locationPreference as string | undefined) ?? null,
  );

  const needGoal = !resolvedGoal;

  return {
    needGoal,
    needDays: false,
    needEnvironment: false,
    resolvedGoal,
    resolvedDays,
    resolvedEnvironment,
    isComplete: !needGoal,
  };
}

export async function saveMyTrainingStrategySetup(
  input: ClientStrategySetupInput,
): Promise<{ goal: TrainingV2CanonicalGoal }> {
  if (!isCanonicalTrainingGoal(input.goal)) {
    throw new Error("اختر هدفاً تدريبياً معتمداً.");
  }
  const days = input.trainingDaysPerWeek ?? CLIENT_DEFAULT_TRAINING_DAYS_PER_WEEK;
  if (![3, 4, 5].includes(days)) {
    throw new Error("عدد أيام التدريب غير مدعوم.");
  }
  const environment = input.trainingEnvironment ?? CLIENT_DEFAULT_TRAINING_ENVIRONMENT;
  if (!["home", "gym", "anywhere"].includes(environment)) {
    throw new Error("مكان التدريب غير صالح.");
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("يجب تسجيل الدخول أولاً.");

  const userId = auth.user.id;
  const trainingType =
    environment === "home" ? "home" : environment === "gym" ? "gym" : "anywhere";

  const { data: existing, error: readError } = await supabase
    .from("training_profiles")
    .select("answers")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) throw readError;

  const previousAnswers =
    existing?.answers && typeof existing.answers === "object" && !Array.isArray(existing.answers)
      ? (existing.answers as Record<string, unknown>)
      : {};

  const nextAnswers = {
    ...previousAnswers,
    goalId: input.goal,
    goal_id: input.goal,
    trainingDaysPerWeek: days,
    training_days_per_week: days,
    trainingEnvironment: environment,
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      goal: input.goal,
      training_type: trainingType,
      location_preference: environment,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (profileError) throw profileError;

  if (existing) {
    const { error } = await supabase
      .from("training_profiles")
      .update({
        goal: input.goal,
        training_type: trainingType,
        location_preference: environment,
        answers: nextAnswers,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("training_profiles").insert({
      user_id: userId,
      goal: input.goal,
      training_type: trainingType,
      location_preference: environment,
      answers: nextAnswers,
      completed_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

  return { goal: input.goal };
}
