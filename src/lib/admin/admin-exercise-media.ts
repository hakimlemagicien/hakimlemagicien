import { supabase } from "@/integrations/supabase/client";
import {
  EXERCISE_MEDIA_BUCKET,
  fetchExerciseMediaUrl,
} from "@/lib/platform/exercise-media";
import { getExerciseStageListThumb } from "@/lib/platform/exercise-stage-media";
import { getAdminExercise, type AdminExerciseDetail } from "@/lib/admin/admin-exercises-api";
import {
  canonicalPathForAsset,
  isCanonicalExerciseMediaPath,
  thumbnailExtFromFile,
  validateExerciseMediaFile,
  type ExerciseMediaAssetType,
} from "@/lib/admin/admin-exercise-media-contract";

export {
  EXERCISE_MEDIA_ASSET_TYPES,
  EXERCISE_THUMBNAIL_MAX_BYTES,
  EXERCISE_VIDEO_MAX_BYTES,
  assertSafeExternalId,
  canonicalPathForAsset,
  isCanonicalExerciseMediaPath,
  replaceConfirmCopy,
  thumbnailExtFromFile,
  thumbnailStatusFromPath,
  thumbnailStatusLabel,
  validateExerciseMediaFile,
  videoStatusLabel,
  type ExerciseMediaAssetType,
  type MediaValidationError,
} from "@/lib/admin/admin-exercise-media-contract";

/**
 * Admin list thumbnails: Storage override first, then the same public stage still
 * the member app uses (Core 100 / stage pilot pool).
 */
export function resolveAdminExerciseListThumbSrc(input: {
  externalId: string;
  thumbnailPath: string | null | undefined;
  signedUrls: Record<string, string>;
  storageFetchDone: boolean;
}): string | null {
  const path = input.thumbnailPath?.trim();
  if (path) {
    const signed = input.signedUrls[path];
    if (signed) return signed;
    if (!input.storageFetchDone) return null;
  }
  return getExerciseStageListThumb(input.externalId);
}

export async function fetchExerciseThumbnailUrls(
  paths: Array<string | null | undefined>,
): Promise<Record<string, string>> {
  const unique = [...new Set(paths.map((path) => path?.trim()).filter((path): path is string => Boolean(path)))];
  if (unique.length === 0) return {};
  const { data, error } = await supabase.storage.from(EXERCISE_MEDIA_BUCKET).createSignedUrls(unique, 60 * 60);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  data.forEach((item, index) => {
    if (item.signedUrl) map[unique[index]] = item.signedUrl;
  });
  return map;
}

export async function replaceAdminExerciseMedia(input: {
  exerciseId: string;
  externalId: string;
  asset: ExerciseMediaAssetType;
  file: File;
  expectedUpdatedAt: string;
}): Promise<AdminExerciseDetail> {
  const validation = validateExerciseMediaFile(input.file, input.asset);
  if (validation) throw new Error(validation.message);

  const ext = input.asset === "thumbnail" ? thumbnailExtFromFile(input.file) ?? "webp" : "webp";
  const path = canonicalPathForAsset(input.externalId, input.asset, ext);
  if (!isCanonicalExerciseMediaPath(input.externalId, path, input.asset)) {
    throw new Error("مسار التخزين غير مسموح.");
  }

  const { error: uploadError } = await supabase.storage.from(EXERCISE_MEDIA_BUCKET).upload(path, input.file, {
    upsert: true,
    contentType: input.file.type || undefined,
    cacheControl: "3600",
  });
  if (uploadError) {
    throw new Error("فشل الرفع. أعد المحاولة.");
  }

  const { data, error } = await supabase.rpc("admin_replace_exercise_media", {
    p_id: input.exerciseId,
    p_asset: input.asset,
    p_path: path,
    p_expected_updated_at: input.expectedUpdatedAt,
  });
  if (error) {
    throw new Error(error.message.includes("forbidden") ? "هذه العملية متاحة للمشرف فقط." : "تعذر تحديث حالة الوسائط بعد الرفع.");
  }
  return getAdminExercise(String((data as { id?: string })?.id ?? input.exerciseId));
}

export async function previewExerciseMediaUrl(path: string | null | undefined): Promise<string | null> {
  if (!path?.trim()) return null;
  try {
    return await fetchExerciseMediaUrl(path);
  } catch {
    return null;
  }
}
