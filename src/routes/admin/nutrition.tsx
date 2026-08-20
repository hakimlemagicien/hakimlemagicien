import { createFileRoute } from "@tanstack/react-router";
import { AdminModulePlaceholder } from "@/components/admin/AdminModulePlaceholder";

export const Route = createFileRoute("/admin/nutrition")({
  ssr: false,
  head: () => ({ meta: [{ title: "التغذية | مركز التشغيل" }] }),
  component: () => <AdminModulePlaceholder moduleId="nutrition" />,
});
