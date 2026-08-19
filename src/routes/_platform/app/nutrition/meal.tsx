import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Lock, MoreVertical, Sparkles } from "lucide-react";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import {
  NUTRITION_DAY_LOCKED_REASON,
  NUTRITION_LOCKED_REASON,
  NutritionEmptyState,
  NutritionLockedOverlay,
  NutritionMealImage,
  NutritionMotionSection,
  NutritionOfflineBanner,
  nutritionCardClass,
} from "@/components/platform/nutrition/NutritionShared";
import { PlatformDetailHeader } from "@/components/platform/shared/PlatformDetailHeader";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { useMembership } from "@/hooks/useMembership";
import { useNutritionPlan, useOnlineStatus } from "@/hooks/useNutritionPlan";
import {
  allergenLabel,
  formatMealAmount,
  formatNutritionNumber,
} from "@/lib/platform/meal-library";
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
            <NutritionMealImage
              src={meal.coverImage ?? meal.image}
              alt={meal.name}
              width={780}
              height={420}
              sizes="(max-width: 430px) 100vw, 390px"
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

            {meal.servingSize && meal.servingUnit ? (
              <p className="text-[11px] font-bold text-muted-foreground">
                الحصة: {formatMealAmount(meal.servingSize, meal.servingUnit)}
                {meal.preparationTimeMinutes
                  ? ` · التحضير ${meal.preparationTimeMinutes} د`
                  : ""}
              </p>
            ) : null}

            {meal.allergens && meal.allergens.length > 0 ? (
              <div className="flex flex-wrap justify-end gap-1.5">
                {meal.allergens.map((allergen) => (
                  <span
                    key={allergen}
                    className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground"
                  >
                    {allergenLabel(allergen)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </NutritionMotionSection>

      {meal.ingredients.length > 0 ? (
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
      ) : null}

      {meal.steps.length > 0 ? (
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
      ) : null}

      <NutritionMotionSection delay={0.2} className="space-y-2.5">
        {unlocked ? (
          <>
            <MealLogButton
              completed={isCompleted}
              onLog={() => plan.markCompleted(slot.id)}
            />
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

function MealLogButton({
  completed,
  onLog,
}: {
  completed: boolean;
  onLog: () => void;
}) {
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!opening) return;
    const timer = window.setTimeout(() => setOpening(false), 1100);
    return () => window.clearTimeout(timer);
  }, [opening]);

  return (
    <button
      type="button"
      disabled={completed}
      onClick={() => {
        if (completed) return;
        onLog();
        setOpening(true);
      }}
      className={cn(
        "meal-log-cta flex h-12 w-full items-center justify-center rounded-2xl text-sm font-black shadow-cta transition active:scale-[0.98]",
        completed ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground",
        opening && "is-opening",
      )}
    >
      <span aria-hidden className="meal-log-cta__glow" />
      <span aria-hidden className="meal-log-cta__lid" />
      {MEAL_LOG_CONFETTI.map((piece) => (
        <span
          key={piece.id}
          aria-hidden
          className="meal-log-cta__piece"
          style={{
            background: piece.color,
            borderRadius: piece.round ? "999px" : "2px",
            animationDelay: `${piece.delay}s`,
            ["--dx" as string]: piece.dx,
            ["--dy" as string]: piece.dy,
            ["--rot" as string]: piece.rot,
          }}
        />
      ))}
      <span className="relative z-[1] inline-flex items-center gap-1.5">
        {completed ? (
          <>
            <Check className={cn("h-4 w-4", opening && "meal-log-cta__check")} strokeWidth={3} />
            تم تسجيل الوجبة
            {opening ? <Sparkles className="h-4 w-4 text-amber-200" strokeWidth={2.4} /> : null}
          </>
        ) : (
          "تم تناول الوجبة"
        )}
      </span>
    </button>
  );
}

const MEAL_LOG_CONFETTI = [
  { id: 1, color: "#F97316", dx: "-52px", dy: "-58px", rot: "-140deg", delay: 0, round: false },
  { id: 2, color: "#FBBF24", dx: "-18px", dy: "-72px", rot: "80deg", delay: 0.04, round: true },
  { id: 3, color: "#22C55E", dx: "28px", dy: "-68px", rot: "160deg", delay: 0.08, round: false },
  { id: 4, color: "#FFFFFF", dx: "56px", dy: "-50px", rot: "40deg", delay: 0.05, round: true },
  { id: 5, color: "#F97316", dx: "-64px", dy: "-22px", rot: "-80deg", delay: 0.1, round: true },
  { id: 6, color: "#FBBF24", dx: "68px", dy: "-18px", rot: "210deg", delay: 0.12, round: false },
  { id: 7, color: "#22C55E", dx: "-36px", dy: "-40px", rot: "120deg", delay: 0.02, round: false },
  { id: 8, color: "#FFEDD5", dx: "12px", dy: "-78px", rot: "-40deg", delay: 0.14, round: true },
  { id: 9, color: "#F97316", dx: "42px", dy: "-36px", rot: "90deg", delay: 0.07, round: false },
  { id: 10, color: "#86EFAC", dx: "-8px", dy: "-54px", rot: "-200deg", delay: 0.16, round: true },
] as const;

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
        {formatNutritionNumber(value)}
        {unit ? <span className="text-[9px]"> {unit}</span> : null}
      </p>
      <p className="mt-1 text-[9px] font-bold opacity-80">{label}</p>
    </div>
  );
}
