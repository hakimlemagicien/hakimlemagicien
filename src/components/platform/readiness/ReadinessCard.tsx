import { useEffect, useRef } from "react";
import { Check, ChevronLeft } from "lucide-react";
import {
  READINESS_COPY,
  shouldNudgeReadinessBadge,
  type DailyReadinessCheck,
  type ReadinessLevel,
} from "@/lib/platform/readiness";
import { cn } from "@/lib/utils";

type ReadinessCardProps = {
  record: DailyReadinessCheck | null;
  onUpdate: () => void;
  onShowAdjustments: () => void;
  onKeepPlan: () => void;
};

const LEVEL_COPY: Record<
  ReadinessLevel,
  { title: string; body: string; tone: "ready" | "balanced" | "recovery" }
> = {
  ready: { title: READINESS_COPY.readyTitle, body: READINESS_COPY.readyBody, tone: "ready" },
  balanced: {
    title: READINESS_COPY.balancedTitle,
    body: READINESS_COPY.balancedBody,
    tone: "balanced",
  },
  recovery: {
    title: READINESS_COPY.recoveryTitle,
    body: READINESS_COPY.recoveryBody,
    tone: "recovery",
  },
};

export function ReadinessCard({
  record,
  onUpdate,
  onShowAdjustments,
  onKeepPlan,
}: ReadinessCardProps) {
  const completed = record?.status === "completed" && record.level;
  const copy = completed ? LEVEL_COPY[record.level!] : null;
  const nudge = shouldNudgeReadinessBadge(record);
  const badgeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const badge = badgeRef.current;
    if (!badge || !nudge) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        badge.classList.toggle("is-nudge", Boolean(entry?.isIntersecting));
      },
      { threshold: 0.65 },
    );
    observer.observe(badge);
    return () => {
      observer.disconnect();
      badge.classList.remove("is-nudge");
    };
  }, [nudge]);

  return (
    <section className="your-day-readiness" aria-label={READINESS_COPY.cardTitle}>
      <div className="your-day-readiness__top">
        <div className="min-w-0 flex-1">
          <p className="your-day-readiness__kicker">{READINESS_COPY.cardTitle}</p>
          <p className={cn("your-day-readiness__title", copy && `is-${copy.tone}`)}>
            {copy?.title ?? "سجّل جاهزيتك اليوم"}
          </p>
          <p className="your-day-readiness__body">
            {copy?.body ?? "أخبرنا كيف تشعر لنجهز يومك بشكل أفضل."}
          </p>
        </div>
        <span
          ref={badgeRef}
          className={cn(
            "your-day-readiness__badge",
            copy ? `is-${copy.tone}` : "is-pending",
            nudge && "is-skipped",
          )}
          aria-hidden
        >
          <Check className="h-5 w-5" strokeWidth={2.6} />
        </span>
      </div>

      {copy?.tone === "recovery" ? (
        <div className="your-day-readiness__actions">
          <button type="button" className="your-day-readiness__adjust" onClick={onShowAdjustments}>
            {READINESS_COPY.showAdjustments}
          </button>
          <button type="button" className="your-day-readiness__keep" onClick={onKeepPlan}>
            {READINESS_COPY.keepPlan}
          </button>
        </div>
      ) : null}

      <button type="button" className="your-day-readiness__update" onClick={onUpdate}>
        {READINESS_COPY.update}
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
      </button>
    </section>
  );
}
