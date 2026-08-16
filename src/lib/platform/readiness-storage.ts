import {
  getLocalDateKey,
  getUserTimeZone,
  readinessRecordKey,
  type DailyReadinessCheck,
} from "@/lib/platform/readiness";

export const READINESS_CHANGE_EVENT = "hakim:readiness-changed";
export const READINESS_STORAGE_PREFIX = "hakim_readiness_v1";

export type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
};

type ReadinessStoreFile = {
  version: 1;
  userId: string;
  records: Record<string, DailyReadinessCheck>;
};

const memoryFallback = new Map<string, string>();

export function createMemoryStore(seed?: Map<string, string>): KeyValueStore {
  const map = seed ?? new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

export function getDefaultReadinessStore(): KeyValueStore {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return {
    getItem: (key) => memoryFallback.get(key) ?? null,
    setItem: (key, value) => {
      memoryFallback.set(key, value);
    },
    removeItem: (key) => {
      memoryFallback.delete(key);
    },
  };
}

function storageKey(userId: string) {
  return `${READINESS_STORAGE_PREFIX}:${userId}`;
}

function emptyFile(userId: string): ReadinessStoreFile {
  return { version: 1, userId, records: {} };
}

function notifyChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(READINESS_CHANGE_EVENT));
}

function readFile(userId: string, store: KeyValueStore): ReadinessStoreFile {
  try {
    const raw = store.getItem(storageKey(userId));
    if (!raw) return emptyFile(userId);
    const parsed = JSON.parse(raw) as ReadinessStoreFile;
    if (parsed?.version !== 1 || !parsed.records) return emptyFile(userId);
    return { version: 1, userId, records: parsed.records };
  } catch {
    return emptyFile(userId);
  }
}

function writeFile(file: ReadinessStoreFile, store: KeyValueStore, notify: boolean) {
  store.setItem(storageKey(file.userId), JSON.stringify(file));
  if (notify) notifyChanged();
}

export function getReadinessRecord(
  userId: string,
  localDate: string,
  store: KeyValueStore = getDefaultReadinessStore(),
): DailyReadinessCheck | null {
  const file = readFile(userId, store);
  return file.records[readinessRecordKey(userId, localDate)] ?? null;
}

export function getTodayReadinessRecord(
  userId: string,
  now = new Date(),
  store: KeyValueStore = getDefaultReadinessStore(),
): DailyReadinessCheck | null {
  return getReadinessRecord(userId, getLocalDateKey(now), store);
}

export function listReadinessRecords(
  userId: string,
  store: KeyValueStore = getDefaultReadinessStore(),
): DailyReadinessCheck[] {
  return Object.values(readFile(userId, store).records);
}

export function listPendingReadinessSync(
  userId: string,
  store: KeyValueStore = getDefaultReadinessStore(),
): DailyReadinessCheck[] {
  const file = readFile(userId, store);
  return Object.values(file.records).filter((record) => record.pendingSync);
}

export function upsertReadinessRecord(
  next: DailyReadinessCheck,
  store: KeyValueStore = getDefaultReadinessStore(),
  options?: { notify?: boolean },
): DailyReadinessCheck {
  const file = readFile(next.userId, store);
  const key = readinessRecordKey(next.userId, next.localDate);
  const previous = file.records[key];
  const merged: DailyReadinessCheck = {
    ...previous,
    ...next,
    id: next.id ?? previous?.id,
    userId: next.userId,
    localDate: next.localDate,
    createdAt: previous?.createdAt ?? next.createdAt,
    updatedAt: next.updatedAt,
  };
  file.records[key] = merged;
  writeFile(file, store, options?.notify !== false);
  return merged;
}

export function createReadinessDraft(userId: string, now = new Date()): DailyReadinessCheck {
  const timezone = getUserTimeZone();
  const stamp = now.toISOString();
  return {
    userId,
    localDate: getLocalDateKey(now, timezone),
    timezone,
    status: "dismissed",
    source: "manual",
    createdAt: stamp,
    updatedAt: stamp,
  };
}
