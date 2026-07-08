import { Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
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
  Scale,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  UtensilsCrossed,
} from "lucide-react";
import {
  PlatformScrollRow,
  PlatformSection,
} from "@/components/platform/layout/PlatformLayout";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { ACTIVATE_PROGRAM_CTA } from "@/lib/pricing-presentation";
import {
  HAKIM_POINTS_LABEL,
  formatHakimPoints,
  resolveStreakMotivation,
} from "@/lib/platform/daily-motivation";
import type {
  DailyTask,
  FeaturedContentItem,
  HealthScore,
  MessageOfDay,
  QuickGlanceItem,
} from "@/lib/platform/home-hub";
import { HOME_GREETING_SUBTEXT } from "@/lib/platform/seed-content";
import avatar1 from "@/assets/avatar1.jpg";
import bodyMuscular from "@/assets/body-muscular.jpg";
import feminineToned from "@/assets/feminine-toned-body.png";
import gymBg from "@/assets/quiz-gym-bg.jpg";
import { cn } from "@/lib/utils";

const FEATURED_IMAGES = {
  recipe: gymBg,
  workout: bodyMuscular,
  flexibility: feminineToned,
  tip: feminineToned,
  challenge: bodyMuscular,
} as const;

const TASK_ICONS = {
  workout: Dumbbell,
  nutrition: UtensilsCrossed,
  water: Droplets,
  measurements: Scale,
  calories: Flame,
  recipe: UtensilsCrossed,
  challenge: Flame,
} as const;

const GLANCE_ICONS = {
  target: Target,
  calendar: Calendar,
  trend: TrendingDown,
  scale: Scale,
  flame: Flame,
  health: Activity,
} as const;

function StreakRing({ streak }: { streak: number }) {
  const progress = Math.min(streak / 14, 1);
  const circumference = 2 * Math.PI * 22;
  const offset = circumference * (1 - progress * 0.75);

  return (
    <div className="relative grid h-14 w-14 shrink-0 place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r="22"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <Flame className="relative h-6 w-6 text-white" />
    </div>
  );
}

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
  const Icon = TASK_ICONS[task.icon];
  const { openUpgrade } = useUpgradeFlow();

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
      <img src={imageSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
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

export function HomeHeader({
  name,
  tierLabel,
  showTierBadge,
}: {
  name: string;
  tierLabel: string;
  showTierBadge: boolean;
}) {
  return (
    <header className="platform-home-header">
      <div className="platform-home-header__profile">
        <div className="platform-home-header__avatar-col">
          <div className="platform-home-header__avatar">
            <img src={avatar1} alt="" />
          </div>
          {showTierBadge ? (
            <span className="platform-home-header__premium">
              <Crown aria-hidden />
              {tierLabel}
            </span>
          ) : null}
        </div>

        <div className="platform-home-header__text">
          <p className="platform-home-header__welcome">
            مرحباً بك، <span aria-hidden>👋</span>
          </p>
          <h1 className="platform-home-header__name">{name}</h1>
          <p className="platform-home-header__subtext">{HOME_GREETING_SUBTEXT}</p>
        </div>
      </div>

      <div className="platform-home-header__actions">
        <Link to="/app/support" className="platform-home-header__action" aria-label="الرسائل">
          <MessageSquare strokeWidth={1.75} className="h-6 w-6" />
        </Link>
        <button type="button" className="platform-home-header__action" aria-label="الإشعارات">
          <Bell strokeWidth={1.75} className="h-6 w-6" />
          <span className="platform-home-header__badge">3</span>
        </button>
      </div>
    </header>
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
    <PlatformSection title="نظرة سريعة" icon={BarChart3} iconClassName="text-success" variant="card">
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
  return <HomeHeader name={name} tierLabel="Free" showTierBadge={false} />;
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
