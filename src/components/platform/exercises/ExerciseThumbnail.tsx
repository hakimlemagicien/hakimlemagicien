import { useQuery } from "@tanstack/react-query";
import { Dumbbell, LoaderCircle } from "lucide-react";
import { fetchExerciseMediaUrl } from "@/lib/platform/exercise-library";
import { cn } from "@/lib/utils";

type ExerciseThumbnailProps = {
  signedUrl: string | null;
  mediaPath: string | null;
  alt: string;
  className?: string;
};

export function ExerciseThumbnail({
  signedUrl,
  mediaPath,
  alt,
  className,
}: ExerciseThumbnailProps) {
  const mediaQuery = useQuery({
    queryKey: ["exercise-media", mediaPath],
    queryFn: () => fetchExerciseMediaUrl(mediaPath),
    enabled: Boolean(mediaPath) && !signedUrl,
    staleTime: 50 * 60 * 1000,
    retry: 1,
  });

  const url = signedUrl ?? mediaQuery.data ?? null;

  if (mediaQuery.isLoading && !signedUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted",
          className,
        )}
      >
        <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  if (url) {
    return (
      <video
        src={url}
        muted
        playsInline
        preload="metadata"
        aria-label={alt}
        className={cn("h-full w-full object-cover object-center", className)}
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
