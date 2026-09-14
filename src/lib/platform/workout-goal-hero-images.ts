import {
  GOAL_HERO_FOLDERS,
  resolveGoalHeroFolder,
  type GoalHeroFolder,
} from "@/lib/platform/goal-hero-folder-catalog";
import { CONTENT_ASSETS_ROOT } from "@/lib/platform/content/catalog";
import { listContentSlotAssets, pickContentSlotAsset } from "@/lib/platform/content/asset-index";
import type { HeroGender } from "@/lib/platform/hero-goal-slot";
import { resolveAuthoritativeHeroSlot } from "@/lib/platform/hero-goal-slot";
import { listHeroGoalImageOverrides } from "@/lib/platform/hero-goal-image-overrides";
import { resolveClientGoalLabelForGender } from "@/lib/platform/client-presentation-identity";
import coachPhoto from "@/assets/coach-photo.png";

export type WorkoutGoalHeroFolder = GoalHeroFolder;

/** 12 quiz goals — 6 ذكور + 6 بنات. */
export const WORKOUT_GOAL_HERO_FOLDERS = GOAL_HERO_FOLDERS;

/** Gender-safe neutral fallback — never cross-gender stock. */
function neutralFallbackStack(gender: HeroGender, label: string) {
  void gender;
  return [
    { src: coachPhoto, alt: `${label} — MAAKFIT` },
    { src: coachPhoto, alt: `${label} — برنامجك` },
    { src: coachPhoto, alt: `${label} — هدفك` },
  ];
}

export type WorkoutGoalHeroPhoto = {
  src: string;
  alt: string;
};

export type WorkoutGoalCardStudioImage = {
  url: string;
  fileName: string;
  id?: string;
  source: "cms" | "content" | "default";
};

export function resolveWorkoutGoalHeroFolder(gender: HeroGender, goalId?: string | null): WorkoutGoalHeroFolder | null {
  return resolveGoalHeroFolder(gender, goalId);
}

/** Studio + runtime: images currently shown for a workout goal card. */
export function listWorkoutGoalCardStudioImages(
  gender: HeroGender,
  goalId: string,
): WorkoutGoalCardStudioImage[] {
  const overrides = listHeroGoalImageOverrides("workout", gender, goalId);
  if (overrides.length > 0) {
    return overrides.map((item) => ({
      url: item.url,
      fileName: item.fileName,
      id: item.id,
      source: "cms" as const,
    }));
  }

  const folder = resolveWorkoutGoalHeroFolder(gender, goalId);
  if (folder) {
    const contentUrls = listContentSlotAssets({
      collection: "workout-goal-hero",
      dirName: folder.dirName,
      gender,
    });
    if (contentUrls.length > 0) {
      return contentUrls.map((url, index) => ({
        url,
        fileName: url.split("/").pop() ?? `content-${index + 1}`,
        source: "content" as const,
      }));
    }
  }

  return neutralFallbackStack(gender, folder?.labelAr ?? "هدفك").map((photo, index) => ({
    url: photo.src,
    fileName: `neutral-fallback-${index + 1}.png`,
    source: "default" as const,
  }));
}

/** Up to 3 photos for the hero stack; only from the client's gender folder. */
export function resolveWorkoutGoalHeroPhotos(input: {
  gender?: HeroGender | null;
  goalId?: string | null;
  goalLabel?: string | null;
}): WorkoutGoalHeroPhoto[] {
  const slot = resolveAuthoritativeHeroSlot({
    gender: input.gender,
    goalId: input.goalId,
    goalText: input.goalLabel,
  });
  if (!slot) return [];

  const gender = slot.gender;
  const goalId = slot.goalId;
  const folder = resolveWorkoutGoalHeroFolder(gender, goalId);
  const label =
    input.goalLabel?.trim() ||
    resolveClientGoalLabelForGender(gender, goalId) ||
    folder?.labelAr ||
    "هدفك";

  if (goalId) {
    const overrides = listHeroGoalImageOverrides("workout", gender, goalId);
    if (overrides.length > 0) {
      return overrides.slice(0, 3).map((item, index) => ({
        src: item.url,
        alt: `${label} — صورة ${index + 1}`,
      }));
    }
  }

  const custom = folder
    ? pickContentSlotAsset({
        collection: "workout-goal-hero",
        dirName: folder.dirName,
        gender,
        limit: 3,
      })
    : [];

  if (custom.length === 0) {
    return neutralFallbackStack(gender, label);
  }

  const picked =
    custom.length >= 3
      ? custom.slice(0, 3)
      : [...custom, ...neutralFallbackStack(gender, label).map((p) => p.src)].slice(0, 3);

  return picked.map((src, index) => ({
    src,
    alt: `${label} — صورة ${index + 1}`,
  }));
}

export const WORKOUT_GOAL_HERO_ASSETS_ROOT = `${CONTENT_ASSETS_ROOT}/workout-goal-hero`;
