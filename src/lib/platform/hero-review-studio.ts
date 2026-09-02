import { GOAL_HERO_FOLDERS, type GoalHeroFolder } from "@/lib/platform/goal-hero-folder-catalog";
import type { HeroGender, HeroGoalImage } from "@/lib/platform/hero-goal-images";
import { getHeroGoalImageSrc, goalIdToUserGoal } from "@/lib/platform/hero-goal-images";
import { buildHeroState, type HeroState, type UserGoal } from "@/lib/platform/home-hub";
import {
  listHeroGoalAssetEntries,
  type HeroGoalAssetEntry,
} from "@/lib/platform/hero-goals-asset-index";
import type { MembershipFeatures } from "@/lib/platform/membership";
import { assetFileName, type HeroGoalCardTheme, type HeroGoalFraming } from "@/lib/platform/hero-goal-framing";

export type HeroReviewSlot = GoalHeroFolder & {
  assets: HeroGoalAssetEntry[];
};

const REVIEW_HERO_FEATURES: MembershipFeatures = {
  platform_access: true,
  workout_program: true,
  nutrition_plan: true,
  progress_tracking: true,
  free_content: true,
  periodic_reviews: true,
  limited_coach_contact: true,
  personal_followup: false,
  program_adjustments: false,
  priority_contact: false,
};

export function listHeroReviewAssets(gender: HeroGender, goalId: string): HeroGoalAssetEntry[] {
  const fromFolders = listHeroGoalAssetEntries(gender, goalId);
  if (fromFolders.length > 0) return fromFolders;

  const src = getHeroGoalImageSrc(gender, goalId);
  if (!src) return [];

  return [
    {
      url: src,
      fileName: assetFileName(src),
      repoPath: `static:${gender}:${goalId}`,
    },
  ];
}

export function listHeroReviewSlots(): HeroReviewSlot[] {
  return GOAL_HERO_FOLDERS.map((folder) => ({
    ...folder,
    assets: listHeroReviewAssets(folder.gender, folder.goalId),
  }));
}

export function findHeroReviewSlot(gender: HeroGender, goalId: string): HeroReviewSlot | null {
  return listHeroReviewSlots().find((slot) => slot.gender === gender && slot.goalId === goalId) ?? null;
}

export { assetFileName } from "@/lib/platform/hero-goal-framing";

export function buildHeroReviewImage(
  slot: HeroReviewSlot,
  assetIndex: number,
  framing?: HeroGoalFraming,
): HeroGoalImage {
  const assets = slot.assets;
  const safeIndex = assets.length > 0 ? ((assetIndex % assets.length) + assets.length) % assets.length : 0;
  const src = assets[safeIndex]?.url ?? "";

  return {
    src,
    alt: `معاينة — ${slot.labelAr}`,
    gender: slot.gender,
    goalId: slot.goalId,
    previewLocked: true,
    framing,
  };
}

export function buildHeroReviewState(input: {
  slot: HeroReviewSlot;
  assetIndex?: number;
  displayName?: string;
  framing?: HeroGoalFraming;
  cardTheme?: HeroGoalCardTheme;
}): HeroState {
  const goal: UserGoal = goalIdToUserGoal(input.slot.goalId) ?? "fitness";

  return {
    ...buildHeroState({
      displayName: input.displayName ?? "معاينة",
      goal,
      streak: 14,
      hakimPoints: 1120,
      heroImage: buildHeroReviewImage(input.slot, input.assetIndex ?? 0, input.framing),
      features: REVIEW_HERO_FEATURES,
    }),
    heroCardTheme: input.cardTheme ?? null,
  };
}

export function countHeroReviewAssets(): number {
  return listHeroReviewSlots().reduce((sum, slot) => sum + slot.assets.length, 0);
}
