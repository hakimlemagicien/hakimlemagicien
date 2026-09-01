import { Link } from "@tanstack/react-router";
import { useId, useRef, useState } from "react";
import type { ClientDeletionPreview } from "@/lib/admin/admin-client-account-api";
import { emailsMatchForDeletion, deletionBlockLabel } from "@/lib/admin/admin-client-account";

type Props = {
  clientName: string;
  expectedEmail: string;
  preview: ClientDeletionPreview;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (reason: string, email: string) => void;
};

export function ClientAccountDeleteDialog({
  clientName,
  expectedEmail,
  preview,
  submitting,
  error,
  onCancel,
  onConfirm,
}: Props) {
  const titleId = useId();
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState("");
  const [typedEmail, setTypedEmail] = useState("");
  const reasonOk = reason.trim().length >= 5;
  const emailOk = emailsMatchForDeletion(expectedEmail, typedEmail);
  const blocked = preview.blocked;
  const disabled = submitting || blocked || !reasonOk || !emailOk;

  return (
    <div className="cc-dialog-scrim" role="presentation" onClick={() => !submitting && onCancel()}>
      <div
        className="cc-dialog cc-dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="cc-dialog__title">
          حذف حساب {clientName} نهائيًا
        </h2>
        <p className="cc-dialog__body">
          الحذف النهائي ليس حذفًا لكل السجلات. سيُتعامل مع البيانات الشخصية وفق سياسة الاحتفاظ،
          وستبقى السجلات التي يجب الإبقاء عليها لأسباب مالية أو أمنية أو قانونية.
        </p>

        {blocked ? (
          <div className="cc-inline-alert" role="alert">
            <span>لا يمكن إكمال حذف الحساب قبل معالجة حالة الاشتراك/الدفع الحالية.</span>
            <Link to="/admin/memberships" className="cc-btn cc-btn--ghost cc-btn--compact">
              العضوية والفوترة
            </Link>
          </div>
        ) : null}

        {preview.blockers.length > 0 ? (
          <ul className="cc-delete-impact__list">
            {preview.blockers.map((code) => (
              <li key={code}>{deletionBlockLabel(code)}</li>
            ))}
          </ul>
        ) : null}

        <div className="cc-delete-impact">
          <p>
            <strong>سيتم التعامل مع:</strong>
          </p>
          <ul>
            {preview.impact.will_process.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            <strong>يُحتفظ به:</strong>
          </p>
          <ul>
            {preview.impact.will_retain.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            <strong>لن يحدث:</strong>
          </p>
          <ul>
            {preview.impact.will_not.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <label className="cc-dialog__reason">
          السبب (إلزامي)
          <textarea
            ref={reasonRef}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            required
            minLength={5}
            maxLength={1000}
            disabled={submitting || blocked}
          />
        </label>
        <label className="cc-dialog__reason">
          اكتب بريد العميل للتأكيد
          <input
            type="email"
            value={typedEmail}
            onChange={(event) => setTypedEmail(event.target.value)}
            placeholder={expectedEmail}
            autoComplete="off"
            disabled={submitting || blocked}
          />
        </label>
        {error ? (
          <p className="cc-inline-alert" role="alert">
            {error}
          </p>
        ) : null}
        <div className="cc-dialog__actions">
          <button type="button" className="cc-btn cc-btn--ghost" disabled={submitting} onClick={onCancel}>
            إلغاء
          </button>
          <button
            type="button"
            className="cc-btn cc-btn--danger"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              onConfirm(reason.trim(), typedEmail.trim());
            }}
          >
            {submitting ? "جارٍ التنفيذ…" : "تأكيد الحذف"}
          </button>
        </div>
      </div>
    </div>
  );
}
