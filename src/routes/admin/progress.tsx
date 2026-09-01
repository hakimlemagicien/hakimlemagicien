import { createFileRoute } from "@tanstack/react-router";
import { AdminModulePlaceholder } from "@/components/admin/AdminModulePlaceholder";

export const Route = createFileRoute("/admin/progress")({
  ssr: false,
  head: () => ({ meta: [{ title: "التقدم | مركز التشغيل" }] }),
  component: () => <AdminModulePlaceholder moduleId="progress" />,
});
