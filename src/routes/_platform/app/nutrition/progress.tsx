import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, Trophy } from "lucide-react";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import {
  CountUpNumber,
  NUTRITION_LOCKED_REASON,
  NutritionEmptyState,
  NutritionLockedOverlay,
  NutritionMotionSection,
  NutritionOfflineBanner,
  nutritionCardClass,
} from "@/components/platform/nutrition/NutritionShared";
import { PlatformDetailHeader } from "@/components/platform/shared/PlatformDetailHeader";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { useMembership } from "@/hooks/useMembership";
import { useNutritionPlan, useOnlineStatus } from "@/hooks/useNutritionPlan";
import { buildNutritionProgressWeek } from "@/lib/platform/nutrition-experience";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/app/nutrition/progress")({
  head: () => ({ meta: [{ title: "التقدم الغذائي | Hakim Platform" }] }),
  component: NutritionProgressPage,
});

function NutritionProgressPage() {
  const { features } = useMembership();
  const { openUpgrade } = useUpgradeFlow();
  const locked = !features.nutrition_plan;
  const online = useOnlineStatus();
  const plan = useNutritionPlan();
  const [range] = useState("هذا الأسبوع");
  const week = useMemo(() => {
    const base = buildNutritionProgressWeek();
    return base.map((day) =>
      day.id === plan.dateKey ? { ...day, commitmentPct: plan.commitmentPct } : day,
    );
  }, [plan.commitmentPct, plan.dateKey]);

  const avgCommitment = Math.round(
    week.filter((d) => !d.isFuture).reduce((sum, d) => sum + d.commitmentPct, 0) /
      Math.max(week.filter((d) => !d.isFuture).length, 1),
  );
  const completedDays = week.filter((d) => !d.isFuture && d.commitmentPct >= 70).length;
  const mealsCompleted = plan.completedCount + 24;
  const mealsTotal = 35;
  const hasData = week.some((d) => d.commitmentPct > 0 || plan.completedCount > 0);

  return (
    <PlatformStack className="gap-3.5 pb-4">
      <NutritionOfflineBanner online={online} />
      <PlatformDetailHeader title="التقدم الغذائي" backTo="/app/nutrition" />

      {!hasData ? (
        <NutritionEmptyState
          title="لا توجد بيانات تقدم."
          description="سجّل وجباتك اليومية لتظهر نسب الالتزام والرسم البياني هنا."
        />
      ) : (
        <>
          <NutritionMotionSection>
            <div className="flex justify-end">
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-bold text-foreground">
                {range}
              </span>
            </div>
          </NutritionMotionSection>

          <NutritionMotionSection delay={0.05}>
            <section
              className={cn(nutritionCardClass, "relative flex flex-col items-center overflow-hidden p-5")}
            >
              <CommitmentRingLarge pct={avgCommitment || plan.commitmentPct || 65} />
              <p className="mt-2 text-[12px] font-bold text-muted-foreground">نسبة الالتزام</p>
              {locked ? (
                <NutritionLockedOverlay
                  active
                  intensity="light"
                  message="معاينة — فعّل برنامجك"
                  onUnlockClick={() => openUpgrade(NUTRITION_LOCKED_REASON)}
                />
              ) : null}
            </section>
          </NutritionMotionSection>

          <NutritionMotionSection delay={0.1}>
            <div className="relative grid grid-cols-2 gap-2.5 overflow-hidden rounded-[24px]">
              <StatCard label="متوسط السعرات" value={2100} />
              <StatCard label="متوسط البروتين" value={150} suffix="غ" />
              <StatCard
                label="الوجبات المكتملة"
                value={mealsCompleted}
                suffix={` / ${mealsTotal}`}
                animate={false}
              />
              <StatCard
                label="أيام الالتزام"
                value={completedDays}
                suffix=" / 7"
                animate={false}
              />
              {locked ? (
                <NutritionLockedOverlay
                  active
                  intensity="medium"
                  message="إحصائيات مقفلة — فعّل برنامجك"
                  onUnlockClick={() => openUpgrade(NUTRITION_LOCKED_REASON)}
                />
              ) : null}
            </div>
          </NutritionMotionSection>

          <NutritionMotionSection delay={0.16}>
            <section className={cn(nutritionCardClass, "relative overflow-hidden p-4")}>
              <h2 className="text-right text-[12px] font-black text-foreground">
                الالتزام اليومي
              </h2>
              <div className="mt-4 flex h-36 items-end justify-between gap-1.5 px-1">
                {week.map((day) => (
                  <div key={day.id} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-28 w-full items-end justify-center">
                      <div
                        className={cn(
                          "w-full max-w-[28px] rounded-t-xl transition-all duration-500",
                          day.isFuture ? "bg-muted" : "bg-primary",
                        )}
                        style={{
                          height: `${Math.max(day.isFuture ? 18 : day.commitmentPct, 12)}%`,
                        }}
                      />
                    </div>
                    <span className="truncate text-[9px] font-bold text-muted-foreground">
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>
              {locked ? (
                <NutritionLockedOverlay
                  active
                  intensity="strong"
                  message="الرسم البياني مقفل — فعّل برنامجك"
                  onUnlockClick={() => openUpgrade(NUTRITION_LOCKED_REASON)}
                />
              ) : null}
            </section>
          </NutritionMotionSection>

          <NutritionMotionSection delay={0.22}>
            {locked ? (
              <button
                type="button"
                onClick={() => openUpgrade(NUTRITION_LOCKED_REASON)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-cta transition active:scale-[0.98]"
              >
                <Lock className="h-4 w-4" strokeWidth={2.2} />
                فعّل البرنامج لفتح التقدم الغذائي
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-secondary-soft px-4 py-3 text-[12px] font-black text-success">
                <Trophy className="h-4 w-4" />
                أنت على الطريق الصحيح.
              </div>
            )}
          </NutritionMotionSection>
        </>
      )}
    </PlatformStack>
  );
}

function CommitmentRingLarge({ pct }: { pct: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(pct, 100) / 100);

  return (
    <div className="relative grid h-[140px] w-[140px] place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 140 140" aria-hidden>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#22C55E"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <p className="text-3xl font-black text-foreground">
        <CountUpNumber value={pct} />%
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix = "",
  animate = true,
}: {
  label: string;
  value: number;
  suffix?: string;
  animate?: boolean;
}) {
  return (
    <div className={cn(nutritionCardClass, "p-3.5 text-center")}>
      <p className="text-xl font-black text-foreground">
        {animate ? <CountUpNumber value={value} /> : value}
        {suffix ? <span className="text-sm font-bold text-muted-foreground">{suffix}</span> : null}
      </p>
      <p className="mt-1 text-[10px] font-bold text-muted-foreground">{label}</p>
    </div>
  );
}
