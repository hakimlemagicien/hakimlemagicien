import { createFileRoute } from "@tanstack/react-router";
import { AdminMembershipsPage } from "@/components/admin/AdminMembershipsPage";

export const Route = createFileRoute("/admin/memberships")({
  ssr: false,
  head: () => ({ meta: [{ title: "العضويات | مركز التشغيل" }] }),
  component: AdminMembershipsPage,
});
