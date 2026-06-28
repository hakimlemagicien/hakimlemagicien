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
import { DarkPremiumPanel } from "@/components/DarkPremiumPanel";

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

const ORBIT_POSITIONS = [
  { x: 50, y: 7 },
  { x: 88, y: 26 },
  { x: 88, y: 74 },
  { x: 50, y: 93 },
  { x: 12, y: 74 },
  { x: 12, y: 26 },
];

function FeatureOrbitCard({
  feature,
  index,
  active,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
  active: boolean;
}) {
  const Icon = feature.icon;
  return (
    <article
      className={`group relative w-[168px] transition-all duration-700 ease-out sm:w-[180px] ${
        active ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
      }`}
      style={{ transitionDelay: `${index * 110}ms` }}
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.12)] ring-1 ring-neutral-100/80 backdrop-blur-sm transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(249,115,22,0.28)]"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-200/80 to-transparent"
        />
        <div className="flex flex-row-reverse items-start gap-3 text-right">
          <div className="relative shrink-0">
            <span
              aria-hidden
              className="absolute inset-0 rounded-xl bg-[#FF6B00]/30 blur-md opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
            <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-b from-[#FFF6EE] to-white shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_20px_-10px_rgba(249,115,22,0.3)] ring-1 ring-orange-100/80 transition-transform duration-500 group-hover:scale-105">
              <Icon className="h-5 w-5 text-[#FF6B00]" strokeWidth={2.1} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black tracking-wide text-primary/70">{feature.num}</span>
            <h3 className="mt-0.5 text-[13px] font-extrabold leading-snug text-neutral-900">{feature.title}</h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500 line-clamp-3">{feature.desc}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function FeatureSnapCard({
  feature,
  index,
  active,
  highlighted,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
  active: boolean;
  highlighted: boolean;
}) {
  const Icon = feature.icon;
  return (
    <article
      className={[
        "group relative w-[min(88vw,300px)] shrink-0 snap-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        active ? "translate-y-0" : "translate-y-6",
        highlighted
          ? "scale-100 opacity-100 z-[2]"
          : "scale-[0.92] opacity-65",
      ].join(" ")}
      style={{ transitionDelay: active ? `${index * 90}ms` : "0ms" }}
    >
      <div
        className={[
          "relative overflow-hidden rounded-[24px] border bg-gradient-to-br from-white via-white to-[#FFF8F2] p-5 ring-1 transition-all duration-500 ease-out",
          highlighted
            ? "border-[#FF6B00]/35 shadow-[0_16px_44px_-14px_rgba(255,107,0,0.35)] ring-[#FF6B00]/25"
            : "border-white/80 shadow-[0_10px_36px_-14px_rgba(15,23,42,0.12)] ring-neutral-100/70",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={[
            "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#FF6B00]/10 blur-2xl transition-opacity duration-500",
            highlighted ? "opacity-100" : "opacity-40",
          ].join(" ")}
        />
        <div className="relative flex flex-row-reverse items-center gap-4 text-right">
          <div className="relative shrink-0">
            <span
              aria-hidden
              className={[
                "absolute inset-0 rounded-2xl bg-[#FF6B00]/25 blur-lg transition-opacity duration-500",
                highlighted ? "opacity-100 animate-feature-icon-glow" : "opacity-0",
              ].join(" ")}
            />
            <div
              className={[
                "relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#FFF6EE] via-white to-orange-50/80 text-[#FF6B00] ring-1 transition-transform duration-500",
                highlighted
                  ? "scale-105 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_16px_32px_-8px_rgba(255,107,0,0.45)] ring-[#FF6B00]/30"
                  : "shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_12px_28px_-8px_rgba(255,107,0,0.35)] ring-[#FF6B00]/15",
              ].join(" ")}
            >
              <Icon className="h-7 w-7" strokeWidth={2.1} />
            </div>
            <span
              className={[
                "absolute -bottom-1 -left-1 grid h-6 w-6 place-items-center rounded-full bg-[#FF6B00] text-[10px] font-black text-white transition-transform duration-500",
                highlighted
                  ? "scale-110 shadow-[0_6px_16px_-4px_rgba(255,107,0,0.65)]"
                  : "shadow-[0_4px_12px_-4px_rgba(255,107,0,0.55)]",
              ].join(" ")}
            >
              {feature.num}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className={[
                "text-base font-extrabold leading-snug transition-colors duration-500",
                highlighted ? "text-neutral-900" : "text-neutral-700",
              ].join(" ")}
            >
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">{feature.desc}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

const SNAP_AUTO_MS = 3200;
const SNAP_USER_PAUSE_MS = 12000;

function FeatureSnapRail({ active }: { active: boolean }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoScrollRef = useRef(false);
  const pauseUntilRef = useRef(0);

  const pauseAuto = () => {
    pauseUntilRef.current = Date.now() + SNAP_USER_PAUSE_MS;
  };

  const scrollToCard = (index: number) => {
    const rail = railRef.current;
    if (!rail || index < 0 || index >= FEATURES.length) return;
    const card = rail.children[index] as HTMLElement | undefined;
    if (!card) return;

    autoScrollRef.current = true;
    const railRect = rail.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const delta = cardRect.left + cardRect.width / 2 - (railRect.left + railRect.width / 2);
    rail.scrollBy({ left: delta, behavior: "smooth" });

    window.setTimeout(() => {
      autoScrollRef.current = false;
    }, 750);
  };

  const syncActiveFromScroll = () => {
    const rail = railRef.current;
    if (!rail) return;

    const railCenter = rail.getBoundingClientRect().left + rail.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;

    for (let i = 0; i < rail.children.length; i++) {
      const child = rail.children[i] as HTMLElement;
      const rect = child.getBoundingClientRect();
      const childCenter = rect.left + rect.width / 2;
      const dist = Math.abs(childCenter - railCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }

    setActiveIndex(closest);
  };

  useEffect(() => {
    if (!active) return;

    const startTimer = window.setTimeout(() => scrollToCard(0), 400);

    const interval = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      setActiveIndex((prev) => {
        const next = (prev + 1) % FEATURES.length;
        scrollToCard(next);
        return next;
      });
    }, SNAP_AUTO_MS);

    return () => {
      window.clearTimeout(startTimer);
      window.clearInterval(interval);
    };
  }, [active]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const onScroll = () => {
      syncActiveFromScroll();
      if (!autoScrollRef.current) pauseAuto();
    };

    const onUserIntent = () => pauseAuto();

    rail.addEventListener("scroll", onScroll, { passive: true });
    rail.addEventListener("pointerdown", onUserIntent);
    rail.addEventListener("touchstart", onUserIntent, { passive: true });
    rail.addEventListener("wheel", onUserIntent, { passive: true });

    return () => {
      rail.removeEventListener("scroll", onScroll);
      rail.removeEventListener("pointerdown", onUserIntent);
      rail.removeEventListener("touchstart", onUserIntent);
      rail.removeEventListener("wheel", onUserIntent);
    };
  }, []);

  return (
    <div className="relative xl:hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white via-white/80 to-transparent sm:w-12"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white via-white/80 to-transparent sm:w-12"
      />

      <div
        ref={railRef}
        className={[
          "flex gap-4 overflow-x-auto scroll-smooth pb-3 snap-x snap-mandatory",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          "-mx-4 px-4 sm:-mx-6 sm:px-6",
        ].join(" ")}
      >
        {FEATURES.map((f, i) => (
          <FeatureSnapCard
            key={f.num}
            feature={f}
            index={i}
            active={active}
            highlighted={i === activeIndex}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2" aria-hidden>
        {FEATURES.map((f, i) => (
          <button
            key={f.num}
            type="button"
            aria-label={`البطاقة ${i + 1}`}
            onClick={() => {
              pauseAuto();
              setActiveIndex(i);
              scrollToCard(i);
            }}
            className={[
              "rounded-full transition-all duration-500 ease-out",
              i === activeIndex
                ? "h-2.5 w-7 bg-[#FF6B00] shadow-[0_0_12px_rgba(255,107,0,0.45)]"
                : "h-2.5 w-2.5 bg-neutral-300/80 hover:bg-primary/40",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}

function FeatureOrbitLayout({ active }: { active: boolean }) {
  return (
    <div className="relative mx-auto hidden min-h-[620px] max-w-[920px] xl:block">
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="rgba(249,115,22,0.18)"
          strokeWidth="0.35"
          strokeDasharray="2 2.5"
        />
        {ORBIT_POSITIONS.map((pos, i) => (
          <line
            key={FEATURES[i].num}
            x1="50"
            y1="50"
            x2={pos.x}
            y2={pos.y}
            stroke="rgba(249,115,22,0.12)"
            strokeWidth="0.25"
            strokeDasharray="1.2 1.8"
          />
        ))}
      </svg>

      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF6B00]/10 blur-3xl animate-warning-card-outer-glow"
      />

      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <div
          className={`relative grid h-[88px] w-[88px] place-items-center rounded-2xl text-white shadow-[0_12px_32px_-8px_rgba(255,107,0,0.55)] ring-4 ring-white transition-all duration-700 ${
            active ? "scale-100 opacity-100" : "scale-90 opacity-0"
          }`}
          style={{
            backgroundImage: "linear-gradient(135deg, #ff8a3d 0%, #f97316 58%, #ea580c 100%)",
          }}
        >
          <div className="text-center font-[Tajawal]">
            <Target className="mx-auto h-7 w-7" strokeWidth={2.2} />
            <span className="mt-1 block text-[11px] font-black leading-tight">6 ميزات</span>
            <span className="block text-[9px] font-bold opacity-90">متكاملة</span>
          </div>
        </div>
      </div>

      {FEATURES.map((f, i) => {
        const pos = ORBIT_POSITIONS[i];
        return (
          <div
            key={f.num}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 z-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF6B00] ring-4 ring-[#FF6B00]/20 shadow-[0_0_12px_rgba(255,107,0,0.45)]"
            />
            <div className="relative z-10">
              <FeatureOrbitCard feature={f} index={i} active={active} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function WhatYouGet() {
  const head = useInView<HTMLDivElement>(0.1);
  const cards = useInView<HTMLDivElement>(0.1);
  const trust = useInView<HTMLDivElement>(0.1);

  return (
    <section
      id="features"
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
          className={`text-center -mt-[60px] transition-all duration-700 ease-out ${
            head.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-500 -mt-[30px]">
            <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
            كل ما تحتاجه في مكان واحد
          </span>

          {/* Heading */}
          <h2 className="origin-top mt-5 text-[44px] font-[Tajawal] font-black leading-[1.08] tracking-tight text-foreground scale-[0.853] sm:scale-[0.896] sm:text-[59px] lg:scale-[0.926] lg:text-[78px]">
            ماذا ستحصل عليه
            <br />
            <span className="inline-block translate-y-[2px] text-primary">داخل برنامجك؟</span>
          </h2>
          <div
            aria-hidden
            className="relative mx-auto mt-[5px] h-[2px] w-full max-w-xs overflow-hidden sm:max-w-sm lg:max-w-md"
          >
            <div className="h-full w-full bg-gradient-to-l from-[#FF6B00]/30 via-[#FF6B00]/12 to-transparent" />
            {head.inView && (
              <span
                className="pointer-events-none absolute inset-y-0 right-0 w-1/4 animate-title-line-shimmer-pingpong bg-gradient-to-l from-transparent via-[#FF6B00]/55 to-transparent"
              />
            )}
          </div>

          {/* Subtitle */}
          <p className="mt-4 text-base md:text-lg text-neutral-500 leading-relaxed max-w-2xl mx-auto">
            كل ما تحتاجه للوصول إلى هدفك في مكان واحد.
          </p>
        </div>

        {/* 6 FEATURE CARDS — orbit (xl) + snap rail (mobile/tablet) */}
        <div ref={cards.ref} className="mt-12 md:mt-16">
          <FeatureOrbitLayout active={cards.inView} />
          <FeatureSnapRail active={cards.inView} />
        </div>

        {/* BOTTOM TRUST BLOCK */}
        <DarkPremiumPanel
          ref={trust.ref}
          active={trust.inView}
          className="mt-12 md:mt-16"
          innerClassName="p-6 md:p-8 lg:p-10"
        >
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-10">
            <div className="relative order-3 shrink-0 lg:order-1">
              <div className="absolute inset-0 scale-110 rounded-full bg-[#FF6B00]/20 blur-3xl" />
              <img
                src={targetIllustration}
                alt="هدفك"
                width={320}
                height={320}
                loading="lazy"
                className="relative h-48 w-48 object-contain animate-float-soft md:h-56 md:w-56 lg:h-64 lg:w-64"
              />
            </div>

            <div className="order-2 flex-1 text-center lg:order-2 lg:border-r lg:border-white/15 lg:pr-10">
              <h3 className="text-xl font-black leading-snug text-white/95 md:text-2xl lg:text-3xl [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
                نحن لا نقدم لك ملف PDF فقط...
              </h3>
              <p className="mt-2 text-xl font-black leading-snug text-[#FF6B00] md:text-2xl lg:text-3xl [text-shadow:0_1px_3px_rgba(0,0,0,0.35)]">
                بل نظاماً متكاملاً يساعدك على الوصول لهدفك
              </p>
              <p className="mt-1 text-xl font-black leading-snug text-[#FF6B00] md:text-2xl lg:text-3xl [text-shadow:0_1px_3px_rgba(0,0,0,0.35)]">
                خطوة بخطوة.
              </p>
            </div>

            <div className="order-1 shrink-0 lg:order-3">
              <ul className="space-y-3 text-right">
                {CHECKLIST.map((item, i) => (
                  <li
                    key={i}
                    className={`flex items-center justify-end gap-2 transition-all duration-500 ease-out ${
                      trust.inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                    }`}
                    style={{ transitionDelay: `${300 + i * 100}ms` }}
                  >
                    <span className="text-sm font-bold text-white/85 md:text-base [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
                      {item}
                    </span>
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#FF6B00] text-white shadow-[0_4px_12px_-4px_rgba(255,107,0,0.55)]">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DarkPremiumPanel>
      </div>
    </section>
  );
}
