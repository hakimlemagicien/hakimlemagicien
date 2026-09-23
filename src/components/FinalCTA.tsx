import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, ShieldCheck, Zap, TrendingDown, TrendingUp } from "lucide-react";
import { MarketingAppShowcase } from "@/components/MarketingAppShowcase";

function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, threshold]);
  return { ref, inView };
}

function useCount(target: number, active: boolean, duration = 1600) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return v;
}

const CARD_SHADOW = "0 10px 40px rgba(0,0,0,0.08)";

function ProgressCard({
  progress,
  dash,
  circumference,
}: {
  progress: number;
  dash: number;
  circumference: number;
}) {
  return (
    <div
      className="cta-float w-[123px] rounded-2xl bg-white p-3 sm:w-[143px]"
      style={{ borderRadius: 24, boxShadow: CARD_SHADOW, animationDelay: "0s" }}
    >
      <div className="mb-2 text-right text-sm font-bold text-[#111827]">تقدمك</div>
      <div className="relative mx-auto h-[86px] w-[86px]">
        <svg width="86" height="86" viewBox="0 0 86 86" className="-rotate-90">
          <circle cx="43" cy="43" r="38" stroke="#FFF7ED" strokeWidth="8" fill="none" />
          <circle
            cx="43"
            cy="43"
            r="38"
            stroke="#F97316"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: "stroke-dasharray 1.5s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-base font-black text-[#111827]">
          {progress}%
        </div>
      </div>
      <div className="mt-2 text-right text-xs text-[#6B7280]">أنت على الطريق الصحيح!</div>
    </div>
  );
}

const GOAL_CYCLE_MS = 2500;

const GOAL_SLIDES = [
  {
    label: "تنشيف الجسم",
    value: "-12 كغ",
    color: "#22C55E",
    Icon: TrendingDown,
    chartPoints: "0,30 20,28 40,24 60,18 80,14 100,8 120,4",
  },
  {
    label: "زيادة وزن صحي",
    value: "+8 كغ",
    color: "#F97316",
    Icon: TrendingUp,
    chartPoints: "0,8 20,12 40,16 60,20 80,24 100,28 120,32",
  },
  {
    label: "تكبير منطقة معينة",
    value: "+6 سم",
    color: "#F97316",
    Icon: TrendingUp,
    chartPoints: "0,10 20,14 40,18 60,22 80,26 100,28 120,30",
  },
  {
    label: "بناء العضلات",
    value: "+4 كغ",
    color: "#F97316",
    Icon: TrendingUp,
    chartPoints: "0,12 20,14 40,18 60,20 80,22 100,26 120,28",
  },
  {
    label: "شد وتنحيف",
    value: "-8 كغ",
    color: "#22C55E",
    Icon: TrendingDown,
    chartPoints: "0,30 20,28 40,24 60,18 80,14 100,8 120,4",
  },
];

function GoalCard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((i) => (i + 1) % GOAL_SLIDES.length);
    }, GOAL_CYCLE_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="cta-float w-[123px] rounded-2xl bg-white p-3 sm:w-[143px]"
      style={{ borderRadius: 24, boxShadow: CARD_SHADOW, animationDelay: "1.5s" }}
    >
      <div className="text-right text-xs font-bold text-[#6B7280]">هدفك</div>
      <div className="relative mt-1 h-[118px]">
        {GOAL_SLIDES.map((slide, i) => {
          const TrendIcon = slide.Icon;
          const active = i === index;

          return (
            <div
              key={slide.label}
              className="absolute inset-0 transition-opacity duration-300 ease-out"
              style={{
                opacity: active ? 1 : 0,
                pointerEvents: active ? "auto" : "none",
              }}
              aria-hidden={!active}
            >
              <div className="flex h-[34px] items-end justify-end text-right text-xs font-bold leading-tight text-[#111827] line-clamp-2">
                {slide.label}
              </div>
              <div className="mt-2 flex h-[28px] items-center justify-end gap-2">
                <span className="text-lg font-black leading-none" style={{ color: slide.color }}>
                  {slide.value}
                </span>
                <TrendIcon className="h-4 w-4 shrink-0" style={{ color: slide.color }} />
              </div>
              <svg viewBox="0 0 120 40" className="mt-1 h-8 w-full shrink-0">
                <polyline
                  points={slide.chartPoints}
                  fill="none"
                  stroke={slide.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <div className="mt-0 text-right text-[10px] leading-[14px] text-[#6B7280]">
                خلال 3 أشهر
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FinalCtaAssurance() {
  return (
    <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#E8E4DE] bg-white px-4 py-2 text-[11px] font-bold text-[#64748B] shadow-sm">
      <ShieldCheck className="h-4 w-4 text-[#22A95D]" />
      كل المزايا المشمولة تظهر داخل حسابك في التطبيق
    </div>
  );
}

function TodayCard() {
  return (
    <div
      className="cta-float w-[123px] rounded-2xl bg-white p-3 sm:w-[143px]"
      style={{ borderRadius: 24, boxShadow: CARD_SHADOW, animationDelay: "3s" }}
    >
      <div className="mb-2 text-right text-sm font-bold text-[#111827]">اليوم</div>
      <ul className="space-y-1.5">
        {["تمرين القوة", "الكارديو", "خطة التغذية"].map((t) => (
          <li key={t} className="flex items-center justify-end gap-2 text-xs text-[#111827]">
            <span>{t}</span>
            <span className="grid h-4 w-4 place-items-center rounded-full bg-[#22C55E]">
              <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FinalCTA() {
  const { ref, inView } = useInView<HTMLElement>(0.1);
  const progress = useCount(76, inView, 1800);

  const circumference = 2 * Math.PI * 38;
  const dash = (progress / 100) * circumference;

  return (
    <section
      ref={ref}
      dir="rtl"
      className="relative bg-white py-16 sm:py-20 lg:py-24"
      style={{ fontFamily: "'Tajawal', 'Cairo', sans-serif" }}
    >
      <style>{`
        @keyframes ctaFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes ctaGlow { 0%,100%{box-shadow:0 10px 30px -8px rgba(249,115,22,0.45)} 50%{box-shadow:0 16px 44px -8px rgba(249,115,22,0.65)} }
        @keyframes ctaMotivationBounce { 0%,100%{transform:translateY(0) scale(1) rotate(0deg)} 35%{transform:translateY(-4px) scale(1.14) rotate(-6deg)} 70%{transform:translateY(-1px) scale(1.06) rotate(6deg)} }
        @keyframes ctaMotivationPulse { 0%,100%{transform:scale(0.72);opacity:0.55} 50%{transform:scale(1.35);opacity:0} }
        @keyframes ctaAvatarCycle { from { opacity: 0; transform: scale(0.82); } to { opacity: 1; transform: scale(1); } }
        .cta-float { animation: ctaFloat 6s ease-in-out infinite; }
        .cta-glow { animation: ctaGlow 3s ease-in-out infinite; }
        .cta-motivation-bounce { animation: ctaMotivationBounce 1.35s ease-in-out infinite; }
        .cta-motivation-pulse { animation: ctaMotivationPulse 1.35s ease-out infinite; }
        .cta-avatar-cycle { animation: ctaAvatarCycle 0.45s ease-out; }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header — centered like reference */}
        <div
          className="mx-auto max-w-3xl text-center"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(20px)",
            transition: "all 800ms ease-out",
          }}
        >
          <h2 className="-mt-[30px] text-center font-[Tajawal] text-[26px] font-extrabold leading-[1.12] tracking-tight text-foreground lg:origin-top lg:-mt-[20px] lg:text-[78px] lg:font-black lg:leading-[1.08] lg:scale-[0.926]">
            رحلتك <span className="inline-block translate-y-[2px] text-primary">تبدأ اليوم</span>
          </h2>

          <p
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg"
            style={{ color: "#6B7280" }}
          >
            ابدأ مجاناً، ثم تابع تدريبك وتغذيتك وتقدمك وترطيبك داخل تطبيق MAAKFIT.
          </p>
        </div>

        {/* A real product-shaped preview keeps the closing message digital and concrete. */}
        <div
          className="relative mx-auto mt-10 max-w-5xl sm:mt-12 lg:mt-14"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(24px)",
            transition: "all 800ms ease-out 150ms",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute left-4 top-2 h-24 w-24 opacity-50 sm:left-8"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(249,115,22,0.35) 1.2px, transparent 1.5px)",
              backgroundSize: "12px 12px",
            }}
          />

          <div className="grid items-center gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            <div className="z-20 flex flex-col gap-3 sm:gap-4">
              <ProgressCard progress={progress} dash={dash} circumference={circumference} />
              <GoalCard />
              <TodayCard />
            </div>

            <div className="relative px-4 sm:px-10 lg:px-0">
              <MarketingAppShowcase compact />
            </div>
          </div>
        </div>

        {/* CTA + social proof — centered below visual */}
        <div
          className="mx-auto -mt-[10px] max-w-xl text-center sm:-mt-[2px]"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(20px)",
            transition: "all 800ms ease-out 250ms",
          }}
        >
          <Link
            to="/"
            className="cta-glow group inline-flex w-full items-center justify-between gap-6 rounded-full px-8 py-5 text-lg font-bold text-white transition-transform hover:-translate-y-0.5 sm:w-auto"
            style={{
              background: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",
              minWidth: "min(100%, 420px)",
            }}
          >
            <ArrowLeft className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-1" />
            <span className="flex-1 text-center">أنا جاهز للتغيير</span>
            <span
              className="relative flex h-7 w-7 shrink-0 items-center justify-center"
              aria-hidden
            >
              <span className="absolute inset-0 rounded-full bg-white/30 cta-motivation-pulse" />
              <Zap
                className="relative h-5 w-5 cta-motivation-bounce"
                strokeWidth={2.5}
                fill="currentColor"
              />
            </span>
          </Link>

          <FinalCtaAssurance />
        </div>
      </div>
    </section>
  );
}
