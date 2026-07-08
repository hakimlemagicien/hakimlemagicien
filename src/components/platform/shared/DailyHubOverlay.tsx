import { useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Droplets, Dumbbell, TrendingUp, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

type HubRoute =
  | "/app/program/workout"
  | "/app/nutrition"
  | "/app/water"
  | "/app/progress";

type HubCard = {
  id: string;
  title: string;
  to: HubRoute;
  icon: typeof Dumbbell;
  tone: string;
};

const HUB_CARDS: HubCard[] = [
  {
    id: "workout",
    title: "التمارين",
    to: "/app/program/workout",
    icon: Dumbbell,
    tone: "bg-[#FFF1E6] text-[#FF6B00]",
  },
  {
    id: "nutrition",
    title: "التغذية",
    to: "/app/nutrition",
    icon: UtensilsCrossed,
    tone: "bg-[#E9F9EF] text-[#22C55E]",
  },
  {
    id: "water",
    title: "الماء",
    to: "/app/water",
    icon: Droplets,
    tone: "bg-[#EAF2FF] text-[#3B82F6]",
  },
  {
    id: "progress",
    title: "التقدم",
    to: "/app/progress",
    icon: TrendingUp,
    tone: "bg-[#FFF7E8] text-[#F59E0B]",
  },
];

type DailyHubOverlayProps = {
  open: boolean;
  onClose: () => void;
};

function FloatingHubOrb({
  title,
  tone,
  delay,
  children,
}: {
  title: string;
  tone: string;
  delay: number;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.78 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 14, scale: 0.86 }}
      transition={{
        type: "spring",
        stiffness: 430,
        damping: 24,
        delay,
      }}
      className="flex flex-col items-center gap-1.5"
    >
      <span
        className={cn(
          "relative grid h-[62px] w-[62px] place-items-center rounded-full border border-white/80 shadow-[0_14px_34px_-14px_rgba(15,23,42,0.35)] backdrop-blur-md transition-transform active:scale-95",
          tone,
        )}
      >
        <span className="relative z-10">{children}</span>
      </span>
      <span className="max-w-[80px] text-center font-[Tajawal] text-[11px] font-extrabold leading-tight text-[#0F172A]">
        {title}
      </span>
    </motion.div>
  );
}

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

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="daily-hub"
          className="fixed inset-0 z-[60] md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <button
            type="button"
            aria-label="إغلاق برنامجي"
            className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[6px]"
            onClick={requestClose}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--platform-nav-h,64px)+18px)] flex justify-center px-4">
            <motion.div
              dir="rtl"
              role="dialog"
              aria-modal="true"
              aria-label="برنامجي"
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="pointer-events-auto w-full max-w-[340px] rounded-[28px] border border-white/60 bg-white/60 p-5 shadow-[0_28px_70px_-28px_rgba(15,23,42,0.5)] backdrop-blur-xl"
            >
              <div className="mb-4 text-center">
                <p className="font-[Tajawal] text-[15px] font-extrabold text-[#0F172A]">برنامجي</p>
                <p className="mt-0.5 font-[Tajawal] text-[11px] font-medium text-[#64748B]">
                  اختر ما تريد متابعته الآن
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                {HUB_CARDS.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleCard(card.to)}
                      className="outline-none"
                    >
                      <FloatingHubOrb
                        title={card.title}
                        tone={card.tone}
                        delay={0.05 + index * 0.05}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2.2} />
                      </FloatingHubOrb>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
