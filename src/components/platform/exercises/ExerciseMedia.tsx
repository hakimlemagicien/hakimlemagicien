import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { CirclePlay, Dumbbell, LoaderCircle } from "lucide-react";
import { fetchExerciseMediaUrl } from "@/lib/platform/exercise-library";

type ExerciseMediaProps = {
  path: string | null;
  title: string;
  label: string;
  autoPlay?: boolean;
};

export function ExerciseMedia({ path, title, label, autoPlay = false }: ExerciseMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaQuery = useQuery({
    queryKey: ["exercise-media", path],
    queryFn: () => fetchExerciseMediaUrl(path),
    enabled: Boolean(path),
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

  if (mediaQuery.isLoading) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-muted">
        <LoaderCircle className="h-7 w-7 animate-spin text-primary" aria-label="جاري تحميل الفيديو" />
      </div>
    );
  }

  if (!mediaQuery.data || mediaQuery.isError) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted px-6 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-card text-primary shadow-sm">
          <Dumbbell className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-black text-foreground">الفيديو غير متوفر حالياً</p>
        <p className="mt-1 text-xs text-muted-foreground">سيتم إضافة {label} قريباً.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-sm">
      <video
        ref={videoRef}
        key={mediaQuery.data}
        controls
        autoPlay={autoPlay}
        preload="metadata"
        playsInline
        className="aspect-video w-full bg-black object-contain"
        aria-label={`${label}: ${title}`}
      >
        <source src={mediaQuery.data} />
        متصفحك لا يدعم تشغيل الفيديو.
      </video>
      <div className="flex items-center gap-2 bg-card px-3 py-2 text-xs font-bold text-foreground">
        <CirclePlay className="h-4 w-4 text-primary" />
        <span>{label}</span>
      </div>
    </div>
  );
}
