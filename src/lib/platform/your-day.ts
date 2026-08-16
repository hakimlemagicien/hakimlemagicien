import { TODAY_WORKOUT_PRESCRIPTIONS } from "@/lib/platform/today-workout";
import type { PlatformActivitySnapshot } from "@/lib/platform/platform-activity";
import { loadWorkoutProgress } from "@/lib/platform/workout-progress-storage";

export const YOUR_DAY_SCORE_MAX = {
  nutrition: 35,
  water: 20,
  workout: 25,
  activity: 20,
} as const;

export type YourDayTaskId = "nutrition" | "water" | "workout" | "activity";

export type YourDayTask = {
  id: YourDayTaskId;
  title: string;
  current: number;
  total: number;
  points: number;
  maxPoints: number;
  href?: string;
  actionLabel: string;
  actionKind: "link" | "water";
};

export type YourDayScore = {
  total: number;
  max: 100;
  label: string;
  tasks: YourDayTask[];
  nextTask: {
    label: string;
    href: string;
    actionKind: "link" | "water";
    cta: string;
  };
};

function ratioPoints(current: number, total: number, maxPoints: number) {
  if (total <= 0) return 0;
  return Math.round((Math.min(current, total) / total) * maxPoints);
}

function workoutDoneCount(): number {
  const progress = loadWorkoutProgress(TODAY_WORKOUT_PRESCRIPTIONS.length);
  if (!progress) return 0;
  return progress.filter((item) => item.status === "done").length;
}

export function buildYourDayScore(
  activity: PlatformActivitySnapshot,
  workoutCurrent = workoutDoneCount(),
): YourDayScore {
  const mealsTotal = Math.max(activity.mealsTotal, 1);
  const waterTotal = Math.max(activity.waterGoal, 1);
  const workoutTotal = Math.max(TODAY_WORKOUT_PRESCRIPTIONS.length, 1);

  const nutritionPoints = ratioPoints(activity.mealsDone, mealsTotal, YOUR_DAY_SCORE_MAX.nutrition);
  const waterPoints = ratioPoints(activity.waterGlasses, waterTotal, YOUR_DAY_SCORE_MAX.water);
  const workoutPoints = ratioPoints(workoutCurrent, workoutTotal, YOUR_DAY_SCORE_MAX.workout);
  const activityPoints = ratioPoints(
    nutritionPoints + waterPoints + workoutPoints,
    YOUR_DAY_SCORE_MAX.nutrition + YOUR_DAY_SCORE_MAX.water + YOUR_DAY_SCORE_MAX.workout,
    YOUR_DAY_SCORE_MAX.activity,
  );

  const tasks: YourDayTask[] = [
    {
      id: "nutrition",
      title: "التغذية",
      current: activity.mealsDone,
      total: mealsTotal,
      points: nutritionPoints,
      maxPoints: YOUR_DAY_SCORE_MAX.nutrition,
      href: "/app/nutrition",
      actionLabel: "فتح التغذية",
      actionKind: "link",
    },
    {
      id: "water",
      title: "الماء",
      current: activity.waterGlasses,
      total: waterTotal,
      points: waterPoints,
      maxPoints: YOUR_DAY_SCORE_MAX.water,
      actionLabel: "+ أضف كوباً",
      actionKind: "water",
    },
    {
      id: "workout",
      title: "التمرين",
      current: workoutCurrent,
      total: workoutTotal,
      points: workoutPoints,
      maxPoints: YOUR_DAY_SCORE_MAX.workout,
      href: "/app/program/workout",
      actionLabel: "عرض التمرين",
      actionKind: "link",
    },
    {
      id: "activity",
      title: "النشاط اليومي",
      current: activityPoints,
      total: YOUR_DAY_SCORE_MAX.activity,
      points: activityPoints,
      maxPoints: YOUR_DAY_SCORE_MAX.activity,
      href: "/app/progress",
      actionLabel: "عرض النشاط",
      actionKind: "link",
    },
  ];

  const total = nutritionPoints + waterPoints + workoutPoints + activityPoints;
  const incomplete = tasks.find((task) => task.id !== "activity" && task.current < task.total);

  let nextTask: YourDayScore["nextTask"];
  if (!incomplete) {
    nextTask = {
      label: "أحسنت، أكملت مهام اليوم",
      href: "/app",
      actionKind: "link",
      cta: "الرئيسية",
    };
  } else if (incomplete.id === "workout") {
    nextTask = {
      label: "مهمتك التالية: أكمل تمرين اليوم",
      href: "/app/program/workout",
      actionKind: "link",
      cta: "ابدأ",
    };
  } else if (incomplete.id === "nutrition") {
    nextTask = {
      label: "مهمتك التالية: أكمل وجبات اليوم",
      href: "/app/nutrition",
      actionKind: "link",
      cta: "ابدأ",
    };
  } else {
    nextTask = {
      label: "مهمتك التالية: أكمل هدف الماء",
      href: "/app/program",
      actionKind: "water",
      cta: "ابدأ",
    };
  }

  return {
    total,
    max: 100,
    label: total >= 70 ? "على المسار الصحيح" : total >= 40 ? "بداية جيدة" : "ابدأ بخطوة واحدة",
    tasks,
    nextTask,
  };
}

export function formatYourDayDate(date = new Date()): string {
  return new Intl.DateTimeFormat("ar", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}
