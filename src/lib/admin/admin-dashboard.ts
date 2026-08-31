import type { AdminClientListItem } from "@/lib/admin/admin-clients-api";
import type { AdminOperationsSnapshot } from "@/lib/admin/admin-ops-api";
import { snapshotAttentionCount } from "@/lib/admin/admin-ops-api";

export type DashboardQuickStatusMetric = {
  id: string;
  label: string;
  value: number;
  hint: string;
  tone: "neutral" | "attention" | "positive";
  href?: string;
};

const NEW_CLIENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Real-data KPIs only — no invented counts. */
export function buildDashboardQuickStatus(input: {
  snapshot: AdminOperationsSnapshot;
  recentClients?: AdminClientListItem[];
  totalClients?: number | null;
  now?: Date;
}): DashboardQuickStatusMetric[] {
  const { snapshot } = input;
  const now = input.now ?? new Date();
  const paymentIssues = snapshot.legacyPendingPayments + snapshot.pspFailedEvents;
  const coachingWaiting = snapshot.unreadThreads + snapshot.waitingThreads;
  const needsAttention = snapshotAttentionCount(snapshot);

  const newClients =
    input.recentClients?.filter((row) => {
      const created = new Date(row.createdAt).getTime();
      return Number.isFinite(created) && now.getTime() - created <= NEW_CLIENT_WINDOW_MS;
    }).length ?? null;

  const metrics: DashboardQuickStatusMetric[] = [
    {
      id: "total_clients",
      label: "إجمالي العملاء",
      value: input.totalClients ?? 0,
      hint: input.totalClients != null ? "من سجل العملاء" : "غير متاح",
      tone: "neutral",
      href: "/admin/clients",
    },
    {
      id: "new_clients",
      label: "عملاء جدد (7 أيام)",
      value: newClients ?? 0,
      hint: newClients != null ? "من أحدث الصفحة المعروضة" : "غير متاح",
      tone: newClients && newClients > 0 ? "positive" : "neutral",
      href: "/admin/clients",
    },
    {
      id: "coaching_waiting",
      label: "رسائل بانتظار الرد",
      value: coachingWaiting,
      hint: "صندوق التدريب",
      tone: coachingWaiting > 0 ? "attention" : "neutral",
      href: "/admin/messages",
    },
    {
      id: "subscription_attention",
      label: "اشتراكات تحتاج انتباه",
      value: snapshot.subscriptionAttention,
      hint: "past_due أو إيقاف تجديد",
      tone: snapshot.subscriptionAttention > 0 ? "attention" : "neutral",
      href: "/admin/memberships",
    },
    {
      id: "payment_issues",
      label: "استثناءات الدفع",
      value: paymentIssues,
      hint: "تحويلات معلّقة + أحداث فاشلة",
      tone: paymentIssues > 0 ? "attention" : "neutral",
      href: "/admin/payments",
    },
    {
      id: "needs_attention",
      label: "يحتاج تدخلاً",
      value: needsAttention,
      hint: "مجموع الإشارات الحية",
      tone: needsAttention > 0 ? "attention" : "positive",
      href: "/admin#attention",
    },
  ];

  return metrics.filter((metric) => metric.id !== "total_clients" || input.totalClients != null);
}

export function isRecentClient(row: AdminClientListItem, now = new Date()): boolean {
  const created = new Date(row.createdAt).getTime();
  return Number.isFinite(created) && now.getTime() - created <= NEW_CLIENT_WINDOW_MS;
}
