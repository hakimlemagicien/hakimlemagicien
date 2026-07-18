export const PROGRESS_CHANGE_EVENT = "hakim:progress-changed";

export type ActivityEventType =
  | "workout"
  | "meal"
  | "water"
  | "weight"
  | "measurement"
  | "photo"
  | "achievement"
  | "points";

export type ActivityEvent = {
  id: string;
  clientId: string;
  type: ActivityEventType;
  dateKey: string;
  timeLabel: string;
  createdAt: string;
  title: string;
  subtitle?: string;
  points?: number;
  refId?: string;
};

export type BodyMeasurementKey =
  | "weight"
  | "bodyFat"
  | "muscleMass"
  | "waist"
  | "chest"
  | "arm"
  | "thigh";

export type BodyMeasurementEntry = {
  key: BodyMeasurementKey;
  value: number;
  unit: string;
  dateKey: string;
  updatedAt: string;
};

export type PhotoAngle = "front" | "side" | "back";

export type TransformationPhotoSession = {
  id: string;
  dateKey: string;
  dayNumber: number;
  label: string;
  createdAt: string;
  photos: Partial<Record<PhotoAngle, { thumbUrl: string; fullUrl?: string }>>;
};

export type ProgressStore = {
  version: 1;
  userId: string;
  events: ActivityEvent[];
  measurements: BodyMeasurementEntry[];
  photoSessions: TransformationPhotoSession[];
  marketingPhotoConsent: boolean;
  marketingConsentAt: string | null;
  marketingConsentVersion: string | null;
  photoOnboardingDismissed: boolean;
};

const STORAGE_PREFIX = "hakim_progress_v1";
const CONSENT_VERSION = "2026-01";
const recentEventIds = new Set<string>();

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function formatTimeLabel(date = new Date()) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours < 12 ? "ص" : "م";
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes} ${period}`;
}

function emptyStore(userId: string): ProgressStore {
  return {
    version: 1,
    userId,
    events: [],
    measurements: [],
    photoSessions: [],
    marketingPhotoConsent: false,
    marketingConsentAt: null,
    marketingConsentVersion: null,
    photoOnboardingDismissed: false,
  };
}

function readStore(userId: string): ProgressStore {
  if (typeof window === "undefined") return emptyStore(userId);
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return emptyStore(userId);
    const parsed = JSON.parse(raw) as ProgressStore;
    if (parsed?.version !== 1) return emptyStore(userId);
    return {
      ...emptyStore(userId),
      ...parsed,
      userId,
      events: parsed.events ?? [],
      measurements: parsed.measurements ?? [],
      photoSessions: parsed.photoSessions ?? [],
    };
  } catch {
    return emptyStore(userId);
  }
}

function writeStore(store: ProgressStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(store.userId), JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(PROGRESS_CHANGE_EVENT));
}

function notifyChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROGRESS_CHANGE_EVENT));
}

export function recordActivityEvent(
  userId: string,
  input: {
    type: ActivityEventType;
    title: string;
    subtitle?: string;
    points?: number;
    refId?: string;
    clientId?: string;
    dateKey?: string;
    createdAt?: string;
  },
): ActivityEvent | null {
  const clientId =
    input.clientId ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`);

  if (recentEventIds.has(clientId)) return null;

  const store = readStore(userId);
  if (store.events.some((event) => event.clientId === clientId || event.id === clientId)) {
    return null;
  }

  const now = input.createdAt ? new Date(input.createdAt) : new Date();
  const dateKey = input.dateKey ?? todayKey(now);
  const event: ActivityEvent = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    clientId,
    type: input.type,
    dateKey,
    timeLabel: formatTimeLabel(now),
    createdAt: now.toISOString(),
    title: input.title,
    subtitle: input.subtitle,
    points: input.points,
    refId: input.refId,
  };

  recentEventIds.add(clientId);
  if (recentEventIds.size > 48) {
    const first = recentEventIds.values().next().value;
    if (first) recentEventIds.delete(first);
  }

  writeStore({
    ...store,
    events: [event, ...store.events].slice(0, 400),
  });

  return event;
}

export function getActivityEvents(userId: string, dateKey = todayKey()) {
  return readStore(userId).events.filter((event) => event.dateKey === dateKey);
}

export function getRecentActivityEvents(userId: string, limit = 8) {
  return [...readStore(userId).events]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function getBodyMeasurements(userId: string) {
  const store = readStore(userId);
  const latest = new Map<BodyMeasurementKey, BodyMeasurementEntry>();
  for (const entry of store.measurements) {
    const prev = latest.get(entry.key);
    if (!prev || entry.updatedAt > prev.updatedAt) latest.set(entry.key, entry);
  }
  return latest;
}

export function getBodyMeasurementHistory(userId: string, key: BodyMeasurementKey) {
  return readStore(userId)
    .measurements.filter((entry) => entry.key === key)
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
}

export function saveBodyMeasurement(
  userId: string,
  key: BodyMeasurementKey,
  value: number,
  unit: string,
) {
  const store = readStore(userId);
  const now = new Date();
  const entry: BodyMeasurementEntry = {
    key,
    value,
    unit,
    dateKey: todayKey(now),
    updatedAt: now.toISOString(),
  };
  writeStore({
    ...store,
    measurements: [...store.measurements, entry],
  });
  recordActivityEvent(userId, {
    type: "measurement",
    title: "حدّثت قياساً جديداً",
    subtitle: `${key}`,
    clientId: `measurement:${key}:${todayKey(now)}:${value}`,
  });
  return entry;
}

export function getPhotoSessions(userId: string) {
  return [...readStore(userId).photoSessions].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

export function dismissPhotoOnboarding(userId: string) {
  const store = readStore(userId);
  writeStore({ ...store, photoOnboardingDismissed: true });
}

export function isPhotoOnboardingDismissed(userId: string) {
  return readStore(userId).photoOnboardingDismissed;
}

export function getMarketingPhotoConsent(userId: string) {
  const store = readStore(userId);
  return {
    granted: store.marketingPhotoConsent,
    at: store.marketingConsentAt,
    version: store.marketingConsentVersion,
  };
}

export function setMarketingPhotoConsent(userId: string, granted: boolean) {
  const store = readStore(userId);
  writeStore({
    ...store,
    marketingPhotoConsent: granted,
    marketingConsentAt: granted ? new Date().toISOString() : null,
    marketingConsentVersion: granted ? CONSENT_VERSION : store.marketingConsentVersion,
  });
}

export function savePhotoSession(
  userId: string,
  photos: Partial<Record<PhotoAngle, { thumbUrl: string; fullUrl?: string }>>,
  dayNumber: number,
  label: string,
) {
  const store = readStore(userId);
  const now = new Date();
  const session: TransformationPhotoSession = {
    id: `${now.getTime()}`,
    dateKey: todayKey(now),
    dayNumber,
    label,
    createdAt: now.toISOString(),
    photos,
  };
  writeStore({
    ...store,
    photoSessions: [...store.photoSessions, session],
  });
  recordActivityEvent(userId, {
    type: "photo",
    title: "أضفت صورة تقدم",
    subtitle: label,
    clientId: `photo-session:${session.id}`,
  });
  return session;
}

export { notifyChanged as notifyProgressChanged };
