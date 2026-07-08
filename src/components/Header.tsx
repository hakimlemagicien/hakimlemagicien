import { AnimatePresence, motion } from "framer-motion";
import {
  CircleDollarSign,
  Home,
  Menu,
  MessageCircleQuestion,
  Route,
  Shield,
  Sparkles,
  Star,
  UserRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { LEGAL_ROUTES } from "@/lib/site-legal";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, type ReactNode } from "react";

const navItems: {
  label: string;
  hash?: string;
  desktopLabel: string;
  icon: LucideIcon;
  tone: string;
}[] = [
  {
    label: "الرئيسية",
    desktopLabel: "الرئيسية",
    hash: undefined,
    icon: Home,
    tone: "bg-[#FFF1E6] text-[#FF6B00]",
  },
  {
    label: "كيف تعمل",
    desktopLabel: "كيف تعمل المنصة",
    hash: "how",
    icon: Route,
    tone: "bg-[#EAF2FF] text-[#3B82F6]",
  },
  {
    label: "المزايا",
    desktopLabel: "ماذا ستحصل عليه",
    hash: "features",
    icon: Sparkles,
    tone: "bg-[#F3E8FF] text-[#A855F7]",
  },
  {
    label: "النجاح",
    desktopLabel: "قصص النجاح",
    hash: "stories",
    icon: Star,
    tone: "bg-[#FFF7E8] text-[#F59E0B]",
  },
  {
    label: "الباقات",
    desktopLabel: "تحديد السعر",
    hash: "pricing",
    icon: CircleDollarSign,
    tone: "bg-[#E9F9EF] text-[#22C55E]",
  },
  {
    label: "الأسئلة",
    desktopLabel: "أسئلة شائعة",
    hash: "faq",
    icon: MessageCircleQuestion,
    tone: "bg-[#EEF2FF] text-[#6366F1]",
  },
];

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

function isNavItemActive(pathname: string, currentHash: string, itemHash?: string) {
  if (pathname !== "/") return false;
  if (!itemHash) return !currentHash;
  return currentHash === itemHash;
}

function AuthNavLink({ className }: { className: string }) {
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
      <Link to="/app" className={className}>
        حسابي
      </Link>
    );
  }

  return (
    <Link to="/auth" className={className}>
      تسجيل الدخول
    </Link>
  );
}

function FloatingOrb({
  label,
  tone,
  active,
  delay,
  children,
  className = "",
}: {
  label: string;
  tone: string;
  active?: boolean;
  delay: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.78 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 14, scale: 0.86 }}
      transition={{
        type: "spring",
        stiffness: 430,
        damping: 24,
        delay,
      }}
      className={`flex flex-col items-center gap-1.5 ${className}`}
    >
      <span
        className={`relative grid h-[58px] w-[58px] place-items-center rounded-full border border-white/80 shadow-[0_14px_34px_-14px_rgba(15,23,42,0.35)] backdrop-blur-md transition-transform active:scale-95 ${tone} ${
          active ? "ring-2 ring-primary/40 shadow-[0_0_0_6px_rgba(255,107,0,0.12)]" : ""
        }`}
      >
        {active && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full bg-primary/10"
          />
        )}
        <span className="relative z-10">{children}</span>
      </span>
      <span className="max-w-[76px] text-center font-[Tajawal] text-[11px] font-extrabold leading-tight text-[#0F172A]">
        {label}
      </span>
    </motion.div>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const whatsapp = "https://wa.me/971505129019";
  const pathname = useLocation({ select: (l) => l.pathname });
  const currentHash = useLocation({ select: (l) => l.hash.replace(/^#/, "") });
  const closeMenu = () => setOpen(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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
                <Link
                  to="/"
                  hash={item.hash}
                  className={`text-[15px] font-bold transition-colors hover:text-primary ${
                    active ? "text-primary" : "text-foreground"
                  }`}
                >
                  {item.desktopLabel}
                </Link>
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
          aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={open}
          className={`relative z-[70] grid h-11 w-11 place-items-center rounded-full border text-foreground transition-all duration-300 lg:hidden ${
            open
              ? "border-primary/30 bg-primary text-primary-foreground shadow-[0_10px_28px_-10px_rgba(255,107,0,0.55)]"
              : "border-border bg-background"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? "close" : "menu"}
              initial={{ opacity: 0, rotate: -40, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 40, scale: 0.7 }}
              transition={{ duration: 0.18 }}
              className="grid place-items-center"
            >
              {open ? <X className="h-5 w-5" strokeWidth={2.2} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <button
              type="button"
              aria-label="إغلاق القائمة"
              className="absolute inset-0 bg-[#0F172A]/35 backdrop-blur-[6px]"
              onClick={closeMenu}
            />

            <div className="pointer-events-none absolute inset-x-0 top-[72px] flex justify-center px-4">
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 360, damping: 26 }}
                className="pointer-events-auto w-full max-w-[360px] rounded-[28px] border border-white/60 bg-white/55 p-5 shadow-[0_28px_70px_-28px_rgba(15,23,42,0.5)] backdrop-blur-xl"
              >
                <div className="grid grid-cols-3 gap-x-3 gap-y-5">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const active = isNavItemActive(pathname, currentHash, item.hash);
                    return (
                      <Link
                        key={item.label}
                        to="/"
                        hash={item.hash}
                        onClick={closeMenu}
                        className="outline-none"
                      >
                        <FloatingOrb
                          label={item.label}
                          tone={item.tone}
                          active={active}
                          delay={0.04 + index * 0.045}
                        >
                          <Icon className="h-5 w-5" strokeWidth={2.2} />
                        </FloatingOrb>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-5 border-t border-black/[0.06] pt-5">
                  <Link to={loggedIn ? "/app" : "/auth"} onClick={closeMenu} className="outline-none">
                    <FloatingOrb
                      label={loggedIn ? "حسابي" : "دخول"}
                      tone="bg-[#F1F5F9] text-[#0F172A]"
                      delay={0.34}
                    >
                      <UserRound className="h-5 w-5" strokeWidth={2.2} />
                    </FloatingOrb>
                  </Link>

                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="outline-none"
                  >
                    <FloatingOrb label="واتساب" tone="bg-[#E8F8EF] text-[#25D366]" delay={0.38}>
                      <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                    </FloatingOrb>
                  </a>

                  <Link to={LEGAL_ROUTES.privacy} onClick={closeMenu} className="outline-none">
                    <FloatingOrb
                      label="الخصوصية"
                      tone="bg-[#F8FAFC] text-[#64748B]"
                      delay={0.42}
                    >
                      <Shield className="h-5 w-5" strokeWidth={2.2} />
                    </FloatingOrb>
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
