import { useEffect, useRef, useState } from "react";
import {
  ClipboardList,
  FileText,
  Target,
  BarChart3,
  BadgeCheck,
  Sparkles,
  Dumbbell,
  Ruler,
} from "lucide-react";
import phoneMockup from "@/assets/phone-mockup.jpg";
import avatar1 from "@/assets/avatar1.jpg";
import avatar2 from "@/assets/avatar2.jpg";
import avatar3 from "@/assets/avatar3.jpg";
import avatar4 from "@/assets/avatar4.jpg";

type Step = {
  number: string;
  title: string;
  description: string;
  icon: typeof ClipboardList;
};

const STEPS: Step[] = [
  {
    number: "01",
    title: "أجب على بعض الأسئلة",
    description: "أجب على أسئلة بسيطة حول هدفك، جسمك، ومستوى نشاطك.",
    icon: ClipboardList,
  },
  {
    number: "02",
    title: "نحلل أهدافك وحالتك",
    description: "نقوم بتحليل بياناتك لفهم احتياجاتك بشكل أفضل.",
    icon: BarChart3,
  },
  {
    number: "03",
    title: "نجهز البرنامج المناسب لك",
    description: "نحدد أفضل استراتيجية وخطة مناسبة لهدفك.",
    icon: FileText,
  },
  {
    number: "04",
    title: "ابدأ رحلتك نحو النتائج",
    description: "احصل على توصيتك وابدأ رحلتك نحو جسم أفضل.",
    icon: Target,
  },
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

function useCounter(target: number, active: boolean, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.floor(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

export function HowItWorks() {
  const { ref: sectionRef, inView } = useInView<HTMLElement>(0.15);
  const { ref: trustRef, inView: trustInView } = useInView<HTMLDivElement>(0.3);
  const count = useCounter(10000, trustInView);
  const avatars = [avatar1, avatar2, avatar3, avatar4];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-background py-16 sm:py-20 lg:py-28"
    >
      {/* Floating background icons */}
      <FloatingBg />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-bold text-primary">
            <Sparkles className="h-4 w-4" />
            خطوات بسيطة
          </div>
          <h2 className="mt-5 font-black text-foreground tracking-tight text-[44px] sm:text-6xl lg:text-[72px] leading-[1.05]">
            كيف يعمل التقييم؟
          </h2>
          <p className="mt-5 text-base sm:text-xl lg:text-2xl text-muted-foreground leading-relaxed">
            4 خطوات بسيطة للحصول على برنامجك المخصص وتحقيق أفضل النتائج.
          </p>
        </div>

        {/* Timeline desktop */}
        <div className="relative mt-14 hidden lg:block">
          {/* circles row */}
          <div className="relative">
            {/* base line */}
            <div className="absolute top-8 right-[6%] left-[6%] h-[2px] bg-primary/15" />
            {/* animated draw */}
            <div
              className="absolute top-8 right-[6%] h-[2px] bg-primary transition-[width] duration-[1600ms] ease-out"
              style={{ width: inView ? "88%" : "0%" }}
            />
            <div className="relative grid grid-cols-4 gap-6">
              {STEPS.map((s, i) => (
                <div key={s.number} className="flex justify-center">
                  <div
                    className="grid h-16 w-16 place-items-center rounded-full bg-primary text-white font-extrabold text-lg shadow-[0_8px_24px_-6px_rgba(249,115,22,0.55)] ring-4 ring-background transition-all duration-500"
                    style={{
                      opacity: inView ? 1 : 0,
                      transform: inView ? "scale(1)" : "scale(0.6)",
                      transitionDelay: `${400 + i * 200}ms`,
                    }}
                  >
                    {s.number}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* cards row */}
          <div className="mt-8 grid grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <StepCard key={s.number} step={s} index={i} active={inView} />
            ))}
          </div>
        </div>

        {/* Timeline mobile */}
        <div className="mt-12 lg:hidden relative">
          {/* vertical line */}
          <div className="absolute right-6 top-4 bottom-4 w-[2px] bg-primary/15" />
          <div
            className="absolute right-6 top-4 w-[2px] bg-primary transition-[height] duration-[1600ms] ease-out"
            style={{ height: inView ? "calc(100% - 2rem)" : "0%" }}
          />
          <ol className="space-y-5">
            {STEPS.map((s, i) => (
              <li
                key={s.number}
                className="relative pr-16 transition-all duration-700"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(20px)",
                  transitionDelay: `${200 + i * 150}ms`,
                }}
              >
                {/* number circle */}
                <div className="absolute right-0 top-4 grid h-13 w-13 h-[52px] w-[52px] place-items-center rounded-full bg-primary text-white font-extrabold text-base ring-4 ring-background shadow-[0_8px_20px_-6px_rgba(249,115,22,0.5)]">
                  {s.number}
                </div>
                <StepCard step={s} index={i} active={inView} mobile />
              </li>
            ))}
          </ol>
        </div>

        {/* Trust block */}
        <div
          ref={trustRef}
          className="mt-16 lg:mt-24 rounded-[36px] bg-beige p-6 sm:p-10 lg:p-16 relative overflow-hidden"
        >
          {/* dotted accent */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-6 left-6 w-28 h-28 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(249,115,22,0.35) 1.2px, transparent 1.5px)",
              backgroundSize: "12px 12px",
            }}
          />
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Phone (left on desktop, top on mobile) */}
            <div className="order-2 lg:order-1 flex justify-center">
              <div className="relative w-full max-w-md aspect-square animate-float-phone">
                <img
                  src={phoneMockup}
                  alt="تطبيق التقييم"
                  width={1024}
                  height={1024}
                  loading="lazy"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Text right */}
            <div className="order-1 lg:order-2 text-center lg:text-right">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="flex -space-x-2 space-x-reverse">
                  {avatars.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      width={44}
                      height={44}
                      loading="lazy"
                      className="h-11 w-11 rounded-full border-2 border-background object-cover"
                    />
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-success font-extrabold text-lg leading-none">
                    +{count.toLocaleString("en-US")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">عميل</p>
                </div>
              </div>

              <h3 className="mt-6 font-black text-foreground tracking-tight text-[40px] sm:text-5xl lg:text-[60px] leading-[1.05]">
                أنت في المكان الصحيح
              </h3>
              <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                آلاف الأشخاص حول العالم حصلوا على برامج مخصصة وساعدتهم على تحقيق نتائج حقيقية.
              </p>

              <div className="mt-8">
                <span className="group inline-flex items-center gap-3 rounded-full bg-white px-6 py-4 shadow-soft border border-white/80 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white shrink-0 animate-trust-glow">
                    <BadgeCheck className="h-5 w-5" />
                  </span>
                  <span className="font-bold text-foreground">ثقة الآلاف بنتائج حقيقية</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
  active,
  mobile = false,
}: {
  step: Step;
  index: number;
  active: boolean;
  mobile?: boolean;
}) {
  const Icon = step.icon;
  return (
    <div
      className={`group rounded-[28px] bg-white border border-border/40 shadow-card p-6 lg:p-7 text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] ${
        mobile ? "" : ""
      }`}
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(24px)",
        transitionDelay: `${600 + index * 150}ms`,
      }}
    >
      <div className="mx-auto grid h-[100px] w-[100px] lg:h-[120px] lg:w-[120px] place-items-center rounded-full bg-beige transition-transform duration-500 group-hover:scale-105">
        <Icon className="h-12 w-12 lg:h-14 lg:w-14 text-foreground" strokeWidth={1.6} />
      </div>
      <h3 className="mt-5 font-extrabold text-lg lg:text-xl text-foreground leading-tight">
        {step.title}
      </h3>
      <p className="mt-3 text-sm lg:text-[15px] text-muted-foreground leading-relaxed">
        {step.description}
      </p>
    </div>
  );
}

function FloatingBg() {
  const items = [
    { Icon: Dumbbell, top: "8%", left: "4%", delay: "0s" },
    { Icon: Ruler, top: "22%", right: "6%", delay: "1.2s" },
    { Icon: Target, bottom: "30%", left: "8%", delay: "2.4s" },
    { Icon: FileText, top: "55%", right: "10%", delay: "3.6s" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map(({ Icon, delay, ...pos }, i) => (
        <Icon
          key={i}
          className="absolute h-16 w-16 text-primary/5 animate-float blur-[1px]"
          style={{ ...pos, animationDelay: delay } as React.CSSProperties}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}
