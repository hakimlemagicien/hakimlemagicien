import { createFileRoute } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
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
import { useMembership } from "@/hooks/useMembership";
import { useNutritionPlan, useOnlineStatus } from "@/hooks/useNutritionPlan";
import {
  SHOPPING_LIST_SEED,
  groupShoppingByCategory,
} from "@/lib/platform/nutrition-experience";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/app/nutrition/shopping")({
  head: () => ({ meta: [{ title: "قائمة التسوق | Hakim Platform" }] }),
  component: ShoppingListPage,
});

function ShoppingListPage() {
  const { features } = useMembership();
  const { openUpgrade } = useUpgradeFlow();
  const locked = !features.nutrition_plan;
  const online = useOnlineStatus();
  const plan = useNutritionPlan();
  const groups = groupShoppingByCategory(SHOPPING_LIST_SEED);
  const allIds = SHOPPING_LIST_SEED.map((item) => item.id);
  const checkedCount = allIds.filter((id) => plan.shoppingChecked[id]).length;

  return (
    <PlatformStack className="gap-3.5 pb-4">
      <NutritionOfflineBanner online={online} />
      <PlatformDetailHeader
        title="قائمة التسوق"
        subtitle={locked ? "معاينة" : `${checkedCount}/${allIds.length} عناصر`}
        backTo="/app/nutrition"
      />

      {groups.length === 0 ? (
        <NutritionEmptyState
          title="لا توجد قائمة مشتريات."
          description="ستظهر قائمة مشتريات الأسبوع هنا عند تفعيل خطتك الغذائية."
        />
      ) : (
        groups.map((group, groupIndex) => (
          <NutritionMotionSection key={group.category} delay={groupIndex * 0.05}>
            <section className={cn(nutritionCardClass, "p-3.5")}>
              <h2 className="mb-2 text-right text-[12px] font-black text-foreground">
                {group.label}
              </h2>
              <ul className="space-y-1.5">
                {group.items.map((item) => {
                  const checked = Boolean(plan.shoppingChecked[item.id]);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (locked) {
                            openUpgrade(NUTRITION_LOCKED_REASON);
                            return;
                          }
                          plan.toggleShopping(item.id);
                        }}
                        className="flex h-11 w-full items-center gap-3 rounded-2xl px-2 text-right transition active:bg-muted/40"
                        aria-pressed={checked}
                      >
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition",
                            locked
                              ? "border-primary/35 bg-primary-soft text-primary"
                              : checked
                                ? "border-primary bg-primary text-white"
                                : "border-border bg-card",
                          )}
                        >
                          {locked ? (
                            <Lock className="h-3 w-3" strokeWidth={2.4} />
                          ) : checked ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          ) : null}
                        </span>
                        <span
                          className={cn(
                            "min-w-0 flex-1 text-sm font-bold",
                            !locked && checked
                              ? "text-muted-foreground line-through"
                              : "text-foreground",
                          )}
                        >
                          {item.name}
                        </span>
                        <span className="shrink-0 text-[11px] font-bold text-muted-foreground">
                          {item.quantity}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </NutritionMotionSection>
        ))
      )}

      <button
        type="button"
        onClick={() => {
          if (locked) {
            openUpgrade(NUTRITION_LOCKED_REASON);
            return;
          }
          plan.purchaseAllShopping(allIds);
        }}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-cta transition active:scale-[0.98]"
      >
        {locked ? <Lock className="h-4 w-4" strokeWidth={2.2} /> : null}
        {locked ? "فعّل البرنامج لفتح قائمة التسوق" : "تم شراء جميع المكونات"}
      </button>
    </PlatformStack>
  );
}
