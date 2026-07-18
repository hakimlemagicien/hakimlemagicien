import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import type { WeekdayId } from "@/lib/platform/weekly-workout-schedule";

type WorkoutMotivationCtaProps = {
  points?: number;
  dayId?: WeekdayId;
  freePreview?: boolean;
  /** When false on a free preview day, show upgrade-only CTA (no free chest trial). */
  freeTrialAvailable?: boolean;
  onLockedClick?: () => void;
};

export function WorkoutMotivationCta({
  points = 120,
  dayId,
  freePreview = false,
  freeTrialAvailable = true,
  onLockedClick,
}: WorkoutMotivationCtaProps) {
  if (freePreview && dayId && freeTrialAvailable) {
    return (
      <div className="space-y-1.5 border-t border-border/45 pt-3.5 text-center">
        <Link
          to="/app/program/workout/exercise"
          search={{ index: 0, day: dayId }}
          className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-[0_12px_28px_-10px_rgba(249,115,22,0.55)] transition-transform duration-[120ms] active:scale-[0.97]"
        >
          جرّب تمرين الصدر المجانية
        </Link>
        <p className="text-[9px] leading-snug text-muted-foreground">
          التمرين الأول للصدر متاح —
          <button
            type="button"
            onClick={onLockedClick}
            className="font-black text-primary underline-offset-2 hover:underline"
          >
            {" "}
            فعّل البرنامج
          </button>{" "}
          لفتح باقي تمارين الأسبوع (+{points} نقطة).
        </p>
      </div>
    );
  }

  if (freePreview && dayId && !freeTrialAvailable) {
    return (
      <div className="space-y-1.5 border-t border-border/45 pt-3.5 text-center">
        <button
          type="button"
          onClick={onLockedClick}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-primary/8 text-sm font-black text-primary shadow-[0_8px_22px_-12px_rgba(249,115,22,0.35)] transition-transform duration-[120ms] active:scale-[0.97]"
        >
          <Lock className="h-4 w-4" strokeWidth={2.2} />
          فعّل البرنامج لفتح هذا اليوم
        </button>
        <p className="text-[9px] leading-snug text-muted-foreground">
          يمكنك التنقل بين الأيام للمعاينة — التمرين المجاني متاح في يوم اليوم فقط (+{points} نقطة
          عند التفعيل).
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
