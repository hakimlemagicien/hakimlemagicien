import { PLATFORM_CONTENT_CATALOG } from "@/lib/platform/content/catalog";
import type { HeroGender } from "@/lib/platform/hero-goal-images";

export type GoalHeroFolder = {
  /** Folder name under `ذكور/` or `بنات/` inside goal-hero collections. */
  dirName: string;
  /** Label shown in the app (Arabic). */
  labelAr: string;
  gender: HeroGender;
  goalId: string;
};

const GOAL_CATALOG = PLATFORM_CONTENT_CATALOG.filter(
  (slot) => slot.collection === "home-goal-hero" && slot.gender && slot.goalId,
);

/** 12 quiz goals — 6 ذكور + 6 بنات. */
export const GOAL_HERO_FOLDERS: GoalHeroFolder[] = GOAL_CATALOG.map((slot) => ({
  dirName: slot.dirName,
  labelAr: slot.labelAr,
  gender: slot.gender!,
  goalId: slot.goalId!,
}));

function folderKey(gender: HeroGender, goalId: string): string {
  return `${gender}:${goalId}`;
}

const FOLDER_BY_KEY = new Map(
  GOAL_HERO_FOLDERS.map((entry) => [folderKey(entry.gender, entry.goalId), entry]),
);

export function resolveGoalHeroFolder(gender: HeroGender, goalId?: string | null): GoalHeroFolder | null {
  if (!goalId) return null;
  return FOLDER_BY_KEY.get(folderKey(gender, goalId)) ?? null;
}
