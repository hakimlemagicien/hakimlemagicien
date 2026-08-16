import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Footprints, Leaf } from "lucide-react";

type ReadinessAdjustmentSheetProps = {
  open: boolean;
  onClose: () => void;
  onAccept: (choice: "lighter" | "active_recovery") => void;
};

export function ReadinessAdjustmentSheet({
  open,
  onClose,
  onAccept,
}: ReadinessAdjustmentSheetProps) {
  const reduceMotion = useReducedMotion();
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="your-day-adjust"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="your-day-adjust__backdrop"
            aria-label="إغلاق"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="readiness-adjust-title"
            dir="rtl"
            className="your-day-adjust__panel"
            initial={reduceMotion ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { y: 24, opacity: 0 }}
          >
            <h2 id="readiness-adjust-title" className="your-day-adjust__title">
              خيارات يوم أخف
            </h2>
            <p className="your-day-adjust__desc">
              لن نغيّر خطتك تلقائياً. اختر ما يناسبك اليوم، وستبقى التغذية والماء والمتابعة كما هي.
            </p>
            <button
              type="button"
              className="your-day-adjust__choice"
              onClick={() => onAccept("lighter")}
            >
              <Leaf className="h-4 w-4 text-[#F97316]" aria-hidden />
              يوم تمرين أخف
            </button>
            <button
              type="button"
              className="your-day-adjust__choice"
              onClick={() => onAccept("active_recovery")}
            >
              <Footprints className="h-4 w-4 text-[#F97316]" aria-hidden />
              راحة نشطة
            </button>
            <button type="button" className="your-day-adjust__cancel" onClick={onClose}>
              إغلاق
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
