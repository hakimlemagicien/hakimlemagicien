import { createFileRoute } from "@tanstack/react-router";
import { ExerciseLibraryManager } from "@/components/admin/libraries/ExerciseLibraryManager";

export const Route = createFileRoute("/admin/exercises")({
  ssr: false,
  head: () => ({ meta: [{ title: "التمارين | مركز التشغيل" }] }),
  component: ExerciseLibraryManager,
});
