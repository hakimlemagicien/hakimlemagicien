import { useEffect, useRef, useState } from "react";
import {
  Check,
  Flame,
  Dumbbell,
  Target,
  TrendingUp,
  Activity,
  Shield,
  Sparkles,
  Ruler,
  Zap,
} from "lucide-react";
import stage1Img from "@/assets/stage1.png";
import stage2Img from "@/assets/stage2.png";
import stage3Img from "@/assets/stage3.png";

type Stage = {
  phase: string;
  title: string;
  days: string;
  dayNumber: string;
  checks: string[];
  resultLine1: string;
  resultLine2: string;
  resultIcon: typeof Flame;
  resultTone: "primary" | "success";
  image: string;
  badgeTone: "primary" | "success";
};

const STAGES: Stage[] = [
  {
    phase: "المرحلة الأولى",
    title: "بناء الأساس",
    days: "أيام 1 - 30",
    dayNumber: "30",
    checks: [
      "تقييم شامل لحالتك الحالية",
      "بناء عادات صحية جديدة",
      "خطة تغذية منظمة",
      "بداية فقدان الدهون",
    ],
    resultLine1: "2 - 5 كغ",
    resultLine2: "خسارة دهون",
    resultIcon: Flame,
    resultTone: "primary",
    image: stage1Img,
    badgeTone: "primary",
  },
  {
    phase: "المرحلة الثانية",
    title: "تسريع النتائج",
    days: "أيام 31 - 60",
    dayNumber: "60",
    checks: [
      "زيادة الكتلة العضلية",
      "تحسين القوة والتحمل",
      "استمرار فقدان الدهون",
      "تحسين مستويات الطاقة",
    ],
    resultLine1: "3 - 7 كغ",
    resultLine2: "كتلة عضلية",
    resultIcon: Dumbbell,
    resultTone: "success",
    image: stage2Img,
    badgeTone: "success",
  },
  {
    phase: "المرحلة الثالثة",
    title: "الوصول لأفضل نسخة",
    days: "أيام 61 - 90",
    dayNumber: "90",
    checks: [
      "شكل جسم أكثر تناسقاً",
      "تحسين الأداء البدني",
      "ثبات النتائج واستدامتها",
      "ثقة عالية بنفسك",
    ],
    resultLine1: "أفضل نسخة",
    resultLine2: "من نفسك",
    resultIcon: Target,
    resultTone: "primary",
    image: stage3Img,
    badgeTone: "primary",
  },
];

const STATS = [
  { icon: TrendingUp, value: "+85%", label: "زيادة الطاقة والنشاط", num: 85, prefix: "+", suffix: "%" },
  { icon: Activity, value: "-12kg", label: "متوسط خسارة دهون", num: 12, prefix: "-", suffix: "kg" },
  { icon: Dumbbell, value: "+4.7kg", label: "متوسط زيادة الكتلة العضلية", num: 4.7, prefix: "+", suffix: "kg", decimals: 1 },
  { icon: Shield, value: "90 يوم", label: "نحو حياة جديدة", num: 90, prefix: "", suffix: " يوم" },
];

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
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

function useCounter(target: number, active: boolean, decimals = 0, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Number((eased * target).toFixed(decimals)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, decimals, duration]);
  return value;
}

export function Results90() {
  const { ref: sectionRef, inView } = useInView<HTMLElement>(0.1);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-background py-16 sm:py-20 lg:py-28"
    >
      <FloatingBg />

      {/* Soft beige decorative shapes */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-24 h-72 w-72 rounded-full bg-beige opacity-70 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-32 -left-20 h-64 w-64 rounded-full bg-primary-soft opacity-60 blur-2xl"
      />
      {/* dot pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 left-6 h-28 w-40 opacity-50 hidden lg:block"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(249,115,22,0.35) 1.2px, transparent 1.5px)",
          backgroundSize: "12px 12px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-bold text-primary">
            <Sparkles className="h-4 w-4" />
            نتائج حقيقية خلال 90 يوم
          </div>
          <h2 className="mt-5 font-black text-foreground tracking-tight text-[40px] sm:text-6xl lg:text-[72px] leading-[1.05]">
            ماذا يمكنك تحقيقه
            <br />
            <span className="text-primary">خلال 90 يوماً؟</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
            برنامجك المخصص مصمم لمساعدتك على تحقيق أفضل نتائج في وقت قياسي وبشكل صحي ومستدام.
          </p>
        </div>

        {/* Desktop timeline */}
        <div className="relative mt-14 hidden lg:block">
          <div className="relative">
            <div className="absolute top-12 right-[10%] left-[10%] h-[2px] border-t-2 border-dashed border-primary/25" />
            <div
              className="absolute top-12 right-[10%] h-[2px] border-t-2 border-dashed border-primary transition-[width] duration-[1800ms] ease-out"
              style={{ width: inView ? "80%" : "0%" }}
            />
            <div className="relative grid grid-cols-3">
              {STAGES.map((s, i) => (
                <div key={s.dayNumber} className="flex flex-col items-center">
                  <div
                    className="grid h-24 w-24 place-items-center rounded-full bg-white ring-2 ring-primary/30 shadow-[0_10px_30px_-12px_rgba(249,115,22,0.45)] transition-all duration-700 animate-pulse-soft"
                    style={{
                      opacity: inView ? 1 : 0,
                      transform: inView ? "scale(1)" : "scale(0.7)",
                      transitionDelay: `${400 + i * 250}ms`,
                    }}
                  >
                    <div className="text-center">
                      <div className="text-primary font-black text-2xl leading-none">
                        {s.dayNumber}
                      </div>
                      <div className="text-primary/80 text-xs font-bold mt-1">يوم</div>
                    </div>
                  </div>
                  {/* arrow chip between, drawn on top */}
                  {i < 2 && (
                    <div
                      className="absolute top-[34px] hidden lg:grid h-8 w-8 place-items-center rounded-full bg-primary text-white shadow-[0_6px_16px_-4px_rgba(249,115,22,0.6)]"
                      style={{
                        right: `${i === 0 ? "33%" : "66%"}`,
                        transform: "translateX(50%)",
                        opacity: inView ? 1 : 0,
                        transition: "opacity 700ms ease-out",
                        transitionDelay: `${900 + i * 250}ms`,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cards row */}
          <div className="mt-10 grid grid-cols-3 gap-6">
            {STAGES.map((s, i) => (
              <StageCard key={s.dayNumber} stage={s} index={i} active={inView} />
            ))}
          </div>
        </div>

        {/* Mobile: vertical timeline + stacked cards */}
        <div className="mt-12 lg:hidden relative">
          <div className="absolute right-6 top-6 bottom-6 w-[2px] border-r-2 border-dashed border-primary/25" />
          <div
            className="absolute right-6 top-6 w-[2px] border-r-2 border-dashed border-primary transition-[height] duration-[1800ms] ease-out"
            style={{ height: inView ? "calc(100% - 3rem)" : "0%" }}
          />
          <ol className="space-y-6">
            {STAGES.map((s, i) => (
              <li
                key={s.dayNumber}
                className="relative pr-20"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(20px)",
                  transition: "all 700ms ease-out",
                  transitionDelay: `${300 + i * 200}ms`,
                }}
              >
                <div
                  className={`absolute right-0 top-6 grid h-14 w-14 place-items-center rounded-full text-white font-black ring-4 ring-background shadow-[0_8px_20px_-6px_rgba(249,115,22,0.55)] animate-pulse-soft ${
                    s.badgeTone === "success" ? "bg-success" : "bg-primary"
                  }`}
                >
                  <div className="text-center leading-none">
                    <div className="text-base">{s.dayNumber}</div>
                    <div className="text-[10px] font-bold mt-0.5 opacity-90">يوم</div>
                  </div>
                </div>
                <StageCard stage={s} index={i} active={inView} mobile />
              </li>
            ))}
          </ol>
        </div>

        {/* Bottom stats */}
        <BottomStats />
      </div>
    </section>
  );
}

function StageCard({
  stage,
  index,
  active,
  mobile = false,
}: {
  stage: Stage;
  index: number;
  active: boolean;
  mobile?: boolean;
}) {
  const ResultIcon = stage.resultIcon;
  const isSuccessBadge = stage.badgeTone === "success";
  const resultPrimary = stage.resultTone === "primary";

  return (
    <div
      className="group relative rounded-[28px] bg-white border border-border/40 shadow-card p-6 lg:p-7 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.18)]"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(28px)",
        transition: "opacity 700ms ease-out, transform 700ms ease-out",
        transitionDelay: `${600 + index * 150}ms`,
      }}
    >
      {/* phase badge */}
      <div className="flex justify-center">
        <span
          className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-extrabold ${
            isSuccessBadge
              ? "bg-success-soft text-success"
              : "bg-primary-soft text-primary"
          }`}
        >
          {stage.phase}
        </span>
      </div>

      <h3 className="mt-4 text-center font-black text-foreground tracking-tight text-2xl lg:text-3xl">
        {stage.title}
      </h3>
      <p className="mt-1 text-center text-sm text-muted-foreground font-medium">
        {stage.days}
      </p>

      {/* image */}
      <div className={`mt-4 relative mx-auto ${mobile ? "h-40 w-40" : "h-52 w-full"}`}>
        <img
          src={stage.image}
          alt={stage.title}
          width={768}
          height={1024}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain object-bottom animate-float-soft"
          style={{ animationDelay: `${index * 0.6}s` }}
        />
      </div>

      {/* checklist */}
      <ul className="mt-4 space-y-2.5">
        {stage.checks.map((c, i) => (
          <li
            key={c}
            className="flex items-center justify-end gap-2 text-[15px] text-foreground/90"
            style={{
              opacity: active ? 1 : 0,
              transform: active ? "translateX(0)" : "translateX(-8px)",
              transition: "all 400ms ease-out",
              transitionDelay: `${900 + index * 150 + i * 120}ms`,
            }}
          >
            <span className="text-right">{c}</span>
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          </li>
        ))}
      </ul>

      {/* result badge */}
      <div
        className={`mt-5 flex items-center justify-end gap-3 rounded-2xl px-4 py-3 animate-glow-soft ${
          resultPrimary ? "bg-primary-soft" : "bg-success-soft"
        }`}
      >
        <div className="text-right">
          <div
            className={`font-black text-base leading-tight ${
              resultPrimary ? "text-primary" : "text-success"
            }`}
          >
            {stage.resultLine1}
          </div>
          <div className="text-xs text-muted-foreground font-bold mt-0.5">
            {stage.resultLine2}
          </div>
        </div>
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-white shadow-md ${
            resultPrimary ? "bg-primary" : "bg-success"
          }`}
        >
          <ResultIcon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function BottomStats() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  return (
    <div
      ref={ref}
      className="mt-14 lg:mt-20 rounded-[32px] bg-beige p-6 sm:p-8 lg:p-10 border border-border/40"
    >
      <h3 className="text-center font-black text-foreground tracking-tight text-2xl sm:text-3xl lg:text-[34px]">
        نتائج تتجاوز التوقعات
      </h3>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {STATS.map((s, i) => (
          <StatItem key={s.label} stat={s} index={i} active={inView} />
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-border/60 flex items-center justify-center gap-2 text-center text-xs sm:text-sm text-muted-foreground">
        <Shield className="h-4 w-4 text-success shrink-0" />
        <span>النتائج تختلف من شخص لآخر وتعتمد على الالتزام بالخطة الموصوفة والمتابعة المستمرة.</span>
      </div>
    </div>
  );
}

function StatItem({
  stat,
  index,
  active,
}: {
  stat: (typeof STATS)[number];
  index: number;
  active: boolean;
}) {
  const value = useCounter(stat.num, active, stat.decimals ?? 0);
  const Icon = stat.icon;
  return (
    <div
      className="flex items-center gap-3 lg:gap-4 justify-center lg:justify-start"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(12px)",
        transition: "all 600ms ease-out",
        transitionDelay: `${200 + index * 120}ms`,
      }}
    >
      <span className="grid h-12 w-12 lg:h-14 lg:w-14 shrink-0 place-items-center rounded-full bg-white shadow-card">
        <Icon className="h-6 w-6 text-success" strokeWidth={2} />
      </span>
      <div className="text-right">
        <div className="font-black text-foreground text-xl lg:text-2xl leading-none tabular-nums">
          {stat.prefix}
          {stat.decimals ? value.toFixed(stat.decimals) : Math.round(value)}
          {stat.suffix}
        </div>
        <div className="mt-1 text-xs lg:text-sm text-muted-foreground font-medium">
          {stat.label}
        </div>
      </div>
    </div>
  );
}

function FloatingBg() {
  const items = [
    { Icon: Dumbbell, top: "10%", left: "5%", delay: "0s" },
    { Icon: Target, top: "30%", right: "8%", delay: "1.5s" },
    { Icon: Ruler, bottom: "30%", left: "10%", delay: "2.5s" },
    { Icon: Zap, top: "55%", right: "5%", delay: "3.5s" },
    { Icon: Shield, bottom: "10%", right: "20%", delay: "4.5s" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map(({ Icon, delay, ...pos }, i) => (
        <Icon
          key={i}
          className="absolute h-14 w-14 text-primary/[0.06] animate-float blur-[0.5px]"
          style={{ ...pos, animationDelay: delay } as React.CSSProperties}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}
