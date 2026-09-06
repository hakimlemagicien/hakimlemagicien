/**
 * Exercises with a real motion video (not shared placeholder).
 * Sources: DB `video_status = ready`, plus bundled `video/exercise.mp4` in the repo.
 */

const assetVideoModules =
  typeof import.meta.glob === "function"
    ? import.meta.glob("../../assets/content/core-100-exercises/*/video/exercise.mp4", {
        eager: true,
      })
    : {};


/**
 * Bundled under `public/exercises/{id}/video/exercise.mp4`.
 * Keep explicit — Vite cannot import files from `public/` via glob.
 */
const PUBLIC_REAL_MOTION_VIDEO_IDS = [
  "AB-001",
  "AB-003",
  "AB-006",
  "AB-025",
  "BA-006",
  "BA-007",
  "BA-009",
  "BA-016",
  "BA-017",
  "BI-002",
  "CH-005",
  "CH-007",
  "CH-012",
  "CH-015",
  "CH-016",
  "CR-007",
  "LE-015",
  "LE-046",
  "SH-003",
  "SH-005",
  "SH-007",
  "SH-008",
  "SH-011",
  "SH-019",
  "WU-004",
  "WU-005",
] as const;

function externalIdFromVideoPath(path: string): string | null {
  const normalized = path.replace(/\\/g, "/");
  const assetMatch = normalized.match(/core-100-exercises\/([^/]+)\/video\/exercise\.mp4$/i);
  return assetMatch?.[1] ?? null;
}

const BUNDLED_REAL_MOTION_VIDEO_IDS = new Set<string>(PUBLIC_REAL_MOTION_VIDEO_IDS);

for (const path of Object.keys(assetVideoModules)) {
  const id = externalIdFromVideoPath(path);
  if (id) BUNDLED_REAL_MOTION_VIDEO_IDS.add(id);
}

export function listBundledRealMotionVideoIds(): string[] {
  return [...BUNDLED_REAL_MOTION_VIDEO_IDS].sort((a, b) => a.localeCompare(b));
}

/** Public URL for a repo-bundled real motion video (served from `/public`). */
export function bundledRealMotionVideoPublicUrl(externalId: string): string | null {
  if (!BUNDLED_REAL_MOTION_VIDEO_IDS.has(externalId)) return null;
  return `/exercises/${externalId}/video/exercise.mp4`;
}

/** True when the exercise has a real motion video in Storage/CMS or bundled in the project. */
export function exerciseHasRealMotionVideo(input: {
  externalId: string;
  videoStatus?: string | null;
}): boolean {
  if (String(input.videoStatus ?? "").toLowerCase() === "ready") return true;
  return BUNDLED_REAL_MOTION_VIDEO_IDS.has(input.externalId);
}
