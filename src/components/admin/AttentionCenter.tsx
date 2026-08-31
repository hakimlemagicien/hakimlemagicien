import { Link } from "@tanstack/react-router";
import { AdminPriorityBadge, AdminStatusBadge } from "@/components/admin/AdminPage";
import type { AttentionItem } from "@/lib/admin/admin-attention";
import { attentionCategoryLabel, attentionTypeLabel } from "@/lib/admin/admin-attention";

type Props = {
  items: AttentionItem[];
  loading?: boolean;
};

function ClientCell({ item }: { item: AttentionItem }) {
  const content = (
    <>
      <span className="cc-attention-row__avatar" aria-hidden>
        {item.clientName.slice(0, 1)}
      </span>
      <span>
        <strong>{item.clientName}</strong>
        {item.vip ? <AdminStatusBadge tone="vip">VIP</AdminStatusBadge> : null}
      </span>
    </>
  );
  if (item.clientId) {
    return (
      <Link
        to="/admin/clients/$clientId"
        params={{ clientId: item.clientId }}
        className="cc-attention-row__client-link"
        preload={false}
      >
        {content}
      </Link>
    );
  }
  return <div className="cc-attention-row__client">{content}</div>;
}

function AttentionRow({ item }: { item: AttentionItem }) {
  return (
    <>
      <div className="cc-attention-row cc-attention-row--desktop" role="row">
        <div className="cc-attention-row__cell cc-attention-row__client" role="cell">
          <ClientCell item={item} />
        </div>
        <div className="cc-attention-row__cell" role="cell">
          {attentionTypeLabel(item.type)}
        </div>
        <div className="cc-attention-row__cell cc-attention-row__reason" role="cell">
          {item.reason}
        </div>
        <div className="cc-attention-row__cell" role="cell">
          <AdminPriorityBadge priority={item.priority} />
        </div>
        <div className="cc-attention-row__cell cc-attention-row__age" role="cell">
          {item.ageLabel}
        </div>
        <div className="cc-attention-row__cell cc-attention-row__cta" role="cell">
          <a href={item.href} className="cc-btn cc-btn--ghost cc-btn--compact">
            {item.actionLabel}
          </a>
        </div>
      </div>

      <article className="cc-attention-row cc-attention-row--mobile">
        <header className="cc-attention-row__mobile-head">
          <ClientCell item={item} />
          <AdminPriorityBadge priority={item.priority} />
        </header>
        <p className="cc-attention-row__mobile-meta">
          {attentionCategoryLabel(item.category)} · {attentionTypeLabel(item.type)}
        </p>
        <p className="cc-attention-row__mobile-reason">{item.reason}</p>
        <footer className="cc-attention-row__mobile-foot">
          <span>{item.ageLabel}</span>
          <a href={item.href} className="cc-btn cc-btn--ghost cc-btn--compact">
            {item.actionLabel}
          </a>
        </footer>
      </article>
    </>
  );
}

export function AttentionCenter({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="cc-attention-panel cc-card" aria-busy="true">
        <div className="cc-attention-skeleton">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="cc-attention-skeleton__row" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div id="attention" className="cc-attention-panel cc-card cc-attention-empty">
        <AdminStatusBadge tone="positive">كل شيء تحت السيطرة</AdminStatusBadge>
        <p className="cc-muted">لا توجد حالات تتطلب تدخلك حاليًا.</p>
      </div>
    );
  }

  return (
    <div id="attention" className="cc-attention-panel cc-card">
      <div className="cc-attention-table" role="table" aria-label="يحتاج انتباهك">
        <div className="cc-attention-table__head cc-attention-row--desktop" role="row">
          <div className="cc-attention-row__cell" role="columnheader">
            العميل
          </div>
          <div className="cc-attention-row__cell" role="columnheader">
            النوع
          </div>
          <div className="cc-attention-row__cell" role="columnheader">
            السبب
          </div>
          <div className="cc-attention-row__cell" role="columnheader">
            الأهمية
          </div>
          <div className="cc-attention-row__cell" role="columnheader">
            منذ
          </div>
          <div className="cc-attention-row__cell cc-attention-row__cta" role="columnheader">
            إجراء
          </div>
        </div>
        <div className="cc-attention-table__body">
          {items.map((item) => (
            <AttentionRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
