import { createFileRoute } from "@tanstack/react-router";
import { AdminModulePlaceholder } from "@/components/admin/AdminModulePlaceholder";

export const Route = createFileRoute("/admin/memberships")({
  ssr: false,
  head: () => ({ meta: [{ title: "العضويات | مركز التشغيل" }] }),
  component: () => <AdminModulePlaceholder moduleId="memberships" />,
});
