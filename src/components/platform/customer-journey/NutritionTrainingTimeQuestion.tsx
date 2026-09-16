import { LoaderCircle } from "lucide-react";
import { useCustomerJourney } from "@/hooks/useCustomerJourney";
import {
  TRAINING_MEAL_WINDOWS,
  TRAINING_MEAL_WINDOW_LABELS_AR,
  type TrainingMealWindow,
} from "@/lib/platform/customer-journey";
import { RequiredJourneyModal } from "./RequiredJourneyModal";

export function NutritionTrainingTimeQuestion() {
  const journey = useCustomerJourney();
  if (!journey.data || journey.data.grandfathered || journey.data.trainingMealWindow) return null;
  const save = (window: TrainingMealWindow) => journey.saveMealWindow.mutate(window);
  return (
    <RequiredJourneyModal
      icon={<span aria-hidden="true">⏱️</span>}
      title="متى تتمرن عادة؟"
      description="سنرتب وجبتي قبل وبعد التمرين تلقائياً في المكان الأنسب ضمن خطتك الغذائية."
    >
      <div className="grid grid-cols-2 gap-2">
        {TRAINING_MEAL_WINDOWS.map((window) => {
          const pending =
            journey.saveMealWindow.isPending && journey.saveMealWindow.variables === window;
          return (
            <button
              key={window}
              type="button"
              disabled={journey.saveMealWindow.isPending}
              onClick={() => save(window)}
              className="min-h-12 rounded-2xl border border-border bg-background px-3 text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
            >
              {pending ? (
                <LoaderCircle className="mx-auto h-4 w-4 animate-spin text-primary" />
              ) : (
                TRAINING_MEAL_WINDOW_LABELS_AR[window]
              )}
            </button>
          );
        })}
      </div>
      {journey.saveMealWindow.isError ? (
        <p className="mt-3 text-xs font-bold text-destructive">
          تعذر حفظ وقت التمرين. حاول مرة أخرى.
        </p>
      ) : null}
    </RequiredJourneyModal>
  );
}
