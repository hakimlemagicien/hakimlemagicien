import { useState } from "react";
import { ImageOff } from "lucide-react";

export function ExerciseListThumb({
  name,
  src,
  videoSrc,
  loading,
}: {
  name: string;
  src?: string | null;
  videoSrc?: string | null;
  loading?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  if (loading) {
    return <span className="cc-exercise-thumb cc-exercise-thumb--loading" aria-hidden />;
  }
  if ((!src && !videoSrc) || broken) {
    return (
      <span className="cc-exercise-thumb cc-exercise-thumb--empty" role="img" aria-label={`لا توجد صورة لتمرين ${name}`}>
        <ImageOff size={18} aria-hidden />
        <span>لا توجد صورة</span>
      </span>
    );
  }
  if (!src && videoSrc) {
    return (
      <video
        className="cc-exercise-thumb"
        src={videoSrc}
        aria-label={`صورة فيديو تمرين ${name}`}
        muted
        playsInline
        preload="metadata"
        onLoadedMetadata={(event) => {
          try { event.currentTarget.currentTime = Math.min(0.1, event.currentTarget.duration || 0.1); } catch { /* first frame remains */ }
        }}
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <img
      className="cc-exercise-thumb"
      src={src}
      alt={`صورة تمرين ${name}`}
      width={64}
      height={64}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}
