import { useEffect, useRef, useState } from "react";
import {
  ClipboardList,
  UtensilsCrossed,
  Clock,
  BarChart3,
  AlertTriangle,
  ArrowLeft,
  Zap,
  User,
  CalendarX,
} from "lucide-react";
import confusedCoach from "@/assets/confused-coach.png";

type Problem = {
  title: string;
  description: string;
  icon: typeof ClipboardList;
};

const PROBLEMS: Problem[] = [
  {
    title: "برامج عشوائية",
    description: "نسخ نفس البرنامج للجميع دون مراعاة الاختلافات الفردية.",
    icon: ClipboardList,
  },
  {
    title: "أنظمة غذائية غير مناسبة",
    description: "حرمان شديد أو خطط يصعب الاستمرار عليها.",
    icon: UtensilsCrossed,
  },
  {
    title: "عدم الاستمرارية",
    description: "تبدأ بحماس ثم تتوقف لأن الخطة غير واقعية.",
    icon: Clock,
  },
  {
    title: "غياب المتابعة والتعديل",
    description: "لا أحد يراجع تقدمك أو يصحح المسار عند الحاجة.",
    icon: BarChart3,
  },
];

function useInView<T extends HTMLElement>(threshold = 0.15) {
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

export function ProblemSection() {
  const { ref, inView } = useInView<HTMLElement>(0.12);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-b from-[#F3EFE8] via-[#F7F5F2] to-[#FAF8F5] pb-16 font-[Tajawal] sm:pb-20 lg:pb-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary/5 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-10 -left-24 h-80 w-80 rounded-full bg-beige blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-10 h-32 w-32 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(249,115,22,0.35) 1.2px, transparent 1.5px)",
          backgroundSize: "12px 12px",
        }}
      />

      <div className="relative mx-auto max-w-7xl -mt-5 px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8 lg:pt-14">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div
            className="transition-all duration-700"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(16px)",
              transitionDelay: "120ms",
            }}
          >
            <h2
              className="text-[34px] font-[Tajawal] font-black leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[68px]"
            >
              لماذا لا يحقق أغلب الناس{" "}
              <span className="text-[#FF6B00]">النتائج التي يريدونها؟</span>
            </h2>
            <div
              aria-hidden
              className="relative mx-auto mt-[5px] h-[2px] w-full max-w-xs overflow-hidden sm:max-w-sm lg:max-w-md"
            >
              <div
                className="h-full w-full bg-gradient-to-l from-[#FF6B00]/30 via-[#FF6B00]/12 to-transparent"
              />
              {inView && (
                <span
                  className="pointer-events-none absolute inset-y-0 right-0 w-1/4 animate-title-line-shimmer-pingpong bg-gradient-to-l from-transparent via-[#FF6B00]/55 to-transparent"
                />
              )}
            </div>
          </div>
          <p
            className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-xl transition-all duration-700"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(16px)",
              transitionDelay: "240ms",
            }}
          >
            ليست المشكلة في الإرادة أو الحماس...
            <br />
            بل في اتباع خطة لا تناسب جسمك وأهدافك ونمط حياتك.
          </p>
        </div>

        {/* Cards + Visual */}
        <div className="relative mt-9 space-y-4 sm:space-y-5 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:space-y-0">
          {/* Cards column with timeline */}
          <div className="relative order-1">
            <div className="absolute right-3 sm:right-4 top-6 bottom-6 w-[2px] bg-primary/15" />
            <div
              className="absolute right-3 sm:right-4 top-6 w-[2px] bg-primary transition-[height] duration-[1600ms] ease-out"
              style={{ height: inView ? "calc(100% - 3rem)" : "0%" }}
            />
            <ol className="space-y-4 sm:space-y-5">
              {PROBLEMS.map((p, i) => (
                <li
                  key={p.title}
                  className="relative pr-10 sm:pr-12 transition-all duration-700"
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? "translateY(0)" : "translateY(20px)",
                    transitionDelay: `${i * 1000}ms`,
                  }}
                >
                  <span className="absolute right-1.5 sm:right-2.5 top-10 h-3 w-3 rounded-full bg-primary ring-4 ring-[#F7F5F2] shadow-[0_0_0_3px_rgba(249,115,22,0.15)]" />
                  <ProblemCard problem={p} index={i} />
                </li>
              ))}
            </ol>
          </div>

          {/* Visual composition */}
          <div className="order-2 lg:-mr-6 xl:-mr-10">
            <ConfusedVisual active={inView} />
          </div>
        </div>

        {/* Warning Block */}
        <WarningBlock active={inView} />
      </div>
    </section>
  );
}

function ProblemCard({ problem, index }: { problem: Problem; index: number }) {
  const Icon = problem.icon;
  const rotations = ["-3deg", "2deg", "-2deg", "3deg"];
  return (
    <div className="group rounded-[24px] border border-border/40 bg-white p-5 shadow-card transition-all duration-500 sm:p-6 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)]">
      <div className="flex items-start gap-4 sm:gap-5">
        <div
          className="animate-float-soft grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary-soft transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 sm:h-[72px] sm:w-[72px]"
          style={{
            animationDelay: `${index * 0.6}s`,
            transform: `rotate(${rotations[index % rotations.length]})`,
          }}
        >
          <Icon className="h-8 w-8 text-primary sm:h-9 sm:w-9" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1 text-right">
          <h3 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl">
            {problem.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {problem.description}
          </p>
        </div>
      </div>
    </div>
  );
}

/** CCW slots — only top/left so cards glide fully into each other's place */
const FLOAT_CARD_POSITIONS: { top: string; left: string }[] = [
  { top: "1rem", left: "calc(100% - 7.75rem)" },
  { top: "1rem", left: "0.5rem" },
  { top: "calc(100% - 10rem)", left: "0" },
  { top: "calc(100% - 10rem)", left: "calc(100% - 7.75rem)" },
];

const FLOAT_CARDS = [
  {
    icon: Zap,
    title: "برنامج من الإنترنت",
    desc: "1,200 سعرة حرارية\nتمارين عامة",
  },
  {
    icon: UtensilsCrossed,
    title: "دايت قاسي",
    desc: "حرمان كبير\nنتائج مؤقتة",
  },
  {
    icon: CalendarX,
    title: "جدول جاهز",
    desc: "لا يناسب وقتك\nولا نمط حياتك",
  },
  {
    icon: User,
    title: "خطة صديق",
    desc: "تمارين مختلفة\nلنظام مختلف",
  },
];

function ConfusedVisual({ active }: { active: boolean }) {
  const [orbitStep, setOrbitStep] = useState(0);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      setOrbitStep((s) => (s + 1) % 4);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [active]);

  return (
    <div
      className="relative -mx-4 w-[calc(100%+2rem)] min-h-[min(92vw,420px)] sm:mx-0 sm:w-full sm:min-h-[460px] lg:min-h-[540px] transition-all duration-1000"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(24px)",
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={confusedCoach}
          alt="شخص حائر أمام خطط متضاربة"
          width={1024}
          height={1024}
          loading="lazy"
          className="absolute left-1/2 top-1/2 h-[calc(100%+70px)] w-[calc(100%+70px)] max-w-none -translate-x-1/2 translate-y-[calc(-50%+20px)] object-cover object-[center_24%]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[10px] bg-gradient-to-b from-[#F7F5F2] to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[10px] bg-gradient-to-t from-[#F7F5F2] to-transparent"
        />
      </div>

      {/* question marks */}
      {["18%", "62%", "82%"].map((top, i) => (
        <span
          key={i}
          className="absolute z-10 text-3xl sm:text-4xl font-black text-primary/30 animate-float-soft"
          style={{
            top,
            left: i % 2 === 0 ? "8%" : "auto",
            right: i % 2 === 1 ? "12%" : "auto",
            animationDelay: `${i * 0.8}s`,
          }}
        >
          ?
        </span>
      ))}

      {/* floating cards — CCW orbit every 2.5s */}
      {FLOAT_CARDS.map((card, i) => {
        const Icon = card.icon;
        const pos = FLOAT_CARD_POSITIONS[(i + orbitStep) % 4];
        return (
          <div
            key={card.title}
            className="absolute z-10 w-[118px] rounded-2xl border border-border/40 bg-white p-2.5 text-center font-[Tajawal] shadow-card will-change-[top,left] sm:w-[132px] sm:p-3"
            style={{
              top: pos.top,
              left: pos.left,
              opacity: active ? 1 : 0,
              transform: active ? "scale(0.92)" : "scale(0.85)",
              transition:
                "top 700ms ease-in-out, left 700ms ease-in-out, opacity 700ms ease-in-out, transform 700ms ease-in-out",
              transitionDelay: active && orbitStep === 0 ? `${400 + i * 180}ms` : "0ms",
            }}
          >
            <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-primary-soft sm:h-9 sm:w-9">
              <Icon className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" strokeWidth={2} />
            </div>
            <p className="mt-1.5 text-[11px] font-bold leading-tight text-foreground sm:text-xs">
              {card.title}
            </p>
            <p className="mt-1 text-[9px] leading-snug text-muted-foreground whitespace-pre-line sm:text-[10px]">
              {card.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function WarningBlock({ active }: { active: boolean }) {
  return (
    <div
      className="relative mt-14 overflow-hidden rounded-[36px] p-6 transition-all duration-1000 sm:mt-20 sm:p-10 lg:mt-24 lg:p-14"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.99 0.006 70) 0%, oklch(0.97 0.02 60) 100%)",
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(24px)",
        transitionDelay: "400ms",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full border border-primary/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-4 left-1/3 h-20 w-28 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(249,115,22,0.35) 1.2px, transparent 1.5px)",
          backgroundSize: "12px 12px",
        }}
      />

      <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr_auto] lg:gap-12">
        <div className="relative mx-auto shrink-0 lg:mx-0">
          <div className="absolute inset-0 animate-pulse-soft rounded-full bg-primary/25 blur-2xl" />
          <div className="absolute inset-2 rounded-full border border-primary/20" />
          <div
            className="relative grid h-28 w-28 animate-float-soft place-items-center rounded-3xl text-white shadow-cta sm:h-32 sm:w-32"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #ff8a3d 0%, #f97316 60%, #ea580c 100%)",
            }}
          >
            <AlertTriangle className="h-14 w-14 sm:h-16 sm:w-16" strokeWidth={2.2} />
          </div>
        </div>

        <div className="text-center lg:text-right">
          <h3 className="text-[30px] font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[56px]">
            المشكلة ليست فيك...
          </h3>
          <h4 className="mt-2 text-[26px] font-black leading-[1.1] tracking-tight text-[#FF6B00] sm:text-4xl lg:text-[44px]">
            المشكلة في الخطة التي تتبعها.
          </h4>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
            كل جسم مختلف، وكل هدف يحتاج إلى استراتيجية خاصة لتحقيق أفضل النتائج بأسرع وقت
            وبأعلى استدامة.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <a
            href="/quiz"
            className="group inline-flex items-center gap-3 rounded-full border-2 border-primary/30 bg-white px-7 py-4 text-base font-bold text-foreground shadow-soft transition-all duration-300 sm:px-8 sm:py-5 sm:text-lg hover:-translate-y-1 hover:border-primary hover:shadow-[0_0_0_6px_rgba(249,115,22,0.15),0_18px_40px_-12px_rgba(249,115,22,0.45)]"
          >
            <span>اكتشف الحل المناسب لك</span>
            <ArrowLeft className="h-5 w-5 text-primary transition-transform duration-300 group-hover:-translate-x-1" />
          </a>
        </div>
      </div>
    </div>
  );
}
