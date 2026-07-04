import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ShieldCheck, Smartphone } from "lucide-react";
import { PRODUCT_SUMMARY } from "@/lib/site-legal";

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

const STEPS = [
  {
    emoji: "🎯",
    step: "الخطوة الأولى",
    title: "حدد أهدافك",
    desc: "أجب عن مجموعة قصيرة من الأسئلة حتى نفهم احتياجاتك وأهدافك.",
  },
  {
    emoji: "🧠",
    step: "الخطوة الثانية",
    title: "احصل على خطتك المناسبة",
    desc: "يقوم النظام باقتراح الخطة التدريبية الأنسب بناءً على إجاباتك.",
  },
  {
    emoji: "💳",
    step: "الخطوة الثالثة",
    title: "اطلع على السعر قبل الدفع",
    desc: "سيتم عرض السعر النهائي وجميع تفاصيل الاشتراك قبل إتمام عملية الشراء، ولن يتم تحصيل أي مبلغ قبل موافقتك.",
  },
] as const;

export default function PricingTransparency() {
  const head = useInView<HTMLDivElement>();
  const cards = useInView<HTMLDivElement>();
  const trust = useInView<HTMLDivElement>();

  return (
    <section
      id="pricing"
      dir="rtl"
      className="relative w-full overflow-hidden bg-[linear-gradient(180deg,#FAF8F5_0%,#FFFFFF_55%,#FFFFFF_100%)] py-20 md:py-28 font-[Tajawal,Cairo,sans-serif]"
    >
      <div
        className="pointer-events-none absolute right-8 top-24 hidden h-24 w-24 opacity-30 md:block"
        style={{
          backgroundImage: "radial-gradient(#F97316 1.2px, transparent 1.2px)",
          backgroundSize: "12px 12px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-8 top-24 hidden h-24 w-24 opacity-30 md:block"
        style={{
          backgroundImage: "radial-gradient(#F97316 1.2px, transparent 1.2px)",
          backgroundSize: "12px 12px",
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* Header */}
        <div
          ref={head.ref}
          className={`text-center transition-all duration-700 ease-out ${
            head.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <h2 className="text-center font-[Tajawal] text-[26px] font-extrabold leading-[1.12] tracking-tight text-foreground lg:origin-top lg:text-[78px] lg:font-black lg:leading-[1.08] lg:scale-[0.926]">
            كيف يتم{" "}
            <span className="inline-block translate-y-[2px] text-primary">تحديد السعر؟</span>
          </h2>
          <div
            aria-hidden
            className="relative mx-auto mt-[5px] h-[2px] w-full max-w-xs overflow-hidden sm:max-w-sm lg:max-w-md"
          >
            <div className="h-full w-full bg-gradient-to-l from-[#FF6B00]/30 via-[#FF6B00]/12 to-transparent" />
            {head.inView && (
              <span className="pointer-events-none absolute inset-y-0 right-0 w-1/4 animate-title-line-shimmer-pingpong bg-gradient-to-l from-transparent via-[#FF6B00]/55 to-transparent" />
            )}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-loose text-neutral-500 md:text-lg">
            عملية واضحة وبسيطة — تعرف ما ستدفعه قبل أي التزام. جميع الباقات{" "}
            <span className="font-bold text-neutral-700">رقمية بالكامل</span> ولا تشمل شحن منتجات مادية.
          </p>
        </div>

        {/* Step cards */}
        <div
          ref={cards.ref}
          className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-4 md:mt-16 md:grid-cols-3 md:gap-5"
        >
          {STEPS.map((item, index) => (
            <article
              key={item.step}
              className={`group relative overflow-hidden rounded-[24px] bg-white p-5 ring-1 ring-neutral-100 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.12)] transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(249,115,22,0.28)] hover:ring-orange-100 md:p-6 ${
                cards.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-[#FF6B00]/[0.06] blur-2xl transition-opacity group-hover:opacity-100"
              />
              <div className="relative text-right">
                <div className="flex items-center justify-end gap-3">
                  <span className="text-[11px] font-extrabold text-primary">{item.step}</span>
                  <span
                    className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-orange-100"
                    aria-hidden
                  >
                    {item.emoji}
                  </span>
                </div>
                <h3 className="mt-4 text-[18px] font-black leading-snug text-neutral-900 md:text-[19px]">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-[13.5px] leading-[1.75] text-neutral-600 md:text-[14px]">
                  {item.desc}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Trust box */}
        <div
          ref={trust.ref}
          className={`mx-auto mt-8 max-w-4xl transition-all duration-700 ease-out md:mt-10 ${
            trust.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
        >
          <div className="relative overflow-hidden rounded-[28px] border border-[#FF6B00]/15 bg-gradient-to-br from-[#FFF8F2] via-white to-[#FFF6EE] p-6 shadow-[0_14px_40px_-20px_rgba(255,107,0,0.35)] md:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#FF6B00]/10 blur-3xl"
            />
            <div className="relative flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:gap-5">
              <div className="grid h-14 w-14 shrink-0 place-items-center self-center rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FF8A3D] shadow-[0_12px_28px_-12px_rgba(255,107,0,0.55)] sm:self-start">
                <ShieldCheck className="h-7 w-7 text-white" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-right">
                <h3 className="font-[Tajawal] text-[20px] font-black text-neutral-900 md:text-[22px]">
                  شفافية كاملة في التسعير
                </h3>
                <p className="mt-2.5 text-[13.5px] leading-[1.8] text-neutral-600 md:text-[15px]">
                  نؤمن بالشفافية الكاملة. سيتم عرض سعر اشتراكك النهائي وجميع المزايا المشمولة وتفاصيل
                  الفوترة قبل أي عملية دفع، دون أي رسوم مخفية.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Digital product disclosure */}
        <div
          className={`mx-auto mt-8 max-w-4xl transition-all duration-700 ease-out md:mt-10 ${
            trust.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
          style={{ transitionDelay: "120ms" }}
        >
          <div className="relative overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_10px_32px_-18px_rgba(15,23,42,0.12)] md:p-8">
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:gap-5">
              <div className="grid h-14 w-14 shrink-0 place-items-center self-center rounded-2xl bg-orange-50 text-primary ring-1 ring-orange-100 sm:self-start">
                <Smartphone className="h-7 w-7" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-right">
                <h3 className="font-[Tajawal] text-[20px] font-black text-neutral-900 md:text-[22px]">
                  منتج رقمي — كيف تستلم برنامجك؟
                </h3>
                <p className="mt-2.5 text-[13.5px] leading-[1.85] text-neutral-600 md:text-[15px]">
                  {PRODUCT_SUMMARY.type}. {PRODUCT_SUMMARY.delivery} لا جلسات حضورية ولا شحن عبر الموقع.
                </p>
                <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-neutral-600 md:text-[14px]">
                  {PRODUCT_SUMMARY.includes.slice(0, 4).map((item) => (
                    <li key={item} className="flex items-start justify-end gap-2">
                      <span>{item}</span>
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex justify-center md:mt-12">
          <Link
            to="/quiz"
            className="group inline-flex items-center justify-center gap-3 rounded-full bg-primary px-8 py-4 text-[15px] font-black text-primary-foreground shadow-[0_16px_36px_-14px_rgba(255,107,0,0.65)] transition-all hover:-translate-y-0.5 active:scale-[0.98] md:px-10 md:py-[18px] md:text-base"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            ابدأ التقييم
          </Link>
        </div>

        {/* Footer note */}
        <p className="mx-auto mt-6 max-w-3xl text-center text-[11.5px] leading-relaxed text-neutral-500 md:mt-8 md:text-[12.5px]">
          جميع الأسعار تُعرض بوضوح قبل الدفع، ويمكنك مراجعة تفاصيل الاشتراك كاملة قبل تأكيد عملية
          الشراء.
        </p>
      </div>
    </section>
  );
}
