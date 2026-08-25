import { redirect } from "@tanstack/react-router";
import { canAccessExerciseLibrary } from "@/lib/platform/exercise-library-access";

export function guardExerciseLibraryRoute() {
  if (!canAccessExerciseLibrary()) {
    throw redirect({ to: "/app/program/workout" });
  }
}
