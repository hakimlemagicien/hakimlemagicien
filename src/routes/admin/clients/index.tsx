import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  ADMIN_CLIENT_PAGE_SIZE,
  searchAdminClients,
  type AdminClientListItem,
  type AdminClientSearchResult,
} from "@/lib/admin/admin-clients-api";
import { formatAdminDate, formatRelativeAge, onboardingStatus, planLabel, planStatusKind } from "@/lib/admin/admin-status";

type ClientsSearch = { q?: string };
type ClientSort = "joined" | "activity" | "unread";

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [onboardingFilter, setOnboardingFilter] = useState<"all" | "complete" | "incomplete">("all");
  const [planFilter, setPlanFilter] = useState<"all" | "vip" | "premium" | "essential" | "free">("all");
  const [sort, setSort] = useState<ClientSort>("joined");

  useEffect(() => {
    setValue(q ?? "");
  }, [q]);

  useEffect(() => {
    const query = value.trim();
    const timer = window.setTimeout(() => {
      void navigate({ search: { q: query || undefined } });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [value, navigate]);

  const query = (q ?? "").trim();
  const blocked = query.length === 1;

  useEffect(() => {
    if (blocked) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setOffset(0);
    void searchAdminClients(query, {
      onboarding: onboardingFilter === "all" ? undefined : onboardingFilter,
      plan: planFilter === "all" ? undefined : planFilter,
      offset: 0,
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
  }, [q, onboardingFilter, planFilter, blocked]);

  const rows = useMemo(() => sortClientRows(result?.rows ?? [], sort), [result, sort]);

  const loadMore = async () => {
    if (!result) return;
    const nextOffset = offset + ADMIN_CLIENT_PAGE_SIZE;
    setLoadingMore(true);
    try {
      const next = await searchAdminClients(query, {
        onboarding: onboardingFilter === "all" ? undefined : onboardingFilter,
        plan: planFilter === "all" ? undefined : planFilter,
        offset: nextOffset,
      });
      setResult({
        ...next,
        rows: [...result.rows, ...next.rows],
        truncated: next.truncated,
        totalCount: next.totalCount,
      });
      setOffset(nextOffset);
    } catch (err) {
      console.error(err);
      setError("تعذر تحميل المزيد.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        kicker="العملاء والمتابعة"
        title="العملاء"
        subtitle="دليل تشغيلي مرقّم. البحث اختياري — حرف واحد لا يُرسل. لا تحميل لكل العملاء دفعة واحدة."
      />

      <AdminSearchInput
        label="بحث العملاء"
        value={value}
        onChange={setValue}
        placeholder="اسم أو بريد أو هاتف — أو اتركه فارغاً للتصفح المرقّم"
      />

      <AdminFilterBar>
        <label className="cc-filter">
          <span>الخطة</span>
          <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value as typeof planFilter)}>
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
        <label className="cc-filter">
          <span>ترتيب الصفحة</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as ClientSort)}>
            <option value="joined">تاريخ الانضمام</option>
            <option value="activity">آخر نشاط</option>
            <option value="unread">غير مقروء</option>
          </select>
        </label>
        <span className="cc-filter-chip is-disabled">مراجعة مستحقة — غير معتمدة</span>
      </AdminFilterBar>

      {blocked ? <AdminEmptyState title="أكمل البحث" body="أدخل حرفين على الأقل أو امسح الحقل لتصفح الصفحة." /> : null}
      {error ? <AdminErrorState message={error} onRetry={() => void navigate({ search: { q } })} /> : null}
      {loading ? <AdminSkeletonRows rows={6} /> : null}

      {!loading && result && rows.length === 0 && !blocked ? (
        <AdminEmptyState title="لا نتائج" body="لا يوجد عميل مطابق لهذه التصفية." />
      ) : null}

      {!loading && result && rows.length > 0 ? (
        <>
          <p className="cc-muted">
            {result.totalCount} عميل مطابق — عرض {rows.length}
            {sort !== "joined" ? " · الترتيب على الصفحة المحمّلة فقط" : ""}
          </p>
          <AdminTable>
            <thead>
              <tr>
                <th>العميل</th>
                <th>الخطة</th>
                <th>الهدف</th>
                <th>التسجيل</th>
                <th>آخر نشاط</th>
                <th>غير مقروء</th>
                <th>انتباه</th>
                <th>انضم</th>
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
                    <td>
                      {row.membershipPlan ? (
                        <AdminStatusBadge tone={planStatusKind(row.membershipPlan)}>
                          {planLabel(row.membershipPlan)}
                        </AdminStatusBadge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{row.goal || "—"}</td>
                    <td>
                      <AdminStatusBadge tone={status.kind}>{status.label}</AdminStatusBadge>
                    </td>
                    <td className="cc-meta">{row.lastActivityAt ? formatRelativeAge(row.lastActivityAt) : "—"}</td>
                    <td>{row.unreadCoachingCount || "—"}</td>
                    <td>{attention}</td>
                    <td className="cc-meta">{formatAdminDate(row.createdAt)}</td>
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
          {result.truncated ? (
            <button type="button" className="cc-btn" disabled={loadingMore} onClick={() => void loadMore()}>
              {loadingMore ? "جاري التحميل…" : "المزيد"}
            </button>
          ) : null}
        </>
      ) : null}
    </>
  );
}

function sortClientRows(rows: AdminClientListItem[], sort: ClientSort): AdminClientListItem[] {
  const copy = [...rows];
  if (sort === "activity") {
    return copy.sort((a, b) => (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? ""));
  }
  if (sort === "unread") {
    return copy.sort((a, b) => b.unreadCoachingCount - a.unreadCoachingCount || Number(b.waitingCoaching) - Number(a.waitingCoaching));
  }
  return copy;
}
