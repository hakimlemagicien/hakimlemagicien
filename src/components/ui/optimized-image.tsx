import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type OptimizedImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  /** LCP / above-the-fold images — disables lazy loading and sets fetchPriority high */
  priority?: boolean;
  sizes?: string;
  objectFit?: "cover" | "contain" | "fill" | "none";
};

/**
 * Standard image component for Hakim Platform.
 * Enforces lazy loading, async decoding, shimmer placeholder, and stable dimensions (CLS).
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes,
  objectFit = "cover",
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  const objectFitClass =
    objectFit === "contain"
      ? "object-contain"
      : objectFit === "fill"
        ? "object-fill"
        : objectFit === "none"
          ? "object-none"
          : "object-cover";

  return (
    <span className={cn("relative block h-full w-full overflow-hidden", className)}>
      {!loaded && !failed ? (
        <span
          aria-hidden
          className="absolute inset-0 animate-pulse bg-gradient-to-r from-neutral-200/80 via-neutral-100/90 to-neutral-200/80 bg-[length:200%_100%]"
        />
      ) : null}
      <img
        key={src}
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => {
          setLoaded(true);
          setFailed(false);
        }}
        onError={() => {
          setLoaded(false);
          setFailed(true);
        }}
        className={cn(
          "h-full w-full transition-opacity duration-300",
          objectFitClass,
          loaded && !failed ? "opacity-100" : "opacity-0",
        )}
      />
    </span>
  );
}
