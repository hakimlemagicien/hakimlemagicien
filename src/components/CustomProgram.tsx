import { useEffect, useRef, useState } from "react";
import {
  UserCircle2,
  BarChart3,
  UtensilsCrossed,
  Dumbbell,
  ClipboardList,
  Target,
  Salad,
  TrendingUp,
  MessageCircle,
  ShieldCheck,
  ArrowLeft,
  Flame,
  Sparkles,
} from "lucide-react";
import coachPhone from "@/assets/coach-phone.jpg";

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

const FEATURES = [
  {
    icon: UserCircle2,
    title: "100% مخصص لك",
    desc: "كل تفاصيل البرنامج مصممة بناءً على بياناتك وأهدافك.",
  },
  {
    icon: BarChart3,
    title: "متابعة ذكية",
    desc: "نراقب تقدمك ونعدل خطتك باستمرار لتحقيق أفضل النتائج.",
  },
  {
    icon: UtensilsCrossed,
    title: "خطة تغذية مرنة",
    desc: "تناسب تفضيلاتك ونمط حياتك بدون حرمان أو تعقيد.",
  },
  {
    icon: Dumbbell,
    title: "تدريب فعال وآمن",
    desc: "تمارين مدروسة تناسب مستواك وتضمن التطور المستمر.",
  },
];

const INCLUDES = [
  { icon: ClipboardList, title: "تحليل شامل", desc: "تحليل بياناتك الحالية وأهدافك لتحديد احتياجاتك بدقة." },
  { icon: Target, title: "خطة تدريب مخصصة", desc: "برنامج تدريبي مصمم خصيصاً لمستواك وأهدافك باستخدام أحدث الأساليب." },
  { icon: Salad, title: "خطة تغذية مرنة", desc: "خطة غذائية متوازنة وسهلة التطبيق تناسب تفضيلاتك ونمط حياتك." },
  { icon: TrendingUp, title: "متابعة وتعديل مستمر", desc: "نراقب تقدمك ونعدل خطتك باستمرار التحقيق أفضل النتائج." },
  { icon: MessageCircle, title: "دعم دائم", desc: "دعم مباشر من فريق متخصص للإجابة على استفساراتك." },
  { icon: ShieldCheck, title: "نتائج مستدامة", desc: "استراتيجيات تضمن لك نتائج دائمة وتغيير حقيقي في نمط حياتك." },
];

export function CustomProgram() {
  const { ref, inView } = useInView<HTMLElement>(0.1);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-background py-16 sm:py-20 lg:py-28"
    >
      {/* parallax bg */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-40 -left-32 h-96 w-96 rounded-full bg-beige blur-3xl" />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 left-8 h-32 w-32 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(249,115,22,0.35) 1.2px, transparent 1.5px)",
          backgroundSize: "12px 12px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top : Hero grid (text left RTL = right, visual right RTL = left) */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Text + cards */}
          <div className="order-2 lg:order-1">
            <div
              className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-bold text-primary transition-all duration-700"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(12px)",
              }}
            >
              <Sparkles className="h-4 w-4" />
              برنامج مصمم خصيصاً لك
            </div>

            <h2
              className="mt-5 font-black text-foreground tracking-tight text-[48px] sm:text-6xl lg:text-[72px] leading-[1.05] transition-all duration-700"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(16px)",
                transitionDelay: "120ms",
              }}
            >
              برنامج مخصص
              <br />
              <span className="text-primary">يصمم من أجلك فقط</span>
            </h2>

            <p
              className="mt-5 text-base sm:text-xl text-muted-foreground leading-relaxed max-w-xl transition-all duration-700"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(16px)",
                transitionDelay: "240ms",
              }}
            >
              خطة متكاملة تجمع بين التدريب، التغذية، والمتابعة المستمرة لتناسب جسمك، هدفك، وأسلوب حياتك.
            </p>

            {/* feature cards 2x2 */}
            <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="group rounded-[24px] bg-white border border-border/40 shadow-card p-4 sm:p-5 text-right transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)]"
                    style={{
                      opacity: inView ? 1 : 0,
                      transform: inView ? "translateY(0)" : "translateY(20px)",
                      transitionDelay: `${360 + i * 120}ms`,
                    }}
                  >
                    <div
                      className="grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-full bg-primary-soft animate-float-soft transition-transform duration-500 group-hover:scale-110"
                      style={{ animationDelay: `${i * 0.6}s` }}
                    >
                      <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" strokeWidth={1.8} />
                    </div>
                    <h3 className="mt-4 font-extrabold text-base sm:text-lg text-foreground leading-tight">
                      {f.title}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual */}
          <div className="order-1 lg:order-2">
            <CoachVisual active={inView} />
          </div>
        </div>

        {/* Includes block */}
        <IncludesBlock active={inView} />

        {/* Trust block */}
        <TrustBlock active={inView} />
      </div>
    </section>
  );
}

function CoachVisual({ active }: { active: boolean }) {
  return (
    <div
      className="relative mx-auto max-w-xl aspect-square transition-all duration-1000"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(24px)",
      }}
    >
      {/* dots top right */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-4 left-4 h-20 w-20 opacity-50"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(249,115,22,0.4) 1.2px, transparent 1.5px)",
          backgroundSize: "10px 10px",
        }}
      />

      {/* coach image (includes beige circle) */}
      <div className="relative animate-float-phone">
        <img
          src={coachPhone}
          alt="مدرب يستعرض البرنامج المخصص على هاتفه"
          width={1024}
          height={1024}
          loading="lazy"
          className="w-full h-auto select-none"
        />
      </div>

      {/* floating phone card - weekly plan */}
      <div
        className="absolute top-[8%] left-[2%] sm:left-[4%] w-[180px] sm:w-[220px] rounded-[24px] bg-white shadow-soft border border-border/40 p-3 sm:p-4 animate-float-soft"
        style={{ animationDelay: "0.6s" }}
      >
        <div className="flex items-center justify-between text-[10px] sm:text-xs">
          <span className="font-bold text-foreground">برنامجك المخصص</span>
          <span className="text-muted-foreground">الأسبوع</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <span
              key={d}
              className={`grid place-items-center h-6 w-6 sm:h-7 sm:w-7 rounded-full text-[10px] sm:text-xs font-bold ${
                d === 3 ? "bg-primary text-white" : "bg-beige text-muted-foreground"
              }`}
            >
              {d}
            </span>
          ))}
        </div>
        <div className="mt-3 rounded-2xl bg-beige p-2.5 sm:p-3">
          <p className="text-[10px] sm:text-xs font-bold text-foreground">اليوم الثالث</p>
          <p className="text-[11px] sm:text-sm font-extrabold text-foreground mt-0.5">تمرين القوة - الجزء العلوي</p>
          <p className="text-[10px] sm:text-xs text-primary font-bold mt-1 flex items-center gap-1">
            <Flame className="h-3 w-3" /> 45 دقيقة
          </p>
        </div>
      </div>

      {/* floating progress card */}
      <div
        className="absolute bottom-[8%] right-[0%] sm:right-[2%] w-[200px] sm:w-[230px] rounded-[20px] bg-white shadow-soft border border-border/40 p-3 sm:p-3.5 animate-float-soft"
        style={{ animationDelay: "1.4s" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold text-foreground">تقدمك هذا الأسبوع</span>
          <span className="text-[11px] sm:text-sm font-extrabold text-primary">79%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-beige overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-l from-primary to-primary-dark transition-[width] duration-[1600ms] ease-out"
            style={{ width: active ? "79%" : "0%" }}
          />
        </div>
        <p className="mt-1.5 text-[10px] sm:text-[11px] text-muted-foreground">ممتاز! استمر على هذا النحو</p>
      </div>

      {/* small floating nutrition tag */}
      <div
        className="absolute top-[40%] left-[0%] sm:left-[2%] rounded-2xl bg-white shadow-soft border border-border/40 p-2 sm:p-2.5 flex items-center gap-2 animate-float-soft"
        style={{ animationDelay: "2.2s" }}
      >
        <div className="grid h-8 w-8 place-items-center rounded-full bg-success-soft">
          <Salad className="h-4 w-4 text-success" strokeWidth={2.2} />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-foreground leading-tight">وجبة بعد التمرين</p>
          <p className="text-[9px] text-muted-foreground">540 سعرة</p>
        </div>
      </div>
    </div>
  );
}

function IncludesBlock({ active }: { active: boolean }) {
  return (
    <div
      className="relative mt-16 lg:mt-24 rounded-[36px] bg-beige p-6 sm:p-10 lg:p-12 transition-all duration-1000"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(24px)",
        transitionDelay: "300ms",
      }}
    >
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <span aria-hidden className="h-px w-12 sm:w-20 bg-primary/40" />
        <h3 className="text-center font-black text-foreground text-2xl sm:text-3xl lg:text-[40px] leading-tight">
          ماذا يتضمن برنامجك المخصص؟
        </h3>
        <span aria-hidden className="h-px w-12 sm:w-20 bg-primary/40" />
      </div>

      <div className="mt-10 grid grid-cols-2 lg:grid-cols-6 gap-6 sm:gap-8">
        {INCLUDES.map((it, i) => {
          const Icon = it.icon;
          return (
            <div
              key={it.title}
              className="text-center transition-all duration-700"
              style={{
                opacity: active ? 1 : 0,
                transform: active ? "translateY(0)" : "translateY(16px)",
                transitionDelay: `${500 + i * 90}ms`,
              }}
            >
              <div
                className="mx-auto grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-2xl bg-white shadow-card animate-float-soft"
                style={{ animationDelay: `${i * 0.4}s` }}
              >
                <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" strokeWidth={1.9} />
              </div>
              <p className="mt-4 font-extrabold text-foreground text-sm sm:text-base">{it.title}</p>
              <p className="mt-1.5 text-xs sm:text-[13px] text-muted-foreground leading-relaxed">{it.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrustBlock({ active }: { active: boolean }) {
  return (
    <div
      className="relative mt-10 lg:mt-14 rounded-[36px] bg-beige p-6 sm:p-10 lg:p-12 transition-all duration-1000"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(24px)",
        transitionDelay: "500ms",
      }}
    >
      <div className="grid lg:grid-cols-[auto_1fr_auto_auto] gap-6 lg:gap-10 items-center">
        {/* Icon */}
        <div className="relative mx-auto lg:mx-0 shrink-0">
          <div className="absolute inset-0 rounded-full bg-primary/25 blur-2xl animate-pulse-soft" />
          <div
            className="relative grid h-24 w-24 sm:h-28 sm:w-28 place-items-center rounded-full text-white shadow-cta animate-float-soft"
            style={{ backgroundImage: "linear-gradient(135deg,#ff8a3d 0%,#f97316 60%,#ea580c 100%)" }}
          >
            <Target className="h-12 w-12 sm:h-14 sm:w-14" strokeWidth={2.2} />
          </div>
        </div>

        <div className="text-center lg:text-right">
          <h3 className="font-black text-foreground text-2xl sm:text-3xl lg:text-[36px] leading-[1.15]">
            نحن لا نقدم لك برنامجاً فقط...
            <br />
            <span className="text-primary">نقدم لك طريقك الخاص للنجاح.</span>
          </h3>
        </div>

        <div className="hidden lg:block h-20 w-px bg-border" />

        <div className="flex flex-col items-center lg:items-end gap-4">
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-center lg:text-right max-w-xs">
            هدفك هو هدفنا، وتقدمك هو نجاحنا.
            <br />
            دعنا نصمم لك خطة تغير حياتك للأفضل.
          </p>
          <a
            href="/quiz"
            className="group inline-flex items-center gap-3 rounded-full bg-white border-2 border-primary/30 px-6 py-3.5 sm:px-7 sm:py-4 font-bold text-foreground text-sm sm:text-base shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-[0_0_0_6px_rgba(249,115,22,0.15),0_18px_40px_-12px_rgba(249,115,22,0.45)]"
          >
            <span>اكتشف الحل المناسب لك</span>
            <ArrowLeft className="h-5 w-5 text-primary transition-transform duration-300 group-hover:-translate-x-1" />
          </a>
        </div>
      </div>
    </div>
  );
}
