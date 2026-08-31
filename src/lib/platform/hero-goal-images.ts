import type { UserGoal } from "@/lib/platform/home-hub";
import { resolveUserGoal } from "@/lib/platform/home-hub";
import { readQuizProgress } from "@/lib/quiz-progress-storage";
import maleGoalFat from "@/assets/hero-goals/hero-goal-male-fat.webp";
import maleGoalMuscle from "@/assets/hero-goals/hero-goal-male-muscle.webp";
import maleGoalFitness from "@/assets/hero-goals/hero-goal-male-fitness.webp";
import maleGoalAthletic from "@/assets/hero-goals/hero-goal-male-athletic.webp";
import maleGoalShape from "@/assets/hero-goals/hero-goal-male-shape.webp";
import maleGoalGain from "@/assets/hero-goals/hero-goal-male-gain.webp";
import femaleGoalFat from "@/assets/hero-goals/hero-goal-female-fat.webp";
import femaleGoalGlutes from "@/assets/hero-goals/hero-goal-female-glutes.webp";
import femaleGoalWaist from "@/assets/hero-goals/hero-goal-female-waist.webp";
import femaleGoalBody from "@/assets/hero-goals/hero-goal-female-body.webp";
import femaleGoalFit from "@/assets/hero-goals/hero-goal-female-fit.webp";
import femaleGoalTone from "@/assets/hero-goals/hero-goal-female-tone.webp";
import coachPhoto from "@/assets/coach-photo.png";

export type HeroGender = "male" | "female";

export type HeroGoalImage = {
  src: string;
  alt: string;
  gender: HeroGender;
  goalId: string;
};

const MALE_GOAL_IDS = ["fat", "muscle", "fitness", "athletic", "shape", "gain"] as const;
const FEMALE_GOAL_IDS = ["fat", "glutes", "waist", "body", "fit", "tone"] as const;

type MaleGoalId = (typeof MALE_GOAL_IDS)[number];
type FemaleGoalId = (typeof FEMALE_GOAL_IDS)[number];

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
  tone: "جسم أحلامك — تحسين شكل الصدر",
};

const MALE_GOAL_IMAGES: Record<MaleGoalId, string> = {
  fat: maleGoalFat,
  muscle: maleGoalMuscle,
  fitness: maleGoalFitness,
  athletic: maleGoalAthletic,
  shape: maleGoalShape,
  gain: maleGoalGain,
};

const FEMALE_GOAL_IMAGES: Record<FemaleGoalId, string> = {
  fat: femaleGoalFat,
  glutes: femaleGoalGlutes,
  waist: femaleGoalWaist,
  body: femaleGoalBody,
  fit: femaleGoalFit,
  tone: femaleGoalTone,
};

const BUCKET_IMAGES: Record<`${HeroGender}-${UserGoal}`, string> = {
  "male-cut": maleGoalFat,
  "male-bulk": maleGoalMuscle,
  "male-fitness": maleGoalFitness,
  "female-cut": femaleGoalFat,
  "female-bulk": femaleGoalTone,
  "female-fitness": femaleGoalFit,
};

function isMaleGoalId(value: string): value is MaleGoalId {
  return (MALE_GOAL_IDS as readonly string[]).includes(value);
}

function isFemaleGoalId(value: string): value is FemaleGoalId {
  return (FEMALE_GOAL_IDS as readonly string[]).includes(value);
}

/** Maps quiz goal ids to the platform goal buckets used on home. */
export function goalIdToUserGoal(goalId?: string | null): UserGoal | null {
  if (!goalId) return null;
  if (goalId === "fat" || goalId === "waist") return "cut";
  if (goalId === "muscle" || goalId === "gain" || goalId === "tone") return "bulk";
  if (goalId === "glutes" || goalId === "body") return "fitness";
  if (goalId === "athletic" || goalId === "shape" || goalId === "fitness" || goalId === "fit") return "fitness";
  return "fitness";
}

export function inferGoalIdFromText(raw?: string | null, gender?: HeroGender | null): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  if (isMaleGoalId(value) || isFemaleGoalId(value)) return value;

  const text = value.toLowerCase();
  if (/glute|مؤخر/.test(text)) return "glutes";
  if (/waist|خصر/.test(text)) return "waist";
  if (/صدر|tone/.test(text)) return "tone";
  if (/أنثوي|feminine/.test(text)) return "body";
  if (/gain|زيادة وزن/.test(text)) return "gain";
  if (/athletic|رياضي ومتناسق/.test(text)) return "athletic";
  if (/shape|شكل الجسم/.test(text)) return "shape";
  if (/muscle|عضل|تضخيم|bulk/.test(text)) return "muscle";
  if (/صحي ورياضي/.test(text)) return gender === "male" ? "fitness" : "fit";
  if (/fit|لياق|طاق/.test(text)) return gender === "female" ? "fit" : "fitness";
  if (/fat|دهون|تنشيف|cut/.test(text)) return "fat";
  return null;
}

export function readHomeGoalContext(input?: {
  gender?: HeroGender | null;
  goalId?: string | null;
  goalText?: string | null;
}) {
  const quiz = readQuizProgress();
  const gender: HeroGender =
    input?.gender === "female" || quiz?.gender === "female"
      ? "female"
      : input?.gender === "male" || quiz?.gender === "male"
        ? "male"
        : "male";

  const goalId =
    inferGoalIdFromText(input?.goalId, gender) ??
    inferGoalIdFromText(quiz?.goalId, gender) ??
    inferGoalIdFromText(input?.goalText, gender);

  const goal =
    goalIdToUserGoal(goalId) ??
    (input?.goalText?.trim() ? resolveUserGoal(input.goalText) : null) ??
    "fitness";

  return { gender, goalId, goal };
}

function imageForGoal(gender: HeroGender, goal: UserGoal, goalId?: string | null): { src: string; goalId: string } {
  if (gender === "female" && goalId && isFemaleGoalId(goalId)) {
    return { src: FEMALE_GOAL_IMAGES[goalId], goalId };
  }
  if (gender === "male" && goalId && isMaleGoalId(goalId)) {
    return { src: MALE_GOAL_IMAGES[goalId], goalId };
  }

  const bucketGoalId =
    goal === "cut" ? "fat" : goal === "bulk" ? (gender === "female" ? "body" : "muscle") : gender === "female" ? "fit" : "fitness";

  return {
    src: BUCKET_IMAGES[`${gender}-${goal}`] ?? coachPhoto,
    goalId: bucketGoalId,
  };
}

export function resolveHeroGoalImage(input: {
  goal: UserGoal;
  gender?: HeroGender | null;
  goalId?: string | null;
}): HeroGoalImage {
  const gender: HeroGender = input.gender === "female" ? "female" : "male";
  const resolved = imageForGoal(gender, input.goal, input.goalId);
  const alt = (resolved.goalId && GOAL_ID_ALTS[resolved.goalId]) || "جسم أحلامك حسب هدفك";

  return {
    src: resolved.src || coachPhoto,
    alt,
    gender,
    goalId: resolved.goalId,
  };
}
