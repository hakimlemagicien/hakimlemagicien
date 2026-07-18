const SAVES_KEY = "hakim.discover.saves.v1";
const SEARCH_KEY = "hakim.discover.search-history.v1";
const CHALLENGES_KEY = "hakim.discover.challenges.v1";
const LIKES_KEY = "hakim.discover.likes.v1";
const CHANGE_EVENT = "hakim:discover-storage-change";

export type DiscoverStorageSnapshot = {
  savedIds: string[];
  likedIds: string[];
  joinedChallengeIds: string[];
  searchHistory: string[];
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function readStringArray(key: string): string[] {
  const value = readJson<string[]>(key, []);
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export function getDiscoverStorageSnapshot(): DiscoverStorageSnapshot {
  return {
    savedIds: readStringArray(SAVES_KEY),
    likedIds: readStringArray(LIKES_KEY),
    joinedChallengeIds: readStringArray(CHALLENGES_KEY),
    searchHistory: readStringArray(SEARCH_KEY).slice(0, 8),
  };
}

export function isDiscoverContentSaved(contentId: string): boolean {
  return getDiscoverStorageSnapshot().savedIds.includes(contentId);
}

export function toggleDiscoverSave(contentId: string): boolean {
  const ids = readStringArray(SAVES_KEY);
  const exists = ids.includes(contentId);
  const next = exists ? ids.filter((id) => id !== contentId) : [contentId, ...ids];
  writeJson(SAVES_KEY, next);
  return !exists;
}

export function isDiscoverContentLiked(contentId: string): boolean {
  return getDiscoverStorageSnapshot().likedIds.includes(contentId);
}

export function toggleDiscoverLike(contentId: string): boolean {
  const ids = readStringArray(LIKES_KEY);
  const exists = ids.includes(contentId);
  const next = exists ? ids.filter((id) => id !== contentId) : [contentId, ...ids];
  writeJson(LIKES_KEY, next);
  return !exists;
}

export function isChallengeJoined(challengeId: string): boolean {
  return getDiscoverStorageSnapshot().joinedChallengeIds.includes(challengeId);
}

export function joinDiscoverChallenge(challengeId: string): boolean {
  const ids = readStringArray(CHALLENGES_KEY);
  if (ids.includes(challengeId)) return false;
  writeJson(CHALLENGES_KEY, [challengeId, ...ids]);
  return true;
}

export function addDiscoverSearchQuery(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const history = readStringArray(SEARCH_KEY).filter((q) => q !== trimmed);
  writeJson(SEARCH_KEY, [trimmed, ...history].slice(0, 8));
}

export function clearDiscoverSearchHistory() {
  writeJson(SEARCH_KEY, []);
}

export function subscribeDiscoverStorage(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export const DISCOVER_STORAGE_CHANGE_EVENT = CHANGE_EVENT;
