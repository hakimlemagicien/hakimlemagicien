import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ClipboardList,
  LineChart,
  Lock,
} from "lucide-react";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { NutritionWaterCard } from "@/components/platform/water/NutritionWaterCard";
import {
  CountUpNumber,
  MealStatusIcon,
  NutritionDashboardSkeleton,
  NutritionEmptyState,
  NutritionErrorCard,
  NutritionHeader,
  NutritionLockedOverlay,
  NutritionMealImage,
  NutritionMotionSection,
  NutritionOfflineBanner,
  nutritionCardClass,
  staggerContainer,
  staggerItem,
} from "@/components/platform/nutrition/NutritionShared";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import {
  MealSwapAllowance,
  NutritionFreeConversionBanner,
} from "@/components/platform/upgrade/upgrade-ui";
import { useMembership } from "@/hooks/useMembership";
import { useNutritionPlan, useOnlineStatus } from "@/hooks/useNutritionPlan";
import {
  isMealSlotUnlockedByEntitlements,
  mealSwapAllowanceLabel,
} from "@/lib/platform/entitlements";
import { formatNutritionNumber } from "@/lib/platform/meal-library";
import {
  MEAL_STATUS_LABELS,
  buildCurrentWeekDays,
  getTodayDateKey,
  type MealStatus,
} from "@/lib/platform/nutrition-experience";
import { cn } from "@/lib/utils";

type MacroTone = "protein" | "carbs" | "fat";

const MACRO_EMOJI: Record<MacroTone, string> = {
  protein: "🥩",
  carbs: "🍞",
  fat: "🥑",
};

export const Route = createFileRoute("/_platform/app/nutrition/")({
  head: () => ({ meta: [{ title: "التغذية | MAAKFIT" }] }),
  component: NutritionDashboardPage,
});

function CommitmentRing({ pct }: { pct: number }) {
  const size = 98;
  const radius = 39;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(pct, 100) / 100);
  const center = size / 2;

  return (
    <div className="relative grid h-[98px] w-[98px] place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#F3F4F6" strokeWidth="8" />
        <circle
          cx={center}
          cy={center}
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
        <p className="mt-0.5 text-[9px] font-bold text-muted-foreground">من المخطط</p>
      </div>
    </div>
  );
}

function NutritionDashboardPage() {
  const { entitlements } = useMembership();
  const { openUpgradeWithContext } = useUpgradeFlow();
  const freePreview = !entitlements.nutrition.fullDay;
  const online = useOnlineStatus();
  const weekDays = useMemo(() => buildCurrentWeekDays(), []);
  const todayKey = weekDays.find((d) => d.isToday)?.dateKey ?? weekDays[0]!.dateKey;
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [booting, setBooting] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const plan = useNutritionPlan(selectedDateKey, { catalogPreview: freePreview });
  const isSelectedToday = selectedDateKey === todayKey;
  const freeDayFullyLocked = freePreview && !isSelectedToday;
  const openNutritionUpgrade = () =>
    openUpgradeWithContext("NUTRITION", "الخطة الكاملة تنظّم بقية وجباتك حسب هدفك الغذائي.");
  const swapLabel = mealSwapAllowanceLabel(entitlements);

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
  const caloriePct =
    plan.goals.calories > 0
      ? Math.min(100, Math.round((plan.consumed.calories / plan.goals.calories) * 100))
      : 0;
  const nextMealId =
    plan.meals.find((item) => item.status === "current")?.slot.id ??
    plan.meals.find((item) => item.status !== "completed" && item.status !== "skipped")?.slot.id;

  if (booting || plan.runtimeLoading) {
    return (
      <PlatformStack>
        <NutritionDashboardSkeleton />
      </PlatformStack>
    );
  }

  if (plan.runtimeError) {
    return (
      <PlatformStack className="gap-3.5 pb-2">
        <NutritionHeader />
        <NutritionErrorCard onRetry={retry} />
      </PlatformStack>
    );
  }

  if (!freePreview && plan.assignmentReason && plan.assignmentReason !== "ok") {
    return (
      <PlatformStack className="gap-3.5 pb-2">
        <NutritionHeader />
        <NutritionEmptyState
          title={
            plan.assignmentReason === "scheduled"
              ? "خطتك الغذائية مجدولة ولم تبدأ بعد"
              : "لا توجد خطة غذائية مخصصة حالياً"
          }
          description="لا تُعرض مكتبة الوجبات كخطة شخصية. سيظهر يومك هنا بعد أن يعيّن المدرب الخطة."
        />
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
                <div className="min-w-0 flex-1 text-center">
                  <p className="text-[11px] font-bold text-muted-foreground">
                    {freePreview ? "معاينة المكتبة" : "مخطط اليوم من وجباتك"}
                  </p>
                  <p className="mt-1 text-[28px] font-black leading-none tracking-tight text-primary tabular-nums">
                    <CountUpNumber value={plan.goals.calories} />
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground">سعرة</p>
                </div>

                <CommitmentRing pct={caloriePct} />

                <div className="min-w-0 flex-1 text-center">
                  <p className="text-[22px] font-black leading-none text-foreground tabular-nums">
                    <CountUpNumber value={plan.consumed.calories} />
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-muted-foreground">سعرة مستهلكة</p>
                  <div className="mx-auto my-2 h-px w-12 bg-border/70" />
                  <p className="text-[22px] font-black leading-none text-foreground tabular-nums">
                    <CountUpNumber value={caloriesLeft} />
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-muted-foreground">سعرة متبقية</p>
                </div>
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
                  onUnlockClick={openNutritionUpgrade}
                />
              ) : null}
            </section>
          </NutritionMotionSection>

          <NutritionMotionSection delay={0.08}>
            <section className={cn(nutritionCardClass, "p-3.5")}>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-[13px] font-black text-foreground">هذا الأسبوع</h2>
                <div className="flex items-center gap-2">
                  <Link
                    to="/app/nutrition/progress"
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold text-primary"
                  >
                    {freePreview ? <Lock className="h-3 w-3" /> : <LineChart className="h-3 w-3" />}
                    التقدم
                  </Link>
                  <Link
                    to="/app/nutrition/shopping"
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold text-primary"
                  >
                    {freePreview ? <Lock className="h-3 w-3" /> : <ClipboardList className="h-3 w-3" />}
                    التسوق
                  </Link>
                </div>
              </div>
              <div className="relative grid grid-cols-7 gap-1.5">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-4 z-0 h-px bg-primary"
                  style={{ top: "36px" }}
                />
                {weekDays.map((day) => {
                  const selected = day.dateKey === selectedDateKey;
                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${day.shortName} ${day.dateLabel}`}
                      onClick={() => setSelectedDateKey(day.dateKey)}
                      className="relative z-[1] flex w-full flex-col items-center gap-1.5 pt-0.5 transition active:scale-[0.98]"
                    >
                      <p className="h-[10px] w-full truncate text-center text-[9px] font-bold leading-none text-muted-foreground">
                        {day.shortName}
                      </p>
                      <span className="relative z-[1] grid h-9 w-9 place-items-center">
                        <span
                          className={cn(
                            "grid place-items-center rounded-full font-black leading-none",
                            selected
                              ? "h-9 w-9 bg-primary text-[13px] text-white shadow-[0_4px_10px_-4px_rgba(249,115,22,0.7)]"
                              : "h-8 w-8 border-[1.5px] border-primary bg-card text-[12px] text-foreground",
                          )}
                        >
                          {day.dateLabel}
                        </span>
                      </span>
                      <span className="grid h-1.5 place-items-center">
                        {selected ? (
                          <span
                            aria-hidden
                            className="h-0 w-0 border-x-[4px] border-b-[5px] border-x-transparent border-b-primary"
                          />
                        ) : freePreview && !day.isToday ? (
                          <Lock className="h-2.5 w-2.5 text-muted-foreground/80" strokeWidth={2.6} />
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </NutritionMotionSection>

          <NutritionMotionSection delay={0.14}>
            <section className="space-y-2.5">
              <div className="flex items-center justify-between gap-3 px-0.5">
                <h2 className="text-[13px] font-black text-foreground">وجبات اليوم</h2>
                <div className="flex items-center gap-2">
                  {swapLabel ? <MealSwapAllowance label={swapLabel} /> : null}
                {plan.meals.length > 0 ? (
                  <Link
                    to="/app/nutrition/meal"
                    search={{
                      mealId:
                        plan.meals.find((item) => item.status !== "completed" && item.status !== "skipped")
                          ?.slot.id ?? plan.meals[0]!.slot.id,
                      date: selectedDateKey,
                    }}
                    className="inline-flex items-center rounded-full border border-primary px-2.5 py-1 text-[11px] font-bold text-primary"
                  >
                    + تسجيل وجبة
                  </Link>
                ) : null}
                </div>
              </div>
              {freePreview && isSelectedToday ? <NutritionFreeConversionBanner /> : null}
              {plan.meals.length === 0 ? (
                <NutritionEmptyState
                  title="لا توجد وجبات اليوم."
                  description="سيتم تحديث خطتك الغذائية عند توفر برنامجك اليومي."
                />
              ) : (
                <motion.div
                  className="space-y-2.5"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                >
                  {plan.meals.map(({ slot, meal, status }, mealIndex) => {
                    const unlocked = isMealSlotUnlockedByEntitlements(entitlements, {
                      slotId: slot.id,
                      slotIndex: mealIndex,
                      dateKey: selectedDateKey,
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
                          featured={slot.id === nextMealId}
                          onLockedClick={openNutritionUpgrade}
                        />
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
              {freePreview ? (
                <p className="px-0.5 text-[9px] font-medium leading-snug text-muted-foreground">
                  {freeDayFullyLocked
                    ? "🔒 محتوى هذا اليوم للمعاينة فقط — انتقل ليوم اليوم لتجربة وجبتك المجانية أو فعّل برنامجك."
                    : "🔓 وجبتك المجانية لليوم جاهزة — باقي الوجبات مقفلة حتى تفعّل خطتك الغذائية."}
                </p>
              ) : null}
            </section>
          </NutritionMotionSection>

          <NutritionMotionSection delay={0.2}>
            <NutritionWaterCard />
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
  tone: MacroTone;
}) {
  const toneClass =
    tone === "protein"
      ? "bg-[#E8F5E9] text-[#2E7D32]"
      : tone === "carbs"
        ? "bg-[#E3F2FD] text-[#1565C0]"
        : "bg-[#FFF8E1] text-[#B45309]";

  return (
    <div className={cn("flex items-center gap-2 rounded-2xl px-2.5 py-2", toneClass)}>
      <span className="text-lg leading-none" aria-hidden>
        {MACRO_EMOJI[tone]}
      </span>
      <div className="min-w-0 text-right">
        <p className="text-base font-black leading-none">
          <CountUpNumber value={value} />
          <span className="text-[10px]"> غ</span>
        </p>
        <p className="mt-0.5 text-[9px] font-bold opacity-80">{label}</p>
      </div>
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
  featured = false,
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
  featured?: boolean;
  onLockedClick: () => void;
}) {
  const imageSize = featured ? 138 : 92;

  if (locked) {
    return (
      <button
        type="button"
        onClick={onLockedClick}
        aria-label={`${slotLabel}: وجبة مقفلة. فعّل خطتك الغذائية للوصول.`}
        className={cn(
          nutritionCardClass,
          "relative flex w-full items-center gap-2.5 overflow-hidden pe-3 ps-0 py-0 text-right transition active:scale-[0.99] active:bg-muted/25",
        )}
      >
        <div
          className="relative shrink-0 overflow-hidden rounded-s-[24px] bg-gradient-to-br from-muted via-muted/80 to-muted/60"
          style={{ width: imageSize, height: imageSize }}
          aria-hidden
        >
          <span className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_8px,transparent_8px,transparent_16px)]" />
        </div>

        <div
          className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-2 text-right blur-[3px] select-none"
          aria-hidden
        >
          <div className="h-2.5 w-16 rounded-full bg-muted-foreground/25" />
          <div className="h-4 w-28 rounded-full bg-foreground/15" />
          <div className="h-2.5 w-36 rounded-full bg-muted-foreground/20" />
        </div>

        <div className="flex shrink-0 items-center gap-1 blur-[2px]" aria-hidden>
          <span className="grid h-7 w-7 place-items-center rounded-full border border-border/60 bg-muted" />
          <ChevronLeft className="h-4 w-4 text-muted-foreground/50" />
        </div>

        <NutritionLockedOverlay
          active
          asVisual
          intensity="medium"
          message="وجبة إضافية — أكمل خطتك الغذائية"
        />
      </button>
    );
  }

  const body = (
    <>
      <div
        className="relative shrink-0 overflow-hidden rounded-s-[24px] bg-muted"
        style={{ width: imageSize, height: imageSize }}
      >
        <NutritionMealImage
          src={image}
          alt={mealName}
          width={imageSize * 2}
          height={imageSize * 2}
          sizes={`${imageSize}px`}
          className="h-full w-full object-cover transition-opacity duration-300 opacity-100"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-2 text-right">
        <div className="flex items-center gap-1.5">
          <p className={cn("font-bold text-muted-foreground", featured ? "text-[11px]" : "text-[10px]")}>
            {timeLabel}
          </p>
          <p className={cn("font-black text-primary", featured ? "text-[13px]" : "text-[11px]")}>
            {slotLabel}
          </p>
        </div>
        <p
          className={cn(
            "line-clamp-2 font-black leading-snug text-foreground",
            featured ? "text-[16px]" : "text-[14px]",
          )}
        >
          {mealName}
        </p>
        <p className={cn("font-medium text-muted-foreground", featured ? "text-[11px]" : "text-[10px]")}>
          {formatNutritionNumber(calories)} سعرة · ب {formatNutritionNumber(protein)} · ك{" "}
          {formatNutritionNumber(carbs)} · د {formatNutritionNumber(fat)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <MealStatusIcon status={status} />
        <ChevronLeft className="h-4 w-4 text-muted-foreground/70" />
      </div>
    </>
  );

  return (
    <Link
      to="/app/nutrition/meal"
      search={{ mealId: slotId, date: dateKey }}
      aria-label={`${slotLabel}: ${mealName}. الحالة: ${MEAL_STATUS_LABELS[status]}`}
      className={cn(
        nutritionCardClass,
        "relative flex items-center gap-2.5 overflow-hidden pe-3 ps-0 py-0 transition active:scale-[0.99]",
        status === "completed" && "opacity-90",
      )}
    >
      {body}
    </Link>
  );
}
