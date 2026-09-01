import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SessionAnatomyVisualKey } from "@/lib/platform/session-muscle-presentation";
import muscleAnatomyChestBicepsImg from "@/assets/muscle-anatomy-chest-biceps.png";

const HIGHLIGHT_BY_KEY: Record<Exclude<SessionAnatomyVisualKey, "REST">, string[]> = {
  PUSH: ["chest", "triceps"],
  PULL: ["back", "biceps"],
  LEGS: ["quads", "hamstrings", "glutes"],
  UPPER: ["chest", "back", "shoulders"],
  FULL_BODY: ["chest", "back", "quads", "shoulders"],
  ARMS: ["biceps", "triceps"],
  SHOULDERS: ["shoulders"],
  CORE: ["core"],
};

export function SessionAnatomyVisual({
  visualKey,
  imageSrc,
  isRestDay,
  className,
}: {
  visualKey: SessionAnatomyVisualKey;
  imageSrc?: string | null;
  isRestDay?: boolean;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const highlights = visualKey === "REST" ? [] : HIGHLIGHT_BY_KEY[visualKey];
  const src = !broken && imageSrc ? imageSrc : muscleAnatomyChestBicepsImg;

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <img
        src={src}
        alt={isRestDay ? "يوم راحة" : "تشريح عضلي للمجموعة المستهدفة"}
        className={cn(
          "absolute inset-0 h-full w-full origin-center object-contain object-center transition-opacity",
          isRestDay && "opacity-70",
          broken && visualKey === "LEGS" && "hue-rotate-[250deg] saturate-125",
          broken && visualKey === "PULL" && "hue-rotate-[200deg] saturate-110",
          broken && visualKey === "SHOULDERS" && "hue-rotate-[60deg]",
          broken && visualKey === "ARMS" && "hue-rotate-[120deg]",
          broken && visualKey === "CORE" && "hue-rotate-[300deg]",
        )}
        onError={() => setBroken(true)}
      />
      {!broken && highlights.length > 0 ? (
        <svg
          viewBox="0 0 100 100"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        >
          {highlights.includes("chest") ? (
            <ellipse cx="50" cy="34" rx="16" ry="10" className="fill-primary/25" />
          ) : null}
          {highlights.includes("back") ? (
            <ellipse cx="50" cy="36" rx="14" ry="12" className="fill-sky-500/20" />
          ) : null}
          {highlights.includes("shoulders") ? (
            <>
              <circle cx="34" cy="32" r="6" className="fill-primary/20" />
              <circle cx="66" cy="32" r="6" className="fill-primary/20" />
            </>
          ) : null}
          {highlights.includes("biceps") ? (
            <>
              <ellipse cx="30" cy="44" rx="5" ry="9" className="fill-emerald-500/25" />
              <ellipse cx="70" cy="44" rx="5" ry="9" className="fill-emerald-500/25" />
            </>
          ) : null}
          {highlights.includes("triceps") ? (
            <>
              <ellipse cx="28" cy="46" rx="4" ry="8" className="fill-amber-500/20" />
              <ellipse cx="72" cy="46" rx="4" ry="8" className="fill-amber-500/20" />
            </>
          ) : null}
          {highlights.includes("quads") ? (
            <>
              <ellipse cx="42" cy="68" rx="7" ry="14" className="fill-primary/25" />
              <ellipse cx="58" cy="68" rx="7" ry="14" className="fill-primary/25" />
            </>
          ) : null}
          {highlights.includes("hamstrings") ? (
            <>
              <ellipse cx="42" cy="74" rx="6" ry="10" className="fill-sky-500/18" />
              <ellipse cx="58" cy="74" rx="6" ry="10" className="fill-sky-500/18" />
            </>
          ) : null}
          {highlights.includes("glutes") ? (
            <ellipse cx="50" cy="58" rx="12" ry="8" className="fill-primary/20" />
          ) : null}
          {highlights.includes("core") ? (
            <ellipse cx="50" cy="50" rx="10" ry="8" className="fill-violet-500/20" />
          ) : null}
        </svg>
      ) : null}
    </div>
  );
}
