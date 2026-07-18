import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type TimerSettingsSheetProps = {
  open: boolean;
  title: string;
  options: number[];
  value: number;
  suffix?: string;
  allowCustom?: boolean;
  onClose: () => void;
  onSelect: (value: number) => void;
};

function formatOption(seconds: number, suffix = "ث") {
  if (seconds === 0) return "بدون";
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60} د`;
  return `${seconds} ${suffix}`;
}

export function TimerSettingsSheet({
  open,
  title,
  options,
  value,
  suffix = "ث",
  allowCustom = true,
  onClose,
  onSelect,
}: TimerSettingsSheetProps) {
  const reduceMotion = useReducedMotion();
  const [custom, setCustom] = useState(String(value));

  useEffect(() => {
    if (open) setCustom(String(value));
  }, [open, value]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[140] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button type="button" aria-label="إغلاق" className="absolute inset-0 bg-black/35" onClick={onClose} />
          <motion.div
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduceMotion ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={reduceMotion ? undefined : { y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-lg rounded-t-[24px] bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#E2E8F0]" aria-hidden />
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-black text-[#0F172A]">{title}</h3>
              <button type="button" onClick={onClose} aria-label="إغلاق" className="grid h-10 w-10 place-items-center">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onSelect(option);
                    onClose();
                  }}
                  className={cn(
                    "min-h-11 rounded-2xl text-[12px] font-extrabold transition",
                    value === option
                      ? "bg-[#FF6B00] text-white"
                      : "bg-[#F1F5F9] text-[#475569]",
                  )}
                >
                  {formatOption(option, suffix === "ث" ? "ث" : suffix)}
                </button>
              ))}
            </div>

            {allowCustom ? (
              <div className="mt-4 flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={custom}
                  onChange={(event) => setCustom(event.target.value)}
                  className="h-11 flex-1 rounded-2xl border border-[#E2E8F0] px-3 text-[14px] font-bold"
                  aria-label="قيمة مخصصة"
                />
                <button
                  type="button"
                  onClick={() => {
                    const parsed = Number.parseInt(custom, 10);
                    if (!Number.isNaN(parsed) && parsed >= 0) {
                      onSelect(parsed);
                      onClose();
                    }
                  }}
                  className="min-h-11 rounded-2xl bg-[#0F172A] px-4 text-[12px] font-black text-white"
                >
                  تطبيق
                </button>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

type RoundSettingsSheetProps = {
  open: boolean;
  value: number;
  onClose: () => void;
  onSelect: (value: number) => void;
};

export function RoundSettingsSheet({ open, value, onClose, onSelect }: RoundSettingsSheetProps) {
  const reduceMotion = useReducedMotion();
  const [custom, setCustom] = useState(String(value));

  useEffect(() => {
    if (open) setCustom(String(value));
  }, [open, value]);

  if (typeof document === "undefined") return null;

  const quick = [1, 4, 6, 8, 10, 12, 16, 20];

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[140] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="إغلاق" className="absolute inset-0 bg-black/35" onClick={onClose} />
          <motion.div
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-label="عدد الجولات"
            initial={reduceMotion ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={reduceMotion ? undefined : { y: "100%" }}
            className="relative z-10 w-full max-w-lg rounded-t-[24px] bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#E2E8F0]" aria-hidden />
            <h3 className="mb-4 text-[15px] font-black">عدد الجولات</h3>
            <div className="grid grid-cols-4 gap-2">
              {quick.map((rounds) => (
                <button
                  key={rounds}
                  type="button"
                  onClick={() => {
                    onSelect(rounds);
                    onClose();
                  }}
                  className={cn(
                    "min-h-11 rounded-2xl text-[12px] font-extrabold",
                    value === rounds ? "bg-[#FF6B00] text-white" : "bg-[#F1F5F9] text-[#475569]",
                  )}
                >
                  {rounds}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="number"
                min={1}
                max={99}
                value={custom}
                onChange={(event) => setCustom(event.target.value)}
                className="h-11 flex-1 rounded-2xl border border-[#E2E8F0] px-3 text-[14px] font-bold"
              />
              <button
                type="button"
                onClick={() => {
                  const parsed = Number.parseInt(custom, 10);
                  if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 99) {
                    onSelect(parsed);
                    onClose();
                  }
                }}
                className="min-h-11 rounded-2xl bg-[#0F172A] px-4 text-[12px] font-black text-white"
              >
                تطبيق
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
