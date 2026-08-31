import { Link } from "@tanstack/react-router";
import { AdminEmptyState, AdminPriorityBadge, AdminTable } from "@/components/admin/AdminPage";
import type { OpsAttentionRow } from "@/lib/admin/admin-ops-surfaces";
import { formatRelativeAge } from "@/lib/admin/admin-status";

type Props = {
  rows: OpsAttentionRow[];
  emptyTitle: string;
  emptyBody: string;
};

export function OpsAttentionQueue({ rows, emptyTitle, emptyBody }: Props) {
  if (rows.length === 0) {
    return <AdminEmptyState title={emptyTitle} body={emptyBody} />;
  }

  return (
    <>
      <div className="cc-table-wrap cc-table-wrap--desktop">
        <AdminTable>
          <thead>
            <tr>
              <th>العميل</th>
              <th>المشكلة</th>
              <th>الخطة الحالية</th>
              <th>الأولوية</th>
              <th>السبب</th>
              <th>آخر نشاط</th>
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link to="/admin/clients/$clientId" params={{ clientId: row.clientId }}>
                    {row.clientName}
                  </Link>
                </td>
                <td>{row.issue}</td>
                <td>{row.currentPlan}</td>
                <td>
                  <AdminPriorityBadge priority={row.severity} />
                </td>
                <td>{row.reason}</td>
                <td className="cc-meta">
                  {row.lastActivity ? formatRelativeAge(row.lastActivity) : "—"}
                </td>
                <td>
                  <a href={row.href} className="cc-btn cc-btn--compact cc-btn--primary">
                    {row.actionLabel}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </div>
      <div className="cc-ops-card-list">
        {rows.map((row) => (
          <article key={row.id} className="cc-ops-card">
            <div className="cc-ops-card__head">
              <strong>{row.clientName}</strong>
              <AdminPriorityBadge priority={row.severity} />
            </div>
            <p>{row.issue}</p>
            <p className="cc-meta">{row.currentPlan}</p>
            <p>{row.reason}</p>
            <a href={row.href} className="cc-btn cc-btn--primary">
              {row.actionLabel}
            </a>
          </article>
        ))}
      </div>
    </>
  );
}
