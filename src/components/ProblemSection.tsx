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
import confusedCoach from "@/assets/confused-coach.jpg";

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
      className="relative overflow-hidden bg-background py-16 sm:py-20 lg:py-28"
    >
      {/* Soft parallax background blobs */}
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
        className="pointer-events-none absolute top-1/3 left-10 h-32 w-32 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(249,115,22,0.35) 1.2px, transparent 1.5px)",
          backgroundSize: "12px 12px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-bold text-primary transition-all duration-700"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(12px)",
            }}
          >
            <AlertTriangle className="h-4 w-4" />
            لماذا لا يحقق أغلب الناس النتائج؟
          </div>
          <h2
            className="mt-5 font-black text-foreground tracking-tight text-[40px] sm:text-6xl lg:text-[72px] leading-[1.05] transition-all duration-700"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(16px)",
              transitionDelay: "120ms",
            }}
          >
            لماذا لا يحقق أغلب الناس{" "}
            <span className="text-primary">النتائج التي يريدونها؟</span>
          </h2>
          <p
            className="mt-5 text-base sm:text-xl text-muted-foreground leading-relaxed transition-all duration-700"
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
        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Cards column with timeline */}
          <div className="relative order-2 lg:order-1">
            {/* timeline line */}
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
                    transitionDelay: `${300 + i * 140}ms`,
                  }}
                >
                  {/* timeline dot */}
                  <span className="absolute right-1.5 sm:right-2.5 top-10 h-3 w-3 rounded-full bg-primary ring-4 ring-background shadow-[0_0_0_3px_rgba(249,115,22,0.15)]" />
                  <ProblemCard problem={p} index={i} />
                </li>
              ))}
            </ol>
          </div>

          {/* Visual composition */}
          <div className="order-1 lg:order-2">
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
    <div className="group rounded-[24px] bg-white border border-border/40 shadow-card p-5 sm:p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)]">
      <div className="flex items-start gap-4 sm:gap-5">
        <div
          className="shrink-0 grid h-16 w-16 sm:h-[72px] sm:w-[72px] place-items-center rounded-full bg-primary-soft animate-float-soft transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
          style={{
            animationDelay: `${index * 0.6}s`,
            transform: `rotate(${rotations[index % rotations.length]})`,
          }}
        >
          <Icon className="h-8 w-8 sm:h-9 sm:w-9 text-primary" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1 text-right">
          <h3 className="font-extrabold text-lg sm:text-xl text-foreground leading-tight">
            {problem.title}
          </h3>
          <p className="mt-2 text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
            {problem.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function ConfusedVisual({ active }: { active: boolean }) {
  const floatingCards = [
    {
      icon: Zap,
      title: "برنامج من الإنترنت",
      desc: "1,200 سعرة حرارية\nتمارين عامة",
      pos: "top-4 right-2 sm:right-4",
      delay: "0s",
    },
    {
      icon: UtensilsCrossed,
      title: "دايت قاسي",
      desc: "حرمان كبير\nنتائج مؤقتة",
      pos: "top-4 left-2 sm:left-4",
      delay: "1.2s",
    },
    {
      icon: User,
      title: "خطة صديق",
      desc: "تمارين مختلفة\nلنظام مختلف",
      pos: "bottom-16 right-0 sm:right-2",
      delay: "2.1s",
    },
    {
      icon: CalendarX,
      title: "جدول جاهز",
      desc: "لا يناسب وقتك\nولا نمط حياتك",
      pos: "bottom-16 left-0 sm:left-2",
      delay: "3s",
    },
  ];

  return (
    <div
      className="relative mx-auto max-w-xl aspect-square transition-all duration-1000"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(24px)",
      }}
    >
      {/* beige backdrop */}
      <div className="absolute inset-6 rounded-[40px] bg-beige" />
      {/* coach image */}
      <div className="absolute inset-8 rounded-[36px] overflow-hidden shadow-soft">
        <img
          src={confusedCoach}
          alt="شخص حائر أمام خطط متضاربة"
          width={1024}
          height={1024}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>

      {/* question marks */}
      {["18%", "62%", "82%"].map((top, i) => (
        <span
          key={i}
          className="absolute text-3xl sm:text-4xl font-black text-primary/30 animate-float-soft"
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

      {/* floating cards */}
      {floatingCards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`absolute ${c.pos} bg-white rounded-2xl shadow-card border border-border/40 p-3 sm:p-3.5 w-[130px] sm:w-[150px] text-center animate-float-soft transition-all duration-700`}
            style={{
              animationDelay: c.delay,
              opacity: active ? 1 : 0,
              transform: active ? "translateY(0) scale(1)" : "translateY(10px) scale(0.9)",
              transitionDelay: `${400 + i * 180}ms`,
            }}
          >
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-primary-soft">
              <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
            </div>
            <p className="mt-2 text-xs sm:text-sm font-bold text-foreground leading-tight">
              {c.title}
            </p>
            <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground leading-snug whitespace-pre-line">
              {c.desc}
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
      className="relative mt-16 lg:mt-24 rounded-[36px] overflow-hidden p-6 sm:p-10 lg:p-14 transition-all duration-1000"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.975 0.012 70) 0%, oklch(0.96 0.025 60) 100%)",
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(24px)",
        transitionDelay: "400ms",
      }}
    >
      {/* decorative rings */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full border border-primary/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-4 left-1/3 w-28 h-20 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(249,115,22,0.35) 1.2px, transparent 1.5px)",
          backgroundSize: "12px 12px",
        }}
      />

      <div className="grid lg:grid-cols-[auto_1fr_auto] gap-8 lg:gap-12 items-center">
        {/* Icon */}
        <div className="relative mx-auto lg:mx-0 shrink-0">
          <div className="absolute inset-0 rounded-full bg-primary/25 blur-2xl animate-pulse-soft" />
          <div className="absolute inset-2 rounded-full border border-primary/20" />
          <div
            className="relative grid h-28 w-28 sm:h-32 sm:w-32 place-items-center rounded-3xl text-white shadow-cta animate-float-soft"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #ff8a3d 0%, #f97316 60%, #ea580c 100%)",
            }}
          >
            <AlertTriangle className="h-14 w-14 sm:h-16 sm:w-16" strokeWidth={2.2} />
          </div>
        </div>

        {/* Text */}
        <div className="text-center lg:text-right">
          <h3 className="font-black text-foreground tracking-tight text-[34px] sm:text-5xl lg:text-[56px] leading-[1.05]">
            المشكلة ليست فيك...
          </h3>
          <h4 className="mt-2 font-black text-primary tracking-tight text-[28px] sm:text-4xl lg:text-[44px] leading-[1.1]">
            المشكلة في الخطة التي تتبعها.
          </h4>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
            كل جسم مختلف، وكل هدف يحتاج إلى استراتيجية خاصة لتحقيق أفضل النتائج بأسرع وقت
            وبأعلى استدامة.
          </p>
        </div>

        {/* CTA */}
        <div className="flex justify-center lg:justify-end">
          <a
            href="/quiz"
            className="group inline-flex items-center gap-3 rounded-full bg-white border-2 border-primary/30 px-7 py-4 sm:px-8 sm:py-5 font-bold text-foreground text-base sm:text-lg shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-[0_0_0_6px_rgba(249,115,22,0.15),0_18px_40px_-12px_rgba(249,115,22,0.45)]"
          >
            <span>اكتشف الحل المناسب لك</span>
            <ArrowLeft className="h-5 w-5 text-primary transition-transform duration-300 group-hover:-translate-x-1" />
          </a>
        </div>
      </div>
    </div>
  );
}
