import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import {
  NUTRITION_LOCKED_REASON,
  NutritionEmptyState,
  NutritionMealImage,
  NutritionMotionSection,
  NutritionOfflineBanner,
  nutritionCardClass,
} from "@/components/platform/nutrition/NutritionShared";
import { PlatformDetailHeader } from "@/components/platform/shared/PlatformDetailHeader";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { MealSwapAllowance, PremiumAlternativeBadge } from "@/components/platform/upgrade/upgrade-ui";
import { useMembership } from "@/hooks/useMembership";
import { useNutritionPlan, useOnlineStatus } from "@/hooks/useNutritionPlan";
import {
  canRecordMealSwap,
  isMealSlotUnlockedByEntitlements,
  mealSwapAllowanceLabel,
  shouldShowPremiumAlternatives,
} from "@/lib/platform/entitlements";
import {
  getMealByAlternativeId,
  getTodayDateKey,
} from "@/lib/platform/nutrition-experience";
import { formatNutritionNumber } from "@/lib/platform/meal-library";
import { cn } from "@/lib/utils";

type AlternativesSearch = {
  mealId?: string;
  date?: string;
};

export const Route = createFileRoute("/_platform/app/nutrition/alternatives")({
  head: () => ({ meta: [{ title: "بدائل الوجبة | MAAKFIT" }] }),
  validateSearch: (search: Record<string, unknown>): AlternativesSearch => ({
    mealId: typeof search.mealId === "string" ? search.mealId : "breakfast",
    date: typeof search.date === "string" ? search.date : undefined,
  }),
  component: MealAlternativesPage,
});

function MealAlternativesPage() {
  const { entitlements } = useMembership();
  const { openUpgradeWithContext } = useUpgradeFlow();
  const freePreview = !entitlements.nutrition.fullDay;
  const online = useOnlineStatus();
  const navigate = useNavigate();
  const { mealId = "breakfast", date } = Route.useSearch();
  const plan = useNutritionPlan(date, { catalogPreview: freePreview });
  const slot = plan.meals.find((item) => item.slot.id === mealId)?.slot;
  const mealIndex = plan.meals.findIndex((item) => item.slot.id === mealId);
  const todayKey = getTodayDateKey();
  const unlocked = slot
    ? isMealSlotUnlockedByEntitlements(entitlements, {
        slotId: mealId,
        slotIndex: Math.max(mealIndex, 0),
        dateKey: plan.dateKey,
        todayKey,
      })
    : false;
  const swapLabel = mealSwapAllowanceLabel(entitlements);
  const showPremiumCopy = shouldShowPremiumAlternatives(entitlements);

  const options = slot
    ? [slot.defaultMeal, ...(showPremiumCopy ? slot.alternatives : slot.alternatives.slice(0, 1))].filter(
        (item, index, list) => list.findIndex((x) => x.id === item.id) === index,
      )
    : [];

  const currentId =
    (slot && getMealByAlternativeId(slot, plan.choices[mealId]).id) || options[0]?.id;
  const [selectedId, setSelectedId] = useState(currentId);

  if (!slot || options.length === 0) {
    return (
      <PlatformStack>
        <PlatformDetailHeader title="بدائل الوجبة" backTo="/app/nutrition" />
        <NutritionEmptyState
          title="لا توجد بدائل معتمدة."
          description="البدائل تظهر فقط للوجبات المعتمدة غذائياً ضمن خطتك."
        />
      </PlatformStack>
    );
  }

  return (
    <PlatformStack className="gap-3.5 pb-4">
      <NutritionOfflineBanner online={online} />
      <PlatformDetailHeader
        title="بدائل الوجبة"
        subtitle={slot.slotLabel}
        backTo="/app/nutrition"
      />

      <NutritionMotionSection>
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <p className="text-right text-[12px] font-bold text-muted-foreground">
            {showPremiumCopy ? "اختر البديل المناسب لك" : "اختر أحد البدائل التالية"}
          </p>
          {swapLabel ? <MealSwapAllowance label={swapLabel} /> : null}
          {showPremiumCopy ? <PremiumAlternativeBadge /> : null}
        </div>
      </NutritionMotionSection>

      <div className="space-y-2.5">
        {options.map((option, index) => {
          const selected = option.id === selectedId;
          return (
            <motion.button
              key={option.id}
              type="button"
              onClick={() => {
                if (!unlocked) {
                  openUpgradeWithContext("NUTRITION", "أكمل خطتك الغذائية لفتح البدائل.");
                  return;
                }
                setSelectedId(option.id);
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className={cn(
                nutritionCardClass,
                "relative flex w-full items-center gap-3 p-3 text-right transition active:scale-[0.99]",
                selected && unlocked && "border-primary/40 ring-2 ring-primary/20",
                !unlocked && "opacity-90",
              )}
            >
              {option.bestChoice ? (
                <span className="absolute start-3 top-3 rounded-full bg-secondary px-2 py-0.5 text-[9px] font-black text-white">
                  الأفضل
                </span>
              ) : null}

              {!unlocked ? (
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                  <Lock className="h-3 w-3" strokeWidth={2.4} />
                </span>
              ) : (
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                    selected ? "border-primary bg-primary" : "border-border bg-card",
                  )}
                  aria-hidden
                >
                  {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-black leading-snug text-foreground">
                  {option.name}
                </p>
                <p className="mt-0.5 text-[11px] font-bold text-primary">
                  {formatNutritionNumber(option.calories)} سعرة
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9px] font-bold">
                  <span className="rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[#2E7D32]">
                    ب {formatNutritionNumber(option.protein)}
                  </span>
                  <span className="rounded-full bg-[#E3F2FD] px-2 py-0.5 text-[#1565C0]">
                    ك {formatNutritionNumber(option.carbs)}
                  </span>
                  <span className="rounded-full bg-[#FFF8E1] px-2 py-0.5 text-[#B45309]">
                    د {formatNutritionNumber(option.fat)}
                  </span>
                </div>
              </div>

              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                <NutritionMealImage
                  src={option.image}
                  alt=""
                  width={128}
                  height={128}
                  sizes="64px"
                  className={cn("h-full w-full", !unlocked && "opacity-50 saturate-50")}
                />
                {!unlocked ? (
                  <span className="absolute inset-0 grid place-items-center bg-black/30">
                    <Lock className="h-3.5 w-3.5 text-white" strokeWidth={2.4} />
                  </span>
                ) : null}
              </div>
            </motion.button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          if (!unlocked) {
            openUpgradeWithContext("NUTRITION", "أكمل خطتك الغذائية لفتح البدائل.");
            return;
          }
          if (!canRecordMealSwap(entitlements)) {
            openUpgradeWithContext(
              "SWAP_LIMIT",
              "Premium يمنحك مرونة أكبر في تغيير الوجبات وبدائل متعددة.",
            );
            return;
          }
          if (!selectedId) return;
          void plan.adoptAlternative(slot.id, selectedId).then(() => {
            void navigate({
              to: "/app/nutrition/meal",
              search: { mealId: slot.id, date: plan.dateKey },
            });
          }).catch((error: Error & { code?: string }) => {
            if (error.code === "daily_meal_swap_limit_reached") {
              openUpgradeWithContext(
                "SWAP_LIMIT",
                "Premium يمنحك مرونة أكبر في تغيير الوجبات.",
              );
            }
          });
        }}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-cta transition active:scale-[0.98]"
      >
        {!unlocked ? <Lock className="h-4 w-4" strokeWidth={2.2} /> : null}
        {unlocked ? "اعتماد هذا البديل" : "عرض الباقات"}
      </button>
    </PlatformStack>
  );
}
