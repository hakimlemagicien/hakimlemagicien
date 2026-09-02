import type { SessionAnatomyVisualKey } from "@/lib/platform/session-muscle-presentation";
import { CONTENT_ASSETS_ROOT, PLATFORM_CONTENT_CATALOG } from "@/lib/platform/content/catalog";
import { pickContentSlotAsset } from "@/lib/platform/content/asset-index";

export type WorkoutSessionMuscleFolder = {
  dirName: string;
  labelAr: string;
  visualKey?: SessionAnatomyVisualKey;
};

export const WORKOUT_SESSION_MUSCLE_FOLDERS: WorkoutSessionMuscleFolder[] = PLATFORM_CONTENT_CATALOG.filter(
  (slot) => slot.collection === "workout-session-muscle",
).map((slot) => ({
  dirName: slot.dirName,
  labelAr: slot.labelAr,
  visualKey: slot.visualKey,
}));

const VISUAL_KEY_FALLBACK_DIR: Partial<Record<SessionAnatomyVisualKey, string>> = {
  PUSH: "صدر-وترايسبس",
  PULL: "ظهر-وبايسبس",
  LEGS: "أرجل",
  UPPER: "الجزء-العلوي",
  FULL_BODY: "الجسم-كامل",
  ARMS: "بايسبس-وترايسبس",
  SHOULDERS: "أكتاف",
  CORE: "بطن",
  REST: "يوم-راحة",
};

const LABEL_TO_DIR = new Map<string, string>();

function normalizeSessionLabel(value: string): string {
  return value
    .trim()
    .replace(/\s*\+\s*/g, " و")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

for (const folder of WORKOUT_SESSION_MUSCLE_FOLDERS) {
  LABEL_TO_DIR.set(normalizeSessionLabel(folder.labelAr), folder.dirName);
  LABEL_TO_DIR.set(normalizeSessionLabel(folder.dirName.replace(/-/g, " ")), folder.dirName);
}

export const WORKOUT_SESSION_MUSCLE_ASSETS_ROOT = `${CONTENT_ASSETS_ROOT}/workout-session-muscle`;

export function resolveWorkoutSessionMuscleImageSrc(input: {
  displayNameAr?: string | null;
  visualKey?: SessionAnatomyVisualKey;
}): string | null {
  const normalizedTitle = input.displayNameAr ? normalizeSessionLabel(input.displayNameAr) : "";
  const dirFromLabel = normalizedTitle ? LABEL_TO_DIR.get(normalizedTitle) : undefined;
  const dirFromVisual =
    input.visualKey && input.visualKey !== "REST"
      ? VISUAL_KEY_FALLBACK_DIR[input.visualKey]
      : input.visualKey === "REST"
        ? "يوم-راحة"
        : undefined;

  const dirName = dirFromLabel ?? dirFromVisual;
  if (!dirName) return null;

  return (
    pickContentSlotAsset({
      collection: "workout-session-muscle",
      dirName,
      limit: 1,
    })[0] ?? null
  );
}
