import { usePlatformActivity } from "@/hooks/usePlatformActivity";

/**
 * Daily streak + Hakim Points — driven by real platform activity, not app visits.
 * Points and streak stay at 0 until the member completes a qualifying action.
 */
export function useStreak() {
  const { snapshot } = usePlatformActivity();

  return {
    count: snapshot.activityStreak,
    points: snapshot.hakimPoints,
    hakimPoints: snapshot.hakimPoints,
  };
}
