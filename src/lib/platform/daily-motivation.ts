import type { DailyTaskSeed } from "@/lib/platform/seed-content";

/** Official platform currency — never label as plain «النقاط» in UI. */
export const HAKIM_POINTS_LABEL = "Hakim Points" as const;

export type NextMission = {
  id: string;
  title: string;
  pointsReward: number;
  href: string;
};

/** Points are earned by actions — never by login alone (CEO strategy). */
export const HAKIM_POINTS_REWARDS = {
  workout: 50,
  nutrition: 30,
  water: 10,
  measurements: 20,
  challenge: 40,
  achievement: 100,
} as const;

export function formatHakimPoints(value: number): string {
  return value.toLocaleString("en-US");
}

export function resolveStreakMotivation(streak: number): {
  title: string;
  message: string;
} {
  if (streak <= 0) {
    return {
      title: "ابدأ سلسلتك اليوم",
      message: "أكمل مهمة واحدة لتشعل سلسلة الإنجاز.",
    };
  }
  if (streak === 1) {
    return {
      title: "🔥 يوم واحد",
      message: "بداية قوية — عد غداً ولا تكسر السلسلة.",
    };
  }
  if (streak < 7) {
    return {
      title: `🔥 ${streak} أيام متتالية`,
      message: "استمر بهذا الأداء الرائع.",
    };
  }
  if (streak < 30) {
    return {
      title: `🔥 ${streak} يوماً متتالياً`,
      message: "إيقاع ممتاز — حافظ على السلسلة.",
    };
  }
  return {
    title: `🔥 ${streak} يوماً متتالياً`,
    message: "إنجاز رائع، لا تكسر السلسلة.",
  };
}

function missionFromTask(task: DailyTaskSeed): NextMission {
  const reward =
    task.id === "workout"
      ? HAKIM_POINTS_REWARDS.workout
      : task.id === "nutrition"
        ? HAKIM_POINTS_REWARDS.nutrition
        : task.id === "water"
          ? HAKIM_POINTS_REWARDS.water
          : task.id === "challenge"
            ? HAKIM_POINTS_REWARDS.challenge
            : HAKIM_POINTS_REWARDS.measurements;

  return {
    id: task.id,
    title: `الخطوة التالية: ${task.title}`,
    pointsReward: reward,
    href: task.href,
  };
}

/**
 * Picks the most important incomplete daily action as «المهمة التالية».
 * Extensible for challenges / achievements without redesigning the card.
 */
export function resolveNextMission(tasks: DailyTaskSeed[]): NextMission {
  const priority = ["workout", "nutrition", "water", "measurements"] as const;
  for (const id of priority) {
    const task = tasks.find((t) => t.id === id);
    if (task && task.status !== "done") return missionFromTask(task);
  }

  const fallback = tasks[0];
  if (fallback) {
    return {
      id: "complete",
      title: "أكمل جميع وجبات اليوم للحفاظ على سلسلة الإنجاز",
      pointsReward: HAKIM_POINTS_REWARDS.nutrition,
      href: fallback.href,
    };
  }

  return {
    id: "done",
    title: "أحسنت — مهام اليوم مكتملة. حافظ على سلسلتك غداً.",
    pointsReward: 0,
    href: "/app/achievements",
  };
}

export type DailyMotivationState = {
  streak: number;
  streakTitle: string;
  streakMessage: string;
  hakimPoints: number;
  nextMission: NextMission;
};

export function buildDailyMotivationState(
  streak: number,
  hakimPoints: number,
  tasks: DailyTaskSeed[],
): DailyMotivationState {
  const streakCopy = resolveStreakMotivation(streak);
  return {
    streak,
    streakTitle: streakCopy.title,
    streakMessage: streakCopy.message,
    hakimPoints,
    nextMission: resolveNextMission(tasks),
  };
}
