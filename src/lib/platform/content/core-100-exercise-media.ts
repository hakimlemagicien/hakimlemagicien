import { CORE_100_EXTERNAL_IDS } from "@/lib/platform/strategy-matrix/config/core-100-external-ids";
import { CONTENT_ASSETS_ROOT } from "@/lib/platform/content/catalog";

/** Source-of-truth root for Core 100 exercise media (images + future videos). */
export const CORE_100_EXERCISE_CONTENT_ROOT = `${CONTENT_ASSETS_ROOT}/core-100-exercises`;

export const CORE_100_EXERCISE_PUBLIC_ROOT = "public/exercises";

export const CORE_100_EXERCISE_COUNT = CORE_100_EXTERNAL_IDS.length;

/** Canonical still-image filenames (must live inside each exercise folder). */
export const CORE_100_STAGE_IMAGE_FILES = [
  "stages/stage-a.webp",
  "stages/stage-a-thumb.webp",
  "stages/stage-b.webp",
  "stages/stage-b-thumb.webp",
  "stages/stage-c.webp",
  "stages/stage-c-thumb.webp",
] as const;

export const CORE_100_MISTAKE_IMAGE_FILES = [
  "mistakes/mistake-01.webp",
  "mistakes/mistake-01-thumb.webp",
  "mistakes/mistake-02.webp",
  "mistakes/mistake-02-thumb.webp",
] as const;

export const CORE_100_ANATOMY_IMAGE_FILES = [
  "anatomy/anatomy.webp",
  "anatomy/anatomy-thumb.webp",
] as const;

/** Required images for a complete Core 100 exercise pack. */
export const CORE_100_REQUIRED_IMAGE_FILES = [
  ...CORE_100_STAGE_IMAGE_FILES,
  ...CORE_100_MISTAKE_IMAGE_FILES,
  ...CORE_100_ANATOMY_IMAGE_FILES,
] as const;

/** Future real videos — drop here, then run sync + Storage upload workflow. */
export const CORE_100_VIDEO_FILES = [
  "video/exercise.mp4",
  "video/instructions.mp4",
] as const;

export type Core100ExerciseExternalId = (typeof CORE_100_EXTERNAL_IDS)[number];

export type Core100MediaRelativePath =
  | (typeof CORE_100_REQUIRED_IMAGE_FILES)[number]
  | (typeof CORE_100_VIDEO_FILES)[number];

export function isCore100ExerciseId(externalId: string): externalId is Core100ExerciseExternalId {
  return (CORE_100_EXTERNAL_IDS as readonly string[]).includes(externalId);
}

export function repoPathForCore100Exercise(
  externalId: string,
  relativePath: Core100MediaRelativePath | string,
): string {
  return `${CORE_100_EXERCISE_CONTENT_ROOT}/${externalId}/${relativePath}`;
}

/** Runtime URL served from `public/exercises/` after sync. */
export function publicUrlForCore100Exercise(
  externalId: string,
  relativePath: string,
): string {
  return `/${CORE_100_EXERCISE_PUBLIC_ROOT.replace(/^public\//, "")}/${externalId}/${relativePath}`;
}

export function storageVideoPathForCore100Exercise(
  externalId: string,
  kind: "exercise" | "instructions",
): string {
  return kind === "instructions"
    ? `exercises/${externalId}/instructions.mp4`
    : `exercises/${externalId}/exercise.mp4`;
}

export const CORE_100_EXERCISE_SLOTS = CORE_100_EXTERNAL_IDS.map((externalId, index) => ({
  externalId,
  priority: index < 40 ? "P1" : index < 80 ? "P2" : "P3",
  repoDir: `${CORE_100_EXERCISE_CONTENT_ROOT}/${externalId}`,
  publicDir: `${CORE_100_EXERCISE_PUBLIC_ROOT}/${externalId}`,
}));
