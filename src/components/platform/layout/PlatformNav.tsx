import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  Home,
  LineChart,
  LogOut,
  MessageCircleQuestion,
  Salad,
  User,
} from "lucide-react";
import { DailyHubOverlay } from "@/components/platform/shared/DailyHubOverlay";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
  { to: "/app/program", label: "برنامجي", icon: CalendarDays, hub: true },
  { to: "/app/discover", label: "اكتشف", icon: BookOpen },
  { to: "/app", label: "الرئيسية", icon: Home, exact: true, center: true },
  { to: "/app/support", label: "الدعم", icon: MessageCircleQuestion },
  { to: "/app/profile", label: "الملف الشخصي", icon: User },
] as const;

const DESKTOP_NAV_ITEMS = [
  { to: "/app", label: "الرئيسية", icon: Home, exact: true },
  { to: "/app/program", label: "برنامجي", icon: CalendarDays },
  { to: "/app/discover", label: "اكتشف", icon: BookOpen },
  { to: "/app/nutrition", label: "التغذية", icon: Salad },
  { to: "/app/progress", label: "التقدم", icon: LineChart },
  { to: "/app/support", label: "الدعم", icon: MessageCircleQuestion },
  { to: "/app/profile", label: "الملف الشخصي", icon: User },
] as const;

function NavItem({
  to,
  label,
  icon: Icon,
  exact,
  mobile,
  center,
  onNavigate,
  onSelect,
  activeOverride,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
  mobile?: boolean;
  center?: boolean;
  onNavigate?: () => void;
  onSelect?: () => void;
  activeOverride?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = activeOverride ?? (exact ? pathname === to : pathname.startsWith(to));

  if (mobile && center) {
    return (
      <Link
        to={to}
        onClick={onNavigate}
        className="platform-nav__link"
        aria-label={label}
        aria-current={active ? "page" : undefined}
      >
        <span
          className={cn(
            "platform-nav__fab",
            !active && "bg-card text-muted-foreground shadow-none ring-1 ring-border",
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={2.25} />
        </span>
        <span className={cn("platform-nav__label", active ? "text-primary" : "text-muted-foreground")}>
          {label}
        </span>
      </Link>
    );
  }

  if (mobile) {
    const content = (
      <>
        <Icon
          className={cn("h-6 w-6 shrink-0", active ? "text-primary" : "text-muted-foreground")}
          strokeWidth={1.75}
        />
        <span className={cn("platform-nav__label", active ? "text-primary" : "text-muted-foreground")}>
          {label}
        </span>
      </>
    );

    if (onSelect) {
      return (
        <button
          type="button"
          onClick={onSelect}
          className="platform-nav__link"
          aria-haspopup="dialog"
          aria-expanded={active}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        to={to}
        onClick={onNavigate}
        className="platform-nav__link"
        aria-current={active ? "page" : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-muted",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function PlatformSidebar() {
  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-l md:border-border md:bg-sidebar md:px-4 md:py-6">
      <div className="mb-8 px-2">
        <p className="text-xs font-bold tracking-[0.2em] text-primary">HAKIM</p>
        <p className="text-lg font-black text-foreground">Platform</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {DESKTOP_NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-4 inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        تسجيل الخروج
      </button>
    </aside>
  );
}

export function PlatformMobileNav() {
  const [hubOpen, setHubOpen] = useState(false);

  return (
    <>
      <nav className="platform-nav md:hidden" aria-label="التنقل الرئيسي">
        <div className="platform-nav__inner">
          {MOBILE_NAV_ITEMS.map((item) =>
            "hub" in item && item.hub ? (
              <NavItem
                key={item.to}
                {...item}
                mobile
                onSelect={() => setHubOpen(true)}
                activeOverride={hubOpen}
              />
            ) : (
              <NavItem
                key={item.to}
                {...item}
                mobile
                center={"center" in item ? item.center : false}
              />
            ),
          )}
        </div>
      </nav>
      <DailyHubOverlay open={hubOpen} onClose={() => setHubOpen(false)} />
    </>
  );
}

export function PlatformTopBar() {
  return null;
}
