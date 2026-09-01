import { Link } from "@tanstack/react-router";
import { useRef, useState, type ReactNode } from "react";
import { AdminConfirmDialog, type AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import { ClientAccountDeleteDialog } from "@/components/admin/ClientAccountDeleteDialog";
import { RequirePermission, useStaffPermissions } from "@/components/admin/StaffPermissionsContext";
import type { AdminClientOverview } from "@/lib/admin/admin-clients-api";
import {
  canChangeAccountLifecycle,
  clientAccountStatusLabel,
  normalizeClientAccountStatus,
  parseAccountRpcError,
} from "@/lib/admin/admin-client-account";
import {
  executeAdminClientAccountDeletion,
  previewAdminClientAccountDeletion,
  setAdminClientAccountStatus,
  type ClientDeletionPreview,
} from "@/lib/admin/admin-client-account-api";

type Props = {
  overview: AdminClientOverview;
  onUpdated: () => Promise<void> | void;
};

export function ClientAccountManagementPanel({ overview, onUpdated }: Props) {
  const { can } = useStaffPermissions();
  const status = normalizeClientAccountStatus(overview.account_status);
  const deleted = Boolean(overview.account_deleted_at);
  const canLifecycle = can("clients.write");
  const canDelete = can("staff.manage");
  const [confirm, setConfirm] = useState<AdminConfirmRequest | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [preview, setPreview] = useState<ClientDeletionPreview | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const idempotencyRef = useRef<string | null>(null);

  const name = overview.full_name || overview.email || "العميل";
  const busy = status === "deletion_pending" || deleted;

  const openStatus = (
    action: "suspend" | "reactivate" | "archive" | "restore",
    title: string,
    body: string,
    impact: string,
    confirmLabel: string,
  ) => {
    setConfirm({
      title,
      subjectLabel: name,
      body,
      impact,
      confirmLabel,
      tone: action === "suspend" || action === "archive" ? "danger" : "primary",
      reasonRequired: true,
      reasonLabel: "السبب (إلزامي)",
      onConfirm: async (reason) => {
        await setAdminClientAccountStatus(overview.id, action, reason ?? "");
        await onUpdated();
      },
    });
  };

  const openDelete = async () => {
    setDeleteError(null);
    idempotencyRef.current = crypto.randomUUID();
    try {
      const next = await previewAdminClientAccountDeletion(overview.id);
      setPreview(next);
      setDeleteOpen(true);
    } catch (error) {
      setDeleteError(parseAccountRpcError(error));
    }
  };

  return (
    <AdminSectionShell>
      {deleteError && !deleteOpen ? (
        <div className="cc-inline-alert" role="alert">
          {deleteError}
        </div>
      ) : null}

      <RequirePermission
        permission="clients.write"
        fallback={<p className="cc-muted">إدارة حالة الحساب متاحة لمدير النظام فقط.</p>}
      >
        <div className="cc-account-mgmt__actions">
          {canChangeAccountLifecycle(status, "suspend") && canLifecycle ? (
            <button
              type="button"
              className="cc-btn"
              disabled={busy}
              onClick={() =>
                openStatus(
                  "suspend",
                  "إيقاف حساب العميل؟",
                  "سيتم إيقاف وصول العميل مؤقتًا دون تدمير بياناته.",
                  "الاحتفاظ بتاريخ العميل، البرنامج، التغذية، التقدم، السجلات، وسجل الفوترة.",
                  "تأكيد الإيقاف",
                )
              }
            >
              إيقاف الحساب مؤقتًا
            </button>
          ) : null}
          {canChangeAccountLifecycle(status, "reactivate") && canLifecycle ? (
            <button
              type="button"
              className="cc-btn cc-btn--primary"
              disabled={busy}
              onClick={() =>
                openStatus(
                  "reactivate",
                  "إعادة تفعيل الحساب؟",
                  "سيُعاد وصول العميل إذا كان ذلك متوافقًا مع حالة العضوية.",
                  "لا يغيّر حقيقة الاشتراك لدى مزود الدفع.",
                  "إعادة التفعيل",
                )
              }
            >
              إعادة التفعيل
            </button>
          ) : null}
          {canChangeAccountLifecycle(status, "archive") && canLifecycle ? (
            <button
              type="button"
              className="cc-btn"
              disabled={busy}
              onClick={() =>
                openStatus(
                  "archive",
                  "أرشفة العميل؟",
                  "الأرشفة لا تعني حذف الحساب. سيُزال من قوائم التشغيل اليومية الافتراضية مع الحفاظ على سجله.",
                  "لا حذف لتاريخ التدريب أو التغذية أو التقدم أو الملاحظات أو التدقيق أو الفوترة.",
                  "تأكيد الأرشفة",
                )
              }
            >
              أرشفة العميل
            </button>
          ) : null}
          {canChangeAccountLifecycle(status, "restore") && canLifecycle ? (
            <button
              type="button"
              className="cc-btn cc-btn--primary"
              disabled={busy}
              onClick={() =>
                openStatus(
                  "restore",
                  "استعادة العميل من الأرشيف؟",
                  "سيظهر العميل مجددًا في التشغيل اليومي الافتراضي.",
                  "لا يغيّر سجل التدريب أو الفوترة.",
                  "استعادة العميل",
                )
              }
            >
              استعادة من الأرشيف
            </button>
          ) : null}
        </div>
      </RequirePermission>

      <section className="cc-danger-zone" aria-label="منطقة حساسة">
        <h3 className="cc-danger-zone__title">منطقة حساسة</h3>
        <p className="cc-muted">هذه الإجراءات تؤثر على وصول العميل أو بيانات حسابه.</p>
        <div className="cc-danger-zone__rows">
          <div className="cc-danger-zone__row">
            <div>
              <strong>إيقاف الحساب مؤقتًا</strong>
              <p>منع الوصول مع الاحتفاظ بكل السجلات.</p>
            </div>
            <button
              type="button"
              className="cc-btn"
              disabled={!canLifecycle || busy || !canChangeAccountLifecycle(status, "suspend")}
              onClick={() =>
                openStatus(
                  "suspend",
                  "إيقاف حساب العميل؟",
                  "سيتم إيقاف وصول العميل مؤقتًا دون تدمير بياناته.",
                  "الاحتفاظ بتاريخ العميل، البرنامج، التغذية، التقدم، السجلات، وسجل الفوترة.",
                  "إيقاف",
                )
              }
            >
              إيقاف
            </button>
          </div>
          <div className="cc-danger-zone__row">
            <div>
              <strong>أرشفة العميل</strong>
              <p>إخفاء من القوائم اليومية دون حذف السجل.</p>
            </div>
            <button
              type="button"
              className="cc-btn"
              disabled={!canLifecycle || busy || !canChangeAccountLifecycle(status, "archive")}
              onClick={() =>
                openStatus(
                  "archive",
                  "أرشفة العميل؟",
                  "الأرشفة لا تعني حذف الحساب.",
                  "يُحفظ Client 360 وكل التاريخ التشغيلي.",
                  "أرشفة",
                )
              }
            >
              أرشفة
            </button>
          </div>
          <div className="cc-danger-zone__row cc-danger-zone__row--delete">
            <div>
              <strong>حذف حساب العميل نهائيًا</strong>
              <p>طلب متعدد المراحل. لا يُنفَّذ بنقرة واحدة ولا يمس حقيقة المزود.</p>
            </div>
            <button
              type="button"
              className="cc-btn cc-btn--danger"
              disabled={!canDelete || deleted || !overview.email}
              onClick={() => void openDelete()}
            >
              حذف الحساب
            </button>
          </div>
        </div>
        {!canDelete ? <p className="cc-muted">حذف الحساب متاح لمدير النظام فقط.</p> : null}
      </section>

      <AdminConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
      {deleteOpen && preview ? (
        <ClientAccountDeleteDialog
          clientName={name}
          expectedEmail={overview.email || ""}
          preview={preview}
          submitting={deleting}
          error={deleteError}
          onCancel={() => {
            if (deleting) return;
            setDeleteOpen(false);
            setPreview(null);
          }}
          onConfirm={(reason, email) => {
            if (deleting) return;
            setDeleting(true);
            setDeleteError(null);
            void executeAdminClientAccountDeletion({
              clientId: overview.id,
              reason,
              confirmationEmail: email,
              idempotencyKey: idempotencyRef.current ?? crypto.randomUUID(),
            })
              .then(async (result) => {
                if (result.blocked) {
                  setDeleteError("لا يمكن إكمال حذف الحساب قبل معالجة حالة الاشتراك/الدفع الحالية.");
                  const next = await previewAdminClientAccountDeletion(overview.id);
                  setPreview(next);
                  return;
                }
                setDeleteOpen(false);
                setPreview(null);
                await onUpdated();
              })
              .catch((error) => {
                setDeleteError(parseAccountRpcError(error));
              })
              .finally(() => setDeleting(false));
          }}
        />
      ) : null}
    </AdminSectionShell>
  );
}

function AdminSectionShell({ children }: { children: ReactNode }) {
  return (
    <section className="cc-account-mgmt" aria-labelledby="account-mgmt-heading">
      <h2 id="account-mgmt-heading" className="cc-section__title">
        إدارة الحساب
      </h2>
      <p className="cc-muted">حالة الحساب التشغيلية منفصلة عن حالة الاشتراك لدى مزود الدفع.</p>
      {children}
      <p className="cc-meta">
        الفوترة تُراجع من{" "}
        <Link to="/admin/memberships" className="cc-card-footer-link">
          العضوية والفوترة
        </Link>
        .
      </p>
    </section>
  );
}
