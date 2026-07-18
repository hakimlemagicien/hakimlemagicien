import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import {
  NUTRITION_LOCKED_REASON,
  NutritionEmptyState,
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
  getMealByAlternativeId,
  getTodayDateKey,
  isFreeUnlockedMealSlot,
} from "@/lib/platform/nutrition-experience";
import { cn } from "@/lib/utils";

type AlternativesSearch = {
  mealId?: string;
  date?: string;
};

export const Route = createFileRoute("/_platform/app/nutrition/alternatives")({
  head: () => ({ meta: [{ title: "بدائل الوجبة | Hakim Platform" }] }),
  validateSearch: (search: Record<string, unknown>): AlternativesSearch => ({
    mealId: typeof search.mealId === "string" ? search.mealId : "breakfast",
    date: typeof search.date === "string" ? search.date : undefined,
  }),
  component: MealAlternativesPage,
});

function MealAlternativesPage() {
  const { features } = useMembership();
  const { openUpgrade } = useUpgradeFlow();
  const freePreview = !features.nutrition_plan;
  const online = useOnlineStatus();
  const navigate = useNavigate();
  const { mealId = "breakfast", date } = Route.useSearch();
  const plan = useNutritionPlan(date);
  const slot = findMealSlot(mealId);
  const unlocked = isFreeUnlockedMealSlot({
    slotId: mealId,
    dateKey: plan.dateKey,
    hasNutritionPlan: !freePreview,
    todayKey: getTodayDateKey(),
  });

  const options = slot
    ? [slot.defaultMeal, ...slot.alternatives].filter(
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
        <p className="px-0.5 text-right text-[12px] font-bold text-muted-foreground">
          اختر أحد البدائل التالية
        </p>
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
                  openUpgrade(NUTRITION_LOCKED_REASON);
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
                  {option.calories} سعرة
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9px] font-bold">
                  <span className="rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[#2E7D32]">
                    ب {option.protein}
                  </span>
                  <span className="rounded-full bg-[#E3F2FD] px-2 py-0.5 text-[#1565C0]">
                    ك {option.carbs}
                  </span>
                  <span className="rounded-full bg-[#FFF8E1] px-2 py-0.5 text-[#B45309]">
                    د {option.fat}
                  </span>
                </div>
              </div>

              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                <OptimizedImage
                  src={option.image}
                  alt=""
                  width={128}
                  height={128}
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
            openUpgrade(NUTRITION_LOCKED_REASON);
            return;
          }
          if (!selectedId) return;
          plan.adoptAlternative(slot.id, selectedId);
          void navigate({
            to: "/app/nutrition/meal",
            search: { mealId: slot.id, date: plan.dateKey },
          });
        }}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-cta transition active:scale-[0.98]"
      >
        {!unlocked ? <Lock className="h-4 w-4" strokeWidth={2.2} /> : null}
        {unlocked ? "اعتماد هذا البديل" : "فعّل البرنامج لاعتماد البديل"}
      </button>
    </PlatformStack>
  );
}
