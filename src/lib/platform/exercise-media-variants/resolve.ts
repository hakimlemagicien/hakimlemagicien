import { getVariantAsset, isVariantAssetPlayable, isVariantAssetReady } from "./metadata";
import type {
  ExerciseMediaVariant,
  ResolveExerciseMediaInput,
  ResolveExerciseMediaResult,
} from "./types";

function readyFromHint(
  hint: ResolveExerciseMediaInput["standardHint"],
  assetExists?: (path: string) => boolean,
): { ready: boolean; path: string | null; url: string | null } {
  const path = hint?.path?.trim() || null;
  const url = hint?.url?.trim() || null;
  if (hint?.ready === false) return { ready: false, path, url };
  if (!path && !url) return { ready: false, path: null, url: null };
  if (hint?.ready === true) return { ready: true, path, url };
  if (path && assetExists) return { ready: assetExists(path), path, url };
  // Path/url present without explicit false → treat as STANDARD ready (existing pack).
  return { ready: true, path, url };
}

function tryVariant(
  input: ResolveExerciseMediaInput,
  variant: ExerciseMediaVariant,
): { ready: boolean; path: string | null; url: string | null; reason: string } {
  const asset = getVariantAsset(input.metadata, variant, input.mediaType);

  // Images: READY only. Videos: READY or TEMPORARY_STILL_AS_VIDEO (playable, not real-ready).
  if (input.mediaType === "VIDEO") {
    if (isVariantAssetPlayable(asset, { assetExists: input.assetExists })) {
      const reason =
        asset?.status === "TEMPORARY_STILL_AS_VIDEO"
          ? `${variant}_TEMPORARY_STILL_PLAYABLE`
          : `${variant}_METADATA_READY`;
      return {
        ready: true,
        path: asset?.path ?? null,
        url: asset?.url ?? null,
        reason,
      };
    }
  } else if (isVariantAssetReady(asset, { assetExists: input.assetExists })) {
    return {
      ready: true,
      path: asset?.path ?? null,
      url: asset?.url ?? null,
      reason: `${variant}_METADATA_READY`,
    };
  }

  if (variant === "STANDARD") {
    const hint = readyFromHint(input.standardHint, input.assetExists);
    if (hint.ready) {
      return {
        ready: true,
        path: hint.path,
        url: hint.url,
        reason: "STANDARD_HINT_READY",
      };
    }
  }

  if (asset?.status === "PLACEHOLDER") {
    return { ready: false, path: null, url: null, reason: `${variant}_PLACEHOLDER_NOT_READY` };
  }

  return { ready: false, path: null, url: null, reason: `${variant}_MISSING` };
}

/**
 * Central media variant resolver.
 * preferred FEMALE → FEMALE READY (or playable temp video) → else STANDARD READY → else MEDIA_MISSING.
 * Never returns a broken locator for MEDIA_MISSING (path/url null).
 */
export function resolveExerciseMedia(input: ResolveExerciseMediaInput): ResolveExerciseMediaResult {
  const preferred = input.preferredVariant;
  const order: ExerciseMediaVariant[] =
    preferred === "FEMALE" ? ["FEMALE", "STANDARD"] : ["STANDARD"];

  for (let i = 0; i < order.length; i++) {
    const variant = order[i]!;
    const hit = tryVariant(input, variant);
    if (hit.ready) {
      return {
        selectedVariant: variant,
        outcome: "READY",
        mediaType: input.mediaType,
        path: hit.path,
        url: hit.url,
        fallbackUsed: preferred === "FEMALE" && variant === "STANDARD",
        reason: hit.reason,
      };
    }
  }

  return {
    selectedVariant: null,
    outcome: "MEDIA_MISSING",
    mediaType: input.mediaType,
    path: null,
    url: null,
    fallbackUsed: false,
    reason: preferred === "FEMALE" ? "FEMALE_AND_STANDARD_MISSING" : "STANDARD_MISSING",
  };
}

/**
 * List/cover still helper — prefer FEMALE image when requested, else STANDARD still.
 * Returns null on MEDIA_MISSING (caller must not render broken <img>).
 */
export function resolveExerciseListStill(input: {
  externalId: string;
  preferredVariant: ExerciseMediaVariant;
  metadata?: Record<string, unknown> | null;
  /** Existing STANDARD still (stage-b thumb / core-100). */
  standardStillUrl?: string | null;
  assetExists?: (path: string) => boolean;
}): ResolveExerciseMediaResult {
  return resolveExerciseMedia({
    externalId: input.externalId,
    preferredVariant: input.preferredVariant,
    mediaType: "IMAGE",
    metadata: input.metadata,
    standardHint: {
      url: input.standardStillUrl ?? null,
      path: input.standardStillUrl ?? null,
      ready: Boolean(input.standardStillUrl),
    },
    assetExists: input.assetExists,
  });
}
