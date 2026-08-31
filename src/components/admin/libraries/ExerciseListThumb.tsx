import { useState } from "react";
import { ImageOff } from "lucide-react";

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
  if (!src || broken) {
    return (
      <span className="cc-exercise-thumb cc-exercise-thumb--empty" role="img" aria-label={`لا توجد صورة لتمرين ${name}`}>
        <ImageOff size={18} aria-hidden />
        <span>لا توجد صورة</span>
      </span>
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
