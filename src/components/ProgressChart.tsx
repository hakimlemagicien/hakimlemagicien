export function ProgressChart({ compact = false }: { compact?: boolean }) {
  const points = [25, 28, 32, 38, 42, 48, 58, 62, 70, 78, 88, 98];
  const W = 320;
  const H = 140;
  const padL = 32;
  const padR = 12;
  const padT = 8;
  const padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const coords = points.map((p, i) => {
    const x = padL + (i / (points.length - 1)) * innerW;
    const y = padT + (1 - p / 100) * innerH;
    return [x, y] as const;
  });

  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${path} L ${coords[coords.length - 1][0]} ${padT + innerH} L ${coords[0][0]} ${padT + innerH} Z`;

  const yTicks = [0, 25, 50, 75, 100];
  const xLabels = [
    { i: 0, label: "الأسبوع 1" },
    { i: 3, label: "الأسبوع 4" },
    { i: 7, label: "الأسبوع 8" },
    { i: 11, label: "الأسبوع 12" },
  ];

  if (compact) {
    return (
      <div className="rounded-xl bg-white p-2.5 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.1)] w-full">
        <p className="mb-1 font-[Tajawal] text-[10px] font-medium text-foreground text-right">
          تقدمك خلال 12 أسبوع
        </p>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Progress chart">
          <defs>
            <linearGradient id="areaGradMobile" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
            </linearGradient>
          </defs>
          {yTicks.map((t) => {
            const y = padT + (1 - t / 100) * innerH;
            return (
              <g key={t}>
                <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#E5E7EB" strokeDasharray="2 3" />
                <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="8" fill="#9CA3AF">
                  {t}%
                </text>
              </g>
            );
          })}
          <path d={area} fill="url(#areaGradMobile)" />
          <path d={path} fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {coords.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" fill="#F97316" />
          ))}
          {xLabels.map(({ i, label }) => (
            <text
              key={i}
              x={coords[i][0]}
              y={H - 6}
              textAnchor="middle"
              fontSize="8"
              fill="#6B7280"
              fontWeight="500"
            >
              {label}
            </text>
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/85 backdrop-blur-md border border-white shadow-soft p-4 w-full max-w-[360px]">
      <p className="text-xs font-bold text-foreground mb-2 text-right">تقدمك خلال 12 أسبوع</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Progress chart">
        <defs>
          <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((t) => {
          const y = padT + (1 - t / 100) * innerH;
          return (
            <g key={t}>
              <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#E5E7EB" strokeDasharray="2 3" />
              <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#9CA3AF">
                {t}%
              </text>
            </g>
          );
        })}
        <path d={area} fill="url(#areaGrad)" />
        <path d={path} fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#F97316" />
        ))}
        {xLabels.map(({ i, label }) => (
          <text
            key={i}
            x={coords[i][0]}
            y={H - 6}
            textAnchor="middle"
            fontSize="9"
            fill="#6B7280"
            fontWeight="600"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}
