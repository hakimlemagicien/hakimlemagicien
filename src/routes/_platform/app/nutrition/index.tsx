import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronLeft, Droplets, UtensilsCrossed } from "lucide-react";
import { PlatformPageHeader, PlatformStack } from "@/components/platform/layout/PlatformLayout";
import {
  MEALS_SEED,
  NUTRITION_OVERVIEW_SEED,
  type MealSeed,
} from "@/lib/platform/seed-content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/app/nutrition/")({
  head: () => ({ meta: [{ title: "التغذية | Hakim Platform" }] }),
  component: NutritionOverviewPage,
});

function MacroBar({
  label,
  value,
  goal,
  unit,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
}) {
  const pct = Math.min(Math.round((value / goal) * 100), 100);
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between text-xs font-bold text-foreground">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {value}/{goal} {unit}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-secondary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MealRow({ meal }: { meal: MealSeed }) {
  return (
    <Link
      to="/app/nutrition/meal"
      className="platform-card flex items-center gap-3 p-3 transition active:scale-[0.99]"
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
          meal.done ? "bg-secondary-soft text-success" : "bg-primary-soft text-primary",
        )}
      >
        {meal.done ? <Check className="h-5 w-5" strokeWidth={3} /> : <UtensilsCrossed className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-black text-foreground">{meal.name}</p>
          {meal.kcal > 0 ? (
            <span className="text-xs font-bold text-muted-foreground">{meal.kcal} سعرة</span>
          ) : null}
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{meal.meta}</p>
      </div>
      <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function NutritionOverviewPage() {
  const n = NUTRITION_OVERVIEW_SEED;
  const caloriesPct = Math.min(Math.round((n.calories / n.caloriesGoal) * 100), 100);

  return (
    <PlatformStack>
      <PlatformPageHeader title="التغذية" subtitle="خطتك الغذائية لليوم" />

      <section className="platform-card p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">السعرات اليوم</p>
            <p className="text-2xl font-black text-foreground">
              {n.calories}
              <span className="text-sm font-bold text-muted-foreground"> / {n.caloriesGoal}</span>
            </p>
          </div>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
            {caloriesPct}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${caloriesPct}%` }} />
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {n.macros.map((macro) => (
            <MacroBar
              key={macro.id}
              label={macro.label}
              value={macro.value}
              goal={macro.goal}
              unit={macro.unit}
            />
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-black text-foreground">وجبات اليوم</h2>
        {MEALS_SEED.map((meal) => (
          <MealRow key={meal.id} meal={meal} />
        ))}
      </div>

      <Link
        to="/app/water"
        className="platform-card flex items-center gap-3 p-3 transition active:scale-[0.99]"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#DBEAFE] text-[#2563EB]">
          <Droplets className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-foreground">شرب الماء</p>
          <p className="mt-1 text-xs text-muted-foreground">تابع كمية الماء اليومية</p>
        </div>
        <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground" />
      </Link>
    </PlatformStack>
  );
}
