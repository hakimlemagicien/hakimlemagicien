import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OpsAttentionQueue } from "@/components/admin/OpsAttentionQueue";
import { TrainingOpsSubnav } from "@/components/admin/TrainingOpsSubnav";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminSection,
} from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { fetchAdminClientOverview, searchAdminClients } from "@/lib/admin/admin-clients-api";
import {
  buildTrainingAttentionFromOverview,
  buildTrainingQuickStatus,
} from "@/lib/admin/admin-ops-surfaces";
import type { AdminClientOverview } from "@/lib/admin/admin-clients-api";

export const Route = createFileRoute("/admin/training/")({
  ssr: false,
  head: () => ({ meta: [{ title: "عمليات التدريب | مركز التشغيل" }] }),
  component: TrainingOperationsPage,
});

function TrainingOperationsPage() {
  const [overviews, setOverviews] = useState<AdminClientOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const clients = await searchAdminClients("", { offset: 0 });
      const rows = await Promise.all(
        clients.rows.slice(0, 25).map(async (row) => {
          const overview = await fetchAdminClientOverview(row.id);
          return overview;
        }),
      );
      setOverviews(rows.filter((row): row is AdminClientOverview => Boolean(row)));
    } catch (err) {
      console.error(err);
      setError("تعذر تحميل عمليات التدريب.");
      setOverviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const quickStatus = useMemo(() => buildTrainingQuickStatus(overviews), [overviews]);
  const attentionRows = useMemo(
    () => overviews.flatMap((overview) => buildTrainingAttentionFromOverview(overview)),
    [overviews],
  );

  return (
    <>
      <AdminPageHeader
        title="عمليات التدريب"
        subtitle="متابعة البرامج النشطة، المراجعات، والحالات التي تحتاج تدخل المدرب."
        actions={
          <Link to="/admin/exercises" className="cc-btn cc-btn--ghost">
            مكتبة التمارين
          </Link>
        }
      />
      <TrainingOpsSubnav section="training" />

      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? <AdminSkeletonRows rows={5} /> : null}

      {!loading && !error ? (
        <AdminSection>
          <div className="cc-directory-summary">
            <article className="cc-directory-summary__card">
              <span className="cc-directory-summary__label">برامج نشطة</span>
              <strong className="cc-directory-summary__value">{quickStatus.activePrograms}</strong>
              {quickStatus.fromSample ? (
                <span className="cc-directory-summary__hint">من {quickStatus.sampleSize} عميل محمّل</span>
              ) : null}
            </article>
            <article className="cc-directory-summary__card cc-directory-summary__card--attention">
              <span className="cc-directory-summary__label">يحتاج مراجعة</span>
              <strong className="cc-directory-summary__value">{quickStatus.needsReview}</strong>
              {quickStatus.fromSample ? (
                <span className="cc-directory-summary__hint">من العينة المحمّلة</span>
              ) : null}
            </article>
            <article className="cc-directory-summary__card">
              <span className="cc-directory-summary__label">مراجعات التدريب</span>
              <strong className="cc-directory-summary__value">
                <Link to="/admin/training/reviews">فتح المركز</Link>
              </strong>
            </article>
          </div>

          <h2 className="cc-section__title">يحتاج انتباهك — التدريب</h2>
          <OpsAttentionQueue
            rows={attentionRows}
            emptyTitle="لا توجد حالات تدريبية تحتاج تدخلك الآن."
            emptyBody="ستظهر هنا إشارات المحرك المعتمدة عند توفرها."
          />

          <h2 className="cc-section__title cc-section__title--spaced">وصول سريع</h2>
          <div className="cc-ops-quick-links">
            <Link to="/admin/clients" className="cc-btn">
              عمليات العملاء
            </Link>
            <Link to="/admin/programs" className="cc-btn">
              مكتبة البرامج
            </Link>
            <Link to="/admin/exercises" className="cc-btn">
              مكتبة التمارين
            </Link>
          </div>
        </AdminSection>
      ) : null}

      {!loading && !error && overviews.length === 0 ? (
        <AdminEmptyState title="لا بيانات" body="لم يتم تحميل عملاء للعينة التشغيلية." />
      ) : null}
    </>
  );
}
