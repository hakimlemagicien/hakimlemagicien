import { createFileRoute } from "@tanstack/react-router";
import { AdminModulePlaceholder } from "@/components/admin/AdminModulePlaceholder";

export const Route = createFileRoute("/admin/exercises")({
  ssr: false,
  head: () => ({ meta: [{ title: "التمارين | مركز التشغيل" }] }),
  component: () => <AdminModulePlaceholder moduleId="exercises" />,
});
