import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  PLATFORM_ACTIVITY_CHANGE_EVENT,
  buildPlatformActivitySnapshot,
  getEmptyActivitySnapshot,
  logWeight,
  markWorkoutCompleted,
  setMealsDone,
  type PlatformActivitySnapshot,
} from "@/lib/platform/platform-activity";
import { WATER_CHANGE_EVENT } from "@/lib/platform/water-storage";

export function usePlatformActivity() {
  const [userId, setUserId] = useState("guest");
  const [snapshot, setSnapshot] = useState<PlatformActivitySnapshot>(() =>
    getEmptyActivitySnapshot(),
  );

  const refresh = useCallback(
    (id = userId) => {
      setSnapshot(buildPlatformActivitySnapshot(id));
    },
    [userId],
  );

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const id = data.user?.id ?? "guest";
      setUserId(id);
      setSnapshot(buildPlatformActivitySnapshot(id));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user?.id ?? "guest";
      setUserId(id);
      setSnapshot(buildPlatformActivitySnapshot(id));
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onChange = () => refresh(userId);
    window.addEventListener(PLATFORM_ACTIVITY_CHANGE_EVENT, onChange);
    window.addEventListener(WATER_CHANGE_EVENT, onChange);
    return () => {
      window.removeEventListener(PLATFORM_ACTIVITY_CHANGE_EVENT, onChange);
      window.removeEventListener(WATER_CHANGE_EVENT, onChange);
    };
  }, [refresh, userId]);

  return {
    userId,
    snapshot,
    refresh,
    markWorkoutCompleted: () => markWorkoutCompleted(userId),
    setMealsDone: (count: number) => setMealsDone(userId, count),
    logWeight: (weightKg: number) => logWeight(userId, weightKg),
  };
}
