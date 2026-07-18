import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const profileCardClass =
  "rounded-[24px] border border-border/50 bg-card shadow-[0_8px_28px_-16px_rgba(15,23,42,0.18)]";

export function ProfileMotionSection({
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

export function ProfilePageHeader() {
  return (
    <header className="px-0.5">
      <h1 className="text-base font-black tracking-tight text-foreground">الملف الشخصي</h1>
    </header>
  );
}

export function ProfileSectionCard({
  title,
  eyebrow,
  action,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(profileCardClass, "p-4", className)}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          {eyebrow ? (
            <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-sm font-black text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function ProfileRowButton({
  icon,
  title,
  description,
  onClick,
  danger,
  href,
  to,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
  danger?: boolean;
  href?: string;
  to?: string;
}) {
  const className = cn(
    "platform-touch flex w-full items-center gap-3 rounded-2xl px-1 py-3 text-right transition-transform active:scale-[0.985]",
    danger ? "text-destructive" : "text-foreground",
  );
  const inner = (
    <>
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-2xl",
          danger ? "bg-red-50 text-destructive" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

export function ProfileErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className={cn(profileCardClass, "flex items-center justify-between gap-3 p-4")}>
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

export function ProfileFieldGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-2.5">{children}</dl>;
}

export function ProfileField({
  label,
  value,
  missing,
}: {
  label: string;
  value: string;
  missing?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/35 px-3 py-2.5">
      <dt className="text-[11px] font-bold text-muted-foreground">{label}</dt>
      <dd className={cn("text-xs font-black", missing ? "text-primary" : "text-foreground")}>
        {value}
      </dd>
    </div>
  );
}

export function ProfileHeroSkeleton() {
  return (
    <div className={cn(profileCardClass, "overflow-hidden p-5")} aria-hidden>
      <Skeleton className="mx-auto h-24 w-24 rounded-full" />
      <Skeleton className="mx-auto mt-4 h-5 w-32" />
      <Skeleton className="mx-auto mt-2 h-4 w-40" />
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className={cn(profileCardClass, "space-y-3 p-4")} aria-hidden>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
    </div>
  );
}

export function ProfileOfflineBanner() {
  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-900">
      أنت دون اتصال — قد لا تكون بعض المعلومات محدثة.
    </div>
  );
}

export function ProfileToast({ message, tone }: { message: string; tone: "success" | "error" }) {
  return (
    <p
      className={cn(
        "rounded-2xl px-3 py-2 text-xs font-bold",
        tone === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700",
      )}
      role="status"
    >
      {message}
    </p>
  );
}
