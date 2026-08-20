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
import { buildAttentionQueue, sortCoachingInbox } from "@/lib/admin/admin-attention";
import { listAdminAuditEvents, type AdminAuditEvent } from "@/lib/admin/admin-audit-api";
import {
  listAdminSupportTickets,
  supportCategoryLabel,
  type AdminSupportTicketListItem,
} from "@/lib/admin/admin-ops-api";
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

type LoadState<T> = { rows: T; error: string | null; loading: boolean };

const emptyInbox: LoadState<CoachingInboxRow[]> = { rows: [], error: null, loading: true };
const emptyPayments: LoadState<AdminSubmittedLead[]> = { rows: [], error: null, loading: true };
const emptySupport: LoadState<AdminSupportTicketListItem[]> = { rows: [], error: null, loading: true };
const emptyAudit: LoadState<AdminAuditEvent[]> = { rows: [], error: null, loading: true };

function CommandCenterPage() {
  const [inbox, setInbox] = useState(emptyInbox);
  const [payments, setPayments] = useState(emptyPayments);
  const [support, setSupport] = useState(emptySupport);
  const [audit, setAudit] = useState(emptyAudit);
  const now = useMemo(
    () => new Date(),
    [inbox.rows, payments.rows, support.rows, audit.rows],
  );

  const loadInbox = useCallback(async () => {
    setInbox((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const rows = sortCoachingInbox(await fetchCoachingInbox());
      setInbox({ rows, error: null, loading: false });
    } catch (err) {
      console.error(err);
      setInbox({ rows: [], error: "تعذر تحميل صندوق التدريب.", loading: false });
    }
  }, []);

  const loadPayments = useCallback(async () => {
    setPayments((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const rows = await fetchSubmittedLeads();
      setPayments({ rows, error: null, loading: false });
    } catch (err) {
      console.error(err);
      setPayments({ rows: [], error: "تعذر تحميل مراجعات الدفع.", loading: false });
    }
  }, []);

  const loadSupport = useCallback(async () => {
    setSupport((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [received, inReview] = await Promise.all([
        listAdminSupportTickets({ status: "received" }),
        listAdminSupportTickets({ status: "in_review" }),
      ]);
      setSupport({ rows: [...received, ...inReview], error: null, loading: false });
    } catch (err) {
      console.error(err);
      setSupport({ rows: [], error: "تعذر تحميل طابور الدعم.", loading: false });
    }
  }, []);

  const loadAudit = useCallback(async () => {
    setAudit((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const rows = await listAdminAuditEvents();
      setAudit({ rows: rows.slice(0, 8), error: null, loading: false });
    } catch (err) {
      console.error(err);
      setAudit({ rows: [], error: "تعذر تحميل آخر نشاط إداري.", loading: false });
    }
  }, []);

  useEffect(() => {
    void loadInbox();
    void loadPayments();
    void loadSupport();
    void loadAudit();
  }, [loadInbox, loadPayments, loadSupport, loadAudit]);

  const queue = buildAttentionQueue({
    inbox: inbox.rows,
    payments: payments.rows,
    support: support.rows,
    now,
  });
  const coachingQueue = inbox.rows
    .filter((row) => row.unreadCount > 0 || row.status === "waiting_for_reply")
    .slice(0, 6);
  const paymentQueue = payments.rows.slice(0, 6);
  const supportQueue = support.rows.slice(0, 6);
  const clientActivity = inbox.rows
    .filter((row) => row.lastMessageAt)
    .slice()
    .sort((a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime())
    .slice(0, 6);

  const attentionLoading = inbox.loading || payments.loading || support.loading;

  return (
    <>
      <AdminPageHeader
        kicker={`${todayContextLabel(now)} · MAAKFIT Command Center`}
        title={`${dayGreeting(now)}، Coach Hakim`}
        subtitle="هذه أهم الأمور التي تحتاج متابعتك اليوم."
      />

      <AdminSection title="يحتاج انتباهاً">
        {attentionLoading ? <AdminSkeletonRows rows={4} /> : null}
        {!attentionLoading && queue.length === 0 ? (
          <AdminEmptyState
            title="لا توجد مهام عاجلة حالياً."
            body="لا رسائل بانتظار رد، ولا دفعات معلّقة، ولا تذاكر دعم مفتوحة من الإشارات المعتمدة."
          />
        ) : null}
        {!attentionLoading && queue.length > 0 ? (
          <AdminTable>
            <thead>
              <tr>
                <th>العميل</th>
                <th>الفئة</th>
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
                  <td>{categoryLabel(item.category)}</td>
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
          {inbox.loading ? <AdminSkeletonRows rows={3} /> : null}
          {inbox.error ? <AdminErrorState message={inbox.error} onRetry={() => void loadInbox()} /> : null}
          {!inbox.loading && !inbox.error && coachingQueue.length === 0 ? (
            <AdminEmptyState title="لا توجد رسائل تنتظر الرد." body="عندما ينتظر عميل رداً ستظهر المحادثة هنا." />
          ) : null}
          {!inbox.loading && coachingQueue.length > 0 ? (
            <ul className="cc-queue">
              {coachingQueue.map((row) => (
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

        <AdminSection title="طابور الدعم">
          {support.loading ? <AdminSkeletonRows rows={3} /> : null}
          {support.error ? <AdminErrorState message={support.error} onRetry={() => void loadSupport()} /> : null}
          {!support.loading && !support.error && supportQueue.length === 0 ? (
            <AdminEmptyState title="لا توجد تذاكر دعم مفتوحة." body="التذاكر المستلمة أو قيد المراجعة تظهر هنا." />
          ) : null}
          {!support.loading && supportQueue.length > 0 ? (
            <ul className="cc-queue">
              {supportQueue.map((ticket) => (
                <li key={ticket.id}>
                  <Link to="/admin/support" search={{ ticket: ticket.id }} className="cc-queue__item">
                    <span className="cc-queue__main">
                      <strong>{ticket.displayName || ticket.email || ticket.ticketCode}</strong>
                      <span>
                        {ticket.category === "privacy"
                          ? "خصوصية — التفاصيل داخل شاشة الدعم"
                          : ticket.subject}
                      </span>
                    </span>
                    <span className="cc-queue__meta">
                      <AdminStatusBadge tone="review">{supportCategoryLabel(ticket.category)}</AdminStatusBadge>
                      <em>{formatRelativeAge(ticket.createdAt)}</em>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </AdminSection>
      </div>

      <AdminSection title="مراجعات الدفع">
        {payments.loading ? <AdminSkeletonRows rows={3} /> : null}
        {payments.error ? <AdminErrorState message={payments.error} onRetry={() => void loadPayments()} /> : null}
        {!payments.loading && !payments.error && paymentQueue.length === 0 ? (
          <AdminEmptyState title="لا توجد دفعات تحتاج مراجعة." body="تحويلات submitted تظهر هنا لمراجعة الإيصال." />
        ) : null}
        {!payments.loading && paymentQueue.length > 0 ? (
          <ul className="cc-queue">
            {paymentQueue.map((lead) => (
              <li key={lead.id}>
                <Link to="/admin/payments" className="cc-queue__item">
                  <span className="cc-queue__main">
                    <strong>{lead.full_name || lead.email || "طلب"}</strong>
                    <span>
                      {lead.payment_amount} {lead.payment_currency} — مراجعة تحويل بنكي
                    </span>
                  </span>
                  <span className="cc-queue__meta">
                    <em>{formatRelativeAge(lead.created_at)}</em>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </AdminSection>

      <div className="cc-ops-split">
        <AdminSection title="نشاط العملاء">
          {inbox.loading ? <AdminSkeletonRows rows={3} /> : null}
          {!inbox.loading && clientActivity.length === 0 ? (
            <AdminEmptyState title="لا نشاط رسائل حديث" body="يظهر هنا آخر نشاط من صندوق التدريب فقط." />
          ) : null}
          {clientActivity.length > 0 ? (
            <ul className="cc-activity">
              {clientActivity.map((row) => (
                <li key={row.id}>
                  <Link to="/admin/messages/$conversationId" params={{ conversationId: row.id }}>
                    <span>
                      {row.memberName} — {row.lastMessagePreview || "رسالة"}
                    </span>
                    <em>{formatRelativeAge(row.lastMessageAt)}</em>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </AdminSection>

        <AdminSection title="آخر نشاط إداري">
          {audit.loading ? <AdminSkeletonRows rows={3} /> : null}
          {audit.error ? <AdminErrorState message={audit.error} onRetry={() => void loadAudit()} /> : null}
          {!audit.loading && !audit.error && audit.rows.length === 0 ? (
            <AdminEmptyState title="لا أحداث تدقيق بعد" body="تظهر هنا آخر الإجراءات المسجّلة فقط." />
          ) : null}
          {audit.rows.length > 0 ? (
            <ul className="cc-activity">
              {audit.rows.map((row) => (
                <li key={row.id}>
                  <Link to="/admin/audit">
                    <span>{row.eventType}</span>
                    <em>{formatRelativeAge(row.createdAt)}</em>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </AdminSection>
      </div>

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
          <Link to="/admin/support" className="cc-btn">
            فتح الدعم
          </Link>
          <Link to="/admin/audit" className="cc-btn">
            سجل العمليات
          </Link>
        </div>
      </AdminSection>
    </>
  );
}

function categoryLabel(category: string): string {
  if (category === "coaching") return "تدريب";
  if (category === "payment") return "دفع";
  if (category === "support") return "دعم";
  return category;
}
