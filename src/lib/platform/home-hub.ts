import type { MembershipFeatures, MembershipTier } from "@/lib/platform/membership";
import {
  HAKIM_POINTS_REWARDS,
  type NextMission,
} from "@/lib/platform/daily-motivation";
import { PROGRESS_SEED, WATER_SEED } from "@/lib/platform/seed-content";

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
    href: "/app/water",
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
    href: "/app/program",
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
  return "أهلاً";
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
  dayIndex: number,
): DailyTask {
  if (def.id === "water") {
    const done = WATER_SEED.current >= WATER_SEED.goal;
    return {
      ...def,
      title: "شرب الماء",
      subtitle: done ? "أحسنت — هدفت اليوم مكتمل" : "أكمل 2 لتر اليوم",
      status: done ? "done" : "progress",
      progress: { current: WATER_SEED.current, total: WATER_SEED.goal },
    };
  }
  if (def.id === "weight") {
    return {
      ...def,
      title: "تسجيل الوزن",
      subtitle: `آخر وزن: ${PROGRESS_SEED.currentWeight} كجم`,
      status: dayIndex % 3 === 0 ? "done" : "arrow",
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
  date?: Date;
}): DailyTask[] {
  const dayIndex = dayOfYear(input.date);
  const rotation = dayIndex % 3;

  const freeCore = FREE_ALWAYS_TASK_DEFS.map((def) => hydrateFreeTask(def, dayIndex));

  const water = freeCore.find((t) => t.id === "water")!;
  const weight = freeCore.find((t) => t.id === "weight")!;
  const calories = freeCore.find((t) => t.id === "calories")!;

  const canWorkout = input.features.workout_program;
  const canNutrition = input.features.nutrition_plan;
  const workout = { ...PAID_TASK_POOL[0] };
  const nutrition = { ...PAID_TASK_POOL[1] };

  if (canWorkout || canNutrition) {
    const paid: DailyTask[] = [];
    if (canWorkout) paid.push({ ...workout, status: rotation === 1 ? "done" : "arrow" });
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
  date?: Date;
}): MessageOfDay {
  const firstName = input.displayName.trim().split(/\s+/)[0] || "بطل";
  const greeting = `${greetingPrefix(input.date)} ${firstName} 👋`;
  const remaining = Math.max(
    0,
    Math.round((PROGRESS_SEED.currentWeight - PROGRESS_SEED.goalWeight) * 10) / 10,
  );
  const dayIndex = dayOfYear(input.date);

  const bodies = [
    remaining > 0
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
}): QuickGlanceItem[] {
  const remaining = Math.max(
    0,
    Math.round((PROGRESS_SEED.currentWeight - PROGRESS_SEED.goalWeight) * 10) / 10,
  );
  const totalToLose = Math.max(PROGRESS_SEED.startWeight - PROGRESS_SEED.goalWeight, 0.1);
  const lostSoFar = PROGRESS_SEED.startWeight - PROGRESS_SEED.currentWeight;
  const progressPct = Math.min(Math.max(Math.round((lostSoFar / totalToLose) * 100), 0), 100);

  return [
    {
      id: "weight",
      label: "الوزن الحالي",
      value: `${PROGRESS_SEED.currentWeight} كجم`,
      icon: "scale",
      iconBg: "bg-secondary-soft",
      iconColor: "text-success",
    },
    {
      id: "remaining",
      label: "المتبقي للهدف",
      value: remaining > 0 ? `${remaining} كجم` : "وصلت!",
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
      label: `اليوم رقم ${PROGRESS_SEED.daysIn}`,
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
