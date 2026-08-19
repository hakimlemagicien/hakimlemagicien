import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Droplets, RefreshCw } from "lucide-react";
import { useWaterOptional } from "@/components/platform/water/WaterContext";
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
  const water = useWaterOptional();
  const reduceMotion = useReducedMotion();
  const [customOpen, setCustomOpen] = useState(false);
  const [customMl, setCustomMl] = useState("300");
  const [activeAmount, setActiveAmount] = useState<number | null>(null);
  const sheetOpen = water?.sheetOpen ?? false;
  const closeWaterSheet = water?.closeWaterSheet;
  const clearError = water?.clearError;

  useEffect(() => {
    if (!sheetOpen) {
      setCustomOpen(false);
      setActiveAmount(null);
      clearError?.();
    }
  }, [sheetOpen, clearError]);

  useEffect(() => {
    if (!sheetOpen || !closeWaterSheet) return;
    document.body.classList.add("is-water-open");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeWaterSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("is-water-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen, closeWaterSheet]);

  if (!water || typeof document === "undefined") return null;

  const {
    state,
    message,
    recentLogs,
    registerWater,
    loading,
    error,
  } = water;

  const current = formatWaterLiters(state.totalMl);
  const goal = formatWaterLiters(state.goalMl, 0);
  const pct = state.goalMl > 0 ? state.totalMl / state.goalMl : 0;
  const duration = reduceMotion ? 0 : 0.22;

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
          className="water-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
        >
          <button
            type="button"
            aria-label="إغلاق"
            className="water-overlay__backdrop"
            onClick={closeWaterSheet}
          />

          <motion.div
            className="water-overlay__wrap"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-label="متابعة شرب الماء"
              dir="rtl"
              className="water-overlay__card"
            >
              <div className="flex items-center justify-center gap-2 text-center">
                <Droplets className="h-5 w-5 text-sky-500" />
                <h2 className="text-base font-black text-sky-950">متابعة شرب الماء</h2>
              </div>

              <div className="mt-5 flex flex-col items-center">
                <div className="relative grid h-[148px] w-[148px] place-items-center">
                  <WaterRing pct={pct} done={state.goalReached} size={148} tone="water" />
                  <div className="absolute inset-0 grid place-items-center text-center">
                    <p className="text-[28px] font-black leading-none text-sky-950">
                      {current}
                      <span className="text-base font-bold text-sky-700/70"> / {goal}</span>
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-sky-700/70">لتر</p>
                  </div>
                </div>
                <p className="mt-3 px-2 text-center text-[12px] font-bold text-sky-800">
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
                          ? "border-sky-500 bg-sky-500 text-white shadow-[0_8px_20px_-10px_rgba(14,165,233,0.55)]"
                          : "border-sky-200 bg-white text-sky-950",
                        isActive && "opacity-70",
                      )}
                    >
                      {formatAmountLabel(amount)}
                      {suggested ? (
                        <span className="absolute -top-2 start-2 rounded-full bg-white px-1.5 py-0.5 text-[8px] font-black text-sky-500 shadow-sm">
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
                  className={cn(
                    "min-h-11 rounded-2xl border text-[12px] font-black",
                    customOpen
                      ? "border-sky-400 bg-sky-50 text-sky-800"
                      : "border-sky-200 bg-white/70 text-sky-950",
                  )}
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
                    className="h-11 min-w-0 flex-1 rounded-2xl border border-sky-200 bg-white px-3 text-sm font-bold text-sky-950"
                    aria-label="كمية مخصصة بالمل"
                  />
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleCustom()}
                    className="h-11 shrink-0 rounded-2xl bg-sky-500 px-4 text-xs font-black text-white"
                  >
                    إضافة
                  </button>
                </div>
              ) : null}

              <div className="mt-5">
                <p className="mb-2 text-[11px] font-black text-sky-800/70">آخر عمليات الشرب</p>
                {loading && recentLogs.length === 0 ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                ) : recentLogs.length === 0 ? (
                  <p className="rounded-2xl bg-sky-50 px-3 py-3 text-center text-[11px] font-medium text-sky-800/70">
                    لم يتم تسجيل الماء بعد.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {recentLogs.map((log) => (
                      <li
                        key={log.id}
                        className="flex items-center justify-between rounded-2xl bg-sky-50 px-3 py-2.5 text-[12px]"
                      >
                        <span className="font-bold text-sky-700/70">{log.timeLabel}</span>
                        <span className="font-black text-sky-950">{log.ml} ml</span>
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
                    onClick={() => water.clearError()}
                    className="inline-flex h-9 items-center gap-1 rounded-xl bg-destructive px-2.5 text-[10px] font-black text-white"
                  >
                    <RefreshCw className="h-3 w-3" />
                    إعادة المحاولة
                  </button>
                </div>
              ) : null}
            </section>

            <button type="button" className="water-overlay__cancel" onClick={closeWaterSheet}>
              إلغاء
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
