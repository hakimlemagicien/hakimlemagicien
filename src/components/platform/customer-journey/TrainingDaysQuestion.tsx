import { Check, LoaderCircle } from "lucide-react";
import { useCustomerJourney } from "@/hooks/useCustomerJourney";
import { TRAINING_DAY_OPTIONS, type PreferredTrainingDays } from "@/lib/platform/customer-journey";
import { RequiredJourneyModal } from "./RequiredJourneyModal";

export function TrainingDaysQuestion() {
  const journey = useCustomerJourney();
  if (!journey.data || journey.data.grandfathered || journey.data.preferredTrainingDays)
    return null;
  const save = (days: PreferredTrainingDays) => journey.saveTrainingDays.mutate(days);
  return (
    <RequiredJourneyModal
      icon={<span aria-hidden="true">🏋️</span>}
      title="كم يوماً تريد أن تتمرن في الأسبوع؟"
      description="اختر ما يناسب جدولك، وسنطابقك مع أفضل برنامج مهني متوافق مع هدفك ومستواك."
      footer={
        journey.data.phase === "needs_training_days" || journey.data.phase === "complete_setup" ? (
          <p className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
            <Check className="h-3.5 w-3.5" /> سنكمل مطابقة برنامجك فوراً بعد الاختيار.
          </p>
        ) : null
      }
    >
      <div className="grid grid-cols-5 gap-2">
        {TRAINING_DAY_OPTIONS.map((days) => {
          const pending =
            journey.saveTrainingDays.isPending && journey.saveTrainingDays.variables === days;
          return (
            <button
              key={days}
              type="button"
              disabled={journey.saveTrainingDays.isPending}
              onClick={() => save(days)}
              className="flex min-h-16 flex-col items-center justify-center rounded-2xl border border-border bg-background shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
            >
              {pending ? (
                <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <span className="text-lg font-black">{days}</span>
              )}
              <span className="text-[10px] font-bold text-muted-foreground">أيام</span>
            </button>
          );
        })}
      </div>
      {journey.saveTrainingDays.isError ? (
        <p className="mt-3 text-xs font-bold text-destructive">تعذر حفظ اختيارك. حاول مرة أخرى.</p>
      ) : null}
    </RequiredJourneyModal>
  );
}
