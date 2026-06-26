import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Calendar, Globe, Users } from "lucide-react";

type StatCard = {
  icon: LucideIcon;
  value: number;
  suffix?: string;
  label: string;
};

const STATS: StatCard[] = [
  { icon: Users, value: 1500, label: "مشترك جديد هذا الشهر" },
  { icon: Calendar, value: 10, label: "سنوات خبرة في التدريب" },
  { icon: Globe, value: 5, suffix: "M", label: "متابع عبر منصات التواصل" },
];

const STAGGER_DELAYS = [0.15, 0.3, 0.45];

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function useInViewOnce<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, threshold]);
  return { ref, inView };
}

function useCountUp(
  target: number,
  active: boolean,
  duration = 2000,
  delayMs = 0,
) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const timeoutId = window.setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        setValue(Math.round(easeOutCubic(t) * target));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delayMs);
    return () => {
      window.clearTimeout(timeoutId);
      cancelAnimationFrame(raf);
    };
  }, [active, target, duration, delayMs]);
  return value;
}

function AnimatedStatValue({
  value,
  suffix,
  active,
  compact,
  delayMs,
}: {
  value: number;
  suffix?: string;
  active: boolean;
  compact?: boolean;
  delayMs: number;
}) {
  const count = useCountUp(value, active, 2000, delayMs);
  const formatted =
    suffix === "M"
      ? `+${count}M`
      : `+${count.toLocaleString("en-US")}`;

  return (
    <p
      className={[
        "font-[Cairo] font-extrabold leading-none tabular-nums text-[#FF6B00]",
        compact ? "text-[26px]" : "text-[44px]",
      ].join(" ")}
      aria-label={formatted}
    >
      {formatted}
    </p>
  );
}

function TrustStatCard({
  stat,
  index,
  active,
  compact,
}: {
  stat: StatCard;
  index: number;
  active: boolean;
  compact?: boolean;
}) {
  const Icon = stat.icon;
  const delay = STAGGER_DELAYS[index] ?? 0;
  const delayMs = Math.round(delay * 1000);

  return (
    <article
      className={[
        "group",
        compact ? "w-full min-h-[140px] py-3" : "h-[170px] w-[170px] shrink-0 snap-center",
        "flex flex-col items-center justify-center gap-1.5",
        "rounded-[24px] border border-black/[0.04] bg-white",
        "shadow-[0_8px_32px_-10px_rgba(0,0,0,0.08)]",
        "transition-[transform,box-shadow] duration-300 ease-out",
        "active:scale-[0.98] lg:active:scale-100",
        "lg:hover:-translate-y-[6px] lg:hover:shadow-[0_20px_48px_-14px_rgba(0,0,0,0.14)]",
        active ? "animate-trust-stat-enter" : "pointer-events-none opacity-0",
      ].join(" ")}
      style={{ animationDelay: `${delay}s` }}
    >
      <div
        className={[
          "flex shrink-0 items-center justify-center rounded-full bg-[rgba(255,107,0,0.08)]",
          compact ? "h-10 w-10" : "h-[52px] w-[52px]",
        ].join(" ")}
      >
        <Icon
          className={
            compact ? "h-5 w-5 text-[#FF6B00]" : "h-[26px] w-[26px] text-[#FF6B00]"
          }
          strokeWidth={1.75}
        />
      </div>

      <AnimatedStatValue
        value={stat.value}
        suffix={stat.suffix}
        active={active}
        compact={compact}
        delayMs={delayMs}
      />

      <span className="h-[2px] w-9 shrink-0 rounded-full bg-[#FF6B00]" aria-hidden />

      <p
        className={[
          "px-2 text-center font-[Tajawal] font-medium leading-snug text-[#444444]",
          compact ? "text-[11px]" : "text-[17px]",
        ].join(" ")}
      >
        {stat.label}
      </p>
    </article>
  );
}

export function TrustStatistics({
  embedded = false,
  className = "",
}: {
  embedded?: boolean;
  className?: string;
}) {
  const { ref, inView } = useInViewOnce<HTMLElement>(0.15);

  return (
    <section
      ref={ref}
      className={[
        "w-full",
        embedded ? "bg-transparent" : "bg-[#FAF8F5]",
        className,
      ].join(" ")}
      aria-label="إحصائيات الثقة"
    >
      <div
        className={[
          embedded
            ? "grid grid-cols-3 gap-3"
            : [
                "flex gap-4 overflow-x-auto px-5 py-5",
                "snap-x snap-mandatory",
                "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                "lg:justify-center lg:overflow-visible lg:snap-none",
              ].join(" "),
        ].join(" ")}
      >
        {STATS.map((stat, index) => (
          <TrustStatCard
            key={stat.label}
            stat={stat}
            index={index}
            active={inView}
            compact={embedded}
          />
        ))}
      </div>
    </section>
  );
}
