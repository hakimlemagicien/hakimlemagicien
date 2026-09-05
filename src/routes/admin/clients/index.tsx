import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Clock, Plus, SlidersHorizontal, UserCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminSearchInput,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/AdminPage";
import { AdminConfirmDialog, AdminFilterBar, AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
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
  directoryOperationalLabel,
  directoryOperationalStatus,
  directoryOperationalTone,
  directoryPlanLabelAr,
  directoryPlanTone,
  paginationPages,
} from "@/lib/admin/admin-client-ops";
import { formatAdminActivityStamp, formatAdminDate } from "@/lib/admin/admin-status";
import { AdminClientAvatar } from "@/components/admin/AdminClientAvatar";

type ClientsSearch = { q?: string };
type ClientSort = "joined" | "activity" | "unread";
type DirectoryTab = "all" | "active" | "paused" | "attention";

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
  const [offset, setOffset] = useState(0);
  const [onboardingFilter, setOnboardingFilter] = useState<"all" | "complete" | "incomplete">("all");
  const [planFilter, setPlanFilter] = useState<"all" | "vip" | "premium" | "essential" | "free">("all");
  const [sort, setSort] = useState<ClientSort>("joined");
  const [accountFilter, setAccountFilter] = useState<"daily" | "all" | "active" | "suspended" | "archived">("all");
  const [attentionFilter, setAttentionFilter] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  const directoryTab: DirectoryTab = attentionFilter
    ? "attention"
    : accountFilter === "active"
      ? "active"
      : accountFilter === "suspended"
        ? "paused"
        : "all";

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

  useEffect(() => {
    setOffset(0);
  }, [q, onboardingFilter, planFilter, accountFilter, attentionFilter]);

  const query = (q ?? "").trim();
  const blocked = query.length > 0 && query.length < ADMIN_CLIENT_MIN_QUERY;

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
    void searchAdminClients(query, {
      onboarding: onboardingFilter === "all" ? undefined : onboardingFilter,
      plan: planFilter === "all" ? undefined : planFilter,
      accountStatus:
        accountFilter === "daily" ? undefined : accountFilter === "all" ? "all" : accountFilter,
      offset,
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
  }, [q, onboardingFilter, planFilter, accountFilter, blocked, offset]);

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

  const extraFiltersActive =
    onboardingFilter !== "all" || planFilter !== "all" || sort !== "joined" || accountFilter === "daily" || accountFilter === "archived";

  const hasActiveFilters = extraFiltersActive || directoryTab !== "all";

  const setDirectoryTab = (tab: DirectoryTab) => {
    setAttentionFilter(tab === "attention");
    if (tab === "active") setAccountFilter("active");
    else if (tab === "paused") setAccountFilter("suspended");
    else setAccountFilter("all");
  };

  const clearFilters = () => {
    setOnboardingFilter("all");
    setPlanFilter("all");
    setAttentionFilter(false);
    setSort("joined");
    setAccountFilter("all");
  };

  const totalCount = result?.totalCount ?? 0;
  const pageSize = ADMIN_CLIENT_PAGE_SIZE;
  const currentPage = Math.floor(offset / pageSize) + 1;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = totalCount === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + (result?.rows.length ?? 0), totalCount);

  return (
    <>
      <AdminPageHeader
        title="العملاء"
        subtitle="إدارة العملاء ومتابعة تقدمهم"
        actions={
          <button type="button" className="cc-btn cc-btn--primary" onClick={() => setSignupOpen(true)}>
            <Plus size={16} aria-hidden />
            إضافة عميل
          </button>
        }
      />

      {!blocked && result ? (
        <div className="cc-directory-summary" aria-label="ملخص العملاء">
          <button type="button" className="cc-directory-summary__card" onClick={() => setDirectoryTab("all")}>
            <span className="cc-directory-summary__icon" aria-hidden>
              <Users size={18} />
            </span>
            <span className="cc-directory-summary__label">إجمالي العملاء</span>
            <strong className="cc-directory-summary__value">{summary.totalClients}</strong>
          </button>
          <button type="button" className="cc-directory-summary__card" onClick={() => setDirectoryTab("active")}>
            <span className="cc-directory-summary__icon cc-directory-summary__icon--ok" aria-hidden>
              <UserCheck size={18} />
            </span>
            <span className="cc-directory-summary__label">نشطون</span>
            <strong className="cc-directory-summary__value cc-directory-summary__value--ok">
              {summary.activeClients}
            </strong>
            {summary.fromVisibleRows ? (
              <span className="cc-directory-summary__hint">من الصفحة الحالية</span>
            ) : null}
          </button>
          <button
            type="button"
            className="cc-directory-summary__card cc-directory-summary__card--attention"
            onClick={() => setDirectoryTab("attention")}
          >
            <span className="cc-directory-summary__icon cc-directory-summary__icon--warn" aria-hidden>
              <AlertCircle size={18} />
            </span>
            <span className="cc-directory-summary__label">يحتاج متابعة</span>
            <strong className="cc-directory-summary__value cc-directory-summary__value--warn">
              {summary.needsAttention}
            </strong>
            {summary.fromVisibleRows ? (
              <span className="cc-directory-summary__hint">من الصفحة الحالية</span>
            ) : null}
          </button>
          <button
            type="button"
            className="cc-directory-summary__card"
            onClick={() => {
              setOnboardingFilter("incomplete");
              setFiltersOpen(true);
            }}
          >
            <span className="cc-directory-summary__icon" aria-hidden>
              <Clock size={18} />
            </span>
            <span className="cc-directory-summary__label">تسجيل غير مكتمل</span>
            <strong className="cc-directory-summary__value">{summary.incompleteOnboarding}</strong>
            {summary.fromVisibleRows ? (
              <span className="cc-directory-summary__hint">من الصفحة الحالية</span>
            ) : null}
          </button>
        </div>
      ) : null}

      <div className="cc-directory-toolbar">
        <AdminSearchInput
          label="بحث العملاء"
          value={value}
          onChange={setValue}
          placeholder="ابحث بالاسم أو البريد الإلكتروني"
        />
        <div className="cc-seg" role="tablist" aria-label="حالة العملاء">
          {(
            [
              ["all", "الكل"],
              ["active", "نشط"],
              ["paused", "متوقف"],
              ["attention", "يحتاج متابعة"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={directoryTab === id}
              className={directoryTab === id ? "is-active" : undefined}
              onClick={() => setDirectoryTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={filtersOpen || extraFiltersActive ? "cc-btn cc-btn--compact is-active" : "cc-btn cc-btn--compact"}
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal size={14} aria-hidden />
          تصفية
        </button>
        {hasActiveFilters ? (
          <button type="button" className="cc-btn cc-btn--ghost cc-btn--compact" onClick={clearFilters}>
            مسح الفلاتر
          </button>
        ) : null}
      </div>

      {filtersOpen ? (
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
      ) : null}

      {blocked ? <AdminEmptyState title="أكمل البحث" body="أدخل حرفين على الأقل أو امسح الحقل لتصفح الصفحة." /> : null}
      {error ? <AdminErrorState message={error} onRetry={() => void navigate({ search: { q } })} /> : null}
      {loading ? <AdminSkeletonRows rows={6} /> : null}

      {!loading && result && rows.length === 0 && !blocked ? (
        <AdminEmptyState title="لا نتائج" body="لا يوجد عميل مطابق لهذه التصفية." />
      ) : null}

      {!loading && result && rows.length > 0 ? (
        <>
          <div className="cc-table-panel">
            <div className="cc-table-wrap cc-table-wrap--desktop">
              <AdminTable>
                <thead>
                  <tr>
                    <th>العميل</th>
                    <th>الحالة</th>
                    <th>العضوية</th>
                    <th>التدريب</th>
                    <th>التغذية</th>
                    <th>آخر نشاط</th>
                    <th>الإجراءات</th>
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
          </div>

          <div className="cc-pagination">
            <p className="cc-pagination__range">
              عرض {rangeStart.toLocaleString("ar-AE")}–{rangeEnd.toLocaleString("ar-AE")} من{" "}
              {totalCount.toLocaleString("ar-AE")}
              {attentionFilter ? " · فلتر المتابعة على الصفحة الحالية" : ""}
              {sort !== "joined" ? " · الترتيب على الصفحة الحالية فقط" : ""}
            </p>
            <div className="cc-pagination__pages">
              <button
                type="button"
                className="cc-pagination__btn"
                disabled={currentPage <= 1 || loading}
                onClick={() => setOffset(Math.max(0, offset - pageSize))}
                aria-label="الصفحة السابقة"
              >
                ‹
              </button>
              {paginationPages(currentPage, pageCount).map((page, index) =>
                page === "gap" ? (
                  <span key={`gap-${index}`} className="cc-pagination__gap">
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    className={page === currentPage ? "cc-pagination__btn is-active" : "cc-pagination__btn"}
                    disabled={loading}
                    onClick={() => setOffset((page - 1) * pageSize)}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                type="button"
                className="cc-pagination__btn"
                disabled={currentPage >= pageCount || loading || !result.truncated}
                onClick={() => setOffset(offset + pageSize)}
                aria-label="الصفحة التالية"
              >
                ›
              </button>
            </div>
          </div>
        </>
      ) : null}

      {signupOpen ? (
        <AdminConfirmDialog
          request={{
            title: "إضافة عميل",
            body: "لا يمكن إنشاء حساب عميل من لوحة الإدارة. الحساب يُنشأ عندما يسجّل العميل في التطبيق أو الاختبار.",
            impact: "افتح صفحة التسجيل لنسخ الرابط أو لمرافقة العميل أثناء إنشائه لحسابه.",
            confirmLabel: "فتح صفحة التسجيل",
            onConfirm: () => {
              window.open("/quiz", "_blank", "noopener,noreferrer");
            },
          }}
          onClose={() => setSignupOpen(false)}
        />
      ) : null}
    </>
  );
}

function ClientDirectoryRow({ row }: { row: AdminClientListItem }) {
  const status = directoryOperationalStatus(row);

  return (
    <tr>
      <td>
        <Link
          to="/admin/clients/$clientId"
          params={{ clientId: row.id }}
          className="cc-client-directory__identity"
        >
          <AdminClientAvatar name={row.fullName} avatarPath={row.avatarPath} />
          <div>
            <strong>{row.fullName || "بدون اسم"}</strong>
            <span className="cc-meta">{row.email || row.phone || "—"}</span>
          </div>
        </Link>
      </td>
      <td>
        <AdminStatusBadge tone={directoryOperationalTone(status)}>
          {directoryOperationalLabel(status)}
        </AdminStatusBadge>
      </td>
      <td>
        {row.membershipPlan ? (
          <AdminStatusBadge tone={directoryPlanTone(row.membershipPlan)}>
            {directoryPlanLabelAr(row.membershipPlan)}
          </AdminStatusBadge>
        ) : (
          "—"
        )}
      </td>
      <td className="cc-muted" title="حالة الالتزام غير متوفرة في قائمة العملاء">
        —
      </td>
      <td className="cc-muted" title="حالة الالتزام غير متوفرة في قائمة العملاء">
        —
      </td>
      <td className="cc-meta">{formatAdminActivityStamp(row.lastActivityAt)}</td>
      <td>
        <ClientRowMenu clientId={row.id} />
      </td>
    </tr>
  );
}

function ClientDirectoryCard({ row }: { row: AdminClientListItem }) {
  const status = directoryOperationalStatus(row);

  return (
    <article className="cc-client-card">
      <div className="cc-client-card__head">
        <AdminClientAvatar name={row.fullName} avatarPath={row.avatarPath} />
        <div>
          <strong>{row.fullName || "بدون اسم"}</strong>
          <p className="cc-meta">{row.email || row.phone || "—"}</p>
        </div>
      </div>
      <div className="cc-client-card__meta">
        <AdminStatusBadge tone={directoryOperationalTone(status)}>
          {directoryOperationalLabel(status)}
        </AdminStatusBadge>
        {row.membershipPlan ? (
          <AdminStatusBadge tone={directoryPlanTone(row.membershipPlan)}>
            {directoryPlanLabelAr(row.membershipPlan)}
          </AdminStatusBadge>
        ) : null}
      </div>
      <p className="cc-meta">
        آخر نشاط: {formatAdminActivityStamp(row.lastActivityAt)} · انضم {formatAdminDate(row.createdAt)}
      </p>
      <Link to="/admin/clients/$clientId" params={{ clientId: row.id }} className="cc-btn cc-btn--primary">
        فتح العميل
      </Link>
    </article>
  );
}

function ClientRowMenu({ clientId }: { clientId: string }) {
  return (
    <details className="cc-row-menu">
      <summary className="cc-row-menu__trigger" aria-label="إجراءات العميل">
        ⋮
      </summary>
      <div className="cc-row-menu__panel">
        <Link to="/admin/clients/$clientId" params={{ clientId }}>
          فتح العميل
        </Link>
        <Link to="/admin/clients/$clientId" params={{ clientId }} search={{ tab: "training" }}>
          التدريب
        </Link>
        <Link to="/admin/clients/$clientId" params={{ clientId }} search={{ tab: "nutrition" }}>
          التغذية
        </Link>
        <Link to="/admin/clients/$clientId" params={{ clientId }} search={{ tab: "membership" }}>
          العضوية والفوترة
        </Link>
        <Link to="/admin/clients/$clientId" params={{ clientId }} search={{ tab: "notes" }}>
          الملاحظات
        </Link>
      </div>
    </details>
  );
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
