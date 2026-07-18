import {
  NUTRITION_MEAL_SLOTS,
  resolveMealStatus,
  type MealStatus,
} from "@/lib/platform/nutrition-experience";
import { setMealsDone } from "@/lib/platform/platform-activity";

export const NUTRITION_PLAN_CHANGE_EVENT = "hakim:nutrition-plan-changed";

export type WaterLogEntry = {
  id: string;
  timeLabel: string;
  ml: number;
};

type NutritionPlanStore = {
  version: 1;
  userId: string;
  /** dateKey -> slotId -> status override */
  mealStatus: Record<string, Record<string, MealStatus>>;
  /** dateKey -> slotId -> alternative meal id */
  mealChoice: Record<string, Record<string, string>>;
  /** weekKey (Sunday date) -> itemId -> checked */
  shopping: Record<string, Record<string, boolean>>;
  /** dateKey -> water log entries */
  waterLogs: Record<string, WaterLogEntry[]>;
};

const STORAGE_PREFIX = "hakim_nutrition_plan_v1";

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function weekKeyFromDate(date = new Date()) {
  const start = new Date(date);
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return todayKey(start);
}

function emptyStore(userId: string): NutritionPlanStore {
  return {
    version: 1,
    userId,
    mealStatus: {},
    mealChoice: {},
    shopping: {},
    waterLogs: {},
  };
}

function readStore(userId: string): NutritionPlanStore {
  if (typeof window === "undefined") return emptyStore(userId);
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return emptyStore(userId);
    const parsed = JSON.parse(raw) as NutritionPlanStore;
    if (parsed?.version !== 1) return emptyStore(userId);
    return {
      ...emptyStore(userId),
      ...parsed,
      userId,
      mealStatus: parsed.mealStatus ?? {},
      mealChoice: parsed.mealChoice ?? {},
      shopping: parsed.shopping ?? {},
      waterLogs: parsed.waterLogs ?? {},
    };
  } catch {
    return emptyStore(userId);
  }
}

function writeStore(store: NutritionPlanStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(store.userId), JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(NUTRITION_PLAN_CHANGE_EVENT));
}

export function getMealStatusMap(userId: string, dateKey: string, isSelectedToday: boolean) {
  const store = readStore(userId);
  const overrides = store.mealStatus[dateKey] ?? {};
  const map: Record<string, MealStatus> = {};

  for (const slot of NUTRITION_MEAL_SLOTS) {
    map[slot.id] = resolveMealStatus({
      hour: slot.hour,
      minute: slot.minute,
      forced: overrides[slot.id] ?? null,
      isSelectedToday,
    });
  }
  return map;
}

export function getMealChoiceMap(userId: string, dateKey: string) {
  return readStore(userId).mealChoice[dateKey] ?? {};
}

export function markMealCompleted(userId: string, dateKey: string, slotId: string) {
  const store = readStore(userId);
  const day = { ...(store.mealStatus[dateKey] ?? {}), [slotId]: "completed" as const };
  const next = {
    ...store,
    mealStatus: { ...store.mealStatus, [dateKey]: day },
  };
  writeStore(next);
  syncMealsDone(userId, dateKey);
}

export function markMealSkipped(userId: string, dateKey: string, slotId: string) {
  const store = readStore(userId);
  const day = { ...(store.mealStatus[dateKey] ?? {}), [slotId]: "skipped" as const };
  writeStore({
    ...store,
    mealStatus: { ...store.mealStatus, [dateKey]: day },
  });
  syncMealsDone(userId, dateKey);
}

export function adoptMealAlternative(
  userId: string,
  dateKey: string,
  slotId: string,
  alternativeId: string,
) {
  const store = readStore(userId);
  const day = { ...(store.mealChoice[dateKey] ?? {}), [slotId]: alternativeId };
  writeStore({
    ...store,
    mealChoice: { ...store.mealChoice, [dateKey]: day },
  });
}

function syncMealsDone(userId: string, dateKey: string) {
  if (dateKey !== todayKey()) return;
  const statuses = getMealStatusMap(userId, dateKey, true);
  const completed = Object.values(statuses).filter((status) => status === "completed").length;
  setMealsDone(userId, completed);
}

export function getShoppingChecked(userId: string, date = new Date()) {
  return readStore(userId).shopping[weekKeyFromDate(date)] ?? {};
}

export function toggleShoppingItem(userId: string, itemId: string, checked?: boolean) {
  const store = readStore(userId);
  const key = weekKeyFromDate();
  const week = { ...(store.shopping[key] ?? {}) };
  week[itemId] = checked ?? !week[itemId];
  writeStore({
    ...store,
    shopping: { ...store.shopping, [key]: week },
  });
}

export function markAllShoppingPurchased(userId: string, itemIds: string[]) {
  const store = readStore(userId);
  const key = weekKeyFromDate();
  const week = { ...(store.shopping[key] ?? {}) };
  for (const id of itemIds) week[id] = true;
  writeStore({
    ...store,
    shopping: { ...store.shopping, [key]: week },
  });
}

export function readNutritionPlanStore(userId: string) {
  return readStore(userId);
}
