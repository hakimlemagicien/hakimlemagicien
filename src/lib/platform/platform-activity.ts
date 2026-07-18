import { HAKIM_POINTS_REWARDS } from "@/lib/platform/daily-motivation";
import { MEALS_SEED, WATER_SEED } from "@/lib/platform/seed-content";
import { TODAY_WORKOUT_PRESCRIPTIONS } from "@/lib/platform/today-workout";
import { getWaterDayState } from "@/lib/platform/water-storage";
import { recordActivityEvent } from "@/lib/platform/progress-storage";
import {
  getTodayWorkoutSessionKey,
  loadWorkoutSession,
} from "@/lib/platform/workout-progress-storage";

export const PLATFORM_ACTIVITY_CHANGE_EVENT = "hakim:platform-activity-changed";

export type PlatformActivitySnapshot = {
  activityStreak: number;
  bestStreak: number;
  hakimPoints: number;
  waterGlasses: number;
  waterGoal: number;
  waterGlassMl: number;
  waterMl: number;
  waterGoalMl: number;
  mealsDone: number;
  mealsTotal: number;
  workoutDone: number;
  workoutTotal: number;
  currentWeight: number | null;
  startWeight: number | null;
  goalWeight: number | null;
  weightChange: number | null;
  overallProgressPct: number;
  daysIn: number;
  hasAnyActivity: boolean;
  hasAchievement: boolean;
  lastAchievementTitle: string;
  lastAchievementSubtitle: string;
};

type DailyLog = {
  waterGlasses: number;
  mealsDone: number;
  workoutCompleted: boolean;
  weightKg: number | null;
};

type PlatformActivityStore = {
  version: 1;
  userId: string;
  points: number;
  streak: { count: number; lastActiveDate: string | null };
  bestStreak: number;
  progress: {
    startWeight: number | null;
    goalWeight: number | null;
    currentWeight: number | null;
    firstActiveDate: string | null;
  };
  daily: Record<string, DailyLog>;
  awards: Record<string, true>;
  lastAchievement: { title: string; subtitle: string; date: string } | null;
};

const STORAGE_PREFIX = "hakim_platform_activity_v1";

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function yesterdayKey(date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function emptyDailyLog(): DailyLog {
  return { waterGlasses: 0, mealsDone: 0, workoutCompleted: false, weightKg: null };
}

function emptyStore(userId: string): PlatformActivityStore {
  return {
    version: 1,
    userId,
    points: 0,
    streak: { count: 0, lastActiveDate: null },
    bestStreak: 0,
    progress: {
      startWeight: null,
      goalWeight: null,
      currentWeight: null,
      firstActiveDate: null,
    },
    daily: {},
    awards: {},
    lastAchievement: null,
  };
}

function readStore(userId: string): PlatformActivityStore {
  if (typeof window === "undefined") return emptyStore(userId);
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return emptyStore(userId);
    const parsed = JSON.parse(raw) as PlatformActivityStore;
    if (parsed?.version !== 1) return emptyStore(userId);
    return {
      ...emptyStore(userId),
      ...parsed,
      userId,
      daily: parsed.daily ?? {},
      awards: parsed.awards ?? {},
      progress: { ...emptyStore(userId).progress, ...parsed.progress },
    };
  } catch {
    return emptyStore(userId);
  }
}

function writeStore(store: PlatformActivityStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(store.userId), JSON.stringify(store));
}

export function notifyPlatformActivityChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PLATFORM_ACTIVITY_CHANGE_EVENT));
}

function getDailyLog(store: PlatformActivityStore, dateKey: string): DailyLog {
  return store.daily[dateKey] ?? emptyDailyLog();
}

function hasQualifyingActivity(log: DailyLog, waterMl = 0): boolean {
  return waterMl > 0 || log.mealsDone > 0 || log.workoutCompleted || log.weightKg != null;
}

function awardOnce(store: PlatformActivityStore, awardKey: string, points: number): PlatformActivityStore {
  if (store.awards[awardKey]) return store;
  return {
    ...store,
    points: store.points + points,
    awards: { ...store.awards, [awardKey]: true },
  };
}

function touchActiveDay(
  store: PlatformActivityStore,
  dateKey: string,
  waterMl = 0,
): PlatformActivityStore {
  const log = getDailyLog(store, dateKey);
  if (!hasQualifyingActivity(log, waterMl)) return store;

  const { streak } = store;
  if (streak.lastActiveDate === dateKey) {
    return store.progress.firstActiveDate
      ? store
      : { ...store, progress: { ...store.progress, firstActiveDate: dateKey } };
  }

  const nextCount = streak.lastActiveDate === yesterdayKey() ? streak.count + 1 : 1;

  return {
    ...store,
    streak: { count: nextCount, lastActiveDate: dateKey },
    bestStreak: Math.max(store.bestStreak, nextCount),
    progress: store.progress.firstActiveDate
      ? store.progress
      : { ...store.progress, firstActiveDate: dateKey },
  };
}

function recordAchievement(
  store: PlatformActivityStore,
  dateKey: string,
  title: string,
  subtitle: string,
): PlatformActivityStore {
  return {
    ...store,
    lastAchievement: { title, subtitle, date: dateKey },
  };
}

function syncWorkoutCompletion(store: PlatformActivityStore, dateKey: string): PlatformActivityStore {
  const sessionKey = getTodayWorkoutSessionKey();
  const session = loadWorkoutSession(sessionKey, TODAY_WORKOUT_PRESCRIPTIONS.length);
  if (!session?.progress?.length) return store;
  if (!session.progress.every((item) => item.status === "done")) return store;

  const log = getDailyLog(store, dateKey);
  if (log.workoutCompleted) return store;

  const next: PlatformActivityStore = {
    ...store,
    daily: { ...store.daily, [dateKey]: { ...log, workoutCompleted: true } },
  };

  return finalizeActivityUpdate(next, dateKey, {
    awardKey: `${dateKey}:workout`,
    points: HAKIM_POINTS_REWARDS.workout,
    achievement: {
      title: "أحسنت!",
      subtitle: "أكملت تمرين اليوم بنجاح",
    },
  });
}

function finalizeActivityUpdate(
  store: PlatformActivityStore,
  dateKey: string,
  award?: { awardKey: string; points: number; achievement?: { title: string; subtitle: string } },
  waterMl = 0,
): PlatformActivityStore {
  let next = touchActiveDay(store, dateKey, waterMl);
  if (award) {
    next = awardOnce(next, award.awardKey, award.points);
    if (award.achievement) {
      next = recordAchievement(next, dateKey, award.achievement.title, award.achievement.subtitle);
    }
  }
  return next;
}

export function buildPlatformActivitySnapshot(
  userId: string,
  date = new Date(),
): PlatformActivitySnapshot {
  const dateKey = todayKey(date);
  let store = readStore(userId);
  const synced = syncWorkoutCompletion(store, dateKey);
  if (synced !== store) {
    store = synced;
    writeStore(store);
  }

  const log = getDailyLog(store, dateKey);
  const waterState = getWaterDayState(userId, dateKey);
  const waterGlassMl = WATER_SEED.glassMl;
  const waterMl = waterState.totalMl;
  const waterGoalMl = waterState.goalMl;
  const waterGlasses = waterGlassMl > 0 ? Math.round(waterMl / waterGlassMl) : 0;
  const waterGoal = waterGlassMl > 0 ? Math.ceil(waterGoalMl / waterGlassMl) : WATER_SEED.goal;
  const mealsTotal = MEALS_SEED.length;
  const workoutTotal = 1;
  const workoutDone = log.workoutCompleted ? 1 : 0;
  const { progress } = store;

  let overallProgressPct = 0;
  let weightChange: number | null = null;

  if (
    progress.startWeight != null &&
    progress.goalWeight != null &&
    progress.currentWeight != null
  ) {
    const totalDelta = Math.abs(progress.startWeight - progress.goalWeight);
    const currentDelta = Math.abs(progress.startWeight - progress.currentWeight);
    if (totalDelta > 0) {
      overallProgressPct = Math.min(Math.max(Math.round((currentDelta / totalDelta) * 100), 0), 100);
    }
    weightChange = Math.round((progress.currentWeight - progress.startWeight) * 10) / 10;
  }

  let daysIn = 0;
  if (progress.firstActiveDate) {
    const start = new Date(`${progress.firstActiveDate}T12:00:00`);
    const end = new Date(`${dateKey}T12:00:00`);
    daysIn = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1);
  }

  const hasAnyActivity =
    hasQualifyingActivity(log, waterMl) || store.points > 0 || store.streak.count > 0;

  return {
    activityStreak: store.streak.count,
    bestStreak: store.bestStreak,
    hakimPoints: store.points,
    waterGlasses,
    waterGoal,
    waterGlassMl,
    waterMl,
    waterGoalMl,
    mealsDone: log.mealsDone,
    mealsTotal,
    workoutDone,
    workoutTotal,
    currentWeight: progress.currentWeight,
    startWeight: progress.startWeight,
    goalWeight: progress.goalWeight,
    weightChange,
    overallProgressPct,
    daysIn,
    hasAnyActivity,
    hasAchievement: Boolean(store.lastAchievement),
    lastAchievementTitle: store.lastAchievement?.title ?? "ابدأ سلسلتك",
    lastAchievementSubtitle:
      store.lastAchievement?.subtitle ?? "أكمل أول مهمة اليوم لفتح أول إنجاز لك.",
  };
}

export function getEmptyActivitySnapshot(): PlatformActivitySnapshot {
  return buildPlatformActivitySnapshot("guest");
}

export function awardWaterGoalIfNeeded(userId: string, dateKey = todayKey()) {
  const store = readStore(userId);
  const awardKey = `${dateKey}:water-goal`;
  if (store.awards[awardKey]) return;

  const waterState = getWaterDayState(userId, dateKey);
  const next = finalizeActivityUpdate(
    awardOnce(store, awardKey, HAKIM_POINTS_REWARDS.water),
    dateKey,
    undefined,
    waterState.totalMl,
  );
  writeStore(next);
  notifyPlatformActivityChanged();
}

export function touchWaterActivity(userId: string) {
  const store = readStore(userId);
  const dateKey = todayKey();
  const waterState = getWaterDayState(userId, dateKey);
  const next = touchActiveDay(store, dateKey, waterState.totalMl);
  if (next !== store) {
    writeStore(next);
    notifyPlatformActivityChanged();
  }
}

/** @deprecated Use water-storage addWater via WaterProvider instead. */
export function setWaterGlasses(_userId: string, _glasses: number) {
  notifyPlatformActivityChanged();
}

export function markWorkoutCompleted(userId: string) {
  const dateKey = todayKey();
  const store = readStore(userId);
  const log = getDailyLog(store, dateKey);
  if (log.workoutCompleted) return;

  const next: PlatformActivityStore = {
    ...store,
    daily: { ...store.daily, [dateKey]: { ...log, workoutCompleted: true } },
  };

  writeStore(
    finalizeActivityUpdate(
      next,
      dateKey,
      {
        awardKey: `${dateKey}:workout`,
        points: HAKIM_POINTS_REWARDS.workout,
        achievement: {
          title: "أحسنت!",
          subtitle: "أكملت تمرين اليوم بنجاح",
        },
      },
      getWaterDayState(userId, dateKey).totalMl,
    ),
  );
  recordActivityEvent(userId, {
    type: "workout",
    title: "أكملت تمرين اليوم",
    points: HAKIM_POINTS_REWARDS.workout,
    clientId: `${dateKey}:workout`,
  });
  notifyPlatformActivityChanged();
}

export function setMealsDone(userId: string, count: number) {
  const dateKey = todayKey();
  const store = readStore(userId);
  const capped = Math.max(0, Math.min(count, MEALS_SEED.length));
  const log = { ...getDailyLog(store, dateKey), mealsDone: capped };

  let next: PlatformActivityStore = {
    ...store,
    daily: { ...store.daily, [dateKey]: log },
  };

  if (capped >= MEALS_SEED.length) {
    next = finalizeActivityUpdate(
      next,
      dateKey,
      {
        awardKey: `${dateKey}:nutrition-complete`,
        points: HAKIM_POINTS_REWARDS.nutrition,
      },
      getWaterDayState(userId, dateKey).totalMl,
    );
  } else if (capped > 0) {
    next = touchActiveDay(next, dateKey, getWaterDayState(userId, dateKey).totalMl);
  }

  writeStore(next);
  notifyPlatformActivityChanged();
}

export function logWeight(userId: string, weightKg: number) {
  const dateKey = todayKey();
  const store = readStore(userId);
  const log = { ...getDailyLog(store, dateKey), weightKg };
  const progress = { ...store.progress };

  if (progress.startWeight == null) {
    progress.startWeight = weightKg;
  }
  progress.currentWeight = weightKg;

  let next: PlatformActivityStore = {
    ...store,
    progress,
    daily: { ...store.daily, [dateKey]: log },
  };

  next = finalizeActivityUpdate(
    next,
    dateKey,
    {
      awardKey: `${dateKey}:measurements`,
      points: HAKIM_POINTS_REWARDS.measurements,
      achievement: {
        title: "تقدم مسجّل",
        subtitle: "حدّثت وزنك — استمر في المتابعة",
      },
    },
    getWaterDayState(userId, dateKey).totalMl,
  );

  writeStore(next);
  recordActivityEvent(userId, {
    type: "weight",
    title: "حدّثت وزنك",
    subtitle: `${weightKg} كجم`,
    points: HAKIM_POINTS_REWARDS.measurements,
    clientId: `${dateKey}:weight:${weightKg}`,
  });
  notifyPlatformActivityChanged();
}

export function isWorkoutCompletedOnDate(userId: string, dateKey: string): boolean {
  const store = readStore(userId);
  return Boolean(store.daily[dateKey]?.workoutCompleted);
}
