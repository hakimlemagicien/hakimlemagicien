import { useCallback, useEffect, useId, useState } from "react";
import { AdminConfirmDialog, type AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import { AdminEmptyState, AdminErrorState, AdminPageHeader, AdminStatusBadge, AdminTable } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { AdminStaffRolesMatrix } from "@/components/admin/AdminStaffRolesMatrix";
import { AdminTeamHubTabs } from "@/components/admin/AdminTeamHubTabs";
import { STAFF_ROLE_LABELS, STAFF_ROLES, type StaffRole } from "@/lib/admin/admin-permissions";
import {
  listStaffMembers,
  setStaffPassword,
  updateStaffRole,
  validateStaffPassword,
  type StaffMemberRow,
} from "@/lib/admin/admin-staff-api";
import { formatAdminDate } from "@/lib/admin/admin-status";

type PasswordDialogState = {
  row: StaffMemberRow;
};

function StaffPasswordDialog({
  state,
  onClose,
  onSaved,
}: {
  state: PasswordDialogState | null;
  onClose: () => void;
  onSaved: (label: string) => void;
}) {
  const titleId = useId();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setPassword("");
    setConfirmPassword("");
    setReason("");
    setSubmitting(false);
    setActionError(null);
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [state, onClose, submitting]);

  if (!state) return null;

  const passwordError = validateStaffPassword(password);
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const reasonOk = reason.trim().length >= 5;
  const canSubmit = !submitting && !passwordError && !mismatch && password === confirmPassword && reasonOk;
  const subject = state.row.displayName || state.row.email || state.row.userId;

  return (
    <div className="cc-dialog-scrim" role="presentation" onClick={() => !submitting && onClose()}>
      <div
        className="cc-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="cc-dialog__title">
          تغيير كلمة المرور
        </h2>
        <p className="cc-dialog__subject">{subject}</p>
        <p className="cc-dialog__body">
          سيتم تحديث كلمة مرور حساب الطاقم فورًا. الجلسات الأخرى تُنهى ويحتاج المستخدم لتسجيل الدخول من جديد.
        </p>
        <p className="cc-dialog__impact">الإجراء مطلوب ويُسجَّل في سجل التدقيق.</p>

        <label className="cc-dialog__reason">
          كلمة المرور الجديدة
          <input
            className="cc-input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={128}
            disabled={submitting}
            required
          />
        </label>
        <label className="cc-dialog__reason">
          تأكيد كلمة المرور
          <input
            className="cc-input"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            maxLength={128}
            disabled={submitting}
            required
          />
        </label>
        <label className="cc-dialog__reason">
          سبب التغيير (5 أحرف على الأقل)
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            required
            minLength={5}
            maxLength={1000}
            disabled={submitting}
          />
        </label>

        {passwordError && password.length > 0 ? (
          <p className="cc-field__error" role="alert">
            {passwordError}
          </p>
        ) : null}
        {mismatch ? (
          <p className="cc-field__error" role="alert">
            كلمتا المرور غير متطابقتين
          </p>
        ) : null}
        {actionError ? (
          <p className="cc-field__error" role="alert">
            {actionError}
          </p>
        ) : null}

        <div className="cc-dialog__actions">
          <button type="button" className="cc-btn cc-btn--ghost" disabled={submitting} onClick={onClose}>
            إلغاء
          </button>
          <button
            type="button"
            className="cc-btn cc-btn--danger"
            disabled={!canSubmit}
            onClick={() => {
              void (async () => {
                setSubmitting(true);
                setActionError(null);
                try {
                  await setStaffPassword(state.row.userId, password, reason);
                  onSaved(subject);
                  onClose();
                } catch (err) {
                  setActionError(err instanceof Error ? err.message : "تعذر تغيير كلمة المرور");
                  setSubmitting(false);
                }
              })();
            }}
          >
            {submitting ? "جارٍ الحفظ…" : "حفظ كلمة المرور"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminStaffManagementPanel({ section = "team" }: { section?: "team" | "roles" }) {
  const [rows, setRows] = useState<StaffMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<AdminConfirmRequest | null>(null);
  const [passwordDialog, setPasswordDialog] = useState<PasswordDialogState | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (section !== "team") {
      setLoading(false);
      return;
    }
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
  }, [section]);

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
        subtitle="الدعم وسجل العمليات من داخل هذا المركز. تغيير الأدوار أو كلمات المرور يتطلب سببًا ويُسجَّل."
      />
      <AdminTeamHubTabs active={section === "roles" ? "roles" : "team"} />

      {section === "roles" ? <AdminStaffRolesMatrix /> : null}

      {section === "team" ? (
        <>
          {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
          {passwordNotice ? (
            <p className="cc-muted" role="status">
              {passwordNotice}
            </p>
          ) : null}
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
                  <th>كلمة المرور</th>
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
                    <td>
                      <button
                        type="button"
                        className="cc-btn cc-btn--ghost"
                        disabled={row.status !== "active"}
                        onClick={() => {
                          setPasswordNotice(null);
                          setPasswordDialog({ row });
                        }}
                      >
                        تغيير كلمة المرور
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : null}

          <section className="cc-danger-zone" aria-label="منطقة حساسة">
            <h2 className="cc-danger-zone__title">منطقة حساسة</h2>
            <p className="cc-muted">
              تغيير كلمة المرور ينهي جلسات الحساب الأخرى عند إعادة تعيين موظف آخر. إزالة آخر مدير نظام محمية على مستوى قاعدة
              البيانات.
            </p>
          </section>
        </>
      ) : null}

      <AdminConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
      <StaffPasswordDialog
        state={passwordDialog}
        onClose={() => setPasswordDialog(null)}
        onSaved={(label) => setPasswordNotice(`تم تحديث كلمة مرور ${label}.`)}
      />
    </>
  );
}
