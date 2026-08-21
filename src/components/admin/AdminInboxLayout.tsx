import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { AdminEmptyState, AdminErrorState, AdminStatusBadge } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { conversationStatusKind, formatRelativeAge, planLabel, planStatusKind } from "@/lib/admin/admin-status";
import { sortCoachingInbox } from "@/lib/admin/admin-attention";
import {
  conversationStatusLabel,
  type CoachingConversationStatus,
  type CoachingInboxRow,
} from "@/lib/platform/coaching-messaging";
import { fetchCoachingInbox, watchCoachingUpdates } from "@/lib/platform/coaching-messaging-api";

const FILTERS: Array<{ id: "all" | CoachingConversationStatus; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "waiting_for_reply", label: "بانتظار رد" },
  { id: "new", label: "جديدة" },
  { id: "replied", label: "تم الرد" },
  { id: "closed", label: "مغلقة" },
];

export function AdminInboxLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeId = pathname.startsWith("/admin/messages/") ? pathname.slice("/admin/messages/".length) : "";
  const threadOpen = Boolean(activeId);

  const [rows, setRows] = useState<CoachingInboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | CoachingConversationStatus>("all");

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        setRows(
          sortCoachingInbox(
            await fetchCoachingInbox({
              search,
              status: filter === "all" ? null : filter,
            }),
          ),
        );
      } catch (err) {
        console.error(err);
        setError("تعذر تحميل المحادثات. أعد المحاولة.");
        if (!opts?.silent) setRows([]);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [filter, search],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => watchCoachingUpdates(() => void load({ silent: true })), [load]);

  return (
    <div className={threadOpen ? "cc-inbox is-thread" : "cc-inbox"}>
      <section className="cc-inbox__listpane" aria-label="قائمة المحادثات">
        <header className="cc-inbox__toolbar">
          <div>
            <p className="cc-kicker">العملاء والمتابعة</p>
            <h1 className="cc-inbox__title">صندوق التدريب</h1>
          </div>
          <button type="button" className="cc-btn cc-btn--ghost" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={loading ? "h-4 w-4 cc-spin-icon" : "h-4 w-4"} />
            تحديث
          </button>
        </header>
        <label className="cc-search cc-search--compact">
          <span className="cc-vh">بحث المحادثات</span>
          <Search className="h-4 w-4" aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="اسم العميل أو آخر رسالة"
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
              {item.label}
            </button>
          ))}
        </div>
        {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
        {loading ? <AdminSkeletonRows rows={8} /> : null}
        {!loading && rows.length === 0 ? (
          <AdminEmptyState title="لا توجد محادثات مطابقة" body="غيّر البحث أو التصفية، أو انتظر رسالة جديدة من عميل." />
        ) : null}
        {!loading && rows.length > 0 ? (
          <ul className="cc-inbox__list">
            {rows.map((row) => {
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
    </div>
  );
}
