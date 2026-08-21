import { createFileRoute } from "@tanstack/react-router";
import { AdminModulePlaceholder } from "@/components/admin/AdminModulePlaceholder";

export const Route = createFileRoute("/admin/notifications")({
  ssr: false,
  head: () => ({ meta: [{ title: "التنبيهات | مركز التشغيل" }] }),
  component: () => <AdminModulePlaceholder moduleId="notifications" />,
});
