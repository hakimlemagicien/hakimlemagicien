import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  AdminCard,
  AdminConceptKpiRow,
  AdminConceptTabs,
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/AdminPage";
import {
  AdminConfirmDialog,
  AdminFilterBar,
  AdminSkeletonRows,
  type AdminConfirmRequest,
} from "@/components/admin/AdminConfirmDialog";
import {
  ADMIN_SUPPORT_PAGE_SIZE,
  SUPPORT_CATEGORIES,
  SUPPORT_STATUSES,
  allowedSupportTransitions,
  fetchAdminSupportTicket,
  listAdminSupportTickets,
  setAdminSupportTicketStatus,
  supportCategoryLabel,
  supportStatusLabel,
  type AdminSupportTicketDetail,
  type AdminSupportTicketListItem,
  type SupportTicketCategory,
  type SupportTicketStatus,
} from "@/lib/admin/admin-ops-api";
import { formatAdminDate, formatRelativeAge, ticketStatusKind } from "@/lib/admin/admin-status";

type SupportSearch = {
  ticket?: string;
  userId?: string;
  status?: string;
  category?: string;
};

export const Route = createFileRoute("/admin/support")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): SupportSearch => ({
    ticket: typeof search.ticket === "string" ? search.ticket : undefined,
    userId: typeof search.userId === "string" ? search.userId : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  head: () => ({ meta: [{ title: "الدعم | مركز التشغيل" }] }),
  component: AdminSupportPage,
});

function AdminSupportPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/support" });
  const status = isStatus(search.status) ? search.status : "open";
  const category = isCategory(search.category) ? search.category : "all";

  const [rows, setRows] = useState<AdminSupportTicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [detail, setDetail] = useState<AdminSupportTicketDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<AdminConfirmRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOffset(0);
    try {
      const next = await fetchSupportPage({ status, category, userId: search.userId, offset: 0 });
      setRows(next);
      setHasMore(next.length === ADMIN_SUPPORT_PAGE_SIZE);
    } catch (err) {
      console.error(err);
      setError("تعذر تحميل طابور الدعم. تأكد من صلاحيات Admin وعقد البيانات.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status, category, search.userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!search.ticket) {
      setDetail(null);
      return;
    }
    setDetailError(null);
    void fetchAdminSupportTicket(search.ticket)
      .then((row) => setDetail(row))
      .catch((err) => {
        console.error(err);
        setDetailError("تعذر فتح تفاصيل التذكرة.");
        setDetail(null);
      });
  }, [search.ticket]);

  const loadMore = async () => {
    const nextOffset = offset + ADMIN_SUPPORT_PAGE_SIZE;
    setLoadingMore(true);
    try {
      const next = await fetchSupportPage({ status, category, userId: search.userId, offset: nextOffset });
      setRows((prev) => [...prev, ...next]);
      setOffset(nextOffset);
      setHasMore(next.length === ADMIN_SUPPORT_PAGE_SIZE);
    } catch (err) {
      console.error(err);
      setError("تعذر تحميل المزيد.");
    } finally {
      setLoadingMore(false);
    }
  };

  const requestTransition = (ticket: AdminSupportTicketListItem | AdminSupportTicketDetail, next: SupportTicketStatus) => {
    setConfirm({
      title: `تغيير الحالة إلى «${supportStatusLabel(next)}»`,
      body: "سيتم تسجيل الانتقال في سجل العمليات. لا يمكن إعادة تذكرة مغلقة إلى مستلمة من هذه الشاشة.",
      confirmLabel: "تأكيد",
      tone: next === "closed" ? "danger" : "primary",
      onConfirm: () => {
        void setAdminSupportTicketStatus(ticket.id, next)
          .then(() => load())
          .then(() => (search.ticket ? fetchAdminSupportTicket(search.ticket) : null))
          .then((row) => {
            if (row) setDetail(row);
          })
          .catch((err) => {
            console.error(err);
            setError("تعذر تحديث حالة التذكرة.");
          });
      },
    });
  };

  return (
    <>
      <AdminPageHeader
        title="الدعم وإدارة الفريق"
        subtitle="حل طلبات العملاء وتنظيم وصول فريق العمل. لا دعوة عضو وهمية من هذه الشاشة."
      />
      <AdminConceptTabs
        items={[
          { id: "tickets", label: "تذاكر الدعم", to: "/admin/support", active: true },
          { id: "team", label: "الفريق", to: "/admin/settings" },
          { id: "roles", label: "الأدوار والصلاحيات", to: "/admin/settings" },
          { id: "audit", label: "سجل التدقيق", to: "/admin/audit" },
        ]}
      />
      <AdminConceptKpiRow
        loading={loading}
        metrics={[
          {
            id: "open",
            label: "تذاكر معروضة",
            value: rows.length.toLocaleString("ar-AE"),
            hint: hasMore ? "صفحة واحدة — يوجد المزيد" : "حسب التصفية الحالية",
            tone: rows.length > 0 ? "attention" : "neutral",
          },
          {
            id: "urgent",
            label: "عاجلة",
            value: "—",
            hint: "لا أولوية عاجلة معتمدة في عقد التذكرة",
            tone: "unavailable",
          },
          {
            id: "resolution",
            label: "متوسط الحل",
            value: "—",
            hint: "لا زمن حل معتمد",
            tone: "unavailable",
          },
          {
            id: "online",
            label: "أعضاء متصلون",
            value: "—",
            hint: "لا حالة اتصال للطاقم",
            tone: "unavailable",
          },
        ]}
      />

      <AdminFilterBar>
        <label className="cc-filter">
          <span>الحالة</span>
          <select
            value={status}
            onChange={(event) =>
              void navigate({ search: { ...search, status: event.target.value === "open" ? undefined : event.target.value } })
            }
          >
            <option value="open">مفتوحة</option>
            {SUPPORT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {supportStatusLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <label className="cc-filter">
          <span>الفئة</span>
          <select
            value={category}
            onChange={(event) =>
              void navigate({
                search: { ...search, category: event.target.value === "all" ? undefined : event.target.value },
              })
            }
          >
            <option value="all">الكل</option>
            {SUPPORT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {supportCategoryLabel(item)}
              </option>
            ))}
          </select>
        </label>
        {search.userId ? (
          <button
            type="button"
            className="cc-btn cc-btn--ghost"
            onClick={() => void navigate({ search: { ...search, userId: undefined } })}
          >
            إلغاء فلتر العميل
          </button>
        ) : null}
      </AdminFilterBar>

      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? <AdminSkeletonRows rows={6} /> : null}
      {!loading && rows.length === 0 ? (
        <AdminEmptyState title="لا توجد تذاكر مطابقة" body="غيّر الفلتر أو انتظر تذكرة جديدة." />
      ) : null}

      <div className={detail || detailError ? "cc-ops-split" : undefined}>
        {!loading && rows.length > 0 ? (
          <AdminTable>
            <thead>
              <tr>
                <th>التذكرة</th>
                <th>التواصل</th>
                <th>الفئة</th>
                <th>الحالة</th>
                <th>أُنشئت</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.ticketCode}</strong>
                    <div className="cc-meta">
                      {row.category === "privacy" ? "خصوصية — بدون معاينة النص" : row.subject}
                    </div>
                  </td>
                  <td>
                    {row.userId ? (
                      <Link to="/admin/clients/$clientId" params={{ clientId: row.userId }} className="cc-client-link">
                        <strong>{row.displayName || "عميل"}</strong>
                        <span>{row.email || "—"}</span>
                      </Link>
                    ) : (
                      <span>
                        {row.displayName || "زائر"}
                        <span className="cc-meta">{row.email || "—"}</span>
                      </span>
                    )}
                  </td>
                  <td>{supportCategoryLabel(row.category)}</td>
                  <td>
                    <AdminStatusBadge tone={ticketStatusKind(row.status)}>
                      {supportStatusLabel(row.status)}
                    </AdminStatusBadge>
                  </td>
                  <td className="cc-meta">{formatRelativeAge(row.createdAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="cc-btn cc-btn--compact"
                      onClick={() => void navigate({ search: { ...search, ticket: row.id } })}
                    >
                      فتح
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : null}

        {detailError ? <AdminErrorState message={detailError} /> : null}
        {detail ? (
          <AdminCard>
            <h2 className="cc-section__title">{detail.ticketCode}</h2>
            <dl className="cc-dl">
              <div>
                <dt>الحالة</dt>
                <dd>{supportStatusLabel(detail.status)}</dd>
              </div>
              <div>
                <dt>الفئة</dt>
                <dd>{supportCategoryLabel(detail.category)}</dd>
              </div>
              <div>
                <dt>الموضوع</dt>
                <dd>{detail.subject}</dd>
              </div>
              <div>
                <dt>أُنشئت</dt>
                <dd>{formatAdminDate(detail.createdAt)}</dd>
              </div>
              <div>
                <dt>حُدّثت</dt>
                <dd>{formatAdminDate(detail.updatedAt)}</dd>
              </div>
            </dl>
            <p className="cc-muted">{detail.message}</p>
            {detail.userId ? (
              <Link to="/admin/clients/$clientId" params={{ clientId: detail.userId }} className="cc-btn">
                ملف العميل
              </Link>
            ) : null}
            <div className="cc-actions cc-actions--compact">
              {allowedSupportTransitions(detail.status).map((next) => (
                <button
                  key={next}
                  type="button"
                  className={next === "closed" ? "cc-btn cc-btn--danger" : "cc-btn cc-btn--primary"}
                  onClick={() => requestTransition(detail, next)}
                >
                  {supportStatusLabel(next)}
                </button>
              ))}
              <button
                type="button"
                className="cc-btn cc-btn--ghost"
                onClick={() => void navigate({ search: { ...search, ticket: undefined } })}
              >
                إغلاق اللوحة
              </button>
            </div>
          </AdminCard>
        ) : null}
      </div>

      {hasMore ? (
        <button type="button" className="cc-btn" disabled={loadingMore} onClick={() => void loadMore()}>
          {loadingMore ? "جاري التحميل…" : "المزيد"}
        </button>
      ) : null}

      <AdminConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

async function fetchSupportPage(opts: {
  status: string;
  category: string;
  userId?: string;
  offset: number;
}): Promise<AdminSupportTicketListItem[]> {
  if (opts.status === "open") {
    const [received, inReview] = await Promise.all([
      listAdminSupportTickets({
        status: "received",
        category: opts.category === "all" ? undefined : opts.category,
        userId: opts.userId,
        offset: opts.offset,
      }),
      listAdminSupportTickets({
        status: "in_review",
        category: opts.category === "all" ? undefined : opts.category,
        userId: opts.userId,
        offset: opts.offset,
      }),
    ]);
    return [...received, ...inReview].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  return listAdminSupportTickets({
    status: opts.status,
    category: opts.category === "all" ? undefined : opts.category,
    userId: opts.userId,
    offset: opts.offset,
  });
}

function isStatus(value: unknown): value is SupportTicketStatus | "open" {
  return value === "open" || (typeof value === "string" && SUPPORT_STATUSES.includes(value as SupportTicketStatus));
}

function isCategory(value: unknown): value is SupportTicketCategory {
  return typeof value === "string" && SUPPORT_CATEGORIES.includes(value as SupportTicketCategory);
}
