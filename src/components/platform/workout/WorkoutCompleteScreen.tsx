import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Droplets, Flame, Star, Timer } from "lucide-react";
import { useWaterOptional } from "@/components/platform/water/WaterContext";
import type { WorkoutPlayerState } from "@/hooks/useWorkoutPlayer";

type WorkoutCompleteScreenProps = {
  player: WorkoutPlayerState;
};

export function WorkoutCompleteScreen({ player }: WorkoutCompleteScreenProps) {
  const { phase, meta, resetSession } = player;
  const water = useWaterOptional();
  const open = phase === "complete";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-white/95 px-5"
          dir="rtl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm text-center"
          >
            <p className="text-4xl">🎉</p>
            <h2 className="mt-3 text-2xl font-black text-foreground">أحسنت</h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">لقد أكملت حصة اليوم</p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-border/60 bg-card p-3">
                <Timer className="mx-auto h-4 w-4 text-primary" />
                <p className="mt-1 text-sm font-black text-foreground">{meta.durationMin}</p>
                <p className="text-[9px] text-muted-foreground">دقيقة</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card p-3">
                <Flame className="mx-auto h-4 w-4 text-primary" />
                <p className="mt-1 text-sm font-black text-foreground">{meta.calories}</p>
                <p className="text-[9px] text-muted-foreground">سعر حراري</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card p-3">
                <Star className="mx-auto h-4 w-4 fill-amber-400 text-amber-500" />
                <p className="mt-1 text-sm font-black text-foreground">+{meta.points}</p>
                <p className="text-[9px] text-muted-foreground">نقطة</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-2xl border border-[#22C55E]/25 bg-[#F0FAF4] p-3 text-right">
              <p className="text-xs font-bold text-[#2E7D32]">
                سلسلة الإنجاز: {meta.streakDays} أيام متتالية
              </p>
              <p className="text-[11px] font-medium text-[#2E7D32]/85">التحدي اليومي مكتمل ✓</p>
            </div>

            {water ? (
              <div className="mt-4 rounded-2xl border border-[#BFDBFE]/70 bg-[#EFF6FF] p-3 text-right">
                <p className="text-xs font-bold text-[#1E3A8A]">هل شربت الماء بعد التمرين؟</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void water.registerWater(250)}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] px-3 text-xs font-black text-white transition active:scale-[0.98]"
                  >
                    <Droplets className="h-4 w-4" />
                    +250 مل
                  </button>
                  <button
                    type="button"
                    onClick={water.openWaterSheet}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[#BFDBFE] bg-white px-3 text-xs font-bold text-[#1E3A8A] transition active:scale-[0.98]"
                  >
                    خيارات الماء
                  </button>
                </div>
              </div>
            ) : null}

            <Link
              to="/app/program/workout"
              onClick={resetSession}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground transition-transform duration-[120ms] active:scale-[0.97]"
            >
              العودة إلى التمارين
            </Link>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
