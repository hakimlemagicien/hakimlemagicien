import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  EXERCISE_LIST_THUMB_FALLBACK_SRC,
  resolveExerciseListThumb,
} from "@/lib/platform/exercise-list-thumb";
import { cn } from "@/lib/utils";

type ExerciseListThumbProps = {
  externalId: string;
  videoStatus?: string | null;
  /** Signed URL for the real exercise video (or DB thumb image when no real video). */
  resolvedMediaUrl?: string | null;
  /** Admin/client image override (never used when a real motion video exists). */
  imageOverrideUrl?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
};

/**
 * Workout/admin list thumbnail:
 * real video → video frame; otherwise stage still / override; never empty.
 */
export function ExerciseListThumb({
  externalId,
  videoStatus,
  resolvedMediaUrl,
  imageOverrideUrl,
  alt,
  className,
  width = 176,
  height = 176,
  sizes = "88px",
}: ExerciseListThumbProps) {
  const thumb = resolveExerciseListThumb({
    externalId,
    videoStatus,
    resolvedMediaUrl,
    imageOverrideUrl,
  });

  if (thumb.type === "video") {
    return (
      <video
        src={thumb.src}
        muted
        playsInline
        preload="metadata"
        aria-label={alt}
        className={cn("h-full w-full object-cover object-center", className)}
      />
    );
  }

  return (
    <OptimizedImage
      src={thumb.src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      objectFit="cover"
      className={cn("h-full w-full", className)}
      fallback={
        // eslint-disable-next-line jsx-a11y/alt-text -- decorative fallback surface
        <img
          src={EXERCISE_LIST_THUMB_FALLBACK_SRC}
          alt=""
          className={cn("h-full w-full object-cover", className)}
        />
      }
    />
  );
}
