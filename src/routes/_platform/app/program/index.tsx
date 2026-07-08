import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronLeft, Dumbbell, Lock } from "lucide-react";
import { PlatformPageHeader, PlatformStack } from "@/components/platform/layout/PlatformLayout";
import {
  PROGRAM_DAYS_SEED,
  PROGRAM_OVERVIEW_SEED,
  type ProgramDaySeed,
} from "@/lib/platform/seed-content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/app/program/")({
  head: () => ({ meta: [{ title: "برنامجي | Hakim Platform" }] }),
  component: ProgramOverviewPage,
});

const STATUS_LABEL: Record<ProgramDaySeed["status"], string> = {
  done: "مكتمل",
  today: "اليوم",
  rest: "راحة",
  locked: "مقفل",
};

function DayStatus({ status }: { status: ProgramDaySeed["status"] }) {
  if (status === "done") {
    return (
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary-soft">
        <Check className="h-4 w-4 text-success" strokeWidth={3} />
      </span>
    );
  }
  if (status === "today") {
    return (
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft">
        <ChevronLeft className="h-4 w-4 text-primary" />
      </span>
    );
  }
  if (status === "locked") {
    return (
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-locked">
        <Lock className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
      راحة
    </span>
  );
}

function DayRow({ day }: { day: ProgramDaySeed }) {
  const clickable = day.status === "today" || day.status === "done";

  const inner = (
    <>
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
          day.status === "today" ? "bg-primary-soft text-primary" : "bg-secondary-soft text-success",
          day.status === "locked" && "bg-muted text-locked",
          day.status === "rest" && "bg-muted text-muted-foreground",
        )}
      >
        <Dumbbell className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-black text-foreground">{day.day}</p>
          {day.status === "today" ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              {STATUS_LABEL.today}
            </span>
          ) : null}
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {day.title} · {day.meta}
        </p>
      </div>
      <DayStatus status={day.status} />
    </>
  );

  if (clickable) {
    return (
      <Link
        to="/app/program/workout"
        className="platform-card flex items-center gap-3 p-3 transition active:scale-[0.99]"
      >
        {inner}
      </Link>
    );
  }

  return <div className="platform-card flex items-center gap-3 p-3 opacity-90">{inner}</div>;
}

function ProgramOverviewPage() {
  const overview = PROGRAM_OVERVIEW_SEED;
  const pct = Math.round((overview.currentDay / overview.totalDays) * 100);

  return (
    <PlatformStack>
      <PlatformPageHeader title="برنامجي" subtitle={overview.weekLabel} />

      <section className="shrink-0 overflow-hidden rounded-2xl cta-gradient p-4 text-white shadow-cta">
        <p className="text-xs text-white/85">{overview.subtitle}</p>
        <p className="mt-1 text-lg font-black leading-tight">{overview.name}</p>
        <div className="mt-4 flex items-center justify-between text-xs font-bold text-white/90">
          <span>
            اليوم {overview.currentDay} من {overview.totalDays}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-black text-foreground">أيام الأسبوع</h2>
        {PROGRAM_DAYS_SEED.map((day) => (
          <DayRow key={day.id} day={day} />
        ))}
      </div>
    </PlatformStack>
  );
}
