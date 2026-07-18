import { type ReactNode, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertCircle, Bell, Check, Lock, Minus, RefreshCw, WifiOff, X } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembership } from "@/hooks/useMembership";
import type { MealStatus } from "@/lib/platform/nutrition-experience";
import { cn } from "@/lib/utils";

export const nutritionCardClass =
  "rounded-[24px] border border-border/50 bg-card shadow-[0_8px_28px_-16px_rgba(15,23,42,0.18)]";

export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

export function NutritionOfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800"
    >
      <WifiOff className="h-3.5 w-3.5" />
      أنت تعمل بدون اتصال.
    </div>
  );
}

export function NutritionErrorCard({
  message = "تعذّر تحميل هذا القسم.",
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className={cn(nutritionCardClass, "flex items-center gap-3 p-4")}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1 text-right">
        <p className="text-sm font-black text-foreground">{message}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">حاول مرة أخرى دون مغادرة الصفحة.</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-11 min-w-11 items-center gap-1 rounded-xl bg-primary px-3 text-xs font-black text-primary-foreground"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        إعادة المحاولة
      </button>
    </div>
  );
}

export function NutritionEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className={cn(nutritionCardClass, "px-4 py-8 text-center")}>
      <p className="text-sm font-black text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export function NutritionLockedOverlay({
  active,
  onUnlockClick,
  message = "محتوى مقفل — فعّل برنامجك",
  intensity = "medium",
}: {
  active: boolean;
  onUnlockClick: () => void;
  message?: string;
  intensity?: "light" | "medium" | "strong";
}) {
  if (!active) return null;

  return (
    <button
      type="button"
      onClick={onUnlockClick}
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[inherit] transition active:scale-[0.995]",
        intensity === "strong" && "bg-white/62 backdrop-blur-[2px]",
        intensity === "medium" && "bg-white/48 backdrop-blur-[1px]",
        intensity === "light" && "bg-white/28",
      )}
      aria-label={message}
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/12 shadow-[0_8px_20px_-10px_rgba(249,115,22,0.45)] ring-1 ring-primary/30">
        <Lock className="h-4 w-4 text-primary" strokeWidth={2.3} />
      </span>
      <span className="rounded-full border border-border/60 bg-card/95 px-3 py-1 text-[9px] font-black text-foreground shadow-sm">
        {message}
      </span>
    </button>
  );
}

export const NUTRITION_LOCKED_REASON =
  "فعّل برنامجك الآن لفتح كل وجبات الأسبوع — وجبة الفطور ليوم اليوم متاحة للمعاينة.";

export const NUTRITION_DAY_LOCKED_REASON =
  "فعّل برنامجك الآن لفتح وجبات كل أيام الأسبوع — يمكنك معاينة شكل الخطة فقط.";

export function MealStatusIcon({ status }: { status: MealStatus }) {
  if (status === "completed") {
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#22C55E] text-white shadow-[0_4px_12px_-4px_rgba(34,197,94,0.55)]">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (status === "current") {
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#22C55E] bg-white text-primary">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full border border-border bg-muted text-destructive">
        <X className="h-3.5 w-3.5" strokeWidth={2.6} />
      </span>
    );
  }
  return (
    <span className="grid h-7 w-7 place-items-center rounded-full border border-border/80 bg-muted text-muted-foreground">
      <Minus className="h-3.5 w-3.5" strokeWidth={2.4} />
    </span>
  );
}

export function CountUpNumber({
  value,
  className,
  duration = 700,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const from = display;
    const delta = value - from;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(from + delta * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate only when target changes
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}

export function NutritionHeader({ title = "التغذية" }: { title?: string }) {
  const { avatarUrl } = useMembership();

  return (
    <header className="flex h-11 items-center justify-between px-0.5">
      <Link
        to="/app/profile"
        data-preview-safe
        aria-label="الملف الشخصي"
        className="grid h-11 w-11 place-items-center"
      >
        <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-border/70 bg-muted">
          {avatarUrl ? (
            <OptimizedImage src={avatarUrl} alt="" width={40} height={40} className="h-full w-full" />
          ) : (
            <span className="text-xs font-black text-muted-foreground">أنت</span>
          )}
        </span>
      </Link>
      <h1 className="text-base font-black tracking-tight text-foreground">{title}</h1>
      <button
        type="button"
        aria-label="الإشعارات"
        className="grid h-11 w-11 place-items-center text-foreground"
      >
        <Bell className="h-6 w-6" strokeWidth={1.8} />
      </button>
    </header>
  );
}

export function NutritionDashboardSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-[180px] w-full rounded-[24px]" />
      <Skeleton className="h-16 w-full rounded-[24px]" />
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[78px] w-full rounded-[24px]" />
        ))}
      </div>
      <Skeleton className="h-20 w-full rounded-[24px]" />
      <Skeleton className="h-16 w-full rounded-[24px]" />
    </div>
  );
}

export function MacroPill({
  label,
  value,
  unit = "غ",
  tone,
}: {
  label: string;
  value: number;
  unit?: string;
  tone: "protein" | "carbs" | "fat" | "calories";
}) {
  const toneClass =
    tone === "protein"
      ? "bg-[#E8F5E9] text-[#2E7D32]"
      : tone === "carbs"
        ? "bg-[#E3F2FD] text-[#1565C0]"
        : tone === "fat"
          ? "bg-[#FFF8E1] text-[#F9A825]"
          : "bg-primary-soft text-primary";

  return (
    <div className={cn("rounded-2xl px-2.5 py-2 text-center", toneClass)}>
      <p className="text-sm font-black leading-none">
        <CountUpNumber value={value} />
        {unit !== "سعرة" ? <span className="text-[10px]"> {unit}</span> : null}
      </p>
      <p className="mt-1 text-[9px] font-bold opacity-80">{label}</p>
    </div>
  );
}

export function NutritionMotionSection({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
