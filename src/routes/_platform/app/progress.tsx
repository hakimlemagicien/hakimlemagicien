import { createFileRoute } from "@tanstack/react-router";
import { Ruler, Scale, Target, TrendingDown } from "lucide-react";
import { PlatformPageHeader, PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { PROGRESS_SEED } from "@/lib/platform/seed-content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/app/progress")({
  head: () => ({ meta: [{ title: "التقدم | Hakim Platform" }] }),
  component: ProgressDashboardPage,
});

function StatCard({
  icon: Icon,
  value,
  label,
  tint,
}: {
  icon: typeof Scale;
  value: string;
  label: string;
  tint: string;
}) {
  return (
    <div className="platform-card flex flex-1 flex-col items-center gap-1 p-3 text-center">
      <span className={cn("mb-1 grid h-9 w-9 place-items-center rounded-xl", tint)}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-base font-black text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ProgressDashboardPage() {
  const p = PROGRESS_SEED;
  const totalToLose = p.startWeight - p.goalWeight;
  const lostSoFar = p.startWeight - p.currentWeight;
  const goalPct = Math.min(Math.max(Math.round((lostSoFar / totalToLose) * 100), 0), 100);

  const weights = p.history.map((h) => h.weight);
  const maxW = Math.max(...weights);
  const minW = Math.min(...weights, p.goalWeight);
  const range = Math.max(maxW - minW, 1);

  return (
    <PlatformStack>
      <PlatformPageHeader title="التقدم" subtitle={`منذ ${p.daysIn} يوماً من رحلتك`} />

      <div className="flex items-stretch gap-2">
        <StatCard
          icon={Scale}
          value={`${p.currentWeight}`}
          label="الوزن الحالي"
          tint="bg-secondary-soft text-success"
        />
        <StatCard
          icon={TrendingDown}
          value={`${p.change}`}
          label="التغيّر (كجم)"
          tint="bg-primary-soft text-primary"
        />
        <StatCard
          icon={Target}
          value={`${p.goalWeight}`}
          label="الهدف (كجم)"
          tint="bg-[#FEF9C3] text-[#CA8A04]"
        />
      </div>

      <section className="platform-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-foreground">التقدم نحو الهدف</h2>
          <span className="rounded-full bg-secondary-soft px-3 py-1 text-xs font-bold text-success">
            {goalPct}%
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-secondary" style={{ width: `${goalPct}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          خسرت {lostSoFar.toFixed(1)} كجم من أصل {totalToLose.toFixed(1)} كجم.
        </p>
      </section>

      <section className="platform-card p-4">
        <h2 className="text-sm font-black text-foreground">سجل الوزن</h2>
        <div className="mt-3 flex flex-col gap-3">
          {p.history.map((point) => {
            const barPct = Math.round(((point.weight - minW) / range) * 100);
            return (
              <div key={point.id} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs font-bold text-muted-foreground">
                  {point.label}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(barPct, 6)}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-left text-xs font-black text-foreground">
                  {point.weight} كجم
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="platform-card p-4">
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-black text-foreground">القياسات</h2>
        </div>
        <ul className="mt-3 flex flex-col gap-2.5">
          {p.measurements.map((m) => (
            <li key={m.id} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{m.label}</span>
              <span className="flex items-center gap-2">
                <span className="font-black text-foreground">{m.value}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-bold",
                    m.change.startsWith("-")
                      ? "bg-secondary-soft text-success"
                      : "bg-primary-soft text-primary",
                  )}
                >
                  {m.change}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </PlatformStack>
  );
}
