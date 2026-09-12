import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { TRAINING_PRODUCT_COPY } from "@/lib/platform/training-product-copy";

type WorkoutMotivationCtaProps = {
  points?: number;
  freePreview?: boolean;
  onLockedClick?: () => void;
};

export function WorkoutMotivationCta({
  points = 120,
  freePreview = false,
  onLockedClick,
}: WorkoutMotivationCtaProps) {
  if (freePreview) {
    return (
      <div className="space-y-1.5 border-t border-border/45 pt-3.5 text-center">
        <button
          type="button"
          onClick={onLockedClick}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-[0_12px_28px_-10px_rgba(249,115,22,0.55)] transition-transform duration-[120ms] active:scale-[0.97]"
        >
          <Lock className="h-4 w-4" strokeWidth={2.2} />
          {TRAINING_PRODUCT_COPY.upgradeCta}
        </button>
        <p className="text-[9px] leading-snug text-muted-foreground">
          {TRAINING_PRODUCT_COPY.upgradeCtaBody}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 border-t border-border/45 pt-3.5 text-center">
      <Link
        to="/app/program/workout/exercise"
        className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-[0_12px_28px_-10px_rgba(249,115,22,0.55)] transition-transform duration-[120ms] active:scale-[0.97]"
      >
        ابدأ تحدي اليوم
      </Link>
      <p className="text-[9px] leading-snug text-muted-foreground">
        أكمل جميع تمارين الحصة اليوم لتحصل على
        <span className="font-black text-primary"> +{points} نقطة</span>
      </p>
    </div>
  );
}
