import { pathBelongsToExerciseVariant } from "./paths";
import { getVariantAsset, writeVariantAsset } from "./metadata";
import {
  isExerciseMediaVariant,
  isExerciseMediaVariantStatus,
  isExerciseMediaVariantType,
  type RegisterExerciseMediaAssetInput,
  type RegisterExerciseMediaAssetResult,
} from "./types";

function knownSet(ids: RegisterExerciseMediaAssetInput["knownExternalIds"]): Set<string> {
  if (ids instanceof Set) return ids;
  return new Set(ids);
}

/**
 * Idempotent registration of a media variant asset onto exercises.metadata.
 * Does not write to DB — caller persists the returned metadata.
 */
export function registerExerciseMediaAsset(
  input: RegisterExerciseMediaAssetInput,
): RegisterExerciseMediaAssetResult {
  const externalId = input.exerciseExternalId?.trim().toUpperCase() ?? "";
  if (!externalId || !knownSet(input.knownExternalIds).has(externalId)) {
    return {
      ok: false,
      code: "UNKNOWN_EXERCISE",
      message: `Unknown exercise_external_id: ${input.exerciseExternalId}`,
    };
  }
  if (!isExerciseMediaVariant(input.variant)) {
    return { ok: false, code: "UNKNOWN_VARIANT", message: "Unknown media variant" };
  }
  if (!isExerciseMediaVariantType(input.mediaType)) {
    return { ok: false, code: "UNKNOWN_MEDIA_TYPE", message: "Unknown media type" };
  }
  if (!isExerciseMediaVariantStatus(input.status)) {
    return { ok: false, code: "UNKNOWN_STATUS", message: "Unknown status" };
  }

  const path = input.path?.trim() ?? "";
  if (!path) {
    return { ok: false, code: "EMPTY_PATH", message: "path required" };
  }

  // Explicit: never allow status READY for placeholder semantic path tokens
  if (input.status === "READY" && /placeholder/i.test(path)) {
    return {
      ok: false,
      code: "PLACEHOLDER_MARKED_READY",
      message: "Placeholder path cannot be marked READY",
    };
  }

  // Temporary still-as-video must never be registered as READY
  if (input.status === "READY" && input.mediaType === "VIDEO" && input.replacement_pending === true) {
    return {
      ok: false,
      code: "PLACEHOLDER_MARKED_READY",
      message: "replacement_pending video cannot be marked READY",
    };
  }

  if (!pathBelongsToExerciseVariant(externalId, input.variant, path)) {
    return {
      ok: false,
      code: "PATH_VARIANT_MISMATCH",
      message: "Asset path does not belong to this exercise/variant",
    };
  }

  if (
    (input.status === "READY" || input.status === "TEMPORARY_STILL_AS_VIDEO") &&
    input.assetExists &&
    !input.assetExists(path)
  ) {
    return {
      ok: false,
      code: "MISSING_FILE_MARKED_READY",
      message: "Cannot register playable status when file is missing",
    };
  }

  const existing = getVariantAsset(input.metadata, input.variant, input.mediaType);
  if (
    existing &&
    existing.status === "READY" &&
    existing.path &&
    existing.path !== path &&
    input.status === "READY"
  ) {
    return {
      ok: false,
      code: "CONFLICTING_ASSET",
      message: `Conflicting READY asset already registered at ${existing.path}`,
    };
  }

  const idempotent =
    Boolean(existing) &&
    existing?.path === path &&
    existing?.status === input.status &&
    existing?.media_type === input.mediaType &&
    Boolean(existing?.real_video_required) === Boolean(input.real_video_required) &&
    Boolean(existing?.replacement_pending) === Boolean(input.replacement_pending);

  const asset = {
    media_type: input.mediaType,
    status: input.status,
    path,
    version: input.version ?? existing?.version ?? 1,
    updated_at: new Date().toISOString(),
    ...(input.real_video_required !== undefined
      ? { real_video_required: input.real_video_required }
      : {}),
    ...(input.replacement_pending !== undefined
      ? { replacement_pending: input.replacement_pending }
      : {}),
  };

  const metadata = writeVariantAsset(input.metadata, input.variant, asset);
  return { ok: true, metadata, idempotent, asset };
}
