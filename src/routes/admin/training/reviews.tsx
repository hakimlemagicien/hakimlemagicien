import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TrainingOpsSubnav } from "@/components/admin/TrainingOpsSubnav";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminSection,
  AdminTable,
} from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { listAdminAuditEvents } from "@/lib/admin/admin-audit-api";
import { buildTrainingReviewRows } from "@/lib/admin/admin-ops-surfaces";
import { formatAdminDate, formatRelativeAge } from "@/lib/admin/admin-status";

export const Route = createFileRoute("/admin/training/reviews")({
  ssr: false,
  head: () => ({ meta: [{ title: "مراجعات التدريب | مركز التشغيل" }] }),
  component: TrainingReviewsPage,
});

function TrainingReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<ReturnType<typeof buildTrainingReviewRows>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listAdminAuditEvents({ offset: 0 });
      setEvents(buildTrainingReviewRows(rows));
    } catch (err) {
      console.error(err);
      setError("تعذر تحميل مراجعات التدريب.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(
    () => [...events].sort((a, b) => b.when.localeCompare(a.when)),
    [events],
  );

  return (
    <>
      <AdminPageHeader
        title="مراجعات التدريب"
        subtitle="قرارات التعديل، التعيينات، والتغييرات التدريبية المسجّلة في السجل."
      />
      <TrainingOpsSubnav section="training" />

      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? <AdminSkeletonRows rows={6} /> : null}

      {!loading && !error ? (
        <AdminSection>
          {sorted.length === 0 ? (
            <AdminEmptyState title="كل المراجعات مكتملة." body="لا توجد أحداث تدريبية حديثة في السجل." />
          ) : (
            <>
              <div className="cc-table-wrap cc-table-wrap--desktop">
                <AdminTable>
                  <thead>
                    <tr>
                      <th>الحدث</th>
                      <th>العميل</th>
                      <th>المصدر</th>
                      <th>الوقت</th>
                      <th>إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row) => (
                      <tr key={row.id}>
                        <td>{row.what}</td>
                        <td>{row.clientName || "—"}</td>
                        <td className="cc-meta">{row.source || "—"}</td>
                        <td className="cc-meta">
                          {formatRelativeAge(row.when)} · {formatAdminDate(row.when)}
                        </td>
                        <td>
                          {row.clientId ? (
                            <Link
                              to="/admin/clients/$clientId"
                              params={{ clientId: row.clientId }}
                              search={{ tab: "training" }}
                              className="cc-btn cc-btn--compact"
                            >
                              مراجعة العميل
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              </div>
              <div className="cc-ops-card-list">
                {sorted.map((row) => (
                  <article key={row.id} className="cc-ops-card">
                    <strong>{row.what}</strong>
                    <p className="cc-meta">{row.clientName || "—"}</p>
                    <p className="cc-meta">{formatRelativeAge(row.when)}</p>
                    {row.clientId ? (
                      <Link
                        to="/admin/clients/$clientId"
                        params={{ clientId: row.clientId }}
                        search={{ tab: "training" }}
                        className="cc-btn cc-btn--primary"
                      >
                        مراجعة العميل
                      </Link>
                    ) : null}
                  </article>
                ))}
              </div>
            </>
          )}
        </AdminSection>
      ) : null}
    </>
  );
}
