import { createFileRoute, isRedirect, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { AdminChrome } from "@/components/admin/AdminChrome";
import { checkAdminAccess } from "@/lib/admin-payments-api";
import {
  conversationStatusLabel,
  formatInboxTime,
  type CoachingConversationStatus,
  type CoachingInboxRow,
} from "@/lib/platform/coaching-messaging";
import { fetchCoachingInbox, watchCoachingUpdates } from "@/lib/platform/coaching-messaging-api";

export const Route = createFileRoute("/admin/messages/")({
  ssr: false,
  head: () => ({ meta: [{ title: "صندوق رسائل الكوتش | Admin" }] }),
  beforeLoad: async () => {
    try {
      return await checkAdminAccess();
    } catch (error) {
      if (isRedirect(error)) throw error;
      throw redirect({ to: "/" });
    }
  },
  component: AdminMessagesPage,
});

const FILTERS: Array<{ id: "all" | CoachingConversationStatus; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "waiting_for_reply", label: "بانتظار رد" },
  { id: "new", label: "جديدة" },
  { id: "replied", label: "تم الرد" },
  { id: "closed", label: "مغلقة" },
];

function AdminMessagesPage() {
  const [rows, setRows] = useState<CoachingInboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | CoachingConversationStatus>("all");

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      setRows(
        await fetchCoachingInbox({
          search,
          status: filter === "all" ? null : filter,
        }),
      );
    } catch (err) {
      console.error(err);
      setError("تعذر جلب المحادثات. تأكد من تطبيق migration المراسلة.");
      if (!opts?.silent) setRows([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => watchCoachingUpdates(() => void load({ silent: true })), [load]);

  return (
    <AdminChrome title="صندوق الكوتش" subtitle="محادثات العملاء الخاصة — ليست مجموعة عامة">
      <div className="admin-inbox">
        <div className="admin-inbox__toolbar">
          <label className="admin-inbox__search">
            <Search className="h-4 w-4" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="بحث بالاسم أو الرسالة"
            />
          </label>
          <button type="button" className="admin-inbox__refresh" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>
        <div className="admin-inbox__filters">
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
        {error ? <p className="admin-inbox__error">{error}</p> : null}
        {loading ? (
          <div className="admin-inbox__empty">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="admin-inbox__empty">لا توجد محادثات مطابقة.</p>
        ) : (
          <ul className="admin-inbox__list">
            {rows.map((row) => (
              <li key={row.id}>
                <Link to="/admin/messages/$conversationId" params={{ conversationId: row.id }} className="admin-inbox__row">
                  <span className="admin-inbox__avatar">
                    {row.memberAvatarUrl ? <img src={row.memberAvatarUrl} alt="" /> : row.memberName.slice(0, 1)}
                  </span>
                  <span className="admin-inbox__body">
                    <span className="admin-inbox__name">
                      {row.memberName}
                      {row.unreadCount > 0 ? <b>{row.unreadCount}</b> : null}
                    </span>
                    <span className="admin-inbox__preview">{row.lastMessagePreview || "بدون رسائل بعد"}</span>
                    <span className="admin-inbox__meta">
                      {conversationStatusLabel(row.status)}
                      {row.membershipTier ? ` · ${row.membershipTier}` : ""}
                      {row.memberGoal ? ` · ${row.memberGoal}` : ""}
                    </span>
                  </span>
                  <time>{formatInboxTime(row.lastMessageAt)}</time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminChrome>
  );
}
