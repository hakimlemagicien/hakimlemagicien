import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, MoreVertical } from "lucide-react";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import {
  CountUpNumber,
  NUTRITION_DAY_LOCKED_REASON,
  NUTRITION_LOCKED_REASON,
  NutritionEmptyState,
  NutritionLockedOverlay,
  NutritionMotionSection,
  NutritionOfflineBanner,
  nutritionCardClass,
} from "@/components/platform/nutrition/NutritionShared";
import { PlatformDetailHeader } from "@/components/platform/shared/PlatformDetailHeader";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useMembership } from "@/hooks/useMembership";
import { useNutritionPlan, useOnlineStatus } from "@/hooks/useNutritionPlan";
import {
  findMealSlot,
  getTodayDateKey,
  isFreeUnlockedMealSlot,
} from "@/lib/platform/nutrition-experience";
import { cn } from "@/lib/utils";

type MealSearch = {
  mealId?: string;
  date?: string;
};

export const Route = createFileRoute("/_platform/app/nutrition/meal")({
  head: () => ({ meta: [{ title: "تفاصيل الوجبة | Hakim Platform" }] }),
  validateSearch: (search: Record<string, unknown>): MealSearch => ({
    mealId: typeof search.mealId === "string" ? search.mealId : "breakfast",
    date: typeof search.date === "string" ? search.date : undefined,
  }),
  component: MealDetailsPage,
});

function MealDetailsPage() {
  const { features } = useMembership();
  const { openUpgrade } = useUpgradeFlow();
  const freePreview = !features.nutrition_plan;
  const online = useOnlineStatus();
  const { mealId = "breakfast", date } = Route.useSearch();
  const plan = useNutritionPlan(date);
  const slot = findMealSlot(mealId);
  const entry = plan.meals.find((item) => item.slot.id === mealId);
  const unlocked = isFreeUnlockedMealSlot({
    slotId: mealId,
    dateKey: plan.dateKey,
    hasNutritionPlan: !freePreview,
    todayKey: getTodayDateKey(),
  });
  const lockedReason =
    plan.dateKey === getTodayDateKey()
      ? NUTRITION_LOCKED_REASON
      : NUTRITION_DAY_LOCKED_REASON;

  if (!slot || !entry) {
    return (
      <PlatformStack>
        <PlatformDetailHeader title="تفاصيل الوجبة" backTo="/app/nutrition" />
        <NutritionEmptyState
          title="لا توجد وجبات اليوم."
          description="عد إلى لوحة التغذية لاختيار وجبة من خطتك اليومية."
        />
      </PlatformStack>
    );
  }

  const { meal, status } = entry;
  const isCompleted = status === "completed";

  return (
    <PlatformStack className="gap-3.5 pb-4">
      <NutritionOfflineBanner online={online} />
      <PlatformDetailHeader
        title="تفاصيل الوجبة"
        subtitle={slot.timeLabel}
        backTo="/app/nutrition"
        action={
          <button
            type="button"
            aria-label="المزيد"
            className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-card"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        }
      />

      <NutritionMotionSection>
        <div className={cn(nutritionCardClass, "relative overflow-hidden")}>
          <div className="relative h-[210px] w-full bg-muted">
            <OptimizedImage
              src={meal.image}
              alt={meal.name}
              width={780}
              height={420}
              priority
              className={cn("h-full w-full", !unlocked && "opacity-70 saturate-75")}
            />
            {!unlocked ? (
              <span className="absolute inset-0 grid place-items-center bg-black/25">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-primary shadow-sm">
                  <Lock className="h-5 w-5" strokeWidth={2.3} />
                </span>
              </span>
            ) : null}
          </div>
          <div className="space-y-3 p-4 text-right">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground">
                {slot.slotLabel} · {slot.timeLabel}
              </p>
              <h2 className="mt-1 text-[18px] font-black leading-snug text-foreground">
                {meal.name}
              </h2>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <MacroBox label="سعرات" value={meal.calories} unit="" tone="calories" />
              <MacroBox label="بروتين" value={meal.protein} unit="غ" tone="protein" />
              <MacroBox label="كارب" value={meal.carbs} unit="غ" tone="carbs" />
              <MacroBox label="دهون" value={meal.fat} unit="غ" tone="fat" />
            </div>
          </div>
        </div>
      </NutritionMotionSection>

      <NutritionMotionSection delay={0.08}>
        <section className={cn(nutritionCardClass, "relative overflow-hidden p-4 text-right")}>
          <h3 className="text-sm font-black text-foreground">المكونات</h3>
          <ul className="mt-3 space-y-2.5">
            {meal.ingredients.map((ingredient) => (
              <li
                key={ingredient.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-2 text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {ingredient.name}
                </span>
                <span className="font-bold text-muted-foreground">{ingredient.amount}</span>
              </li>
            ))}
          </ul>
          {!unlocked ? (
            <NutritionLockedOverlay
              active
              intensity="medium"
              message="مكونات مقفلة — فعّل برنامجك"
              onUnlockClick={() => openUpgrade(lockedReason)}
            />
          ) : null}
        </section>
      </NutritionMotionSection>

      <NutritionMotionSection delay={0.14}>
        <section className={cn(nutritionCardClass, "relative overflow-hidden p-4 text-right")}>
          <h3 className="text-sm font-black text-foreground">طريقة التحضير</h3>
          <ol className="mt-3 space-y-3">
            {meal.steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary-soft text-xs font-black text-success">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-foreground">{step}</p>
              </li>
            ))}
          </ol>
          {!unlocked ? (
            <NutritionLockedOverlay
              active
              intensity="strong"
              message="طريقة التحضير مقفلة — فعّل برنامجك"
              onUnlockClick={() => openUpgrade(lockedReason)}
            />
          ) : null}
        </section>
      </NutritionMotionSection>

      <NutritionMotionSection delay={0.2} className="space-y-2.5">
        {unlocked ? (
          <>
            <button
              type="button"
              disabled={isCompleted}
              onClick={() => plan.markCompleted(slot.id)}
              className={cn(
                "flex h-12 w-full items-center justify-center rounded-2xl text-sm font-black shadow-cta transition active:scale-[0.98]",
                isCompleted
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {isCompleted ? "تم تسجيل الوجبة ✓" : "تم تناول الوجبة"}
            </button>
            <Link
              to="/app/nutrition/alternatives"
              search={{ mealId: slot.id, date: plan.dateKey }}
              className="flex h-12 w-full items-center justify-center rounded-2xl border border-primary/30 bg-card text-sm font-black text-primary transition active:scale-[0.98]"
            >
              استبدال الوجبة
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => openUpgrade(lockedReason)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-cta transition active:scale-[0.98]"
            >
              <Lock className="h-4 w-4" strokeWidth={2.2} />
              فعّل البرنامج لتسجيل الوجبة
            </button>
            <button
              type="button"
              onClick={() => openUpgrade(lockedReason)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-card text-sm font-black text-primary transition active:scale-[0.98]"
            >
              <Lock className="h-4 w-4" strokeWidth={2.2} />
              استبدال الوجبة
            </button>
          </>
        )}
        {!unlocked ? (
          <p className="text-center text-[9px] font-medium text-muted-foreground">
            🔓 وجبة الفطور ليوم اليوم متاحة مجاناً — باقي الوجبات تحتاج تفعيل البرنامج.
          </p>
        ) : null}
      </NutritionMotionSection>
    </PlatformStack>
  );
}

function MacroBox({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  tone: "calories" | "protein" | "carbs" | "fat";
}) {
  const toneClass =
    tone === "calories"
      ? "bg-primary-soft text-primary"
      : tone === "protein"
        ? "bg-[#E8F5E9] text-[#2E7D32]"
        : tone === "carbs"
          ? "bg-[#E3F2FD] text-[#1565C0]"
          : "bg-[#FFF8E1] text-[#B45309]";

  return (
    <div className={cn("rounded-2xl px-1.5 py-2.5 text-center", toneClass)}>
      <p className="text-sm font-black leading-none">
        <CountUpNumber value={value} />
        {unit ? <span className="text-[9px]"> {unit}</span> : null}
      </p>
      <p className="mt-1 text-[9px] font-bold opacity-80">{label}</p>
    </div>
  );
}
