import { useEffect, useState } from "react";
import { GOAL_HERO_FOLDERS } from "@/lib/platform/goal-hero-folder-catalog";
import type { HeroGender } from "@/lib/platform/hero-goal-images";

const IMAGE_EXT = /\.(webp|png|jpe?g)$/i;
const HOUR_MS = 3_600_000;

const heroGoalModules = import.meta.glob<string>("../../assets/hero-goals/**/*.{webp,png,jpg,jpeg}", {
  eager: true,
  query: "?url",
  import: "default",
});

/** Male folder on disk may omit «ال» — map to catalog dirName. */
export const GOAL_FOLDER_ALIASES: Record<string, string> = {
  "خسارة-دهون": "خسارة-الدهون",
};

export type HeroGoalAssetEntry = {
  url: string;
  fileName: string;
  repoPath: string;
};

function slotKey(gender: HeroGender, goalId: string): string {
  return `${gender}:${goalId}`;
}

function sortUrls(urls: string[]): string[] {
  return [...urls].sort((a, b) => a.localeCompare(b, "ar"));
}

function resolveGoalIdFromFolder(gender: HeroGender, folderName: string): string | null {
  const normalized = GOAL_FOLDER_ALIASES[folderName] ?? folderName;
  const match = GOAL_HERO_FOLDERS.find(
    (entry) => entry.gender === gender && entry.dirName === normalized,
  );
  return match?.goalId ?? null;
}

function parseHeroGoalModulePath(path: string): { gender: HeroGender; folder: string } | null {
  const normalized = path.replace(/\\/g, "/");
  const marker = "/assets/hero-goals/";
  const index = normalized.indexOf(marker);
  if (index < 0 || !IMAGE_EXT.test(normalized)) return null;

  const relative = normalized.slice(index + marker.length);
  const segments = relative.split("/").map((part) => decodeURIComponent(part));
  if (segments.length < 3) return null;

  const genderSegment = segments[0];
  const gender: HeroGender | null =
    genderSegment === "hero-goal-man" ? "male" : genderSegment === "hero-goal-women" ? "female" : null;
  if (!gender) return null;

  return { gender, folder: segments[1]! };
}

const URLS_BY_GOAL = new Map<string, string[]>();
const ENTRIES_BY_GOAL = new Map<string, HeroGoalAssetEntry[]>();

function modulePathToRepoPath(modulePath: string): string {
  const normalized = modulePath.replace(/\\/g, "/");
  const marker = "/assets/hero-goals/";
  const index = normalized.indexOf(marker);
  if (index < 0) return normalized;
  return `src${normalized.slice(index)}`;
}

for (const [modulePath, url] of Object.entries(heroGoalModules)) {
  const parsed = parseHeroGoalModulePath(modulePath);
  if (!parsed) continue;

  const goalId = resolveGoalIdFromFolder(parsed.gender, parsed.folder);
  if (!goalId) continue;

  const key = slotKey(parsed.gender, goalId);
  const list = URLS_BY_GOAL.get(key) ?? [];
  list.push(url);
  URLS_BY_GOAL.set(key, list);

  const fileName = decodeURIComponent(modulePath.split("/").pop() ?? url);
  const entryList = ENTRIES_BY_GOAL.get(key) ?? [];
  entryList.push({
    url,
    fileName,
    repoPath: modulePathToRepoPath(modulePath),
  });
  ENTRIES_BY_GOAL.set(key, entryList);
}

for (const [key, urls] of URLS_BY_GOAL.entries()) {
  URLS_BY_GOAL.set(key, sortUrls(urls));
}

for (const [key, entries] of ENTRIES_BY_GOAL.entries()) {
  ENTRIES_BY_GOAL.set(
    key,
    [...entries].sort((a, b) => a.url.localeCompare(b.url, "ar")),
  );
}

export function getHourlyRotationIndex(date = new Date()): number {
  return Math.floor(date.getTime() / HOUR_MS);
}

/** Re-render consumers when the hourly slot changes (client only). */
export function useHourlyRotationIndex(): number {
  const [rotationIndex, setRotationIndex] = useState(() => getHourlyRotationIndex());

  useEffect(() => {
    const sync = () => setRotationIndex(getHourlyRotationIndex());
    const msUntilNextHour = HOUR_MS - (Date.now() % HOUR_MS);
    let intervalId = 0;

    const timeoutId = window.setTimeout(() => {
      sync();
      intervalId = window.setInterval(sync, HOUR_MS);
    }, msUntilNextHour);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  return rotationIndex;
}

export function listHeroGoalAssets(gender: HeroGender, goalId: string): string[] {
  return URLS_BY_GOAL.get(slotKey(gender, goalId)) ?? [];
}

export function listHeroGoalAssetEntries(gender: HeroGender, goalId: string): HeroGoalAssetEntry[] {
  return ENTRIES_BY_GOAL.get(slotKey(gender, goalId)) ?? [];
}

export function pickHeroGoalAsset(input: {
  gender: HeroGender;
  goalId: string;
  rotationIndex?: number;
}): string | null {
  const urls = listHeroGoalAssets(input.gender, input.goalId);
  if (urls.length === 0) return null;
  if (urls.length === 1) return urls[0]!;

  const rotation = input.rotationIndex ?? getHourlyRotationIndex();
  const index = Math.abs(Math.floor(rotation)) % urls.length;
  return urls[index] ?? urls[0]!;
}

export function countHeroGoalAssets(gender: HeroGender, goalId: string): number {
  return listHeroGoalAssets(gender, goalId).length;
}
