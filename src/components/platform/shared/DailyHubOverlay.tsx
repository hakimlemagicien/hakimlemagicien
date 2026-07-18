import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { Dumbbell, TrendingUp, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

type HubRoute = "/app/program/workout" | "/app/nutrition" | "/app/progress";

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

export function DailyHubOverlay({ open, onClose }: DailyHubOverlayProps) {
  const navigate = useNavigate();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const handleCard = (to: HubRoute) => {
    onClose();
    void navigate({ to });
  };

  return createPortal(
    <div className="daily-hub-overlay md:hidden" role="presentation">
      <button
        type="button"
        aria-label="إغلاق برنامجي"
        className="daily-hub-overlay__backdrop"
        onClick={onClose}
      />

      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label="برنامجي"
        className="daily-hub-overlay__panel"
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
                className="daily-hub-overlay__item outline-none"
                style={{ animationDelay: `${50 + index * 50}ms` }}
              >
                <span
                  className={cn(
                    "daily-hub-overlay__orb",
                    card.tone,
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <span className="daily-hub-overlay__label">{card.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
