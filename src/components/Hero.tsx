import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Droplets,
  Dumbbell,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import { MarketingAppShowcase } from "@/components/MarketingAppShowcase";

const PRODUCT_FEATURES = [
  { icon: Dumbbell, label: "تدريب داخل التطبيق", tone: "bg-[#FFF1E6] text-[#FF6B00]" },
  { icon: Utensils, label: "تغذية محسوبة", tone: "bg-[#E9F9EF] text-[#22A95D]" },
  { icon: BarChart3, label: "تتبع التقدم", tone: "bg-[#EEF2FF] text-[#6366F1]" },
  { icon: Droplets, label: "متابعة الترطيب", tone: "bg-[#EAF4FF] text-[#3B82F6]" },
] as const;

function HeroQuizCTA({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`group relative flex min-h-[54px] w-full items-center overflow-hidden rounded-full bg-gradient-to-l from-[#FF6B00] to-[#FF8A3D] px-2 shadow-[0_18px_36px_-18px_rgba(255,107,0,0.72)] transition hover:-translate-y-0.5 hover:brightness-105 sm:w-auto sm:min-w-[285px] ${className}`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#FF6B00] transition-transform group-hover:-translate-x-1">
        <ArrowLeft className="h-4 w-4" strokeWidth={2.6} />
      </span>
      <span className="flex-1 px-4 text-center font-[Tajawal] text-[15px] font-extrabold text-white">
        ابدأ تجربتك المجانية
      </span>
      <span className="w-10 shrink-0" aria-hidden />
    </Link>
  );
}

function HeroStickyQuizBar({ visible }: { visible: boolean }) {
  return (
    <div
      id="hero-sticky-quiz-bar"
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-white/70 bg-white/90 px-4 pt-3 shadow-[0_-12px_40px_-10px_rgba(15,23,42,0.16)] backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))] transition-[transform,opacity] duration-500 lg:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
      role="region"
      aria-label="ابدأ تجربتك المجانية"
      aria-hidden={!visible}
    >
      <HeroQuizCTA />
    </div>
  );
}

export function Hero() {
  const [stickyCtaVisible, setStickyCtaVisible] = useState(false);
  const ctaAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ctaAnchorRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyCtaVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#FFF_0%,#FFF9F4_64%,#FAF8F5_100%)] pb-12 pt-7 font-[Tajawal,Cairo,sans-serif] sm:pb-16 sm:pt-10 lg:pb-24 lg:pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-120px] top-10 h-[360px] w-[360px] rounded-full bg-[#FF6B00]/[0.07] blur-3xl lg:right-[-40px] lg:h-[520px] lg:w-[520px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-10 left-[-100px] h-[280px] w-[280px] rounded-full bg-[#22A95D]/[0.06] blur-3xl"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 lg:px-8">
          <div className="order-1 text-center lg:text-right">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#FFD8BA] bg-white px-3.5 py-2 text-[#0F172A] shadow-[0_10px_26px_-18px_rgba(15,23,42,0.35)] lg:mx-0">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#FFF1E6] text-[#FF6B00]">
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="text-[12px] font-extrabold sm:text-[13px]">
                تطبيق Fitness رقمي كامل
              </span>
            </div>

            <h1 className="mx-auto mt-6 max-w-[720px] text-[34px] font-black leading-[1.16] tracking-tight text-[#0F172A] sm:text-[48px] lg:mx-0 lg:text-[62px] lg:leading-[1.08]">
              تدريبك وتغذيتك وتقدمك
              <span className="mt-2 block text-[#FF6B00]">كلها داخل تطبيق واحد</span>
            </h1>

            <p className="mx-auto mt-5 max-w-[610px] text-[14px] font-medium leading-[1.8] text-[#64748B] sm:text-[17px] lg:mx-0">
              أجب عن تقييم قصير، ثم تابع برنامج التدريب وخطة التغذية والقياسات والترطيب مباشرة داخل
              حسابك في MAAKFIT. لا توجد شحنة ولا إرسال برامج خارج التطبيق.
            </p>

            <div className="mx-auto mt-6 grid max-w-[610px] grid-cols-2 gap-2.5 sm:grid-cols-4 lg:mx-0">
              {PRODUCT_FEATURES.map(({ icon: Icon, label, tone }) => (
                <div
                  key={label}
                  className="flex min-h-[92px] flex-col items-center justify-center rounded-[20px] border border-[#ECE7E1] bg-white px-2.5 py-3 text-center shadow-[0_12px_28px_-22px_rgba(15,23,42,0.4)] transition hover:-translate-y-1"
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                  </span>
                  <span className="mt-2 text-[11px] font-extrabold leading-tight text-[#0F172A] sm:text-[12px]">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div
              ref={ctaAnchorRef}
              id="hero-inline-quiz-cta"
              className="mt-7 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
            >
              <HeroQuizCTA />
              <div className="inline-flex items-center gap-2 text-[11px] font-bold text-[#64748B] sm:text-[12px]">
                <ShieldCheck className="h-4 w-4 text-[#22A95D]" />
                ابدأ بـ FREE ثم اختر PLUS أو PRO
              </div>
            </div>
          </div>

          <div className="order-2 px-3 sm:px-12 lg:px-0">
            <MarketingAppShowcase />
          </div>
        </div>
      </section>

      <HeroStickyQuizBar visible={stickyCtaVisible} />
    </>
  );
}
