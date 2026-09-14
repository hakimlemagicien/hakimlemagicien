import { resolveGoalHeroFolder } from "@/lib/platform/goal-hero-folder-catalog";
import { CONTENT_ASSETS_ROOT } from "@/lib/platform/content/catalog";
import { pickContentSlotAsset } from "@/lib/platform/content/asset-index";
import type { HeroGender } from "@/lib/platform/hero-goal-slot";
import { resolveAuthoritativeHeroSlot } from "@/lib/platform/hero-goal-slot";

export const HOME_GOAL_HERO_ASSETS_ROOT = `${CONTENT_ASSETS_ROOT}/home-goal-hero`;

/**
 * Picks one image for `platform-home-hero__visual`.
 * Only reads from the client's gender folder (`ذكور` or `بنات`).
 * Never consults device quiz storage — slot identity is the caller's job.
 */
export function resolveHomeGoalHeroImageSrc(input: {
  gender?: HeroGender | null;
  goalId?: string | null;
  goalLabel?: string | null;
  rotationIndex?: number;
}): string | null {
  const slot = resolveAuthoritativeHeroSlot({
    gender: input.gender,
    goalId: input.goalId,
    goalText: input.goalLabel,
  });
  if (!slot) return null;

  const folder = resolveGoalHeroFolder(slot.gender, slot.goalId);
  if (!folder) return null;

  return (
    pickContentSlotAsset({
      collection: "home-goal-hero",
      dirName: folder.dirName,
      gender: slot.gender,
      rotationIndex: input.rotationIndex,
      limit: 1,
    })[0] ?? null
  );
}
