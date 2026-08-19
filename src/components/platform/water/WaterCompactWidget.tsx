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
          "inline-flex min-h-11 items-center gap-2 rounded-2xl border border-primary/25 bg-primary-soft px-3 py-2 text-right transition active:scale-[0.98]",
          className,
        )}
      >
        <Droplets className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-[11px] font-black text-foreground">
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
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Droplets className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-foreground">الماء</p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            {current} / {goal} لتر
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className={cn("h-full rounded-full", done ? "bg-success" : "bg-primary")}
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
        "flex w-full items-center gap-2.5 rounded-[20px] border border-primary/20 bg-primary-soft px-3 py-2.5 text-right transition active:scale-[0.98]",
        className,
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-primary shadow-sm">
        <Droplets className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-muted-foreground">الماء</p>
        <p className="text-[12px] font-black text-foreground">
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
  tone = "brand",
}: {
  pct: number;
  done?: boolean;
  size?: number;
  tone?: "brand" | "water";
}) {
  const reduceMotion = useReducedMotion();
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(pct, 1));
  const track = tone === "water" ? "#E0F2FE" : "#FFF1E6";
  const stroke = done ? "#22C55E" : tone === "water" ? "#0EA5E9" : "#F97316";

  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={track}
        strokeWidth={size > 40 ? 8 : 4}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={stroke}
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
