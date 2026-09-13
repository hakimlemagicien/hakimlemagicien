/**
 * Deterministic public + Storage paths for exercise media variants.
 * Canonical identity = external_id. Variant folder separates STANDARD vs FEMALE.
 */

import type { ExerciseMediaVariant, ExerciseMediaVariantType } from "./types";

/** Public stills / bundled video under Vite public/. */
export function publicExerciseVariantRoot(
  externalId: string,
  variant: ExerciseMediaVariant,
): string {
  const id = externalId.trim().toUpperCase();
  if (variant === "STANDARD") return `/exercises/${id}`;
  return `/exercises/${id}/female`;
}

/** Relative to public/exercises/<id>/ — useful for registration + probes. */
export function relativeExerciseVariantDir(variant: ExerciseMediaVariant): string {
  return variant === "STANDARD" ? "" : "female";
}

export function publicExerciseVariantImageThumbPath(
  externalId: string,
  variant: ExerciseMediaVariant,
): string {
  const root = publicExerciseVariantRoot(externalId, variant);
  return `${root}/stages/stage-b-thumb.webp`;
}

export function publicExerciseVariantVideoPath(
  externalId: string,
  variant: ExerciseMediaVariant,
): string {
  const root = publicExerciseVariantRoot(externalId, variant);
  return `${root}/video/exercise.mp4`;
}

/** Supabase Storage object paths (bucket: exercise-media). */
export function storageExerciseVariantVideoPath(
  externalId: string,
  variant: ExerciseMediaVariant,
): string {
  const id = externalId.trim().toUpperCase();
  if (variant === "STANDARD") return `exercises/${id}/exercise.mp4`;
  return `exercises/${id}/female/exercise.mp4`;
}

export function storageExerciseVariantThumbnailPath(
  externalId: string,
  variant: ExerciseMediaVariant,
  ext: "webp" | "jpg" | "png" = "webp",
): string {
  const id = externalId.trim().toUpperCase();
  if (variant === "STANDARD") return `exercises/${id}/thumbnail.${ext}`;
  return `exercises/${id}/female/thumbnail.${ext}`;
}

export function defaultPublicPathForVariantAsset(
  externalId: string,
  variant: ExerciseMediaVariant,
  mediaType: ExerciseMediaVariantType,
): string {
  return mediaType === "IMAGE"
    ? publicExerciseVariantImageThumbPath(externalId, variant)
    : publicExerciseVariantVideoPath(externalId, variant);
}

/** Reject paths that claim FEMALE but live under another exercise id. */
export function pathBelongsToExerciseVariant(
  externalId: string,
  variant: ExerciseMediaVariant,
  path: string,
): boolean {
  const id = externalId.trim().toUpperCase();
  const normalized = path.replace(/^\/+/, "").replace(/^exercises\//, "exercises/");
  const publicNeedle =
    variant === "FEMALE" ? `exercises/${id}/female/` : `exercises/${id}/`;
  const storageNeedle =
    variant === "FEMALE" ? `exercises/${id}/female/` : `exercises/${id}/`;

  if (variant === "STANDARD") {
    // STANDARD may be exercises/ID/... but not exercises/ID/female/...
    if (normalized.includes(`/female/`) || normalized.startsWith(`exercises/${id}/female`)) {
      return false;
    }
    return (
      normalized.includes(`exercises/${id}/`) ||
      normalized.startsWith(`/exercises/${id}/`) ||
      path.startsWith(`/exercises/${id}/`)
    );
  }

  return (
    normalized.includes(publicNeedle) ||
    normalized.includes(storageNeedle) ||
    path.includes(`/exercises/${id}/female/`)
  );
}
