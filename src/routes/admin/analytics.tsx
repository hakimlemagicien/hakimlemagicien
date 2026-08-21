import { createFileRoute } from "@tanstack/react-router";
import { AdminModulePlaceholder } from "@/components/admin/AdminModulePlaceholder";

export const Route = createFileRoute("/admin/analytics")({
  ssr: false,
  head: () => ({ meta: [{ title: "التحليلات | مركز التشغيل" }] }),
  component: () => <AdminModulePlaceholder moduleId="analytics" />,
});
