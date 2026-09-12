import { Lock } from "lucide-react";
import coachPoster from "@/assets/coach-hero.jpeg";
import { TRAINING_PRODUCT_COPY } from "@/lib/platform/training-product-copy";
import { FREE_TRAINING_PROMO_VIDEO_SRC } from "@/lib/platform/free-membership-v1";

export { FREE_TRAINING_PROMO_VIDEO_SRC };

type FreeTrainingPromoVideoProps = {
  className?: string;
};

export function FreeTrainingPromoVideo({ className }: FreeTrainingPromoVideoProps) {
  const posterSrc = typeof coachPoster === "string" ? coachPoster : coachPoster.src;

  return (
    <div className={className} dir="rtl">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_10px_28px_-16px_rgba(15,23,42,0.2)]">
        <div className="relative aspect-[16/10] bg-muted">
          <video
            className="h-full w-full object-cover"
            controls
            playsInline
            preload="metadata"
            poster={posterSrc}
          >
            <source src={FREE_TRAINING_PROMO_VIDEO_SRC} type="video/mp4" />
          </video>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10">
            <p className="text-[12px] font-black text-white">{TRAINING_PRODUCT_COPY.freePromoTitle}</p>
          </div>
        </div>
        <div className="space-y-1.5 p-3.5 text-right">
          <p className="text-[12px] font-bold leading-relaxed text-foreground">
            {TRAINING_PRODUCT_COPY.freePromoBody}
          </p>
        </div>
      </div>
    </div>
  );
}

type FreeSessionStructureLockProps = {
  dayLabel: string;
  muscleTitle: string;
  exerciseCount: number;
  durationMin: number;
  onUpgrade: () => void;
};

/** Structure-only day card — no exercise names, media, sets, or alternatives. */
export function FreeSessionStructureLock({
  dayLabel,
  muscleTitle,
  exerciseCount,
  durationMin,
  onUpgrade,
}: FreeSessionStructureLockProps) {
  return (
    <div className="space-y-2.5 border-t border-border/45 pt-3.5" dir="rtl">
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-[0_8px_24px_-14px_rgba(15,23,42,0.14)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 text-right">
            <p className="text-[11px] font-bold text-muted-foreground">{dayLabel}</p>
            <h3 className="mt-0.5 text-[16px] font-black text-foreground">{muscleTitle}</h3>
            <p className="mt-1 text-[12px] font-bold text-muted-foreground">
              {TRAINING_PRODUCT_COPY.freeSessionLockedBody(exerciseCount, durationMin)}
            </p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-5 w-5" strokeWidth={2.4} />
          </span>
        </div>
        <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-[11px] font-bold leading-snug text-muted-foreground">
          🔒 {TRAINING_PRODUCT_COPY.freeSessionLockedTitle}
        </p>
        <button
          type="button"
          onClick={onUpgrade}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-[0_12px_28px_-10px_rgba(249,115,22,0.55)] transition-transform duration-[120ms] active:scale-[0.97]"
        >
          {TRAINING_PRODUCT_COPY.upgradeCta}
        </button>
        <p className="mt-1.5 text-center text-[10px] font-medium text-muted-foreground">
          {TRAINING_PRODUCT_COPY.upgradeCtaBody}
        </p>
      </div>
    </div>
  );
}
