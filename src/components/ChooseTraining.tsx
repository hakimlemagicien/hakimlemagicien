import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Globe,
  MapPin,
  Check,
  ArrowLeft,
  Target,
  BarChart3,
  ShieldCheck,
  Headphones,
  Trophy,
  Sparkles,
} from "lucide-react";
import coachOnline from "@/assets/coach-online.jpg";
import coachGym from "@/assets/coach-gym.jpg";
import { DarkPremiumPanel } from "@/components/DarkPremiumPanel";

function useInView<T extends HTMLElement>(threshold = 0.12) {
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

type CardProps = {
  image: string;
  Icon: typeof Globe;
  title: string;
  badge: string;
  desc: string;
  features: string[];
  cta: string;
  delay?: number;
};

function TrainingCard({ image, Icon, title, badge, desc, features, cta, delay = 0 }: CardProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-[32px] bg-white ring-1 ring-neutral-100 shadow-[0_10px_40px_rgba(0,0,0,0.06)] transition-all duration-700 ease-out hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)] ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="grid md:grid-cols-2">
        {/* Image (visually right side in RTL = order 1) */}
        <div className="relative h-72 md:h-auto md:min-h-[520px] overflow-hidden">
          <img
            src={image}
            alt={title}
            width={1024}
            height={1024}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>

        {/* Content */}
        <div className="p-7 md:p-9 text-right flex flex-col">
          <div className="flex justify-end">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-orange-500 animate-[float_6s_ease-in-out_infinite]">
              <Icon className="h-8 w-8" strokeWidth={2.2} />
            </div>
          </div>

          <h3 className="mt-5 text-2xl md:text-3xl font-black text-neutral-900">{title}</h3>

          <div className="mt-3 flex justify-end">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-xs font-bold text-orange-600 ring-1 ring-orange-100">
              <MapPin className="h-3.5 w-3.5" />
              {badge}
            </span>
          </div>

          <p className="mt-4 text-sm md:text-[15px] leading-loose text-neutral-500">{desc}</p>

          <ul className="mt-5 space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center justify-end gap-3 text-sm text-neutral-700">
                <span>{f}</span>
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-500">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              </li>
            ))}
          </ul>

          <Link
            to="/quiz"
            className="group mt-7 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-orange-500 to-orange-600 px-6 py-4 text-sm md:text-base font-bold text-white shadow-[0_10px_30px_-10px_rgba(249,115,22,0.6)] transition-all duration-300 hover:shadow-[0_15px_40px_-10px_rgba(249,115,22,0.8)] hover:brightness-105"
          >
            {cta}
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}

const BENEFITS = [
  { Icon: Target, title: "تركيز على النتائج", text: "هدفنا هو تحقيق هدفك بأسرع وقت ممكن." },
  { Icon: BarChart3, title: "تطوير مستمر", text: "نحدث خططك باستمرار لضمان أفضل تقدم." },
  { Icon: ShieldCheck, title: "برامج آمنة", text: "خطط مدروسة وآمنة تناسب جميع المستويات." },
  { Icon: Headphones, title: "دعم مستمر", text: "نحن معك طوال رحلتك لتحقيق هدفك." },
  { Icon: Trophy, title: "نتائج حقيقية", text: "برامجنا مصممة لتحقيق أفضل النتائج." },
];

export default function ChooseTraining() {
  const head = useInView<HTMLDivElement>();
  const benefits = useInView<HTMLDivElement>();

  return (
    <section
      dir="rtl"
      className="relative w-full overflow-hidden bg-white py-20 md:py-28 font-[Tajawal,Cairo,sans-serif]"
    >
      {/* decorative dots */}
      <div className="pointer-events-none absolute left-6 top-32 hidden md:grid grid-cols-5 gap-2 opacity-40">
        {Array.from({ length: 25 }).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-orange-300" />
        ))}
      </div>
      <div className="pointer-events-none absolute right-6 top-32 hidden md:grid grid-cols-5 gap-2 opacity-40">
        {Array.from({ length: 25 }).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-orange-300" />
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* HEADER */}
        <div
          ref={head.ref}
          className={`text-center transition-all duration-700 ease-out ${
            head.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600">
            <Sparkles className="h-4 w-4" />
            اختر ما يناسب نمط حياتك
          </span>
          <h2 className="mt-5 text-4xl md:text-6xl lg:text-7xl font-black leading-[1.15] text-neutral-900">
            اختر <span className="text-orange-500">طريقة التدريب</span> المناسبة لك
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-neutral-500 leading-loose">
            نقدم لك خيارين احترافيين لتحقيق هدفك بالطريقة التي تناسبك.
          </p>
        </div>

        {/* CARDS + VS */}
        <div className="relative mt-14 md:mt-16">
          <div className="grid gap-10 md:gap-6 lg:gap-10 md:grid-cols-2">
            {/* Online (visually right in RTL on desktop) */}
            <TrainingCard
              image={coachOnline}
              Icon={Globe}
              title="تدريب أونلاين"
              badge="متاح حول العالم"
              desc="برنامج متكامل عن بعد مع متابعة شخصية ودعم مستمر لتحقيق أفضل النتائج."
              features={[
                "برنامج مخصص 100%",
                "متابعة وتقييم دوري",
                "مرونة كاملة في الوقت والمكان",
                "تواصل مباشر مع المدرب",
              ]}
              cta="اختر التدريب الأونلاين"
              delay={0}
            />

            {/* Dubai */}
            <TrainingCard
              image={coachGym}
              Icon={MapPin}
              title="تدريب شخصي في دبي"
              badge="جلسات مباشرة"
              desc="جلسات شخصية في دبي مع متابعة دقيقة وتوجيه احترافي داخل النادي."
              features={[
                "جلسات شخصية مع المدرب",
                "تصحيح فوري للأداء",
                "بيئة تدريب احترافية",
                "متابعة دقيقة داخل النادي",
              ]}
              cta="اختر التدريب الشخصي في دبي"
              delay={120}
            />
          </div>

          {/* VS Circle */}
          <div className="hidden md:grid pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 place-items-center">
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-orange-200/40 blur-2xl animate-pulse" />
              <div className="relative grid h-20 w-20 lg:h-24 lg:w-24 place-items-center rounded-full bg-[#FAF6F2] ring-4 ring-white shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
                <span className="text-xl lg:text-2xl font-black text-neutral-900">VS</span>
              </div>
            </div>
          </div>

          {/* Mobile VS */}
          <div className="md:hidden flex justify-center -my-3 relative z-10">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#FAF6F2] ring-4 ring-white shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
              <span className="text-lg font-black text-neutral-900">VS</span>
            </div>
          </div>
        </div>

        {/* BENEFITS */}
        <DarkPremiumPanel
          ref={benefits.ref}
          active={benefits.inView}
          className="mt-14 md:mt-16"
          innerClassName="px-5 py-10 md:px-10 md:py-14"
        >
          <div className="flex items-center justify-center gap-4">
            <span className="hidden h-[2px] w-12 bg-gradient-to-r from-transparent via-[#FF6B00]/50 to-transparent sm:block" />
            <h3 className="text-center text-2xl font-black text-white/95 md:text-3xl [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
              كلا الخيارين يضمنان لك
            </h3>
            <span className="hidden h-[2px] w-12 bg-gradient-to-l from-transparent via-[#FF6B00]/50 to-transparent sm:block" />
          </div>

          <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-4 lg:grid-cols-5">
            {BENEFITS.map((b, i) => {
              const Icon = b.Icon;
              return (
                <div
                  key={b.title}
                  className={`px-3 text-center transition-all duration-500 ease-out ${
                    benefits.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  } ${i > 0 ? "lg:border-r lg:border-white/12" : ""}`}
                  style={{ transitionDelay: `${i * 90}ms` }}
                >
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/10 text-[#FF8A3D] shadow-[0_8px_20px_-10px_rgba(255,107,0,0.35)] ring-1 ring-[#FF6B00]/20 backdrop-blur-sm">
                    <Icon className="h-6 w-6" strokeWidth={2.2} />
                  </div>
                  <h4 className="mt-4 text-sm font-extrabold text-white md:text-base [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
                    {b.title}
                  </h4>
                  <p className="mt-2 text-xs leading-loose text-white/75 md:text-[13px]">{b.text}</p>
                </div>
              );
            })}
          </div>
        </DarkPremiumPanel>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </section>
  );
}
