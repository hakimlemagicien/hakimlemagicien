import { useQuery } from "@tanstack/react-query";
import {
  HERO_GOAL_SETTINGS_QUERY_KEY,
  loadHeroGoalSettings,
} from "@/lib/platform/hero-goal-settings-api";

export function useHeroGoalSettings(enabled = true) {
  return useQuery({
    queryKey: HERO_GOAL_SETTINGS_QUERY_KEY,
    queryFn: loadHeroGoalSettings,
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
  });
}
