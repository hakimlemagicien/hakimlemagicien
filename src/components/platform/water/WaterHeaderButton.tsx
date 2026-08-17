import { Droplets } from "lucide-react";
import { useWaterOptional } from "@/components/platform/water/WaterContext";
import { formatWaterLiters } from "@/lib/platform/water-storage";
import { cn } from "@/lib/utils";

type WaterHeaderButtonProps = {
  className?: string;
  iconClassName?: string;
};

export function WaterHeaderButton({
  className,
  iconClassName = "h-[18px] w-[18px]",
}: WaterHeaderButtonProps) {
  const water = useWaterOptional();
  if (!water) return null;

  const { state, openWaterSheet, reminderPulse } = water;
  const done = state.goalReached;
  const current = formatWaterLiters(state.totalMl);
  const goal = formatWaterLiters(state.goalMl, 0);

  return (
    <button
      type="button"
      onClick={openWaterSheet}
      aria-label={
        done ? `اكتمل هدف الماء ${goal} لتر` : `تذكير الماء ${current} من ${goal} لتر`
      }
      className={cn("relative grid shrink-0 place-items-center", className)}
    >
      <span
        className={cn(
          "water-header-orb grid size-full place-items-center rounded-full border",
          done
            ? "border-success/35 bg-success-soft shadow-[0_2px_8px_-3px_rgba(34,197,94,0.25)]"
            : "border-primary/30 bg-primary-soft shadow-[0_2px_8px_-3px_rgba(249,115,22,0.28)]",
          reminderPulse && !done ? "is-reminding" : null,
        )}
      >
        <Droplets
          className={cn(
            iconClassName,
            done ? "text-success" : "text-primary",
            reminderPulse && !done ? "water-header-orb__icon" : null,
          )}
          strokeWidth={2}
        />
      </span>
    </button>
  );
}
