import {
  GOAL_HERO_FOLDERS,
  resolveGoalHeroFolder,
  type GoalHeroFolder,
} from "@/lib/platform/goal-hero-folder-catalog";
import { CONTENT_ASSETS_ROOT } from "@/lib/platform/content/catalog";
import { pickContentSlotAsset } from "@/lib/platform/content/asset-index";
import type { HeroGender } from "@/lib/platform/hero-goal-images";
import { inferGoalIdFromText, readHomeGoalContext } from "@/lib/platform/hero-goal-images";
import { resolveClientGoalLabel } from "@/lib/platform/profile-experience";
import workoutGoalStack1 from "@/assets/V0/workout-goal-stack-1.webp";
import workoutGoalStack2 from "@/assets/V0/workout-goal-stack-2.webp";
import workoutGoalStack3 from "@/assets/V0/workout-goal-stack-3.webp";

export type WorkoutGoalHeroFolder = GoalHeroFolder;

/** 12 quiz goals — 6 ذكور + 6 بنات. */
export const WORKOUT_GOAL_HERO_FOLDERS = GOAL_HERO_FOLDERS;

const DEFAULT_STACK = [
  { src: workoutGoalStack1, alt: "جسم متناسق بعد الالتزام" },
  { src: workoutGoalStack2, alt: "تمرين بقوة وتركيز" },
  { src: workoutGoalStack3, alt: "نتيجة صحية واثقة" },
] as const;

export type WorkoutGoalHeroPhoto = {
  src: string;
  alt: string;
};

export function resolveWorkoutGoalHeroFolder(gender: HeroGender, goalId?: string | null): WorkoutGoalHeroFolder | null {
  return resolveGoalHeroFolder(gender, goalId);
}

/** Up to 3 photos for the hero stack; only from the client's gender folder. */
export function resolveWorkoutGoalHeroPhotos(input: {
  gender?: HeroGender | null;
  goalId?: string | null;
  goalLabel?: string | null;
}): WorkoutGoalHeroPhoto[] {
  const context = readHomeGoalContext({
    gender: input.gender,
    goalId: input.goalId,
    goalText: input.goalLabel,
  });
  const gender = context.gender;
  const goalId =
    inferGoalIdFromText(input.goalId, gender) ??
    context.goalId ??
    inferGoalIdFromText(input.goalLabel, gender);

  const folder = goalId ? resolveWorkoutGoalHeroFolder(gender, goalId) : null;
  const label =
    input.goalLabel?.trim() ||
    (folder?.labelAr ?? (goalId ? resolveClientGoalLabel(goalId) : "هدفك"));

  const custom = folder
    ? pickContentSlotAsset({
        collection: "workout-goal-hero",
        dirName: folder.dirName,
        gender,
        limit: 3,
      })
    : [];

  if (custom.length === 0) {
    return DEFAULT_STACK.map((photo) => ({ ...photo, alt: `${label} — ${photo.alt}` }));
  }

  const picked =
    custom.length >= 3
      ? custom.slice(0, 3)
      : [...custom, ...DEFAULT_STACK.map((p) => p.src)].slice(0, 3);

  return picked.map((src, index) => ({
    src,
    alt: `${label} — صورة ${index + 1}`,
  }));
}

export const WORKOUT_GOAL_HERO_ASSETS_ROOT = `${CONTENT_ASSETS_ROOT}/workout-goal-hero`;
