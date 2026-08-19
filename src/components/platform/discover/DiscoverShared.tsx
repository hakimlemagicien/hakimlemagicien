import { type ReactNode, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Brain,
  ChevronLeft,
  Dumbbell,
  Droplets,
  Flame,
  Heart,
  Moon,
  RefreshCw,
  Salad,
  Search,
  UtensilsCrossed,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { HeaderMenu } from "@/components/platform/shared/HeaderMenu";
import { PlatformHeaderActions } from "@/components/platform/shared/PlatformHeaderActions";
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
      <div className="flex items-center gap-0.5">
        {backTo ? (
          <Link
            to={backTo}
            aria-label="رجوع"
            className="grid h-11 w-11 place-items-center text-foreground"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
        ) : (
          <HeaderMenu />
        )}
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
      </div>
      <h1 className="text-base font-black tracking-tight text-foreground">{title}</h1>
      <PlatformHeaderActions />
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
    <div className="discover-section-head">
      <h2>{title}</h2>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="discover-section-head__action">
          {actionLabel}
          <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
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
    <div className="rounded-2xl border border-primary/20 bg-primary-soft px-3 py-2 text-[11px] font-bold text-foreground">
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
  placeholder = "ابحث عن تمرين، وصفة أو نصيحة",
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="discover-search">
      <Search className="discover-search__icon" strokeWidth={2} />
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
        placeholder={placeholder}
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
    <div className="discover-home" aria-hidden>
      <Skeleton className="h-12 w-full rounded-2xl" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-16 shrink-0 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-[196px] w-full rounded-[22px]" />
      <Skeleton className="h-5 w-28" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-52 w-36 shrink-0 rounded-[18px]" />
        ))}
      </div>
      <Skeleton className="h-[92px] w-full rounded-[22px]" />
      <Skeleton className="h-[88px] w-full rounded-[22px]" />
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
