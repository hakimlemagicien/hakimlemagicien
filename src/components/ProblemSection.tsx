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
      className="relative overflow-hidden pb-16 font-[Tajawal] sm:pb-20 lg:pb-28"
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
              className="text-center font-[Tajawal] text-[26px] font-extrabold leading-[1.12] tracking-tight text-foreground lg:origin-top lg:text-[78px] lg:font-black lg:leading-[1.08] lg:scale-[0.926]"
            >
              <span className="block text-foreground">لماذا لا يحقق أغلب الناس</span>
              <span className="block text-[#FF6B00]">النتائج التي يريدونها؟</span>
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
        <div className="relative mt-9 space-y-5 lg:mt-12 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10 lg:space-y-0 xl:gap-12">
          {/* Cards — 2×2 grid for better space use */}
          <div className="relative order-1">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {PROBLEMS.map((p, i) => (
                <div
                  key={p.title}
                  className="transition-all duration-700"
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? "translateY(0)" : "translateY(16px)",
                    transitionDelay: `${i * 90}ms`,
                  }}
                >
                  <ProblemCard problem={p} index={i} />
                </div>
              ))}
            </div>
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
  return (
    <div className="group flex h-full flex-col rounded-[20px] border border-border/40 bg-white p-3.5 shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_40px_-18px_rgba(0,0,0,0.12)] sm:rounded-[24px] sm:p-5">
      <div
        className="relative mb-3 shrink-0 self-start animate-float-soft sm:mb-4"
        style={{ animationDelay: `${index * 0.6}s` }}
      >
        <div
          aria-hidden
          className="absolute inset-0 scale-90 rounded-full bg-[#FF6B00]/25 opacity-60 blur-lg transition-opacity duration-500 group-hover:opacity-80"
        />
        <div className="relative grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-gradient-to-br from-orange-50/90 via-white/85 to-[#FFF0E3]/90 shadow-[0_8px_22px_-10px_rgba(255,107,0,0.38),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-[#FF6B00]/10 backdrop-blur-sm transition-all duration-500 group-hover:scale-105 sm:h-14 sm:w-14">
          <Icon
            className="h-5 w-5 text-[#FF6B00] sm:h-6 sm:w-6"
            strokeWidth={2.25}
          />
        </div>
      </div>
      <div className="min-w-0 flex-1 text-right">
        <h3 className="text-[13px] font-extrabold leading-snug text-foreground sm:text-base">
          {problem.title}
        </h3>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground sm:mt-2 sm:text-sm">
          {problem.description}
        </p>
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
    <div className="relative mt-8 sm:mt-10 lg:mt-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-1.5 rounded-2xl bg-[#FF6B00]/18 blur-xl animate-warning-card-outer-glow lg:rounded-3xl"
      />

      <div
        className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#2A2521] via-[#1F1C18] to-[#2E2824] px-3.5 py-3.5 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_22px_48px_-14px_rgba(255,107,0,0.28),0_16px_40px_-18px_rgba(15,23,42,0.45)] ring-1 ring-white/[0.05] transition-[transform,opacity,box-shadow] duration-700 ease-out sm:px-4 sm:py-4 lg:rounded-3xl lg:px-5 lg:py-4"
        style={{
          opacity: active ? 1 : 0,
          transform: active ? "translateY(-6px) scale(1)" : "translateY(14px) scale(0.97)",
          boxShadow: active
            ? "0 1px 0 rgba(255,255,255,0.08) inset, 0 28px 56px -16px rgba(255,107,0,0.32), 0 20px 48px -18px rgba(15,23,42,0.55), 0 0 0 1px rgba(255,107,0,0.14)"
            : undefined,
          transitionDelay: "400ms",
        }}
      >
        <span
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl lg:rounded-3xl"
          aria-hidden
        >
          <span className="absolute inset-y-[-30%] left-0 h-[160%] w-[50%] animate-warning-card-shimmer bg-gradient-to-r from-transparent via-white/14 to-transparent" />
        </span>
        <span
          className="pointer-events-none absolute inset-0 rounded-2xl animate-warning-card-inner-glow lg:rounded-3xl"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div
              className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow-[0_6px_18px_-6px_rgba(255,107,0,0.65)] sm:h-10 sm:w-10"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #ff8a3d 0%, #f97316 60%, #ea580c 100%)",
              }}
            >
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.2} />
            </div>

            <div className="min-w-0 flex-1 text-right font-[Tajawal]">
              <h3 className="text-[15px] font-black leading-[1.25] tracking-tight sm:text-[17px] lg:text-[18px]">
                <span className="text-white/95">المشكلة ليست فيك... </span>
                <span className="text-[#FF6B00]">المشكلة في الخطة التي تتبعها.</span>
              </h3>
              <p className="mt-1 text-[12px] leading-relaxed text-white/60 sm:text-[13px]">
                كل جسم مختلف، وكل هدف يحتاج استراتيجية خاصة — نتائج أسرع واستدامة أعلى.
              </p>
            </div>
          </div>

          <a
            href="/quiz"
            className="group relative inline-flex w-full shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-[#FF6B00]/35 bg-white/[0.06] px-4 py-2.5 text-[13px] font-bold text-white/95 shadow-[0_8px_24px_-10px_rgba(255,107,0,0.45)] backdrop-blur-sm transition-[transform,background-color,border-color,box-shadow] duration-300 hover:scale-[1.02] hover:border-[#FF6B00] hover:bg-[#FF6B00]/12 hover:shadow-[0_0_0_5px_rgba(255,107,0,0.18),0_16px_40px_-12px_rgba(255,107,0,0.5)] active:scale-[0.98] sm:w-auto sm:px-5"
          >
            <span
              className="pointer-events-none absolute -inset-1 rounded-full bg-[#FF6B00]/25 blur-md animate-warning-cta-glow"
              aria-hidden
            />
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full" aria-hidden>
              <span className="absolute inset-y-[-20%] left-0 h-[140%] w-[45%] animate-cta-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </span>
            <span className="relative z-10">اكتشف الحل المناسب لك</span>
            <ArrowLeft
              className="relative z-10 h-3.5 w-3.5 text-[#FF6B00] transition-transform duration-300 group-hover:-translate-x-1"
              strokeWidth={2.5}
            />
          </a>
        </div>
      </div>
    </div>
  );
}
