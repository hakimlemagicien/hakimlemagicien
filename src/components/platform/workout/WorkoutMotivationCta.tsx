import { Link } from "@tanstack/react-router";

type WorkoutMotivationCtaProps = {
  points?: number;
};

export function WorkoutMotivationCta({ points = 120 }: WorkoutMotivationCtaProps) {
  return (
    <div className="space-y-1.5 border-t border-border/45 pt-3.5 text-center">
      <Link
        to="/app/program/workout/exercise"
        data-preview-safe
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
