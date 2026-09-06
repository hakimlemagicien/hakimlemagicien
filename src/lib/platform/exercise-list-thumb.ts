import {
  exerciseHasRealMotionVideo,
  bundledRealMotionVideoPublicUrl,
} from "@/lib/platform/exercise-real-motion-video";
import { getExerciseStageListThumb } from "@/lib/platform/exercise-stage-media";

/** Always-visible fallback so list rows never render without a thumb surface. */
export const EXERCISE_LIST_THUMB_FALLBACK_SRC =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="exercise">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop stop-color="#1f2937"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs>` +
      `<rect width="160" height="160" fill="url(#g)"/>` +
      `<rect x="48" y="48" width="64" height="64" rx="16" fill="none" stroke="#f97316" stroke-width="4"/>` +
      `</svg>`,
  );

export type ExerciseListThumbSource =
  | { type: "video"; src: string }
  | { type: "image"; src: string };

/**
 * List/session thumbnail rules:
 * - Real motion video → the video itself (never stage still backup).
 * - No real video → stage still (or signed DB thumb image).
 * - Always returns a visible src (never null).
 */
export function resolveExerciseListThumb(input: {
  externalId: string;
  videoStatus?: string | null;
  /** Already-resolved signed URL for the preferred list media (usually the exercise video). */
  resolvedMediaUrl?: string | null;
  /** Optional signed/public image override (admin client thumb, DB thumbnail.webp). */
  imageOverrideUrl?: string | null;
}): ExerciseListThumbSource {
  const hasRealVideo = exerciseHasRealMotionVideo({
    externalId: input.externalId,
    videoStatus: input.videoStatus,
  });

  if (hasRealVideo) {
    const videoSrc =
      input.resolvedMediaUrl?.trim() ||
      bundledRealMotionVideoPublicUrl(input.externalId) ||
      `/exercises/${input.externalId}/video/exercise.mp4`;
    return { type: "video", src: videoSrc };
  }

  const imageSrc =
    input.imageOverrideUrl?.trim() ||
    (!hasRealVideo ? input.resolvedMediaUrl?.trim() : null) ||
    getExerciseStageListThumb(input.externalId);

  if (imageSrc) {
    return { type: "image", src: imageSrc };
  }

  return { type: "image", src: EXERCISE_LIST_THUMB_FALLBACK_SRC };
}
