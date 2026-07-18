import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Settings2, X } from "lucide-react";
import type { TimerConfig } from "@/lib/platform/timer/types";
import { PREP_TIME_OPTIONS, REST_TIME_OPTIONS, WORK_TIME_OPTIONS } from "@/lib/platform/timer/presets";

type CustomTimerSheetProps = {
  open: boolean;
  initial?: TimerConfig;
  onClose: () => void;
  onSave: (name: string, config: TimerConfig, startImmediately: boolean) => void;
};

export function CustomTimerSheet({ open, initial, onClose, onSave }: CustomTimerSheetProps) {
  const reduceMotion = useReducedMotion();
  const [name, setName] = useState("مؤقت مخصص");
  const [workSeconds, setWorkSeconds] = useState(initial?.workSeconds ?? 30);
  const [restSeconds, setRestSeconds] = useState(initial?.restSeconds ?? 15);
  const [rounds, setRounds] = useState(initial?.rounds ?? 8);
  const [preparationSeconds, setPreparationSeconds] = useState(initial?.preparationSeconds ?? 5);
  const [soundEnabled, setSoundEnabled] = useState(initial?.soundEnabled ?? true);
  const [vibrationEnabled, setVibrationEnabled] = useState(initial?.vibrationEnabled ?? true);

  useEffect(() => {
    if (!open) return;
    setName("مؤقت مخصص");
    setWorkSeconds(initial?.workSeconds ?? 30);
    setRestSeconds(initial?.restSeconds ?? 15);
    setRounds(initial?.rounds ?? 8);
    setPreparationSeconds(initial?.preparationSeconds ?? 5);
    setSoundEnabled(initial?.soundEnabled ?? true);
    setVibrationEnabled(initial?.vibrationEnabled ?? true);
  }, [open, initial]);

  if (typeof document === "undefined") return null;

  const config: TimerConfig = {
    workSeconds,
    restSeconds,
    rounds,
    preparationSeconds,
    soundEnabled,
    vibrationEnabled,
  };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[140] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="إغلاق" className="absolute inset-0 bg-black/35" onClick={onClose} />
          <motion.div
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-label="إنشاء مؤقت مخصص"
            initial={reduceMotion ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={reduceMotion ? undefined : { y: "100%" }}
            className="relative z-10 max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-[24px] bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#E2E8F0]" aria-hidden />
            <div className="mb-4 flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-[#FF6B00]" />
              <h3 className="text-[15px] font-black">إنشاء مؤقت مخصص</h3>
              <button type="button" onClick={onClose} aria-label="إغلاق" className="mr-auto grid h-10 w-10 place-items-center">
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="mb-3 block">
              <span className="mb-1 block text-[12px] font-bold text-[#64748B]">اسم المؤقت</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 w-full rounded-2xl border border-[#E2E8F0] px-3 text-[14px] font-bold"
              />
            </label>

            <FieldSelect label="وقت العمل" value={workSeconds} options={WORK_TIME_OPTIONS} onChange={setWorkSeconds} />
            <FieldSelect label="وقت الراحة" value={restSeconds} options={REST_TIME_OPTIONS} onChange={setRestSeconds} />
            <FieldNumber label="عدد الجولات" value={rounds} min={1} max={99} onChange={setRounds} />
            <FieldSelect label="العد التنازلي قبل البداية" value={preparationSeconds} options={PREP_TIME_OPTIONS} onChange={setPreparationSeconds} />

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Toggle label="الصوت" enabled={soundEnabled} onToggle={() => setSoundEnabled((v) => !v)} />
              <Toggle label="الاهتزاز" enabled={vibrationEnabled} onToggle={() => setVibrationEnabled((v) => !v)} />
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => onSave(name, config, false)}
                className="flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#0F172A] text-[13px] font-black text-white"
              >
                حفظ المؤقت
              </button>
              <button
                type="button"
                onClick={() => onSave(name, config, true)}
                className="flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#FF6B00] text-[13px] font-black text-white"
              >
                بدء دون حفظ
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: readonly number[];
  onChange: (value: number) => void;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[12px] font-bold text-[#64748B]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full rounded-2xl border border-[#E2E8F0] bg-white px-3 text-[14px] font-bold"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === 0 ? "بدون" : `${option} ث`}
          </option>
        ))}
      </select>
    </label>
  );
}

function FieldNumber({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[12px] font-bold text-[#64748B]">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full rounded-2xl border border-[#E2E8F0] px-3 text-[14px] font-bold"
      />
    </label>
  );
}

function Toggle({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className="flex min-h-11 items-center justify-between rounded-2xl bg-[#F8FAFC] px-3 text-[12px] font-extrabold text-[#475569] ring-1 ring-[#E2E8F0]"
    >
      {label}
      <span className={enabled ? "text-[#FF6B00]" : "text-[#94A3B8]"}>{enabled ? "مفعّل" : "متوقف"}</span>
    </button>
  );
}
