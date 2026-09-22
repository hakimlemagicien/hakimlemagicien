import { supabase } from "@/integrations/supabase/client";
import { EXERCISE_MEDIA_BUCKET, fetchExerciseMediaUrl } from "@/lib/platform/exercise-media";
import {
  mediaDraftPath,
  thumbnailExtFromFile,
  validateExerciseMediaFile,
  type ExerciseMediaAssetType,
} from "./admin-exercise-media-contract";
import type { ExerciseMediaVariant } from "@/lib/platform/exercise-media-variants";

export type ExerciseMediaReadiness =
  | "READY"
  | "VIDEO_MISSING"
  | "IMAGE_MISSING"
  | "THUMBNAIL_MISSING"
  | "PLACEHOLDER"
  | "NEEDS_REVIEW";

export type ExerciseMediaSnapshot = {
  video_path: string | null;
  instructions_video_path: string | null;
  thumbnail_path: string | null;
  instructional_images: string[];
  anatomy_image_path: string | null;
  technical: Record<string, unknown>;
};

export type ExerciseMediaVersion = {
  id: string;
  version: number;
  state: "draft" | "published" | "previous";
  snapshot: ExerciseMediaSnapshot;
  created_at: string;
  published_at: string | null;
};

export type ExerciseMediaManagerState = {
  exercise_id: string;
  external_id: string;
  db_id: string;
  media_variant: ExerciseMediaVariant;
  readiness: ExerciseMediaReadiness;
  current: ExerciseMediaVersion;
  draft: ExerciseMediaVersion | null;
  previous: ExerciseMediaVersion | null;
  templates: Array<{ id: string; name_ar: string; version: number | null }>;
  launch: {
    is_launch_exercise: boolean;
    exercise_count: number;
    ready_count: number;
    video_missing_count: number;
    placeholder_count: number;
  };
  storage: {
    active_video_bytes: number;
    current_exercise_video_bytes: number;
  };
};

type RpcResult = { data: unknown; error: { message: string } | null };
type RpcCaller = (name: string, args?: Record<string, unknown>) => PromiseLike<RpcResult>;

function rpc(name: string, args?: Record<string, unknown>): PromiseLike<RpcResult> {
  return (supabase.rpc as unknown as RpcCaller)(name, args);
}

function friendlyError(message: string): Error {
  if (message.includes("forbidden")) return new Error("هذه العملية متاحة للمشرف المصرّح له فقط.");
  if (message.includes("stale")) return new Error("تغيرت المسودة في جلسة أخرى. حدّث الصفحة ثم أعد المحاولة.");
  return new Error(message || "تعذر إكمال عملية الوسائط.");
}

export async function getExerciseMediaManager(exerciseId: string, variant: ExerciseMediaVariant): Promise<ExerciseMediaManagerState> {
  const { data, error } = await rpc("admin_get_exercise_media_manager_v2", { p_exercise_id: exerciseId, p_variant: variant });
  if (error) throw friendlyError(error.message);
  return data as ExerciseMediaManagerState;
}

export async function stageExerciseMediaFile(input: {
  exerciseId: string;
  externalId: string;
  asset: ExerciseMediaAssetType;
  file: File;
  technical?: Record<string, unknown>;
  variant: ExerciseMediaVariant;
}): Promise<ExerciseMediaManagerState> {
  const validation = validateExerciseMediaFile(input.file, input.asset);
  if (validation) throw new Error(validation.message);

  const revisionId = crypto.randomUUID();
  const ext = input.asset.includes("video") ? "mp4" : thumbnailExtFromFile(input.file) ?? "webp";
  const path = mediaDraftPath(input.externalId, revisionId, input.asset, ext, input.variant);
  const { error: uploadError } = await supabase.storage.from(EXERCISE_MEDIA_BUCKET).upload(path, input.file, {
    upsert: false,
    contentType: input.file.type || undefined,
    cacheControl: "3600",
  });
  if (uploadError) throw new Error("فشل رفع المسودة. بقيت النسخة المنشورة الحالية دون تغيير.");

  const { data, error } = await rpc("admin_stage_exercise_media_v2", {
    p_exercise_id: input.exerciseId,
    p_variant: input.variant,
    p_asset: input.asset,
    p_path: path,
    p_technical: { ...input.technical, bytes: input.file.size, mime: input.file.type },
  });
  if (error) throw friendlyError(error.message);
  return data as ExerciseMediaManagerState;
}

export async function removeDraftExerciseMediaAsset(
  exerciseId: string,
  asset: ExerciseMediaAssetType,
  variant: ExerciseMediaVariant,
): Promise<ExerciseMediaManagerState> {
  const { data, error } = await rpc("admin_stage_exercise_media_v2", {
    p_exercise_id: exerciseId,
    p_variant: variant,
    p_asset: asset,
    p_path: null,
    p_technical: {},
  });
  if (error) throw friendlyError(error.message);
  return data as ExerciseMediaManagerState;
}

export async function stageExistingExerciseMediaPath(
  exerciseId: string,
  asset: ExerciseMediaAssetType,
  path: string | null,
  variant: ExerciseMediaVariant,
): Promise<ExerciseMediaManagerState> {
  const { data, error } = await rpc("admin_stage_exercise_media_v2", {
    p_exercise_id: exerciseId,
    p_variant: variant,
    p_asset: asset,
    p_path: path,
    p_technical: {},
  });
  if (error) throw friendlyError(error.message);
  return data as ExerciseMediaManagerState;
}

export async function publishExerciseMedia(exerciseId: string, variant: ExerciseMediaVariant): Promise<ExerciseMediaManagerState> {
  const { data, error } = await rpc("admin_publish_exercise_media_v2", { p_exercise_id: exerciseId, p_variant: variant });
  if (error) throw friendlyError(error.message);
  return data as ExerciseMediaManagerState;
}

export async function restorePreviousExerciseMedia(exerciseId: string, variant: ExerciseMediaVariant): Promise<ExerciseMediaManagerState> {
  const { data, error } = await rpc("admin_restore_previous_exercise_media_v2", { p_exercise_id: exerciseId, p_variant: variant });
  if (error) throw friendlyError(error.message);
  return data as ExerciseMediaManagerState;
}

export async function resolveExerciseMediaSnapshotUrls(snapshot: ExerciseMediaSnapshot) {
  const paths = [
    snapshot.video_path,
    snapshot.instructions_video_path,
    snapshot.thumbnail_path,
    ...snapshot.instructional_images,
    snapshot.anatomy_image_path,
  ].filter((path): path is string => Boolean(path));
  const entries = await Promise.all(paths.map(async (path) => [path, await fetchExerciseMediaUrl(path)] as const));
  return Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => typeof entry[1] === "string"));
}

export function projectedLaunchVideoUsage(input: {
  activeBytes: number;
  currentExerciseBytes: number;
  newVideoBytes: number;
}): number {
  return Math.max(0, input.activeBytes - input.currentExerciseBytes + input.newVideoBytes);
}
