import { createFileRoute } from "@tanstack/react-router";
import { AdminModulePlaceholder } from "@/components/admin/AdminModulePlaceholder";

export const Route = createFileRoute("/admin/programs")({
  ssr: false,
  head: () => ({ meta: [{ title: "البرامج | مركز التشغيل" }] }),
  component: () => <AdminModulePlaceholder moduleId="programs" />,
});
