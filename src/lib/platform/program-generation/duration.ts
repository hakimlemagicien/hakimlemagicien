import type { GeneratedExercise } from "./types";

const WORK_SECONDS = 40;
const TRANSITION_SECONDS = 45;
const SESSION_OVERHEAD_SECONDS = 180;
const CALIBRATION_OVERHEAD_SECONDS = 60;

export function estimateSessionMinutes(exercises: GeneratedExercise[]): number {
  let seconds = SESSION_OVERHEAD_SECONDS;
  for (const exercise of exercises) {
    seconds += exercise.sets * (WORK_SECONDS + exercise.rest_seconds);
    seconds += TRANSITION_SECONDS;
    if (exercise.calibration_required) seconds += CALIBRATION_OVERHEAD_SECONDS;
  }
  return Math.max(1, Math.ceil(seconds / 60));
}

export function trimSessionToDuration(
  exercises: GeneratedExercise[],
  availableMinutes: number,
  lockedIds: Set<string>,
): GeneratedExercise[] {
  let next = exercises.map((item, index) => ({ ...item, order_index: index }));
  const priorityRank = (priority: GeneratedExercise["exercise_priority"]) => {
    if (priority === "REQUIRED") return 0;
    if (priority === "HIGH") return 1;
    if (priority === "NORMAL") return 2;
    return 3;
  };
  while (estimateSessionMinutes(next) > availableMinutes && next.length > 2) {
    let dropAt = -1;
    let bestRank = -1;
    for (let index = next.length - 1; index >= 0; index -= 1) {
      const item = next[index];
      if (lockedIds.has(item.external_id)) continue;
      if (item.exercise_priority === "REQUIRED") continue;
      const rank = priorityRank(item.exercise_priority);
      if (rank > bestRank) {
        bestRank = rank;
        dropAt = index;
      }
    }
    if (dropAt < 0) break;
    next = next.filter((_, index) => index !== dropAt).map((item, index) => ({ ...item, order_index: index }));
  }
  return next;
}
