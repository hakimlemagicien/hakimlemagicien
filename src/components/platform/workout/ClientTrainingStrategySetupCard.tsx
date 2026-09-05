import { useEffect, useRef, useState } from "react";
import {
  assessClientStrategySetupGaps,
  CLIENT_DEFAULT_TRAINING_ENVIRONMENT,
  CLIENT_GOAL_PICKER_OPTIONS,
  saveMyTrainingStrategySetup,
} from "@/lib/platform/client-training-strategy-setup";
import { CLIENT_DEFAULT_TRAINING_DAYS_PER_WEEK } from "@/lib/platform/strategy-matrix/quiz-strategy-bridge";
import { TRAINING_PRODUCT_COPY } from "@/lib/platform/training-product-copy";
import type { TrainingV2CanonicalGoal } from "@/lib/platform/training-v2-contracts";

type Props = {
  initialGoal?: string | null;
  initialGoalId?: string | null;
  initialDaysPerWeek?: number | null;
  initialActivityLevel?: string | null;
  initialEnvironment?: string | null;
  initialTrainingType?: string | null;
  initialLocationPreference?: string | null;
  /** Full quiz/training answers pack — preferred over individual fields when present. */
  initialAnswers?: Record<string, unknown> | null;
  onActivated: () => void | Promise<void>;
};

export function ClientTrainingStrategySetupCard({
  initialGoal,
  initialGoalId,
  initialDaysPerWeek,
  initialActivityLevel,
  initialEnvironment,
  initialTrainingType,
  initialLocationPreference,
  initialAnswers,
  onActivated,
}: Props) {
  const gaps = assessClientStrategySetupGaps({
    goal: initialGoal,
    goalId: initialGoalId ?? initialGoal,
    trainingDaysPerWeek: initialDaysPerWeek,
    activityLevel: initialActivityLevel,
    trainingEnvironment: initialEnvironment,
    trainingType: initialTrainingType,
    locationPreference: initialLocationPreference,
    answers: {
      ...(initialAnswers ?? {}),
      goalId: initialGoalId ?? initialGoal ?? (initialAnswers?.goalId as string | undefined) ?? null,
      activityLevel:
        initialActivityLevel ?? (initialAnswers?.activityLevel as string | undefined) ?? null,
      trainingEnvironment:
        initialEnvironment ?? (initialAnswers?.trainingEnvironment as string | undefined) ?? null,
      trainingDaysPerWeek:
        initialDaysPerWeek ?? (initialAnswers?.trainingDaysPerWeek as number | undefined) ?? null,
    },
  });

  const [goal, setGoal] = useState<TrainingV2CanonicalGoal | "">(gaps.resolvedGoal ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoStarted = useRef(false);

  const submit = (nextGoal?: TrainingV2CanonicalGoal) => {
    const selectedGoal = nextGoal ?? goal;
    if (!selectedGoal) {
      setError("اختر هدفك التدريبي أولاً.");
      return;
    }
    setSaving(true);
    setError(null);
    void saveMyTrainingStrategySetup({
      goal: selectedGoal,
      trainingDaysPerWeek: gaps.resolvedDays ?? CLIENT_DEFAULT_TRAINING_DAYS_PER_WEEK,
      trainingEnvironment: gaps.resolvedEnvironment ?? CLIENT_DEFAULT_TRAINING_ENVIRONMENT,
    })
      .then(async () => {
        await onActivated();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "تعذر حفظ بيانات التدريب.");
      })
      .finally(() => setSaving(false));
  };

  useEffect(() => {
    if (!gaps.isComplete || autoStarted.current) return;
    if (!gaps.resolvedGoal) return;
    autoStarted.current = true;
    submit(gaps.resolvedGoal);
    // Intentional: auto-activate once when quiz goal is ready — never re-ask days/place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gaps.isComplete]);

  if (gaps.isComplete) {
    return (
      <section className="platform-card space-y-2 rounded-3xl p-4 text-center">
        <p className="text-sm font-black text-foreground">{TRAINING_PRODUCT_COPY.paidAutoAssignLoading}</p>
        <p className="text-xs text-muted-foreground">نستخدم إجاباتك من الاستبيان لتفعيل برنامجك…</p>
        {error ? (
          <p className="text-[11px] font-bold text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    );
  }

  // Rare fallback: quiz goal missing/unmapped — ask goal only, never days or place.
  return (
    <section className="platform-card space-y-3 rounded-3xl p-4 text-center">
      <p className="text-sm font-black text-foreground">{TRAINING_PRODUCT_COPY.strategySetupTitle}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {TRAINING_PRODUCT_COPY.strategySetupBody}
      </p>

      {gaps.needGoal ? (
        <label className="block text-right">
          <span className="mb-1 block text-[11px] font-bold text-muted-foreground">الهدف</span>
          <select
            value={goal}
            onChange={(event) => setGoal(event.target.value as TrainingV2CanonicalGoal | "")}
            className="min-h-11 w-full rounded-xl border border-border/70 bg-background px-3 text-sm font-bold text-foreground"
          >
            <option value="">اختر هدفك</option>
            {CLIENT_GOAL_PICKER_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.labelAr}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {error ? (
        <p className="text-[11px] font-bold text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={saving}
        onClick={() => submit()}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground disabled:opacity-60"
      >
        {saving ? TRAINING_PRODUCT_COPY.strategySetupSaving : TRAINING_PRODUCT_COPY.strategySetupCta}
      </button>
    </section>
  );
}
