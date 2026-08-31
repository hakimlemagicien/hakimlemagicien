import { AdminPriorityBadge, AdminStatusBadge } from "@/components/admin/AdminPage";
import type { AttentionItem } from "@/lib/admin/admin-attention";
import { attentionCategoryLabel, attentionTypeLabel } from "@/lib/admin/admin-attention";

type Props = {
  items: AttentionItem[];
  loading?: boolean;
};

export function AttentionCenter({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="cc-attention-list" aria-busy="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="cc-attention-card cc-attention-card--skeleton" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cc-attention-empty">
        <AdminStatusBadge tone="positive">كل شيء تحت السيطرة</AdminStatusBadge>
        <p className="cc-muted">لا توجد حالات تحتاج تدخلاً من الإشارات المعتمدة حالياً.</p>
      </div>
    );
  }

  return (
    <div id="attention" className="cc-attention-list">
      {items.map((item) => (
        <article key={item.id} className="cc-attention-card">
          <header className="cc-attention-card__head">
            <div className="cc-cell-stack">
              <strong>{item.clientName}</strong>
              {item.vip ? <AdminStatusBadge tone="vip">VIP</AdminStatusBadge> : null}
            </div>
            <AdminPriorityBadge priority={item.priority} />
          </header>
          <dl className="cc-attention-card__meta">
            <div>
              <dt>النوع</dt>
              <dd>{attentionTypeLabel(item.type)}</dd>
            </div>
            <div>
              <dt>الفئة</dt>
              <dd>{attentionCategoryLabel(item.category)}</dd>
            </div>
            <div>
              <dt>الحالة</dt>
              <dd>{item.statusLabel}</dd>
            </div>
            <div>
              <dt>منذ</dt>
              <dd>{item.ageLabel}</dd>
            </div>
          </dl>
          <p className="cc-attention-card__reason">{item.reason}</p>
          {item.planLabel ? <p className="cc-meta">الخطة: {item.planLabel}</p> : null}
          <footer className="cc-attention-card__actions">
            <a href={item.href} className="cc-btn cc-btn--primary cc-btn--compact">
              {item.actionLabel}
            </a>
          </footer>
        </article>
      ))}
    </div>
  );
}
