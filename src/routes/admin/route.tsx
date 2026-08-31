import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminRouteAccess } from "@/lib/admin/admin-access";

export const Route = createFileRoute("/admin")({
  ssr: false,
  preload: false,
  beforeLoad: requireAdminRouteAccess,
  head: () => ({ meta: [{ title: "مركز التشغيل | MAAKFIT" }] }),
  component: AdminShell,
});
