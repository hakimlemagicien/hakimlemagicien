import { motion, useReducedMotion } from "framer-motion";
import { Droplets } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWaterOptional } from "@/components/platform/water/WaterContext";
import { formatWaterLiters } from "@/lib/platform/water-storage";
import { cn } from "@/lib/utils";

type WaterCompactWidgetProps = {
  variant?: "card" | "inline" | "mini";
  className?: string;
  loading?: boolean;
};

export function WaterCompactWidget({
  variant = "card",
  className,
  loading = false,
}: WaterCompactWidgetProps) {
  const water = useWaterOptional();
  const reduceMotion = useReducedMotion();

  if (loading || !water) {
    return (
      <div className={cn("rounded-[24px] border border-border/50 bg-card p-3.5", className)}>
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    );
  }

  const { state, openWaterSheet } = water;
  const current = formatWaterLiters(state.totalMl);
  const goal = formatWaterLiters(state.goalMl, 0);
  const pct = state.goalMl > 0 ? Math.min(state.totalMl / state.goalMl, 1) : 0;
  const done = state.goalReached;

  if (variant === "mini") {
    return (
      <button
        type="button"
        onClick={openWaterSheet}
        aria-label={`الماء ${current} من ${goal} لتر`}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-right transition active:scale-[0.98]",
          className,
        )}
      >
        <Droplets className="h-4 w-4 shrink-0 text-[#2563EB]" />
        <span className="text-[11px] font-black text-[#1E3A8A]">
          {current}/{goal} ل
        </span>
      </button>
    );
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={openWaterSheet}
        aria-label={`متابعة شرب الماء ${current} من ${goal} لتر`}
        className={cn(
          "flex w-full items-center gap-3 rounded-[24px] border border-border/50 bg-card p-3.5 text-right shadow-[0_8px_28px_-16px_rgba(15,23,42,0.18)] transition active:scale-[0.99]",
          className,
        )}
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#DBEAFE] text-[#2563EB]">
          <Droplets className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-foreground">الماء</p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            {current} / {goal} لتر
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className={cn("h-full rounded-full", done ? "bg-[#22C55E]" : "bg-[#2563EB]")}
              initial={false}
              animate={{ width: `${pct * 100}%` }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }}
            />
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openWaterSheet}
      aria-label={`الماء ${current} من ${goal} لتر`}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[20px] border border-[#BFDBFE]/80 bg-[#EFF6FF] px-3 py-2.5 text-right transition active:scale-[0.98]",
        className,
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#2563EB] shadow-sm">
        <Droplets className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-[#64748B]">الماء</p>
        <p className="text-[12px] font-black text-[#1E3A8A]">
          {current} / {goal} لتر
        </p>
      </div>
      <div className="h-8 w-8 shrink-0">
        <WaterRing pct={pct} done={done} size={32} />
      </div>
    </button>
  );
}

export function WaterRing({
  pct,
  done,
  size = 88,
}: {
  pct: number;
  done?: boolean;
  size?: number;
}) {
  const reduceMotion = useReducedMotion();
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(pct, 1));

  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E0F2FE"
        strokeWidth={size > 40 ? 8 : 4}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={done ? "#22C55E" : "#2563EB"}
        strokeWidth={size > 40 ? 8 : 4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={false}
        animate={{ strokeDashoffset: offset }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.55, ease: "easeOut" }}
      />
    </svg>
  );
}
