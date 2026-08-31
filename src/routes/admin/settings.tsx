import { createFileRoute } from "@tanstack/react-router";
import { AdminStaffManagementPanel } from "@/components/admin/AdminStaffManagementPanel";
import { RequirePermission } from "@/components/admin/StaffPermissionsContext";

export const Route = createFileRoute("/admin/settings")({
  ssr: false,
  head: () => ({ meta: [{ title: "الإعدادات | مركز التشغيل" }] }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  return (
    <RequirePermission permission="staff.manage">
      <AdminStaffManagementPanel />
    </RequirePermission>
  );
}
