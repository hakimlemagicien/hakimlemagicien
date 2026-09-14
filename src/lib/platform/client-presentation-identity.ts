import type { UserGoal } from "@/lib/platform/home-hub";
import {
  goalIdToUserGoal,
  inferGoalIdFromText,
  normalizeHeroGender,
  resolveAuthoritativeHeroSlot,
  resolveGoalIdForGender,
  type HeroGender,
  type HeroGoalSlot,
} from "@/lib/platform/hero-goal-slot";
import {
  isCanonicalTrainingGoal,
  TRAINING_V2_GOAL_LABELS_AR,
  type TrainingV2CanonicalGoal,
} from "@/lib/platform/training-v2-contracts";

/** Quiz / catalog goal ids that belong only to the female goal set. */
export const FEMALE_ONLY_GOAL_IDS = ["body", "glutes", "waist", "tone", "fit"] as const;
/** Quiz / catalog goal ids that belong only to the male goal set. */
export const MALE_ONLY_GOAL_IDS = ["muscle", "athletic", "shape", "gain", "fitness"] as const;

const FEMALE_ONLY_CANONICAL = new Set<TrainingV2CanonicalGoal>([
  "GLUTE_GROWTH",
  "SLIM_TONED_WAIST",
  "TONED_ARMS_UPPER_BODY",
  "FEMININE_BALANCED_BODY",
  "POSTURE_TONED_BACK",
]);

const MALE_SAFE_LABEL_FOR_FEMALE_GOAL: Record<string, string> = {
  body: "جسم رياضي ومتناسق",
  FEMININE_BALANCED_BODY: "جسم رياضي ومتناسق",
  glutes: "تغيير شكل الجسم",
  GLUTE_GROWTH: "تغيير شكل الجسم",
  waist: "خسارة الدهون",
  SLIM_TONED_WAIST: "خسارة الدهون",
  tone: "بناء العضلات",
  TONED_ARMS_UPPER_BODY: "بناء العضلات",
  fit: "تحسين اللياقة والطاقة",
  POSTURE_TONED_BACK: "تحسين اللياقة والطاقة",
};

/** Shared quiz goal id → Arabic label (gender-neutral or male-safe wording). */
const GOAL_LABELS: Record<string, string> = {
  fat: "خسارة الدهون",
  muscle: "بناء العضلات",
  fitness: "تحسين اللياقة والطاقة",
  athletic: "جسم رياضي ومتناسق",
  shape: "تغيير شكل الجسم",
  gain: "زيادة وزن صحي",
  glutes: "تكبير المؤخرة",
  waist: "خصر أنحف ومشدود",
  body: "جسم متناسق وأنثوي",
  fit: "جسم صحي ورياضي",
  tone: "تحسين شكل الصدر",
  cut: "خسارة الدهون",
  bulk: "بناء العضلات",
  recomp: "إعادة تركيب الجسم",
  "fat-loss": "خسارة الدهون",
  lose: "خسارة الوزن",
  strength: "زيادة القوة",
  weight_loss: "خسارة الوزن",
  toning: "شد وتنسيق الجسم",
};

export type ClientPresentationIdentity = {
  gender: HeroGender | null;
  slot: HeroGoalSlot | null;
  /** Catalog / media slot id (gender-scoped). */
  mediaGoalId: string | null;
  /** Client-facing goal title — never cross-gender feminine copy for males. */
  goalLabel: string;
  userGoal: UserGoal;
};

function isFemaleOnlyGoalKey(key: string): boolean {
  if ((FEMALE_ONLY_GOAL_IDS as readonly string[]).includes(key)) return true;
  if (isCanonicalTrainingGoal(key) && FEMALE_ONLY_CANONICAL.has(key)) return true;
  return /أنثوي|feminine|مؤخر|خصر أنحف/i.test(key);
}

/**
 * Display label for a raw goal id/text, gated by gender.
 * Males never receive feminine-only catalog copy (e.g. «جسم متناسق وأنثوي»).
 */
export function resolveClientGoalLabelForGender(
  gender: HeroGender | null | undefined,
  ...sources: Array<string | null | undefined>
): string {
  const resolvedGender = normalizeHeroGender(gender);

  for (const raw of sources) {
    const key = raw?.trim();
    if (!key) continue;

    if (resolvedGender === "male" && isFemaleOnlyGoalKey(key)) {
      const remapped = MALE_SAFE_LABEL_FOR_FEMALE_GOAL[key];
      if (remapped) return remapped;
      continue;
    }

    if (isCanonicalTrainingGoal(key)) {
      if (resolvedGender === "male" && FEMALE_ONLY_CANONICAL.has(key)) {
        return MALE_SAFE_LABEL_FOR_FEMALE_GOAL[key] ?? TRAINING_V2_GOAL_LABELS_AR.ATHLETIC_PHYSIQUE;
      }
      return TRAINING_V2_GOAL_LABELS_AR[key];
    }

    const mapped = GOAL_LABELS[key] ?? GOAL_LABELS[key.toLowerCase()];
    if (mapped) {
      if (resolvedGender === "male" && isFemaleOnlyGoalKey(key)) {
        return MALE_SAFE_LABEL_FOR_FEMALE_GOAL[key] ?? "جسم رياضي ومتناسق";
      }
      return mapped;
    }

    if (/[\u0600-\u06FF]/.test(key)) {
      if (resolvedGender === "male" && /أنثوي|مؤخر/.test(key)) {
        return "جسم رياضي ومتناسق";
      }
      return key;
    }
  }

  return "غير محدد";
}

/**
 * Unified Source of Truth for personalized presentation.
 * Never consults device quiz leftovers — signed-in profile fields only.
 */
export function resolveClientPresentationIdentity(input: {
  gender?: unknown;
  goalId?: string | null;
  goalText?: string | null;
  /** Extra goal sources in priority order (assigned program name is not a goal). */
  goalSources?: Array<string | null | undefined>;
}): ClientPresentationIdentity {
  const gender = normalizeHeroGender(input.gender);
  const slot = resolveAuthoritativeHeroSlot({
    gender,
    goalId: input.goalId,
    goalText: input.goalText,
  });

  const goalLabel = resolveClientGoalLabelForGender(
    gender,
    input.goalId,
    input.goalText,
    ...(input.goalSources ?? []),
  );

  if (!slot || !gender) {
    return {
      gender,
      slot: null,
      mediaGoalId: null,
      goalLabel,
      userGoal: "fitness",
    };
  }

  return {
    gender: slot.gender,
    slot,
    mediaGoalId: slot.goalId,
    goalLabel,
    userGoal: slot.goal,
  };
}

/** Canonical goals offered to a gender in strategy setup — no cross-gender options. */
export function canonicalGoalsForGender(gender: HeroGender | null | undefined): TrainingV2CanonicalGoal[] {
  const resolved = normalizeHeroGender(gender);
  if (resolved === "male") {
    return [
      "MUSCLE_GROWTH",
      "FAT_LOSS",
      "BODY_RESHAPE",
      "FITNESS_ENERGY",
      "ATHLETIC_PHYSIQUE",
      "HEALTHY_WEIGHT_GAIN",
    ];
  }
  if (resolved === "female") {
    return [
      "FAT_LOSS",
      "GLUTE_GROWTH",
      "SLIM_TONED_WAIST",
      "FEMININE_BALANCED_BODY",
      "TONED_ARMS_UPPER_BODY",
      "POSTURE_TONED_BACK",
      "MUSCLE_GROWTH",
      "FITNESS_ENERGY",
    ];
  }
  // Unknown gender: shared non-feminine-only set until gender is known.
  return [
    "MUSCLE_GROWTH",
    "FAT_LOSS",
    "BODY_RESHAPE",
    "FITNESS_ENERGY",
    "ATHLETIC_PHYSIQUE",
    "HEALTHY_WEIGHT_GAIN",
  ];
}

export function assertNoCrossGenderMedia(src: string, gender: HeroGender): boolean {
  if (gender === "male" && /hero-goal-women|\/بنات\//i.test(src)) return false;
  if (gender === "female" && /hero-goal-man|\/ذكور\//i.test(src)) return false;
  return true;
}

export {
  goalIdToUserGoal,
  inferGoalIdFromText,
  normalizeHeroGender,
  resolveGoalIdForGender,
};
