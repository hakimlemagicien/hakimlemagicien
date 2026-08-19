import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Headphones, Languages, LogOut, Settings, Sun, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type MenuDrawerContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  close: () => void;
};

const MenuDrawerContext = createContext<MenuDrawerContextValue | null>(null);

export function useMenuDrawer() {
  return useContext(MenuDrawerContext);
}

export function MenuDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useLocation({ select: (location) => location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("is-menu-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("is-menu-open");
    };
  }, [open]);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle: () => setOpen((current) => !current),
      close: () => setOpen(false),
    }),
    [open],
  );

  return <MenuDrawerContext.Provider value={value}>{children}</MenuDrawerContext.Provider>;
}

function MenuGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("menu-glyph", className)} aria-hidden>
      <path d="M3.5 7h17" />
      <path d="M7.5 12h13" />
      <path d="M12.5 17h8" />
    </svg>
  );
}

type HeaderMenuProps = {
  className?: string;
  actionClassName?: string;
  iconClassName?: string;
};

export function HeaderMenu({
  className,
  actionClassName = "grid h-11 w-11 place-items-center text-foreground relative",
  iconClassName = "h-6 w-6",
}: HeaderMenuProps) {
  const drawer = useMenuDrawer();

  return (
    <div className={cn("relative shrink-0", className)}>
      <button
        type="button"
        aria-label="القائمة"
        aria-haspopup="dialog"
        aria-expanded={drawer?.open ?? false}
        className={cn(actionClassName, "relative")}
        onClick={(event) => {
          event.stopPropagation();
          drawer?.toggle();
        }}
      >
        <MenuGlyph className={iconClassName} />
      </button>
    </div>
  );
}

export function MenuDrawer() {
  const drawer = useMenuDrawer();
  if (!drawer) return null;

  async function signOut() {
    drawer.close();
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <div className="platform-menu-drawer" id="platform-menu-drawer" role="dialog" aria-label="القائمة" aria-hidden={!drawer.open}>
      <div className="platform-menu-drawer__top">
        <button
          type="button"
            aria-label="إغلاق القائمة"
          className="platform-menu-drawer__round"
          onClick={drawer.close}
        >
          <X className="h-5 w-5" strokeWidth={1.7} />
        </button>
      </div>

      <nav className="platform-menu-drawer__nav">
        <Link to="/app/profile" className="platform-menu-drawer__item" onClick={drawer.close}>
          <Settings strokeWidth={1.7} />
          الإعدادات
        </Link>
        <p className="platform-menu-drawer__item is-static">
          <Languages strokeWidth={1.7} />
          <span>
            اللغة
            <small>العربية</small>
          </span>
        </p>
        <p className="platform-menu-drawer__item is-static">
          <Sun strokeWidth={1.7} />
          <span>
            المظهر
            <small>فاتح</small>
          </span>
        </p>
        <Link to="/app/support" className="platform-menu-drawer__item" onClick={drawer.close}>
          <Headphones strokeWidth={1.7} />
          الدعم
        </Link>
      </nav>

      <button type="button" className="platform-menu-drawer__item is-logout" onClick={() => void signOut()}>
        <LogOut strokeWidth={1.7} />
        تسجيل الخروج
      </button>
    </div>
  );
}

export function MenuStage({ children }: { children: ReactNode }) {
  const drawer = useMenuDrawer();
  return (
    <div
      className="platform-shell__stage"
      onClick={() => {
        if (drawer?.open) drawer.close();
      }}
    >
      {children}
    </div>
  );
}
