import { cn } from "@/lib/utils";
import type { SessionAnatomyArtKey } from "@/lib/platform/session-muscle-presentation";

/** Same body in every illustration (front + back); only the session's target muscles are red. */
const MALE_ART = import.meta.glob<string>("../../../assets/session-anatomy/*.webp", {
  eager: true,
  import: "default",
});
const FEMALE_ART = import.meta.glob<string>("../../../assets/session-anatomy/female/*.webp", {
  eager: true,
  import: "default",
});

function artSrc(artKey: SessionAnatomyArtKey, gender: "male" | "female" | null | undefined) {
  const female = FEMALE_ART[`../../../assets/session-anatomy/female/${artKey}.webp`];
  const male = MALE_ART[`../../../assets/session-anatomy/${artKey}.webp`];
  return gender === "female" ? (female ?? male) : (male ?? female);
}

export function SessionAnatomyVisual({
  artKey,
  gender,
  isRestDay,
  className,
}: {
  artKey: SessionAnatomyArtKey;
  /** Client gender — female clients see the female figure. */
  gender?: "male" | "female" | null;
  isRestDay?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <img
        src={artSrc(isRestDay ? "rest" : artKey, gender)}
        alt={isRestDay ? "يوم راحة" : "العضلات المستهدفة في الحصة"}
        width={640}
        height={565}
        decoding="async"
        className={cn(
          "absolute inset-0 h-full w-full object-contain object-center mix-blend-multiply",
          isRestDay && "opacity-60",
        )}
      />
    </div>
  );
}
