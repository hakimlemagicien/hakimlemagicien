import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Droplets, X } from "lucide-react";
import { useWaterOptional } from "@/components/platform/water/WaterContext";
import { WATER_SEED } from "@/lib/platform/seed-content";

const AUTO_DISMISS_MS = 4_000;

/** Lightweight in-app reminder. It never traps focus or blocks navigation. */
export function WaterReminderOverlay() {
  const water = useWaterOptional();
  const reduceMotion = useReducedMotion();
  const reminderOpen = water?.reminderOpen ?? false;
  const dismiss = water?.skipWaterReminder;

  useEffect(() => {
    if (!reminderOpen || !dismiss) return;
    const timer = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [dismiss, reminderOpen]);

  if (!water || typeof document === "undefined") return null;

  const logGlass = async () => {
    const saved = await water.registerWater(WATER_SEED.glassMl);
    if (saved) water.skipWaterReminder();
  };

  return createPortal(
    <AnimatePresence>
      {reminderOpen ? (
        <motion.aside
          role="status"
          aria-live="polite"
          dir="rtl"
          className="water-reminder-banner"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="water-reminder-banner__icon" aria-hidden>
            <Droplets className="h-5 w-5" />
          </div>
          <div className="water-reminder-banner__copy">
            <strong>حان وقت شرب الماء</strong>
            <span>حافظ على ترطيبك خلال اليوم</span>
          </div>
          <button
            type="button"
            className="water-reminder-banner__action"
            disabled={water.loading}
            onClick={() => void logGlass()}
          >
            سجّل كوب
          </button>
          <button
            type="button"
            className="water-reminder-banner__dismiss"
            aria-label="إغلاق تذكير الماء"
            onClick={water.skipWaterReminder}
          >
            <X className="h-4 w-4" />
          </button>
        </motion.aside>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
