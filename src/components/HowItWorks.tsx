import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  MessageCircleQuestion,
  BarChart3,
  ClipboardList,
  CheckCircle2,
  ArrowLeft,
  Target,
  ShieldCheck,
  Zap,
  Award,
  Wifi,
  BatteryFull,
  Signal,
  Check,
} from "lucide-react";

function useInView<T extends HTMLElement>(opts: IntersectionObserverInit = { threshold: 0.15 }) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, opts);
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

const steps = [
  {
    n: "01",
    Icon: MessageCircleQuestion,
    title: "أجب على الأسئلة",
    text: "أجب على مجموعة من الأسئلة عن هدفك، نمط حياتك، ومستواك الحالي.",
  },
  {
    n: "02",
    Icon: BarChart3,
    title: "نحلل بياناتك",
    text: "نقوم بتحليل إجاباتك وبياناتك لفهم احتياجاتك وتحديد نقاط التحسين.",
  },
  {
    n: "03",
    Icon: ClipboardList,
    title: "نبني خطتك",
    text: "نبني لك برنامج تدريب وخطة تغذية مخصصة بناءً على تحليل بياناتك.",
  },
  {
    n: "04",
    Icon: CheckCircle2,
    title: "تحصل على توصيتك",
    text: "تحصل على برنامجك المخصص جاهز للتطبيق ومتابعة مستمرة لتحقيق أفضل النتائج.",
  },
];

const trustFeatures = [
  { Icon: Award, title: "فعال", text: "نظام proven لتحقيق النتائج" },
  { Icon: Zap, title: "سريع", text: "خطة جاهزة خلال دقائق" },
  { Icon: ShieldCheck, title: "آمن", text: "بياناتك محمية 100%" },
  { Icon: Target, title: "دقيق", text: "تحليل شامل لبياناتك" },
];

const ASSESSMENT_CHECKLIST = [
  { label: "المعلومات الأساسية", progress: 25 },
  { label: "الهدف والمدة", progress: 50 },
  { label: "النشاط الحالي", progress: 75 },
  { label: "التغذية ونمط الحياة", progress: 100 },
];

const STEP_INTERVAL_MS = 2500;
const PROGRESS_R = 54;
const PROGRESS_C = 2 * Math.PI * PROGRESS_R;

function PhoneMockup({
  activeStep,
  compact = false,
}: {
  activeStep: number;
  compact?: boolean;
}) {
  const progress = ASSESSMENT_CHECKLIST[activeStep].progress;
  const dash = (progress / 100) * PROGRESS_C;
  const prevProgressRef = useRef(progress);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (prevProgressRef.current !== progress) {
      prevProgressRef.current = progress;
      setPulseKey((k) => k + 1);
    }
  }, [progress]);

  const shellW = compact ? "w-[220px]" : "w-[280px] sm:w-[300px]";
  const beigeSize = compact ? "w-[280px] h-[280px]" : "w-[360px] h-[360px]";
  const ringBox = compact ? "w-[112px] h-[112px]" : "w-[140px] h-[140px]";
  const pctText = compact ? "text-xl" : "text-2xl";

  return (
    <div className={`relative mx-auto ${shellW} animate-float-phone font-[Tajawal,Cairo,sans-serif]`}>
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className={`${beigeSize} rounded-full bg-beige`} />
      </div>

      <div className="relative rounded-[40px] bg-black p-1.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)] sm:rounded-[44px] sm:p-2">
        <div className="relative overflow-hidden rounded-[32px] bg-white aspect-[9/19.5] sm:rounded-[36px]">
          <div className="flex items-center justify-between px-5 pt-2.5 text-[10px] font-semibold text-black sm:px-6 sm:pt-3 sm:text-[11px]">
            <span>9:41</span>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-black sm:h-6 sm:w-28" />
            <div className="flex items-center gap-1">
              <Signal size={11} />
              <Wifi size={11} />
              <BatteryFull size={13} />
            </div>
          </div>

          <div className="px-4 pt-4 pb-3 sm:px-5 sm:pt-6 sm:pb-4">
            <p className="text-center text-[12px] font-bold text-foreground sm:text-[13px]">تقدم التقييم</p>

            <div className={`relative mx-auto mt-3 ${ringBox} sm:mt-4`}>
              <svg viewBox="0 0 140 140" className="-rotate-90 w-full h-full">
                <circle cx="70" cy="70" r={PROGRESS_R} stroke="#FFF1E5" strokeWidth="10" fill="none" />
                <circle
                  cx="70"
                  cy="70"
                  r={PROGRESS_R}
                  stroke="#F97316"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${PROGRESS_C}`}
                  className="transition-[stroke-dasharray] duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  key={pulseKey}
                  className={`${pctText} font-extrabold text-foreground animate-how-step-slide-in`}
                >
                  {progress}%
                </span>
                <span className="text-[9px] text-muted-foreground mt-0.5 sm:text-[10px] sm:mt-1">
                  تم إكمال التقييم
                </span>
              </div>
            </div>

            <ul className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
              {ASSESSMENT_CHECKLIST.map((it, i) => {
                const isDone = i < activeStep;
                const isActive = i === activeStep;
                return (
                  <li
                    key={it.label}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 transition-all duration-500 ease-out sm:px-3 sm:py-2 ${
                      isActive
                        ? "border-primary/45 bg-[#FFF7ED] shadow-[0_4px_14px_-6px_rgba(249,115,22,0.35)] ring-1 ring-primary/15 scale-[1.02]"
                        : isDone
                          ? "border-[#E8F5E9] bg-white"
                          : "border-[#F1F1F1] bg-white opacity-80"
                    } ${isActive ? "animate-how-step-slide-in" : ""}`}
                  >
                    <span
                      className={`text-[10px] font-semibold leading-snug sm:text-[11px] ${
                        isActive ? "text-primary font-bold" : isDone ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {it.label}
                    </span>
                    {isDone ? (
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-[#22C55E] text-white sm:h-5 sm:w-5">
                        <Check size={10} strokeWidth={3} className="sm:hidden" />
                        <Check size={12} strokeWidth={3} className="hidden sm:block" />
                      </span>
                    ) : isActive ? (
                      <span className="relative grid h-4 w-4 place-items-center sm:h-5 sm:w-5">
                        <span className="absolute inset-0 rounded-full bg-primary/25 animate-pulse-soft" />
                        <span className="h-2.5 w-2.5 rounded-full bg-primary sm:h-3 sm:w-3" />
                      </span>
                    ) : (
                      <span className="h-4 w-4 rounded-full border-2 border-[#E5E7EB] sm:h-5 sm:w-5" />
                    )}
                  </li>
                );
              })}
            </ul>

            <Link
              to="/quiz"
              className="mt-3 flex w-full items-center justify-center rounded-2xl bg-primary py-2.5 text-[11px] font-bold text-white shadow-cta sm:mt-4 sm:py-3 sm:text-[12px]"
            >
              متابعة التقييم
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepDots({
  activeStep,
  onSelect,
}: {
  activeStep: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mt-4" dir="rtl">
      {ASSESSMENT_CHECKLIST.map((it, i) => (
        <button
          key={it.label}
          type="button"
          aria-label={`الخطوة ${i + 1}: ${it.label}`}
          aria-current={i === activeStep ? "step" : undefined}
          onClick={() => onSelect(i)}
          className={`rounded-full transition-all duration-500 ease-out ${
            i === activeStep ? "h-2.5 w-7 bg-primary shadow-[0_0_12px_rgba(249,115,22,0.45)]" : "h-2.5 w-2.5 bg-primary/25 hover:bg-primary/40"
          }`}
        />
      ))}
    </div>
  );
}

function StepCard({ step, index }: { step: (typeof steps)[number]; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 100}ms` }}
      className={`group rounded-[28px] border border-[#F1F1F1] bg-white p-6 shadow-card transition-all duration-700 ease-out hover:-translate-y-1 hover:shadow-soft ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-beige">
        <step.Icon className="text-primary" size={28} strokeWidth={1.8} />
      </div>
      <h3 className="mt-5 text-center text-lg font-bold text-foreground">{step.title}</h3>
      <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">{step.text}</p>
    </div>
  );
}

function StepNumber({ n }: { n: string }) {
  return (
    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white border-2 border-primary text-primary text-lg font-extrabold shadow-sm">
      {n}
    </div>
  );
}

function Arrow() {
  return (
    <span className="hidden lg:grid h-7 w-7 place-items-center rounded-full bg-primary text-white shadow-sm animate-pulse-soft">
      <ArrowLeft size={14} strokeWidth={2.5} />
    </span>
  );
}

export function HowItWorks() {
  const { ref: secRef, inView: secIn } = useInView<HTMLElement>({ threshold: 0.05 });
  const [activeStep, setActiveStep] = useState(0);
  const pauseUntilRef = useRef(0);

  useEffect(() => {
    if (!secIn) return;
    const tick = () => {
      if (Date.now() < pauseUntilRef.current) return;
      setActiveStep((s) => (s + 1) % ASSESSMENT_CHECKLIST.length);
    };
    const id = setInterval(tick, STEP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [secIn]);

  const handleStepSelect = (i: number) => {
    setActiveStep(i);
    pauseUntilRef.current = Date.now() + STEP_INTERVAL_MS * 2;
  };

  return (
    <section
      id="how"
      ref={secRef}
      dir="rtl"
      className={`relative bg-white py-10 lg:py-28 overflow-hidden font-[Tajawal,Cairo,sans-serif] transition-opacity duration-700 ${
        secIn ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="absolute top-20 right-8 w-20 h-20 opacity-30 lg:top-32 lg:opacity-40"
        style={{
          backgroundImage: "radial-gradient(#F97316 1.2px, transparent 1.2px)",
          backgroundSize: "12px 12px",
        }}
        aria-hidden
      />
      <div
        className="absolute top-20 left-8 w-20 h-20 opacity-30 lg:top-32 lg:opacity-40"
        style={{
          backgroundImage: "radial-gradient(#F97316 1.2px, transparent 1.2px)",
          backgroundSize: "12px 12px",
        }}
        aria-hidden
      />

      <div className="container mx-auto px-4 -mt-[30px]">
        <div className="text-center max-w-2xl mx-auto -mt-[30px]">
          <h2 className="origin-top text-[37px] font-[Tajawal] font-extrabold leading-[1.08] tracking-tight text-foreground scale-[0.853] sm:scale-[0.896] sm:text-[52px] lg:scale-[0.926] lg:text-[71px]">
            كيف <span className="inline-block translate-y-[2px] text-primary">يعمل</span> التقييم؟
          </h2>
          <div
            aria-hidden
            className="relative mx-auto mt-[5px] h-[2px] w-full max-w-xs overflow-hidden sm:max-w-sm lg:max-w-md"
          >
            <div className="h-full w-full bg-gradient-to-l from-[#FF6B00]/30 via-[#FF6B00]/12 to-transparent" />
            {secIn && (
              <span
                className="pointer-events-none absolute inset-y-0 right-0 w-1/4 animate-title-line-shimmer-pingpong bg-gradient-to-l from-transparent via-[#FF6B00]/55 to-transparent"
              />
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground sm:mt-4 sm:text-base">
            عملية بسيطة وسريعة للحصول على برنامجك المخصص بخطوات مدروسة.
          </p>
        </div>

        {/* Mobile: compact animated viewport */}
        <div
          className="lg:hidden mt-5 flex flex-col items-center justify-center max-h-[85vh] min-h-0 px-1"
        >
          <PhoneMockup activeStep={activeStep} compact />
          <StepDots activeStep={activeStep} onSelect={handleStepSelect} />
          <p className="mt-3 text-center text-[11px] text-muted-foreground max-w-[240px] leading-relaxed">
            {ASSESSMENT_CHECKLIST[activeStep].label}
          </p>
        </div>

        {/* Desktop: timeline + cards + animated phone */}
        <div className="relative mt-16 hidden lg:block">
          <div
            className="absolute left-0 right-0 top-[40px] h-0 border-t-2 border-dashed border-primary/40"
            aria-hidden
          />

          <div className="grid grid-cols-[1fr_auto_1fr_auto_320px_auto_1fr_auto_1fr] items-center gap-4 relative z-10">
            <StepNumber n="01" />
            <Arrow />
            <StepNumber n="02" />
            <Arrow />
            <div />
            <Arrow />
            <StepNumber n="03" />
            <Arrow />
            <StepNumber n="04" />
          </div>

          <div className="mt-8 grid grid-cols-[1fr_1fr_320px_1fr_1fr] gap-6 items-start">
            <StepCard step={steps[0]} index={0} />
            <StepCard step={steps[1]} index={1} />
            <div className="-mt-32 flex flex-col items-center justify-center">
              <PhoneMockup activeStep={activeStep} />
              <StepDots activeStep={activeStep} onSelect={handleStepSelect} />
            </div>
            <StepCard step={steps[2]} index={2} />
            <StepCard step={steps[3]} index={3} />
          </div>
        </div>

        <div className="relative mt-10 lg:mt-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-3 top-4 bottom-0 rounded-2xl bg-[#1A1816]/20 shadow-[inset_0_3px_10px_rgba(15,23,42,0.12)] lg:inset-x-4 lg:rounded-3xl"
          />

          <div
            aria-hidden
            className="pointer-events-none absolute -inset-2 rounded-2xl bg-[#FF6B00]/20 blur-2xl animate-warning-card-outer-glow lg:-inset-3 lg:rounded-3xl"
          />

          <div
            className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-gradient-to-br from-[#252220] via-[#1A1818] to-[#232019] p-4 shadow-[0_1px_0_rgba(255,255,255,0.07)_inset,0_20px_44px_-16px_rgba(255,107,0,0.24),0_14px_36px_-16px_rgba(15,23,42,0.42)] ring-1 ring-white/[0.06] transition-[transform,opacity,box-shadow] duration-700 ease-out sm:p-5 lg:rounded-3xl lg:p-6"
            style={{
              opacity: secIn ? 1 : 0,
              transform: secIn ? "translateY(-8px) scale(1)" : "translateY(18px) scale(0.97)",
              boxShadow: secIn
                ? "0 1px 0 rgba(255,255,255,0.09) inset, 0 24px 52px -18px rgba(255,107,0,0.28), 0 18px 44px -18px rgba(15,23,42,0.52), 0 0 0 1px rgba(255,107,0,0.12)"
                : undefined,
              transitionDelay: "400ms",
            }}
          >
            <span
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl lg:rounded-3xl"
              aria-hidden
            >
              <span
                className="absolute inset-y-[-30%] left-0 h-[160%] w-[50%] animate-warning-card-shimmer bg-gradient-to-r from-transparent via-white/14 to-transparent"
              />
            </span>
            <span
              className="pointer-events-none absolute inset-0 rounded-2xl animate-warning-card-inner-glow lg:rounded-3xl"
              aria-hidden
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px animate-warning-card-border-pulse bg-gradient-to-r from-transparent via-white/25 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FF6B00]/[0.12] blur-3xl animate-warning-card-outer-glow"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-4 left-1/4 h-20 w-20 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(255,107,0,0.5) 1px, transparent 1.5px)",
                backgroundSize: "10px 10px",
              }}
            />

            <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
              <div className="min-w-0 text-center font-[Tajawal]">
                <h3 className="text-[22px] font-black leading-[1.2] tracking-tight sm:text-[25px] lg:text-[27px]">
                  <span className="block text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
                    تقييم دقيق، برنامج مخصص،
                  </span>
                  <span className="mt-0.5 block text-[#FF6B00] [text-shadow:0_1px_3px_rgba(0,0,0,0.35)]">
                    نتائج حقيقية.
                  </span>
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/80 sm:text-[14px] lg:text-[15px] [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
                  كل خطوة تقربك أكثر من أفضل نسخة من نفسك.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                {trustFeatures.map((f) => (
                  <div
                    key={f.title}
                    className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] p-2.5 backdrop-blur-[2px] sm:gap-3 sm:p-3"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 shadow-[0_4px_14px_-6px_rgba(255,107,0,0.35)] ring-1 ring-[#FF6B00]/15 sm:h-10 sm:w-10">
                      <f.Icon className="h-4 w-4 shrink-0 text-[#FF8A3D] sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 text-right">
                      <p className="text-[12px] font-extrabold text-white sm:text-[13px] [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
                        {f.title}
                      </p>
                      <p className="mt-0.5 text-[10px] leading-snug text-white/75 sm:text-[11px] [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">
                        {f.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
