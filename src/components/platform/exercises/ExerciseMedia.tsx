import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { CirclePlay, Dumbbell, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  exerciseMediaQueryKey,
  fetchResolvedExerciseMediaUrl,
  type ExerciseMediaKind,
  type ExerciseMediaStatus,
} from "@/lib/platform/exercise-media";

type ExerciseMediaProps = {
  status: ExerciseMediaStatus;
  path: string | null;
  kind: ExerciseMediaKind;
  title: string;
  label: string;
  autoPlay?: boolean;
  loop?: boolean;
  aspect?: "video" | "square";
  showCaption?: boolean;
  className?: string;
};

export function ExerciseMedia({
  status,
  path,
  kind,
  title,
  label,
  autoPlay = false,
  loop = false,
  aspect = "video",
  showCaption = true,
  className,
}: ExerciseMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaQuery = useQuery({
    queryKey: ["exercise-media", exerciseMediaQueryKey({ status, path, kind })],
    queryFn: () => fetchResolvedExerciseMediaUrl({ status, path, kind }),
    staleTime: 50 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (!autoPlay || !mediaQuery.data) return;
    const video = videoRef.current;
    if (!video) return;

    void video.play().catch(() => {
      // Autoplay may be blocked until user interacts — controls remain available.
    });
  }, [autoPlay, mediaQuery.data]);

  const frameClass = aspect === "square" ? "aspect-square" : "aspect-video";

  if (mediaQuery.isLoading) {
    return (
      <div className={cn("flex items-center justify-center rounded-2xl border border-border bg-muted", frameClass, className)}>
        <LoaderCircle className="h-7 w-7 animate-spin text-primary" aria-label="جاري تحميل الفيديو" />
      </div>
    );
  }

  if (!mediaQuery.data || mediaQuery.isError) {
    return (
      <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted px-6 text-center", frameClass, className)}>
        <span className="grid h-14 w-14 place-items-center rounded-full bg-card text-primary shadow-sm">
          <Dumbbell className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-black text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {status === "review_required"
            ? `${label} قيد المراجعة — سيُعرض بعد الاعتماد.`
            : `سيتم إضافة ${label} قريباً.`}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border bg-muted shadow-sm", frameClass, className)}>
      <video
        ref={videoRef}
        key={mediaQuery.data}
        controls
        autoPlay={autoPlay}
        loop={loop}
        preload="metadata"
        playsInline
        className="absolute inset-0 h-full w-full bg-muted object-cover"
        aria-label={`${label}: ${title}`}
      >
        <source src={mediaQuery.data} />
        متصفحك لا يدعم تشغيل الفيديو.
      </video>
      {showCaption ? (
        <div className="flex items-center gap-2 bg-card px-3 py-2 text-xs font-bold text-foreground">
          <CirclePlay className="h-4 w-4 text-primary" />
          <span>{label}</span>
        </div>
      ) : null}
    </div>
  );
}
