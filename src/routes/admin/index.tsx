import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminPriorityBadge,
  AdminSection,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { fetchSubmittedLeads, type AdminSubmittedLead } from "@/lib/admin-payments-api";
import { buildAttentionQueue } from "@/lib/admin/admin-attention";
import {
  dayGreeting,
  formatRelativeAge,
  planLabel,
  planStatusKind,
  todayContextLabel,
} from "@/lib/admin/admin-status";
import { fetchCoachingInbox } from "@/lib/platform/coaching-messaging-api";
import { conversationStatusLabel, type CoachingInboxRow } from "@/lib/platform/coaching-messaging";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({ meta: [{ title: "مركز التشغيل | MAAKFIT" }] }),
  component: CommandCenterPage,
});

type CommandCenterState = {
  inbox: CoachingInboxRow[];
  payments: AdminSubmittedLead[];
};

function CommandCenterPage() {
  const [data, setData] = useState<CommandCenterState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const now = useMemo(() => new Date(), [data]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inbox, payments] = await Promise.all([fetchCoachingInbox(), fetchSubmittedLeads()]);
      setData({ inbox, payments });
    } catch (err) {
      console.error(err);
      setError("تعذر تحميل إشارات التشغيل الحالية.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const queue = data ? buildAttentionQueue(data) : [];
  const unreadThreads = data?.inbox.filter((row) => row.unreadCount > 0).length ?? 0;
  const waitingThreads = data?.inbox.filter((row) => row.status === "waiting_for_reply").length ?? 0;
  const pendingPayments = data?.payments.length ?? 0;
  const coachingInbox = (data?.inbox ?? [])
    .filter((row) => row.unreadCount > 0 || row.status === "waiting_for_reply")
    .slice(0, 6);
  const recent = buildRecentActivity(data);

  return (
    <>
      <AdminPageHeader
        kicker={todayContextLabel(now)}
        title={`${dayGreeting(now)}، Coach Hakim`}
        subtitle={
          loading
            ? "جمع عناصر الانتباه من الرسائل والمدفوعات."
            : queue.length > 0
              ? `${queue.length} عنصر يحتاج إجراءً الآن — من الإشارات المتاحة فقط.`
              : "لا يوجد ما يحتاج إجراءً من الإشارات المتاحة حالياً."
        }
      />

      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}

      <AdminSection title="يحتاج انتباهاً">
        {loading ? <AdminSkeletonRows rows={4} /> : null}
        {!loading && queue.length === 0 ? (
          <AdminEmptyState
            title="طابور الانتباه فارغ"
            body="تُعرض هنا الرسائل بانتظار الرد ومدفوعات التحويل المعلّقة فقط."
            later="مراجعات التقدم والتنبيهات الأخرى تظهر عند اعتماد قواعدها التشغيلية."
          />
        ) : null}
        {!loading && queue.length > 0 ? (
          <AdminTable>
            <thead>
              <tr>
                <th>العميل</th>
                <th>السبب</th>
                <th>الأولوية</th>
                <th>منذ</th>
                <th>الخطة</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="cc-cell-stack">
                      <strong>{item.clientName}</strong>
                      {item.vip ? <AdminStatusBadge tone="vip">VIP</AdminStatusBadge> : null}
                    </div>
                  </td>
                  <td>{item.reason}</td>
                  <td>
                    <AdminPriorityBadge priority={item.priority} />
                  </td>
                  <td className="cc-meta">{item.ageLabel}</td>
                  <td>{item.planLabel ?? "—"}</td>
                  <td>
                    <a href={item.href} className="cc-btn cc-btn--primary cc-btn--compact">
                      {item.actionLabel}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : null}
      </AdminSection>

      <div className="cc-ops-split">
        <AdminSection title="صندوق التدريب">
          {loading ? <AdminSkeletonRows rows={3} /> : null}
          {!loading && coachingInbox.length === 0 ? (
            <AdminEmptyState title="لا رسائل بانتظار رد" body="عندما ينتظر عميل رداً ستظهر المحادثة هنا." />
          ) : null}
          {!loading && coachingInbox.length > 0 ? (
            <ul className="cc-queue">
              {coachingInbox.map((row) => (
                <li key={row.id}>
                  <Link to="/admin/messages/$conversationId" params={{ conversationId: row.id }} className="cc-queue__item">
                    <span className="cc-queue__main">
                      <strong>{row.memberName}</strong>
                      <span>{row.lastMessagePreview || "بدون رسائل بعد"}</span>
                    </span>
                    <span className="cc-queue__meta">
                      {row.membershipTier?.toLowerCase() === "vip" ? (
                        <AdminStatusBadge tone="vip">VIP</AdminStatusBadge>
                      ) : row.membershipTier ? (
                        <AdminStatusBadge tone={planStatusKind(row.membershipTier)}>
                          {planLabel(row.membershipTier)}
                        </AdminStatusBadge>
                      ) : null}
                      <em>{conversationStatusLabel(row.status)}</em>
                      <em>{formatRelativeAge(row.lastMessageAt)}</em>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </AdminSection>

        <AdminSection title="مراجعات العملاء">
          <AdminEmptyState
            title="لا توجد مراجعات مستحقة للعرض"
            body="استحقاق مراجعة التقدم يحتاج قاعدة تشغيل معتمدة. لا تُعرض مواعيد أو نسب وهمية."
            later="عند اعتماد القاعدة ستظهر هنا عناصر مثل مراجعة مستحقة مع رابط ملف العميل."
          />
        </AdminSection>
      </div>

      <AdminSection title="ملخص تشغيلي">
        {loading ? (
          <AdminSkeletonRows rows={1} />
        ) : (
          <div className="cc-summary">
            <Link to="/admin/messages" className="cc-summary__item">
              <span>رسائل غير مقروءة</span>
              <strong>{unreadThreads}</strong>
            </Link>
            <Link to="/admin/messages" className="cc-summary__item">
              <span>بانتظار رد</span>
              <strong>{waitingThreads}</strong>
            </Link>
            <Link to="/admin/payments" className="cc-summary__item">
              <span>مدفوعات للمراجعة</span>
              <strong>{pendingPayments}</strong>
            </Link>
          </div>
        )}
      </AdminSection>

      <AdminSection title="آخر النشاط">
        {loading ? <AdminSkeletonRows rows={3} /> : null}
        {!loading && recent.length === 0 ? (
          <AdminEmptyState title="لا نشاط حديث من المصادر المتاحة" body="يظهر هنا آخر الرسائل وطلبات الدفع الحقيقية فقط." />
        ) : null}
        {!loading && recent.length > 0 ? (
          <ul className="cc-activity">
            {recent.map((item) => (
              <li key={item.id}>
                <a href={item.href}>
                  <span>{item.title}</span>
                  <em>{item.meta}</em>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </AdminSection>

      <AdminSection title="إجراءات سريعة">
        <div className="cc-actions cc-actions--compact">
          <Link to="/admin/clients" className="cc-btn cc-btn--primary">
            البحث عن عميل
          </Link>
          <Link to="/admin/messages" className="cc-btn">
            فتح الصندوق
          </Link>
          <Link to="/admin/payments" className="cc-btn">
            مراجعة المدفوعات
          </Link>
        </div>
      </AdminSection>
    </>
  );
}

function buildRecentActivity(data: CommandCenterState | null) {
  if (!data) return [];
  const items: Array<{ id: string; title: string; meta: string; href: string; at: number }> = [];

  for (const row of data.inbox) {
    if (!row.lastMessageAt) continue;
    items.push({
      id: `msg:${row.id}`,
      title: `${row.memberName} — ${row.lastMessagePreview || "رسالة"}`,
      meta: formatRelativeAge(row.lastMessageAt),
      href: `/admin/messages/${row.id}`,
      at: new Date(row.lastMessageAt).getTime(),
    });
  }

  for (const lead of data.payments) {
    items.push({
      id: `pay:${lead.id}`,
      title: `دفع معلّق — ${lead.full_name || lead.email || "طلب"}`,
      meta: formatRelativeAge(lead.created_at),
      href: "/admin/payments",
      at: lead.created_at ? new Date(lead.created_at).getTime() : 0,
    });
  }

  return items.sort((a, b) => b.at - a.at).slice(0, 8);
}
