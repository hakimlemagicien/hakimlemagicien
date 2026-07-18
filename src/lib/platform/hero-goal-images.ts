import type { UserGoal } from "@/lib/platform/home-hub";
import { resolveUserGoal } from "@/lib/platform/home-hub";
import { readQuizProgress } from "@/lib/quiz-progress-storage";
import heroGoalBulkFemale from "@/assets/hero-goals/hero-goal-bulk-female.png";
import heroGoalBulkMale from "@/assets/hero-goals/hero-goal-bulk-male.png";
import heroGoalCutFemale from "@/assets/hero-goals/hero-goal-cut-female.png";
import heroGoalCutMale from "@/assets/hero-goals/hero-goal-cut-male.png";
import heroGoalFitnessFemale from "@/assets/hero-goals/hero-goal-fitness-female.png";
import heroGoalFitnessMale from "@/assets/hero-goals/hero-goal-fitness-male.png";
import coachPhoto from "@/assets/coach-photo.png";

export type HeroGender = "male" | "female";

export type HeroGoalImage = {
  src: string;
  alt: string;
};

type HeroImageKey = `${HeroGender}-${UserGoal}` | `${HeroGender}-glutes`;

const HERO_GOAL_IMAGES: Record<HeroImageKey, HeroGoalImage> = {
  "male-cut": {
    src: heroGoalCutMale,
    alt: "جسم نحيف ورياضي — هدف خسارة الدهون",
  },
  "male-bulk": {
    src: heroGoalBulkMale,
    alt: "جسم عضلي قوي — هدف بناء العضلات",
  },
  "male-fitness": {
    src: heroGoalFitnessMale,
    alt: "جسم لائق ونشيط — هدف تحسين اللياقة",
  },
  "female-cut": {
    src: heroGoalCutFemale,
    alt: "جسم متناسق ورشيق — هدف خسارة الدهون",
  },
  "female-bulk": {
    src: heroGoalBulkFemale,
    alt: "جسم قوي ومتناسق — هدف بناء العضلات",
  },
  "female-fitness": {
    src: heroGoalFitnessFemale,
    alt: "جسم صحي ورياضي — هدف تحسين اللياقة",
  },
  "female-glutes": {
    src: heroGoalBulkFemale,
    alt: "قوام أنثوي متناسق — هدف تكبير وشد المؤخرة",
  },
};

const GOAL_ID_ALTS: Record<string, string> = {
  fat: "جسم أحلامك — خسارة الدهون",
  muscle: "جسم أحلامك — بناء العضلات",
  fitness: "جسم أحلامك — لياقة وطاقة",
  athletic: "جسم أحلامك — قوام رياضي",
  shape: "جسم أحلامك — تحول الشكل",
  gain: "جسم أحلامك — زيادة وزن صحي",
  glutes: "جسم أحلامك — شد وتكبير المؤخرة",
  waist: "جسم أحلامك — خصر أنحف",
  body: "جسم أحلامك — قوام أنثوي متناسق",
  fit: "جسم أحلامك — جسم صحي ورياضي",
  tone: "جسم أحلامك — تحسين الشكل",
};

/** Maps quiz goal ids to the platform goal buckets used on home. */
export function goalIdToUserGoal(goalId?: string | null): UserGoal | null {
  if (!goalId) return null;
  if (goalId === "fat" || goalId === "waist" || goalId === "glutes") return "cut";
  if (goalId === "muscle" || goalId === "gain" || goalId === "tone") return "bulk";
  return "fitness";
}

export function readHomeGoalContext(fallbackGoalText?: string | null) {
  const quiz = readQuizProgress();
  const gender = quiz?.gender ?? "male";
  const goalId = quiz?.goalId ?? null;
  const goal = goalIdToUserGoal(goalId) ?? resolveUserGoal(fallbackGoalText);

  return { gender, goalId, goal };
}

function resolveImageKey(gender: HeroGender, goal: UserGoal, goalId?: string | null): HeroImageKey {
  if (gender === "female" && goalId === "glutes") return "female-glutes";
  return `${gender}-${goal}`;
}

export function resolveHeroGoalImage(input: {
  goal: UserGoal;
  gender?: HeroGender | null;
  goalId?: string | null;
}): HeroGoalImage {
  const gender: HeroGender = input.gender === "female" ? "female" : "male";
  const key = resolveImageKey(gender, input.goal, input.goalId);
  const image = HERO_GOAL_IMAGES[key] ?? HERO_GOAL_IMAGES[`${gender}-fitness`];

  const alt = (input.goalId && GOAL_ID_ALTS[input.goalId]) || image.alt;

  if (!image.src) {
    return { src: coachPhoto, alt };
  }

  return { ...image, alt };
}
