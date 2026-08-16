import { useEffect, useRef, useState, type ReactNode } from "react";
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
  /** Shown when the image fails to load. Parent layout stays intact. */
  fallback?: ReactNode;
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
  fallback,
}: OptimizedImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
      setFailed(false);
      return;
    }
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
      {!loaded && !failed && !priority ? (
        <span
          aria-hidden
          className="absolute inset-0 animate-pulse bg-gradient-to-r from-neutral-200/80 via-neutral-100/90 to-neutral-200/80 bg-[length:200%_100%]"
        />
      ) : null}
      <img
        ref={imgRef}
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
      {failed && fallback ? (
        <span className="absolute inset-0">{fallback}</span>
      ) : null}
    </span>
  );
}
