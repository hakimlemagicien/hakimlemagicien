import { createFileRoute } from "@tanstack/react-router";
import { AdminStaffManagementPanel } from "@/components/admin/AdminStaffManagementPanel";
import { RequirePermission } from "@/components/admin/StaffPermissionsContext";

type SettingsSearch = {
  tab?: "team" | "roles";
};

export const Route = createFileRoute("/admin/settings")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): SettingsSearch => ({
    tab: search.tab === "roles" ? "roles" : "team",
  }),
  head: () => ({ meta: [{ title: "إدارة الفريق والصلاحيات | مركز التشغيل" }] }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const { tab } = Route.useSearch();
  return (
    <RequirePermission permission="staff.manage">
      <AdminStaffManagementPanel section={tab === "roles" ? "roles" : "team"} />
    </RequirePermission>
  );
}
