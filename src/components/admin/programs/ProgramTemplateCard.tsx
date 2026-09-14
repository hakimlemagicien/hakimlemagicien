import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AdminLibraryStatusBadge } from "@/components/admin/AdminLibraryKit";
import type { TemplatePresentation } from "@/lib/admin/admin-template-ui";
import type { AdminProgramListItem } from "@/lib/admin/admin-programs-api";

type Props = {
  row: AdminProgramListItem;
  presentation: TemplatePresentation;
  selected?: boolean;
  onOpen: () => void;
  onPreview: () => void;
  onClone?: () => void;
  onNewVersion: () => void;
  onArchive?: () => void;
};

export function ProgramTemplateCard({
  row,
  presentation,
  selected,
  onOpen,
  onPreview,
  onNewVersion,
  onArchive,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const run = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <article
      ref={rootRef}
      className={["tpl-card", menuOpen ? "is-open" : "", selected ? "is-selected" : ""].filter(Boolean).join(" ")}
    >
      <button
        type="button"
        className="tpl-card__main"
        aria-expanded={menuOpen}
        aria-controls={menuId}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="tpl-card__title-block">
          <strong className="tpl-card__title">{presentation.name}</strong>
          <AdminLibraryStatusBadge
            status={row.archived_at ? "archived" : row.is_published ? "published" : "draft"}
            label={presentation.status_label}
          />
        </span>
        <span className="tpl-card__chevron" aria-hidden="true">
          <ChevronDown size={18} />
        </span>
      </button>

      {menuOpen ? (
        <div id={menuId} className="tpl-card__menu" role="menu" aria-label={`خيارات ${presentation.name}`}>
          <button type="button" role="menuitem" className="tpl-card__menu-item" onClick={() => run(onOpen)}>
            تعديل القالب
          </button>
          <button type="button" role="menuitem" className="tpl-card__menu-item" onClick={() => run(onPreview)}>
            معاينة لعميل
          </button>
          <button type="button" role="menuitem" className="tpl-card__menu-item" onClick={() => run(onNewVersion)}>
            نسخة جديدة
          </button>
          {onArchive ? (
            <button
              type="button"
              role="menuitem"
              className="tpl-card__menu-item tpl-card__menu-item--danger"
              onClick={() => run(onArchive)}
            >
              أرشفة
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
