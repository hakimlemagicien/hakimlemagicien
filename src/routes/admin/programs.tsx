import { createFileRoute } from "@tanstack/react-router";
import { ProgramLibraryManager } from "@/components/admin/libraries/ProgramLibraryManager";

export const Route = createFileRoute("/admin/programs")({
  ssr: false,
  head: () => ({ meta: [{ title: "البرامج | مركز التشغيل" }] }),
  component: ProgramLibraryManager,
});
