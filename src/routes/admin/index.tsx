import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Dumbbell,
  MessageSquare,
  UtensilsCrossed,
  Users,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AttentionCenter } from "@/components/admin/AttentionCenter";
import { DashboardQuickStatus } from "@/components/admin/DashboardQuickStatus";
import {
  AdminEmptyState,
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
import { dayGreeting, formatRelativeAge, planLabel, planStatusKind } from "@/lib/admin/admin-status";
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

const QUICK_ACTIONS = [
  { to: "/admin/clients", label: "فتح العملاء", icon: Users },
  { to: "/admin/messages", label: "فتح الرسائل", icon: MessageSquare },
  { to: "/admin/payments", label: "مراجعة المدفوعات", icon: Wallet },
  { to: "/admin/exercises", label: "مكتبة التمارين", icon: Dumbbell },
  { to: "/admin/nutrition", label: "مكتبة الوجبات", icon: UtensilsCrossed },
] as const;

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
  const attentionError = inbox.error || payments.error || support.error || exceptions.error;

  function retryAttention() {
    void loadInbox();
    void loadPayments();
    void loadSupport();
    void loadExceptions();
    void loadSnapshot();
  }

  if (booting) {
    return (
      <>
        <AdminPageHeader title={`${dayGreeting(now)}، Coach Hakim 👋`} subtitle="إليك أهم ما يحتاج انتباهك اليوم." />
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
  const paymentIssues = snapshot.legacyPendingPayments + snapshot.pspFailedEvents;

  return (
    <div className="cc-dashboard">
      <AdminPageHeader title={`${dayGreeting(now)}، Coach Hakim 👋`} subtitle="إليك أهم ما يحتاج انتباهك اليوم." />

      <DashboardQuickStatus metrics={quickStatus} loading={quickStatusLoading} />

      <section className="cc-dashboard__attention" aria-labelledby="attention-heading">
        <div className="cc-section-head">
          <h2 id="attention-heading" className="cc-section__title">
            يحتاج انتباهك
          </h2>
          {queue.length > 0 ? (
            <a href="#attention" className="cc-section-head__link">
              عرض الكل
            </a>
          ) : null}
        </div>
        {attentionError ? (
          <div className="cc-inline-alert" role="alert">
            <span>تعذر تحديث بعض البيانات.</span>
            <button type="button" className="cc-btn cc-btn--ghost cc-btn--compact" onClick={retryAttention}>
              إعادة المحاولة
            </button>
          </div>
        ) : null}
        <AttentionCenter items={queue} loading={attentionLoading} />
      </section>

      <div className="cc-dash-grid">
        <AdminSection title="العملاء الجدد">
          {clients.error ? (
            <div className="cc-inline-alert" role="alert">
              <span>{clients.error}</span>
              <button type="button" className="cc-btn cc-btn--ghost cc-btn--compact" onClick={() => void loadClients()}>
                إعادة المحاولة
              </button>
            </div>
          ) : null}
          {!clients.loading && !clients.error && newClients.length === 0 ? (
            <AdminEmptyState title="لا عملاء جدد في آخر 7 أيام." body="يُعرض هنا من السجل الحالي فقط." />
          ) : null}
          {newClients.length > 0 ? (
            <ul className="cc-compact-list">
              {newClients.slice(0, 5).map((row) => (
                <li key={row.id}>
                  <Link to="/admin/clients/$clientId" params={{ clientId: row.id }} className="cc-compact-list__item">
                    <span className="cc-compact-list__avatar" aria-hidden>
                      {(row.fullName || row.email || "ع").slice(0, 1)}
                    </span>
                    <span className="cc-compact-list__body">
                      <strong>{row.fullName || row.email || "عميل"}</strong>
                      {row.membershipPlan ? (
                        <AdminStatusBadge tone={planStatusKind(row.membershipPlan)}>
                          {planLabel(row.membershipPlan)}
                        </AdminStatusBadge>
                      ) : null}
                    </span>
                    <em>{formatRelativeAge(row.createdAt)}</em>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <Link to="/admin/clients" className="cc-card-footer-link" preload={false}>
            عرض جميع العملاء ←
          </Link>
        </AdminSection>

        <AdminSection title="الاشتراكات والمدفوعات">
          <ul className="cc-stat-list">
            <li>
              <span>اشتراكات نشطة</span>
              <strong>{membershipSnapshot.active.toLocaleString("ar-AE")}</strong>
            </li>
            <li>
              <span>تحتاج انتباه</span>
              <strong>{snapshot.subscriptionAttention.toLocaleString("ar-AE")}</strong>
            </li>
            <li>
              <span>استثناءات الدفع</span>
              <strong>{paymentIssues.toLocaleString("ar-AE")}</strong>
            </li>
            <li>
              <span>مدفوعات للمراجعة</span>
              <strong>{payments.rows.length.toLocaleString("ar-AE")}</strong>
            </li>
          </ul>
          <Link to="/admin/payments" className="cc-card-footer-link" preload={false}>
            عرض جميع المدفوعات ←
          </Link>
        </AdminSection>

        <AdminSection title="آخر النشاطات">
          {audit.error ? (
            <div className="cc-inline-alert" role="alert">
              <span>{audit.error}</span>
              <button type="button" className="cc-btn cc-btn--ghost cc-btn--compact" onClick={() => void loadAudit()}>
                إعادة المحاولة
              </button>
            </div>
          ) : null}
          {!audit.loading && !audit.error && audit.rows.length === 0 ? (
            <AdminEmptyState title="لا أحداث تدقيق بعد" body="تظهر هنا آخر الإجراءات المسجّلة." />
          ) : null}
          {audit.rows.length > 0 ? (
            <ul className="cc-timeline">
              {audit.rows.slice(0, 5).map((row) => (
                <li key={row.id}>
                  <span className="cc-timeline__dot" aria-hidden />
                  <div>
                    <strong>{row.eventType}</strong>
                    <em>{formatRelativeAge(row.createdAt)}</em>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          <Link to="/admin/audit" className="cc-card-footer-link" preload={false}>
            عرض جميع النشاطات ←
          </Link>
        </AdminSection>
      </div>

      <AdminSection title="إجراءات سريعة">
        <div className="cc-quick-actions">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.to} to={action.to} className="cc-quick-action" preload={false}>
                <Icon className="h-4 w-4" aria-hidden />
                <span>{action.label}</span>
              </Link>
            );
          })}
        </div>
      </AdminSection>
    </div>
  );
}
