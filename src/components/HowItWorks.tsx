import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  MessageCircleQuestion,
  BarChart3,
  ClipboardList,
  CheckCircle2,
  ArrowLeft,
  Rocket,
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

function PhoneMockup() {
  const progress = 50;
  const r = 54;
  const c = 2 * Math.PI * r;
  const dash = (progress / 100) * c;

  const checklist = [
    { label: "المعلومات الأساسية", done: true },
    { label: "الهدف والمدة", done: true },
    { label: "النشاط الحالي", done: false },
    { label: "التغذية ونمط الحياة", done: false },
  ];

  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px] animate-float-phone">
      {/* Soft beige circle behind */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-[360px] h-[360px] rounded-full bg-beige" />
      </div>

      <div className="relative rounded-[44px] bg-black p-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)]">
        <div className="relative overflow-hidden rounded-[36px] bg-white aspect-[9/19.5]">
          {/* status bar */}
          <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-black">
            <span>9:41</span>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 h-6 w-28 rounded-full bg-black" />
            <div className="flex items-center gap-1">
              <Signal size={12} />
              <Wifi size={12} />
              <BatteryFull size={14} />
            </div>
          </div>

          <div className="px-5 pt-6 pb-4">
            <p className="text-center text-[13px] font-bold text-foreground">تقدم التقييم</p>

            <div className="relative mx-auto mt-4 w-[140px] h-[140px]">
              <svg viewBox="0 0 140 140" className="-rotate-90">
                <circle cx="70" cy="70" r={r} stroke="#FFF1E5" strokeWidth="10" fill="none" />
                <circle
                  cx="70"
                  cy="70"
                  r={r}
                  stroke="#F97316"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${c}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-foreground">50%</span>
                <span className="text-[10px] text-muted-foreground mt-1">تم إكمال التقييم</span>
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {checklist.map((it) => (
                <li
                  key={it.label}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[#F1F1F1] bg-white px-3 py-2"
                >
                  <span className="text-[11px] font-semibold text-foreground">{it.label}</span>
                  {it.done ? (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#22C55E] text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="h-5 w-5 rounded-full border-2 border-[#E5E7EB]" />
                  )}
                </li>
              ))}
            </ul>

            <Link
              to="/quiz"
              className="mt-4 flex w-full items-center justify-center rounded-2xl bg-primary py-3 text-[12px] font-bold text-white shadow-cta"
            >
              متابعة التقييم
            </Link>
          </div>
        </div>
      </div>
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

  return (
    <section
      id="how"
      ref={secRef}
      className={`relative bg-white py-20 lg:py-28 overflow-hidden transition-opacity duration-700 ${
        secIn ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* dotted decorations */}
      <div
        className="absolute top-32 right-8 w-24 h-24 opacity-40"
        style={{
          backgroundImage: "radial-gradient(#F97316 1.2px, transparent 1.2px)",
          backgroundSize: "12px 12px",
        }}
        aria-hidden
      />
      <div
        className="absolute top-32 left-8 w-24 h-24 opacity-40"
        style={{
          backgroundImage: "radial-gradient(#F97316 1.2px, transparent 1.2px)",
          backgroundSize: "12px 12px",
        }}
        aria-hidden
      />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF7ED] px-4 py-1.5 text-sm font-bold text-primary">
            <Rocket size={14} /> 4 خطوات بسيطة
          </span>
          <h2 className="mt-5 text-4xl sm:text-5xl font-extrabold text-foreground leading-tight">
            كيف <span className="text-primary">يعمل</span> التقييم؟
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            عملية بسيطة وسريعة للحصول على برنامجك المخصص بخطوات مدروسة.
          </p>
        </div>

        {/* Desktop layout: timeline row + phone center + cards row */}
        <div className="relative mt-16">
          {/* dotted line behind numbers */}
          <div
            className="hidden lg:block absolute left-0 right-0 top-[40px] h-0 border-t-2 border-dashed border-primary/40"
            aria-hidden
          />

          {/* Numbers row */}
          <div className="hidden lg:grid grid-cols-[1fr_auto_1fr_auto_320px_auto_1fr_auto_1fr] items-center gap-4 relative z-10">
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

          {/* Cards + phone row */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_320px_1fr_1fr] gap-6 items-start">
            <StepCard step={steps[0]} index={0} />
            <StepCard step={steps[1]} index={1} />
            <div className="order-first sm:order-none sm:col-span-2 lg:col-span-1 lg:row-span-1 lg:-mt-32 flex justify-center">
              <PhoneMockup />
            </div>
            <StepCard step={steps[2]} index={2} />
            <StepCard step={steps[3]} index={3} />
          </div>
        </div>

        {/* Bottom trust block */}
        <div className="mt-16 rounded-[32px] bg-gradient-to-l from-[#FAF6F2] to-[#FFF7ED] p-6 sm:p-8 lg:p-10 border border-[#F1F1F1]">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] items-center gap-8">
            {/* Rocket card */}
            <div className="grid h-24 w-24 place-items-center rounded-3xl bg-white shadow-card mx-auto animate-float-soft">
              <Rocket className="text-primary" size={36} strokeWidth={1.8} />
            </div>

            {/* Headline */}
            <div className="text-center lg:text-right">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                تقييم دقيق، برنامج مخصص، <span className="text-primary">نتائج حقيقية.</span>
              </h3>
              <p className="mt-3 text-muted-foreground">
                كل خطوة تقربك أكثر من أفضل نسخة من نفسك.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {trustFeatures.map((f) => (
                <div key={f.title} className="text-center">
                  <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-white border border-[#F1F1F1] shadow-sm">
                    <f.Icon className="text-primary" size={20} strokeWidth={1.8} />
                  </div>
                  <p className="mt-2 text-sm font-bold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
