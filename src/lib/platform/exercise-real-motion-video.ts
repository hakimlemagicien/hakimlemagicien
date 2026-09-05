/**
 * Exercises with a real motion video (not shared placeholder).
 * Sources: DB `video_status = ready`, plus bundled `video/exercise.mp4` in the repo.
 */

const assetVideoModules = import.meta.glob(
  "../../assets/content/core-100-exercises/*/video/exercise.mp4",
  { eager: true },
);

const publicVideoModules = import.meta.glob(
  "../../../public/exercises/*/video/exercise.mp4",
  { eager: true },
);

/** Known public copies when Vite cannot resolve public/ via glob at build time. */
const PUBLIC_REAL_MOTION_VIDEO_FALLBACK_IDS = ["AB-001", "BI-002", "CH-015", "LE-015"] as const;

function externalIdFromVideoPath(path: string): string | null {
  const normalized = path.replace(/\\/g, "/");
  const assetMatch = normalized.match(/core-100-exercises\/([^/]+)\/video\/exercise\.mp4$/i);
  if (assetMatch?.[1]) return assetMatch[1]!;
  const publicMatch = normalized.match(/\/exercises\/([^/]+)\/video\/exercise\.mp4$/i);
  return publicMatch?.[1] ?? null;
}

const BUNDLED_REAL_MOTION_VIDEO_IDS = new Set<string>(PUBLIC_REAL_MOTION_VIDEO_FALLBACK_IDS);

for (const path of Object.keys(assetVideoModules)) {
  const id = externalIdFromVideoPath(path);
  if (id) BUNDLED_REAL_MOTION_VIDEO_IDS.add(id);
}

for (const path of Object.keys(publicVideoModules)) {
  const id = externalIdFromVideoPath(path);
  if (id) BUNDLED_REAL_MOTION_VIDEO_IDS.add(id);
}

export function listBundledRealMotionVideoIds(): string[] {
  return [...BUNDLED_REAL_MOTION_VIDEO_IDS].sort((a, b) => a.localeCompare(b));
}

/** True when the exercise has a real motion video in Storage/CMS or bundled in the project. */
export function exerciseHasRealMotionVideo(input: {
  externalId: string;
  videoStatus?: string | null;
}): boolean {
  if (String(input.videoStatus ?? "").toLowerCase() === "ready") return true;
  return BUNDLED_REAL_MOTION_VIDEO_IDS.has(input.externalId);
}
