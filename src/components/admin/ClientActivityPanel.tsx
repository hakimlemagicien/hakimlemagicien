import { useEffect, useState } from "react";
import {
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminSection,
} from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { listAdminAuditEvents, type AdminAuditEvent } from "@/lib/admin/admin-audit-api";
import { formatAdminDate, formatRelativeAge } from "@/lib/admin/admin-status";

type Props = {
  clientId: string;
  limit?: number;
  compact?: boolean;
};

/** Unified activity timeline — audit-backed only, no fake events. */
export function ClientActivityPanel({ clientId, limit, compact = false }: Props) {
  const [rows, setRows] = useState<AdminAuditEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    void listAdminAuditEvents({ subjectUserId: clientId })
      .then((events) => setRows(limit ? events.slice(0, limit) : events))
      .catch((err) => {
        console.error(err);
        setError("تعذر تحميل نشاط العميل.");
        setRows(null);
      })
      .finally(() => setLoading(false));
  }, [clientId, limit]);

  if (loading) return <AdminSkeletonRows rows={compact ? 2 : 4} />;
  if (error) return <AdminErrorState message={error} />;
  if (!rows || rows.length === 0) {
    return (
      <AdminEmptyState
        title="لا نشاط مسجّل"
        body="ستظهر هنا أحداث التدقيق والتشغيل المرتبطة بهذا العميل عند توفرها."
      />
    );
  }

  const content = (
    <ul className={compact ? "cc-timeline cc-timeline--compact" : "cc-timeline"}>
      {rows.map((row) => (
        <li key={row.id} className="cc-timeline__item">
          <span className="cc-timeline__dot" aria-hidden />
          <div className="cc-timeline__body">
            <p className="cc-timeline__title">{row.eventType}</p>
            <p className="cc-timeline__meta">
              {formatRelativeAge(row.createdAt)} · {formatAdminDate(row.createdAt)}
              {row.actorId ? ` · ${row.actorId.slice(0, 8)}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );

  if (compact) return content;

  return (
    <AdminSection>
      <AdminCard>
        <h2 className="cc-section__title">النشاط</h2>
        <p className="cc-muted">سجل موحّد من أحداث التدقيق — بدون دمج الملاحظات الداخلية.</p>
        {content}
      </AdminCard>
    </AdminSection>
  );
}
