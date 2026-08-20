import { createFileRoute } from "@tanstack/react-router";
import { AdminModulePlaceholder } from "@/components/admin/AdminModulePlaceholder";

export const Route = createFileRoute("/admin/support")({
  ssr: false,
  head: () => ({ meta: [{ title: "الدعم | مركز التشغيل" }] }),
  component: () => <AdminModulePlaceholder moduleId="support" />,
});
