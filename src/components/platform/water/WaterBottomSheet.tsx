import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Droplets, RefreshCw } from "lucide-react";
import { useWater } from "@/components/platform/water/WaterContext";
import { WaterRing } from "@/components/platform/water/WaterCompactWidget";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatWaterLiters,
  WATER_MAX_ML,
  WATER_MIN_ML,
  WATER_QUICK_AMOUNTS,
} from "@/lib/platform/water-storage";
import { cn } from "@/lib/utils";

function formatAmountLabel(ml: number) {
  if (ml >= 1000) return "+1 L";
  return `+${ml} ml`;
}

export function WaterBottomSheet() {
  const {
    sheetOpen,
    closeWaterSheet,
    state,
    message,
    recentLogs,
    registerWater,
    loading,
    error,
    clearError,
  } = useWater();
  const reduceMotion = useReducedMotion();
  const [customOpen, setCustomOpen] = useState(false);
  const [customMl, setCustomMl] = useState("300");
  const [activeAmount, setActiveAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!sheetOpen) {
      setCustomOpen(false);
      setActiveAmount(null);
      clearError();
    }
  }, [sheetOpen, clearError]);

  if (typeof document === "undefined") return null;

  const current = formatWaterLiters(state.totalMl);
  const goal = formatWaterLiters(state.goalMl, 0);
  const pct = state.goalMl > 0 ? state.totalMl / state.goalMl : 0;

  const handleAdd = async (ml: number) => {
    setActiveAmount(ml);
    const ok = await registerWater(ml);
    if (!ok) setActiveAmount(null);
  };

  const handleCustom = async () => {
    const parsed = Number.parseInt(customMl, 10);
    if (Number.isNaN(parsed)) {
      return;
    }
    await handleAdd(parsed);
  };

  return createPortal(
    <AnimatePresence>
      {sheetOpen ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden={false}
        >
          <button
            type="button"
            aria-label="إغلاق"
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={closeWaterSheet}
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="متابعة شرب الماء"
            dir="rtl"
            drag={reduceMotion ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.08}
            onDragEnd={(_event, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) closeWaterSheet();
            }}
            initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative z-[1] w-full max-w-[430px] rounded-t-[32px] bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_48px_-18px_rgba(15,23,42,0.28)]"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" aria-hidden />

            <div className="flex items-center justify-center gap-2 text-center">
              <Droplets className="h-5 w-5 text-[#2563EB]" />
              <h2 className="text-base font-black text-foreground">متابعة شرب الماء</h2>
            </div>

            <div className="mt-5 flex flex-col items-center">
              <div className="relative grid h-[148px] w-[148px] place-items-center">
                <WaterRing pct={pct} done={state.goalReached} size={148} />
                <div className="absolute inset-0 grid place-items-center text-center">
                  <p className="text-[28px] font-black leading-none text-foreground">
                    {current}
                    <span className="text-base font-bold text-muted-foreground"> / {goal}</span>
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-muted-foreground">لتر</p>
                </div>
              </div>
              <p className="mt-3 px-2 text-center text-[12px] font-bold text-[#1E3A8A]">
                {message}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {WATER_QUICK_AMOUNTS.map((amount) => {
                const suggested = amount === 250;
                const isActive = activeAmount === amount && loading;
                return (
                  <button
                    key={amount}
                    type="button"
                    disabled={loading}
                    onClick={() => void handleAdd(amount)}
                    className={cn(
                      "relative min-h-11 rounded-2xl border text-[12px] font-black transition active:scale-[0.96]",
                      suggested
                        ? "border-[#2563EB] bg-[#2563EB] text-white shadow-[0_8px_20px_-10px_rgba(37,99,235,0.55)]"
                        : "border-border/70 bg-card text-foreground",
                      isActive && "opacity-70",
                    )}
                  >
                    {formatAmountLabel(amount)}
                    {suggested ? (
                      <span className="absolute -top-2 start-2 rounded-full bg-white px-1.5 py-0.5 text-[8px] font-black text-[#2563EB] shadow-sm">
                        مقترح
                      </span>
                    ) : null}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={loading}
                onClick={() => setCustomOpen((value) => !value)}
                className="min-h-11 rounded-2xl border border-border/70 bg-muted/40 text-[12px] font-black text-foreground"
              >
                مخصص
              </button>
            </div>

            {customOpen ? (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={WATER_MIN_ML}
                  max={WATER_MAX_ML}
                  value={customMl}
                  onChange={(event) => setCustomMl(event.target.value)}
                  className="h-11 min-w-0 flex-1 rounded-2xl border border-border bg-card px-3 text-sm font-bold"
                  aria-label="كمية مخصصة بالمل"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void handleCustom()}
                  className="h-11 shrink-0 rounded-2xl bg-primary px-4 text-xs font-black text-primary-foreground"
                >
                  إضافة
                </button>
              </div>
            ) : null}

            <div className="mt-5">
              <p className="mb-2 text-[11px] font-black text-muted-foreground">آخر عمليات الشرب</p>
              {loading && recentLogs.length === 0 ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : recentLogs.length === 0 ? (
                <p className="rounded-2xl bg-muted/45 px-3 py-3 text-center text-[11px] font-medium text-muted-foreground">
                  لم يتم تسجيل الماء بعد.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {recentLogs.map((log) => (
                    <li
                      key={log.id}
                      className="flex items-center justify-between rounded-2xl bg-muted/45 px-3 py-2.5 text-[12px]"
                    >
                      <span className="font-bold text-muted-foreground">{log.timeLabel}</span>
                      <span className="font-black text-foreground">{log.ml} ml</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error ? (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 px-3 py-2.5">
                <p className="min-w-0 flex-1 text-[11px] font-bold text-destructive">{error}</p>
                <button
                  type="button"
                  onClick={() => clearError()}
                  className="inline-flex h-9 items-center gap-1 rounded-xl bg-destructive px-2.5 text-[10px] font-black text-white"
                >
                  <RefreshCw className="h-3 w-3" />
                  إعادة المحاولة
                </button>
              </div>
            ) : null}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
