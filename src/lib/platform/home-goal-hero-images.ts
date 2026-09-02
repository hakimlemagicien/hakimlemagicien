import { resolveGoalHeroFolder } from "@/lib/platform/goal-hero-folder-catalog";
import { CONTENT_ASSETS_ROOT } from "@/lib/platform/content/catalog";
import { pickContentSlotAsset } from "@/lib/platform/content/asset-index";
import type { HeroGender } from "@/lib/platform/hero-goal-images";
import { inferGoalIdFromText, readHomeGoalContext } from "@/lib/platform/hero-goal-images";

export const HOME_GOAL_HERO_ASSETS_ROOT = `${CONTENT_ASSETS_ROOT}/home-goal-hero`;

/**
 * Picks one image for `platform-home-hero__visual`.
 * Only reads from the client's gender folder (`ذكور` or `بنات`).
 */
export function resolveHomeGoalHeroImageSrc(input: {
  gender?: HeroGender | null;
  goalId?: string | null;
  goalLabel?: string | null;
  rotationIndex?: number;
}): string | null {
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

  const folder = goalId ? resolveGoalHeroFolder(gender, goalId) : null;
  if (!folder) return null;

  return (
    pickContentSlotAsset({
      collection: "home-goal-hero",
      dirName: folder.dirName,
      gender,
      rotationIndex: input.rotationIndex,
      limit: 1,
    })[0] ?? null
  );
}
