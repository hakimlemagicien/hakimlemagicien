import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  exerciseMediaQueryKey,
  fetchResolvedExerciseMediaUrl,
  type ExerciseMediaKind,
  type ExerciseMediaStatus,
} from "@/lib/platform/exercise-media";
import { cn } from "@/lib/utils";

type ExerciseThumbnailProps = {
  signedUrl: string | null;
  status: ExerciseMediaStatus;
  mediaPath: string | null;
  kind?: ExerciseMediaKind;
  alt: string;
  className?: string;
};

export function ExerciseThumbnail({
  signedUrl,
  status,
  mediaPath,
  kind = "exercise",
  alt,
  className,
}: ExerciseThumbnailProps) {
  const mediaQuery = useQuery({
    queryKey: ["exercise-media", exerciseMediaQueryKey({ status, path: mediaPath, kind })],
    queryFn: () => fetchResolvedExerciseMediaUrl({ status, path: mediaPath, kind }),
    enabled: !signedUrl,
    staleTime: 50 * 60 * 1000,
    retry: 1,
  });

  const url = signedUrl ?? mediaQuery.data ?? null;
  const [mediaFailed, setMediaFailed] = useState(false);

  if (mediaQuery.isLoading && !signedUrl) {
    return (
      <Skeleton
        className={cn("rounded-none", className)}
        aria-label="جاري تحميل الوسائط"
      />
    );
  }

  if (url && !mediaFailed) {
    return (
      <video
        src={url}
        muted
        playsInline
        preload="metadata"
        aria-label={alt}
        className={cn("h-full w-full object-cover object-center", className)}
        onError={() => setMediaFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-muted text-primary",
        className,
      )}
      aria-label={alt}
    >
      <Dumbbell className="h-4 w-4" strokeWidth={2.2} />
    </div>
  );
}
