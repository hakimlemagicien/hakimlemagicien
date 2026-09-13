import { getExerciseStageListThumb } from "@/lib/platform/exercise-stage-media";
import { publicExerciseVariantImageThumbPath } from "./paths";
import { resolveExerciseListStill, resolveExerciseMedia } from "./resolve";
import type { ExerciseMediaVariant } from "./types";

/**
 * Safe list/cover still for UI — never returns a locator when MEDIA_MISSING.
 * FEMALE preferred uses registered FEMALE image; falls back to STANDARD stage packs.
 */
export function resolvePreferredExerciseStillThumb(input: {
  externalId: string;
  preferredVariant?: ExerciseMediaVariant | null;
  metadata?: Record<string, unknown> | null;
}): string | null {
  const preferred = input.preferredVariant === "FEMALE" ? "FEMALE" : "STANDARD";
  const standardStillUrl = getExerciseStageListThumb(input.externalId);
  const resolved = resolveExerciseListStill({
    externalId: input.externalId,
    preferredVariant: preferred,
    metadata: input.metadata,
    standardStillUrl,
  });
  if (resolved.outcome !== "READY") return null;
  return resolved.url?.trim() || resolved.path?.trim() || null;
}

/**
 * Preferred playback locator for exercise video when FEMALE variant is requested.
 * Returns public path for READY or TEMPORARY_STILL_AS_VIDEO — never marks real-video ready.
 */
export function resolvePreferredExerciseVideoPlayback(input: {
  externalId: string;
  preferredVariant?: ExerciseMediaVariant | null;
  metadata?: Record<string, unknown> | null;
  /** STANDARD DB video path (storage). */
  standardVideoPath?: string | null;
  standardVideoStatus?: string | null;
}): {
  path: string | null;
  /** Playback uses public URL or storage path; status for ExerciseMedia when public. */
  usePublicPath: boolean;
  selectedVariant: ExerciseMediaVariant | null;
  temporaryStill: boolean;
  reason: string;
} {
  const preferred = input.preferredVariant === "FEMALE" ? "FEMALE" : "STANDARD";
  if (preferred === "FEMALE") {
    const resolved = resolveExerciseMedia({
      externalId: input.externalId,
      preferredVariant: "FEMALE",
      mediaType: "VIDEO",
      metadata: input.metadata,
      standardHint: { ready: false },
    });
    if (resolved.outcome === "READY" && resolved.path) {
      return {
        path: resolved.path,
        usePublicPath: true,
        selectedVariant: resolved.selectedVariant,
        temporaryStill: /TEMPORARY_STILL/i.test(resolved.reason),
        reason: resolved.reason,
      };
    }
  }

  const std = input.standardVideoPath?.trim() || null;
  if (std && String(input.standardVideoStatus ?? "").toLowerCase() === "ready") {
    return {
      path: std,
      usePublicPath: false,
      selectedVariant: "STANDARD",
      temporaryStill: false,
      reason: "STANDARD_DB_READY",
    };
  }

  return {
    path: null,
    usePublicPath: false,
    selectedVariant: null,
    temporaryStill: false,
    reason: "NO_PLAYABLE_VIDEO",
  };
}

/** Convenience: registered FEMALE image public thumb path (does not prove file exists). */
export function femaleStillThumbConventionPath(externalId: string): string {
  return publicExerciseVariantImageThumbPath(externalId, "FEMALE");
}
