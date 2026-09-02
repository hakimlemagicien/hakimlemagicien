import { resolveHomeGoalHeroImageSrc } from "@/lib/platform/home-goal-hero-images";
import {
  getHourlyRotationIndex,
  pickHeroGoalAsset,
} from "@/lib/platform/hero-goals-asset-index";
import type { UserGoal } from "@/lib/platform/home-hub";
import { resolveUserGoal } from "@/lib/platform/home-hub";
import { readQuizProgress } from "@/lib/quiz-progress-storage";
import coachPhoto from "@/assets/coach-photo.png";
import type { HeroGoalFraming } from "@/lib/platform/hero-goal-framing";
import { attachHeroGoalFraming } from "@/lib/platform/hero-goal-framing";

export type HeroGender = "male" | "female";

export type HeroGoalImage = {
  src: string;
  alt: string;
  gender: HeroGender;
  goalId: string;
  framing?: HeroGoalFraming;
  /** Admin preview: skip hourly rotation and use explicit src/framing. */
  previewLocked?: boolean;
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

function defaultGoalIdForBucket(gender: HeroGender, goal: UserGoal): string {
  if (goal === "cut") return "fat";
  if (goal === "bulk") return gender === "female" ? "tone" : "muscle";
  return gender === "female" ? "fit" : "fitness";
}

function resolveGoalId(gender: HeroGender, goal: UserGoal, goalId?: string | null): string {
  if (gender === "female" && goalId && isFemaleGoalId(goalId)) return goalId;
  if (gender === "male" && goalId && isMaleGoalId(goalId)) return goalId;
  return defaultGoalIdForBucket(gender, goal);
}

export function getHeroGoalImageSrc(gender: HeroGender, goalId: string, rotationIndex?: number): string | null {
  return (
    pickHeroGoalAsset({ gender, goalId, rotationIndex }) ??
    resolveHomeGoalHeroImageSrc({ gender, goalId, rotationIndex })
  );
}

export function resolveHeroGoalImage(input: {
  goal: UserGoal;
  gender?: HeroGender | null;
  goalId?: string | null;
  rotationIndex?: number;
}): HeroGoalImage {
  const gender: HeroGender = input.gender === "female" ? "female" : "male";
  const resolvedGoalId = resolveGoalId(gender, input.goal, input.goalId);
  const rotationIndex = input.rotationIndex ?? getHourlyRotationIndex();
  const alt = GOAL_ID_ALTS[resolvedGoalId] || "جسم أحلامك حسب هدفك";

  const folderSrc = pickHeroGoalAsset({
    gender,
    goalId: resolvedGoalId,
    rotationIndex,
  });

  const contentSrc = resolveHomeGoalHeroImageSrc({
    gender,
    goalId: resolvedGoalId,
    rotationIndex,
  });

  return attachHeroGoalFraming({
    src: folderSrc ?? contentSrc ?? coachPhoto,
    alt,
    gender,
    goalId: resolvedGoalId,
  });
}
