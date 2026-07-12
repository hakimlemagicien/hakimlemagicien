import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import type { WorkoutPlayerState } from "@/hooks/useWorkoutPlayer";
import { cn } from "@/lib/utils";

type SetLogBottomSheetProps = {
  player: WorkoutPlayerState;
};

function StepperButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-xl border border-border/70 bg-card text-foreground shadow-sm transition-transform duration-[120ms] active:scale-95"
    >
      {children}
    </button>
  );
}

export function SetLogBottomSheet({ player }: SetLogBottomSheetProps) {
  const {
    phase,
    currentExercise,
    currentSetNumber,
    setDraft,
    setSetDraft,
    effortLabels,
    closeSetSheet,
    saveSet,
  } = player;

  const open = phase === "set-sheet";

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="إغلاق"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={closeSetSheet}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex h-[70dvh] max-w-[var(--platform-frame-w)] flex-col rounded-t-[28px] border border-border/60 bg-card shadow-[0_-20px_50px_-20px_rgba(15,23,42,0.35)]"
            dir="rtl"
          >
            <div className="flex justify-center pt-2">
              <span className="h-1 w-10 rounded-full bg-border" />
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-3">
              <div className="text-center">
                <p className="text-xs font-bold text-muted-foreground">المجموعة</p>
                <p className="mt-0.5 text-lg font-black text-foreground">
                  {currentSetNumber} من {currentExercise.sets}
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-center text-xs font-bold text-muted-foreground">الوزن (كجم)</p>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <StepperButton
                    label="تقليل الوزن"
                    onClick={() =>
                      setSetDraft((draft) => ({
                        ...draft,
                        weightKg: Math.max(0, draft.weightKg - 2.5),
                      }))
                    }
                  >
                    <Minus className="h-4 w-4" />
                  </StepperButton>
                  <p className="min-w-[72px] text-center text-2xl font-black text-foreground">
                    {setDraft.weightKg}
                  </p>
                  <StepperButton
                    label="زيادة الوزن"
                    onClick={() =>
                      setSetDraft((draft) => ({
                        ...draft,
                        weightKg: draft.weightKg + 2.5,
                      }))
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </StepperButton>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-center text-xs font-bold text-muted-foreground">عدد التكرارات</p>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <StepperButton
                    label="تقليل التكرارات"
                    onClick={() =>
                      setSetDraft((draft) => ({
                        ...draft,
                        reps: Math.max(1, draft.reps - 1),
                      }))
                    }
                  >
                    <Minus className="h-4 w-4" />
                  </StepperButton>
                  <p className="min-w-[72px] text-center text-2xl font-black text-foreground">
                    {setDraft.reps}
                  </p>
                  <StepperButton
                    label="زيادة التكرارات"
                    onClick={() =>
                      setSetDraft((draft) => ({
                        ...draft,
                        reps: draft.reps + 1,
                      }))
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </StepperButton>
                </div>
              </div>

              <div>
                <p className="mb-2 text-center text-xs font-bold text-muted-foreground">مستوى الجهد</p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(effortLabels) as Array<keyof typeof effortLabels>).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSetDraft((draft) => ({ ...draft, effort: level }))}
                      className={cn(
                        "rounded-xl border px-2 py-2 text-[11px] font-bold transition-colors duration-150",
                        setDraft.effort === level
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 bg-card text-muted-foreground",
                      )}
                    >
                      {effortLabels[level]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="set-notes"
                  className="mb-2 block text-center text-xs font-bold text-muted-foreground"
                >
                  ملاحظات (اختياري)
                </label>
                <textarea
                  id="set-notes"
                  value={setDraft.notes}
                  onChange={(event) =>
                    setSetDraft((draft) => ({ ...draft, notes: event.target.value }))
                  }
                  rows={3}
                  placeholder="أضف ملاحظة عن الأداء..."
                  className="w-full resize-none rounded-2xl border border-border/60 bg-card px-3 py-2 text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
                />
              </div>
            </div>

            <div className="space-y-2 border-t border-border/50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <button
                type="button"
                onClick={() => saveSet(false)}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground transition-transform duration-[120ms] active:scale-[0.97]"
              >
                حفظ المجموعة
              </button>
              <button
                type="button"
                onClick={() => saveSet(true)}
                className="flex h-11 w-full items-center justify-center rounded-2xl border border-border/70 bg-card text-sm font-bold text-muted-foreground transition-transform duration-[120ms] active:scale-[0.97]"
              >
                تخطي
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
