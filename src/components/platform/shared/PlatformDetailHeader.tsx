import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

type PlatformDetailHeaderProps = {
  title: string;
  subtitle?: string;
  backTo: string;
  action?: ReactNode;
};

export function PlatformDetailHeader({
  title,
  subtitle,
  backTo,
  action,
}: PlatformDetailHeaderProps) {
  return (
    <header className="flex items-center gap-3">
      <Link
        to={backTo}
        aria-label="رجوع"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-foreground transition active:scale-95"
      >
        <ChevronRight className="h-5 w-5" />
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-black text-foreground">{title}</h1>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
