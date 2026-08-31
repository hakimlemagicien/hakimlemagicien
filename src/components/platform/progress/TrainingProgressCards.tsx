import { Link } from "@tanstack/react-router";
import { Activity, RefreshCw, Target } from "lucide-react";
import { progressCardClass } from "@/components/platform/progress/ProgressShared";
import type { ClientTrainingProgressSummary } from "@/lib/platform/training-progress/types";
import { cn } from "@/lib/utils";

export function TrainingProgressCards({
  summary,
  loading,
}: {
  summary: ClientTrainingProgressSummary;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <section className={cn(progressCardClass, "p-4")} aria-busy="true" aria-label="تحميل تقدم التدريب">
        <p className="text-xs font-bold text-muted-foreground">جارٍ تحميل تقدم التدريب…</p>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      <section className={cn(progressCardClass, "space-y-2 p-4")} aria-labelledby="goal-status-title">
        <div className="flex items-start gap-2">
          <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1 text-right">
            <p className="text-[10px] font-bold text-muted-foreground">حالة الهدف</p>
            <h2 id="goal-status-title" className="text-[15px] font-black text-foreground">
              {summary.goal_card.title}
            </h2>
            {summary.goal_card.optional_detail ? (
              <p className="text-[11px] font-bold text-primary">{summary.goal_card.optional_detail}</p>
            ) : null}
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{summary.goal_card.short_reason}</p>
            <p className="mt-2 text-[11px] font-black text-foreground">{summary.goal_card.client_action}</p>
          </div>
        </div>
        <Link
          to="/app/program"
          className="mt-1 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-primary px-3 text-xs font-black text-primary-foreground"
        >
          فتح البرنامج
        </Link>
      </section>

      {summary.exercise_trends.length > 0 ? (
        <section className={cn(progressCardClass, "p-4")} aria-labelledby="training-progress-title">
          <h2 id="training-progress-title" className="text-[12px] font-black text-foreground">
            تقدم التدريب
          </h2>
          <ul className="mt-2 space-y-2">
            {summary.exercise_trends.map((item) => (
              <li key={item.external_id} className="rounded-2xl bg-muted/45 px-3 py-2.5 text-right">
                <p className="text-[12px] font-black text-foreground">{item.name_ar}</p>
                <p className="text-[11px] font-bold text-muted-foreground">
                  {item.from_label} → {item.to_label}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{item.explanation.short_reason}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {summary.regional_cards.length > 0 ? (
        <section className={cn(progressCardClass, "p-4")} aria-labelledby="regional-progress-title">
          <h2 id="regional-progress-title" className="text-[12px] font-black text-foreground">
            استجابة مناطق الهدف
          </h2>
          <ul className="mt-2 space-y-2">
            {summary.regional_cards.map((card) => (
              <li key={card.region} className="rounded-2xl bg-muted/40 px-3 py-2.5 text-right">
                <p className="text-[11px] font-black text-foreground">{card.label_ar}</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{card.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {summary.consistency ? (
        <section className={cn(progressCardClass, "p-4")} aria-labelledby="consistency-title">
          <h2 id="consistency-title" className="text-[12px] font-black text-foreground">
            الانتظام
          </h2>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{summary.consistency.summary}</p>
        </section>
      ) : null}

      {summary.recovery ? (
        <section className={cn(progressCardClass, "p-4")} aria-labelledby="recovery-title">
          <div className="flex items-start gap-2">
            <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1 text-right">
              <h2 id="recovery-title" className="text-[12px] font-black text-foreground">
                {summary.recovery.title}
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{summary.recovery.short_reason}</p>
            </div>
          </div>
        </section>
      ) : null}

      {summary.adaptations.length > 0 ? (
        <section className={cn(progressCardClass, "p-4")} aria-labelledby="adaptations-title">
          <h2 id="adaptations-title" className="text-[12px] font-black text-foreground">
            ما الذي تغيّر
          </h2>
          <ul className="mt-2 space-y-2">
            {summary.adaptations.map((item) => (
              <li key={`${item.title}-${item.short_reason}`} className="rounded-2xl bg-muted/40 px-3 py-2.5 text-right">
                <p className="text-[12px] font-black text-foreground">{item.title}</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{item.short_reason}</p>
                <p className="mt-1 text-[11px] font-bold text-foreground">{item.client_action}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {summary.nutrition_review ? (
        <section className={cn(progressCardClass, "p-4")} aria-labelledby="nutrition-review-title">
          <h2 id="nutrition-review-title" className="text-[12px] font-black text-foreground">
            {summary.nutrition_review.title}
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{summary.nutrition_review.short_reason}</p>
        </section>
      ) : null}

      {summary.body_card?.show ? (
        <section className={cn(progressCardClass, "p-4")} aria-labelledby="body-comp-title">
          <div className="flex items-start gap-2">
            <Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1 text-right">
              <h2 id="body-comp-title" className="text-[12px] font-black text-foreground">
                {summary.body_card.title}
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{summary.body_card.summary}</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
