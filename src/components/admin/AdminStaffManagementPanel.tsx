import { useCallback, useEffect, useState } from "react";
import { AdminConfirmDialog, type AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import { AdminEmptyState, AdminErrorState, AdminPageHeader, AdminConceptTabs, AdminStatusBadge, AdminTable } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { STAFF_ROLE_LABELS, STAFF_ROLES, type StaffRole } from "@/lib/admin/admin-permissions";
import { listStaffMembers, updateStaffRole, type StaffMemberRow } from "@/lib/admin/admin-staff-api";
import { formatAdminDate } from "@/lib/admin/admin-status";

export function AdminStaffManagementPanel() {
  const [rows, setRows] = useState<StaffMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<AdminConfirmRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listStaffMembers());
    } catch (err) {
      console.error(err);
      setError("تعذر تحميل قائمة الطاقم.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openRoleChange = (row: StaffMemberRow, nextRole: StaffRole) => {
    setConfirm({
      title: "تغيير دور موظف",
      subjectLabel: row.displayName || row.email || row.userId,
      body: `سيتم تغيير دور هذا العضو في مركز التشغيل.`,
      impact: "يؤثر على الصلاحيات والإجراءات المتاحة فورًا بعد الحفظ.",
      diff: [
        {
          label: "الدور",
          before: STAFF_ROLE_LABELS[row.staffRole],
          after: STAFF_ROLE_LABELS[nextRole],
        },
      ],
      confirmLabel: "تأكيد تغيير الدور",
      tone: "danger",
      reasonRequired: true,
      reasonLabel: "سبب تغيير الدور (5 أحرف على الأقل)",
      onConfirm: async (reason) => {
        await updateStaffRole(row.userId, nextRole, reason ?? "");
        await load();
      },
    });
  };

  return (
    <>
      <AdminPageHeader
        title="إدارة الفريق والصلاحيات"
        subtitle="تغيير الأدوار يتطلب سببًا ويُسجَّل في سجل العمليات. لا يمكن للموظف رفع صلاحياته بنفسه."
      />
      <AdminConceptTabs
        items={[
          { id: "tickets", label: "تذاكر الدعم", to: "/admin/support" },
          { id: "team", label: "الفريق", to: "/admin/settings", active: true },
          { id: "roles", label: "الأدوار والصلاحيات", to: "/admin/settings", active: true },
          { id: "audit", label: "سجل التدقيق", to: "/admin/audit" },
        ]}
      />

      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? <AdminSkeletonRows rows={5} /> : null}

      {!loading && rows.length === 0 ? (
        <AdminEmptyState title="لا يوجد طاقم مسجّل" body="سيظهر هنا كل من لديه دور في staff_members." />
      ) : null}

      {!loading && rows.length > 0 ? (
        <AdminTable>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>البريد</th>
              <th>الدور</th>
              <th>الحالة</th>
              <th>آخر دخول</th>
              <th>تغيير الدور</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId}>
                <td>{row.displayName || "—"}</td>
                <td>{row.email || row.userId}</td>
                <td>
                  <AdminStatusBadge tone="neutral">{STAFF_ROLE_LABELS[row.staffRole]}</AdminStatusBadge>
                </td>
                <td>{row.status}</td>
                <td>{row.lastSignInAt ? formatAdminDate(row.lastSignInAt) : "—"}</td>
                <td>
                  <select
                    className="cc-input"
                    value={row.staffRole}
                    onChange={(event) => openRoleChange(row, event.target.value as StaffRole)}
                    aria-label={`تغيير دور ${row.displayName || row.email}`}
                  >
                    {STAFF_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {STAFF_ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      ) : null}

      <section className="cc-danger-zone" aria-label="منطقة حساسة">
        <h2 className="cc-danger-zone__title">منطقة حساسة</h2>
        <p className="cc-muted">
          لا توجد إجراءات تدميرية للحسابات هنا. إزالة آخر مدير نظام محمية على مستوى قاعدة البيانات.
        </p>
      </section>

      <AdminConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}
