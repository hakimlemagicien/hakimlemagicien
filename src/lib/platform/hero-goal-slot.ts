import type { UserGoal } from "@/lib/platform/home-hub";
import { resolveUserGoal } from "@/lib/platform/home-hub";
import {
  homeBucketForCanonicalGoal,
  isCanonicalTrainingGoal,
  quizHeroIdForCanonicalGoal,
} from "@/lib/platform/training-v2-contracts";

export type HeroGender = "male" | "female";

export type HeroGoalSlot = {
  gender: HeroGender;
  goalId: string;
  goal: UserGoal;
};

const MALE_GOAL_IDS = ["fat", "muscle", "fitness", "athletic", "shape", "gain"] as const;
const FEMALE_GOAL_IDS = ["fat", "glutes", "waist", "body", "fit", "tone"] as const;

type MaleGoalId = (typeof MALE_GOAL_IDS)[number];
type FemaleGoalId = (typeof FEMALE_GOAL_IDS)[number];

function isMaleGoalId(value: string): value is MaleGoalId {
  return (MALE_GOAL_IDS as readonly string[]).includes(value);
}

function isFemaleGoalId(value: string): value is FemaleGoalId {
  return (FEMALE_GOAL_IDS as readonly string[]).includes(value);
}

export function normalizeHeroGender(value: unknown): HeroGender | null {
  if (value === "male" || value === "female") return value;
  if (typeof value !== "string") return null;
  const text = value.trim().toLowerCase();
  if (!text) return null;
  if (text === "m" || text === "man" || text === "male" || text === "ذكر" || text === "رجل") return "male";
  if (
    text === "f" ||
    text === "woman" ||
    text === "female" ||
    text === "أنثى" ||
    text === "انثى" ||
    text === "امرأة"
  ) {
    return "female";
  }
  return null;
}

export function goalIdToUserGoal(goalId?: string | null): UserGoal | null {
  if (!goalId) return null;
  if (isCanonicalTrainingGoal(goalId)) return homeBucketForCanonicalGoal(goalId);
  if (goalId === "fat" || goalId === "waist") return "cut";
  if (goalId === "muscle" || goalId === "gain" || goalId === "tone") return "bulk";
  if (goalId === "glutes" || goalId === "body") return "fitness";
  if (goalId === "athletic" || goalId === "shape" || goalId === "fitness" || goalId === "fit") {
    return "fitness";
  }
  return "fitness";
}

export function inferGoalIdFromText(raw?: string | null, gender?: HeroGender | null): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  if (isCanonicalTrainingGoal(value)) {
    const resolvedGender = normalizeHeroGender(gender);
    return quizHeroIdForCanonicalGoal(value, resolvedGender === "male" ? "male" : "female");
  }
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

function defaultGoalIdForBucket(gender: HeroGender, goal: UserGoal): string {
  if (goal === "cut") return "fat";
  if (goal === "bulk") return gender === "female" ? "tone" : "muscle";
  return gender === "female" ? "fit" : "fitness";
}

export function resolveGoalIdForGender(
  gender: HeroGender,
  goal: UserGoal,
  goalId?: string | null,
): string {
  if (gender === "female" && goalId && isFemaleGoalId(goalId)) return goalId;
  if (gender === "male" && goalId && isMaleGoalId(goalId)) return goalId;
  return defaultGoalIdForBucket(gender, goal);
}

/**
 * Resolves the home/workout hero slot from the signed-in profile only.
 * Device quiz leftovers must never participate — they mix another person's gender/goal.
 */
export function resolveAuthoritativeHeroSlot(input: {
  gender?: unknown;
  goalId?: string | null;
  goalText?: string | null;
}): HeroGoalSlot | null {
  const gender = normalizeHeroGender(input.gender);
  if (!gender) return null;

  const inferred =
    inferGoalIdFromText(input.goalId, gender) ?? inferGoalIdFromText(input.goalText, gender);
  const goal =
    goalIdToUserGoal(inferred) ??
    (input.goalText?.trim() ? resolveUserGoal(input.goalText) : null) ??
    "fitness";
  const goalId = resolveGoalIdForGender(gender, goal, inferred);
  return { gender, goalId, goal };
}
