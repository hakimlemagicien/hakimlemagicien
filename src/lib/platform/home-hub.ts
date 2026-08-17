import type { MembershipFeatures, MembershipTier } from "@/lib/platform/membership";
import {
  HAKIM_POINTS_REWARDS,
  formatHakimPoints,
  type NextMission,
} from "@/lib/platform/daily-motivation";
import type { HeroGoalImage } from "@/lib/platform/hero-goal-images";
import type { PlatformActivitySnapshot } from "@/lib/platform/platform-activity";
import { getEmptyActivitySnapshot } from "@/lib/platform/platform-activity";
import { DAILY_GREETING_NAME_FALLBACK, MEALS_SEED, WORKOUT_DAY_SEED } from "@/lib/platform/seed-content";
import { getWeekdayIdFromDate, resolveWeekdayPlan } from "@/lib/platform/weekly-workout-schedule";
import { readQuizProgress } from "@/lib/quiz-progress-storage";

/** User training goal used to personalize home content. */
export type UserGoal = "cut" | "bulk" | "fitness";

export type DailyTaskIcon =
  | "workout"
  | "nutrition"
  | "water"
  | "measurements"
  | "calories"
  | "recipe"
  | "challenge";

export type DailyTaskStatus = "done" | "arrow" | "progress";

export type DailyTask = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: DailyTaskIcon;
  iconBg: string;
  iconColor: string;
  status: DailyTaskStatus;
  progress?: { current: number; total: number };
  /** Free tools must stay unlocked even without paid progress features. */
  freeAlways: boolean;
  /** Feature gate for paid capabilities (ignored when freeAlways). */
  requires?: keyof MembershipFeatures;
};

export type QuickGlanceItem = {
  id: string;
  label: string;
  value: string;
  icon: "scale" | "target" | "flame" | "calendar" | "trend" | "health";
  iconBg: string;
  iconColor: string;
};

export type FeaturedContentItem = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  image: "recipe" | "workout" | "flexibility" | "tip" | "challenge";
  href: string;
  goals: UserGoal[];
  badge?: string;
  showPlay?: boolean;
};

export type MessageOfDay = {
  greeting: string;
  body: string;
};

export type HealthScore = {
  score: number;
  label: string;
};

const FREE_ALWAYS_TASK_DEFS: Omit<DailyTask, "status" | "progress" | "subtitle" | "title">[] = [
  {
    id: "water",
    href: "#water",
    icon: "water",
    iconBg: "bg-[#DBEAFE]",
    iconColor: "text-[#2563EB]",
    freeAlways: true,
  },
  {
    id: "weight",
    href: "/app/progress",
    icon: "measurements",
    iconBg: "bg-primary-soft",
    iconColor: "text-primary",
    freeAlways: true,
  },
  {
    id: "calories",
    href: "/app/tools/calories",
    icon: "calories",
    iconBg: "bg-[#FFEDD5]",
    iconColor: "text-[#EA580C]",
    freeAlways: true,
  },
];

const PAID_TASK_POOL: DailyTask[] = [
  {
    id: "workout",
    title: "تمرين اليوم",
    subtitle: "اليوم 3 — الجزء العلوي",
    href: "/app/program/workout",
    icon: "workout",
    iconBg: "bg-secondary-soft",
    iconColor: "text-success",
    status: "arrow",
    freeAlways: false,
    requires: "workout_program",
  },
  {
    id: "nutrition",
    title: "خطة التغذية",
    subtitle: "سجّل وجباتك اليومية",
    href: "/app/nutrition",
    icon: "nutrition",
    iconBg: "bg-[#FEF9C3]",
    iconColor: "text-[#CA8A04]",
    status: "arrow",
    freeAlways: false,
    requires: "nutrition_plan",
  },
];

const ROTATING_FREE_EXTRAS: DailyTask[] = [
  {
    id: "recipe",
    title: "وصفة اليوم",
    subtitle: "سلطة بروتين خفيفة",
    href: "/app/discover",
    icon: "recipe",
    iconBg: "bg-[#FFEDD5]",
    iconColor: "text-[#EA580C]",
    status: "arrow",
    freeAlways: true,
  },
  {
    id: "challenge",
    title: "تحدي اليوم",
    subtitle: "مشي 20 دقيقة",
    href: "/app/discover",
    icon: "challenge",
    iconBg: "bg-[#FCE7F3]",
    iconColor: "text-[#DB2777]",
    status: "arrow",
    freeAlways: true,
  },
];

const CONTENT_LIBRARY: FeaturedContentItem[] = [
  {
    id: "new-for-you",
    title: "جلسة تمهيدية قصيرة",
    subtitle: "ابدأ بـ 12 دقيقة فقط",
    category: "جديد لك",
    image: "workout",
    href: "/app/discover",
    goals: ["cut", "bulk", "fitness"],
    badge: "جديد",
    showPlay: true,
  },
  {
    id: "recipe-cut",
    title: "سلطة دجاج منخفضة السعرات",
    subtitle: "وصفة اليوم للتنشيف",
    category: "وصفة اليوم",
    image: "recipe",
    href: "/app/discover",
    goals: ["cut"],
    badge: "تنشيف",
  },
  {
    id: "recipe-bulk",
    title: "شوفان عالي البروتين",
    subtitle: "وصفة اليوم للتضخيم",
    category: "وصفة اليوم",
    image: "recipe",
    href: "/app/discover",
    goals: ["bulk"],
    badge: "تضخيم",
  },
  {
    id: "recipe-fit",
    title: "سموثي الطاقة",
    subtitle: "وصفة سريعة للياقة",
    category: "وصفة اليوم",
    image: "recipe",
    href: "/app/discover",
    goals: ["fitness"],
  },
  {
    id: "extra-cut",
    title: "كارديو إضافي 15د",
    subtitle: "تمرين إضافي لحرق الدهون",
    category: "تمرين إضافي",
    image: "workout",
    href: "/app/discover",
    goals: ["cut"],
    showPlay: true,
  },
  {
    id: "extra-bulk",
    title: "تمارين منزلية للقوة",
    subtitle: "تمرين إضافي لبناء العضلات",
    category: "تمرين إضافي",
    image: "workout",
    href: "/app/discover",
    goals: ["bulk", "fitness"],
    showPlay: true,
  },
  {
    id: "tip-cut",
    title: "سر العجز الحراري",
    subtitle: "معلومة اليوم",
    category: "معلومة اليوم",
    image: "tip",
    href: "/app/discover",
    goals: ["cut", "fitness"],
  },
  {
    id: "tip-bulk",
    title: "البروتين في كل وجبة",
    subtitle: "معلومة اليوم",
    category: "معلومة اليوم",
    image: "tip",
    href: "/app/discover",
    goals: ["bulk"],
  },
  {
    id: "week-challenge",
    title: "تحدي 10 آلاف خطوة",
    subtitle: "تحدي الأسبوع",
    category: "تحدي الأسبوع",
    image: "challenge",
    href: "/app/discover",
    goals: ["cut", "bulk", "fitness"],
    badge: "أسبوعي",
  },
];

function dayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

function greetingPrefix(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "صباح الخير";
  if (hour < 18) return "مساء الخير";
  return "مساء الخير";
}

/** Client first name — profile first, then quiz onboarding, then fallback. */
export function resolveClientFirstName(displayName?: string | null): string {
  const membershipFirst = displayName?.trim().split(/\s+/)[0];
  const isGeneric =
    !membershipFirst ||
    membershipFirst === DAILY_GREETING_NAME_FALLBACK ||
    membershipFirst.toLowerCase() === "batal";

  if (!isGeneric) return membershipFirst;

  const quizFirst = readQuizProgress()?.userName?.trim().split(/\s+/)[0];
  if (quizFirst) return quizFirst;

  return membershipFirst || DAILY_GREETING_NAME_FALLBACK;
}

export function buildTimeGreeting(displayName: string, date = new Date()): string {
  const firstName = resolveClientFirstName(displayName);
  return `${greetingPrefix(date)} ${firstName} 👋`;
}

export function resolveUserGoal(raw?: string | null): UserGoal {
  const value = (raw ?? "").toLowerCase();
  if (value.includes("bulk") || value.includes("تضخيم") || value.includes("عضل")) return "bulk";
  if (value.includes("fit") || value.includes("لياق") || value.includes("صح")) return "fitness";
  return "cut";
}

export function goalLabel(goal: UserGoal): string {
  if (goal === "bulk") return "تضخيم";
  if (goal === "fitness") return "لياقة";
  return "تنشيف";
}

function hydrateFreeTask(
  def: (typeof FREE_ALWAYS_TASK_DEFS)[number],
  activity: PlatformActivitySnapshot,
): DailyTask {
  if (def.id === "water") {
    const done = activity.waterMl >= activity.waterGoalMl;
    const currentLiters = (activity.waterMl / 1000).toFixed(1);
    const goalLiters = (activity.waterGoalMl / 1000).toFixed(0);
    return {
      ...def,
      title: "شرب الماء",
      subtitle: done
        ? "أحسنت — هدفت اليوم مكتمل"
        : activity.waterMl > 0
          ? `${currentLiters} / ${goalLiters} لتر`
          : "ابدأ بكوب واحد اليوم",
      status: done ? "done" : activity.waterMl > 0 ? "progress" : "arrow",
      progress: {
        current: Math.round(activity.waterMl / activity.waterGlassMl),
        total: Math.ceil(activity.waterGoalMl / activity.waterGlassMl),
      },
    };
  }
  if (def.id === "weight") {
    return {
      ...def,
      title: "تسجيل الوزن",
      subtitle:
        activity.currentWeight != null
          ? `آخر وزن: ${activity.currentWeight} كجم`
          : "سجّل وزنك للبدء بتتبع التقدم",
      status: activity.currentWeight != null ? "done" : "arrow",
    };
  }
  return {
    ...def,
    title: "حاسبة السعرات",
    subtitle: "احسب احتياجك بسرعة",
    status: "arrow",
  };
}

/**
 * Builds a dynamic daily task list.
 * Free users always see useful unlocked tools — never a wall of locks.
 */
export function buildDailyTasks(input: {
  features: MembershipFeatures;
  activity?: PlatformActivitySnapshot;
  date?: Date;
}): DailyTask[] {
  const activity = input.activity ?? getEmptyActivitySnapshot();
  const dayIndex = dayOfYear(input.date);
  const rotation = dayIndex % 3;

  const freeCore = FREE_ALWAYS_TASK_DEFS.map((def) => hydrateFreeTask(def, activity));

  const water = freeCore.find((t) => t.id === "water")!;
  const weight = freeCore.find((t) => t.id === "weight")!;
  const calories = freeCore.find((t) => t.id === "calories")!;

  const canWorkout = input.features.workout_program;
  const canNutrition = input.features.nutrition_plan;
  const workout = { ...PAID_TASK_POOL[0] };
  const nutrition = { ...PAID_TASK_POOL[1] };

  if (canWorkout || canNutrition) {
    const paid: DailyTask[] = [];
    if (canWorkout) {
      paid.push({
        ...workout,
        status: activity.workoutDone >= activity.workoutTotal ? "done" : "arrow",
      });
    }
    if (canNutrition && rotation !== 2) paid.push(nutrition);

    const freePick =
      rotation === 0 ? [water, weight] : rotation === 1 ? [water, calories] : [water, weight, calories];

    return [...paid, ...freePick].slice(0, 4);
  }

  const teaser =
    rotation === 0
      ? { ...workout, subtitle: "معاينة شكل البرنامج" }
      : rotation === 1
        ? { ...nutrition, subtitle: "معاينة شكل خطة التغذية" }
        : { ...ROTATING_FREE_EXTRAS[dayIndex % ROTATING_FREE_EXTRAS.length] };

  const unlocked =
    rotation === 0
      ? [water, weight, calories]
      : rotation === 1
        ? [water, weight, ROTATING_FREE_EXTRAS[0]]
        : [water, calories, ROTATING_FREE_EXTRAS[1]];

  if (teaser.id === "workout" || teaser.id === "nutrition") {
    return [...unlocked.slice(0, 3), teaser];
  }
  return unlocked.slice(0, 4);
}

export function isDailyTaskLocked(task: DailyTask, features: MembershipFeatures): boolean {
  // Workout / nutrition open as visual preview screens — PreviewGate handles upgrade.
  if (task.id === "workout" || task.id === "nutrition") return false;
  if (task.freeAlways) return false;
  if (!task.requires) return false;
  return !features[task.requires];
}

export function buildMessageOfDay(input: {
  displayName: string;
  streak: number;
  goal: UserGoal;
  activity?: PlatformActivitySnapshot;
  date?: Date;
}): MessageOfDay {
  const activity = input.activity ?? getEmptyActivitySnapshot();
  const greeting = buildTimeGreeting(input.displayName, input.date);
  const remaining =
    activity.startWeight != null &&
    activity.goalWeight != null &&
    activity.currentWeight != null
      ? Math.max(
          0,
          Math.round((activity.currentWeight - activity.goalWeight) * 10) / 10,
        )
      : 0;
  const dayIndex = dayOfYear(input.date);

  const bodies = [
    activity.currentWeight == null
      ? "سجّل وزنك لبدء تتبع التقدم نحو هدفك."
      : remaining > 0
        ? `بقي ${remaining} كجم للوصول لهدفك — خطوة اليوم تقربك أكثر.`
        : "لقد وصلت قرب هدفك — حافظ على الإيقاع اليوم.",
    input.streak > 0
      ? `سلسلتك ${input.streak} ${input.streak === 1 ? "يوم" : "أيام"} — لا تكسرها اليوم.`
      : "اليوم فرصة جديدة لبدء سلسلة إنجازك.",
    input.goal === "bulk"
      ? "اليوم مناسب للالتزام بالبروتين وإكمال تمرينك."
      : input.goal === "fitness"
        ? "اليوم فرصة للتحرك والالتزام بعاداتك الصحية."
        : "اليوم مناسب لرفع شدة التمرين قليلاً مع الالتزام بالماء.",
  ];

  return {
    greeting,
    body: bodies[dayIndex % bodies.length],
  };
}

export function buildQuickGlance(input: {
  streak: number;
  activity?: PlatformActivitySnapshot;
}): QuickGlanceItem[] {
  const activity = input.activity ?? getEmptyActivitySnapshot();
  const remaining =
    activity.startWeight != null &&
    activity.goalWeight != null &&
    activity.currentWeight != null
      ? Math.max(
          0,
          Math.round((activity.currentWeight - activity.goalWeight) * 10) / 10,
        )
      : 0;
  const totalToLose =
    activity.startWeight != null && activity.goalWeight != null
      ? Math.max(Math.abs(activity.startWeight - activity.goalWeight), 0.1)
      : 0;
  const lostSoFar =
    activity.startWeight != null && activity.currentWeight != null
      ? Math.abs(activity.startWeight - activity.currentWeight)
      : 0;
  const progressPct =
    totalToLose > 0 ? Math.min(Math.max(Math.round((lostSoFar / totalToLose) * 100), 0), 100) : 0;

  return [
    {
      id: "weight",
      label: "الوزن الحالي",
      value: activity.currentWeight != null ? `${activity.currentWeight} كجم` : "—",
      icon: "scale",
      iconBg: "bg-secondary-soft",
      iconColor: "text-success",
    },
    {
      id: "remaining",
      label: "المتبقي للهدف",
      value:
        activity.goalWeight == null
          ? "حدّد هدفك"
          : remaining > 0
            ? `${remaining} كجم`
            : "وصلت!",
      icon: "target",
      iconBg: "bg-[#FEF9C3]",
      iconColor: "text-[#CA8A04]",
    },
    {
      id: "streak",
      label: "سلسلة الإنجاز",
      value: `${input.streak}`,
      icon: "flame",
      iconBg: "bg-primary-soft",
      iconColor: "text-primary",
    },
    {
      id: "day",
      label: activity.daysIn > 0 ? `اليوم رقم ${activity.daysIn}` : "بداية الرحلة",
      value: `${progressPct}%`,
      icon: "calendar",
      iconBg: "bg-[#DBEAFE]",
      iconColor: "text-[#2563EB]",
    },
  ];
}

export function buildHealthScore(tasks: DailyTask[]): HealthScore {
  const actionable = tasks.filter((t) => t.id !== "calories");
  if (actionable.length === 0) return { score: 0, label: "ابدأ اليوم" };

  let earned = 0;
  for (const task of actionable) {
    if (task.status === "done") earned += 1;
    else if (task.status === "progress" && task.progress) {
      earned += task.progress.current / task.progress.total;
    }
  }

  const score = Math.round((earned / actionable.length) * 100);
  let label = "ابدأ الآن";
  if (score >= 85) label = "ممتاز";
  else if (score >= 60) label = "جيد جداً";
  else if (score >= 35) label = "استمر";
  else if (score > 0) label = "بداية جيدة";

  return { score, label };
}

export function buildFeaturedForGoal(goal: UserGoal, date = new Date()): FeaturedContentItem[] {
  const dayIndex = dayOfYear(date);
  const matching = CONTENT_LIBRARY.filter((item) => item.goals.includes(goal));

  const categories = [
    "جديد لك",
    "وصفة اليوم",
    "تمرين إضافي",
    "معلومة اليوم",
    "تحدي الأسبوع",
  ] as const;

  const selected: FeaturedContentItem[] = [];
  for (let i = 0; i < categories.length; i++) {
    const category = categories[(dayIndex + i) % categories.length];
    const pool = matching.filter((item) => item.category === category);
    if (pool.length === 0) continue;
    selected.push(pool[dayIndex % pool.length]);
    if (selected.length >= 4) break;
  }

  if (selected.length < 3) {
    for (const item of matching) {
      if (selected.some((s) => s.id === item.id)) continue;
      selected.push(item);
      if (selected.length >= 4) break;
    }
  }

  return selected;
}

export function resolveNextMissionFromTasks(tasks: DailyTask[]): NextMission {
  const unlockedIncomplete = tasks.filter((t) => t.status !== "done");

  const priority = [
    "workout",
    "nutrition",
    "water",
    "weight",
    "calories",
    "recipe",
    "challenge",
  ] as const;

  for (const id of priority) {
    const task = unlockedIncomplete.find((t) => t.id === id);
    if (!task) continue;

    const reward =
      task.id === "workout"
        ? HAKIM_POINTS_REWARDS.workout
        : task.id === "nutrition"
          ? HAKIM_POINTS_REWARDS.nutrition
          : task.id === "water"
            ? HAKIM_POINTS_REWARDS.water
            : task.id === "weight" || task.id === "measurements"
              ? HAKIM_POINTS_REWARDS.measurements
              : task.id === "challenge"
                ? HAKIM_POINTS_REWARDS.challenge
                : 15;

    return {
      id: task.id,
      title: `الخطوة التالية: ${task.title}`,
      pointsReward: reward,
      href: task.href,
    };
  }

  return {
    id: "done",
    title: "أحسنت — مهام اليوم مكتملة. حافظ على سلسلتك غداً.",
    pointsReward: 0,
    href: "/app/achievements",
  };
}

/** Whether home should show the primary Activate CTA after tasks. */
export function shouldShowActivateCta(tier: MembershipTier, isPaid: boolean): boolean {
  return !isPaid && tier !== "admin";
}

/* ── Home Dashboard v2 (CEO-approved layout) ───────────────────────────── */

export type DailySnapshotItem = {
  id: "workout" | "nutrition" | "water" | "weight";
  title: string;
  value: string;
  goalText: string;
  statusText: string;
  complete: boolean;
  subtitle: string;
  progress: number;
  href?: string;
  actionLabel: string;
  icon: "workout" | "nutrition" | "water" | "weight";
  iconBg: string;
  iconColor: string;
  valueColor: string;
  progressColor: string;
  showProgressBar: boolean;
};

export type HeroState = {
  greeting: string;
  subtext: string;
  goalTitle: string;
  overallProgress: number;
  motivation: string;
  isFirstVisit: boolean;
  streak: number;
  hakimPoints: number;
  remainingKg: number | null;
  heroImage: HeroGoalImage;
};

export type NextSessionKind = "workout" | "meal" | "rest" | "done";

export type NextSessionState = {
  kind: NextSessionKind;
  eyebrow: string;
  title: string;
  meta: string;
  href: string;
  cta: string | null;
};

export type StreakWeekDay = {
  key: string;
  label: string;
  state: "done" | "today" | "future";
};

export type LastAchievementState = {
  title: string;
  subtitle: string;
  hasAchievement: boolean;
};

export type DiscoverState = {
  id: string;
  type: "article" | "video" | "tip";
  badge: string;
  title: string;
  description: string;
  href: string;
  showPlay: boolean;
};

export type DiscoverPreviewItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  image: FeaturedContentItem["image"];
  badge?: string;
  badgeTone?: "article" | "recipe" | "workout";
  showPlay?: boolean;
  showSparkle?: boolean;
};

/** Home discover row — starts with 3 cards; add items to enable smooth horizontal scroll. */
export function buildDiscoverPreviewItems(_goal: UserGoal, _date = new Date()): DiscoverPreviewItem[] {
  const defaults: DiscoverPreviewItem[] = [
    {
      id: "discover-article",
      title: "كيف تحافظ على التزامك؟",
      description: "7 دقائق",
      href: "/app/discover",
      image: "tip",
      badge: "مقال",
      badgeTone: "article",
    },
    {
      id: "discover-recipes",
      title: "سلطة بروتين الدجاج",
      description: "5 دقائق",
      href: "/app/discover",
      image: "recipe",
      badge: "وصفة",
      badgeTone: "recipe",
    },
    {
      id: "discover-home-workout",
      title: "تمرين ظهر كامل",
      description: "20 دقيقة",
      href: "/app/discover",
      image: "workout",
      badge: "تمرين",
      badgeTone: "workout",
      showPlay: true,
    },
  ];

  return defaults;
}

const WEEKDAY_FULL_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

export function buildStreakWeek(streak: number, date = new Date()): StreakWeekDay[] {
  const days: StreakWeekDay[] = [];

  for (let offset = 0; offset >= -6; offset -= 1) {
    const dayDate = new Date(date);
    dayDate.setHours(12, 0, 0, 0);
    dayDate.setDate(dayDate.getDate() + offset);
    const dayIndex = dayDate.getDay();
    const isToday = offset === 0;

    let state: StreakWeekDay["state"] = "future";
    if (isToday) {
      state = streak > 0 ? "today" : "future";
    } else if (streak > Math.abs(offset)) {
      state = "done";
    }

    days.push({
      key: dayDate.toISOString().slice(0, 10),
      label: isToday ? "اليوم" : WEEKDAY_FULL_AR[dayIndex]!,
      state,
    });
  }

  return days;
}

const ACHIEVEMENT_SEED = {
  title: "أحسنت!",
  subtitle: "أكملت أول تمرين بنجاح",
};

function readFirstVisit(): boolean {
  if (typeof window === "undefined") return false;
  const key = "hakim_platform_home_seen_v1";
  if (localStorage.getItem(key)) return false;
  localStorage.setItem(key, "1");
  return true;
}

export function goalTitle(goal: UserGoal): string {
  if (goal === "bulk") return "تضخيم العضلات";
  if (goal === "fitness") return "تحسين اللياقة";
  return "خسارة الدهون";
}

export function buildHeroState(input: {
  displayName: string;
  goal: UserGoal;
  streak: number;
  hakimPoints: number;
  heroImage: HeroGoalImage;
  activity?: PlatformActivitySnapshot;
  date?: Date;
}): HeroState {
  const activity = input.activity ?? getEmptyActivitySnapshot();
  const isFirstVisit = readFirstVisit();
  const remainingKg =
    activity.currentWeight != null && activity.goalWeight != null
      ? Math.max(
          0,
          Math.round(Math.abs(activity.currentWeight - activity.goalWeight) * 10) / 10,
        )
      : null;

  return {
    greeting: buildTimeGreeting(input.displayName, input.date),
    subtext: isFirstVisit
      ? "مرحباً بك في منصتك الشخصية — لنبدأ رحلتك اليوم."
      : "خطتك اليومية جاهزة",
    goalTitle: goalTitle(input.goal),
    overallProgress: activity.overallProgressPct,
    motivation: "كل خطوة اليوم تقربك من هدفك",
    isFirstVisit,
    streak: input.streak,
    hakimPoints: input.hakimPoints,
    remainingKg,
    heroImage: input.heroImage,
  };
}

export function buildDailySnapshot(input: {
  features: MembershipFeatures;
  activity?: PlatformActivitySnapshot;
  date?: Date;
}): DailySnapshotItem[] {
  const activity = input.activity ?? getEmptyActivitySnapshot();
  const tasks = buildDailyTasks(input);
  const workoutTask = tasks.find((t) => t.id === "workout");

  const mealsDone = activity.mealsDone;
  const mealsTotal = activity.mealsTotal;
  const workoutDone = activity.workoutDone;
  const workoutTotal = activity.workoutTotal;
  const nutritionProgress = mealsTotal ? Math.round((mealsDone / mealsTotal) * 100) : 0;
  const workoutProgress = workoutTotal ? Math.round((workoutDone / workoutTotal) * 100) : 0;
  const caloriesGoal = 2200;
  const caloriesUsed = mealsTotal ? Math.round((mealsDone / mealsTotal) * caloriesGoal) : 0;
  const currentWeight = activity.currentWeight;
  const goalWeight = activity.goalWeight;
  const startWeight = activity.startWeight;
  const weightSpan =
    startWeight != null && goalWeight != null ? Math.abs(startWeight - goalWeight) : 0;
  const weightDone =
    startWeight != null && currentWeight != null ? Math.abs(startWeight - currentWeight) : 0;
  const weightProgress = weightSpan ? Math.min(100, Math.round((weightDone / weightSpan) * 100)) : 0;

  /* RTL 2×2: يمين أعلى تمرين، يساره ماء، أسفل يمين تغذية، يسارها وزن */
  return [
    {
      id: "workout",
      title: "التمرين",
      value: String(workoutDone),
      goalText: `/ ${workoutTotal} تمرين`,
      statusText: workoutProgress >= 100 ? "أحسنت، أكملت تمرينك" : "ابدأ تمرين اليوم",
      complete: workoutTotal > 0 && workoutProgress >= 100,
      subtitle: workoutTask?.subtitle ?? WORKOUT_DAY_SEED.title,
      progress: workoutProgress,
      href: "/app/program/workout",
      actionLabel: "متابعة",
      icon: "workout",
      iconBg: "bg-[#FFEDD5]",
      iconColor: "text-[#FF6B00]",
      valueColor: "#FF6B00",
      progressColor: "#FF6B00",
      showProgressBar: true,
    },
    {
      id: "water",
      title: "الماء",
      value: "—",
      goalText: "هدف اليوم",
      statusText: "اضغط للتسجيل",
      complete: false,
      subtitle: "اضغط للتسجيل",
      progress: 0,
      href: "/app",
      actionLabel: "تسجيل الماء",
      icon: "water",
      iconBg: "bg-[#EFF6FF]",
      iconColor: "text-[#2563EB]",
      valueColor: "#2563EB",
      progressColor: "#FF6B00",
      showProgressBar: true,
    },
    {
      id: "nutrition",
      title: "التغذية",
      value: caloriesUsed.toLocaleString("en-US"),
      goalText: `/ ${caloriesGoal.toLocaleString("en-US")} سعرة`,
      statusText: nutritionProgress >= 100 ? "أحسنت، أكملت وجباتك" : "سجّل وجباتك اليوم",
      complete: mealsTotal > 0 && nutritionProgress >= 100,
      subtitle: "سعرات اليوم",
      progress: nutritionProgress,
      href: "/app/nutrition",
      actionLabel: "سجّل وجبة",
      icon: "nutrition",
      iconBg: "bg-[#DCFCE7]",
      iconColor: "text-[#22C55E]",
      valueColor: "#FF6B00",
      progressColor: "#FF6B00",
      showProgressBar: true,
    },
    {
      id: "weight",
      title: "الوزن",
      value: currentWeight != null ? String(currentWeight) : "—",
      goalText: goalWeight != null ? `/ ${goalWeight} كغ` : "سجّل وزنك",
      statusText: currentWeight != null ? "تابع تقدمك" : "سجّل وزنك اليوم",
      complete: false,
      subtitle: "الوزن الحالي",
      progress: weightProgress,
      href: "/app/progress",
      actionLabel: "تحديث الوزن",
      icon: "weight",
      iconBg: "bg-[#FFEDD5]",
      iconColor: "text-[#FF6B00]",
      valueColor: "#FF6B00",
      progressColor: "#FF6B00",
      showProgressBar: true,
    },
  ];
}

export function buildNextSession(input: {
  features: MembershipFeatures;
  activity?: PlatformActivitySnapshot;
  date?: Date;
}): NextSessionState {
  const activity = input.activity ?? getEmptyActivitySnapshot();
  const date = input.date ?? new Date();
  const plan = resolveWeekdayPlan(getWeekdayIdFromDate(date), input.features.workout_program);
  const workoutDone = activity.workoutDone >= activity.workoutTotal && activity.workoutTotal > 0;
  const nextMeal = MEALS_SEED[activity.mealsDone];

  if (input.features.workout_program && !plan.isRestDay && !workoutDone) {
    const exerciseCount = plan.prescriptions.length;
    return {
      kind: "workout",
      eyebrow: "تمرين اليوم",
      title: plan.muscleTitle,
      meta: `${plan.durationMin} دقيقة · ${exerciseCount} ${exerciseCount === 1 ? "تمرين" : "تمارين"}`,
      href: "/app/program/workout",
      cta: "ابدأ الآن",
    };
  }

  if (nextMeal && activity.mealsDone < activity.mealsTotal) {
    const hasDish = Boolean(nextMeal.meta) && nextMeal.meta !== "لم يُسجّل بعد";
    return {
      kind: "meal",
      eyebrow: "وجبتك التالية",
      title: hasDish ? `${nextMeal.name} — ${nextMeal.meta}` : nextMeal.name,
      meta: nextMeal.kcal > 0 ? `${nextMeal.kcal} سعرة` : nextMeal.meta,
      href: "/app/nutrition",
      cta: "ابدأ الآن",
    };
  }

  if (plan.isRestDay && input.features.workout_program) {
    return {
      kind: "rest",
      eyebrow: "اليوم",
      title: "يوم راحة",
      meta: "استشفِ عضلاتك — عُد أقوى غداً",
      href: "/app/program/workout",
      cta: null,
    };
  }

  return {
    kind: "done",
    eyebrow: "اليوم",
    title: "أحسنت — اكتملت خطتك",
    meta: "حافظ على سلسلتك غداً",
    href: "/app/progress",
    cta: null,
  };
}

export function buildLastAchievement(activity: PlatformActivitySnapshot): LastAchievementState {
  if (!activity.hasAchievement) {
    return {
      title: "ابدأ سلسلتك",
      subtitle: "أكمل أول مهمة اليوم لفتح أول إنجاز لك.",
      hasAchievement: false,
    };
  }
  return {
    title: activity.lastAchievementTitle || ACHIEVEMENT_SEED.title,
    subtitle: activity.lastAchievementSubtitle || ACHIEVEMENT_SEED.subtitle,
    hasAchievement: true,
  };
}

export function buildDiscoverItem(goal: UserGoal, date = new Date()): DiscoverState | null {
  const featured = buildFeaturedForGoal(goal, date);
  const item = featured[0];
  if (!item) return null;

  const type: DiscoverState["type"] = item.showPlay ? "video" : item.category.includes("معلومة") ? "tip" : "article";

  return {
    id: item.id,
    type,
    badge: item.badge ?? (type === "video" ? "فيديو" : type === "tip" ? "نصيحة" : "مقال جديد"),
    title: item.title,
    description: item.subtitle,
    href: item.href,
    showPlay: Boolean(item.showPlay),
  };
}
