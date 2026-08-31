/**
 * Exercise media contract — no Supabase client. Identity is independent of files.
 */
type ThumbnailExtension = "webp" | "jpg" | "png";

function buildRealExerciseVideoPath(externalId: string): string {
  return `exercises/${externalId}/exercise.mp4`;
}

function buildRealInstructionsVideoPath(externalId: string): string {
  return `exercises/${externalId}/instructions.mp4`;
}

function buildRealThumbnailPath(externalId: string, ext: ThumbnailExtension = "webp"): string {
  return `exercises/${externalId}/thumbnail.${ext}`;
}

function normalizeStorageObjectPath(path: string): string {
  return path.replace(/^\/+/, "").replace(/^exercise-media\//, "");
}

export const EXERCISE_MEDIA_ASSET_TYPES = ["exercise_video", "instructions_video", "thumbnail"] as const;
export type ExerciseMediaAssetType = (typeof EXERCISE_MEDIA_ASSET_TYPES)[number];

export const EXERCISE_VIDEO_MAX_BYTES = 80 * 1024 * 1024;
export const EXERCISE_THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024;

export const EXERCISE_VIDEO_MIME = ["video/mp4"] as const;
export const EXERCISE_THUMBNAIL_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

const EXTERNAL_ID_RE = /^[A-Z][A-Z0-9-]{1,31}$/i;

export type MediaValidationError = {
  code: "invalid_type" | "invalid_extension" | "empty_file" | "too_large" | "invalid_id" | "invalid_path";
  message: string;
};

export function videoStatusLabel(status: string): string {
  if (status === "ready") return "جاهز";
  if (status === "missing") return "غير موجود";
  if (status === "placeholder") return "Placeholder";
  return status;
}

export function thumbnailStatusFromPath(path: string | null | undefined): "ready" | "missing" {
  return path?.trim() ? "ready" : "missing";
}

export function thumbnailStatusLabel(path: string | null | undefined): string {
  return thumbnailStatusFromPath(path) === "ready" ? "جاهزة" : "غير موجودة";
}

export function assertSafeExternalId(externalId: string): string {
  const id = externalId.trim().toUpperCase();
  if (!EXTERNAL_ID_RE.test(id)) {
    throw Object.assign(new Error("معرّف التمرين غير صالح."), { code: "invalid_id" });
  }
  return id;
}

export function canonicalPathForAsset(
  externalId: string,
  asset: ExerciseMediaAssetType,
  thumbnailExt: ThumbnailExtension = "webp",
): string {
  const id = assertSafeExternalId(externalId);
  if (asset === "exercise_video") return buildRealExerciseVideoPath(id);
  if (asset === "instructions_video") return buildRealInstructionsVideoPath(id);
  return buildRealThumbnailPath(id, thumbnailExt);
}

export function isCanonicalExerciseMediaPath(
  externalId: string,
  path: string,
  asset: ExerciseMediaAssetType,
): boolean {
  const normalized = normalizeStorageObjectPath(path);
  if (asset === "exercise_video") return normalized === canonicalPathForAsset(externalId, asset);
  if (asset === "instructions_video") return normalized === canonicalPathForAsset(externalId, asset);
  return (
    normalized === canonicalPathForAsset(externalId, "thumbnail", "webp") ||
    normalized === canonicalPathForAsset(externalId, "thumbnail", "jpg") ||
    normalized === canonicalPathForAsset(externalId, "thumbnail", "png")
  );
}

function extensionOf(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx >= 0 ? fileName.slice(idx + 1).toLowerCase() : "";
}

export function thumbnailExtFromFile(file: { name: string; type: string }): ThumbnailExtension | null {
  const ext = extensionOf(file.name);
  if (ext === "jpeg" || ext === "jpg") return "jpg";
  if (ext === "png") return "png";
  if (ext === "webp") return "webp";
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return null;
}

export function validateExerciseMediaFile(
  file: { name: string; type: string; size: number } | null | undefined,
  asset: ExerciseMediaAssetType,
): MediaValidationError | null {
  if (!file || file.size <= 0) {
    return { code: "empty_file", message: "الملف فارغ أو غير صالح." };
  }
  if (asset === "thumbnail") {
    if (file.size > EXERCISE_THUMBNAIL_MAX_BYTES) {
      return { code: "too_large", message: "حجم الصورة أكبر من الحد المسموح (2MB)." };
    }
    const ext = thumbnailExtFromFile(file);
    if (!ext || !EXERCISE_THUMBNAIL_MIME.includes(file.type as (typeof EXERCISE_THUMBNAIL_MIME)[number])) {
      return { code: "invalid_type", message: "صيغة الصورة غير مدعومة. استخدم JPEG أو PNG أو WEBP." };
    }
    return null;
  }
  if (file.size > EXERCISE_VIDEO_MAX_BYTES) {
    return { code: "too_large", message: "حجم الفيديو أكبر من الحد المسموح (80MB)." };
  }
  const ext = extensionOf(file.name);
  if (file.type !== "video/mp4" || ext !== "mp4") {
    return { code: "invalid_type", message: "صيغة الفيديو غير مدعومة. استخدم ملف MP4 فقط." };
  }
  return null;
}

export function replaceConfirmCopy(externalId: string, asset: ExerciseMediaAssetType): {
  title: string;
  body: string;
  confirmLabel: string;
} {
  const id = assertSafeExternalId(externalId);
  if (asset === "thumbnail") {
    return {
      title: "تأكيد استبدال الصورة",
      body: `سيتم استبدال صورة ${id} مع الحفاظ على نفس التمرين والاسم والمعرف.`,
      confirmLabel: "تأكيد الاستبدال",
    };
  }
  const kind = asset === "instructions_video" ? "فيديو التعليمات" : "فيديو";
  return {
    title: `تأكيد استبدال ${kind}`,
    body: `سيتم استبدال ${kind} لـ ${id} مع الحفاظ على نفس التمرين والاسم والمعرف.`,
    confirmLabel: "تأكيد الاستبدال",
  };
}
