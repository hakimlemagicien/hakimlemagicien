import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AttentionCenter } from "@/components/admin/AttentionCenter";
import { DashboardQuickStatus } from "@/components/admin/DashboardQuickStatus";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminSection,
  AdminStatusBadge,
} from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { fetchSubmittedLeads, type AdminSubmittedLead } from "@/lib/admin-payments-api";
import { buildAttentionQueue, sortCoachingInbox } from "@/lib/admin/admin-attention";
import { listAdminAuditEvents, type AdminAuditEvent } from "@/lib/admin/admin-audit-api";
import {
  fetchAdminPaymentExceptions,
  fetchAdminMemberSubscriptions,
  type AdminPaymentExceptionRow,
} from "@/lib/admin/admin-billing-ops-api";
import { buildDashboardQuickStatus, isRecentClient } from "@/lib/admin/admin-dashboard";
import {
  fetchAdminOperationsSnapshot,
  listAdminSupportTickets,
  type AdminOperationsSnapshot,
  type AdminSupportTicketListItem,
} from "@/lib/admin/admin-ops-api";
import { searchAdminClients, type AdminClientListItem } from "@/lib/admin/admin-clients-api";
import {
  dayGreeting,
  formatRelativeAge,
  planLabel,
  planStatusKind,
  todayContextLabel,
} from "@/lib/admin/admin-status";
import { fetchCoachingInbox } from "@/lib/platform/coaching-messaging-api";
import type { CoachingInboxRow } from "@/lib/platform/coaching-messaging";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({ meta: [{ title: "مركز التشغيل | MAAKFIT" }] }),
  component: CommandCenterPage,
});

type LoadState<T> = { rows: T; error: string | null; loading: boolean };

const EMPTY_SNAPSHOT: AdminOperationsSnapshot = {
  unreadThreads: 0,
  waitingThreads: 0,
  pendingPayments: 0,
  legacyPendingPayments: 0,
  pspFailedEvents: 0,
  subscriptionAttention: 0,
  openSupport: 0,
};

const emptyInbox: LoadState<CoachingInboxRow[]> = { rows: [], error: null, loading: true };
const emptyPayments: LoadState<AdminSubmittedLead[]> = { rows: [], error: null, loading: true };
const emptySupport: LoadState<AdminSupportTicketListItem[]> = { rows: [], error: null, loading: true };
const emptyAudit: LoadState<AdminAuditEvent[]> = { rows: [], error: null, loading: true };
const emptyClients: LoadState<AdminClientListItem[]> = { rows: [], error: null, loading: true };
const emptyExceptions: LoadState<AdminPaymentExceptionRow[]> = { rows: [], error: null, loading: true };

function CommandCenterPage() {
  const [snapshot, setSnapshot] = useState<AdminOperationsSnapshot>(EMPTY_SNAPSHOT);
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [inbox, setInbox] = useState(emptyInbox);
  const [payments, setPayments] = useState(emptyPayments);
  const [support, setSupport] = useState(emptySupport);
  const [audit, setAudit] = useState(emptyAudit);
  const [clients, setClients] = useState(emptyClients);
  const [totalClients, setTotalClients] = useState<number | null>(null);
  const [exceptions, setExceptions] = useState(emptyExceptions);
  const [membershipSnapshot, setMembershipSnapshot] = useState<{
    active: number;
    attention: number;
    loading: boolean;
  }>({ active: 0, attention: 0, loading: true });

  const nowRef = useRef(new Date());

  const loadSnapshot = useCallback(async () => {
    setSnapshotLoading(true);
    try {
      const next = await fetchAdminOperationsSnapshot();
      setSnapshot(next);
    } catch (err) {
      console.error(err);
      setSnapshot(EMPTY_SNAPSHOT);
    } finally {
      setSnapshotLoading(false);
    }
  }, []);

  const loadInbox = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setInbox((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const rows = sortCoachingInbox(await fetchCoachingInbox());
      setInbox({ rows, error: null, loading: false });
    } catch (err) {
      console.error(err);
      setInbox({ rows: [], error: "تعذر تحميل صندوق التدريب.", loading: false });
    }
  }, []);

  const loadPayments = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setPayments((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const rows = await fetchSubmittedLeads();
      setPayments({ rows, error: null, loading: false });
    } catch (err) {
      console.error(err);
      setPayments({ rows: [], error: "تعذر تحميل مراجعات الدفع.", loading: false });
    }
  }, []);

  const loadSupport = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setSupport((prev) => ({ ...prev, loading: true, error: null }));
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

  const loadAudit = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setAudit((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const rows = await listAdminAuditEvents();
      setAudit({ rows: rows.slice(0, 8), error: null, loading: false });
    } catch (err) {
      console.error(err);
      setAudit({ rows: [], error: "تعذر تحميل آخر نشاط إداري.", loading: false });
    }
  }, []);

  const loadClients = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setClients((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await searchAdminClients("");
      setClients({ rows: result.rows, error: null, loading: false });
      setTotalClients(result.totalCount);
    } catch (err) {
      console.error(err);
      setClients({ rows: [], error: "تعذر تحميل العملاء الجدد.", loading: false });
      setTotalClients(null);
    }
  }, []);

  const loadExceptions = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setExceptions((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const rows = await fetchAdminPaymentExceptions();
      setExceptions({ rows, error: null, loading: false });
    } catch (err) {
      console.error(err);
      setExceptions({ rows: [], error: "تعذر تحميل استثناءات الدفع.", loading: false });
    }
  }, []);

  const loadMembershipSnapshot = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setMembershipSnapshot((prev) => ({ ...prev, loading: true }));
    try {
      const rows = await fetchAdminMemberSubscriptions();
      setMembershipSnapshot({
        active: rows.filter((row) => row.isActive).length,
        attention: rows.filter((row) => row.exceptionState).length,
        loading: false,
      });
    } catch (err) {
      console.error(err);
      setMembershipSnapshot({ active: 0, attention: 0, loading: false });
    }
  }, []);

  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setBooting(true);
    const bootCap = window.setTimeout(() => {
      if (!cancelled) setBooting(false);
    }, 10_000);
    const silent = { silent: true as const };
    void Promise.allSettled([
      loadSnapshot(),
      loadInbox(silent),
      loadPayments(silent),
      loadSupport(silent),
      loadAudit(silent),
      loadClients(silent),
      loadExceptions(silent),
      loadMembershipSnapshot(silent),
    ]).finally(() => {
      window.clearTimeout(bootCap);
      if (!cancelled) setBooting(false);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(bootCap);
    };
  }, [
    loadSnapshot,
    loadInbox,
    loadPayments,
    loadSupport,
    loadAudit,
    loadClients,
    loadExceptions,
    loadMembershipSnapshot,
  ]);

  const attentionLoading = !booting && (inbox.loading || payments.loading || support.loading || exceptions.loading);
  const quickStatusLoading = !booting && (snapshotLoading || clients.loading);
  const now = nowRef.current;

  if (booting) {
    return (
      <>
        <AdminPageHeader
          kicker={`${todayContextLabel(now)} · MAAKFIT Command Center`}
          title={`${dayGreeting(now)}، Coach Hakim`}
          subtitle="ما الذي يحتاج انتباهك اليوم؟"
        />
        <div className="cc-workspace-boot" aria-busy="true" aria-label="جاري تحميل مركز التشغيل">
          <AdminSkeletonRows rows={14} />
        </div>
      </>
    );
  }

  const queue = buildAttentionQueue({
    inbox: inbox.rows,
    payments: payments.rows,
    support: support.rows,
    paymentExceptions: exceptions.rows,
    now,
  });

  const quickStatus = buildDashboardQuickStatus({
    snapshot,
    recentClients: clients.rows,
    totalClients,
    now,
  });

  const newClients = clients.rows.filter((row) => isRecentClient(row, now));
  const clientActivity = inbox.rows
    .filter((row) => row.lastMessageAt)
    .slice()
    .sort((a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime())
    .slice(0, 6);

  return (
    <>
      <AdminPageHeader
        kicker={`${todayContextLabel(now)} · MAAKFIT Command Center`}
        title={`${dayGreeting(now)}، Coach Hakim`}
        subtitle="ما الذي يحتاج انتباهك اليوم؟"
      />

      <AdminSection title="ملخص سريع">
        <DashboardQuickStatus metrics={quickStatus} loading={quickStatusLoading} />
      </AdminSection>

      <AdminSection title="يحتاج انتباهك">
        {inbox.error || payments.error || support.error || exceptions.error ? (
          <AdminErrorState
            message="تعذر تحميل بعض إشارات الانتباه."
            onRetry={() => {
              void loadInbox();
              void loadPayments();
              void loadSupport();
              void loadExceptions();
              void loadSnapshot();
            }}
          />
        ) : null}
        <AttentionCenter items={queue} loading={attentionLoading} />
      </AdminSection>

      <div className="cc-ops-split">
        <AdminSection title="عملاء جدد">
          {clients.error ? <AdminErrorState message={clients.error} onRetry={() => void loadClients()} /> : null}
          {!clients.loading && !clients.error && newClients.length === 0 ? (
            <AdminEmptyState title="لا عملاء جدد في آخر 7 أيام." body="يُعرض هنا من الصفحة الحالية فقط." />
          ) : null}
          {!clients.loading && newClients.length > 0 ? (
            <ul className="cc-queue">
              {newClients.slice(0, 6).map((row) => (
                <li key={row.id}>
                  <Link to="/admin/clients/$clientId" params={{ clientId: row.id }} className="cc-queue__item">
                    <span className="cc-queue__main">
                      <strong>{row.fullName || row.email || "عميل"}</strong>
                      <span>{row.onboardingCompletedAt ? "اكتمل الإعداد" : "إعداد قيد الإكمال"}</span>
                    </span>
                    <span className="cc-queue__meta">
                      {row.membershipPlan ? (
                        <AdminStatusBadge tone={planStatusKind(row.membershipPlan)}>
                          {planLabel(row.membershipPlan)}
                        </AdminStatusBadge>
                      ) : null}
                      <em>{formatRelativeAge(row.createdAt)}</em>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </AdminSection>

        <AdminSection title="نشاط العملاء">
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
      </div>

      <AdminSection title="العضويات والمدفوعات">
        {!membershipSnapshot.loading ? (
          <div className="cc-snapshot-row">
            <div className="cc-snapshot-card">
              <span className="cc-snapshot-card__value">
                {membershipSnapshot.active.toLocaleString("ar-AE")}
              </span>
              <span className="cc-snapshot-card__label">اشتراكات نشطة (الصفحة الحالية)</span>
            </div>
            <div className="cc-snapshot-card cc-snapshot-card--attention">
              <span className="cc-snapshot-card__value">
                {snapshot.subscriptionAttention.toLocaleString("ar-AE")}
              </span>
              <span className="cc-snapshot-card__label">اشتراكات تحتاج انتباه</span>
            </div>
            <div className="cc-snapshot-card cc-snapshot-card--attention">
              <span className="cc-snapshot-card__value">
                {(snapshot.legacyPendingPayments + snapshot.pspFailedEvents).toLocaleString("ar-AE")}
              </span>
              <span className="cc-snapshot-card__label">مشاكل دفع مفتوحة</span>
            </div>
            <Link to="/admin/payments" className="cc-btn cc-btn--ghost">
              فتح المدفوعات
            </Link>
            <Link to="/admin/memberships" className="cc-btn cc-btn--ghost">
              فتح العضويات
            </Link>
          </div>
        ) : null}
        {!exceptions.loading && exceptions.rows.length > 0 ? (
          <ul className="cc-activity cc-activity--compact">
            {exceptions.rows.slice(0, 4).map((row) => (
              <li key={row.exceptionId}>
                <a href={row.href}>
                  <span>{row.subjectLabel}</span>
                  <em>{formatRelativeAge(row.occurredAt)}</em>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </AdminSection>

      <AdminSection title="آخر نشاط إداري">
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
