import { type ReactNode, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Bell,
  Brain,
  ChevronLeft,
  Dumbbell,
  Droplets,
  Flame,
  Heart,
  Moon,
  RefreshCw,
  Salad,
  UtensilsCrossed,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useMembership } from "@/hooks/useMembership";
import { cn } from "@/lib/utils";

export const discoverCardClass =
  "rounded-[24px] border border-border/50 bg-card shadow-[0_8px_28px_-16px_rgba(15,23,42,0.18)]";

export function DiscoverMotionSection({
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
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function DiscoverHeader({
  title = "اكتشف",
  backTo,
}: {
  title?: string;
  backTo?: string;
}) {
  const { avatarUrl } = useMembership();

  return (
    <header className="flex h-11 items-center justify-between px-0.5">
      {backTo ? (
        <Link
          to={backTo}
          aria-label="رجوع"
          className="grid h-11 w-11 place-items-center text-foreground"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
      ) : (
        <button
          type="button"
          aria-label="الإشعارات"
          className="grid h-11 w-11 place-items-center text-foreground"
        >
          <Bell className="h-6 w-6" strokeWidth={1.8} />
        </button>
      )}
      <h1 className="text-base font-black tracking-tight text-foreground">{title}</h1>
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
    </header>
  );
}

export function DiscoverSectionHead({
  title,
  actionLabel,
  actionTo,
}: {
  title: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2 px-0.5">
      <h2 className="text-sm font-black text-foreground">{title}</h2>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="text-xs font-bold text-primary">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function DiscoverPremiumBadge() {
  return (
    <span className="rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[10px] font-black text-primary">
      Premium
    </span>
  );
}

export function DiscoverTypeBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
      {label}
    </span>
  );
}

export function DiscoverOfflineBanner() {
  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-900">
      أنت تعمل دون اتصال، وقد يكون المحتوى غير محدث.
    </div>
  );
}

export function DiscoverErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className={cn(discoverCardClass, "flex items-center justify-between gap-3 p-4")}>
      <p className="text-xs font-bold text-muted-foreground">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-black text-primary-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          إعادة
        </button>
      ) : null}
    </div>
  );
}

export function DiscoverEmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className={cn(discoverCardClass, "p-6 text-center")}>
      <p className="text-sm font-black text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 text-xs font-medium text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

const CATEGORY_ICONS: Record<string, typeof Dumbbell> = {
  dumbbell: Dumbbell,
  utensils: UtensilsCrossed,
  flame: Flame,
  biceps: Dumbbell,
  brain: Brain,
  moon: Moon,
  droplet: Droplets,
  heart: Heart,
  activity: Activity,
  salad: Salad,
};

export function DiscoverCategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = CATEGORY_ICONS[icon] ?? Heart;
  return <Icon className={className} strokeWidth={1.8} />;
}

export function DiscoverSearchBar({
  value,
  onChange,
  onFocus,
  onSubmit,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="sr-only">بحث في المحتوى</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit?.();
        }}
        autoFocus={autoFocus}
        placeholder="ماذا تريد أن تتعلم اليوم؟"
        className="h-12 w-full rounded-[20px] border border-border/70 bg-muted/40 px-4 text-sm font-bold text-foreground outline-none transition-shadow placeholder:font-medium placeholder:text-muted-foreground focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]"
        enterKeyHint="search"
        dir="rtl"
      />
    </label>
  );
}

export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function DiscoverFeedSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <Skeleton className="h-12 w-full rounded-[20px]" />
      <Skeleton className="h-[220px] w-full rounded-[24px]" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-20 shrink-0 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-24 w-full rounded-[24px]" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-44 shrink-0 rounded-[24px]" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-[24px]" />
        ))}
      </div>
    </div>
  );
}

export const DISCOVER_FILTER_LABELS: Record<string, string> = {
  all: "الكل",
  video: "الفيديوهات",
  article: "المقالات",
  recipe: "الوصفات",
  success_story: "قصص النجاح",
  challenge: "التحديات",
  daily_tip: "النصائح",
};
