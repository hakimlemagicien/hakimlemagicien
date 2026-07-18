import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type TimerRingProps = {
  progress: number;
  tone: "idle" | "preparing" | "work" | "rest" | "paused" | "completed";
  pulse?: boolean;
  children: React.ReactNode;
};

const TONE_STROKE: Record<TimerRingProps["tone"], string> = {
  idle: "#CBD5E1",
  preparing: "#FB923C",
  work: "#FF6B00",
  rest: "#22C55E",
  paused: "#94A3B8",
  completed: "#16A34A",
};

export function TimerRing({ progress, tone, pulse, children }: TimerRingProps) {
  const reduceMotion = useReducedMotion();
  const size = 248;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <div className="relative mx-auto grid place-items-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cn("-rotate-90", pulse && !reduceMotion && "motion-safe:animate-pulse")}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TONE_STROKE[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={reduceMotion ? undefined : "transition-[stroke-dashoffset] duration-300 ease-linear"}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center px-6 text-center">{children}</div>
    </div>
  );
}
