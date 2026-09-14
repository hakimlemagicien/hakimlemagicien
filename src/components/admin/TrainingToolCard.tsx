import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type TrainingToolCardTone = "ok" | "warn" | "attention" | "neutral" | "info";

type TrainingToolCardProps = {
  title: string;
  preview: string;
  statusLabel: string;
  tone?: TrainingToolCardTone;
  children: ReactNode;
};

/** Status card that opens tool content in a blurred-backdrop modal (no page scroll). */
export function TrainingToolCard({
  title,
  preview,
  statusLabel,
  tone = "neutral",
  children,
}: TrainingToolCardProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`cc-tool-card cc-tool-card--${tone}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="cc-tool-card__chevron" aria-hidden="true">
          +
        </span>
        <span className="cc-tool-card__text">
          <strong className="cc-tool-card__title">{title}</strong>
          <span className="cc-tool-card__preview">{preview}</span>
        </span>
        <span className={`cc-tool-card__badge cc-tool-card__badge--${tone}`}>{statusLabel}</span>
      </button>

      {open
        ? createPortal(
            <div
              className="cc-tool-card-scrim"
              role="presentation"
              onClick={() => setOpen(false)}
            >
              <div
                className={`cc-tool-card-modal cc-tool-card-modal--${tone}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onClick={(event) => event.stopPropagation()}
              >
                <header className="cc-tool-card-modal__header">
                  <div className="cc-tool-card-modal__heading">
                    <h2 id={titleId} className="cc-tool-card-modal__title">
                      {title}
                    </h2>
                    <p className="cc-tool-card-modal__preview">{preview}</p>
                  </div>
                  <span className={`cc-tool-card__badge cc-tool-card__badge--${tone}`}>{statusLabel}</span>
                  <button
                    type="button"
                    className="cc-tool-card-modal__close"
                    onClick={() => setOpen(false)}
                    aria-label="إغلاق"
                  >
                    إغلاق
                  </button>
                </header>
                <div className="cc-tool-card-modal__body">{children}</div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
