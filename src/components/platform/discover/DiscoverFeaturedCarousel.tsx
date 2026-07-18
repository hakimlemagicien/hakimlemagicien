import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  type DiscoverContentItem,
  getDiscoverTypeLabel,
} from "@/lib/platform/discover-content";
import { DiscoverTypeBadge, discoverCardClass } from "./DiscoverShared";
import { cn } from "@/lib/utils";

const AUTO_MS = 6000;

export function DiscoverFeaturedCarousel({ items }: { items: DiscoverContentItem[] }) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);

  const count = items.length;
  const current = items[index];

  const go = useCallback(
    (next: number) => {
      if (!count) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (!count || paused || reduceMotion) return;
    const timer = window.setInterval(() => go(index + 1), AUTO_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, reduceMotion, index, go]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (!entry.isIntersecting) setPaused(true);
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!current) return null;

  return (
    <div
      ref={containerRef}
      className="space-y-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        if (visibleRef.current) setPaused(false);
      }}
      onTouchStart={() => setPaused(true)}
    >
      <Link
        to="/app/discover/$slug"
        params={{ slug: current.slug }}
        className={cn(
          discoverCardClass,
          "platform-touch relative block overflow-hidden transition-transform active:scale-[0.985]",
        )}
        aria-roledescription="carousel"
        aria-label={`${index + 1} من ${count}: ${current.title}`}
      >
        <div className="relative h-[220px] w-full">
          <OptimizedImage
            src={current.coverImage}
            alt=""
            width={390}
            height={220}
            priority={index === 0}
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 text-white">
            <div className="flex flex-wrap items-center gap-2">
              {current.badge ? (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black">
                  {current.badge}
                </span>
              ) : null}
              <DiscoverTypeBadge label={getDiscoverTypeLabel(current.type)} />
            </div>
            <h3 className="text-lg font-black leading-snug">{current.title}</h3>
            <p className="line-clamp-2 text-xs font-medium text-white/85">{current.shortDescription}</p>
            <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-foreground">
              استكشف الآن
            </span>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="شرائح المحتوى المميز">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`الانتقال إلى ${item.title}`}
              onClick={() => {
                setPaused(true);
                setIndex(i);
              }}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index ? "w-5 bg-primary" : "w-2 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
        {count > 1 ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="السابق"
              onClick={() => {
                setPaused(true);
                go(index - 1);
              }}
              className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="التالي"
              onClick={() => {
                setPaused(true);
                go(index + 1);
              }}
              className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
