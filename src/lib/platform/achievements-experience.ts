import {
  HAKIM_POINTS_LABEL,
  HAKIM_POINTS_REWARDS,
  formatHakimPoints,
} from "@/lib/platform/daily-motivation";
import type { PlatformActivitySnapshot } from "@/lib/platform/platform-activity";
import {
  buildProgressDashboard,
  resolveProgressLevel,
} from "@/lib/platform/progress-experience";
import { getRecentActivityEvents, type ActivityEvent } from "@/lib/platform/progress-storage";

export type AchievementsTab = "badges" | "challenges" | "points";

export type BadgeFamily =
  | "all"
  | "commitment"
  | "training"
  | "nutrition"
  | "water"
  | "progress"
  | "challenges";

export type JourneyNodeStatus = "completed" | "current" | "upcoming" | "locked" | "mystery";

export type JourneyNode = {
  id: string;
  family: Exclude<BadgeFamily, "all">;
  status: JourneyNodeStatus;
  title: string;
  subtitle: string;
  description: string;
  current?: number;
  target?: number;
  remainingLabel?: string;
  rewardPoints: number;
  unlockedAt?: string | null;
};

export type ChallengeCardModel = {
  id: string;
  title: string;
  current: number;
  target: number;
  remainingLabel: string;
  rewardPoints: number;
  completed: boolean;
  href: string;
  kind: "workout" | "water" | "commitment" | "nutrition";
};

export type PointsHistoryRow = {
  id: string;
  when: string;
  title: string;
  points: number;
};

export const BADGE_FAMILIES: { id: BadgeFamily; label: string }[] = [
  { id: "commitment", label: "الالتزام" },
  { id: "training", label: "التدريب" },
  { id: "nutrition", label: "التغذية" },
  { id: "water", label: "الماء" },
  { id: "progress", label: "التقدم" },
  { id: "challenges", label: "التحديات" },
];

export const ACHIEVEMENTS_TABS: { id: AchievementsTab; label: string }[] = [
  { id: "badges", label: "الشارات" },
  { id: "challenges", label: "التحديات" },
  { id: "points", label: "كسب النقاط" },
];

export const HOW_TO_EARN_ROWS = [
  { id: "workout", label: "إكمال تمرين", value: `+${HAKIM_POINTS_REWARDS.workout}` },
  { id: "water", label: "تحقيق هدف الماء", value: `+${HAKIM_POINTS_REWARDS.water}` },
  { id: "measurements", label: "تسجيل قياس جديد", value: `+${HAKIM_POINTS_REWARDS.measurements}` },
  { id: "challenge", label: "إنهاء تحدٍ", value: `+${HAKIM_POINTS_REWARDS.challenge}` },
  { id: "achievement", label: "تحقيق معلم", value: `+${HAKIM_POINTS_REWARDS.achievement}` },
] as const;

function countWorkouts(userId: string) {
  let count = 0;
  if (typeof window === "undefined") return count;
  try {
    const raw = localStorage.getItem(`hakim_platform_activity_v1:${userId}`);
    if (!raw) return count;
    const parsed = JSON.parse(raw) as { daily?: Record<string, { workoutCompleted?: boolean }> };
    for (const log of Object.values(parsed.daily ?? {})) {
      if (log.workoutCompleted) count += 1;
    }
  } catch {
    /* ignore */
  }
  return count;
}

function remainingLabel(current: number, target: number, unit: "يوم" | "تمرين" | "يوم ماء") {
  const left = Math.max(target - current, 0);
  if (left === 0) return "مكتمل";
  if (unit === "يوم") return left === 1 ? "تبقى لك يوم واحد" : `تبقى لك ${left} أيام`;
  if (unit === "تمرين") return left === 1 ? "تبقى لك تمرين واحد" : `تبقى لك ${left} تمارين`;
  return left === 1 ? "تبقى لك يوم ماء واحد" : `تبقى لك ${left} أيام ماء`;
}

function relativeWhen(iso: string, dateKey: string) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  if (dateKey === today) return "اليوم";
  if (dateKey === yesterdayKey) return "أمس";
  const created = new Date(iso);
  const diff = Math.max(1, Math.round((Date.now() - created.getTime()) / 86_400_000));
  if (diff <= 6) return `قبل ${diff} أيام`;
  return created.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
}

function markStatuses(nodes: Omit<JourneyNode, "status">[]): JourneyNode[] {
  const drafted = nodes.map((node) => {
    if (node.id.startsWith("mystery")) return { ...node, status: "mystery" as const };
    const done = Boolean(node.target && (node.current ?? 0) >= node.target);
    return { ...node, status: done ? ("completed" as const) : ("upcoming" as const) };
  });
  const currentIndex = drafted.findIndex((node) => node.status === "upcoming");
  return drafted.map((node, index) => {
    if (node.status === "completed" || node.status === "mystery") return node;
    if (index === currentIndex) return { ...node, status: "current" };
    if (index === currentIndex + 1) return { ...node, status: "upcoming" };
    return { ...node, status: "locked" };
  });
}

function buildFamilyNodes(
  family: Exclude<BadgeFamily, "all">,
  input: {
    streak: number;
    bestStreak: number;
    workouts: number;
    waterDays: number;
    hasActivity: boolean;
    hasWeight: boolean;
    nutritionPerfect: boolean;
    weeklyWorkout: { current: number; target: number };
    weeklyWater: { current: number; target: number };
  },
): JourneyNode[] {
  const { streak, bestStreak, workouts, waterDays, hasActivity, hasWeight, nutritionPerfect, weeklyWorkout, weeklyWater } =
    input;

  if (family === "commitment") {
    const start = hasActivity || streak > 0 ? 1 : 0;
    return markStatuses([
      {
        id: "start",
        family,
        title: "البداية",
        subtitle: "أول يوم",
        description: "أكمل أول نشاط حقيقي في برنامجك.",
        current: start,
        target: 1,
        remainingLabel: start ? "مكتمل" : "ابدأ اليوم",
        rewardPoints: HAKIM_POINTS_REWARDS.achievement,
      },
      {
        id: "streak-7",
        family,
        title: "أسبوع متواصل",
        subtitle: "7 أيام",
        description: "حافظ على سلسلتك لمدة أسبوع كامل.",
        current: Math.min(bestStreak, 7),
        target: 7,
        remainingLabel: remainingLabel(Math.min(streak, 7), 7, "يوم"),
        rewardPoints: 150,
      },
      {
        id: "streak-30",
        family,
        title: "30 يوماً متتالياً",
        subtitle: `${Math.min(streak, 30)} / 30`,
        description: "التزم ببرنامجك لمدة 30 يوماً.",
        current: Math.min(streak, 30),
        target: 30,
        remainingLabel: remainingLabel(Math.min(streak, 30), 30, "يوم"),
        rewardPoints: 300,
      },
      {
        id: "streak-60",
        family,
        title: "60 يوماً من الالتزام",
        subtitle: "قريباً",
        description: "سلسلة أطول تكشف بعد وصولك إلى 30 يوماً.",
        current: Math.min(bestStreak, 60),
        target: 60,
        remainingLabel: remainingLabel(Math.min(bestStreak, 60), 60, "يوم"),
        rewardPoints: 500,
      },
      {
        id: "mystery-commitment",
        family,
        title: "إنجاز سري",
        subtitle: "قريباً",
        description: "واصل الالتزام لفتح هذا المعلم.",
        rewardPoints: HAKIM_POINTS_REWARDS.achievement,
      },
    ]);
  }

  if (family === "training") {
    return markStatuses([
      {
        id: "first-workout",
        family,
        title: "أول تمرين",
        subtitle: workouts > 0 ? "مكتمل" : "ابدأ حصتك",
        description: "أكمل أول حصة تدريب داخل التطبيق.",
        current: workouts > 0 ? 1 : 0,
        target: 1,
        remainingLabel: workouts > 0 ? "مكتمل" : "تبقى لك تمرين واحد",
        rewardPoints: HAKIM_POINTS_REWARDS.workout,
      },
      {
        id: "workouts-25",
        family,
        title: "25 تمريناً",
        subtitle: `${Math.min(workouts, 25)} / 25`,
        description: "ابنِ إيقاعاً ثابتاً عبر 25 حصة.",
        current: Math.min(workouts, 25),
        target: 25,
        remainingLabel: remainingLabel(Math.min(workouts, 25), 25, "تمرين"),
        rewardPoints: 200,
      },
      {
        id: "workouts-50",
        family,
        title: "50 تمريناً",
        subtitle: `${Math.min(workouts, 50)} / 50`,
        description: "خمسون حصة تعني عادة راسخة.",
        current: Math.min(workouts, 50),
        target: 50,
        remainingLabel: remainingLabel(Math.min(workouts, 50), 50, "تمرين"),
        rewardPoints: 300,
      },
      {
        id: "workouts-100",
        family,
        title: "100 تمرين",
        subtitle: `${Math.min(workouts, 100)} / 100`,
        description: "معلم كبير في رحلة التدريب.",
        current: Math.min(workouts, 100),
        target: 100,
        remainingLabel: remainingLabel(Math.min(workouts, 100), 100, "تمرين"),
        rewardPoints: 500,
      },
      {
        id: "mystery-training",
        family,
        title: "إنجاز سري",
        subtitle: "قريباً",
        description: "يظهر بعد تقدمك في التمارين.",
        rewardPoints: HAKIM_POINTS_REWARDS.achievement,
      },
    ]);
  }

  if (family === "nutrition") {
    return markStatuses([
      {
        id: "nutrition-week",
        family,
        title: "أسبوع غذائي",
        subtitle: nutritionPerfect ? "مكتمل" : "التزم بالوجبات",
        description: "التزم بوجباتك لأسبوع كامل.",
        current: nutritionPerfect ? 1 : 0,
        target: 1,
        remainingLabel: nutritionPerfect ? "مكتمل" : "أكمل أسبوعك الغذائي",
        rewardPoints: HAKIM_POINTS_REWARDS.nutrition,
      },
      {
        id: "mystery-nutrition",
        family,
        title: "إنجاز سري",
        subtitle: "قريباً",
        description: "يُكشف مع ثبات التغذية.",
        rewardPoints: HAKIM_POINTS_REWARDS.achievement,
      },
    ]);
  }

  if (family === "water") {
    return markStatuses([
      {
        id: "water-week",
        family,
        title: "هدف الماء هذا الأسبوع",
        subtitle: `${weeklyWater.current} / ${weeklyWater.target}`,
        description: "حقق هدف الماء لأيام الأسبوع.",
        current: weeklyWater.current,
        target: weeklyWater.target,
        remainingLabel: remainingLabel(weeklyWater.current, weeklyWater.target, "يوم ماء"),
        rewardPoints: HAKIM_POINTS_REWARDS.water,
      },
      {
        id: "water-30",
        family,
        title: "30 يوم ماء",
        subtitle: `${Math.min(waterDays, 30)} / 30`,
        description: "حقق هدف الماء 30 مرة.",
        current: Math.min(waterDays, 30),
        target: 30,
        remainingLabel: remainingLabel(Math.min(waterDays, 30), 30, "يوم ماء"),
        rewardPoints: 200,
      },
      {
        id: "mystery-water",
        family,
        title: "إنجاز سري",
        subtitle: "قريباً",
        description: "يظهر مع عادة الماء.",
        rewardPoints: HAKIM_POINTS_REWARDS.achievement,
      },
    ]);
  }

  if (family === "progress") {
    return markStatuses([
      {
        id: "first-measure",
        family,
        title: "أول قياس",
        subtitle: hasWeight ? "مكتمل" : "سجّل وزنك",
        description: "سجّل قياساً جديداً لتتبع تقدمك.",
        current: hasWeight ? 1 : 0,
        target: 1,
        remainingLabel: hasWeight ? "مكتمل" : "سجّل قياساً الآن",
        rewardPoints: HAKIM_POINTS_REWARDS.measurements,
      },
      {
        id: "first-program",
        family,
        title: "أول برنامج",
        subtitle: "قريباً",
        description: "يُفتح مع إكمال برنامجك الأول.",
        current: 0,
        target: 1,
        remainingLabel: "قريباً",
        rewardPoints: HAKIM_POINTS_REWARDS.achievement,
      },
      {
        id: "mystery-progress",
        family,
        title: "إنجاز سري",
        subtitle: "قريباً",
        description: "يُكشف مع قياساتك.",
        rewardPoints: HAKIM_POINTS_REWARDS.achievement,
      },
    ]);
  }

  return markStatuses([
    {
      id: "week-challenge",
      family,
      title: "تحدي الأسبوع",
      subtitle: `${weeklyWorkout.current} / ${weeklyWorkout.target}`,
      description: "أكمل تمارين هذا الأسبوع.",
      current: weeklyWorkout.current,
      target: weeklyWorkout.target,
      remainingLabel: remainingLabel(weeklyWorkout.current, weeklyWorkout.target, "تمرين"),
      rewardPoints: HAKIM_POINTS_REWARDS.challenge,
    },
    {
      id: "mystery-challenges",
      family,
      title: "إنجاز سري",
      subtitle: "قريباً",
      description: "أكمل تحدياتك لفتحه.",
      rewardPoints: HAKIM_POINTS_REWARDS.achievement,
    },
  ]);
}

function parseFraction(summary: string, fallbackTarget: number) {
  const match = summary.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return { current: 0, target: fallbackTarget };
  return { current: Number(match[1]), target: Number(match[2]) };
}

function challengeRemaining(current: number, target: number) {
  const left = Math.max(target - current, 0);
  if (left === 0) return "مكتمل";
  if (left === 1) return "متبقي يوم واحد";
  if (left === 2) return "متبقي يومان";
  return `متبقي ${left} أيام`;
}

function historyFromEvents(events: ActivityEvent[]): PointsHistoryRow[] {
  return events
    .filter((event) => (event.points ?? 0) > 0)
    .slice(0, 4)
    .map((event) => ({
      id: event.id,
      when: relativeWhen(event.createdAt, event.dateKey),
      title: event.title,
      points: event.points ?? 0,
    }));
}

export function buildAchievementsExperience(userId: string, snapshot: PlatformActivitySnapshot) {
  const dashboard = buildProgressDashboard(userId, snapshot);
  const workouts = countWorkouts(userId);
  const waterDays = dashboard.monthlySummary.waterDays;
  const nutritionPerfect = dashboard.achievements.some((item) => item.id === "nutrition-week" && item.unlocked);
  const workoutWeek = dashboard.weeklyCards.find((card) => card.id === "workout");
  const waterWeek = dashboard.weeklyCards.find((card) => card.id === "water");
  const weeklyWorkout = parseFraction(workoutWeek?.summary ?? "0 / 4", 4);
  const weeklyWater = parseFraction(waterWeek?.summary ?? "0 / 7", 7);
  const level = resolveProgressLevel(snapshot.hakimPoints);

  const familyInput = {
    streak: snapshot.activityStreak,
    bestStreak: snapshot.bestStreak,
    workouts,
    waterDays,
    hasActivity: snapshot.hasAnyActivity,
    hasWeight: snapshot.currentWeight != null,
    nutritionPerfect,
    weeklyWorkout,
    weeklyWater,
  };

  const nodesByFamily = Object.fromEntries(
    BADGE_FAMILIES.filter((family) => family.id !== "all").map((family) => [
      family.id,
      buildFamilyNodes(family.id as Exclude<BadgeFamily, "all">, familyInput),
    ]),
  ) as Record<Exclude<BadgeFamily, "all">, JourneyNode[]>;

  const allNodes = BADGE_FAMILIES.filter((family) => family.id !== "all").flatMap(
    (family) => nodesByFamily[family.id as Exclude<BadgeFamily, "all">],
  );
  const unlockedBadges = allNodes.filter((node) => node.status === "completed").length;

  const activeChallenges: ChallengeCardModel[] = dashboard.weeklyCards.slice(0, 4).map((card) => {
    const fraction = parseFraction(card.summary, card.id === "workout" ? 4 : 7);
    const current = card.id === "nutrition" || card.id === "commitment" ? Math.round((card.pct / 100) * 7) : fraction.current;
    const target = card.id === "nutrition" || card.id === "commitment" ? 7 : fraction.target;
    const completed = card.pct >= 100 || (target > 0 && current >= target);
    return {
      id: card.id,
      title:
        card.id === "workout"
          ? `${target} تمارين هذا الأسبوع`
          : card.id === "water"
            ? `هدف الماء ${target} أيام`
            : card.id === "nutrition"
              ? "التزام التغذية هذا الأسبوع"
              : "أيام الالتزام هذا الأسبوع",
      current: Math.min(current, target),
      target,
      remainingLabel: completed ? "اكتمل التحدي" : challengeRemaining(Math.min(current, target), target),
      rewardPoints:
        card.id === "workout"
          ? 100
          : card.id === "water"
            ? 75
            : card.id === "nutrition"
              ? HAKIM_POINTS_REWARDS.nutrition
              : 150,
      completed,
      href: card.id === "workout" ? "/app/program/workout" : card.id === "water" || card.id === "nutrition" ? "/app/nutrition" : "/app",
      kind: card.id,
    };
  });

  const completedChallenges = [
    ...activeChallenges.filter((item) => item.completed),
    ...dashboard.achievements
      .filter((item) => item.unlocked)
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.title,
        rewardPoints: HAKIM_POINTS_REWARDS.achievement,
      })),
  ].slice(0, 3);

  const history = historyFromEvents(getRecentActivityEvents(userId, 8));

  return {
    streak: snapshot.activityStreak,
    points: snapshot.hakimPoints,
    pointsLabel: HAKIM_POINTS_LABEL,
    pointsFormatted: formatHakimPoints(snapshot.hakimPoints),
    badgeCount: unlockedBadges,
    isEmpty: !snapshot.hasAnyActivity && snapshot.activityStreak === 0 && snapshot.hakimPoints === 0,
    level,
    nodesByFamily,
    allNodes,
    activeChallenges,
    completedChallenges,
    history,
  };
}

export type AchievementsExperienceModel = ReturnType<typeof buildAchievementsExperience>;
