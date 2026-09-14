import { useEffect, useState } from "react";
import {
  clearCachedHeroSlot,
  heroSrcBelongsToSlot,
  preloadHeroGoalImage,
  readCachedHeroSlot,
  resolveHeroGoalImage,
  writeCachedHeroSlot,
  type HeroGoalImage,
  type HeroGoalSlot,
} from "@/lib/platform/hero-goal-images";

/**
 * Holds the home hero until the signed-in client's gender+goal image is preloaded.
 * Never paints a previous/other-gender image.
 */
export function useLockedHeroGoalImage(input: {
  userId: string;
  identityPending: boolean;
  slot: HeroGoalSlot | null;
}): { image: HeroGoalImage | null; ready: boolean } {
  const [image, setImage] = useState<HeroGoalImage | null>(null);
  const [ready, setReady] = useState(false);
  const slotKey = input.slot ? `${input.slot.gender}:${input.slot.goalId}` : "";

  useEffect(() => {
    if (input.identityPending) {
      setReady(false);
      setImage(null);
      return;
    }

    const slot = input.slot;
    if (!slot) {
      clearCachedHeroSlot(input.userId);
      const fallback = resolveHeroGoalImage({
        goal: "fitness",
        gender: null,
        previewLocked: true,
      });
      setImage(fallback);
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    const resolved = resolveHeroGoalImage({
      goal: slot.goal,
      gender: slot.gender,
      goalId: slot.goalId,
      previewLocked: true,
    });

    const cached = readCachedHeroSlot(input.userId);
    const cachedOk =
      cached &&
      cached.gender === slot.gender &&
      cached.goalId === slot.goalId &&
      cached.src === resolved.src &&
      heroSrcBelongsToSlot(cached.src, slot.gender, slot.goalId);

    if (cached && !cachedOk) {
      clearCachedHeroSlot(input.userId);
    }

    const next = cachedOk ? { ...resolved, src: cached.src, previewLocked: true } : resolved;

    void preloadHeroGoalImage(next.src).then((ok) => {
      if (cancelled) return;
      if (!ok || !heroSrcBelongsToSlot(next.src, slot.gender, slot.goalId)) {
        setImage(null);
        setReady(true);
        return;
      }
      writeCachedHeroSlot({
        userId: input.userId,
        gender: slot.gender,
        goalId: slot.goalId,
        src: next.src,
      });
      setImage(next);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [input.identityPending, input.userId, slotKey, input.slot]);

  return { image, ready };
}
