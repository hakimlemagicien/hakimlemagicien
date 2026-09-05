import { Link } from "@tanstack/react-router";
import {
  Award,
  CalendarDays,
  Check,
  ChevronLeft,
  ClipboardList,
  Clock3,
  Crown,
  Dumbbell,
  Droplets,
  Flame,
  Lock,
  MessageSquare,
  Play,
  RefreshCw,
  Scale,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import appLogo from "@/assets/app-logo.png";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  PlatformScrollRow,
  PlatformSection,
} from "@/components/platform/layout/PlatformLayout";
import { PlatformHeaderActions } from "@/components/platform/shared/PlatformHeaderActions";
import { HeaderMenu } from "@/components/platform/shared/HeaderMenu";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { useWaterOptional } from "@/components/platform/water/WaterContext";
import { formatWaterLiters } from "@/lib/platform/water-storage";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import { ACTIVATE_PROGRAM_CTA } from "@/lib/pricing-presentation";
import { SOCIAL_PROOF_CLIENT_COUNT } from "@/lib/social-proof";
import { MEMBER_RESULT_STORIES } from "@/lib/platform/member-results-stories";
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
  NextSessionState,
  QuickGlanceItem,
  StreakWeekDay,
} from "@/lib/platform/home-hub";
import { READINESS_COPY, hasStartedToday } from "@/lib/platform/readiness";
import { READINESS_CHANGE_EVENT, getTodayReadinessRecord } from "@/lib/platform/readiness-storage";
import { HOME_GREETING_SUBTEXT } from "@/lib/platform/seed-content";
import bodyMuscular from "@/assets/body-muscular.jpg";
import feminineToned from "@/assets/feminine-toned-body.png";
import gymBg from "@/assets/quiz-gym-bg.jpg";
import coachPhoto from "@/assets/coach-photo.png";
import avatar1 from "@/assets/avatar1.jpg";
import avatar2 from "@/assets/avatar2.jpg";
import avatar3 from "@/assets/avatar3.jpg";
import avatar4 from "@/assets/avatar4.jpg";
import { cn } from "@/lib/utils";
import type { HeroGoalImage } from "@/lib/platform/hero-goal-images";
import { goalIdToUserGoal, resolveHeroGoalImage } from "@/lib/platform/hero-goal-images";
import {
  buildHeroGoalCardThemeKey,
  getHeroGoalCardTheme,
  heroCardSurfaceStyle,
  heroCoachTransformStyle,
  HERO_GOAL_SETTINGS_CHANGED_EVENT,
} from "@/lib/platform/hero-goal-framing";
import { useHourlyRotationIndex } from "@/lib/platform/hero-goals-asset-index";

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
  weight: Scale,
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

const VIP_BADGE_SESSION_KEY = "hakim.home.vip-badge.seen";
const SESSION_REVEAL_KEY = "hakim.home.next-session.revealed";
const SESSION_REVEAL_DELAY_MS = 1200;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wasSessionRevealed() {
  try {
    return sessionStorage.getItem(SESSION_REVEAL_KEY) === "1";
  } catch {
    return false;
  }
}

function markSessionRevealed() {
  try {
    sessionStorage.setItem(SESSION_REVEAL_KEY, "1");
  } catch {
    // private mode — once for this mount only
  }
}

function useNextSessionReveal() {
  const [visible, setVisible] = useState(() => wasSessionRevealed() || prefersReducedMotion());
  const [instant, setInstant] = useState(() => wasSessionRevealed() || prefersReducedMotion());

  useEffect(() => {
    if (visible) {
      markSessionRevealed();
      return;
    }

    let opened = false;
    const reveal = (withMotion: boolean) => {
      if (opened) return;
      opened = true;
      markSessionRevealed();
      if (!withMotion) setInstant(true);
      setVisible(true);
    };

    const scrollRoot = document.querySelector(".platform-main");
    const onScroll = () => reveal(false);
    scrollRoot?.addEventListener("scroll", onScroll, { passive: true });
    const timer = window.setTimeout(() => reveal(true), SESSION_REVEAL_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      scrollRoot?.removeEventListener("scroll", onScroll);
    };
  }, [visible]);

  return { visible, instant };
}

function useHomeVipBadge(tier: MembershipTier) {
  const [phase, setPhase] = useState<"idle" | "in" | "out">("idle");

  useEffect(() => {
    if (tier !== "vip") return;

    try {
      if (sessionStorage.getItem(VIP_BADGE_SESSION_KEY)) return;
      sessionStorage.setItem(VIP_BADGE_SESSION_KEY, "1");
    } catch {
      // private mode — play once for this mount only
    }

    setPhase("in");
    const hideTimer = window.setTimeout(() => setPhase("out"), 3000);
    const clearTimer = window.setTimeout(() => setPhase("idle"), 3480);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
    };
  }, [tier]);

  return phase;
}

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
  const vipBadgePhase = useHomeVipBadge(tier);

  return (
    <header className="platform-home-header-v2 platform-home-enter">
      <div className="platform-home-header-v2__identity">
        <HeaderMenu
          className="platform-home-header-v2__slot"
          actionClassName="platform-home-header-v2__action platform-touch"
          iconClassName="platform-home-header-v2__action-icon"
        />
        <Link to="/app/profile" className="platform-home-header-v2__avatar-link platform-touch" aria-label="الملف الشخصي">
        <div className={cn(
          "platform-home-header-v2__avatar-col",
          `is-tier-${frameTier}`,
          tier === "vip" && vipBadgePhase !== "idle" && "is-vip-motion",
        )}>
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
          {tier === "vip" ? (
            vipBadgePhase !== "idle" ? (
              <span className="platform-home-header-v2__tier-slot">
                <span
                  className={cn(
                    "platform-home-header__tier-badge is-tier-vip",
                    vipBadgePhase === "in" ? "is-in" : "is-out",
                  )}
                >
                  <Crown aria-hidden />
                  {tierLabel}
                </span>
              </span>
            ) : null
          ) : (
            <span className={cn("platform-home-header__tier-badge", `is-tier-${frameTier}`)}>
              {showCrown ? <Crown aria-hidden /> : null}
              {tierLabel}
            </span>
          )}
        </div>
      </Link>
      </div>

      <div className="platform-home-header-v2__logo">
        <OptimizedImage
          src={appLogo}
          alt="MAAKFIT"
          className="platform-home-header-v2__logo-img"
          width={52}
          height={30}
          objectFit="contain"
          priority
        />
      </div>

      <div className="platform-home-header-v2__actions">
        <PlatformHeaderActions
          actionClassName="platform-home-header-v2__action platform-touch"
          iconClassName="platform-home-header-v2__action-icon"
          bellStrokeWidth={1.75}
        />
      </div>
    </header>
  );
}

/* ── Hero Card ─────────────────────────────────────────────────────────── */

function HeroGoalFigure({ image }: { image: HeroGoalImage }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [image.src]);

  return (
    <div className={cn("platform-home-hero__figure", image.gender === "female" ? "is-female" : "is-male")}>
      <img
        ref={imgRef}
        key={image.src}
        src={image.src}
        alt={image.alt}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onLoad={() => setLoaded(true)}
        style={heroCoachTransformStyle({ framing: image.framing, loaded })}
        className={cn(
          "platform-home-hero__coach",
          image.gender === "female" ? "is-female" : "is-male",
          loaded ? "is-loaded" : null,
        )}
      />
    </div>
  );
}

export function HomeHeroCard({ hero }: { hero: HeroState }) {
  const streak = useCountUp(hero.streak);
  const points = useCountUp(hero.hakimPoints, 700);
  const journeyDay = useCountUp(hero.journeyDay);
  const { userId } = usePlatformActivity();
  const [started, setStarted] = useState(false);
  const [settingsVersion, setSettingsVersion] = useState(0);
  const hourlyRotation = useHourlyRotationIndex();

  useEffect(() => {
    const sync = () => setSettingsVersion((value) => value + 1);
    window.addEventListener(HERO_GOAL_SETTINGS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(HERO_GOAL_SETTINGS_CHANGED_EVENT, sync);
  }, []);

  const heroVisual = useMemo(() => {
    if (hero.heroImage.previewLocked) return hero.heroImage;
    return resolveHeroGoalImage({
      goal: goalIdToUserGoal(hero.heroImage.goalId) ?? "fitness",
      gender: hero.heroImage.gender,
      goalId: hero.heroImage.goalId,
      rotationIndex: hourlyRotation,
    });
  }, [hero.heroImage, hourlyRotation, settingsVersion]);

  const cardTheme = useMemo(
    () =>
      hero.heroCardTheme ??
      getHeroGoalCardTheme(buildHeroGoalCardThemeKey(hero.heroImage.gender, hero.heroImage.goalId)),
    [hero.heroCardTheme, hero.heroImage.gender, hero.heroImage.goalId, settingsVersion],
  );
  const cardSurfaceStyle = heroCardSurfaceStyle(cardTheme);
  const missionIsRoute = hero.missionHref.startsWith("/");
  const MissionIcon = hero.missionReward === 0 ? Check : ClipboardList;

  useEffect(() => {
    const refresh = () => setStarted(hasStartedToday(getTodayReadinessRecord(userId)));
    refresh();
    window.addEventListener(READINESS_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(READINESS_CHANGE_EVENT, refresh);
  }, [userId]);

  const missionInner = (
    <>
      <span className="platform-home-hero__goal-icon">
        <MissionIcon className="h-4 w-4 text-[#FF6B00]" aria-hidden />
      </span>
      <div className="platform-home-hero__goal-copy">
        <span className="platform-home-hero__goal-label">مهمة اليوم</span>
        <span className="platform-home-hero__goal-value">{hero.missionTitle}</span>
      </div>
      {hero.missionReward > 0 ? (
        <span className="platform-home-hero__goal-reward">+{hero.missionReward}</span>
      ) : null}
    </>
  );

  return (
    <section
      className="platform-home-hero platform-home-enter platform-home-enter--d1"
      aria-label="بطاقة الترحيب"
      style={cardSurfaceStyle}
    >
      <div className="platform-home-hero__aura" aria-hidden />
      <div className="platform-home-hero__top">
        <div className="platform-home-hero__content">
          <div className="platform-home-hero__intro">
            <p className="platform-home-hero__greeting">{hero.greeting}</p>
            <p className="platform-home-hero__subtext">{hero.subtext}</p>
          </div>

          {missionIsRoute ? (
            <Link to={hero.missionHref} className="platform-home-hero__goal-card">
              {missionInner}
            </Link>
          ) : (
            <div className="platform-home-hero__goal-card">{missionInner}</div>
          )}

          <div className="platform-home-hero__progress-card">
            <div className="platform-home-hero__progress-labels">
              <span>إنجاز اليوم</span>
              <span className="platform-home-hero__progress-value tabular-nums">
                {hero.todayDone}/{hero.todayTotal}
              </span>
            </div>
            <AnimatedProgressBar
              value={hero.todayProgress}
              color="#FF6B00"
              className="platform-home-hero__progress-bar"
            />
          </div>

          <p className="platform-home-hero__motivation">
            <Sparkles className="h-3 w-3 text-[#FF6B00]" aria-hidden />
            {hero.motivation}
          </p>
        </div>

        <div className="platform-home-hero__visual" aria-hidden>
          <HeroGoalFigure image={heroVisual} />
        </div>
      </div>

      <div className="platform-home-hero__panel">
        <div className="platform-home-hero__stats" aria-label="ملخص سريع">
          <div className="platform-home-hero__stat">
            <span className="platform-home-hero__stat-icon is-progress">
              <CalendarDays className="h-4 w-4" aria-hidden />
            </span>
            <span className="platform-home-hero__stat-label">رحلتك</span>
            <span className="platform-home-hero__stat-value tabular-nums">{journeyDay}</span>
            <span className="platform-home-hero__stat-sub">يوم</span>
          </div>

          <div className="platform-home-hero__stat">
            <span className="platform-home-hero__stat-icon is-streak">
              <Flame className="h-4 w-4" aria-hidden />
            </span>
            <span className="platform-home-hero__stat-label">السلسلة</span>
            <span className="platform-home-hero__stat-value tabular-nums">{streak}</span>
            <span className="platform-home-hero__stat-sub">أيام</span>
          </div>

          <div className="platform-home-hero__stat">
            <span className="platform-home-hero__stat-icon is-points">
              <Trophy className="h-4 w-4" aria-hidden />
            </span>
            <span className="platform-home-hero__stat-label">النشاط</span>
            <span className="platform-home-hero__stat-value tabular-nums">{formatHakimPoints(points)}</span>
            <span className="platform-home-hero__stat-sub">نقطة</span>
          </div>
        </div>

        <Link
          to="/app/program"
          search={started ? {} : { from: "start-day" }}
          className="platform-home-hero__cta platform-touch"
        >
          <Play className="h-4 w-4 fill-current" aria-hidden />
          {started ? READINESS_COPY.continueCta : READINESS_COPY.startCta}
        </Link>
      </div>
    </section>
  );
}

/* ── Daily Snapshot ────────────────────────────────────────────────────── */

function WaterSnapshotCard({ item }: { item: DailySnapshotItem }) {
  const water = useWaterOptional();
  if (!water) return null;

  const { state, openWaterSheet, reminderPulse } = water;
  const done = state.goalReached;
  const current = formatWaterLiters(state.totalMl);
  const goal = formatWaterLiters(state.goalMl, 0);

  return (
    <button
      type="button"
      onClick={openWaterSheet}
      className={cn(
        "platform-home-day-card platform-touch is-water",
        done && "is-water-done",
        reminderPulse && !done && "is-reminding",
      )}
      aria-label={
        done ? `اكتمل هدف الماء ${goal} لتر` : `الماء ${current} من ${goal} لتر`
      }
    >
      <SnapshotCardBody
        item={item}
        value={current}
        goalText={`/ ${goal} لتر`}
        statusText={done ? "وصلت لهدف الماء" : "استمر، كأس إضافي يقرّبك"}
        progress={state.pct}
        complete={done}
        icon={
          <Droplets
            className={cn("h-5 w-5", reminderPulse && !done ? "water-header-orb__icon" : null)}
            aria-hidden
            strokeWidth={2.2}
          />
        }
      />
    </button>
  );
}

function SnapshotRing({
  progress,
  children,
}: {
  progress: number;
  children: ReactNode;
}) {
  const size = 56;
  const stroke = 4.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(progress, 0), 100) / 100;
  const offset = circumference * (1 - pct);

  return (
    <span className="platform-home-day-card__ring" aria-hidden>
      <svg viewBox={`0 0 ${size} ${size}`} className="platform-home-day-card__ring-svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F0EBE4"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F97316"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="platform-home-day-card__ring-icon">{children}</span>
    </span>
  );
}

function SnapshotCardBody({
  item,
  icon,
  value,
  goalText,
  statusText,
  progress,
  complete,
}: {
  item: DailySnapshotItem;
  icon: ReactNode;
  value: string;
  goalText: string;
  statusText: string;
  progress: number;
  complete: boolean;
}) {
  return (
    <>
      <p className="platform-home-day-card__title">{item.title}</p>
      <div className="platform-home-day-card__body">
        <div className="platform-home-day-card__metrics">
          <p className="platform-home-day-card__value">{value}</p>
          <p className="platform-home-day-card__goal">{goalText}</p>
        </div>
        <SnapshotRing progress={progress}>{icon}</SnapshotRing>
      </div>
      <p className={cn("platform-home-day-card__status", complete && "is-complete")}>
        {complete ? (
          <span className="platform-home-day-card__status-dot">
            <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
          </span>
        ) : null}
        {statusText}
      </p>
    </>
  );
}

function SnapshotCard({ item }: { item: DailySnapshotItem }) {
  if (item.id === "water") {
    return <WaterSnapshotCard item={item} />;
  }

  const Icon = SNAPSHOT_ICONS[item.icon];

  return (
    <Link
      to={item.href ?? "/app"}
      className={cn("platform-home-day-card platform-touch", `is-${item.id}`)}
      aria-label={`${item.title}: ${item.value}`}
    >
      <SnapshotCardBody
        item={item}
        value={item.value}
        goalText={item.goalText}
        statusText={item.statusText}
        progress={item.progress}
        complete={item.complete}
        icon={<Icon className="h-5 w-5" aria-hidden strokeWidth={2.2} />}
      />
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
        <Link to="/app/progress" className="platform-home-section-head__action">
          عرض الكل
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <div className="platform-home-day-grid">
        {items.map((item) => (
          <SnapshotCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export function HomeCoachTip({ message }: { message: MessageOfDay }) {
  return (
    <section className="platform-home-coach platform-home-enter platform-home-enter--d3" aria-labelledby="home-coach-title">
      <div className="platform-home-coach__head">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        <h2 id="home-coach-title">رسالة من الكوتش</h2>
      </div>
      <div className="platform-home-coach__body">
        <div className="platform-home-coach__person">
          <span className="platform-home-coach__avatar">
            <OptimizedImage src={coachPhoto} alt="الكوتش حكيم" className="h-full w-full" objectFit="cover" />
          </span>
          <span className="platform-home-coach__name">حكيم</span>
        </div>
        <div className="platform-home-coach__bubble">
          <p className="platform-home-coach__text">{message.body}</p>
          <Link to="/app/support" className="platform-home-coach__ask">
            اسأل الكوتش
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomeSocialProof() {
  const clientCount = SOCIAL_PROOF_CLIENT_COUNT.toLocaleString("en-US");

  return (
    <section className="platform-home-social platform-home-enter platform-home-enter--d4" aria-label="إثبات اجتماعي">
      <div className="platform-home-social__avatars" aria-hidden>
        {PERSONAL_PROGRAM_AVATARS.map((src, index) => (
          <img key={index} src={src} alt="" className="platform-home-social__avatar" />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="platform-home-social__text">
          أكثر من {clientCount} عضو بدأوا رحلتهم معنا
        </p>
        <p className="platform-home-social__rating">
          4.8
          <Star className="h-3.5 w-3.5 fill-[#22C55E] text-[#22C55E]" aria-hidden />
        </p>
      </div>
    </section>
  );
}

/* ── Next session ticket ───────────────────────────────────────────────── */

export function HomeNextSession({ session }: { session: NextSessionState }) {
  const { visible, instant } = useNextSessionReveal();

  return (
    <div
      className={cn(
        "platform-home-session-slot",
        visible && "is-open",
        instant && "is-instant",
      )}
    >
      <div className="platform-home-session-slot__inner">
        <section
          className="platform-home-session"
          aria-labelledby="home-session-title"
          aria-hidden={!visible}
        >
          <div className="platform-home-session__copy">
            <p className="platform-home-session__eyebrow">{session.eyebrow}</p>
            <h2 id="home-session-title" className="platform-home-session__title">
              {session.title}
            </h2>
            {session.meta ? <p className="platform-home-session__meta">{session.meta}</p> : null}
          </div>
          {session.cta ? (
            <Link
              to={session.href}
              className="platform-home-session__play platform-touch"
              aria-label={session.cta}
              tabIndex={visible ? undefined : -1}
            >
              <Play className="h-5 w-5 fill-current" aria-hidden />
            </Link>
          ) : null}
        </section>
      </div>
    </div>
  );
}

/* ── Discover ──────────────────────────────────────────────────────────── */

/* ── Discover ──────────────────────────────────────────────────────────── */

export function HomeDiscoverCard({
  item,
  preview = false,
}: {
  item: DiscoverPreviewItem;
  preview?: boolean;
}) {
  const imageSrc = item.coverSrc || (item.image ? FEATURED_IMAGES[item.image] : undefined);
  const media = (
    <div className="platform-home-discover-card__media">
      {imageSrc ? (
        <OptimizedImage src={imageSrc} alt="" className="h-full w-full" objectFit="cover" width={1080} height={1350} />
      ) : (
        <span className="platform-home-discover-card__fallback" aria-hidden />
      )}
      <span className="platform-home-discover-card__shade" aria-hidden />
      {item.badge ? (
        <span
          className={cn(
            "platform-home-discover-card__badge",
            item.badgeTone === "recipe" && "is-recipe",
            item.badgeTone === "article" && "is-article",
          )}
        >
          {item.badge}
        </span>
      ) : null}
      {item.showPlay ? (
        <span className="platform-home-discover-card__play" aria-hidden>
          <Play className="h-5 w-5 fill-current" />
        </span>
      ) : null}
      <div className="platform-home-discover-card__caption">
        <p className="platform-home-discover-card__title">{item.title}</p>
        <p className="platform-home-discover-card__desc">
          <Clock3 className="h-3.5 w-3.5" aria-hidden />
          {item.description}
        </p>
      </div>
    </div>
  );

  if (preview) {
    return (
      <article className="platform-home-discover-card" aria-label={`${item.title} — ${item.description}`}>
        {media}
      </article>
    );
  }

  const slug = item.href.match(/^\/app\/discover\/([^/?#]+)$/)?.[1];
  if (slug && slug !== "discover") {
    return (
      <Link
        to="/app/discover/$slug"
        params={{ slug }}
        className="platform-home-discover-card platform-touch"
        aria-label={`${item.title} — ${item.description}`}
      >
        {media}
      </Link>
    );
  }

  return (
    <Link
      to="/app/discover"
      className="platform-home-discover-card platform-touch"
      aria-label={`${item.title} — ${item.description}`}
    >
      {media}
    </Link>
  );
}

export function HomeDiscover({ items }: { items: DiscoverPreviewItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="platform-home-enter platform-home-enter--d3" aria-labelledby="home-discover-title">
      <div className="platform-home-section-head">
        <h2 id="home-discover-title" className="platform-home-section-head__title">
          مختار لك
        </h2>
        <Link to="/app/discover" className="platform-home-section-head__action">
          عرض الكل
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="platform-home-discover-grid" data-count={items.length}>
        {items.map((item) => (
          <HomeDiscoverCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

/* ── Personal program promo (Free only) ────────────────────────────────── */

const PERSONAL_PROGRAM_AVATARS = [avatar1, avatar2, avatar3, avatar4] as const;

const PERSONAL_PROGRAM_BENEFITS = [
  {
    title: "خطة تغذية",
    icon: UtensilsCrossed,
    tone: "is-green",
  },
  {
    title: "برنامج تدريبي",
    icon: Dumbbell,
    tone: "is-orange",
  },
  {
    title: "متابعة التقدم",
    icon: TrendingUp,
    tone: "is-orange",
  },
  {
    title: "دعم الكوتش",
    icon: MessageSquare,
    tone: "is-blue",
  },
] as const;

export function HomePersonalProgramCard() {
  const { openUpgrade } = useUpgradeFlow();
  const story = MEMBER_RESULT_STORIES[0];

  return (
    <section
      className="platform-home-program platform-home-enter platform-home-enter--d5"
      aria-labelledby="home-program-title"
    >
      <article className="platform-home-program__card platform-home-program__card--upgrade">
        <h2 id="home-program-title" className="platform-home-program__title">
          ارتقِ <span className="platform-home-program__accent">بخطتك</span>
        </h2>
        <p className="platform-home-program__lead">برنامج شخصي متكامل لتحقيق هدفك</p>

        <div className="platform-home-program__split">
          <div className="platform-home-program__benefits">
            {PERSONAL_PROGRAM_BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="platform-home-program__benefit">
                  <span className={cn("platform-home-program__benefit-icon", item.tone)}>
                    <Icon className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                  </span>
                  <p className="platform-home-program__benefit-title">{item.title}</p>
                </div>
              );
            })}
          </div>

          {story ? (
            <div className="platform-home-program__proof">
              <div className="platform-home-program__before-after">
                <span className="platform-home-program__ba">
                  <OptimizedImage src={story.before} alt="" className="h-full w-full" objectFit="cover" />
                  <span>قبل</span>
                </span>
                <span className="platform-home-program__ba">
                  <OptimizedImage src={story.after} alt="" className="h-full w-full" objectFit="cover" />
                  <span className="is-after">بعد</span>
                </span>
              </div>
              <p className="platform-home-program__proof-caption">
                <Sparkles className="h-3 w-3 text-primary" aria-hidden />
                نتائج حقيقية من أعضاء الكوتش
              </p>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="platform-home-program__cta platform-touch"
          onClick={() =>
            openUpgrade("افتح برنامجك الشخصي: تدريب، تغذية، تتبع تقدم، ودعم الكوتش داخل المنصة.")
          }
        >
          اكتشف العضوية
        </button>

        <button
          type="button"
          className="platform-home-program__more"
          onClick={() => openUpgrade("قارن باقات MAAKFIT واختر ما يناسبك.")}
        >
          قارن الباقات
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
          stroke="var(--primary)"
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
