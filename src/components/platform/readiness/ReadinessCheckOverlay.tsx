import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { triggerSelectionHaptic } from "@/lib/haptic";
import { READINESS_ASSETS } from "@/lib/platform/readiness-assets";
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

type StepId = "sleep" | "energy" | "body";
type OptionTone = "low" | "mid" | "good";

const STEPS: StepId[] = ["sleep", "energy", "body"];

const STEP_META: Record<
  StepId,
  {
    question: string;
    hint: string;
    theme: "sleep" | "energy" | "body";
    hero: string;
    orbit: string;
    sparks: string;
  }
> = {
  sleep: {
    question: READINESS_COPY.sleepQuestion,
    hint: READINESS_COPY.sleepHint,
    theme: "sleep",
    hero: READINESS_ASSETS.sleepMoon,
    orbit: READINESS_ASSETS.sleepOrbit,
    sparks: READINESS_ASSETS.sleepSparkles,
  },
  energy: {
    question: READINESS_COPY.energyQuestion,
    hint: READINESS_COPY.energyHint,
    theme: "energy",
    hero: READINESS_ASSETS.energyBolt,
    orbit: READINESS_ASSETS.energyOrbit,
    sparks: READINESS_ASSETS.energySparks,
  },
  body: {
    question: READINESS_COPY.bodyQuestion,
    hint: READINESS_COPY.bodyHint,
    theme: "body",
    hero: READINESS_ASSETS.muscleArm,
    orbit: READINESS_ASSETS.muscleWaves,
    sparks: READINESS_ASSETS.muscleSparkles,
  },
};

const SLEEP_OPTIONS: { value: ReadinessSleep; label: string; tone: OptionTone; face: string }[] = [
  { value: "poor", label: READINESS_COPY.sleep.poor, tone: "low", face: READINESS_ASSETS.faceLow },
  { value: "fair", label: READINESS_COPY.sleep.fair, tone: "mid", face: READINESS_ASSETS.faceNeutral },
  { value: "good", label: READINESS_COPY.sleep.good, tone: "good", face: READINESS_ASSETS.faceGood },
];

const ENERGY_OPTIONS: { value: ReadinessEnergy; label: string; tone: OptionTone; face: string }[] = [
  { value: "low", label: READINESS_COPY.energy.low, tone: "low", face: READINESS_ASSETS.faceLow },
  { value: "medium", label: READINESS_COPY.energy.medium, tone: "mid", face: READINESS_ASSETS.faceNeutral },
  { value: "high", label: READINESS_COPY.energy.high, tone: "good", face: READINESS_ASSETS.faceGood },
];

const BODY_OPTIONS: { value: ReadinessBody; label: string; tone: OptionTone; face: string }[] = [
  { value: "pain", label: READINESS_COPY.body.pain, tone: "low", face: READINESS_ASSETS.faceLow },
  { value: "fatigued", label: READINESS_COPY.body.fatigued, tone: "mid", face: READINESS_ASSETS.faceNeutral },
  { value: "good", label: READINESS_COPY.body.good, tone: "good", face: READINESS_ASSETS.faceGood },
];

function optionSelectedTone(tone: OptionTone) {
  return tone === "good" ? "green" : "orange";
}

function AssetImg({
  src,
  className,
  width,
  height,
}: {
  src: string;
  className?: string;
  width: number;
  height: number;
}) {
  return (
    <img
      src={src}
      alt=""
      width={width}
      height={height}
      decoding="async"
      draggable={false}
      className={className}
    />
  );
}

function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="your-day-check__progress" aria-hidden>
      <div className="your-day-check__dots">
        {Array.from({ length: total }, (_, index) => {
          const state = index < current ? "complete" : index === current ? "active" : "pending";
          const src =
            state === "complete"
              ? READINESS_ASSETS.progressComplete
              : state === "active"
                ? READINESS_ASSETS.progressActive
                : READINESS_ASSETS.progressPending;
          return (
            <AssetImg
              key={state + index}
              src={src}
              width={state === "pending" ? 8 : 18}
              height={state === "pending" ? 8 : 18}
              className={cn("your-day-check__dot", `is-${state}`)}
            />
          );
        })}
      </div>
      <span className="your-day-check__step-count">{READINESS_COPY.stepOf(current + 1, total)}</span>
    </div>
  );
}

function QuestionHero({ step }: { step: StepId }) {
  const meta = STEP_META[step];
  return (
    <div className={cn("your-day-check__hero", `is-${meta.theme}`)} aria-hidden>
      <AssetImg src={meta.orbit} width={168} height={168} className="your-day-check__hero-orbit" />
      <AssetImg src={meta.hero} width={132} height={132} className="your-day-check__hero-main" />
      <AssetImg src={meta.sparks} width={168} height={168} className="your-day-check__hero-sparks" />
    </div>
  );
}

function ChoiceGrid<T extends string>({
  value,
  options,
  onChange,
}: {
  value?: T;
  options: { value: T; label: string; tone: OptionTone; face: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" className="your-day-check__options">
      {options.map((option) => {
        const selected = value === option.value;
        const selectedTone = optionSelectedTone(option.tone);
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={cn(
              "your-day-check__option",
              selected && "is-selected",
              selected && `is-${selectedTone}`,
            )}
            onClick={() => onChange(option.value)}
          >
            {selected ? (
              <AssetImg
                src={selectedTone === "green" ? READINESS_ASSETS.pulseGreen : READINESS_ASSETS.pulseOrange}
                width={88}
                height={88}
                className="your-day-check__option-pulse"
              />
            ) : null}
            <AssetImg src={option.face} width={36} height={36} className="your-day-check__option-face" />
            <span>{option.label}</span>
            {selected ? (
              <AssetImg
                src={selectedTone === "green" ? READINESS_ASSETS.checkGreen : READINESS_ASSETS.checkOrange}
                width={22}
                height={22}
                className="your-day-check__option-check"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function ReadinessStepForm({
  stepIndex,
  saving,
  error,
  answers,
  onChoose,
  onConfirm,
}: {
  stepIndex: number;
  saving: boolean;
  error: string | null;
  answers: Partial<ReadinessAnswers>;
  onChoose: (next: Partial<ReadinessAnswers>) => void;
  onConfirm: () => void;
}) {
  const step = STEPS[stepIndex];
  const meta = STEP_META[step];
  const complete = isReadinessAnswersComplete(answers);
  const lastStep = step === "body";

  return (
    <form
      className="your-day-check__form"
      onSubmit={(event) => {
        event.preventDefault();
        if (complete && !saving && lastStep) onConfirm();
      }}
    >
      <QuestionHero step={step} />
      <h2 id="readiness-check-title" className="your-day-check__title">
        {meta.question}
      </h2>
      <p id="readiness-check-desc" className="your-day-check__desc">
        {meta.hint}
      </p>

      {step === "sleep" ? (
        <ChoiceGrid
          value={answers.sleep}
          options={SLEEP_OPTIONS}
          onChange={(sleep) => onChoose({ ...answers, sleep })}
        />
      ) : null}
      {step === "energy" ? (
        <ChoiceGrid
          value={answers.energy}
          options={ENERGY_OPTIONS}
          onChange={(energy) => onChoose({ ...answers, energy })}
        />
      ) : null}
      {step === "body" ? (
        <ChoiceGrid
          value={answers.body}
          options={BODY_OPTIONS}
          onChange={(body) => onChoose({ ...answers, body })}
        />
      ) : null}

      {lastStep ? (
        <p className="your-day-check__adapt" role="status">
          <AssetImg
            src={READINESS_ASSETS.shieldCheck}
            width={16}
            height={16}
            className="your-day-check__adapt-icon"
          />
          {READINESS_COPY.adaptNotice}
        </p>
      ) : (
        <p className="your-day-check__notice" role="status">
          {READINESS_COPY.autoAdvance}
        </p>
      )}

      {error ? (
        <p className="your-day-check__error" role="alert">
          {error}
        </p>
      ) : null}

      {lastStep ? (
        <>
          <button
            type="submit"
            className="your-day-check__submit"
            disabled={!complete || saving}
            aria-busy={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {READINESS_COPY.confirm}
          </button>
          <p className="your-day-check__edit-hint">{READINESS_COPY.editHint}</p>
        </>
      ) : null}
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
  const [stepIndex, setStepIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onDismissRef = useRef(onDismiss);
  const advanceTimer = useRef<number>(0);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!open) {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
      return;
    }
    setStepIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("is-readiness-open");

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

    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("is-readiness-open");
      window.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus();
    };
  }, [open]);

  function goNext() {
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function choose(next: Partial<ReadinessAnswers>) {
    triggerSelectionHaptic();
    onAnswersChange(next);
    if (stepIndex >= STEPS.length - 1) return;
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    const delay = reduceMotion ? 0 : 520;
    advanceTimer.current = window.setTimeout(goNext, delay);
  }

  if (typeof document === "undefined") return null;

  const duration = reduceMotion ? 0 : 0.22;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="your-day-check is-sheet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
        >
          <div className="your-day-check__backdrop" aria-hidden />
          <motion.div
            ref={panelRef}
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="readiness-check-title"
            aria-describedby="readiness-check-desc"
            className="your-day-check__sheet-wrap"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="your-day-check__panel is-sheet">
              <div className="your-day-check__header">
                <button
                  type="button"
                  className="your-day-check__icon-btn"
                  onClick={onDismiss}
                  aria-label={READINESS_COPY.close}
                >
                  <AssetImg
                    src={READINESS_ASSETS.closeIcon}
                    width={18}
                    height={18}
                    className="your-day-check__icon"
                  />
                </button>
                <StepProgress current={stepIndex} total={STEPS.length} />
                {stepIndex > 0 ? (
                  <button
                    type="button"
                    className="your-day-check__icon-btn is-back"
                    onClick={goBack}
                    aria-label={READINESS_COPY.back}
                  >
                    <AssetImg
                      src={READINESS_ASSETS.backRtl}
                      width={18}
                      height={18}
                      className="your-day-check__icon"
                    />
                  </button>
                ) : (
                  <span className="your-day-check__icon-btn is-spacer" aria-hidden />
                )}
              </div>
              <ReadinessStepForm
                key={STEPS[stepIndex]}
                stepIndex={stepIndex}
                saving={saving}
                error={error}
                answers={answers}
                onChoose={choose}
                onConfirm={onConfirm}
              />
            </div>
            <button type="button" className="your-day-check__skip" onClick={onSkip} disabled={saving}>
              {READINESS_COPY.skip}
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
