import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Droplets } from "lucide-react";
import { useWater } from "@/components/platform/water/WaterContext";

export function WaterUndoToast() {
  const { pendingUndo, undoLastEntry } = useWater();

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {pendingUndo ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] start-4 end-4 z-[130] mx-auto flex max-w-[390px] items-center gap-3 rounded-2xl border border-border/60 bg-card px-3 py-3 shadow-[0_12px_32px_-14px_rgba(15,23,42,0.35)]"
          role="status"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#DBEAFE] text-[#2563EB]">
            <Droplets className="h-4 w-4" />
          </span>
          <p className="min-w-0 flex-1 text-[12px] font-black text-foreground">
            تمت إضافة {pendingUndo.ml} ml
          </p>
          <button
            type="button"
            onClick={undoLastEntry}
            className="shrink-0 rounded-xl bg-muted px-3 py-2 text-[11px] font-black text-foreground"
          >
            تراجع
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function WaterGoalFeedback() {
  const { goalCelebration, dismissGoalCelebration } = useWater();

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {goalCelebration ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          className="pointer-events-none fixed inset-x-0 top-[18%] z-[140] mx-auto flex w-[min(92vw,320px)] flex-col items-center rounded-[28px] border border-[#BBF7D0] bg-[#F0FDF4]/95 px-5 py-5 text-center shadow-[0_18px_40px_-16px_rgba(34,197,94,0.45)] backdrop-blur-sm"
          role="status"
        >
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[#22C55E] text-white shadow-[0_8px_24px_-8px_rgba(34,197,94,0.65)]">
            <Check className="h-7 w-7" strokeWidth={3} />
          </span>
          <p className="mt-3 text-sm font-black text-[#166534]">✔ تم تحقيق الهدف</p>
          <p className="mt-1 text-[11px] font-medium text-[#15803D]">
            رائع! أكملت هدف الماء اليوم.
          </p>
          <button
            type="button"
            onClick={dismissGoalCelebration}
            className="pointer-events-auto mt-3 rounded-xl bg-[#22C55E] px-4 py-2 text-[11px] font-black text-white"
          >
            حسناً
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
