import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  Dumbbell,
  LineChart,
  Sparkles,
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

function CyclingHeroLine({ className = "" }: { className?: string }) {
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
        <span className="absolute right-0 top-0 inline-flex translate-x-[50px] -translate-y-[10px] items-center gap-0.5 whitespace-nowrap">
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
    <div className="flex h-[36px] min-w-0 flex-row items-center gap-1 overflow-hidden rounded-lg border border-black/[0.04] bg-white px-1.5 py-0.5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.07)] [direction:ltr]">
      <div
        className="relative h-[22px] w-[22px] shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#FF6B00]/20 via-[#FF6B00]/10 to-[#FF6B00]/5 animate-feature-icon-glow"
        style={{ animationDelay: `${index * 0.35}s` }}
      >
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <span
            className="absolute -inset-y-3 -left-1/2 h-[200%] w-[200%] animate-feature-icon-shine bg-gradient-to-r from-transparent via-white/70 to-transparent"
            style={{ animationDelay: `${index * 0.35 + 0.5}s` }}
          />
        </span>
        <span className="relative z-10 flex h-full w-full items-center justify-center">
          <Icon className="h-3 w-3 text-[#FF6B00]" strokeWidth={2.25} />
        </span>
      </div>
      <span className="min-w-0 flex-1 truncate text-right font-[Tajawal] text-[7px] font-medium leading-none whitespace-nowrap text-foreground">
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
    <div className="flex items-center gap-3 rounded-2xl bg-white shadow-soft border border-white px-4 py-3 min-w-[150px]">
      <span className={`grid h-10 w-10 place-items-center rounded-full ${bg}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="text-right">
        <p className="text-lg font-black text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
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
    <div className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-3 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.1)]">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${bg}`}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0 text-right">
        <p className="font-[Cairo] text-[18px] font-extrabold leading-none text-foreground">{value}</p>
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
        className="absolute inset-x-6 bottom-[150px] z-10 h-[380px] w-auto max-w-none object-contain object-bottom"
      />

      {/* floating result cards — right side */}
      <div className="absolute -right-[50px] top-[6%] z-20 flex flex-col gap-5 -translate-y-[30px]">
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

function MobileHero() {
  const avatars = [avatar1, avatar2, avatar3, avatar4];

  return (
    <div className="lg:hidden px-4 pb-8 pt-3">
      {/* 1. Headline */}
      <h1 className="mt-[10px] text-center font-[Tajawal] text-[26px] font-extrabold leading-[1.12] tracking-tight text-foreground">
        أحصل على برنامج تدريبي وغذائي
        <CyclingHeroLine className="mt-[30px]" />
      </h1>

      {/* 3. Subtitle */}
      <p className="mx-auto -mt-[49px] max-w-[310px] text-center font-[Tajawal] text-[13px] font-medium leading-[1.55] text-muted-foreground">
        أجب على مجموعة أسئلة قصيرة، واحصل على خطة تدريب وغذاء مصممة خصيصًا لهدفك.
      </p>

      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {mobileFeatures.map((f, i) => (
          <MobileFeatureCard key={f.label} {...f} index={i} />
        ))}
      </div>

      {/* Coach visual */}
      <div className="mt-2">
        <MobileCoachVisual />
      </div>

      <Link
        to="/quiz"
        className="relative z-10 mt-[2px] flex h-[52px] w-full items-center rounded-full cta-gradient px-2 shadow-cta [direction:ltr]"
      >
        <span className="ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white">
          <ArrowLeft className="h-4 w-4 text-primary" strokeWidth={2.5} />
        </span>
        <span className="flex-1 text-center font-[Cairo] text-[15px] font-extrabold text-white">
          ابدأ تقييمك المجاني
        </span>
        <span className="w-9 shrink-0" aria-hidden />
      </Link>

      <MobileSocialProof avatars={avatars} />

      <div className="-mx-4 mt-3 bg-[#FAF8F5] px-4 pt-4 pb-5">
        <TrustStatistics embedded />
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
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-bold text-primary">
            <Sparkles className="h-4 w-4" />
            برنامج مخصص 100% لك
          </div>

          <h1 className="mt-5 font-[Tajawal] font-black text-foreground tracking-tight text-[42px] sm:text-5xl lg:text-[68px] leading-[1.1]">
            أحصل على برنامج تدريبي وغذائي
            <br />
            <CyclingHeroLine />
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
  return (
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

      <MobileHero />
      <div className="hidden lg:block">
        <DesktopHero />
      </div>
    </section>
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

      <div className="absolute z-20 top-[8%] left-[-8px] sm:left-[-20px] animate-float">
        <ResultCard icon={TrendingDown} value="-12kg" label="خسارة دهون" tone="success" />
      </div>
      <div
        className="absolute z-20 top-[38%] left-[-12px] sm:left-[-28px] animate-float"
        style={{ animationDelay: "0.8s" }}
      >
        <ResultCard icon={TrendingUp} value="+4.7kg" label="كتلة عضلية" tone="primary" />
      </div>
      <div
        className="absolute z-20 top-[66%] left-[-6px] sm:left-[-16px] animate-float"
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
