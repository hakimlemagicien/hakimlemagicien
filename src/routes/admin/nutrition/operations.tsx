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
import { fetchAdminClientOverview, searchAdminClients, type AdminClientOverview } from "@/lib/admin/admin-clients-api";
import {
  buildNutritionAttentionFromOverview,
  buildNutritionQuickStatus,
} from "@/lib/admin/admin-ops-surfaces";

export const Route = createFileRoute("/admin/nutrition/operations")({
  ssr: false,
  head: () => ({ meta: [{ title: "عمليات التغذية | مركز التشغيل" }] }),
  component: NutritionOperationsPage,
});

function NutritionOperationsPage() {
  const [overviews, setOverviews] = useState<AdminClientOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const clients = await searchAdminClients("", { offset: 0 });
      const rows = await Promise.all(
        clients.rows.slice(0, 25).map((row) => fetchAdminClientOverview(row.id)),
      );
      setOverviews(rows.filter((row): row is AdminClientOverview => Boolean(row)));
    } catch (err) {
      console.error(err);
      setError("تعذر تحميل عمليات التغذية.");
      setOverviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const quickStatus = useMemo(() => buildNutritionQuickStatus(overviews), [overviews]);
  const attentionRows = useMemo(
    () => overviews.flatMap((overview) => buildNutritionAttentionFromOverview(overview)),
    [overviews],
  );

  return (
    <>
      <AdminPageHeader
        title="عمليات التغذية"
        subtitle="متابعة خطط العملاء، التنبيهات الغذائية، والوصول إلى مكتبة الوجبات."
        actions={
          <Link to="/admin/nutrition" className="cc-btn cc-btn--ghost">
            مكتبة الوجبات
          </Link>
        }
      />
      <TrainingOpsSubnav section="nutrition" />

      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? <AdminSkeletonRows rows={5} /> : null}

      {!loading && !error ? (
        <AdminSection>
          <div className="cc-directory-summary">
            <article className="cc-directory-summary__card">
              <span className="cc-directory-summary__label">خطط نشطة</span>
              <strong className="cc-directory-summary__value">{quickStatus.activePlans}</strong>
              {quickStatus.fromSample ? (
                <span className="cc-directory-summary__hint">من {quickStatus.sampleSize} عميل محمّل</span>
              ) : null}
            </article>
            <article className="cc-directory-summary__card cc-directory-summary__card--attention">
              <span className="cc-directory-summary__label">تنبيهات تحتاج مراجعة</span>
              <strong className="cc-directory-summary__value">{quickStatus.needsAttention}</strong>
            </article>
          </div>

          <h2 className="cc-section__title">تنبيهات ومراجعات التغذية</h2>
          <OpsAttentionQueue
            rows={attentionRows}
            emptyTitle="لا توجد تنبيهات غذائية تحتاج مراجعة الآن."
            emptyBody="ستظهر هنا تعارضات الحساسية وإشارات المحرك المعتمدة."
          />

          <h2 className="cc-section__title cc-section__title--spaced">وصول سريع</h2>
          <div className="cc-ops-quick-links">
            <Link to="/admin/clients" className="cc-btn">
              عمليات العملاء
            </Link>
            <Link to="/admin/nutrition" className="cc-btn">
              مكتبة الوجبات
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
