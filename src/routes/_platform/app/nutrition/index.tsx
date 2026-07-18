import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ClipboardList,
  LineChart,
  Lock,
  UtensilsCrossed,
} from "lucide-react";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { WaterCompactWidget } from "@/components/platform/water/WaterCompactWidget";
import {
  CountUpNumber,
  MealStatusIcon,
  NUTRITION_DAY_LOCKED_REASON,
  NUTRITION_LOCKED_REASON,
  NutritionDashboardSkeleton,
  NutritionEmptyState,
  NutritionErrorCard,
  NutritionHeader,
  NutritionLockedOverlay,
  NutritionMotionSection,
  NutritionOfflineBanner,
  nutritionCardClass,
  staggerContainer,
  staggerItem,
} from "@/components/platform/nutrition/NutritionShared";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useMembership } from "@/hooks/useMembership";
import { useNutritionPlan, useOnlineStatus } from "@/hooks/useNutritionPlan";
import {
  MEAL_STATUS_LABELS,
  buildCurrentWeekDays,
  isFreeUnlockedMealSlot,
  type MealStatus,
} from "@/lib/platform/nutrition-experience";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/app/nutrition/")({
  head: () => ({ meta: [{ title: "التغذية | Hakim Platform" }] }),
  component: NutritionDashboardPage,
});

function CommitmentRing({ pct }: { pct: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(pct, 100) / 100);

  return (
    <div className="relative grid h-[88px] w-[88px] place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 88 88" aria-hidden>
        <circle cx="44" cy="44" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="#F97316"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="text-center">
        <p className="text-lg font-black leading-none text-primary">
          <CountUpNumber value={pct} />%
        </p>
        <p className="mt-0.5 text-[9px] font-bold text-muted-foreground">الالتزام</p>
      </div>
    </div>
  );
}

function NutritionDashboardPage() {
  const { features } = useMembership();
  const { openUpgrade } = useUpgradeFlow();
  const freePreview = !features.nutrition_plan;
  const online = useOnlineStatus();
  const weekDays = useMemo(() => buildCurrentWeekDays(), []);
  const todayKey = weekDays.find((d) => d.isToday)?.dateKey ?? weekDays[0]!.dateKey;
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [booting, setBooting] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const plan = useNutritionPlan(selectedDateKey);
  const isSelectedToday = selectedDateKey === todayKey;
  const freeDayFullyLocked = freePreview && !isSelectedToday;
  const lockedReason = freeDayFullyLocked
    ? NUTRITION_DAY_LOCKED_REASON
    : NUTRITION_LOCKED_REASON;

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 280);
    return () => window.clearTimeout(timer);
  }, []);

  const retry = () => {
    setLoadError(false);
    setBooting(true);
    plan.refresh();
    window.setTimeout(() => setBooting(false), 280);
  };

  const caloriesLeft = Math.max(plan.goals.calories - plan.consumed.calories, 0);
  const waterLiters = (plan.waterMl / 1000).toFixed(1);

  if (booting) {
    return (
      <PlatformStack>
        <NutritionDashboardSkeleton />
      </PlatformStack>
    );
  }

  return (
    <PlatformStack className="gap-3.5 pb-2">
      <NutritionOfflineBanner online={online} />
      <NutritionHeader />

      {loadError ? (
        <NutritionErrorCard onRetry={retry} />
      ) : (
        <>
          <NutritionMotionSection delay={0.02}>
            <section className={cn(nutritionCardClass, "relative overflow-hidden p-4")}>
              <div className="flex items-center justify-between gap-3" dir="rtl">
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-[11px] font-bold text-muted-foreground">الهدف اليومي</p>
                  <p className="mt-1 text-[34px] font-black leading-none tracking-tight text-primary">
                    <CountUpNumber value={plan.goals.calories} />
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                    سعرة · متبقي{" "}
                    <span className="font-black text-foreground">{caloriesLeft}</span>
                  </p>
                </div>
                <CommitmentRing pct={plan.commitmentPct} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <MacroStat label="بروتين" value={plan.goals.protein} tone="protein" />
                <MacroStat label="كارب" value={plan.goals.carbs} tone="carbs" />
                <MacroStat label="دهون" value={plan.goals.fat} tone="fat" />
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                  style={{ width: `${plan.commitmentPct}%` }}
                />
              </div>
              <p className="mt-2.5 text-center text-[12px] font-bold text-foreground">
                {plan.motivation}
              </p>

              {freePreview ? (
                <NutritionLockedOverlay
                  active={freeDayFullyLocked}
                  intensity="light"
                  message="معاينة — فعّل برنامجك للوصول الكامل"
                  onUnlockClick={() => openUpgrade(lockedReason)}
                />
              ) : null}
            </section>
          </NutritionMotionSection>

          <NutritionMotionSection delay={0.08}>
            <section className={cn(nutritionCardClass, "p-3.5")}>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-[12px] font-black text-foreground">هذا الأسبوع</h2>
                <div className="flex items-center gap-2">
                  <Link
                    to="/app/nutrition/progress"
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary"
                  >
                    {freePreview ? <Lock className="h-3 w-3" /> : <LineChart className="h-3 w-3" />}
                    التقدم
                  </Link>
                  <Link
                    to="/app/nutrition/shopping"
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary"
                  >
                    {freePreview ? <Lock className="h-3 w-3" /> : <ClipboardList className="h-3 w-3" />}
                    التسوق
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map((day) => {
                  const selected = day.dateKey === selectedDateKey;
                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${day.shortName} ${day.dateLabel}`}
                      onClick={() => setSelectedDateKey(day.dateKey)}
                      className={cn(
                        "relative flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl transition active:scale-[0.97]",
                        selected
                          ? "bg-primary text-primary-foreground shadow-[0_8px_18px_-10px_rgba(249,115,22,0.55)]"
                          : day.isToday
                            ? "bg-primary-soft text-primary"
                            : "bg-muted/60 text-foreground",
                      )}
                    >
                      <span className="text-[8px] font-bold leading-none opacity-80">
                        {day.shortName}
                      </span>
                      <span className="text-sm font-black leading-none">{day.dateLabel}</span>
                      {freePreview && !day.isToday ? (
                        <Lock
                          className={cn(
                            "absolute bottom-1 start-1 h-2.5 w-2.5",
                            selected ? "text-primary-foreground/90" : "text-muted-foreground/80",
                          )}
                          strokeWidth={2.6}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          </NutritionMotionSection>

          <NutritionMotionSection delay={0.14}>
            <section className="space-y-2.5">
              <h2 className="px-0.5 text-[12px] font-black text-foreground">وجبات اليوم</h2>
              {plan.meals.length === 0 ? (
                <NutritionEmptyState
                  title="لا توجد وجبات اليوم."
                  description="سيتم تحديث خطتك الغذائية عند توفر برنامجك اليومي."
                />
              ) : (
                <motion.div
                  className="relative space-y-2.5"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                >
                  <div
                    aria-hidden
                    className="absolute top-4 bottom-4 end-[18px] w-px bg-gradient-to-b from-border via-border/70 to-transparent"
                  />
                  {plan.meals.map(({ slot, meal, status }) => {
                    const unlocked = isFreeUnlockedMealSlot({
                      slotId: slot.id,
                      dateKey: selectedDateKey,
                      hasNutritionPlan: !freePreview,
                      todayKey,
                    });
                    return (
                      <motion.div key={slot.id} variants={staggerItem}>
                        <MealTimelineCard
                          slotId={slot.id}
                          slotLabel={slot.slotLabel}
                          timeLabel={slot.timeLabel}
                          mealName={meal.name}
                          calories={meal.calories}
                          protein={meal.protein}
                          carbs={meal.carbs}
                          fat={meal.fat}
                          image={meal.image}
                          status={status}
                          dateKey={selectedDateKey}
                          locked={!unlocked}
                          onLockedClick={() => openUpgrade(lockedReason)}
                        />
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
              {freePreview ? (
                <p className="px-0.5 text-[9px] font-medium leading-snug text-muted-foreground">
                  {freeDayFullyLocked
                    ? "🔒 محتوى هذا اليوم للمعاينة فقط — انتقل ليوم اليوم لتجربة وجبة الفطور المجانية أو فعّل برنامجك."
                    : "🔓 وجبة الفطور متاحة اليوم — باقي الوجبات مقفلة حتى تفعّل برنامجك."}
                </p>
              ) : null}
            </section>
          </NutritionMotionSection>

          <NutritionMotionSection delay={0.2}>
            <WaterCompactWidget variant="inline" />
          </NutritionMotionSection>

          <NutritionMotionSection delay={0.26}>
            <section className={cn(nutritionCardClass, "relative overflow-hidden p-3.5")}>
              <h2 className="text-[12px] font-black text-foreground">تقدم اليوم</h2>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <TodayStat
                  label="وجبات"
                  value={`${plan.completedCount}/${plan.meals.length}`}
                />
                <TodayStat label="سعرات متبقية" value={String(caloriesLeft)} />
                <TodayStat label="ماء" value={`${waterLiters}L`} />
                <TodayStat label="التزام" value={`${plan.commitmentPct}%`} />
              </div>
              {freePreview ? (
                <NutritionLockedOverlay
                  active={freeDayFullyLocked}
                  intensity="medium"
                  message="محتوى مقفل — فعّل برنامجك"
                  onUnlockClick={() => openUpgrade(lockedReason)}
                />
              ) : null}
            </section>
          </NutritionMotionSection>
        </>
      )}
    </PlatformStack>
  );
}

function MacroStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "protein" | "carbs" | "fat";
}) {
  const toneClass =
    tone === "protein"
      ? "bg-[#E8F5E9] text-[#2E7D32]"
      : tone === "carbs"
        ? "bg-[#E3F2FD] text-[#1565C0]"
        : "bg-[#FFF8E1] text-[#B45309]";

  return (
    <div className={cn("rounded-2xl px-2 py-2.5 text-center", toneClass)}>
      <p className="text-base font-black leading-none">
        <CountUpNumber value={value} />
        <span className="text-[10px]"> غ</span>
      </p>
      <p className="mt-1 text-[9px] font-bold opacity-80">{label}</p>
    </div>
  );
}

function TodayStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/55 px-1.5 py-2">
      <p className="text-[12px] font-black text-foreground">{value}</p>
      <p className="mt-0.5 text-[8px] font-bold text-muted-foreground">{label}</p>
    </div>
  );
}

function MealTimelineCard({
  slotId,
  slotLabel,
  timeLabel,
  mealName,
  calories,
  protein,
  carbs,
  fat,
  image,
  status,
  dateKey,
  locked,
  onLockedClick,
}: {
  slotId: string;
  slotLabel: string;
  timeLabel: string;
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image: string;
  status: MealStatus;
  dateKey: string;
  locked: boolean;
  onLockedClick: () => void;
}) {
  const body = (
    <>
      <div className="relative z-[1] shrink-0">
        {locked ? (
          <span className="grid h-7 w-7 place-items-center rounded-full border border-primary/30 bg-primary-soft text-primary">
            <Lock className="h-3.5 w-3.5" strokeWidth={2.4} />
          </span>
        ) : (
          <MealStatusIcon status={status} />
        )}
      </div>

      <div className={cn("min-w-0 flex-1 text-right", locked && "opacity-75")}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold text-muted-foreground">{timeLabel}</p>
          <p className="text-[11px] font-black text-primary">{slotLabel}</p>
        </div>
        <p className="mt-0.5 truncate text-[13px] font-black leading-snug text-foreground">
          {mealName}
        </p>
        <p className="mt-1 text-[9px] font-medium text-muted-foreground">
          {calories} سعرة · ب {protein} · ك {carbs} · د {fat}
        </p>
      </div>

      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
        {image ? (
          <OptimizedImage
            src={image}
            alt=""
            width={112}
            height={112}
            className={cn("h-full w-full", locked && "opacity-45 saturate-50")}
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-muted-foreground">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
        )}
        {locked ? (
          <span className="absolute inset-0 grid place-items-center bg-black/35">
            <Lock className="h-3.5 w-3.5 text-white drop-shadow-sm" strokeWidth={2.4} />
          </span>
        ) : null}
      </div>

      {locked ? (
        <Lock className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.2} />
      ) : (
        <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/70" />
      )}
    </>
  );

  if (locked) {
    return (
      <button
        type="button"
        onClick={onLockedClick}
        aria-label={`${slotLabel}: ${mealName}. مقفلة`}
        className={cn(
          nutritionCardClass,
          "relative flex w-full items-center gap-2.5 pe-3 ps-3 py-2.5 text-right transition active:scale-[0.99] active:bg-muted/25",
        )}
      >
        {body}
      </button>
    );
  }

  return (
    <Link
      to="/app/nutrition/meal"
      search={{ mealId: slotId, date: dateKey }}
      aria-label={`${slotLabel}: ${mealName}. الحالة: ${MEAL_STATUS_LABELS[status]}`}
      className={cn(
        nutritionCardClass,
        "relative flex items-center gap-2.5 pe-3 ps-3 py-2.5 transition active:scale-[0.99]",
        status === "completed" && "opacity-90",
      )}
    >
      {body}
    </Link>
  );
}
