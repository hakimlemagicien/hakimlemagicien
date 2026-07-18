export const DEFAULT_WATER_GOAL_ML = 4000;
export const WATER_QUICK_AMOUNTS = [100, 250, 500, 750, 1000] as const;
export const WATER_MIN_ML = 50;
export const WATER_MAX_ML = 2000;

export const WATER_CHANGE_EVENT = "hakim:water-changed";

function notifyWaterChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WATER_CHANGE_EVENT));
  window.dispatchEvent(new CustomEvent("hakim:platform-activity-changed"));
}

export type WaterLogEntry = {
  id: string;
  clientId: string;
  timeLabel: string;
  ml: number;
  createdAt: string;
};

export type WaterDayState = {
  dateKey: string;
  totalMl: number;
  goalMl: number;
  logs: WaterLogEntry[];
  goalReached: boolean;
  pct: number;
};

export type WaterMotivationState = "empty" | "early" | "mid" | "done" | "over";

type WaterStore = {
  version: 1;
  userId: string;
  goalMl: number;
  daily: Record<
    string,
    {
      totalMl: number;
      logs: WaterLogEntry[];
      goalAwarded?: boolean;
    }
  >;
};

const STORAGE_PREFIX = "hakim_water_v1";
const recentClientIds = new Set<string>();

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function emptyStore(userId: string): WaterStore {
  return { version: 1, userId, goalMl: DEFAULT_WATER_GOAL_ML, daily: {} };
}

function readStore(userId: string): WaterStore {
  if (typeof window === "undefined") return emptyStore(userId);
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return emptyStore(userId);
    const parsed = JSON.parse(raw) as WaterStore;
    if (parsed?.version !== 1) return emptyStore(userId);
    return {
      ...emptyStore(userId),
      ...parsed,
      userId,
      daily: parsed.daily ?? {},
    };
  } catch {
    return emptyStore(userId);
  }
}

function writeStore(store: WaterStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(store.userId), JSON.stringify(store));
  notifyWaterChanged();
}

function formatTimeLabel(date = new Date()) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours < 12 ? "ص" : "م";
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes} ${period}`;
}

export function formatWaterLiters(ml: number, digits = 1) {
  return (ml / 1000).toFixed(digits);
}

export function getWaterMotivationState(totalMl: number, goalMl: number): WaterMotivationState {
  if (totalMl <= 0) return "empty";
  const pct = goalMl > 0 ? totalMl / goalMl : 0;
  if (pct >= 1) return totalMl > goalMl ? "over" : "done";
  if (pct < 0.5) return "early";
  return "mid";
}

export function getWaterMotivationMessage(totalMl: number, goalMl: number) {
  const state = getWaterMotivationState(totalMl, goalMl);
  const remainingMl = Math.max(goalMl - totalMl, 0);
  const remainingLiters = formatWaterLiters(remainingMl);

  switch (state) {
    case "empty":
      return "ابدأ يومك بكوب ماء.";
    case "early":
      return "بداية ممتازة، استمر.";
    case "mid":
      return remainingMl >= 500
        ? `تبقى ${remainingLiters} لتر للوصول إلى هدف اليوم.`
        : "أنت قريب من تحقيق هدف اليوم.";
    case "done":
      return "✔ تم تحقيق الهدف — رائع، لقد أكملت هدف الماء اليوم.";
    case "over":
      return "✔ تم تحقيق الهدف — استمر على الترطيب.";
    default:
      return "استمر، أنت تتقدم جيداً.";
  }
}

export function getWaterDayState(userId: string, dateKey = todayKey()): WaterDayState {
  const store = readStore(userId);
  const day = store.daily[dateKey] ?? { totalMl: 0, logs: [] };
  const goalMl = store.goalMl || DEFAULT_WATER_GOAL_ML;
  const pct = goalMl > 0 ? Math.min(Math.round((day.totalMl / goalMl) * 100), 100) : 0;

  return {
    dateKey,
    totalMl: day.totalMl,
    goalMl,
    logs: day.logs,
    goalReached: day.totalMl >= goalMl,
    pct,
  };
}

export function getRecentWaterLogs(userId: string, limit = 3, dateKey = todayKey()) {
  const logs = getWaterDayState(userId, dateKey).logs;
  return [...logs].reverse().slice(0, limit);
}

export type AddWaterResult =
  | { ok: true; log: WaterLogEntry; goalReached: boolean; duplicate: false }
  | { ok: false; error: string; duplicate?: boolean };

export function addWater(
  userId: string,
  ml: number,
  clientId?: string,
): AddWaterResult {
  const resolvedClientId =
    clientId ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`);

  if (ml < WATER_MIN_ML || ml > WATER_MAX_ML) {
    return { ok: false, error: `الكمية يجب أن تكون بين ${WATER_MIN_ML} و${WATER_MAX_ML} مل.` };
  }

  if (recentClientIds.has(resolvedClientId)) {
    return { ok: false, error: "تم تسجيل هذه العملية بالفعل.", duplicate: true };
  }

  const dateKey = todayKey();
  const store = readStore(userId);
  const day = store.daily[dateKey] ?? { totalMl: 0, logs: [] };
  const now = new Date();
  const log: WaterLogEntry = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    clientId: resolvedClientId,
    timeLabel: formatTimeLabel(now),
    ml,
    createdAt: now.toISOString(),
  };

  const nextTotal = day.totalMl + ml;
  const goalMl = store.goalMl || DEFAULT_WATER_GOAL_ML;
  const wasGoalReached = day.totalMl >= goalMl;
  const goalReached = !wasGoalReached && nextTotal >= goalMl;

  const nextStore: WaterStore = {
    ...store,
    daily: {
      ...store.daily,
      [dateKey]: {
        totalMl: nextTotal,
        logs: [...day.logs, log],
        goalAwarded: day.goalAwarded || goalReached,
      },
    },
  };

  recentClientIds.add(resolvedClientId);
  if (recentClientIds.size > 24) {
    const first = recentClientIds.values().next().value;
    if (first) recentClientIds.delete(first);
  }

  writeStore(nextStore);

  return { ok: true, log, goalReached, duplicate: false };
}

export function undoLastWater(userId: string, dateKey = todayKey()) {
  const store = readStore(userId);
  const day = store.daily[dateKey];
  if (!day?.logs.length) return null;

  const logs = [...day.logs];
  const removed = logs.pop();
  if (!removed) return null;

  const nextTotal = Math.max(0, day.totalMl - removed.ml);
  writeStore({
    ...store,
    daily: {
      ...store.daily,
      [dateKey]: {
        ...day,
        totalMl: nextTotal,
        logs,
        goalAwarded: nextTotal >= store.goalMl,
      },
    },
  });

  return removed;
}

export function setWaterGoalMl(userId: string, goalMl: number) {
  const store = readStore(userId);
  writeStore({
    ...store,
    goalMl: Math.max(500, Math.min(goalMl, 8000)),
  });
}

/** Migrate legacy glass-based logs from nutrition plan storage if present. */
export function migrateLegacyWaterLogs(
  userId: string,
  legacyLogs: Array<{ id: string; timeLabel: string; ml: number }>,
  legacyTotalMl?: number,
) {
  const store = readStore(userId);
  const dateKey = todayKey();
  if ((store.daily[dateKey]?.logs.length ?? 0) > 0) return;

  if (legacyLogs.length === 0 && !legacyTotalMl) return;

  const logs: WaterLogEntry[] = legacyLogs.map((entry) => ({
    id: entry.id,
    clientId: entry.id,
    timeLabel: entry.timeLabel,
    ml: entry.ml,
    createdAt: new Date().toISOString(),
  }));

  const totalMl =
    legacyTotalMl ?? logs.reduce((sum, item) => sum + item.ml, 0);

  writeStore({
    ...store,
    daily: {
      ...store.daily,
      [dateKey]: {
        totalMl,
        logs,
        goalAwarded: totalMl >= (store.goalMl || DEFAULT_WATER_GOAL_ML),
      },
    },
  });
}
