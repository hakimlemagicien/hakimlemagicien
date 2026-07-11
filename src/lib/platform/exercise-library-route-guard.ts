import { redirect } from "@tanstack/react-router";
import { canAccessExerciseLibrary } from "@/lib/platform/exercise-library-access";

export async function guardExerciseLibraryRoute() {
  const allowed = await canAccessExerciseLibrary();
  if (!allowed) {
    throw redirect({ to: "/app/program/workout" });
  }
}
