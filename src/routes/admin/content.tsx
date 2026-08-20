import { createFileRoute } from "@tanstack/react-router";
import { AdminModulePlaceholder } from "@/components/admin/AdminModulePlaceholder";

export const Route = createFileRoute("/admin/content")({
  ssr: false,
  head: () => ({ meta: [{ title: "المحتوى | مركز التشغيل" }] }),
  component: () => <AdminModulePlaceholder moduleId="content" />,
});
