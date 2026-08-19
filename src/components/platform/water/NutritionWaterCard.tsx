import { Droplets } from "lucide-react";
import { useWaterOptional } from "@/components/platform/water/WaterContext";
import { formatWaterLiters } from "@/lib/platform/water-storage";
import { cn } from "@/lib/utils";

export function WaterCupsFace({
  current,
  goal,
  pct,
  done,
}: {
  current: string;
  goal: string;
  pct: number;
  done: boolean;
}) {
  const slots = 8;
  const filled = Math.round(Math.min(pct, 1) * slots);

  return (
    <div className="flex w-full flex-col gap-3 rounded-[24px] border border-sky-200 bg-white p-3.5 text-right shadow-[0_8px_28px_-16px_rgba(14,165,233,0.28)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black text-sky-950">الماء</p>
        <p className="text-[12px] font-bold text-sky-700">
          {current} / {goal} لتر
        </p>
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {Array.from({ length: slots }, (_, index) => {
          const on = index < filled || done;
          return (
            <span
              key={index}
              className={cn(
                "grid aspect-square place-items-center rounded-xl",
                on ? "bg-sky-500 text-white" : "bg-sky-100 text-sky-300",
              )}
            >
              <Droplets className="h-3.5 w-3.5" strokeWidth={2.4} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function NutritionWaterCard() {
  const water = useWaterOptional();
  if (!water) return null;

  const { state, openWaterSheet } = water;
  const current = formatWaterLiters(state.totalMl);
  const goal = formatWaterLiters(state.goalMl, 0);
  const pct = state.goalMl > 0 ? Math.min(state.totalMl / state.goalMl, 1) : 0;

  return (
    <button
      type="button"
      onClick={openWaterSheet}
      aria-label={`متابعة شرب الماء ${current} من ${goal} لتر`}
      className="w-full text-right transition active:scale-[0.99]"
    >
      <WaterCupsFace current={current} goal={goal} pct={pct} done={state.goalReached} />
    </button>
  );
}
