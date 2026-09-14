import { getVariantAsset, isVariantAssetReady, readMediaVariantsMap } from "./metadata";
import type { ExerciseMediaVariant, ExerciseMediaVariantStatus } from "./types";

export type ExerciseMediaVariantStateRow = {
  external_id: string;
  STANDARD_IMAGE: ExerciseMediaVariantStatus | "READY_HINT";
  STANDARD_VIDEO: ExerciseMediaVariantStatus | "READY_HINT";
  FEMALE_IMAGE: ExerciseMediaVariantStatus;
  FEMALE_VIDEO: ExerciseMediaVariantStatus;
};

function statusOrMissing(
  ready: boolean,
  assetStatus: ExerciseMediaVariantStatus | null,
): ExerciseMediaVariantStatus {
  if (ready) return "READY";
  if (
    assetStatus === "PLACEHOLDER" ||
    assetStatus === "PROCESSING" ||
    assetStatus === "TEMPORARY_STILL_AS_VIDEO"
  ) {
    return assetStatus;
  }
  return "MISSING";
}

/**
 * Per-exercise STANDARD / FEMALE image+video states for Admin diagnostics.
 * STANDARD may be READY_HINT from existing public packs without metadata.
 */
export function describeExerciseMediaVariantState(input: {
  externalId: string;
  metadata?: Record<string, unknown> | null;
  standardImageReady?: boolean;
  standardVideoReady?: boolean;
}): ExerciseMediaVariantStateRow {
  const stdImg = getVariantAsset(input.metadata, "STANDARD", "IMAGE");
  const stdVid = getVariantAsset(input.metadata, "STANDARD", "VIDEO");
  const femImg = getVariantAsset(input.metadata, "FEMALE", "IMAGE");
  const femVid = getVariantAsset(input.metadata, "FEMALE", "VIDEO");

  const standardImageReady =
    isVariantAssetReady(stdImg) || Boolean(input.standardImageReady);
  const standardVideoReady =
    isVariantAssetReady(stdVid) || Boolean(input.standardVideoReady);

  return {
    external_id: input.externalId,
    STANDARD_IMAGE: standardImageReady
      ? isVariantAssetReady(stdImg)
        ? "READY"
        : "READY_HINT"
      : statusOrMissing(false, stdImg?.status ?? null),
    STANDARD_VIDEO: standardVideoReady
      ? isVariantAssetReady(stdVid)
        ? "READY"
        : "READY_HINT"
      : statusOrMissing(false, stdVid?.status ?? null),
    FEMALE_IMAGE: statusOrMissing(isVariantAssetReady(femImg), femImg?.status ?? null),
    FEMALE_VIDEO: statusOrMissing(isVariantAssetReady(femVid), femVid?.status ?? null),
  };
}

export function listVariantKeysPresent(
  metadata: Record<string, unknown> | null | undefined,
): ExerciseMediaVariant[] {
  return Object.keys(readMediaVariantsMap(metadata)) as ExerciseMediaVariant[];
}
