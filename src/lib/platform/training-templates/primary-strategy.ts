/**
 * Primary Training Strategy — product-level identity for Program Templates.
 * Distinct from Training V2 canonical goals and from Quiz goal IDs.
 * Phase 2 contract only — does not rename V2 goals or rewrite LEGACY_GOAL_MAP.
 */

export const PRIMARY_TRAINING_STRATEGIES = [
  "FAT_LOSS",
  "MUSCLE_GAIN",
  "GENERAL_FITNESS",
  "ATHLETIC_PERFORMANCE",
  "BODY_RECOMPOSITION",
  "GLUTE_FOCUS",
  "STRENGTH",
  "ENDURANCE",
  "MOBILITY_FUNCTIONAL",
  "HEALTHY_AGING_ACTIVE_LIFE",
] as const;

export type PrimaryTrainingStrategy = (typeof PRIMARY_TRAINING_STRATEGIES)[number];

/** Template family identity for the 36-template catalog (aligned 1:1 with primary strategy for V1). */
export type TemplateFamily = PrimaryTrainingStrategy;

export const QUIZ_GOAL_IDS = [
  "fat",
  "muscle",
  "fitness",
  "athletic",
  "shape",
  "gain",
  "glutes",
  "waist",
  "body",
  "fit",
  "tone",
] as const;

export type QuizGoalId = (typeof QUIZ_GOAL_IDS)[number];

/**
 * Product surfaces = 12 (6 male + 6 female). `fat` is shared → 11 unique IDs.
 */
export const QUIZ_GOAL_SURFACES = [
  { gender: "male", goalId: "fat" },
  { gender: "male", goalId: "muscle" },
  { gender: "male", goalId: "fitness" },
  { gender: "male", goalId: "athletic" },
  { gender: "male", goalId: "shape" },
  { gender: "male", goalId: "gain" },
  { gender: "female", goalId: "fat" },
  { gender: "female", goalId: "glutes" },
  { gender: "female", goalId: "waist" },
  { gender: "female", goalId: "body" },
  { gender: "female", goalId: "fit" },
  { gender: "female", goalId: "tone" },
] as const;

export type PrimaryStrategyResolveMode = "DETERMINISTIC" | "CONTEXT_SENSITIVE" | "FAIL_CLOSED";

export type PrimaryStrategyMappingResult =
  | {
      ok: true;
      quizGoalId: QuizGoalId;
      primaryStrategy: PrimaryTrainingStrategy;
      mode: "DETERMINISTIC" | "CONTEXT_SENSITIVE";
      notes?: string;
      /** When true, Phase 3 resolver may override with FAT_LOSS under clear fat-loss priority. */
      allowsFatLossContextOverride?: boolean;
      /** When true, Coach Custom/Override may specialize further. */
      allowsCoachSpecialization?: boolean;
    }
  | {
      ok: false;
      quizGoalId: string;
      primaryStrategy: null;
      mode: "FAIL_CLOSED";
      reason: "EMPTY_GOAL" | "UNKNOWN_QUIZ_GOAL";
    };

/** Locked Quiz Goal → Primary Training Strategy (product Phase 2). Nutrition remains separate. */
const QUIZ_TO_PRIMARY: Record<
  QuizGoalId,
  Omit<Extract<PrimaryStrategyMappingResult, { ok: true }>, "ok" | "quizGoalId">
> = {
  fat: { primaryStrategy: "FAT_LOSS", mode: "DETERMINISTIC" },
  muscle: { primaryStrategy: "MUSCLE_GAIN", mode: "DETERMINISTIC" },
  fitness: { primaryStrategy: "GENERAL_FITNESS", mode: "DETERMINISTIC" },
  athletic: { primaryStrategy: "ATHLETIC_PERFORMANCE", mode: "DETERMINISTIC" },
  shape: { primaryStrategy: "BODY_RECOMPOSITION", mode: "DETERMINISTIC" },
  gain: {
    primaryStrategy: "MUSCLE_GAIN",
    mode: "DETERMINISTIC",
    notes: "Training maps to MUSCLE_GAIN; Nutrition Strategy remains independent.",
  },
  glutes: { primaryStrategy: "GLUTE_FOCUS", mode: "DETERMINISTIC" },
  waist: {
    primaryStrategy: "BODY_RECOMPOSITION",
    mode: "CONTEXT_SENSITIVE",
    allowsFatLossContextOverride: true,
    notes: "Default BODY_RECOMPOSITION; Phase 3 may select FAT_LOSS when fat-loss priority is clear.",
  },
  body: { primaryStrategy: "BODY_RECOMPOSITION", mode: "DETERMINISTIC" },
  fit: { primaryStrategy: "GENERAL_FITNESS", mode: "DETERMINISTIC" },
  tone: {
    primaryStrategy: "BODY_RECOMPOSITION",
    mode: "CONTEXT_SENSITIVE",
    allowsCoachSpecialization: true,
    notes: "Default BODY_RECOMPOSITION; Coach Custom/Override may specialize.",
  },
};

export function isPrimaryTrainingStrategy(value: unknown): value is PrimaryTrainingStrategy {
  return (
    typeof value === "string" &&
    (PRIMARY_TRAINING_STRATEGIES as readonly string[]).includes(value)
  );
}

export function isQuizGoalId(value: unknown): value is QuizGoalId {
  return typeof value === "string" && (QUIZ_GOAL_IDS as readonly string[]).includes(value);
}

export function mapQuizGoalToPrimaryStrategy(
  quizGoalId: string | null | undefined,
): PrimaryStrategyMappingResult {
  const key = quizGoalId?.trim() ?? "";
  if (!key) {
    return {
      ok: false,
      quizGoalId: "",
      primaryStrategy: null,
      mode: "FAIL_CLOSED",
      reason: "EMPTY_GOAL",
    };
  }
  if (!isQuizGoalId(key)) {
    return {
      ok: false,
      quizGoalId: key,
      primaryStrategy: null,
      mode: "FAIL_CLOSED",
      reason: "UNKNOWN_QUIZ_GOAL",
    };
  }
  const mapped = QUIZ_TO_PRIMARY[key];
  return { ok: true, quizGoalId: key, ...mapped };
}

export function primaryStrategyToTemplateFamily(
  strategy: PrimaryTrainingStrategy,
): TemplateFamily {
  return strategy;
}
