import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { WorkoutPlayerState } from "@/hooks/useWorkoutPlayer";
import { formatRestTime } from "@/lib/platform/workout-session";

type RestOverlayProps = {
  player: WorkoutPlayerState;
};

export function RestOverlay({ player }: RestOverlayProps) {
  const {
    phase,
    restSecondsLeft,
    restTotalSeconds,
    nextExercise,
    currentExercise,
    skipRest,
    addRestTime,
  } = player;

  const open = phase === "rest";
  const progress =
    restTotalSeconds > 0 ? ((restTotalSeconds - restSecondsLeft) / restTotalSeconds) * 100 : 0;
  const upcoming = nextExercise ?? currentExercise;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-6"
          dir="rtl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm rounded-[28px] bg-card p-5 text-center shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]"
          >
            <p className="text-sm font-bold text-muted-foreground">راحة</p>

            <div className="relative mx-auto mt-4 grid h-36 w-36 place-items-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="8" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="currentColor"
                  className="text-primary transition-all duration-500"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                />
              </svg>
              <p className="text-3xl font-black tracking-tight text-foreground">
                {formatRestTime(restSecondsLeft)}
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-border/60 bg-muted/20 p-3 text-right">
              <p className="text-[10px] font-bold text-muted-foreground">التمرين القادم</p>
              <div className="mt-2 flex items-center gap-2.5">
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-border/50">
                  <img
                    src={upcoming.thumbnail}
                    alt={upcoming.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-foreground">{upcoming.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {upcoming.sets} مجموعات × {upcoming.reps} تكرار
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={skipRest}
                className="flex h-11 items-center justify-center rounded-2xl border border-border/70 bg-card text-xs font-bold text-foreground transition-transform duration-[120ms] active:scale-[0.97]"
              >
                تخطي الراحة
              </button>
              <button
                type="button"
                onClick={addRestTime}
                className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl bg-primary/10 text-xs font-bold text-primary transition-transform duration-[120ms] active:scale-[0.97]"
              >
                <Plus className="h-3.5 w-3.5" />
                إضافة 30 ثانية
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
