import { type ReactNode, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Bell, RefreshCw, Share2, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const progressCardClass =
  "rounded-[24px] border border-border/50 bg-card shadow-[0_8px_28px_-16px_rgba(15,23,42,0.18)]";

export function ProgressMotionSection({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function ProgressHeader() {
  return (
    <header className="flex h-11 items-center justify-between gap-2 px-0.5">
      <button
        type="button"
        aria-label="مشاركة"
        className="grid h-10 w-10 place-items-center rounded-2xl text-muted-foreground"
      >
        <Share2 className="h-5 w-5" />
      </button>
      <div className="flex min-w-0 items-center gap-1.5">
        <Trophy className="h-4 w-4 text-primary" aria-hidden />
        <h1 className="truncate text-sm font-black text-foreground">التقدم</h1>
      </div>
      <button
        type="button"
        aria-label="الإشعارات"
        className="relative grid h-10 w-10 place-items-center rounded-2xl text-foreground"
      >
        <Bell className="h-5 w-5" />
      </button>
    </header>
  );
}

export function CountUpValue({
  value,
  suffix = "",
}: {
  value: number | string;
  suffix?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(typeof value === "number" ? 0 : value);

  useEffect(() => {
    if (typeof value !== "number" || reduceMotion) {
      setDisplay(value);
      return;
    }
    const target = value;
    const start = performance.now();
    const duration = 600;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(target * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduceMotion]);

  return (
    <>
      {display}
      {suffix}
    </>
  );
}

export function ProgressRing({
  pct,
  size = 88,
  stroke = 8,
  done = false,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  done?: boolean;
  children?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(pct, 0), 100);
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={done ? "#22C55E" : "#FFFFFF"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" }}
        />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}

export function ProgressSectionSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className={cn(progressCardClass, "space-y-3 p-4")}>
      <Skeleton className="h-4 w-28 rounded-lg" />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function ProgressErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className={cn(progressCardClass, "flex items-center gap-3 p-4")}>
      <div className="min-w-0 flex-1 text-right">
        <p className="text-sm font-black text-foreground">{message}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">حاول مرة أخرى دون مغادرة الصفحة.</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-11 items-center gap-1 rounded-xl bg-primary px-3 text-xs font-black text-primary-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          إعادة المحاولة
        </button>
      ) : null}
    </div>
  );
}

export function ProgressDashboardSkeleton() {
  return (
    <div className="space-y-3.5">
      <Skeleton className="h-[180px] w-full rounded-[24px]" />
      <ProgressSectionSkeleton />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[24px]" />
        ))}
      </div>
      <ProgressSectionSkeleton lines={2} />
    </div>
  );
}
