import { useEffect, useState } from "react";
import { Sparkles, Target, X } from "lucide-react";
import { ClientTrainingStrategySetupCard } from "@/components/platform/workout/ClientTrainingStrategySetupCard";
import type { TrainingProfileSnapshot } from "@/lib/platform/profile-api";
import {
  MISSING_GOAL_FALLBACK_DAYS,
  MISSING_GOAL_FALLBACK_ENVIRONMENT,
} from "@/lib/platform/missing-goal-fallback";
import { cn } from "@/lib/utils";

type MissingGoalPromptProps = {
  surface: "training" | "nutrition";
  training: TrainingProfileSnapshot | null | undefined;
  onCompleted: () => void | Promise<void>;
  className?: string;
};

const COPY = {
  training: {
    eyebrow: "خطة بداية مؤقتة",
    body: "نعرض لك بناء العضلات · 4 أيام · الجيم حتى تحدد هدفك.",
  },
  nutrition: {
    eyebrow: "خطة غذائية مؤقتة",
    body: "نعرض وجبات بداية متوازنة حتى تحدد هدفك الغذائي.",
  },
} as const;

export function MissingGoalPrompt({
  surface,
  training,
  onCompleted,
  className,
}: MissingGoalPromptProps) {
  const [open, setOpen] = useState(false);
  const copy = COPY[surface];

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const complete = async () => {
    await onCompleted();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-2xl border border-primary/20 bg-primary/[0.06] px-3 py-2.5 text-right shadow-sm transition active:scale-[0.99]",
          className,
        )}
        aria-haspopup="dialog"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_5px_12px_-7px_rgba(249,115,22,0.8)]">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-black text-foreground">{copy.eyebrow}</span>
          <span className="mt-0.5 block text-[10px] font-medium leading-relaxed text-muted-foreground">
            {copy.body}
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-card px-2.5 py-1 text-[10px] font-black text-primary shadow-sm">
          خصّصها
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 p-3 backdrop-blur-[4px] sm:items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="missing-goal-title"
            className="w-full max-w-md rounded-[28px] border border-white/50 bg-background p-3 shadow-2xl"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="grid h-9 w-9 place-items-center rounded-full bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 text-right">
                <div>
                  <h2 id="missing-goal-title" className="text-sm font-black text-foreground">
                    حدّد هدفك
                  </h2>
                  <p className="text-[10px] font-medium text-muted-foreground">
                    اختيار واحد لتجهيز خطتك المناسبة
                  </p>
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Target className="h-4 w-4" />
                </span>
              </div>
            </div>

            <ClientTrainingStrategySetupCard
              initialGoal={training?.goal ?? null}
              initialGoalId={training?.answers.goalId ?? null}
              initialDaysPerWeek={
                training?.answers.trainingDaysPerWeek ?? MISSING_GOAL_FALLBACK_DAYS
              }
              initialActivityLevel={training?.answers.activityLevel ?? null}
              initialEnvironment={
                training?.answers.trainingEnvironment ?? MISSING_GOAL_FALLBACK_ENVIRONMENT
              }
              initialTrainingType={training?.trainingType ?? MISSING_GOAL_FALLBACK_ENVIRONMENT}
              initialAnswers={training?.answers ?? null}
              setupBody="نستخدم إجابات الاستبيان ومكان التدريب تلقائياً، مع خطة بداية من 4 أيام. نسألك فقط عن هدفك الناقص."
              onActivated={complete}
            />
          </section>
        </div>
      ) : null}
    </>
  );
}
