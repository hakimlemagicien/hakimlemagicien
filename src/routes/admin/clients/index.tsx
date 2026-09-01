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
import {
  buildClientDirectorySummary,
  clientNeedsAttention,
} from "@/lib/admin/admin-client-ops";
import {
  formatAdminDate,
  formatRelativeAge,
  onboardingStatus,
  personInitials,
  planLabel,
  planStatusKind,
} from "@/lib/admin/admin-status";
import {
  clientAccountStatusLabel,
  clientAccountStatusTone,
  normalizeClientAccountStatus,
} from "@/lib/admin/admin-client-account";

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
  const [attentionFilter, setAttentionFilter] = useState(false);
  const [sort, setSort] = useState<ClientSort>("joined");
  const [accountFilter, setAccountFilter] = useState<"daily" | "all" | "active" | "suspended" | "archived">("all");

  useEffect(() => {
    setValue(q ?? "");
  }, [q]);

  useEffect(() => {
    const query = value.trim();
    const timer = window.setTimeout(() => {
      const nextQ = query || undefined;
      const currentQ = (q ?? "").trim() || undefined;
      if (currentQ === nextQ) return;
      void navigate({ search: { q: nextQ }, replace: true });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [value, navigate, q]);

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
      accountStatus:
        accountFilter === "daily" ? undefined : accountFilter === "all" ? "all" : accountFilter,
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
  }, [q, onboardingFilter, planFilter, accountFilter, blocked]);

  const filteredRows = useMemo(() => {
    const base = result?.rows ?? [];
    if (!attentionFilter) return base;
    return base.filter(clientNeedsAttention);
  }, [result, attentionFilter]);

  const rows = useMemo(() => sortClientRows(filteredRows, sort), [filteredRows, sort]);

  const summary = useMemo(
    () => buildClientDirectorySummary(result?.rows ?? [], result?.totalCount ?? 0),
    [result],
  );

  const hasActiveFilters =
    onboardingFilter !== "all" ||
    planFilter !== "all" ||
    attentionFilter ||
    sort !== "joined" ||
    accountFilter !== "all";

  const clearFilters = () => {
    setOnboardingFilter("all");
    setPlanFilter("all");
    setAttentionFilter(false);
    setSort("joined");
    setAccountFilter("all");
  };

  const loadMore = async () => {
    if (!result) return;
    const nextOffset = offset + ADMIN_CLIENT_PAGE_SIZE;
    setLoadingMore(true);
    try {
      const next = await searchAdminClients(query, {
        onboarding: onboardingFilter === "all" ? undefined : onboardingFilter,
        plan: planFilter === "all" ? undefined : planFilter,
        accountStatus:
          accountFilter === "daily" ? undefined : accountFilter === "all" ? "all" : accountFilter,
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
        title="العملاء"
        subtitle="إدارة ومتابعة جميع عملاء MAAKFIT من مكان واحد."
      />

      {!blocked && result ? (
        <div className="cc-directory-summary" aria-label="ملخص العملاء">
          <article className="cc-directory-summary__card">
            <span className="cc-directory-summary__label">إجمالي العملاء</span>
            <strong className="cc-directory-summary__value">{summary.totalClients}</strong>
          </article>
          <article className="cc-directory-summary__card">
            <span className="cc-directory-summary__label">عملاء جدد</span>
            <strong className="cc-directory-summary__value">{summary.newClients}</strong>
            {summary.fromVisibleRows ? (
              <span className="cc-directory-summary__hint">من الصفحة المحمّلة</span>
            ) : null}
          </article>
          <article className="cc-directory-summary__card">
            <span className="cc-directory-summary__label">نشطون</span>
            <strong className="cc-directory-summary__value">{summary.activeClients}</strong>
            {summary.fromVisibleRows ? (
              <span className="cc-directory-summary__hint">من الصفحة المحمّلة</span>
            ) : null}
          </article>
          <article className="cc-directory-summary__card cc-directory-summary__card--attention">
            <span className="cc-directory-summary__label">يحتاجون انتباهك</span>
            <strong className="cc-directory-summary__value">{summary.needsAttention}</strong>
            {summary.fromVisibleRows ? (
              <span className="cc-directory-summary__hint">من الصفحة المحمّلة</span>
            ) : null}
          </article>
        </div>
      ) : null}

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
            <option value="vip">Internal VIP</option>
            <option value="premium">Premium</option>
            <option value="essential">Essential</option>
            <option value="free">Free</option>
          </select>
        </label>
        <label className="cc-filter">
          <span>الحالة</span>
          <select
            value={accountFilter}
            onChange={(event) => setAccountFilter(event.target.value as typeof accountFilter)}
          >
            <option value="daily">التشغيل اليومي</option>
            <option value="all">الكل</option>
            <option value="active">نشط</option>
            <option value="suspended">موقوف</option>
            <option value="archived">مؤرشف</option>
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
        <label className="cc-filter cc-filter--checkbox">
          <input
            type="checkbox"
            checked={attentionFilter}
            onChange={(event) => setAttentionFilter(event.target.checked)}
          />
          <span>يحتاج انتباهك</span>
        </label>
        <label className="cc-filter">
          <span>ترتيب الصفحة</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as ClientSort)}>
            <option value="joined">تاريخ الانضمام</option>
            <option value="activity">آخر نشاط</option>
            <option value="unread">غير مقروء</option>
          </select>
        </label>
        {hasActiveFilters ? (
          <button type="button" className="cc-btn cc-btn--ghost cc-btn--compact" onClick={clearFilters}>
            مسح الفلاتر
          </button>
        ) : null}
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
            {attentionFilter ? " · فلتر الانتباه على الصفحة المحمّلة" : ""}
            {sort !== "joined" ? " · الترتيب على الصفحة المحمّلة فقط" : ""}
          </p>

          <div className="cc-table-wrap cc-table-wrap--desktop">
            <AdminTable>
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>الحالة</th>
                  <th>الخطة</th>
                  <th>التسجيل</th>
                  <th>آخر نشاط</th>
                  <th>انتباه</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <ClientDirectoryRow key={row.id} row={row} />
                ))}
              </tbody>
            </AdminTable>
          </div>

          <div className="cc-client-card-list">
            {rows.map((row) => (
              <ClientDirectoryCard key={row.id} row={row} />
            ))}
          </div>

          {result.truncated ? (
            <button type="button" className="cc-btn" disabled={loadingMore} onClick={() => void loadMore()}>
              {loadingMore
                ? "جاري التحميل…"
                : `تحميل المزيد (${result.rows.length.toLocaleString("ar-AE")} من ${result.totalCount.toLocaleString("ar-AE")})`}
            </button>
          ) : null}
        </>
      ) : null}
    </>
  );
}

function ClientDirectoryRow({ row }: { row: AdminClientListItem }) {
  const status = onboardingStatus(row.onboardingCompletedAt);
  const attention = attentionLabel(row);

  return (
    <tr>
      <td>
        <div className="cc-client-directory__identity">
          <span className="cc-avatar" aria-hidden>
            {personInitials(row.fullName)}
          </span>
          <div>
            <strong>{row.fullName || "بدون اسم"}</strong>
            <span className="cc-meta">{row.email || row.phone || "—"}</span>
          </div>
        </div>
      </td>
      <td>
        <AdminStatusBadge tone={clientAccountStatusTone(normalizeClientAccountStatus(row.accountStatus))}>
          {clientAccountStatusLabel(normalizeClientAccountStatus(row.accountStatus))}
        </AdminStatusBadge>
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
      <td>
        <AdminStatusBadge tone={status.kind}>{status.label}</AdminStatusBadge>
      </td>
      <td className="cc-meta">{row.lastActivityAt ? formatRelativeAge(row.lastActivityAt) : "—"}</td>
      <td>
        {attention ? (
          <span className="cc-client-directory__attention">{attention}</span>
        ) : (
          <span className="cc-muted">—</span>
        )}
      </td>
      <td>
        <Link to="/admin/clients/$clientId" params={{ clientId: row.id }} className="cc-btn cc-btn--compact cc-btn--primary">
          فتح العميل
        </Link>
      </td>
    </tr>
  );
}

function ClientDirectoryCard({ row }: { row: AdminClientListItem }) {
  const status = onboardingStatus(row.onboardingCompletedAt);
  const attention = attentionLabel(row);

  return (
    <article className="cc-client-card">
      <div className="cc-client-card__head">
        <span className="cc-avatar" aria-hidden>
          {personInitials(row.fullName)}
        </span>
        <div>
          <strong>{row.fullName || "بدون اسم"}</strong>
          <p className="cc-meta">{row.email || row.phone || "—"}</p>
        </div>
      </div>
      <div className="cc-client-card__meta">
        {row.membershipPlan ? (
          <AdminStatusBadge tone={planStatusKind(row.membershipPlan)}>
            {planLabel(row.membershipPlan)}
          </AdminStatusBadge>
        ) : null}
        <AdminStatusBadge tone={status.kind}>{status.label}</AdminStatusBadge>
        <AdminStatusBadge tone={clientAccountStatusTone(normalizeClientAccountStatus(row.accountStatus))}>
          {clientAccountStatusLabel(normalizeClientAccountStatus(row.accountStatus))}
        </AdminStatusBadge>
        {attention ? <span className="cc-client-directory__attention">{attention}</span> : null}
      </div>
      <p className="cc-meta">
        آخر نشاط: {row.lastActivityAt ? formatRelativeAge(row.lastActivityAt) : "—"} · انضم {formatAdminDate(row.createdAt)}
      </p>
      <Link to="/admin/clients/$clientId" params={{ clientId: row.id }} className="cc-btn cc-btn--primary">
        فتح العميل
      </Link>
    </article>
  );
}

function attentionLabel(row: AdminClientListItem): string | null {
  if (row.unreadCoachingCount > 0) return `${row.unreadCoachingCount} رسالة`;
  if (row.waitingCoaching) return "بانتظار رد";
  return null;
}

function sortClientRows(rows: AdminClientListItem[], sort: ClientSort): AdminClientListItem[] {
  const copy = [...rows];
  if (sort === "activity") {
    return copy.sort((a, b) => (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? ""));
  }
  if (sort === "unread") {
    return copy.sort(
      (a, b) =>
        b.unreadCoachingCount - a.unreadCoachingCount ||
        Number(b.waitingCoaching) - Number(a.waitingCoaching),
    );
  }
  return copy;
}
