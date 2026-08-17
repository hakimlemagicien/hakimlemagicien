import { useNavigate } from "@tanstack/react-router";
import { Dumbbell, TrendingUp, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { HubOverlayShell, type HubOrigin } from "@/components/platform/shared/HubOverlayShell";

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
    tone: "bg-primary-soft text-primary",
  },
  {
    id: "nutrition",
    title: "التغذية",
    to: "/app/nutrition",
    icon: UtensilsCrossed,
    tone: "bg-primary-soft text-primary",
  },
  {
    id: "progress",
    title: "التقدم",
    to: "/app/progress",
    icon: TrendingUp,
    tone: "bg-primary-soft text-primary",
  },
];

type DailyHubOverlayProps = {
  open: boolean;
  onClose: () => void;
  origin: HubOrigin | null;
};

export function DailyHubOverlay({ open, onClose, origin }: DailyHubOverlayProps) {
  const navigate = useNavigate();

  const handleCard = (to: HubRoute) => {
    onClose();
    void navigate({ to });
  };

  return (
    <HubOverlayShell
      open={open}
      onClose={onClose}
      origin={origin}
      label="برنامجي"
      closeLabel="إغلاق برنامجي"
    >
      <div className="mb-4 text-center">
        <p className="font-[Tajawal] text-[15px] font-extrabold text-foreground">برنامجي</p>
        <p className="mt-0.5 font-[Tajawal] text-[11px] font-medium text-muted-foreground">
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
              style={{ animationDelay: `${90 + index * 45}ms` }}
            >
              <span className={cn("daily-hub-overlay__orb", card.tone)}>
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <span className="daily-hub-overlay__label">{card.title}</span>
            </button>
          );
        })}
      </div>
    </HubOverlayShell>
  );
}
