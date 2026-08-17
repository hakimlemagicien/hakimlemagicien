import { useNavigate } from "@tanstack/react-router";
import { Calculator, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { HubOverlayShell, type HubOrigin } from "@/components/platform/shared/HubOverlayShell";

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
    tone: "bg-primary-soft text-primary",
  },
  {
    id: "timer",
    title: "تايمر التدريبات",
    kind: "route",
    to: "/app/tools/timer",
    icon: Timer,
    tone: "bg-primary-soft text-primary",
  },
];

type ToolsHubOverlayProps = {
  open: boolean;
  onClose: () => void;
  origin: HubOrigin | null;
  onOpenCalories?: () => void;
};

export function ToolsHubOverlay({
  open,
  onClose,
  origin,
  onOpenCalories,
}: ToolsHubOverlayProps) {
  const navigate = useNavigate();

  const handleCard = (card: ToolsCard) => {
    onClose();
    if (card.kind === "calories") {
      onOpenCalories?.();
      return;
    }
    void navigate({ to: card.to });
  };

  return (
    <HubOverlayShell
      open={open}
      onClose={onClose}
      origin={origin}
      label="الأدوات"
      closeLabel="إغلاق الأدوات"
    >
      <div className="mb-4 text-center">
        <p className="font-[Tajawal] text-[15px] font-extrabold text-foreground">الأدوات</p>
        <p className="mt-0.5 font-[Tajawal] text-[11px] font-medium text-muted-foreground">
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

export function isToolsHubRoute(pathname: string) {
  return pathname === "/app/tools/calories" || pathname === "/app/tools/timer";
}
