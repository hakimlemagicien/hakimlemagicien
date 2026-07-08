import { createFileRoute } from "@tanstack/react-router";
import { Flame, UtensilsCrossed } from "lucide-react";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { PlatformDetailHeader } from "@/components/platform/shared/PlatformDetailHeader";
import { PreviewGate } from "@/components/platform/shared/PreviewGate";
import { useMembership } from "@/hooks/useMembership";
import { MEAL_DETAIL_SEED } from "@/lib/platform/seed-content";

export const Route = createFileRoute("/_platform/app/nutrition/meal")({
  head: () => ({ meta: [{ title: "تفاصيل الوجبة | Hakim Platform" }] }),
  component: MealDetailsPage,
});

function MealDetailsPage() {
  const { features } = useMembership();
  const meal = MEAL_DETAIL_SEED;
  const previewOnly = !features.nutrition_plan;

  return (
    <PreviewGate
      active={previewOnly}
      reason="هذه معاينة لتفاصيل الوجبة. فعّل برنامجك الآن للاستفادة من خطتك الغذائية."
    >
      <PlatformStack>
        <PlatformDetailHeader title={meal.name} subtitle={meal.meta} backTo="/app/nutrition" />

        <div className="relative flex h-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted shadow-card">
          <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
          <span className="absolute bottom-3 start-3 flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-xs font-bold text-white">
            <Flame className="h-3.5 w-3.5" />
            {meal.kcal} سعرة
          </span>
        </div>

        <div className="flex items-stretch gap-2">
          {meal.macros.map((macro) => (
            <div
              key={macro.id}
              className="platform-card flex flex-1 flex-col items-center gap-1 p-3 text-center"
            >
              <p className="text-sm font-black text-foreground">{macro.value}</p>
              <p className="text-xs text-muted-foreground">{macro.label}</p>
            </div>
          ))}
        </div>

        <section className="platform-card p-4">
          <h2 className="text-sm font-black text-foreground">المكونات</h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {meal.ingredients.map((ingredient) => (
              <li key={ingredient.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {ingredient.name}
                </span>
                <span className="font-bold text-muted-foreground">{ingredient.amount}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="platform-card p-4">
          <h2 className="text-sm font-black text-foreground">طريقة التحضير</h2>
          <ol className="mt-3 flex flex-col gap-3">
            {meal.steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary-soft text-xs font-black text-success">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </PlatformStack>
    </PreviewGate>
  );
}
