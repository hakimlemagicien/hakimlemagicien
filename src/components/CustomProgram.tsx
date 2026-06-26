import { Link } from "@tanstack/react-router";
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
} from "lucide-react";
import coachHero from "@/assets/coach-hero.jpeg";

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
  { icon: UserCircle2, title: "100% مخصص لك", desc: "كل تفاصيل البرنامج مصممة بناءً على بياناتك وأهدافك." },
  { icon: BarChart3, title: "متابعة ذكية", desc: "نراقب تقدمك ونعدل خطتك باستمرار لتحقيق أفضل النتائج." },
  { icon: UtensilsCrossed, title: "خطة تغذية مرنة", desc: "تناسب مع تفضيلاتك ونمط حياتك بدون حرمان أو تعقيد." },
  { icon: Dumbbell, title: "تدريب فعال وآمن", desc: "تمارين مدروسة تناسب مستواك وتضمن التطور المستمر بأمان." },
];

const INCLUDED = [
  { icon: ClipboardList, title: "تحليل شامل", desc: "تحليل بياناتك الحالية وأهدافك لتحديد احتياجاتك بدقة." },
  { icon: Target, title: "خطة تدريب مخصصة", desc: "برنامج تدريبي مصمم خصيصاً لمستواك وأهدافك باستخدام أحدث الأساليب." },
  { icon: Salad, title: "خطة تغذية مرنة", desc: "خطة غذائية متوازنة وسهلة التطبيق تناسب تفضيلاتك ونمط حياتك." },
  { icon: TrendingUp, title: "متابعة وتعديل مستمر", desc: "نراقب تقدمك ونعدل خطتك باستمرار لتحقيق أفضل النتائج." },
  { icon: MessageCircle, title: "دعم دائم", desc: "دعم مباشر من فريق متخصص للإجابة على استفساراتك." },
  { icon: ShieldCheck, title: "نتائج مستدامة", desc: "استراتيجيات تضمن لك نتائج دائمة وتغيير حقيقي في نمط حياتك." },
];

export default function CustomProgram() {
  const head = useInView<HTMLDivElement>();
  const grid = useInView<HTMLDivElement>();
  const inc = useInView<HTMLDivElement>();
  const cta = useInView<HTMLDivElement>();

  return (
    <section dir="rtl" className="relative w-full overflow-hidden py-20 md:py-28 font-[Tajawal,Cairo,sans-serif]">
      {/* decorative dots */}
      <div className="pointer-events-none absolute left-6 top-24 hidden md:grid grid-cols-5 gap-2 opacity-40">
        {Array.from({ length: 25 }).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-orange-300" />
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* TOP: heading + image */}
        <div
          ref={head.ref}
          className={`grid items-center gap-10 md:gap-12 md:grid-cols-2 transition-all duration-700 ease-out ${
            head.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="order-1 md:order-1 md:col-span-2 -mt-[50px] text-center">
            <h2 className="text-4xl font-black leading-[1.15] text-neutral-900 md:text-5xl lg:text-6xl">
              برنامج مخصص
              <br />
              <span className="text-orange-500">يصمم من أجلك فقط</span>
            </h2>
            <div
              aria-hidden
              className="relative mx-auto mt-5 h-[2px] w-full max-w-xs overflow-hidden sm:max-w-md lg:max-w-xl"
            >
              <div className="h-full w-full bg-gradient-to-r from-transparent via-[#FF6B00]/35 to-transparent" />
              {head.inView && (
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/4 animate-title-line-shimmer-pingpong bg-gradient-to-r from-transparent via-[#FF6B00]/60 to-transparent"
                />
              )}
            </div>
          </div>

          {/* text column */}
          <div className="order-2 md:order-2 md:col-span-2 -mt-[30px] text-center">
            <p className="mx-auto max-w-xl text-base leading-loose text-neutral-500 md:text-lg">
              خطة متكاملة تجمع بين التدريب، التغذية، والمتابعة المستمرة لتناسب جسمك، هدفك، وأسلوب حياتك.
            </p>
          </div>

          {/* 4 FEATURE CARDS — below intro text */}
          <div
            ref={grid.ref}
            className="order-3 -mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 md:order-3 md:col-span-2 md:-mt-[16px] lg:grid-cols-4 lg:gap-4"
          >
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`group relative overflow-hidden rounded-2xl border border-transparent bg-white/90 p-3.5 text-right shadow-[0_6px_20px_-14px_rgba(0,0,0,0.08)] ring-1 ring-neutral-100/80 backdrop-blur-sm transition-[box-shadow,border-color,ring-color] duration-500 ease-out hover:[animation-play-state:paused] hover:border-orange-200/50 hover:shadow-[0_16px_36px_-14px_rgba(249,115,22,0.32)] hover:ring-orange-100 sm:p-4 ${
                    grid.inView ? "animate-feature-card-lively opacity-100" : "opacity-0 translate-y-4"
                  }`}
                  style={{
                    transitionDelay: `${i * 70}ms`,
                    animationDelay: `${i * 0.35}s, ${i * 0.55}s`,
                  }}
                >
                  {grid.inView && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
                    >
                      <span
                        className="absolute inset-y-[-30%] left-0 h-[160%] w-[42%] animate-cta-shimmer bg-gradient-to-r from-transparent via-orange-200/45 to-transparent opacity-60"
                        style={{ animationDelay: `${i * 0.9 + 1.2}s` }}
                      />
                    </span>
                  )}
                  <div className="relative z-10 flex items-start gap-3">
                    <div
                      className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 via-white to-orange-50/80 text-orange-500 shadow-[0_4px_14px_-6px_rgba(249,115,22,0.35)] transition-transform duration-500 group-hover:scale-110 animate-feature-icon-glow sm:h-11 sm:w-11"
                      style={{ animationDelay: `${i * 0.4}s` }}
                    >
                      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                        <span
                          className="absolute -inset-y-4 -left-1/2 h-[200%] w-[200%] animate-feature-icon-shine bg-gradient-to-r from-transparent via-white/75 to-transparent"
                          style={{ animationDelay: `${i * 0.4 + 0.5}s` }}
                        />
                      </span>
                      <Icon
                        className="relative z-10 h-5 w-5 transition-transform duration-500 group-hover:scale-105 sm:h-[22px] sm:w-[22px]"
                        strokeWidth={2.2}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-sm font-extrabold leading-snug text-neutral-900 transition-colors duration-300 group-hover:text-orange-600 sm:text-[15px]"
                      >
                        {f.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-neutral-500 transition-colors duration-300 group-hover:text-neutral-600 sm:text-[13px]">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* image — full width */}
          <div className="order-4 relative -mx-5 -mt-[30px] w-[calc(100%+2.5rem)] sm:mx-0 sm:w-full md:order-4 md:col-span-2">
            <div className="relative w-full overflow-hidden">
              <img
                src={coachHero}
                alt="مدرب اللياقة"
                width={853}
                height={965}
                loading="lazy"
                className="w-full h-auto select-none"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[20px]"
                style={{
                  background:
                    "linear-gradient(to bottom, #FAF8F5 0%, rgba(250, 248, 245, 0.72) 42%, rgba(250, 248, 245, 0.28) 78%, transparent 100%)",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[20px]"
                style={{
                  background:
                    "linear-gradient(to top, #FFFFFF 0%, rgba(255, 255, 255, 0.72) 42%, rgba(255, 255, 255, 0.28) 78%, transparent 100%)",
                }}
              />
              <div className="absolute -top-2 right-4 z-10 hidden sm:block rounded-2xl bg-white p-3 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] ring-1 ring-neutral-100 animate-[float_6s_ease-in-out_infinite] md:top-6 md:right-8">
                <div className="flex items-center justify-between gap-6 text-[11px] font-bold text-neutral-700">
                  <span className="text-neutral-400">الأسبوع</span>
                  <span>برنامجك المخصص</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-1.5 flex-row-reverse">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <span
                      key={n}
                      className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${
                        n === 3 ? "bg-orange-500 text-white" : "text-neutral-500"
                      }`}
                    >
                      {n}
                    </span>
                  ))}
                </div>
                <div className="mt-2 rounded-xl bg-neutral-50 p-2 text-right">
                  <div className="text-[11px] font-bold text-neutral-800">اليوم الثالث</div>
                  <div className="text-[11px] text-neutral-600">تمرين القوة - الجزء العلوي</div>
                  <div className="mt-1 text-[11px] font-bold text-orange-500">🔥 45 دقيقة</div>
                </div>
              </div>
              <div className="absolute top-1/3 left-4 z-10 hidden md:flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] ring-1 ring-neutral-100 animate-[float_8s_ease-in-out_infinite] md:left-8">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-600 text-xs">🥗</span>
                <div className="text-right leading-tight">
                  <div className="text-[11px] font-bold text-neutral-800">وجبة بعد التمرين</div>
                  <div className="text-[10px] text-neutral-500">540 سعرة</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* INCLUDED beige block — compact grid */}
        <div
          ref={inc.ref}
          className={`relative mt-[26px] overflow-hidden rounded-2xl border border-white/90 bg-gradient-to-br from-[#FFF9F4] via-[#FBF5EE] to-[#F3E8DC] px-4 py-6 shadow-[0_1px_0_rgba(255,255,255,0.95)_inset,0_20px_48px_-18px_rgba(249,115,22,0.2),0_10px_28px_-14px_rgba(15,23,42,0.08)] ring-1 ring-orange-200/40 transition-[opacity,transform] duration-700 ease-out sm:rounded-[1.75rem] md:mt-[50px] md:px-6 md:py-7 lg:px-8 ${
            inc.inView
              ? "animate-included-block-lively opacity-100 translate-y-0"
              : "opacity-0 translate-y-6"
          }`}
        >
          {inc.inView && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl sm:rounded-[1.75rem]"
            >
              <span
                className="absolute inset-y-[-30%] left-0 h-[160%] w-[40%] animate-warning-card-shimmer bg-gradient-to-r from-transparent via-orange-200/30 to-transparent opacity-70"
              />
            </span>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px animate-warning-card-border-pulse bg-gradient-to-r from-transparent via-white to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-orange-300/18 blur-3xl animate-warning-card-outer-glow"
          />

          <div className="relative text-center">
            <h3 className="text-xl font-black text-neutral-900 md:text-2xl">
              ماذا يتضمن برنامجك المخصص؟
            </h3>
            <div
              aria-hidden
              className="relative mx-auto mt-2.5 h-[2px] w-full max-w-[200px] overflow-hidden sm:max-w-xs"
            >
              <div className="h-full w-full bg-gradient-to-r from-transparent via-orange-300/60 to-transparent" />
              {inc.inView && (
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-title-line-shimmer-pingpong bg-gradient-to-r from-transparent via-orange-500/70 to-transparent"
                />
              )}
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-3 sm:gap-4">
            {INCLUDED.map((it, i) => {
              const Icon = it.icon;
              return (
                <div
                  key={it.title}
                  className={`group relative overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-3 text-center shadow-[0_4px_18px_-10px_rgba(15,23,42,0.07)] ring-1 ring-neutral-100/70 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-orange-200/60 hover:shadow-[0_18px_42px_-16px_rgba(249,115,22,0.22)] sm:p-5 ${
                    inc.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                  }`}
                  style={{ transitionDelay: `${i * 70}ms` }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-200/70 to-transparent opacity-80"
                  />
                  <div className="relative mx-auto mb-2.5 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-b from-[#FFF6EE] to-white shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_20px_-10px_rgba(249,115,22,0.28)] ring-1 ring-orange-100/70 transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_10px_24px_-8px_rgba(249,115,22,0.38)] sm:mb-3.5 sm:h-12 sm:w-12 sm:rounded-2xl">
                    <Icon className="h-4 w-4 text-[#FF6B00] sm:h-5 sm:w-5" strokeWidth={2.25} />
                  </div>
                  <h4 className="text-[12px] font-extrabold leading-snug text-neutral-900 sm:text-[15px]">
                    {it.title}
                  </h4>
                  <p className="mx-auto mt-2 text-[10px] leading-relaxed text-neutral-500 line-clamp-2 sm:text-xs">
                    {it.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div ref={cta.ref} className="relative mt-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-3 top-4 bottom-0 rounded-2xl bg-[#1A1816]/20 shadow-[inset_0_3px_10px_rgba(15,23,42,0.12)] lg:inset-x-4 lg:rounded-3xl"
          />

          <div
            aria-hidden
            className="pointer-events-none absolute -inset-2 rounded-2xl bg-[#FF6B00]/20 blur-2xl animate-warning-card-outer-glow lg:-inset-3 lg:rounded-3xl"
          />

          <div
            className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#2A2521] via-[#1F1C18] to-[#2E2824] p-4 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_22px_48px_-14px_rgba(255,107,0,0.28),0_16px_40px_-18px_rgba(15,23,42,0.45)] ring-1 ring-white/[0.05] transition-[transform,opacity,box-shadow] duration-700 ease-out sm:p-5 lg:rounded-3xl lg:p-6"
            style={{
              opacity: cta.inView ? 1 : 0,
              transform: cta.inView ? "translateY(-8px) scale(1)" : "translateY(18px) scale(0.97)",
              boxShadow: cta.inView
                ? "0 1px 0 rgba(255,255,255,0.08) inset, 0 28px 56px -16px rgba(255,107,0,0.32), 0 20px 48px -18px rgba(15,23,42,0.55), 0 0 0 1px rgba(255,107,0,0.14)"
                : undefined,
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

            <div className="relative z-10 flex flex-col items-center gap-5 lg:flex-row lg:items-center lg:gap-8">
              <div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white shadow-[0_8px_24px_-6px_rgba(255,107,0,0.65)] sm:h-14 sm:w-14 sm:rounded-2xl"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #ff8a3d 0%, #f97316 60%, #ea580c 100%)",
                }}
              >
                <Target className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.2} />
              </div>

              <div className="min-w-0 flex-1 text-center font-[Tajawal] lg:text-right">
                <h3 className="text-[25px] font-black leading-[1.2] tracking-tight sm:text-[27px] lg:text-[29px]">
                  <span className="block text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
                    نحن لا نقدم لك برنامجاً فقط...
                  </span>
                  <span className="block text-[#FF6B00] [text-shadow:0_1px_3px_rgba(0,0,0,0.35)]">
                    نقدم لك طريقك الخاص للنجاح.
                  </span>
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/85 sm:text-[15px] [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
                  هدفك هو هدفنا، وتقدمك هو نجاحنا.
                  <br />
                  دعنا نصمم لك خطة تغير حياتك للأفضل.
                </p>
              </div>

              <div className="w-full shrink-0 sm:w-auto lg:self-center">
                <Link
                  to="/quiz"
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-[#FF6B00]/35 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white/95 shadow-[0_8px_24px_-10px_rgba(255,107,0,0.45)] backdrop-blur-sm transition-[transform,background-color,border-color,box-shadow] duration-300 sm:w-auto sm:px-6 hover:scale-[1.02] hover:border-[#FF6B00] hover:bg-[#FF6B00]/12 hover:shadow-[0_0_0_5px_rgba(255,107,0,0.18),0_16px_40px_-12px_rgba(255,107,0,0.5)] active:scale-[0.98] lg:py-3.5"
                >
                  <span
                    className="pointer-events-none absolute -inset-1 rounded-full bg-[#FF6B00]/25 blur-md animate-warning-cta-glow"
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
                    aria-hidden
                  >
                    <span
                      className="absolute inset-y-[-20%] left-0 h-[140%] w-[45%] animate-cta-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                  </span>
                  <span
                    className="pointer-events-none absolute inset-0 rounded-full animate-warning-cta-inner-glow"
                    aria-hidden
                  />
                  <span className="relative z-10 transition-transform duration-300 group-hover:scale-[1.02]">
                    اكتشف الحل المناسب لك
                  </span>
                  <ArrowLeft
                    className="relative z-10 h-4 w-4 text-[#FF6B00] transition-transform duration-300 animate-warning-cta-arrow group-hover:-translate-x-1"
                    strokeWidth={2.5}
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </section>
  );
}
