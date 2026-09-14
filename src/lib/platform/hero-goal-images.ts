import { resolveHomeGoalHeroImageSrc } from "@/lib/platform/home-goal-hero-images";
import {
  getHourlyRotationIndex,
  listHeroGoalAssetEntries,
  pickHeroGoalAsset,
} from "@/lib/platform/hero-goals-asset-index";
import { readQuizProgress } from "@/lib/quiz-progress-storage";
import coachPhoto from "@/assets/coach-photo.png";
import type { HeroGoalFraming } from "@/lib/platform/hero-goal-framing";
import { buildHeroGoalFramingKey, getHeroGoalFraming } from "@/lib/platform/hero-goal-framing";
import type { UserGoal } from "@/lib/platform/home-hub";
import {
  normalizeHeroGender,
  resolveAuthoritativeHeroSlot,
  resolveGoalIdForGender,
  type HeroGender,
} from "@/lib/platform/hero-goal-slot";

export type { HeroGender, HeroGoalSlot } from "@/lib/platform/hero-goal-slot";
export {
  goalIdToUserGoal,
  inferGoalIdFromText,
  normalizeHeroGender,
  resolveAuthoritativeHeroSlot,
} from "@/lib/platform/hero-goal-slot";

export type HeroGoalImage = {
  src: string;
  alt: string;
  gender: HeroGender;
  goalId: string;
  framing?: HeroGoalFraming;
  /** Admin preview: skip hourly rotation and use explicit src/framing. */
  previewLocked?: boolean;
};

const GOAL_ID_ALTS: Record<string, string> = {
  fat: "جسم أحلامك — خسارة الدهون",
  muscle: "جسم أحلامك — بناء العضلات",
  fitness: "جسم أحلامك — لياقة وطاقة",
  athletic: "جسم أحلامك — قوام رياضي",
  shape: "جسم أحلامك — تحول الشكل",
  gain: "جسم أحلامك — زيادة وزن صحي",
  glutes: "جسم أحلامك — شد وتكبير المؤخرة",
  waist: "جسم أحلامك — خصر أنحف",
  body: "جسم أحلامك — قوام أنثوي متناسق",
  fit: "جسم أحلامك — جسم صحي ورياضي",
  tone: "جسم أحلامك — تحسين شكل الصدر",
};

const HERO_SLOT_CACHE_PREFIX = "maakfit_hero_slot_v2:";

type CachedHeroSlot = {
  userId: string;
  gender: HeroGender;
  goalId: string;
  src: string;
};

function readHeroSlotCacheStore(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readCachedHeroSlot(userId: string): CachedHeroSlot | null {
  const id = userId.trim();
  if (!id || id === "guest") return null;
  const store = readHeroSlotCacheStore();
  if (!store) return null;
  try {
    const parsed = JSON.parse(store.getItem(`${HERO_SLOT_CACHE_PREFIX}${id}`) ?? "") as CachedHeroSlot;
    if (
      parsed?.userId === id &&
      (parsed.gender === "male" || parsed.gender === "female") &&
      typeof parsed.goalId === "string" &&
      typeof parsed.src === "string" &&
      parsed.src.length > 0
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function clearCachedHeroSlot(userId: string): void {
  const id = userId.trim();
  if (!id || id === "guest") return;
  const store = readHeroSlotCacheStore();
  if (!store) return;
  try {
    store.removeItem(`${HERO_SLOT_CACHE_PREFIX}${id}`);
  } catch {
    // ignore
  }
}

export function writeCachedHeroSlot(slot: CachedHeroSlot): void {
  const id = slot.userId.trim();
  if (!id || id === "guest") return;
  const store = readHeroSlotCacheStore();
  if (!store) return;
  try {
    store.setItem(`${HERO_SLOT_CACHE_PREFIX}${id}`, JSON.stringify(slot));
  } catch {
    // quota / private mode
  }
}

export function heroSrcBelongsToSlot(src: string, gender: HeroGender, goalId: string): boolean {
  if (!src) return false;
  const entries = listHeroGoalAssetEntries(gender, goalId);
  if (entries.some((row) => row.url === src)) return true;
  const otherGender: HeroGender = gender === "female" ? "male" : "female";
  if (listHeroGoalAssetEntries(otherGender, goalId).some((row) => row.url === src)) return false;
  if (gender === "male" && /hero-goal-women|\/بنات\//i.test(src)) return false;
  if (gender === "female" && /hero-goal-man|\/ذكور\//i.test(src)) return false;
  return true;
}

export function preloadHeroGoalImage(src: string): Promise<boolean> {
  if (!src) return Promise.resolve(false);
  if (typeof window === "undefined" || typeof Image === "undefined") return Promise.resolve(true);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

export function readHomeGoalContext(input?: {
  gender?: HeroGender | null;
  goalId?: string | null;
  goalText?: string | null;
  /** Device quiz is anonymous onboarding only. Signed-in clients must omit this. */
  allowDeviceQuizFallback?: boolean;
}) {
  const quiz = input?.allowDeviceQuizFallback ? readQuizProgress() : null;
  const slot = resolveAuthoritativeHeroSlot({
    gender: normalizeHeroGender(input?.gender) ?? (quiz ? normalizeHeroGender(quiz.gender) : null),
    goalId: input?.goalId ?? quiz?.goalId ?? null,
    goalText: input?.goalText,
  });
  if (slot) return slot;
  return { gender: "male" as const, goalId: null as string | null, goal: "fitness" as const };
}

export function getHeroGoalImageSrc(gender: HeroGender, goalId: string, rotationIndex?: number): string | null {
  return (
    pickHeroGoalAsset({ gender, goalId, rotationIndex }) ??
    resolveHomeGoalHeroImageSrc({ gender, goalId, rotationIndex })
  );
}

export function resolveHeroGoalImage(input: {
  goal: UserGoal;
  gender?: HeroGender | null;
  goalId?: string | null;
  rotationIndex?: number;
  previewLocked?: boolean;
}): HeroGoalImage {
  const gender = normalizeHeroGender(input.gender);
  if (!gender) {
    return {
      src: coachPhoto,
      alt: "MAAKFIT",
      gender: "male",
      goalId: "fitness",
      previewLocked: true,
    };
  }

  const resolvedGoalId = resolveGoalIdForGender(gender, input.goal, input.goalId);
  const rotationIndex = input.rotationIndex ?? getHourlyRotationIndex();
  const alt = GOAL_ID_ALTS[resolvedGoalId] || "جسم أحلامك حسب هدفك";

  const entries = listHeroGoalAssetEntries(gender, resolvedGoalId);
  const folderSrc = pickHeroGoalAsset({
    gender,
    goalId: resolvedGoalId,
    rotationIndex,
  });

  const contentSrc = resolveHomeGoalHeroImageSrc({
    gender,
    goalId: resolvedGoalId,
    rotationIndex,
  });

  const isolatedSrc = [folderSrc, contentSrc].find(
    (candidate): candidate is string =>
      Boolean(candidate) && heroSrcBelongsToSlot(candidate!, gender, resolvedGoalId),
  );
  const src = isolatedSrc ?? entries[0]?.url ?? coachPhoto;
  const entry = entries.find((row) => row.url === src);
  const framingKey = entry
    ? `${gender}:${resolvedGoalId}:${entry.fileName}`
    : buildHeroGoalFramingKey(gender, resolvedGoalId, src);

  return {
    src: entry?.url ?? src,
    alt,
    gender,
    goalId: resolvedGoalId,
    framing: getHeroGoalFraming(framingKey),
    previewLocked: input.previewLocked,
  };
}
