import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BillingOpsSubnav } from "@/components/admin/BillingOpsSubnav";
import { ProviderBindingBanner } from "@/components/admin/ProviderBindingBanner";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminSection,
} from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { fetchAdminOperationsSnapshot } from "@/lib/admin/admin-ops-api";
import {
  fetchAdminMemberSubscriptions,
  fetchAdminPaymentExceptions,
} from "@/lib/admin/admin-billing-ops-api";
import { buildBillingQuickStatus } from "@/lib/admin/admin-billing-ops-surfaces";

export const Route = createFileRoute("/admin/billing/")({
  ssr: false,
  head: () => ({ meta: [{ title: "الاشتراكات والمدفوعات | مركز التشغيل" }] }),
  component: BillingOperationsPage,
});

function BillingOperationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof fetchAdminOperationsSnapshot>> | null>(
    null,
  );
  const [memberships, setMemberships] = useState<Awaited<ReturnType<typeof fetchAdminMemberSubscriptions>>>(
    [],
  );
  const [exceptions, setExceptions] = useState<Awaited<ReturnType<typeof fetchAdminPaymentExceptions>>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextSnapshot, nextMemberships, nextExceptions] = await Promise.all([
        fetchAdminOperationsSnapshot(),
        fetchAdminMemberSubscriptions({}),
        fetchAdminPaymentExceptions(),
      ]);
      setSnapshot(nextSnapshot);
      setMemberships(nextMemberships);
      setExceptions(nextExceptions);
    } catch (err) {
      console.error(err);
      setError("تعذر تحميل بيانات الاشتراكات والمدفوعات.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const quickStatus = useMemo(
    () =>
      snapshot
        ? buildBillingQuickStatus(snapshot, memberships, exceptions)
        : null,
    [snapshot, memberships, exceptions],
  );

  return (
    <>
      <AdminPageHeader
        title="الاشتراكات والمدفوعات"
        subtitle="مراقبة العضويات والمدفوعات والاستثناءات — قراءة فقط دون تعديل حقيقة PSP."
      />
      <BillingOpsSubnav />
      <ProviderBindingBanner />

      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? <AdminSkeletonRows rows={5} /> : null}

      {!loading && !error && quickStatus ? (
        <AdminSection>
          <div className="cc-directory-summary">
            <article className="cc-directory-summary__card">
              <span className="cc-directory-summary__label">اشتراكات نشطة</span>
              <strong className="cc-directory-summary__value">{quickStatus.activeSubscriptions}</strong>
            </article>
            <article className="cc-directory-summary__card cc-directory-summary__card--attention">
              <span className="cc-directory-summary__label">تحتاج انتباهًا</span>
              <strong className="cc-directory-summary__value">{quickStatus.needsAttention}</strong>
            </article>
            <article className="cc-directory-summary__card cc-directory-summary__card--attention">
              <span className="cc-directory-summary__label">استثناءات دفع</span>
              <strong className="cc-directory-summary__value">{exceptions.length}</strong>
            </article>
            <article className="cc-directory-summary__card">
              <span className="cc-directory-summary__label">Legacy معلّق</span>
              <strong className="cc-directory-summary__value">{quickStatus.legacyPending}</strong>
            </article>
            <article className="cc-directory-summary__card">
              <span className="cc-directory-summary__label">أحداث مزود فاشلة</span>
              <strong className="cc-directory-summary__value">{snapshot?.pspFailedEvents ?? 0}</strong>
            </article>
          </div>

          <h2 className="cc-section__title">وصول سريع</h2>
          <div className="cc-ops-quick-links">
            <Link to="/admin/memberships" className="cc-btn cc-btn--primary">
              العضويات
            </Link>
            <Link to="/admin/payments" search={{ section: "exceptions" }} className="cc-btn">
              الاستثناءات
            </Link>
            <Link to="/admin/payments" search={{ section: "psp" }} className="cc-btn">
              مدفوعات PSP
            </Link>
            <Link to="/admin/payments" search={{ section: "provider-events" }} className="cc-btn">
              أحداث المزود
            </Link>
            <Link to="/admin/payments" search={{ section: "legacy" }} className="cc-btn">
              Legacy بنكي
            </Link>
          </div>

          {exceptions.length > 0 ? (
            <>
              <h2 className="cc-section__title cc-section__title--spaced">أهم الاستثناءات</h2>
              <ul className="cc-billing-exception-preview">
                {exceptions.slice(0, 5).map((row) => (
                  <li key={row.exceptionId}>
                    <strong>{row.subjectLabel}</strong>
                    <p className="cc-meta">{row.detail}</p>
                    <a href={row.href} className="cc-btn cc-btn--compact">
                      معالجة
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <AdminEmptyState
              title="لا توجد استثناءات دفع تحتاج مراجعتك."
              body="المسار الطبيعي للاشتراكات الناجحة لا يحتاج تدخلًا يدويًا."
            />
          )}
        </AdminSection>
      ) : null}
    </>
  );
}
