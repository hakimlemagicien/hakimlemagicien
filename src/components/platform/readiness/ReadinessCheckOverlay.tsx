import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Check,
  CloudFog,
  CloudSun,
  Loader2,
  Moon,
} from "lucide-react";
import {
  READINESS_COPY,
  isReadinessAnswersComplete,
  type ReadinessAnswers,
  type ReadinessBody,
  type ReadinessEnergy,
  type ReadinessSleep,
} from "@/lib/platform/readiness";
import { cn } from "@/lib/utils";

type ReadinessCheckOverlayProps = {
  open: boolean;
  saving: boolean;
  error: string | null;
  answers: Partial<ReadinessAnswers>;
  onAnswersChange: (next: Partial<ReadinessAnswers>) => void;
  onConfirm: () => void;
  onSkip: () => void;
  onDismiss: () => void;
};

const ENERGY_OPTIONS: { value: ReadinessEnergy; label: string; icon: typeof BatteryLow }[] = [
  { value: "low", label: READINESS_COPY.energy.low, icon: BatteryLow },
  { value: "medium", label: READINESS_COPY.energy.medium, icon: BatteryMedium },
  { value: "high", label: READINESS_COPY.energy.high, icon: BatteryFull },
];

const SLEEP_OPTIONS: { value: ReadinessSleep; label: string; icon: typeof Moon }[] = [
  { value: "poor", label: READINESS_COPY.sleep.poor, icon: CloudFog },
  { value: "fair", label: READINESS_COPY.sleep.fair, icon: CloudSun },
  { value: "good", label: READINESS_COPY.sleep.good, icon: Moon },
];

const BODY_OPTIONS: { value: ReadinessBody; label: string; icon: typeof Check }[] = [
  { value: "good", label: READINESS_COPY.body.good, icon: Check },
  { value: "fatigued", label: READINESS_COPY.body.fatigued, icon: AlertCircle },
  { value: "pain", label: READINESS_COPY.body.pain, icon: AlertCircle },
];

function OptionRow<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value?: T;
  options: { value: T; label: string; icon: typeof Check }[];
  onChange: (value: T) => void;
}) {
  const legendId = useId();
  return (
    <fieldset className="your-day-check__fieldset">
      <legend id={legendId} className="your-day-check__legend">
        {legend}
      </legend>
      <div role="radiogroup" aria-labelledby={legendId} className="your-day-check__options">
        {options.map((option) => {
          const selected = value === option.value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-selected={selected}
              className={cn("your-day-check__option", selected && "is-selected")}
              onClick={() => onChange(option.value)}
            >
              <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ReadinessForm({
  saving,
  error,
  answers,
  onAnswersChange,
  onConfirm,
  onSkip,
}: Omit<ReadinessCheckOverlayProps, "open" | "onDismiss">) {
  const complete = isReadinessAnswersComplete(answers);

  return (
    <form
      className="your-day-check__form"
      onSubmit={(event) => {
        event.preventDefault();
        if (complete && !saving) onConfirm();
      }}
    >
      <OptionRow
        legend={READINESS_COPY.energyQuestion}
        value={answers.energy}
        options={ENERGY_OPTIONS}
        onChange={(energy) => onAnswersChange({ ...answers, energy })}
      />
      <OptionRow
        legend={READINESS_COPY.sleepQuestion}
        value={answers.sleep}
        options={SLEEP_OPTIONS}
        onChange={(sleep) => onAnswersChange({ ...answers, sleep })}
      />
      <OptionRow
        legend={READINESS_COPY.bodyQuestion}
        value={answers.body}
        options={BODY_OPTIONS}
        onChange={(body) => onAnswersChange({ ...answers, body })}
      />

      {answers.body === "pain" ? (
        <p className="your-day-check__notice" role="status">
          {READINESS_COPY.painNotice}
        </p>
      ) : null}

      {error ? (
        <p className="your-day-check__error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="your-day-check__submit"
        disabled={!complete || saving}
        aria-busy={saving}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {READINESS_COPY.confirm}
      </button>
      <button type="button" className="your-day-check__skip" onClick={onSkip} disabled={saving}>
        {READINESS_COPY.skip}
      </button>
    </form>
  );
}

export function ReadinessCheckOverlay({
  open,
  saving,
  error,
  answers,
  onAnswersChange,
  onConfirm,
  onSkip,
  onDismiss,
}: ReadinessCheckOverlayProps) {
  const [isMobile, setIsMobile] = useState(true);
  const useSheet = isMobile;
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      first?.focus();
    }, 40);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismissRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((node) => !node.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    let ignorePop = false;
    const onPop = () => {
      if (ignorePop) return;
      onDismissRef.current();
    };
    window.history.pushState({ readinessOverlay: true }, "");
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      if (window.history.state?.readinessOverlay) {
        ignorePop = true;
        window.history.back();
      }
      previouslyFocused.current?.focus();
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  const panel = (
    <div
      ref={panelRef}
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="readiness-check-title"
      aria-describedby="readiness-check-desc"
      className={cn("your-day-check__panel", useSheet ? "is-sheet" : "is-dialog")}
    >
      {useSheet ? <div className="your-day-check__handle" aria-hidden /> : null}
      <div className="your-day-check__header">
        <h2 id="readiness-check-title" className="your-day-check__title">
          {READINESS_COPY.title}
        </h2>
        <p id="readiness-check-desc" className="your-day-check__desc">
          {READINESS_COPY.description}
        </p>
      </div>
      <ReadinessForm
        saving={saving}
        error={error}
        answers={answers}
        onAnswersChange={onAnswersChange}
        onConfirm={onConfirm}
        onSkip={onSkip}
      />
    </div>
  );

  const duration = reduceMotion ? 0 : 0.22;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className={cn("your-day-check", useSheet ? "is-sheet" : "is-dialog")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
        >
          <div className="your-day-check__backdrop" aria-hidden />
          {useSheet ? (
            <motion.div
              className="your-day-check__sheet-wrap"
              initial={reduceMotion ? false : { y: "100%" }}
              animate={{ y: 0 }}
              exit={reduceMotion ? undefined : { y: "100%" }}
              transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
              drag={reduceMotion ? false : "y"}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.18 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 88 || info.velocity.y > 500) onDismiss();
              }}
            >
              {panel}
            </motion.div>
          ) : (
            <motion.div
              className="your-day-check__dialog-wrap"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
              transition={{ duration }}
            >
              {panel}
            </motion.div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
