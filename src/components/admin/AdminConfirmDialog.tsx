import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type AdminConfirmDiff = {
  label: string;
  before: string;
  after: string;
};

export type AdminConfirmRequest = {
  title: string;
  body: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  reasonRequired?: boolean;
  reasonLabel?: string;
  impact?: string;
  subjectLabel?: string;
  diff?: AdminConfirmDiff[];
  onConfirm: (reason?: string) => void | Promise<void>;
};

export function AdminConfirmDialog({
  request,
  onClose,
}: {
  request: AdminConfirmRequest | null;
  onClose: () => void;
}) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setReason("");
    setSubmitting(false);
  }, [request]);

  useEffect(() => {
    if (!request) return;
    const target = request.tone === "danger" ? cancelRef.current : confirmRef.current;
    target?.focus();
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
  }, [request, onClose, submitting]);

  if (!request) return null;

  const reasonOk = !request.reasonRequired || reason.trim().length >= 5;
  const disabled = submitting || !reasonOk;

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
          {request.title}
        </h2>
        {request.subjectLabel ? <p className="cc-dialog__subject">{request.subjectLabel}</p> : null}
        <p className="cc-dialog__body">{request.body}</p>
        {request.impact ? <p className="cc-dialog__impact">{request.impact}</p> : null}
        {request.diff && request.diff.length > 0 ? (
          <div className="cc-dialog__diff" aria-label="قبل وبعد">
            {request.diff.map((row) => (
              <div key={row.label} className="cc-dialog__diff-row">
                <strong>{row.label}</strong>
                <div className="cc-dialog__diff-cols">
                  <span>
                    <em>قبل:</em> {row.before}
                  </span>
                  <span>
                    <em>بعد:</em> {row.after}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {request.reasonRequired ? (
          <label className="cc-dialog__reason">
            {request.reasonLabel ?? "سبب التعديل"}
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
        ) : null}
        <div className="cc-dialog__actions">
          <button
            ref={cancelRef}
            type="button"
            className="cc-btn cc-btn--ghost"
            disabled={submitting}
            onClick={onClose}
          >
            إلغاء
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={disabled}
            className={request.tone === "danger" ? "cc-btn cc-btn--danger" : "cc-btn cc-btn--primary"}
            onClick={() => {
              if (disabled) return;
              setSubmitting(true);
              void Promise.resolve(request.onConfirm(request.reasonRequired ? reason.trim() : undefined))
                .then(() => onClose())
                .finally(() => setSubmitting(false));
            }}
          >
            {submitting ? "جارٍ التنفيذ…" : request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminSkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="cc-skeleton-list" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="cc-skeleton-row" />
      ))}
    </div>
  );
}

export function AdminFilterBar({ children }: { children: ReactNode }) {
  return <div className="cc-filter-bar">{children}</div>;
}
