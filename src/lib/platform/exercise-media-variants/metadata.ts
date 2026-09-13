import {
  EXERCISE_MEDIA_VARIANTS_METADATA_KEY,
  isExerciseMediaVariant,
  isExerciseMediaVariantStatus,
  isExerciseMediaVariantType,
  type ExerciseMediaVariant,
  type ExerciseMediaVariantAsset,
  type ExerciseMediaVariantBundle,
  type ExerciseMediaVariantType,
  type ExerciseMediaVariantsMap,
} from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseAsset(raw: unknown): ExerciseMediaVariantAsset | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  if (!isExerciseMediaVariantType(obj.media_type)) return null;
  if (!isExerciseMediaVariantStatus(obj.status)) return null;
  const path = typeof obj.path === "string" ? obj.path : null;
  const url = typeof obj.url === "string" ? obj.url : null;
  const version = typeof obj.version === "number" ? obj.version : undefined;
  const updated_at = typeof obj.updated_at === "string" ? obj.updated_at : undefined;
  return {
    media_type: obj.media_type,
    status: obj.status,
    path,
    url,
    version,
    updated_at,
    real_video_required:
      typeof obj.real_video_required === "boolean" ? obj.real_video_required : undefined,
    replacement_pending:
      typeof obj.replacement_pending === "boolean" ? obj.replacement_pending : undefined,
  };
}

function parseBundle(raw: unknown): ExerciseMediaVariantBundle {
  const obj = asRecord(raw);
  if (!obj) return {};
  const out: ExerciseMediaVariantBundle = {};
  const image = parseAsset(obj.IMAGE);
  const video = parseAsset(obj.VIDEO);
  if (image) out.IMAGE = image;
  if (video) out.VIDEO = video;
  return out;
}

export function readMediaVariantsMap(
  metadata: Record<string, unknown> | null | undefined,
): ExerciseMediaVariantsMap {
  const root = asRecord(metadata);
  if (!root) return {};
  const variants = asRecord(root[EXERCISE_MEDIA_VARIANTS_METADATA_KEY]);
  if (!variants) return {};
  const out: ExerciseMediaVariantsMap = {};
  for (const key of Object.keys(variants)) {
    if (!isExerciseMediaVariant(key)) continue;
    out[key] = parseBundle(variants[key]);
  }
  return out;
}

export function getVariantAsset(
  metadata: Record<string, unknown> | null | undefined,
  variant: ExerciseMediaVariant,
  mediaType: ExerciseMediaVariantType,
): ExerciseMediaVariantAsset | null {
  const map = readMediaVariantsMap(metadata);
  return map[variant]?.[mediaType] ?? null;
}

export function writeVariantAsset(
  metadata: Record<string, unknown> | null | undefined,
  variant: ExerciseMediaVariant,
  asset: ExerciseMediaVariantAsset,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(metadata ?? {}) };
  const map = readMediaVariantsMap(next);
  const bundle: ExerciseMediaVariantBundle = { ...(map[variant] ?? {}) };
  bundle[asset.media_type] = asset;
  map[variant] = bundle;
  next[EXERCISE_MEDIA_VARIANTS_METADATA_KEY] = map;
  return next;
}

/** True only for status READY with a usable path or url. Placeholder / temp still never count. */
export function isVariantAssetReady(
  asset: ExerciseMediaVariantAsset | null | undefined,
  options?: { assetExists?: (path: string) => boolean },
): boolean {
  if (!asset) return false;
  if (asset.status !== "READY") return false;
  const locator = (asset.url?.trim() || asset.path?.trim() || "") as string;
  if (!locator) return false;
  if (options?.assetExists && asset.path) {
    return options.assetExists(asset.path);
  }
  return true;
}

/**
 * Playable locator for the player — READY or TEMPORARY_STILL_AS_VIDEO with a path/url.
 * Does NOT imply REAL_VIDEO_READY / completeness video counters.
 */
export function isVariantAssetPlayable(
  asset: ExerciseMediaVariantAsset | null | undefined,
  options?: { assetExists?: (path: string) => boolean },
): boolean {
  if (!asset) return false;
  if (asset.status !== "READY" && asset.status !== "TEMPORARY_STILL_AS_VIDEO") return false;
  const locator = (asset.url?.trim() || asset.path?.trim() || "") as string;
  if (!locator) return false;
  if (/placeholder/i.test(locator)) return false;
  if (options?.assetExists && asset.path) {
    return options.assetExists(asset.path);
  }
  return true;
}
