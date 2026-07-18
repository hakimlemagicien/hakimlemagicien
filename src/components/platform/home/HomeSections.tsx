import { Link } from "@tanstack/react-router";
import {
  Award,
  Bell,
  Check,
  ChevronLeft,
  ClipboardList,
  Crown,
  Dumbbell,
  Droplets,
  Flame,
  Lock,
  MessageSquare,
  Play,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  PlatformScrollRow,
  PlatformSection,
} from "@/components/platform/layout/PlatformLayout";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { useWaterOptional } from "@/components/platform/water/WaterContext";
import { ACTIVATE_PROGRAM_CTA } from "@/lib/pricing-presentation";
import { SOCIAL_PROOF_CLIENT_COUNT } from "@/lib/social-proof";
import type { MembershipTier } from "@/lib/platform/membership";
import { getMembershipTierLabel } from "@/lib/platform/membership";
import {
  HAKIM_POINTS_LABEL,
  formatHakimPoints,
  resolveStreakMotivation,
} from "@/lib/platform/daily-motivation";
import type {
  DailySnapshotItem,
  DailyTask,
  DiscoverPreviewItem,
  FeaturedContentItem,
  HealthScore,
  HeroState,
  LastAchievementState,
  MessageOfDay,
  QuickGlanceItem,
  StreakWeekDay,
  TodaysMissionState,
} from "@/lib/platform/home-hub";
import { HOME_GREETING_SUBTEXT } from "@/lib/platform/seed-content";
import bodyMuscular from "@/assets/body-muscular.jpg";
import feminineToned from "@/assets/feminine-toned-body.png";
import gymBg from "@/assets/quiz-gym-bg.jpg";
import homePremiumTreasure from "@/assets/home-premium-treasure.webp";
import avatar1 from "@/assets/avatar1.jpg";
import avatar2 from "@/assets/avatar2.jpg";
import avatar3 from "@/assets/avatar3.jpg";
import avatar4 from "@/assets/avatar4.jpg";
import { cn } from "@/lib/utils";
import type { HeroGoalImage } from "@/lib/platform/hero-goal-images";

const FEATURED_IMAGES = {
  recipe: gymBg,
  workout: bodyMuscular,
  flexibility: feminineToned,
  tip: feminineToned,
  challenge: bodyMuscular,
} as const;

const SNAPSHOT_ICONS = {
  workout: Dumbbell,
  nutrition: UtensilsCrossed,
  water: Droplets,
  progress: TrendingUp,
} as const;

const GLANCE_ICONS = {
  target: Target,
  calendar: ClipboardList,
  trend: TrendingDown,
  scale: Scale,
  flame: Flame,
  health: Award,
} as const;

function useCountUp(value: number, duration = 600) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(value * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return display;
}

function AnimatedProgressBar({
  value,
  color = "#FF6B00",
  className,
}: {
  value: number;
  color?: string;
  className?: string;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(Math.min(Math.max(value, 0), 100)));
    return () => cancelAnimationFrame(id);
  }, [value]);

  return (
    <div className={cn("platform-home-progress", className)} aria-hidden>
      <div
        className="platform-home-progress__fill"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function HomeSectionError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="platform-home-error" role="alert">
      <p className="platform-home-error__text">{message}</p>
      {onRetry ? (
        <button type="button" className="platform-home-error__retry" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          إعادة المحاولة
        </button>
      ) : null}
    </div>
  );
}

function StreakRing({
  streak,
  size = "md",
  theme = "dark",
}: {
  streak: number;
  size?: "md" | "lg";
  theme?: "dark" | "light";
}) {
  const progress = Math.min(streak / 14, 1);
  const circumference = 2 * Math.PI * 22;
  const offset = circumference * (1 - progress * 0.75);
  const dim = size === "lg" ? "h-[72px] w-[72px]" : "h-14 w-14";
  const iconSize = size === "lg" ? "h-7 w-7" : "h-6 w-6";
  const track = theme === "dark" ? "rgba(255,255,255,0.25)" : "rgba(255,107,0,0.2)";
  const stroke = theme === "dark" ? "white" : "#FF6B00";
  const iconClass = theme === "dark" ? "text-white" : "text-primary";

  return (
    <div className={cn("relative grid shrink-0 place-items-center", dim)}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r="22" fill="none" stroke={track} strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r="22"
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="platform-home-progress-ring"
        />
      </svg>
      <Flame className={cn("relative", iconClass, iconSize)} />
    </div>
  );
}

/* ── Header (logo center · avatar · notifications) ─────────────────────── */

export function HomeHeader({
  avatarUrl,
  name,
  tier,
}: {
  avatarUrl: string | null;
  name: string;
  tier: MembershipTier;
}) {
  const tierLabel = getMembershipTierLabel(tier);
  const showCrown = tier === "premium" || tier === "vip" || tier === "admin";
  const frameTier = tier === "visitor" ? "free" : tier;

  return (
    <header className="platform-home-header-v2 platform-home-enter">
      <Link to="/app/profile" className="platform-home-header-v2__avatar-link platform-touch" aria-label="الملف الشخصي">
        <div className={cn("platform-home-header-v2__avatar-col", `is-tier-${frameTier}`)}>
          <div className={cn("platform-home-header-v2__avatar-frame", `is-tier-${frameTier}`)}>
            <div className="platform-home-header-v2__avatar">
            {avatarUrl ? (
              <OptimizedImage
                src={avatarUrl}
                alt={`صورة ${name}`}
                className="h-full w-full"
                objectFit="cover"
                priority
              />
            ) : (
                <span className="platform-home-header__avatar-fallback" aria-label="لا توجد صورة شخصية">
                  <User aria-hidden className="h-5 w-5" />
                </span>
              )}
            </div>
            {tier === "vip" ? <span className="platform-home-header-v2__vip-gem" aria-hidden /> : null}
          </div>
          <span className={cn("platform-home-header__tier-badge", `is-tier-${frameTier}`)}>
            {showCrown ? <Crown aria-hidden /> : null}
            {tierLabel}
          </span>
        </div>
      </Link>

      <div className="platform-home-header-v2__logo" aria-label="Hakim Coaching">
        <span className="platform-home-header-v2__logo-mark">H</span>
        <span className="platform-home-header-v2__logo-text">HAKIM COACHING</span>
      </div>

      <div className="platform-home-header-v2__actions">
        <Link to="/app/support" className="platform-home-header-v2__action platform-touch" aria-label="الرسائل">
          <MessageSquare strokeWidth={1.75} className="h-6 w-6" />
        </Link>
        <button type="button" className="platform-home-header-v2__action platform-touch" aria-label="الإشعارات">
          <Bell strokeWidth={1.75} className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}

/* ── Hero Card ─────────────────────────────────────────────────────────── */

function HeroGoalFigure({ image }: { image: HeroGoalImage }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="platform-home-hero__figure">
      <img
        src={image.src}
        alt={image.alt}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn("platform-home-hero__coach", loaded ? "is-loaded" : null)}
      />
    </div>
  );
}

export function HomeHeroCard({ hero }: { hero: HeroState }) {
  const progress = useCountUp(hero.overallProgress);
  const streak = useCountUp(hero.streak);
  const points = useCountUp(hero.hakimPoints, 700);

  return (
    <section className="platform-home-hero platform-home-enter platform-home-enter--d1" aria-label="بطاقة الترحيب">
      <div className="platform-home-hero__top">
        <div className="platform-home-hero__content">
          <p className="platform-home-hero__greeting">{hero.greeting}</p>
          <p className="platform-home-hero__subtext">{hero.subtext}</p>

          <div className="platform-home-hero__goal-card">
            <span className="platform-home-hero__goal-icon">
              <Target className="h-4 w-4 text-white" aria-hidden />
            </span>
            <div className="platform-home-hero__goal-copy">
              <span className="platform-home-hero__goal-label">هدفك الحالي</span>
              <span className="platform-home-hero__goal-value">{hero.goalTitle}</span>
            </div>
          </div>

          <div className="platform-home-hero__progress-card">
            <div className="platform-home-hero__progress-labels">
              <span>التقدم الكلي</span>
              <span className="platform-home-hero__progress-value tabular-nums">{progress}%</span>
            </div>
            <AnimatedProgressBar
              value={hero.overallProgress}
              color="#FF6B00"
              className="platform-home-hero__progress-bar"
            />
          </div>

          <p className="platform-home-hero__motivation">{hero.motivation}</p>
        </div>

        <div className="platform-home-hero__visual" aria-hidden>
          <HeroGoalFigure image={hero.heroImage} />
        </div>
      </div>

      <div className="platform-home-hero__panel">
        <div className="platform-home-hero__stats" aria-label="ملخص سريع">
          <div className="platform-home-hero__stat">
            <span className="platform-home-hero__stat-icon is-goal">
              <Target className="h-4 w-4" aria-hidden />
            </span>
            <span className="platform-home-hero__stat-label">الهدف الحالي</span>
            <span className="platform-home-hero__stat-value is-text">{hero.goalTitle}</span>
          </div>

          <div className="platform-home-hero__stat">
            <span className="platform-home-hero__stat-icon is-progress">
              <TrendingUp className="h-4 w-4" aria-hidden />
            </span>
            <span className="platform-home-hero__stat-label">نسبة التقدم</span>
            <span className="platform-home-hero__stat-value tabular-nums">{progress}%</span>
            <span className="platform-home-hero__stat-sub">من هدفك</span>
          </div>

          <div className="platform-home-hero__stat">
            <span className="platform-home-hero__stat-icon is-streak">
              <Flame className="h-4 w-4" aria-hidden />
            </span>
            <span className="platform-home-hero__stat-label">سلسلة الإنجاز</span>
            <span className="platform-home-hero__stat-value tabular-nums">{streak}</span>
            <span className="platform-home-hero__stat-sub">يوماً متتالية</span>
          </div>

          <div className="platform-home-hero__stat">
            <span className="platform-home-hero__stat-icon is-points">
              <Trophy className="h-4 w-4" aria-hidden />
            </span>
            <span className="platform-home-hero__stat-label">نقاط حكيم</span>
            <span className="platform-home-hero__stat-value tabular-nums">{formatHakimPoints(points)}</span>
            <span className="platform-home-hero__stat-sub">نقطة</span>
          </div>
        </div>

        <Link to="/app/program" className="platform-home-hero__cta platform-touch">
          <Play className="h-4 w-4 fill-current" aria-hidden />
          ابدأ يومك
        </Link>
      </div>
    </section>
  );
}

/* ── Daily Snapshot ────────────────────────────────────────────────────── */

function SnapshotCard({ item }: { item: DailySnapshotItem }) {
  const Icon = SNAPSHOT_ICONS[item.icon];
  const water = useWaterOptional();

  const inner = (
    <>
      <span className={cn("platform-home-snapshot-card__icon", item.iconBg)}>
        <Icon className={cn("h-[18px] w-[18px]", item.iconColor)} aria-hidden />
      </span>
      <p className="platform-home-snapshot-card__title">{item.title}</p>
      <p className="platform-home-snapshot-card__value" style={{ color: item.valueColor }}>
        {item.value}
      </p>
      {item.showProgressBar ? (
        <div className="platform-home-snapshot-card__meter">
          <span className="platform-home-snapshot-card__pct" style={{ color: item.progressColor }}>
            {item.progress}%
          </span>
          <AnimatedProgressBar
            value={item.progress}
            color={item.progressColor}
            className="platform-home-snapshot-card__bar"
          />
        </div>
      ) : (
        <p className="platform-home-snapshot-card__footer">{item.subtitle}</p>
      )}
    </>
  );

  if (item.action === "open-water-sheet" && water) {
    return (
      <button
        type="button"
        onClick={() => water.openWaterSheet()}
        className="platform-home-snapshot-card platform-home-snapshot-card--bounce platform-touch"
        aria-label={`${item.title}: ${item.value}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      to={item.href ?? "/app"}
      className="platform-home-snapshot-card platform-home-snapshot-card--bounce platform-touch"
      aria-label={`${item.title}: ${item.value}`}
    >
      {inner}
    </Link>
  );
}

export function HomeDailySnapshot({ items }: { items: DailySnapshotItem[] }) {
  return (
    <section className="platform-home-enter platform-home-enter--d2" aria-labelledby="home-snapshot-title">
      <div className="platform-home-section-head">
        <h2 id="home-snapshot-title" className="platform-home-section-head__title">
          ملخص يومك
        </h2>
        <Link to="/app" className="platform-home-section-head__action">
          عرض الكل
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <div className="platform-home-snapshot-grid">
        {items.map((item) => (
          <SnapshotCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

/* ── Today's Mission ───────────────────────────────────────────────────── */

export function HomeTodaysMission({ mission }: { mission: TodaysMissionState }) {
  const showPrimaryCta = !mission.isEmpty && !mission.isRestDay;

  return (
    <section
      className="platform-home-mission platform-home-enter platform-home-enter--d4"
      aria-labelledby="home-mission-title"
    >
      <div className="platform-home-mission__ring">
        <StreakRing streak={mission.isRestDay ? 0 : 1} size="lg" theme="light" />
      </div>
      <div className="platform-home-mission__body">
        <h2 id="home-mission-title" className="platform-home-mission__title">
          {mission.title}
        </h2>
        <p className="platform-home-mission__desc">{mission.description}</p>
        {mission.pointsReward > 0 ? (
          <p className="platform-home-mission__points">
            <Star className="h-3.5 w-3.5 fill-[#FCD34D] text-[#FCD34D]" aria-hidden />
            ستحصل على {mission.pointsReward} نقطة
          </p>
        ) : null}
        {showPrimaryCta ? (
          <Link to={mission.href} className="platform-home-mission__cta platform-touch">
            ابدأ التمرين الآن
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Link>
        ) : mission.isRestDay ? (
          <p className="platform-home-mission__rest">استمتع بيوم الراحة — عُد أقوى غداً.</p>
        ) : (
          <p className="platform-home-mission__rest">لا توجد مهمة اليوم — أحسنت!</p>
        )}
      </div>
    </section>
  );
}

/* ── Streak + Achievement row ──────────────────────────────────────────── */

function StreakProgressRing({ streak }: { streak: number }) {
  const size = 92;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(streak / 30, 1);
  const dash = circumference * progress;

  return (
    <div className="platform-home-streak__ring" aria-hidden>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(249, 115, 22, 0.16)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f97316"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    </div>
  );
}

export function HomeStreakCard({ streak, week }: { streak: number; week: StreakWeekDay[] }) {
  const count = useCountUp(streak);
  const motivation = resolveStreakMotivation(streak);

  return (
    <article className="platform-home-streak" aria-labelledby="home-streak-title">
      <div className="platform-home-streak__head">
        <h3 id="home-streak-title" className="platform-home-streak__title">
          سلسلة الإنجاز
        </h3>
        <Flame className="platform-home-streak__head-icon" aria-hidden />
      </div>

      <div className="platform-home-streak__body">
        <div className="platform-home-streak__gauge">
          <StreakProgressRing streak={streak} />
          <div className="platform-home-streak__gauge-center">
            <span className="platform-home-streak__count tabular-nums">{count}</span>
            <span className="platform-home-streak__label">يوماً متتالياً</span>
          </div>
        </div>

        <div className="platform-home-streak__week" aria-label="أيام الأسبوع">
          {week.map((day) => (
            <div key={day.key} className="platform-home-streak__day-col">
              <span
                className={cn(
                  "platform-home-streak__day",
                  day.state === "today" && "is-today",
                  day.state === "done" && "is-done",
                )}
                aria-label={day.label}
              >
                {day.state === "today" || day.state === "done" ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                ) : null}
              </span>
              <span className="platform-home-streak__day-label">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="platform-home-streak__motivation">
        <Flame className="platform-home-streak__motivation-icon" aria-hidden />
        {streak > 0 ? "لا تكسر السلسلة! أنت مميز" : motivation.message}
      </p>
    </article>
  );
}

export function HomeLatestAchievement({ achievement }: { achievement: LastAchievementState }) {
  return (
    <article
      className="platform-home-achievement"
      aria-labelledby="home-achievement-title"
    >
      <h3 id="home-achievement-title" className="platform-home-card-title">
        آخر إنجاز
      </h3>
      <div className="platform-home-achievement__center">
        {achievement.hasAchievement ? (
          <ShieldCheck className="h-9 w-9 text-success" aria-hidden />
        ) : (
          <Sparkles className="h-9 w-9 text-primary" aria-hidden />
        )}
        <p className="platform-home-achievement__title">{achievement.title}</p>
        <p className="platform-home-achievement__subtitle">{achievement.subtitle}</p>
      </div>
      <Link to="/app/achievements" className="platform-home-achievement__link">
        عرض التفاصيل
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </article>
  );
}

export function HomeStreakAchievementRow({
  streak,
  week,
  achievement,
}: {
  streak: number;
  week: StreakWeekDay[];
  achievement: LastAchievementState;
}) {
  return (
    <div className="platform-home-duo platform-home-enter platform-home-enter--d5">
      <HomeStreakCard streak={streak} week={week} />
      <HomeLatestAchievement achievement={achievement} />
    </div>
  );
}

/* ── Discover ──────────────────────────────────────────────────────────── */

function DiscoverPreviewCard({ item }: { item: DiscoverPreviewItem }) {
  const imageSrc = FEATURED_IMAGES[item.image];

  return (
    <Link
      to={item.href}
      className="platform-home-discover-card platform-touch"
      aria-label={`${item.title} — ${item.description}`}
    >
      <div className="platform-home-discover-card__media">
        <OptimizedImage src={imageSrc} alt="" className="h-full w-full" objectFit="cover" />
        <span className="platform-home-discover-card__shade" aria-hidden />
        {item.badge ? (
          <span className="platform-home-discover-card__badge">{item.badge}</span>
        ) : null}
        {item.showPlay ? (
          <span className="platform-home-discover-card__play" aria-hidden>
            <Play className="h-4 w-4 fill-current" />
          </span>
        ) : null}
        {item.showSparkle ? (
          <span className="platform-home-discover-card__sparkle" aria-hidden>
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
          </span>
        ) : null}
      </div>
      <div className="platform-home-discover-card__body">
        <p className="platform-home-discover-card__title">{item.title}</p>
        <p className="platform-home-discover-card__desc">{item.description}</p>
      </div>
    </Link>
  );
}

function chunkDiscoverPages(items: DiscoverPreviewItem[]): DiscoverPreviewItem[][] {
  const pages: DiscoverPreviewItem[][] = [];
  for (let index = 0; index < items.length; index += 3) {
    pages.push(items.slice(index, index + 3));
  }
  return pages;
}

export function HomeDiscover({ items }: { items: DiscoverPreviewItem[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pageIndexRef = useRef(0);
  const isSectionVisibleRef = useRef(false);
  const pages = chunkDiscoverPages(items);
  const usePages = pages.length > 1;
  const [pageIndex, setPageIndex] = useState(0);

  const scrollToPage = useCallback((index: number) => {
    const root = scrollRef.current;
    const page = pageRefs.current[index];
    if (!root || !page) return;

    const nextScrollLeft =
      root.scrollLeft + (page.getBoundingClientRect().left - root.getBoundingClientRect().left);

    root.scrollTo({
      left: nextScrollLeft,
      behavior: "smooth",
    });
    pageIndexRef.current = index;
    setPageIndex(index);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !usePages) return;

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isSectionVisibleRef.current = entry.isIntersecting && entry.intersectionRatio >= 0.2;
      },
      { threshold: [0, 0.2, 0.35, 0.5] },
    );

    visibilityObserver.observe(section);
    return () => visibilityObserver.disconnect();
  }, [usePages]);

  useEffect(() => {
    if (!usePages) return;

    const timer = window.setInterval(() => {
      if (!isSectionVisibleRef.current) return;
      const next = (pageIndexRef.current + 1) % pages.length;
      scrollToPage(next);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [usePages, pages.length, scrollToPage]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !usePages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!(best?.target instanceof HTMLElement)) return;
        const index = Number(best.target.dataset.pageIndex);
        if (Number.isNaN(index)) return;
        pageIndexRef.current = index;
        setPageIndex(index);
      },
      { root, threshold: 0.55 },
    );

    pageRefs.current.forEach((page) => {
      if (page) observer.observe(page);
    });

    return () => observer.disconnect();
  }, [usePages, pages.length]);

  if (items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="platform-home-enter platform-home-enter--d3"
      aria-labelledby="home-discover-title"
    >
      <div className="platform-home-section-head">
        <h2 id="home-discover-title" className="platform-home-section-head__title">
          اكتشف جديداً
        </h2>
        <Link to="/app/discover" className="platform-home-section-head__action">
          عرض الكل
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div
        ref={scrollRef}
        className={cn(
          "platform-home-discover-grid",
          usePages && "platform-home-discover-grid--scroll",
        )}
        data-count={items.length}
      >
        {usePages ? (
          pages.map((page, index) => (
            <div
              key={`discover-page-${index}`}
              ref={(node) => {
                pageRefs.current[index] = node;
              }}
              className="platform-home-discover-page"
              data-page-index={index}
            >
              {page.map((item) => (
                <DiscoverPreviewCard key={item.id} item={item} />
              ))}
            </div>
          ))
        ) : (
          items.map((item) => <DiscoverPreviewCard key={item.id} item={item} />)
        )}
      </div>

      {usePages ? (
        <div className="platform-home-discover-dots" role="tablist" aria-label="صفحات الاكتشاف">
          {pages.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === pageIndex}
              aria-label={`صفحة ${index + 1}`}
              className={cn(index === pageIndex && "is-active")}
              onClick={() => scrollToPage(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

/* ── Personal program promo (Free only) ────────────────────────────────── */

const PERSONAL_PROGRAM_AVATARS = [avatar1, avatar2, avatar3, avatar4] as const;

const PERSONAL_PROGRAM_BENEFITS = [
  {
    title: "برنامج مخصص",
    desc: "وفق هدفك ومستواك",
    icon: Target,
    tone: "is-orange",
  },
  {
    title: "خطة تغذية",
    desc: "مناسبة لاحتياجاتك",
    icon: UtensilsCrossed,
    tone: "is-green",
  },
  {
    title: "تتبع التقدم",
    desc: "بالقياسات والرسوم",
    icon: TrendingUp,
    tone: "is-purple",
  },
  {
    title: "دعم الكوتش",
    desc: "إرشاد ومتابعة مستمرة",
    icon: MessageSquare,
    tone: "is-blue",
  },
] as const;

export function HomePersonalProgramCard() {
  const { openUpgrade } = useUpgradeFlow();
  const clientCount = SOCIAL_PROOF_CLIENT_COUNT.toLocaleString("en-US");

  return (
    <section
      className="platform-home-program platform-home-enter platform-home-enter--d4"
      aria-labelledby="home-program-title"
    >
      <article className="platform-home-program__card">
        <span className="platform-home-program__badge">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          مميز للمشتركين فقط
        </span>

        <h2 id="home-program-title" className="platform-home-program__title">
          افتح برنامجك <span className="platform-home-program__accent">الشخصي</span>
        </h2>
        <p className="platform-home-program__lead">
          احصل على برنامج تدريبي وتغذية مخصصة لك بناءً على أهدافك واحتياجاتك.
        </p>

        <div className="platform-home-program__hero">
          <span className="platform-home-program__hero-glow" aria-hidden />
          <OptimizedImage
            src={homePremiumTreasure}
            alt="صندوق البرنامج الشخصي — تدريب، تغذية، تقدم، ودعم الكوتش"
            className="platform-home-program__hero-img"
            width={1024}
            height={683}
            objectFit="contain"
            priority
          />
        </div>

        <div className="platform-home-program__benefits-head">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          <span>ماذا ستحصل عليه؟</span>
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
        </div>

        <div className="platform-home-program__benefits">
          {PERSONAL_PROGRAM_BENEFITS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="platform-home-program__benefit">
                <span className={cn("platform-home-program__benefit-icon", item.tone)}>
                  <Icon className="h-5 w-5" strokeWidth={2.1} aria-hidden />
                </span>
                <p className="platform-home-program__benefit-title">{item.title}</p>
                <p className="platform-home-program__benefit-desc">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="platform-home-program__social">
          <div className="platform-home-program__avatars" aria-hidden>
            {PERSONAL_PROGRAM_AVATARS.map((src, index) => (
              <img
                key={index}
                src={src}
                alt=""
                className="platform-home-program__avatar"
                style={{ zIndex: 4 - index }}
              />
            ))}
          </div>
          <p className="platform-home-program__social-text">
            أكثر من <strong>{clientCount}</strong> عضو حققوا نتائج مذهلة! ابدأ رحلتك الآن وكن
            أنت التالي.
          </p>
          <span className="platform-home-program__shield" aria-hidden>
            <ShieldCheck className="h-5 w-5" />
            <Star className="platform-home-program__shield-star h-2.5 w-2.5" />
          </span>
        </div>

        <button
          type="button"
          className="platform-home-program__cta platform-touch"
          onClick={() =>
            openUpgrade(
              "افتح برنامجك الشخصي: تدريب، تغذية، تتبع تقدم، ودعم الكوتش داخل المنصة.",
            )
          }
        >
          <Lock className="h-4 w-4" aria-hidden />
          ترقية الآن وفتح كل المميزات
        </button>

        <button
          type="button"
          className="platform-home-program__more"
          onClick={() => openUpgrade("اعرف المزيد عن باقات Hakim Coaching.")}
        >
          اعرف المزيد عن الباقات
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
      </article>
    </section>
  );
}

/** @deprecated use HomePersonalProgramCard */
export function HomeUpgradeCard() {
  return <HomePersonalProgramCard />;
}

export function HomeOfflineBanner() {
  return (
    <div className="platform-home-offline" role="status">
      أنت تعمل بدون اتصال
    </div>
  );
}

/* ── Legacy exports (other routes / backwards compat) ──────────────────── */

function WaterProgress({ current, total }: { current: number; total: number }) {
  const pct = current / total;
  const circumference = 2 * Math.PI * 14;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative grid h-10 w-10 shrink-0 place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36" aria-hidden>
        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--border)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke="#2563EB"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="text-xs font-bold text-foreground">
        {current}/{total}
      </span>
    </div>
  );
}

function TaskStatus({ task }: { task: DailyTask }) {
  if (task.status === "done") {
    return (
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary-soft">
        <Check className="h-4 w-4 text-success" strokeWidth={3} />
      </span>
    );
  }
  if (task.status === "progress" && task.progress) {
    return <WaterProgress current={task.progress.current} total={task.progress.total} />;
  }
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft">
      <ChevronLeft className="h-4 w-4 text-primary" />
    </span>
  );
}

function DailyTaskCard({ task, locked }: { task: DailyTask; locked: boolean }) {
  const Icon =
    task.icon === "workout"
      ? Dumbbell
      : task.icon === "nutrition"
        ? UtensilsCrossed
        : task.icon === "water"
          ? Droplets
          : Scale;
  const { openUpgrade } = useUpgradeFlow();
  const water = useWaterOptional();

  const content = (
    <>
      <span className={cn("relative grid h-10 w-10 shrink-0 place-items-center rounded-xl", task.iconBg)}>
        <Icon className={cn("h-5 w-5", task.iconColor)} />
        {locked ? (
          <span className="absolute -bottom-0.5 -left-0.5 grid h-4 w-4 place-items-center rounded-full bg-[#0F172A] text-white">
            <Lock className="h-2.5 w-2.5" strokeWidth={2.6} />
          </span>
        ) : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-foreground">{task.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {locked ? "حسب باقتك — فعّل برنامجك للفتح" : task.subtitle}
        </p>
      </div>
      <TaskStatus task={task} />
    </>
  );

  if (locked) {
    return (
      <button
        type="button"
        onClick={() =>
          openUpgrade(`مهمة «${task.title}» حسب باقتك. فعّل برنامجك للوصول إليها.`)
        }
        className="flex w-full items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5 text-right opacity-85 transition active:bg-muted"
      >
        {content}
      </button>
    );
  }

  if (task.id === "water" && water) {
    return (
      <button
        type="button"
        onClick={() => water.openWaterSheet()}
        className="flex w-full items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5 text-right transition active:bg-muted"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={task.href}
      className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5 transition active:bg-muted"
    >
      {content}
    </Link>
  );
}

function QuickGlanceCard({ item }: { item: QuickGlanceItem }) {
  const Icon = GLANCE_ICONS[item.icon];

  return (
    <article className="flex min-w-0 flex-1 flex-col items-center px-1 text-center">
      <span className={cn("mb-2 grid h-10 w-10 place-items-center rounded-xl", item.iconBg)}>
        <Icon className={cn("h-4 w-4", item.iconColor)} />
      </span>
      <p className="text-sm font-black leading-tight text-foreground">{item.value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
    </article>
  );
}

function FeaturedCard({ item }: { item: FeaturedContentItem }) {
  const imageSrc = FEATURED_IMAGES[item.image];

  return (
    <Link
      to={item.href}
      className="relative flex h-[124px] w-[112px] flex-col justify-end overflow-hidden rounded-[16px] shadow-card sm:h-[128px] sm:w-[116px]"
    >
      <OptimizedImage
        src={imageSrc}
        alt=""
        className="absolute inset-0 h-full w-full"
        objectFit="cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      {item.badge ? (
        <span className="absolute start-2 top-2 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
          {item.badge}
        </span>
      ) : null}
      {item.showPlay ? (
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-black/35 text-white ring-1 ring-white/50 backdrop-blur-[2px]">
            <Play className="h-3.5 w-3.5 fill-current" />
          </span>
        </span>
      ) : null}
      <div className="relative z-[1] p-2.5 text-right text-white">
        <p className="text-[13px] font-black leading-tight">{item.title}</p>
        <p className="mt-0.5 text-[11px] font-medium leading-tight text-white/85">{item.subtitle}</p>
      </div>
    </Link>
  );
}

export function MessageOfDayCard({ message }: { message: MessageOfDay }) {
  return (
    <section className="platform-card relative overflow-hidden p-4 text-right">
      <span
        aria-hidden
        className="pointer-events-none absolute -left-6 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
      />
      <div className="relative flex items-start gap-3">
        <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-muted-foreground">رسالة اليوم</p>
          <p className="mt-1 text-[15px] font-black leading-snug text-foreground">
            {message.greeting}
          </p>
          <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-muted-foreground">
            {message.body}
          </p>
        </div>
      </div>
    </section>
  );
}

export function DailyMotivationCard({
  streak,
  hakimPoints,
  nextMission,
}: {
  streak: number;
  hakimPoints: number;
  nextMission: {
    title: string;
    pointsReward: number;
    href: string;
  };
}) {
  const streakCopy = resolveStreakMotivation(streak);

  return (
    <Link
      to="/app/achievements"
      className="-mt-[10px] block shrink-0 overflow-hidden rounded-2xl cta-gradient p-4 text-white shadow-cta transition hover:opacity-95 active:scale-[0.99]"
      aria-label="بطاقة التحفيز اليومية — افتح الإنجازات"
    >
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <StreakRing streak={streak} />
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-white/75">سلسلة الإنجاز</p>
            <p className="mt-0.5 text-[15px] font-black leading-tight">{streakCopy.title}</p>
            <p className="mt-1 text-[11px] leading-snug text-white/85">{streakCopy.message}</p>
          </div>
        </div>

        <div className="h-14 w-px shrink-0 self-center bg-white/25" />

        <div className="min-w-[5.5rem] shrink-0 text-left" dir="ltr">
          <p className="text-[10px] font-bold text-white/75">{HAKIM_POINTS_LABEL}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xl font-black leading-tight">
            <Star className="h-3.5 w-3.5 fill-[#FCD34D] text-[#FCD34D]" />
            {formatHakimPoints(hakimPoints)}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-white/12 px-3 py-2.5 ring-1 ring-white/15 backdrop-blur-[2px]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold tracking-wide text-white/70">المهمة التالية</p>
          {nextMission.pointsReward > 0 ? (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-extrabold text-[#FCD34D]">
              +{nextMission.pointsReward}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[12px] font-bold leading-snug text-white">{nextMission.title}</p>
        <span data-motivation-extensible className="sr-only" aria-hidden />
      </div>
    </Link>
  );
}

export function DailyTasksSection({
  tasks,
  isTaskLocked,
}: {
  tasks: DailyTask[];
  isTaskLocked: (task: DailyTask) => boolean;
}) {
  return (
    <PlatformSection title="مهامك اليوم" icon={ClipboardList} variant="card">
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <DailyTaskCard key={task.id} task={task} locked={isTaskLocked(task)} />
        ))}
      </div>
    </PlatformSection>
  );
}

export function QuickGlanceSection({
  items,
  healthScore,
}: {
  items: QuickGlanceItem[];
  healthScore?: HealthScore;
}) {
  return (
    <PlatformSection title="نظرة سريعة" icon={Award} iconClassName="text-success" variant="card">
      {healthScore ? (
        <div className="mb-1 flex items-center justify-between rounded-xl bg-muted/60 px-3.5 py-3">
          <div className="text-right">
            <p className="text-[11px] font-bold text-muted-foreground">Health Score</p>
            <p className="mt-0.5 text-sm font-black text-foreground">{healthScore.label}</p>
          </div>
          <p className="text-2xl font-black tabular-nums text-success">{healthScore.score}%</p>
        </div>
      ) : null}
      <div className="flex items-stretch divide-x divide-border/50">
        {items.map((item) => (
          <QuickGlanceCard key={item.id} item={item} />
        ))}
      </div>
    </PlatformSection>
  );
}

export function FeaturedContentSection({ items }: { items: FeaturedContentItem[] }) {
  return (
    <PlatformSection
      className="gap-3"
      title="محتوى يناسب هدفك"
      action={
        <Link to="/app/discover" className="text-xs font-bold text-success">
          عرض الكل
        </Link>
      }
    >
      <PlatformScrollRow className="gap-2.5">
        {items.map((item) => (
          <FeaturedCard key={item.id} item={item} />
        ))}
      </PlatformScrollRow>
    </PlatformSection>
  );
}

export function UpgradeBanner() {
  const { openUpgrade } = useUpgradeFlow();

  return (
    <button
      type="button"
      onClick={() =>
        openUpgrade("فعّل برنامجك الشخصي: تدريب، تغذية، ومتابعة يومية داخل المنصة.")
      }
      className="flex w-full shrink-0 items-center gap-3 rounded-2xl cta-gradient p-4 text-right text-white shadow-cta transition hover:opacity-95"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15">
        <Star className="h-5 w-5 fill-amber-200 text-amber-200" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-black">{ACTIVATE_PROGRAM_CTA}</p>
        <p className="mt-1 text-xs text-white/85">برنامجك الشخصي يبدأ من هنا</p>
      </div>
      <ChevronLeft className="h-5 w-5 shrink-0 opacity-90" />
    </button>
  );
}

/** @deprecated use HomeHeader */
export function HomeGreeting({ name }: { name: string }) {
  return <HomeHeader name={name} avatarUrl={null} tier="free" />;
}

/** @deprecated use DailyMotivationCard */
export function SummaryCard({ streak, points }: { streak: number; points: number }) {
  return (
    <DailyMotivationCard
      streak={streak}
      hakimPoints={points}
      nextMission={{ title: "أكمل مهمة اليوم", pointsReward: 10, href: "/app" }}
    />
  );
}

/** @deprecated use SummaryCard */
export function StreakWidget({ count, points }: { count: number; points?: number }) {
  return <SummaryCard streak={count} points={points ?? 230} />;
}

/** @deprecated removed from home layout */
export function DailyFeed() {
  return null;
}
