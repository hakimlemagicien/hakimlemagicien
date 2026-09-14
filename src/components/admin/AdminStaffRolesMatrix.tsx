import {
  ADMIN_PERMISSIONS,
  STAFF_ROLE_LABELS,
  STAFF_ROLES,
  permissionsForRole,
  type AdminPermission,
  type StaffRole,
} from "@/lib/admin/admin-permissions";

const PERMISSION_LABELS: Partial<Record<AdminPermission, string>> = {
  "clients.read": "قراءة العملاء",
  "clients.basic_read": "قراءة أساسية للعملاء",
  "clients.write": "تعديل العملاء",
  "client_notes.write": "ملاحظات العميل",
  "training.manage": "إدارة التدريب",
  "nutrition.manage": "إدارة التغذية",
  "exercise.read": "قراءة التمارين",
  "exercise.content_edit": "تعديل محتوى التمارين",
  "exercise.safety_edit": "سلامة التمارين",
  "meal_library.manage": "مكتبة الوجبات",
  "meal.safety_edit": "سلامة الوجبات",
  "membership.read": "قراءة العضويات",
  "payments.read": "قراءة المدفوعات",
  "legacy_payments.manage": "مدفوعات يدوية",
  "payment_audit.read": "تدقيق المدفوعات",
  "content.manage": "إدارة المحتوى",
  "support.manage": "إدارة الدعم",
  "messages.manage": "الرسائل",
  "progress.read": "قراءة التقدم",
  "audit.read": "سجل العمليات",
  "staff.manage": "إدارة الفريق",
};

function permissionLabel(permission: AdminPermission): string {
  return PERMISSION_LABELS[permission] ?? permission;
}

export function AdminStaffRolesMatrix() {
  return (
    <section className="cc-roles-matrix" aria-label="مصفوفة الأدوار والصلاحيات">
      <p className="cc-muted" style={{ marginBottom: 16 }}>
        مرجع صلاحيات كل دور. التغيير الفعلي للأدوار يتم من تبويب الفريق.
      </p>
      <div className="cc-roles-matrix__grid">
        {STAFF_ROLES.map((role: StaffRole) => {
          const permissions = permissionsForRole(role);
          return (
            <article key={role} className="cc-roles-matrix__card">
              <header className="cc-roles-matrix__head">
                <h3>{STAFF_ROLE_LABELS[role]}</h3>
                <span className="cc-meta">{permissions.length} صلاحية</span>
              </header>
              <ul className="cc-roles-matrix__perms">
                {(role === "super_admin" ? ADMIN_PERMISSIONS : permissions).map((permission) => (
                  <li key={permission}>
                    <span className="cc-roles-matrix__chip">{permissionLabel(permission)}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
