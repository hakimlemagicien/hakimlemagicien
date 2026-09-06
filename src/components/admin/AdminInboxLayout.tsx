import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import {
  AdminConceptKpiRow,
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminStatusBadge,
} from "@/components/admin/AdminPage";
import { AdminConfirmDialog, AdminSkeletonRows, type AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import { conversationStatusKind, formatRelativeAge, planLabel, planStatusKind } from "@/lib/admin/admin-status";
import { sortCoachingInbox } from "@/lib/admin/admin-attention";
import {
  conversationStatusLabel,
  type CoachingConversationStatus,
  type CoachingInboxRow,
} from "@/lib/platform/coaching-messaging";
import { fetchCoachingInbox, watchCoachingUpdates } from "@/lib/platform/coaching-messaging-api";

type InboxFilter = "all" | "unread" | CoachingConversationStatus;

const FILTERS: Array<{ id: InboxFilter; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "unread", label: "غير مقروءة" },
  { id: "waiting_for_reply", label: "تحتاج رد" },
];

export function AdminInboxLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeId = pathname.startsWith("/admin/messages/") ? pathname.slice("/admin/messages/".length) : "";
  const threadOpen = Boolean(activeId);

  const [rows, setRows] = useState<CoachingInboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [compose, setCompose] = useState<AdminConfirmRequest | null>(null);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        setRows(sortCoachingInbox(await fetchCoachingInbox({ search, status: null })));
      } catch (err) {
        console.error(err);
        setError("تعذر تحميل المحادثات. أعد المحاولة.");
        if (!opts?.silent) setRows([]);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    let timer: number | undefined;
    const debouncedSilentReload = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void load({ silent: true }), 600);
    };
    const stop = watchCoachingUpdates(debouncedSilentReload);
    return () => {
      window.clearTimeout(timer);
      stop();
    };
  }, [load]);

  const unreadCount = rows.filter((row) => row.unreadCount > 0).length;
  const waitingCount = rows.filter((row) => row.status === "waiting_for_reply").length;
  const visibleRows = useMemo(() => {
    if (filter === "unread") return rows.filter((row) => row.unreadCount > 0);
    if (filter === "all") return rows;
    return rows.filter((row) => row.status === filter);
  }, [filter, rows]);
  const activeRow = rows.find((row) => row.id === activeId) ?? null;

  return (
    <div className="cc-inbox-page">
      <AdminPageHeader
        kicker="العملاء والمتابعة"
        title="الرسائل"
        subtitle="صندوق التدريب — الرد على محادثات العملاء دون أرقام رد وهمية."
        actions={
          <>
            <button type="button" className="cc-btn cc-btn--ghost" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={loading ? "h-4 w-4 cc-spin-icon" : "h-4 w-4"} />
              تحديث
            </button>
            <button
              type="button"
              className="cc-btn cc-btn--primary"
              onClick={() =>
                setCompose({
                  title: "رسالة جديدة",
                  body: "المحادثات تبدأ من تطبيق العميل. لا يوجد إنشاء محادثة من الإدارة.",
                  confirmLabel: "حسناً",
                  onConfirm: () => undefined,
                })
              }
            >
              <Plus className="h-4 w-4" aria-hidden />
              رسالة جديدة
            </button>
          </>
        }
      />

      <AdminConceptKpiRow
        loading={loading}
        metrics={[
          {
            id: "unread",
            label: "غير مقروءة",
            value: unreadCount.toLocaleString("ar-AE"),
            hint: "محادثات فيها رسائل لم تُقرأ",
            tone: unreadCount > 0 ? "attention" : "neutral",
          },
          {
            id: "waiting",
            label: "تحتاج رد",
            value: waitingCount.toLocaleString("ar-AE"),
            hint: "بانتظار رد الكوتش",
            tone: waitingCount > 0 ? "attention" : "neutral",
          },
          {
            id: "reply_time",
            label: "متوسط وقت الرد",
            value: "—",
            hint: "لا متوسط رد معتمد من البيانات الحالية",
            tone: "unavailable",
          },
        ]}
      />

      <div className={threadOpen ? "cc-inbox is-thread" : "cc-inbox"}>
        <section className="cc-inbox__listpane" aria-label="قائمة المحادثات">
          <header className="cc-inbox__toolbar">
            <h2 className="cc-inbox__title">المحادثات</h2>
          </header>
          <label className="cc-search cc-search--compact">
            <span className="cc-vh">بحث المحادثات</span>
            <Search className="h-4 w-4" aria-hidden />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث بالاسم أو البريد الإلكتروني"
            />
          </label>
          <div className="cc-inbox__filters" role="tablist" aria-label="تصفية المحادثات">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={filter === item.id ? "is-active" : undefined}
                onClick={() => setFilter(item.id)}
              >
                {item.id === "waiting_for_reply" && waitingCount > 0
                  ? `${item.label} ${waitingCount}`
                  : item.label}
              </button>
            ))}
          </div>
          {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
          {loading ? <AdminSkeletonRows rows={8} /> : null}
          {!loading && visibleRows.length === 0 ? (
            <AdminEmptyState title="لا توجد محادثات مطابقة" body="غيّر البحث أو التصفية، أو انتظر رسالة جديدة من عميل." />
          ) : null}
          {!loading && visibleRows.length > 0 ? (
            <ul className="cc-inbox__list">
              {visibleRows.map((row) => {
                const vip = row.membershipTier?.toLowerCase() === "vip";
                const waiting = row.unreadCount > 0 || row.status === "waiting_for_reply";
                return (
                  <li key={row.id}>
                    <Link
                      to="/admin/messages/$conversationId"
                      params={{ conversationId: row.id }}
                      className={[
                        "cc-inbox__row",
                        activeId === row.id ? "is-active" : "",
                        waiting ? "is-waiting" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span className="cc-inbox__avatar">
                        {row.memberAvatarUrl ? <img src={row.memberAvatarUrl} alt="" /> : row.memberName.slice(0, 1)}
                      </span>
                      <span className="cc-inbox__body">
                        <span className="cc-inbox__name">
                          {row.memberName}
                          {vip ? <AdminStatusBadge tone="vip">VIP</AdminStatusBadge> : null}
                          {row.unreadCount > 0 ? <b>{row.unreadCount}</b> : null}
                        </span>
                        <span className="cc-inbox__preview">{row.lastMessagePreview || "بدون رسائل بعد"}</span>
                        <span className="cc-inbox__meta">
                          <AdminStatusBadge tone={conversationStatusKind(row.status)}>
                            {conversationStatusLabel(row.status)}
                          </AdminStatusBadge>
                          {row.membershipTier ? (
                            <AdminStatusBadge tone={planStatusKind(row.membershipTier)}>
                              {planLabel(row.membershipTier)}
                            </AdminStatusBadge>
                          ) : null}
                          <em>{formatRelativeAge(row.lastMessageAt)}</em>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
        <section className="cc-inbox__threadpane" aria-label="المحادثة">
          <Outlet />
        </section>
        {threadOpen && activeRow ? (
          <aside className="cc-inbox__context" aria-label="سياق العميل">
            <h2>تقدم العميل</h2>
            <p>
              <strong>{activeRow.memberName}</strong>
            </p>
            {activeRow.membershipTier ? (
              <AdminStatusBadge tone={planStatusKind(activeRow.membershipTier)}>
                {planLabel(activeRow.membershipTier)}
              </AdminStatusBadge>
            ) : (
              <AdminStatusBadge>بدون عضوية ظاهرة</AdminStatusBadge>
            )}
            <p className="cc-muted">لا وزن ولا نسبة التزام معتمدة داخل صندوق الرسائل. افتح ملف العميل للبيانات التشغيلية.</p>
            <Link
              to="/admin/clients/$clientId"
              params={{ clientId: activeRow.memberId }}
              className="cc-btn"
              preload={false}
            >
              عرض الملف
            </Link>
          </aside>
        ) : null}
      </div>
      <AdminConfirmDialog request={compose} onClose={() => setCompose(null)} />
    </div>
  );
}
