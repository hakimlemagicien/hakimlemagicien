export const HYDRATION_INTERVAL_MS = 15 * 60 * 1000;
export const HYDRATION_EVERY_WORKING_SETS = 6;

export function shouldShowHydrationReminder(input: {
  sessionStartedAt: string | null;
  completedWorkingSets: number;
  lastShownAt: string | null;
  phase: "exercise" | "set-sheet" | "rest" | "complete";
  now?: number;
}): boolean {
  if (input.phase !== "rest") return false;
  if (!input.sessionStartedAt) return false;
  const now = input.now ?? Date.now();
  const elapsed = now - Date.parse(input.sessionStartedAt);
  if (elapsed < HYDRATION_INTERVAL_MS && input.completedWorkingSets < HYDRATION_EVERY_WORKING_SETS) {
    return false;
  }
  if (input.lastShownAt) {
    const since = now - Date.parse(input.lastShownAt);
    if (since < HYDRATION_INTERVAL_MS) return false;
  }
  return elapsed >= HYDRATION_INTERVAL_MS || input.completedWorkingSets >= HYDRATION_EVERY_WORKING_SETS;
}
