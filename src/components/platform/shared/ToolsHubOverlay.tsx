import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { Calculator, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

type ToolsRoute = "/app/tools/timer";

type ToolsCard =
  | {
      id: string;
      title: string;
      kind: "calories";
      icon: typeof Calculator;
      tone: string;
    }
  | {
      id: string;
      title: string;
      kind: "route";
      to: ToolsRoute;
      icon: typeof Timer;
      tone: string;
    };

/** Add future tools here — same pattern as DailyHubOverlay cards. */
export const TOOLS_HUB_CARDS: ToolsCard[] = [
  {
    id: "calories",
    title: "حاسبة السعرات الحرارية",
    kind: "calories",
    icon: Calculator,
    tone: "bg-[#FFF1E6] text-[#FF6B00]",
  },
  {
    id: "timer",
    title: "تايمر التدريبات",
    kind: "route",
    to: "/app/tools/timer",
    icon: Timer,
    tone: "bg-[#EEF2FF] text-[#6366F1]",
  },
];

type ToolsHubOverlayProps = {
  open: boolean;
  onClose: () => void;
  onOpenCalories?: () => void;
};

export function ToolsHubOverlay({ open, onClose, onOpenCalories }: ToolsHubOverlayProps) {
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

  const handleCard = (card: ToolsCard) => {
    onClose();
    if (card.kind === "calories") {
      onOpenCalories?.();
      return;
    }
    void navigate({ to: card.to });
  };

  return createPortal(
    <div className="daily-hub-overlay md:hidden" role="presentation">
      <button
        type="button"
        aria-label="إغلاق الأدوات"
        className="daily-hub-overlay__backdrop"
        onClick={onClose}
      />

      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label="الأدوات"
        className="daily-hub-overlay__panel"
      >
        <div className="mb-4 text-center">
          <p className="font-[Tajawal] text-[15px] font-extrabold text-[#0F172A]">الأدوات</p>
          <p className="mt-0.5 font-[Tajawal] text-[11px] font-medium text-[#64748B]">
            اختر الأداة التي تحتاجها
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          {TOOLS_HUB_CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCard(card)}
                className="daily-hub-overlay__item outline-none"
                style={{ animationDelay: `${50 + index * 50}ms` }}
              >
                <span className={cn("daily-hub-overlay__orb", card.tone)}>
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

export function isToolsHubRoute(pathname: string) {
  return pathname === "/app/tools/calories" || pathname === "/app/tools/timer";
}
