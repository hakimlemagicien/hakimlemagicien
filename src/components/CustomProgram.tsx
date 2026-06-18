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
  Sparkles,
} from "lucide-react";
import coachHero from "@/assets/coach-hero.jpg";

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
    <section dir="rtl" className="relative w-full overflow-hidden bg-white py-20 md:py-28 font-[Tajawal,Cairo,sans-serif]">
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
          {/* text column (right in RTL) */}
          <div className="order-1 md:order-1 text-right">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600 ring-1 ring-orange-100">
              <Sparkles className="h-4 w-4" />
              برنامج مصمم خصيصاً لك
            </span>
            <h2 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-black leading-[1.15] text-neutral-900">
              برنامج مخصص
              <br />
              <span className="text-orange-500">يصمم من أجلك فقط</span>
            </h2>
            <p className="mt-6 max-w-xl text-base md:text-lg leading-loose text-neutral-500">
              خطة متكاملة تجمع بين التدريب، التغذية، والمتابعة المستمرة لتناسب جسمك، هدفك، وأسلوب حياتك.
            </p>
          </div>

          {/* image column (left in RTL) */}
          <div className="order-2 md:order-2 relative">
            <div className="relative mx-auto max-w-md md:max-w-none">
              <img
                src={coachHero}
                alt="مدرب اللياقة"
                width={1024}
                height={1024}
                loading="lazy"
                className="w-full h-auto select-none"
              />
              {/* floating plan card */}
              <div className="absolute -top-2 right-2 md:top-6 md:right-0 hidden sm:block rounded-2xl bg-white p-3 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] ring-1 ring-neutral-100 animate-[float_6s_ease-in-out_infinite]">
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

              {/* progress card */}
              <div className="absolute bottom-6 left-0 md:-left-6 rounded-2xl bg-white p-3 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] ring-1 ring-neutral-100 w-56 animate-[float_7s_ease-in-out_infinite_reverse]">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-orange-500">79%</span>
                  <span className="text-neutral-700">تقدمك هذا الأسبوع</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full w-[79%] rounded-full bg-orange-500" />
                </div>
                <p className="mt-1 text-[10px] text-neutral-500 text-right">ممتاز! استمر على هذا النحو</p>
              </div>

              {/* meal chip */}
              <div className="absolute top-1/3 left-2 md:left-0 hidden md:flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] ring-1 ring-neutral-100 animate-[float_8s_ease-in-out_infinite]">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-600 text-xs">🥗</span>
                <div className="text-right leading-tight">
                  <div className="text-[11px] font-bold text-neutral-800">وجبة بعد التمرين</div>
                  <div className="text-[10px] text-neutral-500">540 سعرة</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 FEATURE CARDS */}
        <div
          ref={grid.ref}
          className="mt-14 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`group rounded-3xl bg-white p-6 text-right ring-1 ring-neutral-100 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)] transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(249,115,22,0.35)] ${
                  grid.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-500 transition-transform duration-500 group-hover:scale-110">
                  <Icon className="h-7 w-7" strokeWidth={2.2} />
                </div>
                <h3 className="mt-5 text-lg font-extrabold text-neutral-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-loose text-neutral-500">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* INCLUDED beige block */}
        <div
          ref={inc.ref}
          className={`mt-14 md:mt-20 rounded-[2rem] bg-[#FBF5EE] px-5 py-10 md:px-10 md:py-14 transition-all duration-700 ease-out ${
            inc.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="flex items-center justify-center gap-4">
            <span className="hidden sm:block h-[2px] w-16 bg-orange-300" />
            <h3 className="text-2xl md:text-3xl font-black text-neutral-900 text-center">
              ماذا يتضمن برنامجك المخصص؟
            </h3>
            <span className="hidden sm:block h-[2px] w-16 bg-orange-300" />
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {INCLUDED.map((it, i) => {
              const Icon = it.icon;
              return (
                <div
                  key={it.title}
                  className={`text-center transition-all duration-500 ease-out ${
                    inc.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-orange-500 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.15)]">
                    <Icon className="h-6 w-6" strokeWidth={2.2} />
                  </div>
                  <h4 className="mt-4 text-sm md:text-base font-extrabold text-neutral-900">{it.title}</h4>
                  <p className="mt-2 text-xs md:text-[13px] leading-loose text-neutral-500">{it.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div
          ref={cta.ref}
          className={`mt-10 rounded-[2rem] bg-[#FBF5EE]/60 ring-1 ring-orange-100/60 p-5 md:p-7 transition-all duration-700 ease-out ${
            cta.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="flex flex-col md:flex-row-reverse items-center gap-6 md:gap-8">
            {/* Icon (visually left) */}
            <div className="relative shrink-0">
              <span className="absolute inset-0 rounded-full bg-orange-300/40 blur-2xl" />
              <div className="relative grid h-20 w-20 md:h-24 md:w-24 place-items-center rounded-full bg-orange-500 text-white shadow-[0_15px_40px_-10px_rgba(249,115,22,0.6)]">
                <Target className="h-10 w-10" strokeWidth={2.2} />
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 text-center md:text-right">
              <h3 className="text-2xl md:text-3xl font-black leading-tight text-neutral-900">
                نحن لا نقدم لك برنامجاً فقط...
                <br />
                <span className="text-orange-500">نقدم لك طريقك الخاص للنجاح.</span>
              </h3>
            </div>

            {/* Right column (small text + button) - visually right in RTL */}
            <div className="flex flex-col items-center md:items-start gap-4 md:max-w-xs">
              <p className="text-sm text-neutral-500 text-center md:text-right leading-loose">
                هدفك هو هدفنا، وتقدمك هو نجاحنا.
                <br />
                دعنا نصمم لك خطة تغير حياتك للأفضل.
              </p>
              <button className="group inline-flex items-center gap-3 rounded-full border-2 border-neutral-900 bg-white px-6 py-3 text-sm font-bold text-neutral-900 transition-all duration-300 hover:bg-neutral-900 hover:text-white">
                اكتشف الحل المناسب لك
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              </button>
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
