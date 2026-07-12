import { checkAdminAccess } from "@/lib/admin-payments-api";

export function isLocalDevEnvironment(): boolean {
  return import.meta.env.DEV;
}

export async function canAccessExerciseLibrary(): Promise<boolean> {
  if (!isLocalDevEnvironment()) return false;
  try {
    await checkAdminAccess();
    return true;
  } catch {
    return false;
  }
}
