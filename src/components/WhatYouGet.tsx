import { useEffect, useRef, useState } from "react";
import {
  Dumbbell,
  Salad,
  BarChart3,
  MessageSquare,
  RefreshCw,
  Target,
  Check,
  Star,
} from "lucide-react";
import targetIllustration from "@/assets/target-illustration.png";

function useInView<T extends HTMLElement>(threshold = 0.1) {
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

const FEATURES = [
  {
    num: "01",
    icon: Dumbbell,
    title: "خطة تدريب مخصصة",
    desc: "برنامج تدريبي مصمم خصيصاً لهدفك، مستواك، ووقتك المتاح مع شرح تفصيلي لكل تمرين.",
  },
  {
    num: "02",
    icon: Salad,
    title: "خطة تغذية مرنة",
    desc: "خطة غذائية تناسب نمط حياتك وتفضيلاتك الغذائية مع خيارات متنوعة وسهلة التحضير.",
  },
  {
    num: "03",
    icon: BarChart3,
    title: "متابعة وتقييم النتائج",
    desc: "متابعة دورية لقياس تقدمك وتحليل النتائج مع تقارير واضحة لضمان الوصول لهدفك.",
  },
  {
    num: "04",
    icon: MessageSquare,
    title: "دعم مباشر",
    desc: "دعم مباشر من فريق متخصص للرد على استفساراتك ومساعدتك في أي وقت تحتاجه.",
  },
  {
    num: "05",
    icon: RefreshCw,
    title: "تعديل الخطة باستمرار",
    desc: "نقوم بتعديل خطتك بشكل مستمر حسب تقدمك لضمان أفضل النتائج.",
  },
  {
    num: "06",
    icon: Target,
    title: "استراتيجية واضحة لتحقيق هدفك",
    desc: "خطة واضحة خطوة بخطوة مع أهداف قصيرة وطويلة المدى لتحقيق أفضل النتائج.",
  },
];

const CHECKLIST = [
  "برامج مبنية على العلم والخبرة",
  "خطط عملية قابلة للتطبيق.",
  "متابعة مستمرة حتى تحقيق هدفك",
  "نتائج حقيقية تستمر مدى الحياة",
];

export default function WhatYouGet() {
  const head = useInView<HTMLDivElement>(0.1);
  const cards = useInView<HTMLDivElement>(0.1);
  const trust = useInView<HTMLDivElement>(0.1);

  return (
    <section
      dir="rtl"
      className="relative w-full overflow-hidden bg-white py-16 md:py-24 font-[Tajawal,Cairo,sans-serif]"
    >
      {/* Decorative dots — right side */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-6 top-28 hidden lg:grid grid-cols-6 gap-2 opacity-40"
      >
        {Array.from({ length: 36 }).map((_, i) => (
          <span key={`r-${i}`} className="h-1.5 w-1.5 rounded-full bg-orange-300" />
        ))}
      </div>
      {/* Decorative dots — left side */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-6 top-28 hidden lg:grid grid-cols-6 gap-2 opacity-40"
      >
        {Array.from({ length: 36 }).map((_, i) => (
          <span key={`l-${i}`} className="h-1.5 w-1.5 rounded-full bg-orange-300" />
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div
          ref={head.ref}
          className={`text-center transition-all duration-700 ease-out ${
            head.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-500">
            <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
            كل ما تحتاجه في مكان واحد
          </span>

          {/* Heading */}
          <h2 className="mt-5 text-4xl md:text-5xl lg:text-[72px] font-black leading-[1.1] text-neutral-900">
            ماذا{" "}
            <span className="text-orange-500">ستحصل عليه</span>{" "}
            داخل برنامجك؟
          </h2>

          {/* Subtitle */}
          <p className="mt-4 text-base md:text-lg text-neutral-500 leading-relaxed max-w-2xl mx-auto">
            كل ما تحتاجه للوصول إلى هدفك في مكان واحد.
          </p>
        </div>

        {/* 6 FEATURE CARDS */}
        <div
          ref={cards.ref}
          className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-5"
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.num}
                className={`group flex flex-col items-center rounded-[28px] bg-white border border-[#F3F4F6] p-6 text-center shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-[0_12px_32px_-10px_rgba(249,115,22,0.15)] ${
                  cards.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                {/* Icon circle */}
                <div className="grid h-16 w-16 place-items-center rounded-full bg-[#FAF6F2] transition-transform duration-500 group-hover:scale-110">
                  <Icon className="h-7 w-7 text-orange-500" strokeWidth={1.8} />
                </div>

                {/* Title */}
                <h3 className="mt-5 text-base md:text-lg font-extrabold text-neutral-900 leading-snug">
                  {f.title}
                </h3>

                {/* Description */}
                <p className="mt-2 text-sm leading-relaxed text-neutral-500 flex-1">
                  {f.desc}
                </p>

                {/* Number badge */}
                <div className="mt-5 inline-flex items-center justify-center rounded-xl bg-orange-50 px-4 py-1.5 text-sm font-black text-orange-500">
                  {f.num}
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM TRUST BLOCK */}
        <div
          ref={trust.ref}
          className={`mt-12 md:mt-16 transition-all duration-700 ease-out ${
            trust.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#FAF6F2] to-[#FFF7ED] border border-orange-100/40 p-6 md:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-10">
              {/* LEFT: Target illustration (visually left in LTR, so DOM first for RTL right placement) */}
              <div className="relative shrink-0 order-3 lg:order-1">
                <div className="absolute inset-0 rounded-full bg-orange-200/30 blur-3xl scale-110" />
                <img
                  src={targetIllustration}
                  alt="هدفك"
                  width={320}
                  height={320}
                  loading="lazy"
                  className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 object-contain animate-float-soft"
                />
              </div>

              {/* CENTER: Headline */}
              <div className="flex-1 text-center order-2 lg:order-2 lg:border-r lg:border-orange-200/60 lg:pr-10">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-neutral-900 leading-snug">
                  نحن لا نقدم لك ملف PDF فقط...
                </h3>
                <p className="mt-2 text-xl md:text-2xl lg:text-3xl font-black text-orange-500 leading-snug">
                  بل نظاماً متكاملاً يساعدك على الوصول لهدفك
                </p>
                <p className="mt-1 text-xl md:text-2xl lg:text-3xl font-black text-orange-500 leading-snug">
                  خطوة بخطوة.
                </p>
              </div>

              {/* RIGHT: Checklist (visually right in RTL) */}
              <div className="shrink-0 order-1 lg:order-3">
                <ul className="space-y-3 text-right">
                  {CHECKLIST.map((item, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-2 justify-end transition-all duration-500 ease-out ${
                        trust.inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                      }`}
                      style={{ transitionDelay: `${300 + i * 100}ms` }}
                    >
                      <span className="text-sm md:text-base font-bold text-neutral-700">
                        {item}
                      </span>
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange-500 text-white">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
