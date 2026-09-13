import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  HERO_GOAL_SETTINGS_QUERY_KEY,
  loadHeroGoalSettings,
} from "@/lib/platform/hero-goal-settings-api";
import { HERO_GOAL_SETTINGS_REVISION_KEY } from "@/lib/platform/hero-goal-framing";

export function useHeroGoalSettings(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: HERO_GOAL_SETTINGS_QUERY_KEY });
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === HERO_GOAL_SETTINGS_REVISION_KEY) refresh();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("maakfit-hero-goal-settings");
      channel.onmessage = () => refresh();
    } catch {
      channel = null;
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
      channel?.close();
    };
  }, [enabled, queryClient]);

  return useQuery({
    queryKey: HERO_GOAL_SETTINGS_QUERY_KEY,
    queryFn: loadHeroGoalSettings,
    enabled,
    staleTime: 15_000,
    gcTime: 30 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 20_000,
    retry: 1,
  });
}
