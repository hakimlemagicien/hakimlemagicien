import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

const POINTS = [25, 28, 32, 38, 42, 48, 58, 62, 70, 78, 88, 98];
const W = 320;
const H = 140;
const PAD_L = 32;
const PAD_R = 12;
const PAD_T = 8;
const PAD_B = 24;
const INNER_W = W - PAD_L - PAD_R;
const INNER_H = H - PAD_T - PAD_B;
const LINE_DRAW_MS = 2000;

const Y_TICKS = [0, 25, 50, 75, 100];
const X_LABELS = [
  { i: 0, label: "الأسبوع 1" },
  { i: 3, label: "الأسبوع 4" },
  { i: 7, label: "الأسبوع 8" },
  { i: 11, label: "الأسبوع 12" },
];

function useInViewOnce<T extends Element>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function buildGeometry() {
  const coords = POINTS.map((p, i) => {
    const x = PAD_L + (i / (POINTS.length - 1)) * INNER_W;
    const y = PAD_T + (1 - p / 100) * INNER_H;
    return [x, y] as const;
  });

  const path = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");

  const area = `${path} L ${coords[coords.length - 1][0]} ${PAD_T + INNER_H} L ${coords[0][0]} ${PAD_T + INNER_H} Z`;

  return { coords, path, area };
}

function AnimatedProgressSvg({ gradientId, compact }: { gradientId: string; compact: boolean }) {
  const { coords, path, area } = buildGeometry();
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const { ref: viewRef, inView } = useInViewOnce<HTMLDivElement>();

  const gridFont = compact ? 8 : 9;
  const labelFont = compact ? 8 : 9;

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [path]);

  const lineStyle: CSSProperties = {
    strokeDasharray: pathLength,
    strokeDashoffset: inView && pathLength > 0 ? 0 : pathLength,
    transition:
      pathLength > 0
        ? `stroke-dashoffset ${LINE_DRAW_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
        : "none",
  };

  const areaStyle: CSSProperties = {
    opacity: inView ? 1 : 0,
    transition: `opacity 1s ease ${LINE_DRAW_MS * 0.35}ms`,
  };

  return (
    <div ref={viewRef}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="تقدمك خلال 12 أسبوع">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
          </linearGradient>
        </defs>

        {Y_TICKS.map((t) => {
          const y = PAD_T + (1 - t / 100) * INNER_H;
          return (
            <g key={t}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="#E5E7EB" strokeDasharray="2 3" />
              <text x={PAD_L - 6} y={y + 3} textAnchor="end" fontSize={gridFont} fill="#9CA3AF">
                {t}%
              </text>
            </g>
          );
        })}

        <path d={area} fill={`url(#${gradientId})`} style={areaStyle} />

        <path
          ref={pathRef}
          d={path}
          fill="none"
          stroke="#F97316"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={lineStyle}
        />

        {coords.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill="#F97316"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "scale(1)" : "scale(0)",
              transformBox: "fill-box",
              transformOrigin: "center",
              transition: `opacity 0.35s ease ${LINE_DRAW_MS * 0.3 + i * 120}ms, transform 0.35s cubic-bezier(0.34, 1.3, 0.64, 1) ${LINE_DRAW_MS * 0.3 + i * 120}ms`,
            }}
          />
        ))}

        {X_LABELS.map(({ i, label }) => (
          <text
            key={i}
            x={coords[i][0]}
            y={H - 6}
            textAnchor="middle"
            fontSize={labelFont}
            fill="#6B7280"
            fontWeight={compact ? "500" : "600"}
            style={{
              opacity: inView ? 1 : 0,
              transition: `opacity 0.5s ease ${LINE_DRAW_MS * 0.45 + i * 60}ms`,
            }}
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function ProgressChart({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="w-full -translate-x-[10px] translate-y-[3px] rounded-xl bg-white/90 p-2.5 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.1)]">
        <p className="mb-1 font-[Tajawal] text-[10px] font-medium text-foreground text-right">
          تقدمك خلال 12 أسبوع
        </p>
        <AnimatedProgressSvg gradientId="areaGradMobile" compact />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/85 backdrop-blur-md border border-white shadow-soft p-4 w-full max-w-[360px]">
      <p className="text-xs font-bold text-foreground mb-2 text-right">تقدمك خلال 12 أسبوع</p>
      <AnimatedProgressSvg gradientId="areaGrad" compact={false} />
    </div>
  );
}
