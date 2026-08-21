import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type AdminConfirmRequest = {
  title: string;
  body: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  reasonRequired?: boolean;
  reasonLabel?: string;
  onConfirm: (reason?: string) => void;
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

  useEffect(() => {
    setReason("");
  }, [request]);

  useEffect(() => {
    if (!request) return;
    const target = request.tone === "danger" ? cancelRef.current : confirmRef.current;
    target?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [request, onClose]);

  if (!request) return null;

  const reasonOk = !request.reasonRequired || reason.trim().length >= 3;

  return (
    <div className="cc-dialog-scrim" role="presentation" onClick={onClose}>
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
        <p className="cc-dialog__body">{request.body}</p>
        {request.reasonRequired ? (
          <label className="cc-dialog__reason">
            {request.reasonLabel ?? "السبب"}
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              required
            />
          </label>
        ) : null}
        <div className="cc-dialog__actions">
          <button ref={cancelRef} type="button" className="cc-btn cc-btn--ghost" onClick={onClose}>
            إلغاء
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={!reasonOk}
            className={request.tone === "danger" ? "cc-btn cc-btn--danger" : "cc-btn cc-btn--primary"}
            onClick={() => {
              request.onConfirm(request.reasonRequired ? reason.trim() : undefined);
              onClose();
            }}
          >
            {request.confirmLabel}
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
