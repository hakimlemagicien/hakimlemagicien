import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Headphones,
  MessageCircle,
  ShieldCheck,
  Users,
  Lock,
  Calendar,
  Star,
  Sparkles,
} from "lucide-react";
import coachSupport from "@/assets/coach-support.jpg";
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

const FAQS: { q: string; a: string }[] = [
  {
    q: "كيف يعمل برنامج التدريب الأونلاين؟",
    a: "تبدأ بتقييم شامل لحالتك وأهدافك، ثم نصمم لك خطة تدريب وغذاء مخصصة بالكامل تصلك عبر التطبيق مع متابعة دورية من المدرب.",
  },
  {
    q: "هل أحتاج إلى معدات رياضية خاصة؟",
    a: "لا، يمكننا تصميم برنامجك ليناسب المعدات المتوفرة لديك سواء كنت في النادي أو في المنزل بأبسط الأدوات.",
  },
  {
    q: "كيف يتم تصميم خطة التغذية؟",
    a: "نأخذ في الاعتبار تفضيلاتك الغذائية، نمط حياتك، وأهدافك لنصمم خطة مرنة وسهلة الالتزام بها على المدى الطويل.",
  },
  {
    q: "كم مرة سيتم متابعة تقدمي؟",
    a: "نتابع تقدمك أسبوعياً ونعدل الخطة عند الحاجة، مع إمكانية التواصل المباشر مع المدرب طوال أيام الأسبوع.",
  },
  {
    q: "ماذا لو لم أحقق النتائج المتوقعة؟",
    a: "نلتزم بالعمل معك حتى تحقق هدفك. نراجع خطتك باستمرار ونعدلها لضمان وصولك إلى النتائج المرجوة.",
  },
  {
    q: "هل يمكنني تغيير خطتي أثناء البرنامج؟",
    a: "بالتأكيد. الخطة مرنة وقابلة للتعديل حسب تطورك واحتياجاتك وأي ظروف جديدة قد تطرأ خلال رحلتك.",
  },
  {
    q: "هل البرنامج مناسب للمبتدئين؟",
    a: "نعم، نصمم البرنامج بناءً على مستواك الحالي ونتدرج معك خطوة بخطوة لضمان الأمان والاستمرارية.",
  },
  {
    q: "كيف يمكنني التواصل مع المدرب؟",
    a: "يمكنك التواصل مع المدرب مباشرة عبر التطبيق أو واتساب طوال أيام الأسبوع للحصول على دعم سريع.",
  },
];

const TRUST = [
  { Icon: Users, label: "دعم شخصي" },
  { Icon: Lock, label: "خصوصيتك محفوظة" },
  { Icon: Calendar, label: "خطة مرنة تناسبك" },
  { Icon: Star, label: "نتائج مضمونة" },
];

function FaqItem({ item, index, open, onToggle }: { item: { q: string; a: string }; index: number; open: boolean; onToggle: () => void }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`overflow-hidden rounded-[20px] bg-white ring-1 ring-neutral-100 transition-all duration-500 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${open ? "shadow-[0_10px_30px_rgba(0,0,0,0.08)]" : "shadow-[0_4px_14px_rgba(0,0,0,0.04)]"}`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 md:px-6 py-5 text-right"
      >
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-500 transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        >
          <Plus className="h-5 w-5" strokeWidth={2.4} />
        </span>
        <span className="flex-1 text-right text-sm md:text-base font-bold text-neutral-900">{item.q}</span>
      </button>
      <div
        className={`grid transition-all duration-400 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mx-4 mb-4 rounded-2xl bg-[#FAF6F2] px-5 py-4 text-right text-sm leading-loose text-neutral-600">
            {item.a}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const head = useInView<HTMLDivElement>();
  const support = useInView<HTMLDivElement>();
  const trust = useInView<HTMLDivElement>();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section
      id="faq"
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
            إجابات على أكثر الأسئلة شيوعاً
          </span>
          <h2 className="mt-5 text-4xl md:text-6xl lg:text-7xl font-black leading-[1.15] text-neutral-900">
            الأسئلة <span className="text-orange-500">الشائعة</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-neutral-500 leading-loose">
            كل ما تحتاج معرفته قبل البدء في برنامجك التدريبي والغذائي.
          </p>
        </div>

        {/* MAIN GRID */}
        <div className="mt-14 md:mt-16 grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          {/* SUPPORT CARD */}
          <div
            ref={support.ref}
            className={`rounded-[32px] bg-white ring-1 ring-neutral-100 shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-5 md:p-6 transition-all duration-700 ease-out ${
              support.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src={coachSupport}
                alt="فريق الدعم"
                width={1024}
                height={1024}
                loading="lazy"
                className="h-64 md:h-72 w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>

            <div className="mt-6 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-orange-50 text-orange-500 ring-1 ring-orange-100 animate-[float_5s_ease-in-out_infinite]">
                <Headphones className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <h3 className="mt-4 text-xl md:text-2xl font-black text-neutral-900">لم تجد إجابة لسؤالك؟</h3>
              <p className="mt-3 text-sm leading-loose text-neutral-500">
                فريق الدعم لدينا جاهز لمساعدتك والرد على جميع استفساراتك.
              </p>

              <a
                href="https://wa.me/971505129019"
                className="group mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-orange-500 to-orange-600 px-6 py-4 text-sm md:text-base font-bold text-white shadow-[0_10px_30px_-10px_rgba(249,115,22,0.6)] transition-all duration-300 hover:shadow-[0_15px_40px_-10px_rgba(249,115,22,0.8)] hover:brightness-105"
              >
                <MessageCircle className="h-5 w-5" />
                تواصل معنا على واتساب
              </a>
            </div>
          </div>

          {/* ACCORDION */}
          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <FaqItem
                key={item.q}
                item={item}
                index={i}
                open={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? null : i)}
              />
            ))}
          </div>
        </div>

        {/* BOTTOM TRUST */}
        <DarkPremiumPanel
          ref={trust.ref}
          active={trust.inView}
          className="mt-14 md:mt-16"
          innerClassName="px-5 py-8 md:px-10 md:py-10"
        >
          <div className="grid items-center gap-8 md:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1.2fr)]">
            <div className="flex justify-center md:justify-start">
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-[#FF6B00]/30 blur-xl animate-warning-card-outer-glow" />
                <div
                  className="relative grid h-20 w-20 place-items-center rounded-2xl text-white shadow-[0_8px_24px_-6px_rgba(255,107,0,0.65)]"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #ff8a3d 0%, #f97316 60%, #ea580c 100%)",
                  }}
                >
                  <ShieldCheck className="h-9 w-9" strokeWidth={2.2} />
                </div>
              </div>
            </div>

            <div className="text-center md:text-right">
              <h3 className="text-xl font-black text-white/95 md:text-2xl [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
                رضاك هو أولويتنا
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-loose text-white/75 md:mx-0">
                نضمن لك تجربة احترافية، دعم مستمر، ونتائج حقيقية أو نعمل معك حتى تحقق هدفك.
              </p>
            </div>

            <span className="hidden h-20 w-px bg-white/15 md:block" />

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-2">
              {TRUST.map((t) => {
                const Icon = t.Icon;
                return (
                  <div key={t.label} className="text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/10 text-[#FF8A3D] shadow-[0_8px_20px_-10px_rgba(255,107,0,0.35)] ring-1 ring-[#FF6B00]/20 backdrop-blur-sm">
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <div className="mt-2 text-xs font-extrabold leading-tight text-white md:text-[13px] [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
                      {t.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DarkPremiumPanel>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </section>
  );
}
