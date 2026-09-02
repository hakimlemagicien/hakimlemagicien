import {
  isGenderedCollection,
  isFlatFileCollection,
  PLATFORM_CONTENT_CATALOG,
  repoPathForSlot,
  SESSION_MUSCLE_SLOTS,
} from "@/lib/platform/content/catalog";
import { contentGenderSegment, heroGenderFromSegment } from "@/lib/platform/content/gender";
import type {
  ContentAssetEntry,
  ContentCollectionId,
  ContentGenderSegment,
  ContentSlotKey,
  ContentSlotSnapshot,
} from "@/lib/platform/content/types";
import type { HeroGender } from "@/lib/platform/hero-goal-images";

const IMAGE_EXT = /\.(webp|png|jpe?g)$/i;
const IGNORED_FILE = /(?:^|\/)\./;

const contentModules = import.meta.glob<string>("../../../assets/content/**/*.{webp,png,jpg,jpeg}", {
  eager: true,
  query: "?url",
  import: "default",
});

function sortAssetUrls(urls: string[]): string[] {
  return [...urls].sort((a, b) => {
    const score = (value: string) => {
      const lower = value.toLowerCase();
      if (lower.includes("hero")) return 0;
      if (/\b0?\d\b/.test(lower)) return 1;
      return 2;
    };
    return score(a) - score(b) || a.localeCompare(b, "ar");
  });
}

function buildSlotKey(input: {
  collection: ContentCollectionId;
  dirName: string;
  gender?: HeroGender;
}): ContentSlotKey {
  if (input.gender) {
    return `${input.collection}:${contentGenderSegment(input.gender)}:${input.dirName}`;
  }
  return `${input.collection}:${input.dirName}`;
}

function parseContentModulePath(path: string): Omit<ContentAssetEntry, "url" | "slotKey"> | null {
  if (IGNORED_FILE.test(path) || !IMAGE_EXT.test(path)) return null;

  const normalized = path.replace(/\\/g, "/");
  const marker = "/assets/content/";
  const index = normalized.indexOf(marker);
  if (index < 0) return null;

  const relative = normalized.slice(index + marker.length);
  const segments = relative.split("/").map((part) => decodeURIComponent(part));
  if (segments.length < 2) return null;

  const collection = segments[0] as ContentCollectionId;
  const fileName = segments[segments.length - 1];
  if (!fileName) return null;

  if (isFlatFileCollection(collection)) {
    if (segments.length !== 2) return null;
    const dirName = resolveFlatFileDirName(collection, fileName);
    if (!dirName) return null;
    return {
      collection,
      dirName,
      fileName,
      repoPath: `src/assets/content/${collection}/${fileName}`,
    };
  }

  if (segments.length < 3) return null;

  if (isGenderedCollection(collection)) {
    if (segments.length < 4) return null;
    const genderSegment = segments[1] as ContentGenderSegment;
    if (genderSegment !== "ذكور" && genderSegment !== "بنات") return null;
    const dirName = segments[2];
    return {
      collection,
      dirName,
      gender: heroGenderFromSegment(genderSegment),
      genderSegment,
      fileName,
      repoPath: `src/assets/content/${collection}/${genderSegment}/${dirName}/${fileName}`,
    };
  }

  const dirName = segments[1];
  return {
    collection,
    dirName,
    fileName,
    repoPath: `src/assets/content/${collection}/${dirName}/${fileName}`,
  };
}

const FLAT_FILE_DIR_BY_NAME = new Map<string, string>();

for (const slot of SESSION_MUSCLE_SLOTS) {
  if (!slot.fileName) continue;
  FLAT_FILE_DIR_BY_NAME.set(slot.fileName.toLowerCase(), slot.dirName);
  FLAT_FILE_DIR_BY_NAME.set(slot.fileName.replace(/\.(webp|png|jpe?g)$/i, "").toLowerCase(), slot.dirName);
}

function resolveFlatFileDirName(collection: ContentCollectionId, fileName: string): string | null {
  if (collection !== "workout-session-muscle") return null;
  const lower = fileName.toLowerCase();
  return FLAT_FILE_DIR_BY_NAME.get(lower) ?? FLAT_FILE_DIR_BY_NAME.get(lower.replace(/\.(webp|png|jpe?g)$/i, "")) ?? null;
}

const ASSETS_BY_SLOT = new Map<ContentSlotKey, ContentAssetEntry[]>();
const URLS_BY_SLOT = new Map<ContentSlotKey, string[]>();

for (const [path, url] of Object.entries(contentModules)) {
  if (!url) continue;
  const parsed = parseContentModulePath(path);
  if (!parsed) continue;

  const slotKey = buildSlotKey({
    collection: parsed.collection,
    dirName: parsed.dirName,
    gender: parsed.gender,
  });

  const entry: ContentAssetEntry = { ...parsed, slotKey, url };
  const list = ASSETS_BY_SLOT.get(slotKey) ?? [];
  list.push(entry);
  ASSETS_BY_SLOT.set(slotKey, list);
}

for (const [slotKey, entries] of ASSETS_BY_SLOT.entries()) {
  const urls = sortAssetUrls(entries.map((entry) => entry.url));
  URLS_BY_SLOT.set(slotKey, urls);
  ASSETS_BY_SLOT.set(
    slotKey,
    [...entries].sort((a, b) => urls.indexOf(a.url) - urls.indexOf(b.url)),
  );
}

export function listContentSlotAssets(input: {
  collection: ContentCollectionId;
  dirName: string;
  gender?: HeroGender;
}): string[] {
  const slotKey = buildSlotKey(input);
  return URLS_BY_SLOT.get(slotKey) ?? [];
}

export function pickContentSlotAsset(input: {
  collection: ContentCollectionId;
  dirName: string;
  gender?: HeroGender;
  rotationIndex?: number;
  limit?: number;
}): string[] {
  const urls = listContentSlotAssets(input);
  if (urls.length === 0) return [];

  const limit = input.limit ?? urls.length;
  if (limit <= 0) return [];

  if (input.rotationIndex == null || urls.length === 1) {
    return urls.slice(0, limit);
  }

  const start = Math.abs(Math.floor(input.rotationIndex)) % urls.length;
  const rotated = [...urls.slice(start), ...urls.slice(0, start)];
  return rotated.slice(0, limit);
}

export function getContentRegistrySnapshot(): ContentSlotSnapshot[] {
  return PLATFORM_CONTENT_CATALOG.map((slot) => {
    const slotKey = buildSlotKey({
      collection: slot.collection,
      dirName: slot.dirName,
      gender: slot.gender,
    });
    const entries = ASSETS_BY_SLOT.get(slotKey) ?? [];
    const fileNames = entries.map((entry) => entry.fileName);

    return {
      slotKey,
      collection: slot.collection,
      dirName: slot.dirName,
      labelAr: slot.labelAr,
      gender: slot.gender,
      goalId: slot.goalId,
      visualKey: slot.visualKey,
      repoPath: repoPathForSlot(slot),
      fileCount: fileNames.length,
      fileNames,
      isReady: fileNames.length > 0,
    };
  });
}

export { buildSlotKey };
