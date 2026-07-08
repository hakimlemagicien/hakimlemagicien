import { Menu } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { LEGAL_ROUTES } from "@/lib/site-legal";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const navItems = [
  { label: "الرئيسية", hash: undefined },
  { label: "كيف يعمل التقييم", hash: "how" },
  { label: "ماذا ستحصل عليه", hash: "features" },
  { label: "قصص النجاح", hash: "stories" },
  { label: "تحديد السعر", hash: "pricing" },
  { label: "أسئلة شائعة", hash: "faq" },
] as const;

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0">
      <span className="grid h-11 w-11 max-lg:h-10 max-lg:w-10 place-items-center rounded-xl max-lg:rounded-full bg-primary text-primary-foreground font-black text-2xl max-lg:text-xl">
        H
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-lg max-lg:text-base font-black tracking-tight text-foreground">HAKIM</span>
        <span className="text-[10px] font-bold tracking-[0.25em] text-primary">COACHING</span>
      </span>
    </Link>
  );
}

function NavLink({
  label,
  hash,
  onNavigate,
  className,
}: {
  label: string;
  hash?: string;
  onNavigate?: () => void;
  className: string;
}) {
  return (
    <Link
      to="/"
      hash={hash}
      onClick={onNavigate}
      className={className}
    >
      {label}
    </Link>
  );
}

function isNavItemActive(pathname: string, currentHash: string, itemHash?: string) {
  if (pathname !== "/") return false;
  if (!itemHash) return !currentHash;
  return currentHash === itemHash;
}

function AuthNavLink({ className, onNavigate }: { className: string; onNavigate?: () => void }) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loggedIn) {
    return (
      <Link to="/app" onClick={onNavigate} className={className}>
        حسابي
      </Link>
    );
  }

  return (
    <Link to="/auth" onClick={onNavigate} className={className}>
      تسجيل الدخول
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const whatsapp = "https://wa.me/971505129019";
  const pathname = useLocation({ select: (l) => l.pathname });
  const currentHash = useLocation({ select: (l) => l.hash.replace(/^#/, "") });
  const closeMenu = () => setOpen(false);

  const authLinkClass =
    "inline-flex items-center justify-center rounded-full border-2 border-border px-4 py-2 text-sm font-bold text-foreground transition-all hover:border-primary hover:text-primary";

  return (
    <header className="sticky top-0 z-50 w-full bg-white lg:bg-background/90 border-b border-border/40 lg:border-border/60 lg:backdrop-blur-md">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 lg:h-24 flex items-center justify-between gap-3 max-lg:[direction:ltr] lg:gap-4">
        <Logo />

        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => {
            const active = isNavItemActive(pathname, currentHash, item.hash);
            return (
              <div key={item.label} className="relative">
                <NavLink
                  label={item.label}
                  hash={item.hash}
                  className={`text-[15px] font-bold transition-colors hover:text-primary ${
                    active ? "text-primary" : "text-foreground"
                  }`}
                />
                {active && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full bg-primary" />
                )}
              </div>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <AuthNavLink className={authLinkClass} />
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-5 py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
            تواصل عبر واتساب
          </a>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          className="grid h-11 w-11 place-items-center rounded-full border border-border text-foreground bg-background lg:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-border bg-background">
          <ul className="px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const active = isNavItemActive(pathname, currentHash, item.hash);
              return (
                <li key={item.label}>
                  <NavLink
                    label={item.label}
                    hash={item.hash}
                    onNavigate={closeMenu}
                    className={`block rounded-lg px-4 py-3 text-base font-bold ${
                      active ? "bg-primary-soft text-primary" : "text-foreground hover:bg-muted"
                    }`}
                  />
                </li>
              );
            })}
            <li className="pt-2">
              <AuthNavLink
                onNavigate={closeMenu}
                className="block rounded-lg px-4 py-3 text-base font-bold text-foreground hover:bg-muted"
              />
            </li>
            <li className="pt-2 mt-2 border-t border-border">
              <div className="px-4 py-2 text-[11px] font-black text-neutral-400">روابط قانونية</div>
            </li>
            {[
              { label: "سياسة الخصوصية", to: LEGAL_ROUTES.privacy },
              { label: "الشروط والأحكام", to: LEGAL_ROUTES.terms },
              { label: "سياسة الاسترجاع", to: LEGAL_ROUTES.refund },
            ].map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={closeMenu}
                  className="block rounded-lg px-4 py-3 text-base font-bold text-foreground hover:bg-muted"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
