import { Link } from "@tanstack/react-router";
import {
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
  MessageSquare,
  Play,
  Scale,
  Star,
  Target,
  TrendingDown,
  UtensilsCrossed,
} from "lucide-react";
import {
  PlatformScrollRow,
  PlatformSection,
} from "@/components/platform/layout/PlatformLayout";
import {
  DAILY_TASKS_SEED,
  FEATURED_CONTENT_SEED,
  HOME_GREETING_SUBTEXT,
  QUICK_GLANCE_SEED,
  type DailyTaskSeed,
  type FeaturedContentSeed,
  type QuickGlanceSeed,
} from "@/lib/platform/seed-content";
import avatar1 from "@/assets/avatar1.jpg";
import bodyMuscular from "@/assets/body-muscular.jpg";
import feminineToned from "@/assets/feminine-toned-body.png";
import gymBg from "@/assets/quiz-gym-bg.jpg";
import { cn } from "@/lib/utils";

const FEATURED_IMAGES = {
  recipe: gymBg,
  workout: bodyMuscular,
  flexibility: feminineToned,
} as const;

const TASK_ICONS = {
  workout: Dumbbell,
  nutrition: UtensilsCrossed,
  water: Droplets,
  measurements: Scale,
} as const;

const GLANCE_ICONS = {
  target: Target,
  calendar: Calendar,
  trend: TrendingDown,
  scale: Scale,
} as const;

function formatPoints(value: number) {
  return value.toLocaleString("en-US");
}

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

function TaskStatus({ task }: { task: DailyTaskSeed }) {
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

function DailyTaskCard({ task, locked }: { task: DailyTaskSeed; locked: boolean }) {
  const Icon = TASK_ICONS[task.icon];
  const href = locked ? "/quiz" : task.href;

  return (
    <Link
      to={href}
      className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5 transition active:bg-muted"
    >
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", task.iconBg)}>
        <Icon className={cn("h-5 w-5", task.iconColor)} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-foreground">{task.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{task.subtitle}</p>
      </div>
      <TaskStatus task={task} />
    </Link>
  );
}

function QuickGlanceCard({ item }: { item: QuickGlanceSeed }) {
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

function FeaturedCard({ item }: { item: FeaturedContentSeed }) {
  const imageSrc = FEATURED_IMAGES[item.image as keyof typeof FEATURED_IMAGES];

  return (
    <Link
      to={item.href}
      className="relative flex h-36 w-[9.5rem] flex-col justify-end overflow-hidden rounded-2xl shadow-card"
    >
      <img src={imageSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      {item.badge ? (
        <span className="absolute start-2 top-2 rounded-lg bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
          {item.badge}
        </span>
      ) : null}
      {item.showPlay ? (
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-foreground shadow-sm">
            <Play className="h-4 w-4 fill-current" />
          </span>
        </span>
      ) : null}
      <div className="relative z-[1] p-3 text-white">
        <p className="text-sm font-black leading-tight">{item.title}</p>
        <p className="mt-1 text-xs text-white/80">{item.subtitle}</p>
      </div>
    </Link>
  );
}

export function HomeHeader({ name, isPremium }: { name: string; isPremium: boolean }) {
  return (
    <header className="platform-home-header">
      <div className="platform-home-header__profile">
        <div className="platform-home-header__avatar-col">
          <div className="platform-home-header__avatar">
            <img src={avatar1} alt="" />
          </div>
          {isPremium ? (
            <span className="platform-home-header__premium">
              <Crown aria-hidden />
              Premium
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

export function SummaryCard({ streak, points }: { streak: number; points: number }) {
  return (
    <section className="-mt-[10px] shrink-0 overflow-hidden rounded-2xl cta-gradient p-4 text-white shadow-cta">
      <div className="flex items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <StreakRing streak={streak} />
          <div>
            <p className="text-lg font-black leading-tight">{streak} يوم متتالي</p>
            <p className="mt-1 text-xs text-white/85">استمر هكذا! 🔥</p>
          </div>
        </div>

        <div className="h-12 w-px shrink-0 bg-white/25" />

        <div className="min-w-0 flex-1">
          <p className="text-xs text-white/80">النقاط</p>
          <p className="text-xl font-black leading-tight">{formatPoints(points)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-white/90">
            <Star className="h-3 w-3 fill-[#FCD34D] text-[#FCD34D]" />
            ممتاز! استمر في التقدم
          </p>
        </div>
      </div>
    </section>
  );
}

export function DailyTasksSection({ locked }: { locked: boolean }) {
  return (
    <PlatformSection title="مهامك اليوم" icon={ClipboardList} variant="card">
      <div className="flex flex-col gap-2">
        {DAILY_TASKS_SEED.map((task) => (
          <DailyTaskCard key={task.id} task={task} locked={locked} />
        ))}
      </div>
    </PlatformSection>
  );
}

export function QuickGlanceSection() {
  return (
    <PlatformSection title="نظرة سريعة" icon={BarChart3} iconClassName="text-success" variant="card">
      <div className="flex items-stretch divide-x divide-border/50">
        {QUICK_GLANCE_SEED.map((item) => (
          <QuickGlanceCard key={item.id} item={item} />
        ))}
      </div>
    </PlatformSection>
  );
}

export function FeaturedContentSection() {
  return (
    <PlatformSection
      title="محتوى مميز لك"
      action={
        <Link to="/app/discover" className="text-xs font-bold text-success">
          عرض الكل
        </Link>
      }
    >
      <PlatformScrollRow>
        {FEATURED_CONTENT_SEED.map((item) => (
          <FeaturedCard key={item.id} item={item} />
        ))}
      </PlatformScrollRow>
    </PlatformSection>
  );
}

export function UpgradeBanner() {
  return (
    <Link
      to="/quiz"
      className="flex shrink-0 items-center gap-3 rounded-2xl cta-gradient p-4 text-white shadow-cta transition hover:opacity-95"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
        <Crown className="h-5 w-5 text-amber-200" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black">افتح تجربة Premium كاملة</p>
        <p className="mt-1 text-xs text-white/85">برنامج، تغذية، ومتابعة يومية</p>
      </div>
      <ChevronLeft className="h-5 w-5 shrink-0 opacity-90" />
    </Link>
  );
}

/** @deprecated use HomeHeader */
export function HomeGreeting({ name }: { name: string }) {
  return <HomeHeader name={name} isPremium={false} />;
}

/** @deprecated use SummaryCard */
export function StreakWidget({ count, points }: { count: number; points?: number }) {
  return <SummaryCard streak={count} points={points ?? 230} />;
}

/** @deprecated removed from home layout */
export function DailyFeed() {
  return null;
}
