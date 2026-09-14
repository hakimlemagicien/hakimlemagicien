import type { ReactNode } from "react";

type Props = {
  mode: "published" | "draft" | "none";
  editionLabel?: string | null;
  dirty: boolean;
  saving?: boolean;
  publishing?: boolean;
  previewOpen?: boolean;
  onCreateDraft?: () => void;
  onSaveDraft?: () => void;
  onPreview?: () => void;
  onPublish?: () => void;
  onDiscardDraft?: () => void;
  onClosePreview?: () => void;
  children?: ReactNode;
};

/** Sticky Draft ≠ Publish control plane for client assignment editors. */
export function AssignmentPublishBar({
  mode,
  editionLabel,
  dirty,
  saving,
  publishing,
  previewOpen,
  onCreateDraft,
  onSaveDraft,
  onPreview,
  onPublish,
  onDiscardDraft,
  onClosePreview,
}: Props) {
  const statusText =
    mode === "none"
      ? "لا تعيين"
      : mode === "published"
        ? "منشور للعميل"
        : dirty
          ? "مسودة — تغييرات غير محفوظة"
          : "مسودة محفوظة (العميل لا يراها)";

  return (
    <div className="cc-publish-bar" role="region" aria-label="حفظ ونشر التعيين">
      <div className="cc-publish-bar__status">
        <strong>{statusText}</strong>
        {editionLabel ? <span className="cc-muted">{editionLabel}</span> : null}
      </div>
      <div className="cc-publish-bar__actions">
        {mode === "published" && onCreateDraft ? (
          <button type="button" className="cc-btn cc-btn--primary" onClick={onCreateDraft}>
            إنشاء مسودة / نسخة جديدة
          </button>
        ) : null}
        {mode === "draft" ? (
          <>
            <button type="button" className="cc-btn" disabled={!dirty || saving} onClick={onSaveDraft}>
              {saving ? "جاري الحفظ…" : "حفظ المسودة"}
            </button>
            {onPreview ? (
              <button type="button" className="cc-btn" onClick={previewOpen ? onClosePreview : onPreview}>
                {previewOpen ? "إغلاق المعاينة" : "معاينة كعميل"}
              </button>
            ) : null}
            <button type="button" className="cc-btn cc-btn--primary" disabled={publishing || dirty} onClick={onPublish}>
              {publishing ? "جاري النشر…" : "Publish للعميل"}
            </button>
            {onDiscardDraft ? (
              <button type="button" className="cc-btn" onClick={onDiscardDraft}>
                تجاهل المسودة
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
