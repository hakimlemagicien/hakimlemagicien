/**
 * Temporary product gate: the client exercise catalog is hidden for every tier
 * and environment until the media/content review is explicitly completed.
 *
 * Keep this single source of truth so the tools hub, desktop navigation and
 * direct-route guard cannot drift apart. Admin exercise operations are not
 * affected by this client-facing gate.
 */
export const CLIENT_EXERCISE_LIBRARY_ENABLED = false;

export function canAccessExerciseLibrary(): boolean {
  return CLIENT_EXERCISE_LIBRARY_ENABLED;
}
