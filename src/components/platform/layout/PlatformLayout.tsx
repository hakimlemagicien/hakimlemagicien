import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PlatformFrameProps = {
  children: ReactNode;
  className?: string;
};

/** عرض مرجعي 390px — يتمدد 100% على الشاشات الأصغر ويتكيّف على الأكبر */
export function PlatformFrame({ children, className }: PlatformFrameProps) {
  return <div className={cn("platform-frame", className)}>{children}</div>;
}

type PlatformStackProps = {
  children: ReactNode;
  className?: string;
};

/** عمود Auto Layout بعرض 100% وتباعد 8pt grid */
export function PlatformStack({ children, className }: PlatformStackProps) {
  return <div className={cn("platform-stack", className)}>{children}</div>;
}

type PlatformSectionProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  action?: ReactNode;
  variant?: "plain" | "card";
};

export function PlatformSection({
  children,
  className,
  title,
  icon: Icon,
  iconClassName,
  action,
  variant = "plain",
}: PlatformSectionProps) {
  return (
    <section className={cn("platform-section", variant === "card" && "is-card", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {Icon ? (
              <Icon className={cn("h-5 w-5 shrink-0", iconClassName ?? "text-primary")} aria-hidden />
            ) : null}
            <h2 className="text-sm font-black text-foreground">{title}</h2>
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

type PlatformPageHeaderProps = {
  title: string;
  subtitle?: string;
};

export function PlatformPageHeader({ title, subtitle }: PlatformPageHeaderProps) {
  return (
    <header className="platform-section">
      <h1 className="text-xl font-black text-foreground">{title}</h1>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}

type PlatformScrollRowProps = {
  children: ReactNode;
  className?: string;
};

export function PlatformScrollRow({ children, className }: PlatformScrollRowProps) {
  return <div className={cn("platform-scroll-x", className)}>{children}</div>;
}
