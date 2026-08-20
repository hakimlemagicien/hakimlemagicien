import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminSearchInput,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/AdminPage";
import { AdminFilterBar, AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import {
  ADMIN_CLIENT_MIN_QUERY,
  searchAdminClients,
  type AdminClientSearchResult,
} from "@/lib/admin/admin-clients-api";
import { formatRelativeAge, onboardingStatus, planLabel, planStatusKind } from "@/lib/admin/admin-status";

type ClientsSearch = { q?: string };

export const Route = createFileRoute("/admin/clients/")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): ClientsSearch => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({ meta: [{ title: "العملاء | مركز التشغيل" }] }),
  component: AdminClientsPage,
});

function AdminClientsPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/clients/" });
  const [value, setValue] = useState(q ?? "");
  const [result, setResult] = useState<AdminClientSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingFilter, setOnboardingFilter] = useState<"all" | "complete" | "incomplete">("all");
  const [planFilter, setPlanFilter] = useState<"all" | "vip" | "premium" | "essential" | "free">("all");

  useEffect(() => {
    setValue(q ?? "");
  }, [q]);

  useEffect(() => {
    const query = value.trim();
    const timer = window.setTimeout(() => {
      void navigate({ search: { q: query || undefined } });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [value, navigate]);

  useEffect(() => {
    const query = (q ?? "").trim();
    if (query.length < ADMIN_CLIENT_MIN_QUERY) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void searchAdminClients(query, {
      onboarding: onboardingFilter === "all" ? undefined : onboardingFilter,
      plan: planFilter === "all" ? undefined : planFilter,
    })
      .then((next) => {
        if (!cancelled) setResult(next);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setError("تعذر تحميل العملاء. أعد المحاولة.");
          setResult(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [q, onboardingFilter, planFilter]);

  const rows = result?.rows ?? [];

  const query = value.trim();
  const minQuery = query.length > 0 && query.length < ADMIN_CLIENT_MIN_QUERY;

  return (
    <>
      <AdminPageHeader
        kicker="العملاء والمتابعة"
        title="العملاء"
        subtitle="ابحث بالاسم أو البريد أو الهاتف. لا تُحمَّل قائمة كل العملاء دفعة واحدة."
      />

      <AdminSearchInput
        label="بحث العملاء"
        value={value}
        onChange={setValue}
        placeholder="اكتب حرفين على الأقل: اسم أو بريد أو هاتف"
      />

      <AdminFilterBar>
        <label className="cc-filter">
          <span>الخطة</span>
          <select
            value={planFilter}
            onChange={(event) => setPlanFilter(event.target.value as typeof planFilter)}
          >
            <option value="all">الكل</option>
            <option value="vip">VIP</option>
            <option value="premium">Premium</option>
            <option value="essential">Essential</option>
            <option value="free">Free</option>
          </select>
        </label>
        <label className="cc-filter">
          <span>التسجيل</span>
          <select
            value={onboardingFilter}
            onChange={(event) => setOnboardingFilter(event.target.value as typeof onboardingFilter)}
          >
            <option value="all">الكل</option>
            <option value="complete">مكتمل</option>
            <option value="incomplete">غير مكتمل</option>
          </select>
        </label>
        <span className="cc-filter-chip is-disabled">آخر مراجعة — غير معتمدة</span>
      </AdminFilterBar>

      {minQuery ? <AdminEmptyState title="أكمل البحث" body="أدخل حرفين على الأقل قبل الاستعلام." /> : null}
      {error ? <AdminErrorState message={error} onRetry={() => void navigate({ search: { q } })} /> : null}
      {loading ? <AdminSkeletonRows rows={6} /> : null}

      {!query && !loading ? (
        <AdminEmptyState
          title="ابدأ بالبحث"
          body="اكتب حرفين على الأقل للعثور على عميل. هذه الشاشة لا تعرض كل العملاء تلقائياً."
        />
      ) : null}

      {!loading && result && rows.length === 0 && query.length >= ADMIN_CLIENT_MIN_QUERY ? (
        <AdminEmptyState
          title="لا نتائج"
          body={
            onboardingFilter === "all"
              ? `لا يوجد عميل مطابق لـ «${result.query}».`
              : "لا نتائج داخل هذا الفلتر. جرّب «الكل في النتائج»."
          }
        />
      ) : null}

      {!loading && result && rows.length > 0 ? (
        <>
          {result.truncated ? (
            <p className="cc-muted">النتائج مقصوصة على أول 25 من {result.totalCount}. ضيّق البحث.</p>
          ) : null}
          <AdminTable>
            <thead>
              <tr>
                <th>العميل</th>
                <th>الهدف</th>
                <th>الخطة</th>
                <th>الحالة</th>
                <th>آخر نشاط</th>
                <th>انتباه</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = onboardingStatus(row.onboardingCompletedAt);
                const attention =
                  row.unreadCoachingCount > 0
                    ? `${row.unreadCoachingCount} رسالة`
                    : row.waitingCoaching
                      ? "بانتظار رد"
                      : "—";
                return (
                  <tr key={row.id}>
                    <td>
                      <Link to="/admin/clients/$clientId" params={{ clientId: row.id }} className="cc-client-link">
                        <strong>{row.fullName || "بدون اسم"}</strong>
                        <span>{row.email || row.phone || "—"}</span>
                      </Link>
                    </td>
                    <td>{row.goal || "—"}</td>
                    <td>
                      {row.membershipPlan ? (
                        <AdminStatusBadge tone={planStatusKind(row.membershipPlan)}>
                          {planLabel(row.membershipPlan)}
                        </AdminStatusBadge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <AdminStatusBadge tone={status.kind}>{status.label}</AdminStatusBadge>
                    </td>
                    <td className="cc-meta">{row.lastActivityAt ? formatRelativeAge(row.lastActivityAt) : "—"}</td>
                    <td>{attention}</td>
                    <td>
                      <Link to="/admin/clients/$clientId" params={{ clientId: row.id }} className="cc-btn cc-btn--compact">
                        فتح الملف
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTable>
        </>
      ) : null}
    </>
  );
}
