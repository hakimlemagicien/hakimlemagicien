import { AdminLibraryStatusBadge } from "@/components/admin/AdminLibraryKit";
import { ProgramTemplateBadges } from "@/components/admin/programs/ProgramTemplateBadges";
import type { TemplatePresentation } from "@/lib/admin/admin-template-ui";
import { formatAdminDate } from "@/lib/admin/admin-status";
import type { AdminProgramListItem } from "@/lib/admin/admin-programs-api";

type Props = {
  row: AdminProgramListItem;
  presentation: TemplatePresentation;
  selected?: boolean;
  onOpen: () => void;
  onPreview: () => void;
  onClone: () => void;
  onNewVersion: () => void;
  onArchive?: () => void;
};

export function ProgramTemplateCard({
  row,
  presentation,
  selected,
  onOpen,
  onPreview,
  onClone,
  onNewVersion,
  onArchive,
}: Props) {
  return (
    <article className={["tpl-card", selected ? "is-selected" : ""].filter(Boolean).join(" ")}>
      <header className="tpl-card__header">
        <button type="button" className="tpl-card__title" onClick={onOpen}>
          {presentation.name}
        </button>
        <AdminLibraryStatusBadge
          status={row.archived_at ? "archived" : row.is_published ? "published" : "draft"}
          label={presentation.status_label}
        />
      </header>

      <ProgramTemplateBadges presentation={presentation} />

      <dl className="tpl-card__meta">
        <div>
          <dt>الجمهور المستهدف</dt>
          <dd>{presentation.target_audience ?? "غير متوفر (قالب قديم)"}</dd>
        </div>
        <div>
          <dt>الغرض</dt>
          <dd>{presentation.template_purpose ?? "غير متوفر (قالب قديم)"}</dd>
        </div>
        {presentation.admin_summary ? (
          <div>
            <dt>ملخص إداري</dt>
            <dd>{presentation.admin_summary}</dd>
          </div>
        ) : null}
        <div>
          <dt>الإصدار</dt>
          <dd>V{presentation.version}</dd>
        </div>
        <div>
          <dt>آخر تحديث</dt>
          <dd>{formatAdminDate(row.updated_at)}</dd>
        </div>
      </dl>

      <div className="tpl-card__actions cc-row-actions">
        <button type="button" className="cc-btn cc-btn--ghost" onClick={onOpen}>
          عرض القالب
        </button>
        <button type="button" className="cc-btn cc-btn--ghost" onClick={onPreview}>
          معاينة
        </button>
        <button type="button" className="cc-btn cc-btn--ghost" onClick={onClone}>
          نسخ
        </button>
        <button type="button" className="cc-btn cc-btn--ghost" onClick={onNewVersion}>
          نسخة جديدة
        </button>
        {onArchive ? (
          <button type="button" className="cc-btn cc-btn--ghost" onClick={onArchive}>
            أرشفة
          </button>
        ) : null}
      </div>
    </article>
  );
}
