import { useState } from "react";
import { EXERCISE_LIST_THUMB_FALLBACK_SRC } from "@/lib/platform/exercise-list-thumb";

function isVideoSrc(src: string): boolean {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(src) || src.includes("/video/");
}

export function ExerciseListThumb({
  name,
  src,
  loading,
}: {
  name: string;
  src?: string | null;
  loading?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  if (loading) {
    return <span className="cc-exercise-thumb cc-exercise-thumb--loading" aria-hidden />;
  }

  const resolved = !src || broken ? EXERCISE_LIST_THUMB_FALLBACK_SRC : src;

  if (isVideoSrc(resolved)) {
    return (
      <video
        className="cc-exercise-thumb"
        src={resolved}
        muted
        playsInline
        preload="metadata"
        aria-label={`فيديو تمرين ${name}`}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <img
      className="cc-exercise-thumb"
      src={resolved}
      alt={`صورة تمرين ${name}`}
      width={64}
      height={64}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}
