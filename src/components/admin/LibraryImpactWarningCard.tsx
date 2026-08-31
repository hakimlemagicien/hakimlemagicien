import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { LibraryImpactWarning } from "@/lib/admin/admin-library-safety";

type Props = {
  warning: LibraryImpactWarning;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
};

export function LibraryImpactWarningCard({ warning, onConfirm, onCancel, busy }: Props) {
  return (
    <div
      className={`cc-library-impact ${warning.isCore100 ? "cc-library-impact--core100" : ""}`}
      role="alert"
    >
      <div className="cc-library-impact__head">
        {warning.isCore100 ? (
          <ShieldAlert className="cc-library-impact__icon" aria-hidden />
        ) : (
          <AlertTriangle className="cc-library-impact__icon" aria-hidden />
        )}
        <strong>{warning.title}</strong>
      </div>
      <p>{warning.reason}</p>
      <p className="cc-meta">الحقول المتأثرة: {warning.fields.join("، ")}</p>
      <p className="cc-muted">تأثير العملاء الحاليين غير محسوب تلقائيًا.</p>
      <div className="cc-editor-toolbar">
        <button type="button" className="cc-btn cc-btn--primary" disabled={busy} onClick={onConfirm}>
          تأكيد الحفظ
        </button>
        <button type="button" className="cc-btn" disabled={busy} onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </div>
  );
}
