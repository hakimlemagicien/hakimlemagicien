/**
 * Client exercise catalog is a local-dev test surface until the media pilot ships.
 * Production members keep using /app/program/workout only.
 */
export function isLocalDevEnvironment(): boolean {
  return import.meta.env.DEV;
}

export function canAccessExerciseLibrary(): boolean {
  return isLocalDevEnvironment();
}
