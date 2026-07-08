import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, Droplets, Dumbbell, TrendingUp, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

type HubRoute =
  | "/app/program/workout"
  | "/app/nutrition"
  | "/app/water"
  | "/app/progress";

type HubCard = {
  id: string;
  title: string;
  snapshot: string;
  to: HubRoute;
  icon: typeof Dumbbell;
  iconBg: string;
  iconColor: string;
};

const HUB_CARDS: HubCard[] = [
  {
    id: "workout",
    title: "التمارين",
    snapshot: "تمرين اليوم",
    to: "/app/program/workout",
    icon: Dumbbell,
    iconBg: "bg-primary-soft",
    iconColor: "text-primary",
  },
  {
    id: "nutrition",
    title: "التغذية",
    snapshot: "2 / 5 وجبات",
    to: "/app/nutrition",
    icon: UtensilsCrossed,
    iconBg: "bg-secondary-soft",
    iconColor: "text-success",
  },
  {
    id: "water",
    title: "الماء",
    snapshot: "1.5 / 3 لتر",
    to: "/app/water",
    icon: Droplets,
    iconBg: "bg-[#DBEAFE]",
    iconColor: "text-[#2563EB]",
  },
  {
    id: "progress",
    title: "التقدم",
    snapshot: "آخر تحديث منذ يومين",
    to: "/app/progress",
    icon: TrendingUp,
    iconBg: "bg-[#FEF9C3]",
    iconColor: "text-[#CA8A04]",
  },
];

type DailyHubOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export function DailyHubOverlay({ open, onClose }: DailyHubOverlayProps) {
  const navigate = useNavigate();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const pendingNav = useRef<HubRoute | null>(null);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    window.history.pushState({ dailyHub: true }, "");

    const handlePop = () => {
      onCloseRef.current();
      if (pendingNav.current) {
        const to = pendingNav.current;
        pendingNav.current = null;
        void navigate({ to });
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") window.history.back();
    };

    window.addEventListener("popstate", handlePop);
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("popstate", handlePop);
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, navigate]);

  const requestClose = () => {
    window.history.back();
  };

  const handleCard = (to: HubRoute) => {
    pendingNav.current = to;
    window.history.back();
  };

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) requestClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="daily-hub-backdrop"
          className="fixed inset-0 z-[55] bg-black/70 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          onClick={requestClose}
          aria-hidden
        />
      ) : null}
      {open ? (
        <motion.div
          key="daily-hub-sheet"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-label="برنامجي"
          className="fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-[var(--platform-frame-w)] rounded-t-[28px] bg-card px-4 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-3 shadow-[0_-8px_40px_-10px_rgba(31,27,24,0.35)] md:hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={handleDragEnd}
        >
          <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-border" aria-hidden />

          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-foreground">برنامجي</h2>
              <p className="text-xs text-muted-foreground">تابع يومك في مكان واحد</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {HUB_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleCard(card.to)}
                  className="platform-card flex flex-col items-start gap-3 p-4 text-right transition active:scale-[0.98]"
                >
                  <span
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-xl",
                      card.iconBg,
                      card.iconColor,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="w-full">
                    <p className="text-sm font-black text-foreground">{card.title}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {card.snapshot}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-primary">
                    فتح
                    <ChevronLeft className="h-4 w-4" />
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
