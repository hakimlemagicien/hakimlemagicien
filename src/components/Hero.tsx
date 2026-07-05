import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  Dumbbell,
  LineChart,
  TrendingUp,
  TrendingDown,
  Utensils,
  Zap,
  Star,
} from "lucide-react";
import {
  SOCIAL_PROOF_CLIENT_COUNT,
  formatSocialProofClientCount,
} from "@/lib/social-proof";
import { ProgressChart } from "./ProgressChart";
import { TrustStatistics } from "./TrustStatistics";
import coachImg from "@/assets/coach-photo.png";
import avatar1 from "@/assets/avatar1.jpg";
import avatar2 from "@/assets/avatar2.jpg";
import avatar3 from "@/assets/avatar3.jpg";
import avatar4 from "@/assets/avatar4.jpg";

const features = [
  { icon: Dumbbell, label: "خطة تدريب مخصصة" },
  { icon: Utensils, label: "خطة تغذية مخصصة" },
  { icon: CalendarCheck, label: "متابعة دورية" },
  { icon: LineChart, label: "نتائج قابلة للقياس" },
];

/** RTL visual order: نتائج → متابعة → تغذية → تدريب (right to left) */
const mobileFeatures = [
  { icon: LineChart, label: "نتائج قابلة للقياس" },
  { icon: CalendarCheck, label: "متابعة دورية" },
  { icon: Utensils, label: "خطة تغذية مخصصة" },
  { icon: Dumbbell, label: "خطة تدريب مخصصة" },
];

const CLIENT_COUNT_LABEL = formatSocialProofClientCount();

const HERO_CYCLING_PHRASES = [
  "مخصص لهدفك وجسدك 100% ",
  "مصمم ليصنع أفضل نسخة منك ",
  "يضمن لك النتيجة خلال 90 يوماً ",
];

const PHRASE_CYCLE_MS = 2500;
const TYPE_INTERVAL_MS = 55;

function splitGraphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("ar", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

const HERO_WIDTH_HOLDER_PHRASE = HERO_CYCLING_PHRASES.reduce((longest, phrase) =>
  splitGraphemes(phrase).length > splitGraphemes(longest).length ? phrase : longest,
);

const HERO_LINE_FONT_CLASS =
  "font-[Tajawal] text-[clamp(20px,5vw,76px)] sm:text-[clamp(28px,5.5vw,92px)] lg:text-[clamp(48px,6.5vw,118px)] leading-none text-[#FF6B00]";

function CyclingHeroLine({
  className = "",
  variant = "mobile",
}: {
  className?: string;
  variant?: "mobile" | "desktop";
}) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const graphemes = splitGraphemes(HERO_CYCLING_PHRASES[phraseIndex]);
  const displayed = graphemes.slice(0, charIndex).join("");

  useEffect(() => {
    setCharIndex(0);
    setVisible(true);

    const graphemeCount = splitGraphemes(HERO_CYCLING_PHRASES[phraseIndex]).length;
    const cycleStart = performance.now();
    let count = 0;
    let typeInterval: ReturnType<typeof setInterval> | undefined;
    let switchTimeout: ReturnType<typeof setTimeout> | undefined;
    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;

    typeInterval = window.setInterval(() => {
      count += 1;
      setCharIndex(count);

      if (count >= graphemeCount) {
        window.clearInterval(typeInterval);
        const elapsed = performance.now() - cycleStart;
        const holdMs = Math.max(400, PHRASE_CYCLE_MS - elapsed);

        switchTimeout = window.setTimeout(() => {
          setVisible(false);
          fadeTimeout = window.setTimeout(() => {
            setPhraseIndex((prev) => (prev + 1) % HERO_CYCLING_PHRASES.length);
          }, 280);
        }, holdMs);
      }
    }, TYPE_INTERVAL_MS);

    return () => {
      if (typeInterval) window.clearInterval(typeInterval);
      if (switchTimeout) window.clearTimeout(switchTimeout);
      if (fadeTimeout) window.clearTimeout(fadeTimeout);
    };
  }, [phraseIndex]);

  if (variant === "desktop") {
    return (
      <span
        dir="rtl"
        lang="ar"
        className={[
          "relative mt-2 block w-full text-right",
          "font-[Tajawal] text-[38px] lg:text-[40px] xl:text-[40px] font-black leading-[1.15] text-[#FF6B00]",
          "transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0",
          className,
        ].join(" ")}
        aria-live="polite"
      >
        <span className="invisible block whitespace-nowrap select-none lg:text-[40px]" aria-hidden>
          {HERO_WIDTH_HOLDER_PHRASE}
        </span>
        <span className="absolute right-0 top-0 inline-flex items-center gap-0.5 whitespace-nowrap lg:text-[40px] lg:leading-[1.15]">
          {displayed}
          <span
            className="inline-block h-[0.85em] w-[2px] shrink-0 animate-cursor-blink bg-[#FF6B00]"
            aria-hidden
          />
        </span>
      </span>
    );
  }

  return (
    <div
      className={[
        "flex h-[76px] w-full translate-x-[10px] -translate-y-[30px] items-center justify-end",
        "sm:h-[92px] lg:h-[118px]",
        className,
      ].join(" ")}
    >
      <div
        dir="rtl"
        lang="ar"
        className={[
          "relative inline-block max-w-full text-right",
          HERO_LINE_FONT_CLASS,
          "transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0",
        ].join(" ")}
        aria-live="polite"
      >
        <span className="invisible whitespace-nowrap select-none" aria-hidden>
          {HERO_WIDTH_HOLDER_PHRASE}
        </span>
        <span className="absolute right-0 top-0 inline-flex translate-x-[55px] -translate-y-[20px] items-center gap-0.5 whitespace-nowrap">
          {displayed}
          <span
            className="inline-block h-[0.85em] w-[2px] shrink-0 animate-cursor-blink bg-[#FF6B00]"
            aria-hidden
          />
        </span>
      </div>
    </div>
  );
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function useInViewOnce<T extends HTMLElement>(threshold = 0.25) {
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

function useAnimatedClientCount(active: boolean, duration = 2500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(t);
      setValue(Math.round(eased * SOCIAL_PROOF_CLIENT_COUNT));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, duration]);
  return value;
}

function AnimatedClientCount({ active }: { active: boolean }) {
  const count = useAnimatedClientCount(active);
  return (
    <span
      className="inline-block min-w-[4.5rem] text-left font-[Tajawal] text-[13px] font-extrabold tabular-nums text-success"
      aria-label={CLIENT_COUNT_LABEL}
    >
      +{count.toLocaleString("en-US")}
    </span>
  );
}

function MobileSocialProof({ avatars }: { avatars: string[] }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>(0.2);

  return (
    <div ref={ref} className="mt-3 flex items-center justify-center gap-3 [direction:ltr]">
      <div className="flex shrink-0 -space-x-2">
        {avatars.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            width={36}
            height={36}
            loading="lazy"
            className="h-9 w-9 rounded-full border-2 border-white object-cover"
          />
        ))}
      </div>
      <div className="flex flex-col items-start gap-0.5">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-success text-success" />
          ))}
          <AnimatedClientCount active={inView} />
        </div>
        <div className="flex items-center gap-1">
          <span className="font-[Tajawal] text-[11px] font-medium text-foreground">
            عميل حققوا نتائج مذهلة
          </span>
          <BadgeCheck className="h-3.5 w-3.5 text-success" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, label }: { icon: typeof Dumbbell; label: string }) {
  return (
    <div className="rounded-2xl bg-white shadow-card border border-border/40 p-4 sm:p-5 flex flex-col items-center text-center gap-3 transition-transform hover:-translate-y-1">
      <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" strokeWidth={2} />
      <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">{label}</p>
    </div>
  );
}

function MobileFeatureCard({
  icon: Icon,
  label,
  index = 0,
}: {
  icon: typeof Dumbbell;
  label: string;
  index?: number;
}) {
  return (
    <div className="flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border border-black/[0.04] bg-white px-1 py-1.5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.07)]">
      <div
        className="relative h-[27px] w-[27px] shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#FF6B00]/20 via-[#FF6B00]/10 to-[#FF6B00]/5 animate-feature-icon-glow"
        style={{ animationDelay: `${index * 0.35}s` }}
      >
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <span
            className="absolute -inset-y-3 -left-1/2 h-[200%] w-[200%] animate-feature-icon-shine bg-gradient-to-r from-transparent via-white/70 to-transparent"
            style={{ animationDelay: `${index * 0.35 + 0.5}s` }}
          />
        </span>
        <span className="relative z-10 flex h-full w-full items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-[#FF6B00]" strokeWidth={2.25} />
        </span>
      </div>
      <span className="max-w-full text-center font-[Tajawal] text-[8px] font-medium leading-tight text-foreground line-clamp-2">
        {label}
      </span>
    </div>
  );
}

function ResultCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Dumbbell;
  value: string;
  label: string;
  tone: "success" | "primary";
}) {
  const bg = tone === "success" ? "bg-success-soft text-success" : "bg-primary-soft text-primary";
  return (
    <div className="flex flex-row-reverse items-center gap-3 rounded-2xl bg-white shadow-soft border border-white px-4 py-3 min-w-[150px]">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${bg}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1 text-right">
        <p className="text-lg font-black text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

function renderSignedValue(value: string) {
  const signed = value.match(/^([+-])(.+)$/);
  if (!signed) return value;

  return (
    <span className="inline-flex flex-row items-baseline [direction:ltr]">
      <span>{signed[1]}</span>
      <span>{signed[2]}</span>
    </span>
  );
}

function MobileResultCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Dumbbell;
  value: string;
  label: string;
  tone: "success" | "primary";
}) {
  const bg = tone === "success" ? "bg-success-soft text-success" : "bg-primary-soft text-primary";
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-[14px] py-3 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.1)]">
      <span className={`grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full ${bg}`}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0 text-right">
        <p className="font-[Cairo] text-[18px] font-extrabold leading-none text-foreground">
          {renderSignedValue(value)}
        </p>
        <p className="mt-0.5 font-[Tajawal] text-[11px] font-medium leading-tight text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

function MobileCoachVisual() {
  return (
    <div className="relative mx-auto -mb-[150px] h-[530px] w-full max-w-[320px]">
      {/* dot grid — left of coach */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-[28%] z-0 grid grid-cols-5 gap-[5px] opacity-35"
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="h-[5px] w-[5px] rounded-full bg-neutral-300" />
        ))}
      </div>

      {/* beige circle */}
      <div className="pointer-events-none absolute inset-x-4 top-2 bottom-6 z-0 flex items-center justify-center -translate-x-[50px] -translate-y-[30px]">
        <div className="h-[320px] w-[320px] rounded-full bg-beige" />
      </div>

      {/* coach */}
      <img
        src={coachImg}
        alt="مدرب لياقة بدنية"
        width={1024}
        height={1024}
        className="absolute inset-x-6 bottom-[140px] z-10 h-[400px] w-auto max-w-none object-contain object-bottom"
      />

      {/* floating result cards — right side */}
      <div className="absolute -right-[38px] top-[6%] z-20 flex flex-col gap-5 -translate-y-[26px]">
        <div className="animate-float">
          <MobileResultCard icon={TrendingDown} value="-12kg" label="خسارة دهون" tone="success" />
        </div>
        <div className="animate-float" style={{ animationDelay: "0.8s" }}>
          <MobileResultCard icon={TrendingUp} value="+4.7kg" label="كتلة عضلية" tone="primary" />
        </div>
        <div className="animate-float" style={{ animationDelay: "1.6s" }}>
          <MobileResultCard icon={Zap} value="+85%" label="طاقة ولياقة" tone="success" />
        </div>
      </div>

      {/* progress chart — bottom left */}
      <div className="absolute bottom-[150px] left-1/2 z-10 w-[74%] max-w-[220px] translate-x-[calc(-50%-50px)] opacity-90">
        <ProgressChart compact />
      </div>
    </div>
  );
}

function HeroQuizCTA({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/quiz"
      className={[
        "relative flex h-[52px] w-full items-center overflow-hidden rounded-full cta-gradient px-2 shadow-cta [direction:ltr] animate-cta-premium-pulse",
        className,
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full" aria-hidden>
        <span
          className="absolute inset-y-[-20%] left-0 h-[140%] w-[45%] animate-cta-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent"
        />
      </span>
      <span className="relative z-10 ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white">
        <ArrowLeft className="h-4 w-4 text-primary" strokeWidth={2.5} />
      </span>
      <span className="relative z-10 flex-1 text-center font-[Tajawal] text-[15px] font-extrabold text-white">
        ابدأ تقييمك المجاني
      </span>
      <span className="relative z-10 w-9 shrink-0" aria-hidden />
    </Link>
  );
}

function HeroStickyQuizBar({ visible }: { visible: boolean }) {
  return (
    <div
      id="hero-sticky-quiz-bar"
      className={[
        "fixed inset-x-0 bottom-0 z-50 border-t border-white/70 bg-white/80 backdrop-blur-md px-4 pt-3 shadow-[0_-12px_40px_-10px_rgba(15,23,42,0.16)] pb-[max(1rem,env(safe-area-inset-bottom))] transition-[transform,opacity] duration-500 ease-out lg:hidden",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
      ].join(" ")}
      role="region"
      aria-label="ابدأ تقييمك المجاني"
      aria-hidden={!visible}
    >
      <HeroQuizCTA />
    </div>
  );
}

function MobileHero({ onCtaOutOfView }: { onCtaOutOfView: (outOfView: boolean) => void }) {
  const avatars = [avatar1, avatar2, avatar3, avatar4];
  const ctaAnchorRef = useRef<HTMLDivElement>(null);
  const onCtaOutOfViewRef = useRef(onCtaOutOfView);
  onCtaOutOfViewRef.current = onCtaOutOfView;

  useEffect(() => {
    const el = ctaAnchorRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => onCtaOutOfViewRef.current(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="lg:hidden px-4 pb-8 pt-3">
      {/* 1. Headline */}
      <h1 className="mt-[10px] text-center font-[Tajawal] text-[26px] font-extrabold leading-[1.12] tracking-tight text-foreground">
        أحصل على برنامج تدريبي وغذائي
        <CyclingHeroLine className="mt-[30px]" />
      </h1>

      {/* 3. Subtitle */}
      <p className="mx-auto -mt-[69px] max-w-[310px] text-center font-[Tajawal] text-[13px] font-medium leading-[1.55] text-muted-foreground">
        أجب على مجموعة أسئلة قصيرة، واحصل على خطة تدريب وغذاء مصممة خصيصًا لهدفك.
      </p>

      <div className="mt-2 grid grid-cols-4 gap-2.5">
        {mobileFeatures.map((f, i) => (
          <MobileFeatureCard key={f.label} {...f} index={i} />
        ))}
      </div>

      {/* Coach visual */}
      <div className="mt-2">
        <MobileCoachVisual />
      </div>

      <div ref={ctaAnchorRef} id="hero-inline-quiz-cta">
        <HeroQuizCTA className="relative z-10 mt-[2px]" />
      </div>

      <MobileSocialProof avatars={avatars} />

      <div className="mt-3 px-1 pt-2 pb-2">
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-2 top-3 bottom-0 rounded-2xl bg-[#1A1816]/20 shadow-[inset_0_3px_10px_rgba(15,23,42,0.12)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-1 rounded-2xl bg-[#FF6B00]/20 blur-2xl animate-warning-card-outer-glow"
          />
          <div
            className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#2A2521] via-[#1F1C18] to-[#2E2824] p-3 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_22px_48px_-14px_rgba(255,107,0,0.28),0_16px_40px_-18px_rgba(15,23,42,0.45)] ring-1 ring-white/[0.05] sm:p-4"
          >
            <span
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
              aria-hidden
            >
              <span
                className="absolute inset-y-[-30%] left-0 h-[160%] w-[50%] animate-warning-card-shimmer bg-gradient-to-r from-transparent via-white/14 to-transparent"
              />
            </span>
            <span
              className="pointer-events-none absolute inset-0 rounded-2xl animate-warning-card-inner-glow"
              aria-hidden
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px animate-warning-card-border-pulse bg-gradient-to-r from-transparent via-white/25 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#FF6B00]/[0.12] blur-3xl animate-warning-card-outer-glow"
            />
            <div className="relative z-10">
              <TrustStatistics embedded variant="dark" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopHero() {
  const avatars = [avatar1, avatar2, avatar3, avatar4];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
        <div className="order-1 text-center lg:text-right animate-fade-up">
          <h1 className="mt-5 font-[Tajawal] font-black text-foreground tracking-tight text-[42px] sm:text-5xl lg:text-[68px] leading-[1.1]">
            أحصل على برنامج تدريبي وغذائي
            <br />
            <CyclingHeroLine variant="desktop" />
          </h1>

          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 lg:mr-0 leading-relaxed">
            أجب على مجموعة أسئلة قصيرة، واحصل على خطة تدريب وغذاء مصممة خصيصًا لهدفك.
          </p>

          <div className="mt-7 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-xl mx-auto lg:mx-0 lg:mr-0">
            {features.map((f) => (
              <FeatureCard key={f.label} {...f} />
            ))}
          </div>

          <div className="mt-8">
            <Link
              to="/quiz"
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 cta-gradient text-white font-bold text-lg rounded-full px-6 py-4 shadow-cta transition-all hover:scale-[1.02] hover:brightness-110"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-primary shrink-0 transition-transform group-hover:-translate-x-1">
                <ArrowLeft className="h-5 w-5" />
              </span>
              <span className="flex-1 text-center sm:flex-none">ابدأ تقييمك المجاني</span>
              <span className="hidden sm:block w-9" aria-hidden />
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center lg:justify-start gap-3 flex-wrap">
            <div className="flex -space-x-2 space-x-reverse">
              {avatars.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  width={40}
                  height={40}
                  loading="lazy"
                  className="h-10 w-10 rounded-full border-2 border-background object-cover"
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-success text-success" />
              ))}
            </div>
            <p className="text-sm font-bold text-foreground">
              <span className="text-success">{formatSocialProofClientCount()}</span> عميل حققوا نتائج مذهلة
            </p>
            <BadgeCheck className="h-5 w-5 text-success" />
          </div>
        </div>

        <div className="order-2 hidden lg:block">
          <CoachVisual />
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const [stickyCtaVisible, setStickyCtaVisible] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/3 right-0 lg:right-auto lg:left-0 w-40 h-40 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle, oklch(0.7 0.2 41 / 0.25) 1.2px, transparent 1.5px)",
            backgroundSize: "14px 14px",
          }}
        />

        <MobileHero onCtaOutOfView={setStickyCtaVisible} />
        <div className="hidden lg:block">
          <DesktopHero />
        </div>
      </section>

      <HeroStickyQuizBar visible={stickyCtaVisible} />
    </>
  );
}

function CoachVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] aspect-[4/5]">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[88%] w-[88%] rounded-full bg-beige" />
      </div>

      <img
        src={coachImg}
        alt="مدرب لياقة بدنية"
        width={1024}
        height={1024}
        className="relative z-10 w-full h-full object-contain object-bottom"
      />

      <div className="absolute z-20 top-[8%] right-[-8px] sm:right-[-20px] animate-float">
        <ResultCard icon={TrendingDown} value="-12kg" label="خسارة دهون" tone="success" />
      </div>
      <div
        className="absolute z-20 top-[38%] right-[-12px] sm:right-[-28px] animate-float"
        style={{ animationDelay: "0.8s" }}
      >
        <ResultCard icon={TrendingUp} value="+4.7kg" label="كتلة عضلية" tone="primary" />
      </div>
      <div
        className="absolute z-20 top-[66%] right-[-6px] sm:right-[-16px] animate-float"
        style={{ animationDelay: "1.6s" }}
      >
        <ResultCard icon={Zap} value="+85%" label="طاقة ولياقة" tone="success" />
      </div>

      <div className="absolute z-20 bottom-[-12px] right-[-8px] sm:right-[-16px] w-[78%] max-w-[360px]">
        <ProgressChart />
      </div>
    </div>
  );
}
