import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ShieldCheck,
  Headphones,
  Trophy,
  Target,
  Lock,
  TrendingDown,
} from "lucide-react";
import coachHero from "@/assets/coach-hero.jpg";
import avatar1 from "@/assets/avatar1.jpg";
import avatar2 from "@/assets/avatar2.jpg";
import avatar3 from "@/assets/avatar3.jpg";

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

function useCount(target: number, active: boolean, duration = 1600) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return v;
}

const TRUST_TAGS = ["تقييم دقيق", "خطة مخصصة لك", "متابعة حتى تحقق هدفك"];

const TRUST_STRIP = [
  { Icon: ShieldCheck, title: "آمن وموثوق", desc: "بياناتك محمية 100%" },
  { Icon: Headphones, title: "دعم مستمر", desc: "فريق الدعم معك طوال رحلتك" },
  { Icon: Trophy, title: "نتائج حقيقية", desc: "برامج مثبتة ونتائج مضمونة" },
  { Icon: Target, title: "خطط مخصصة", desc: "كل برنامج مصمم خصيصاً لك" },
  { Icon: Lock, title: "خصوصية تامة", desc: "معلوماتك خاصة وآمنة" },
];

export default function FinalCTA() {
  const { ref, inView } = useInView<HTMLElement>(0.1);
  const count = useCount(3500, inView);
  const progress = useCount(76, inView, 1800);

  const circumference = 2 * Math.PI * 38;
  const dash = (progress / 100) * circumference;

  return (
    <section
      ref={ref}
      dir="rtl"
      className="relative bg-white py-16 sm:py-20 lg:py-24"
      style={{ fontFamily: "'Tajawal', 'Cairo', sans-serif" }}
    >
      <style>{`
        @keyframes ctaFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes ctaGlow { 0%,100%{box-shadow:0 10px 30px -8px rgba(249,115,22,0.45)} 50%{box-shadow:0 16px 44px -8px rgba(249,115,22,0.65)} }
        .cta-float { animation: ctaFloat 6s ease-in-out infinite; }
        .cta-glow { animation: ctaGlow 3s ease-in-out infinite; }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main container */}
        <div
          className="relative overflow-hidden p-6 sm:p-10 lg:p-14"
          style={{
            borderRadius: 40,
            background:
              "linear-gradient(135deg, #FFF7ED 0%, #FAF6F2 55%, #FFF1E4 100%)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(24px)",
            transition: "all 800ms ease-out",
          }}
        >
          {/* dot pattern */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-10 right-10 h-24 w-24 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(249,115,22,0.35) 1.2px, transparent 1.5px)",
              backgroundSize: "12px 12px",
            }}
          />

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
            {/* RIGHT (text) — RTL puts first in source on the right */}
            <div className="text-right order-2 lg:order-1">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
                style={{ background: "#FFF7ED", color: "#F97316" }}
              >
                <span>★</span>
                <span>
                  ابدأ رحلتك <span className="text-[#F97316]">نحو</span> أفضل نسخة منك
                </span>
              </div>

              <h2
                className="mt-6 font-black tracking-tight leading-[1.05]"
                style={{
                  color: "#111827",
                  fontWeight: 900,
                  fontSize: "clamp(40px, 6vw, 80px)",
                }}
              >
                جاهز لتحول حقيقي
                <br />
                <span style={{ color: "#F97316" }}>في 90 يوماً؟</span>
              </h2>

              <p
                className="mt-5 text-base sm:text-lg leading-relaxed max-w-xl"
                style={{ color: "#6B7280" }}
              >
                انضم إلى آلاف العملاء الذين حققوا نتائج حقيقية ومستدامة مع برنامج حكيم كوتشينج.
              </p>

              {/* Trust tags */}
              <div className="mt-6 flex flex-wrap gap-3">
                {TRUST_TAGS.map((t) => (
                  <div
                    key={t}
                    className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                    style={{
                      color: "#111827",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                    }}
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full" style={{ background: "#FFF7ED" }}>
                      <Check className="h-3 w-3" style={{ color: "#F97316" }} strokeWidth={3} />
                    </span>
                    {t}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                className="mt-7 group cta-glow w-full sm:w-auto inline-flex items-center justify-between gap-6 rounded-full px-8 py-5 text-white font-bold text-lg transition-transform hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",
                  minWidth: 420,
                  maxWidth: "100%",
                }}
              >
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                <span className="flex-1 text-center">ابدأ التقييم المجاني الآن</span>
              </button>

              {/* Social proof */}
              <div className="mt-6 flex items-center gap-4">
                <div className="flex -space-x-3 space-x-reverse">
                  {[avatar1, avatar2, avatar3].map((a, i) => (
                    <img
                      key={i}
                      src={a}
                      alt=""
                      className="h-11 w-11 rounded-full ring-2 ring-white object-cover"
                    />
                  ))}
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: "#111827" }}>
                    +{count.toLocaleString()} عميل حققوا نتائجهم معنا
                  </div>
                  <div className="text-sm" style={{ color: "#F97316", fontWeight: 700 }}>
                    كن أنت التالي!
                  </div>
                </div>
              </div>
            </div>

            {/* LEFT (visual) */}
            <div className="relative order-1 lg:order-2 min-h-[460px] lg:min-h-[600px]">
              {/* soft beige circle backdrop */}
              <div
                aria-hidden
                className="absolute inset-0 m-auto h-[88%] w-[88%] rounded-full"
                style={{ background: "rgba(249,115,22,0.08)" }}
              />
              <img
                src={coachHero}
                alt="Hakim Coach"
                className="relative z-10 mx-auto h-full w-auto max-h-[600px] object-contain"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "scale(1)" : "scale(0.96)",
                  transition: "all 900ms ease-out 200ms",
                }}
              />

              {/* Floating Card 01 — Progress */}
              <div
                className="absolute top-2 left-0 sm:top-6 sm:left-2 z-20 bg-white p-4 cta-float"
                style={{
                  borderRadius: 24,
                  boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                  animationDelay: "0s",
                }}
              >
                <div className="text-right text-sm font-bold mb-2" style={{ color: "#111827" }}>
                  تقدمك
                </div>
                <div className="flex items-center gap-3">
                  <svg width="86" height="86" viewBox="0 0 86 86" className="-rotate-90">
                    <circle cx="43" cy="43" r="38" stroke="#FFF7ED" strokeWidth="8" fill="none" />
                    <circle
                      cx="43"
                      cy="43"
                      r="38"
                      stroke="#F97316"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${dash} ${circumference}`}
                      style={{ transition: "stroke-dasharray 1.5s ease-out" }}
                    />
                  </svg>
                  <div className="absolute" style={{ marginRight: 28, marginTop: 14 }}>
                    <div className="text-base font-black" style={{ color: "#111827" }}>
                      {progress}%
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-right" style={{ color: "#6B7280" }}>
                  أنت على الطريق الصحيح!
                </div>
              </div>

              {/* Floating Card 02 — Goal */}
              <div
                className="absolute top-1/2 left-0 sm:-left-2 z-20 -translate-y-1/2 bg-white p-4 cta-float w-[180px]"
                style={{
                  borderRadius: 24,
                  boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                  animationDelay: "1.5s",
                }}
              >
                <div className="text-right text-xs font-bold" style={{ color: "#6B7280" }}>
                  هدفك
                </div>
                <div className="mt-1 text-right text-sm font-bold" style={{ color: "#111827" }}>
                  خسارة الوزن
                </div>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <span className="text-lg font-black" style={{ color: "#22C55E" }}>
                    -18 كغ
                  </span>
                  <TrendingDown className="h-4 w-4" style={{ color: "#22C55E" }} />
                </div>
                <svg viewBox="0 0 120 40" className="mt-1 w-full h-8">
                  <polyline
                    points="0,30 20,28 40,24 60,18 80,14 100,8 120,4"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-right text-[10px]" style={{ color: "#6B7280" }}>
                  خلال 3 أشهر
                </div>
              </div>

              {/* Floating Card 03 — Today */}
              <div
                className="absolute bottom-4 left-0 sm:bottom-8 sm:left-2 z-20 bg-white p-4 cta-float w-[180px]"
                style={{
                  borderRadius: 24,
                  boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                  animationDelay: "3s",
                }}
              >
                <div className="text-right text-sm font-bold mb-2" style={{ color: "#111827" }}>
                  اليوم
                </div>
                <ul className="space-y-1.5">
                  {["تمرين القوة", "الكارديو", "خطة التغذية"].map((t) => (
                    <li key={t} className="flex items-center justify-end gap-2 text-xs" style={{ color: "#111827" }}>
                      <span>{t}</span>
                      <span className="grid h-4 w-4 place-items-center rounded-full" style={{ background: "#22C55E" }}>
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom trust strip */}
        <div
          className="mt-6 bg-white p-6 sm:p-8"
          style={{
            borderRadius: 32,
            boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(20px)",
            transition: "all 800ms ease-out 300ms",
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 divide-y sm:divide-y-0 lg:divide-x lg:divide-x-reverse divide-gray-100">
            {TRUST_STRIP.map(({ Icon, title, desc }, i) => (
              <div
                key={title}
                className="flex items-center gap-3 px-2 transition-transform hover:-translate-y-0.5"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(10px)",
                  transition: `all 600ms ease-out ${400 + i * 100}ms`,
                }}
              >
                <span
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full"
                  style={{ background: "#FFF7ED" }}
                >
                  <Icon className="h-6 w-6" style={{ color: "#F97316" }} strokeWidth={2} />
                </span>
                <div className="text-right min-w-0">
                  <div className="text-sm font-bold" style={{ color: "#111827" }}>
                    {title}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                    {desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
