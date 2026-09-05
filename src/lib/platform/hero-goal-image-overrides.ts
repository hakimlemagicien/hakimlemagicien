import type { HeroGender } from "@/lib/platform/hero-goal-images";
import type { HeroGoalAssetEntry } from "@/lib/platform/hero-goals-asset-index";

/** Home hero card vs workout page goal card — CMS images must not cross. */
export type HeroGoalImageSurface = "home" | "workout";

export type HeroGoalImageOverride = {
  id: string;
  url: string;
  fileName: string;
  storagePath: string;
  sortOrder: number;
  surface: HeroGoalImageSurface;
};

const overridesBySlot = new Map<string, HeroGoalImageOverride[]>();

function slotKey(surface: HeroGoalImageSurface, gender: HeroGender, goalId: string): string {
  return `${surface}:${gender}:${goalId}`;
}

function parseSurface(raw: string | undefined): HeroGoalImageSurface | null {
  if (raw === "home" || raw === "workout") return raw;
  return null;
}

function parseSlotKey(key: string): {
  surface: HeroGoalImageSurface;
  gender: HeroGender;
  goalId: string;
} | null {
  const parts = key.split(":");
  if (parts.length === 3) {
    const surface = parseSurface(parts[0]);
    const gender = parts[1] === "female" ? "female" : parts[1] === "male" ? "male" : null;
    const goalId = parts[2]?.trim() ?? "";
    if (!surface || !gender || !goalId) return null;
    return { surface, gender, goalId };
  }
  // Legacy payload keys were `gender:goalId` and always belonged to workout studio uploads.
  if (parts.length === 2) {
    const gender = parts[0] === "female" ? "female" : parts[0] === "male" ? "male" : null;
    const goalId = parts[1]?.trim() ?? "";
    if (!gender || !goalId) return null;
    return { surface: "workout", gender, goalId };
  }
  return null;
}

export function hydrateHeroGoalImageOverrides(
  images: Record<string, HeroGoalImageOverride[]> | null | undefined,
): void {
  overridesBySlot.clear();
  if (!images) return;
  for (const [key, list] of Object.entries(images)) {
    if (!Array.isArray(list) || list.length === 0) continue;
    const parsedKey = parseSlotKey(key);
    if (!parsedKey) continue;
    const mapped = list
      .map((item) => {
        const surface =
          parseSurface(typeof item.surface === "string" ? item.surface : undefined) ??
          parsedKey.surface;
        return {
          id: String(item.id),
          url: String(item.url),
          fileName: String(item.fileName || item.storagePath || "image"),
          storagePath: String(item.storagePath || ""),
          sortOrder: Number(item.sortOrder ?? 0),
          surface,
        } satisfies HeroGoalImageOverride;
      })
      .filter((item) => item.url.trim().length > 0)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (!mapped.length) continue;
    overridesBySlot.set(slotKey(parsedKey.surface, parsedKey.gender, parsedKey.goalId), mapped);
  }
}

export function listHeroGoalImageOverrides(
  surface: HeroGoalImageSurface,
  gender: HeroGender,
  goalId: string,
): HeroGoalImageOverride[] {
  return overridesBySlot.get(slotKey(surface, gender, goalId)) ?? [];
}

export function hasHeroGoalImageOverrides(
  surface: HeroGoalImageSurface,
  gender: HeroGender,
  goalId: string,
): boolean {
  return listHeroGoalImageOverrides(surface, gender, goalId).length > 0;
}

export function listHeroGoalOverrideAssetEntries(
  surface: HeroGoalImageSurface,
  gender: HeroGender,
  goalId: string,
): HeroGoalAssetEntry[] {
  return listHeroGoalImageOverrides(surface, gender, goalId).map((item) => ({
    url: item.url,
    fileName: item.fileName,
    repoPath: `cms:${item.id}`,
  }));
}

export function pickHeroGoalImageOverride(input: {
  surface: HeroGoalImageSurface;
  gender: HeroGender;
  goalId: string;
  rotationIndex?: number;
}): string | null {
  const list = listHeroGoalImageOverrides(input.surface, input.gender, input.goalId);
  if (list.length === 0) return null;
  if (list.length === 1) return list[0]!.url;
  const rotation = input.rotationIndex ?? 0;
  const index = Math.abs(Math.floor(rotation)) % list.length;
  return list[index]?.url ?? list[0]!.url;
}
