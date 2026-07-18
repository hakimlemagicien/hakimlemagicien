import { HAKIM_POINTS_REWARDS } from "@/lib/platform/daily-motivation";
import { NUTRITION_MEAL_SLOTS } from "@/lib/platform/nutrition-experience";
import { readNutritionPlanStore } from "@/lib/platform/nutrition-plan-storage";
import type { PlatformActivitySnapshot } from "@/lib/platform/platform-activity";
import {
  getActivityEvents,
  getBodyMeasurementHistory,
  getBodyMeasurements,
  getPhotoSessions,
  getRecentActivityEvents,
  type ActivityEvent,
  type BodyMeasurementKey,
  type TransformationPhotoSession,
} from "@/lib/platform/progress-storage";
import { getWaterDayState } from "@/lib/platform/water-storage";

const WEEKLY_WORKOUT_TARGET = 4;
const LEVEL_STEP = 1000;

export type ProgressLevel = {
  level: number;
  currentPoints: number;
  pointsToNext: number;
  progressPct: number;
};

export type WeeklyProgressCard = {
  id: "workout" | "nutrition" | "water" | "commitment";
  label: string;
  pct: number;
  summary: string;
  icon: string;
};

export type JourneyStat = {
  id: string;
  label: string;
  value: string;
  icon: string;
};

export type BodyProgressItem = {
  key: BodyMeasurementKey;
  label: string;
  unit: string;
  current: number | null;
  previous: number | null;
  updatedAt: string | null;
  recorded: boolean;
};

export type AchievementItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progressLabel?: string;
};

export type MonthlySummaryData = {
  monthLabel: string;
  partial: boolean;
  workouts: number;
  meals: number;
  waterDays: number;
  activeDays: number;
  points: number;
  bestWeekLabel: string;
  bestDayLabel: string;
  topAchievement: string | null;
};

export type ProgressDashboardData = {
  level: ProgressLevel;
  weeklyAchievementPct: number;
  weeklyMotivation: string;
  todayEvents: ActivityEvent[];
  weeklyCards: WeeklyProgressCard[];
  journeyStats: JourneyStat[];
  bodyItems: BodyProgressItem[];
  photoSessions: TransformationPhotoSession[];
  achievements: AchievementItem[];
  monthlySummary: MonthlySummaryData;
};

function dateKeysForWeek(date = new Date()) {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(date);
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

function monthKeys(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const keys: string[] = [];
  const cursor = new Date(y, m, 1);
  while (cursor.getMonth() === m) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

export function resolveProgressLevel(points: number): ProgressLevel {
  const level = Math.floor(points / LEVEL_STEP) + 1;
  const floor = (level - 1) * LEVEL_STEP;
  const ceiling = level * LEVEL_STEP;
  const progressPct = Math.round(((points - floor) / (ceiling - floor)) * 100);
  return {
    level,
    currentPoints: points,
    pointsToNext: ceiling - points,
    progressPct: Number.isFinite(progressPct) ? progressPct : 0,
  };
}

function readPlatformDaily(userId: string, dateKey: string) {
  if (typeof window === "undefined") {
    return { mealsDone: 0, workoutCompleted: false, weightKg: null as number | null };
  }
  try {
    const raw = localStorage.getItem(`hakim_platform_activity_v1:${userId}`);
    if (!raw) return { mealsDone: 0, workoutCompleted: false, weightKg: null };
    const parsed = JSON.parse(raw) as { daily?: Record<string, { mealsDone?: number; workoutCompleted?: boolean; weightKg?: number | null }> };
    const log = parsed.daily?.[dateKey];
    return {
      mealsDone: log?.mealsDone ?? 0,
      workoutCompleted: Boolean(log?.workoutCompleted),
      weightKg: log?.weightKg ?? null,
    };
  } catch {
    return { mealsDone: 0, workoutCompleted: false, weightKg: null };
  }
}

function nutritionCommitmentForDay(userId: string, dateKey: string) {
  const store = readNutritionPlanStore(userId);
  const statuses = store.mealStatus[dateKey] ?? {};
  let completed = 0;
  for (const slot of NUTRITION_MEAL_SLOTS) {
    if (statuses[slot.id] === "completed") completed += 1;
  }
  return Math.round((completed / NUTRITION_MEAL_SLOTS.length) * 100);
}

function buildWeeklyCards(userId: string, date = new Date()): WeeklyProgressCard[] {
  const weekKeys = dateKeysForWeek(date);
  let workoutsDone = 0;
  let nutritionTotal = 0;
  let waterDays = 0;
  let commitmentTotal = 0;

  for (const dateKey of weekKeys) {
    const daily = readPlatformDaily(userId, dateKey);
    if (daily.workoutCompleted) workoutsDone += 1;

    const nutritionPct = nutritionCommitmentForDay(userId, dateKey);
    nutritionTotal += nutritionPct;

    const water = getWaterDayState(userId, dateKey);
    const waterHit = water.totalMl >= water.goalMl && water.goalMl > 0;
    if (waterHit) waterDays += 1;

    const workoutPct = daily.workoutCompleted ? 100 : 0;
    const waterPct = waterHit ? 100 : Math.min(Math.round((water.totalMl / Math.max(water.goalMl, 1)) * 100), 99);
    commitmentTotal += Math.round((workoutPct + nutritionPct + waterPct) / 3);
  }

  const days = weekKeys.length;
  const nutritionAvg = Math.round(nutritionTotal / days);
  const commitmentAvg = Math.round(commitmentTotal / days);

  return [
    {
      id: "workout",
      label: "التمارين",
      pct: Math.round((workoutsDone / WEEKLY_WORKOUT_TARGET) * 100),
      summary: `${workoutsDone} / ${WEEKLY_WORKOUT_TARGET}`,
      icon: "🏋️",
    },
    {
      id: "nutrition",
      label: "التغذية",
      pct: nutritionAvg,
      summary: `${nutritionAvg}٪ التزام`,
      icon: "🍽",
    },
    {
      id: "water",
      label: "الماء",
      pct: Math.round((waterDays / days) * 100),
      summary: `${waterDays} / ${days} أيام`,
      icon: "💧",
    },
    {
      id: "commitment",
      label: "الالتزام",
      pct: commitmentAvg,
      summary: `${commitmentAvg}٪`,
      icon: "🔥",
    },
  ];
}

function buildJourneyStats(userId: string, snapshot: PlatformActivitySnapshot): JourneyStat[] {
  let totalMeals = 0;
  let totalWorkouts = 0;
  let totalWaterLiters = 0;
  let activeDays = 0;

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(`hakim_platform_activity_v1:${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          daily?: Record<string, { mealsDone?: number; workoutCompleted?: boolean }>;
        };
        for (const [_, log] of Object.entries(parsed.daily ?? {})) {
          totalMeals += log.mealsDone ?? 0;
          if (log.workoutCompleted) totalWorkouts += 1;
          if ((log.mealsDone ?? 0) > 0 || log.workoutCompleted) activeDays += 1;
        }
      }
    } catch {
      /* ignore */
    }
  }

  for (let i = 0; i < 60; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    totalWaterLiters += getWaterDayState(userId, key).totalMl / 1000;
  }

  return [
    { id: "workouts", label: "تمارين", value: String(totalWorkouts), icon: "🏋️" },
    { id: "meals", label: "وجبات", value: String(totalMeals), icon: "🍽" },
    { id: "water", label: "ماء", value: `${totalWaterLiters.toFixed(0)}L`, icon: "💧" },
    { id: "points", label: "Hakim Points", value: snapshot.hakimPoints.toLocaleString("en-US"), icon: "⭐" },
    { id: "streak", label: "أطول سلسلة", value: `${snapshot.bestStreak} يوم`, icon: "🔥" },
    { id: "days", label: "أيام نشطة", value: String(Math.max(activeDays, snapshot.daysIn)), icon: "📅" },
  ];
}

const BODY_LABELS: Record<BodyMeasurementKey, { label: string; unit: string }> = {
  weight: { label: "الوزن", unit: "كجم" },
  bodyFat: { label: "نسبة الدهون", unit: "%" },
  muscleMass: { label: "الكتلة العضلية", unit: "كجم" },
  waist: { label: "محيط الخصر", unit: "سم" },
  chest: { label: "محيط الصدر", unit: "سم" },
  arm: { label: "محيط الذراع", unit: "سم" },
  thigh: { label: "محيط الفخذ", unit: "سم" },
};

function buildBodyProgress(userId: string, snapshot: PlatformActivitySnapshot): BodyProgressItem[] {
  const latest = getBodyMeasurements(userId);
  const keys = Object.keys(BODY_LABELS) as BodyMeasurementKey[];

  return keys.map((key) => {
    const meta = BODY_LABELS[key];
    const history = getBodyMeasurementHistory(userId, key);
    const currentEntry = latest.get(key);
    const previousEntry = history.length > 1 ? history[history.length - 2] : null;

    if (key === "weight" && snapshot.currentWeight != null && !currentEntry) {
      return {
        key,
        label: meta.label,
        unit: meta.unit,
        current: snapshot.currentWeight,
        previous: snapshot.startWeight,
        updatedAt: todayKey(),
        recorded: true,
      };
    }

    return {
      key,
      label: meta.label,
      unit: meta.unit,
      current: currentEntry?.value ?? null,
      previous: previousEntry?.value ?? null,
      updatedAt: currentEntry?.updatedAt ?? null,
      recorded: currentEntry != null || (key === "weight" && snapshot.currentWeight != null),
    };
  });
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function buildAchievements(userId: string, snapshot: PlatformActivitySnapshot): AchievementItem[] {
  const awards = readAwards(userId);
  return [
    {
      id: "first-workout",
      icon: "🏅",
      title: "أول تمرين",
      description: "أكمل أول حصة تدريب",
      unlocked: awards.has("first-workout") || snapshot.workoutDone > 0,
      unlockedAt: awards.get("first-workout") ?? null,
    },
    {
      id: "streak-7",
      icon: "🔥",
      title: "7 أيام متتالية",
      description: "حافظ على سلسلة إنجاز لمدة أسبوع",
      unlocked: snapshot.bestStreak >= 7,
      unlockedAt: snapshot.bestStreak >= 7 ? todayKey() : null,
      progressLabel: `${Math.min(snapshot.activityStreak, 7)}/7`,
    },
    {
      id: "water-30",
      icon: "💧",
      title: "30 يوم ماء",
      description: "حقق هدف الماء 30 مرة",
      unlocked: countWaterGoalDays(userId) >= 30,
      unlockedAt: null,
      progressLabel: `${Math.min(countWaterGoalDays(userId), 30)}/30`,
    },
    {
      id: "nutrition-week",
      icon: "🍽",
      title: "أسبوع غذائي كامل",
      description: "التزم ببرنامجك الغذائي لأسبوع",
      unlocked: weeklyNutritionPerfect(userId),
      unlockedAt: null,
    },
    {
      id: "workouts-100",
      icon: "🏆",
      title: "100 تمرين",
      description: "أكمل 100 حصة تدريب",
      unlocked: countWorkouts(userId) >= 100,
      unlockedAt: null,
      progressLabel: `${Math.min(countWorkouts(userId), 100)}/100`,
    },
    {
      id: "first-program",
      icon: "🎯",
      title: "أول برنامج",
      description: "أكمل برنامجك الأول",
      unlocked: false,
      unlockedAt: null,
      progressLabel: "قريباً",
    },
  ];
}

function readAwards(userId: string) {
  const map = new Map<string, string>();
  if (typeof window === "undefined") return map;
  try {
    const raw = localStorage.getItem(`hakim_platform_activity_v1:${userId}`);
    if (!raw) return map;
    const parsed = JSON.parse(raw) as { awards?: Record<string, true> };
    for (const key of Object.keys(parsed.awards ?? {})) {
      if (key.includes("workout")) map.set("first-workout", todayKey());
    }
  } catch {
    /* ignore */
  }
  return map;
}

function countWaterGoalDays(userId: string) {
  let count = 0;
  for (let i = 0; i < 90; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const state = getWaterDayState(userId, d.toISOString().slice(0, 10));
    if (state.totalMl >= state.goalMl && state.goalMl > 0) count += 1;
  }
  return count;
}

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

function weeklyNutritionPerfect(userId: string) {
  const keys = dateKeysForWeek();
  return keys.every((key) => nutritionCommitmentForDay(userId, key) >= 80);
}

function buildMonthlySummary(userId: string, snapshot: PlatformActivitySnapshot): MonthlySummaryData {
  const keys = monthKeys();
  const monthLabel = new Date().toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
  let workouts = 0;
  let meals = 0;
  let waterDays = 0;
  let activeDays = 0;
  let points = 0;
  const weekScores = new Map<number, number>();
  const dayScores = new Map<string, number>();

  for (const dateKey of keys) {
    const daily = readPlatformDaily(userId, dateKey);
    if (daily.workoutCompleted) workouts += 1;
    meals += daily.mealsDone;
    const water = getWaterDayState(userId, dateKey);
    if (water.totalMl >= water.goalMl && water.goalMl > 0) waterDays += 1;

    const nutritionPct = nutritionCommitmentForDay(userId, dateKey);
    const workoutPct = daily.workoutCompleted ? 100 : 0;
    const waterPct = water.totalMl >= water.goalMl ? 100 : 0;
    const dayScore = Math.round((nutritionPct + workoutPct + waterPct) / 3);
    dayScores.set(dateKey, dayScore);
    if (dayScore > 0) activeDays += 1;

    const week = Math.ceil(new Date(`${dateKey}T12:00:00`).getDate() / 7);
    weekScores.set(week, (weekScores.get(week) ?? 0) + dayScore);
  }

  points = snapshot.hakimPoints;
  const partial = keys.length < 28 && activeDays < 3;

  let bestWeek = 1;
  let bestWeekScore = 0;
  for (const [week, score] of weekScores) {
    if (score > bestWeekScore) {
      bestWeek = week;
      bestWeekScore = score;
    }
  }

  let bestDay = keys[0] ?? todayKey();
  let bestDayScore = 0;
  for (const [day, score] of dayScores) {
    if (score > bestDayScore) {
      bestDay = day;
      bestDayScore = score;
    }
  }

  return {
    monthLabel,
    partial,
    workouts,
    meals,
    waterDays,
    activeDays,
    points,
    bestWeekLabel: partial ? "—" : `الأسبوع ${bestWeek}`,
    bestDayLabel: partial ? "—" : new Date(`${bestDay}T12:00:00`).toLocaleDateString("ar-EG", { weekday: "long" }),
    topAchievement: snapshot.hasAchievement ? snapshot.lastAchievementTitle : null,
  };
}

export function buildProgressDashboard(
  userId: string,
  snapshot: PlatformActivitySnapshot,
): ProgressDashboardData {
  const weeklyCards = buildWeeklyCards(userId);
  const commitmentCard = weeklyCards.find((c) => c.id === "commitment");
  const weeklyAchievementPct = commitmentCard?.pct ?? 0;
  const remainingDays = Math.max(0, 7 - new Date().getDay());

  const storedEvents = getActivityEvents(userId);
  const recentEvents = getRecentActivityEvents(userId, 8);
  const todayEvents =
    storedEvents.length > 0
      ? [...storedEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : deriveTodayEvents(userId, snapshot);

  return {
    level: resolveProgressLevel(snapshot.hakimPoints),
    weeklyAchievementPct,
    weeklyMotivation:
      weeklyAchievementPct >= 100
        ? "رائع! أكملت أهداف هذا الأسبوع."
        : remainingDays > 0
          ? `تبقى لك ${remainingDays} ${remainingDays === 1 ? "يوم" : "أيام"} لتحقيق هدفك الأسبوعي`
          : "استمر — كل خطوة تقربك من هدفك.",
    todayEvents: todayEvents.length ? todayEvents : recentEvents.slice(0, 6),
    weeklyCards,
    journeyStats: buildJourneyStats(userId, snapshot),
    bodyItems: buildBodyProgress(userId, snapshot),
    photoSessions: getPhotoSessions(userId),
    achievements: buildAchievements(userId, snapshot),
    monthlySummary: buildMonthlySummary(userId, snapshot),
  };
}

function deriveTodayEvents(userId: string, snapshot: PlatformActivitySnapshot): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const dateKey = todayKey();
  const now = new Date().toISOString();

  if (snapshot.workoutDone > 0) {
    events.push({
      id: "derived-workout",
      clientId: `derived-workout:${dateKey}`,
      type: "workout",
      dateKey,
      timeLabel: "—",
      createdAt: now,
      title: "أكملت تمرين اليوم",
      points: HAKIM_POINTS_REWARDS.workout,
    });
  }

  const nutritionStore = readNutritionPlanStore(userId);
  const statuses = nutritionStore.mealStatus[dateKey] ?? {};
  for (const slot of NUTRITION_MEAL_SLOTS) {
    if (statuses[slot.id] === "completed") {
      events.push({
        id: `derived-meal-${slot.id}`,
        clientId: `derived-meal:${dateKey}:${slot.id}`,
        type: "meal",
        dateKey,
        timeLabel: slot.timeLabel,
        createdAt: now,
        title: `سجلت ${slot.slotLabel}`,
      });
    }
  }

  const water = getWaterDayState(userId, dateKey);
  for (const log of water.logs.slice(-3)) {
    events.push({
      id: `derived-water-${log.id}`,
      clientId: log.clientId,
      type: "water",
      dateKey,
      timeLabel: log.timeLabel,
      createdAt: log.createdAt,
      title: `شربت ${log.ml} ml`,
      points: HAKIM_POINTS_REWARDS.water,
    });
  }

  if (snapshot.currentWeight != null) {
    events.push({
      id: "derived-weight",
      clientId: `derived-weight:${dateKey}`,
      type: "weight",
      dateKey,
      timeLabel: "—",
      createdAt: now,
      title: "حدّثت وزنك",
      subtitle: `${snapshot.currentWeight} كجم`,
      points: HAKIM_POINTS_REWARDS.measurements,
    });
  }

  return events.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
