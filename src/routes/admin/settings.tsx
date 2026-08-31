import { createFileRoute } from "@tanstack/react-router";
import { AdminModulePlaceholder } from "@/components/admin/AdminModulePlaceholder";

export const Route = createFileRoute("/admin/settings")({
  ssr: false,
  head: () => ({ meta: [{ title: "الإعدادات | مركز التشغيل" }] }),
  component: () => <AdminModulePlaceholder moduleId="settings" />,
});
