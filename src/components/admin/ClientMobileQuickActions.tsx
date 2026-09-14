import { Link } from "@tanstack/react-router";
import { Dumbbell, Plus, StickyNote, UtensilsCrossed, Crown } from "lucide-react";
import { useEffect, useId, useState } from "react";

type Props = {
  clientId: string;
};

/** Mobile FAB + bottom sheet for common client operations. */
export function ClientMobileQuickActions({ clientId }: Props) {
  const [open, setOpen] = useState(false);
  const sheetId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="cc-client-fab">
      <button
        type="button"
        className="cc-client-fab__btn"
        aria-expanded={open}
        aria-controls={sheetId}
        aria-label="إجراء سريع للعميل"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-6 w-6" aria-hidden />
      </button>

      {open ? (
        <div className="cc-mobile-more-scrim" role="presentation" onClick={() => setOpen(false)}>
          <div
            id={sheetId}
            className="cc-mobile-more-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="إجراءات العميل"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cc-mobile-more-sheet__handle" aria-hidden />
            <p className="cc-mobile-more-sheet__title">إجراء سريع</p>
            <ul className="cc-mobile-more-sheet__list">
              <li>
                <Link
                  to="/admin/clients/$clientId"
                  params={{ clientId }}
                  search={{ tab: "training" }}
                  className="cc-mobile-more-link"
                  onClick={() => setOpen(false)}
                >
                  <Dumbbell className="h-4 w-4" aria-hidden />
                  <span>تعيين / تعديل تدريب</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/clients/$clientId"
                  params={{ clientId }}
                  search={{ tab: "nutrition" }}
                  className="cc-mobile-more-link"
                  onClick={() => setOpen(false)}
                >
                  <UtensilsCrossed className="h-4 w-4" aria-hidden />
                  <span>تعيين / تعديل تغذية</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/clients/$clientId"
                  params={{ clientId }}
                  search={{ tab: "membership" }}
                  className="cc-mobile-more-link"
                  onClick={() => setOpen(false)}
                >
                  <Crown className="h-4 w-4" aria-hidden />
                  <span>تعديل العضوية</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/clients/$clientId"
                  params={{ clientId }}
                  search={{ tab: "notes" }}
                  className="cc-mobile-more-link"
                  onClick={() => setOpen(false)}
                >
                  <StickyNote className="h-4 w-4" aria-hidden />
                  <span>إضافة ملاحظة</span>
                </Link>
              </li>
            </ul>
            <button type="button" className="cc-btn" onClick={() => setOpen(false)}>
              إغلاق
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
