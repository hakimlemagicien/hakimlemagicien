import type { AdminClientListItem } from "@/lib/admin/admin-clients-api";
import type { AdminOperationsSnapshot } from "@/lib/admin/admin-ops-api";
import { snapshotAttentionCount } from "@/lib/admin/admin-ops-api";

export type DashboardKpiIcon = "users" | "messages" | "subscriptions" | "payments" | "attention";

export type DashboardQuickStatusMetric = {
  id: string;
  label: string;
  value: number;
  hint: string;
  tone: "neutral" | "attention" | "positive";
  icon: DashboardKpiIcon;
  href?: string;
  zeroHint?: string;
};

const NEW_CLIENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const KPI_ORDER = [
  "new_clients",
  "coaching_waiting",
  "subscription_attention",
  "payment_issues",
  "needs_attention",
] as const;

/** Real-data KPIs only — max 5, no fake trends. */
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
      id: "new_clients",
      label: "العملاء الجدد",
      value: newClients ?? 0,
      hint: "آخر 7 أيام",
      zeroHint: "لا عملاء جدد في آخر 7 أيام",
      tone: newClients && newClients > 0 ? "positive" : "neutral",
      icon: "users",
      href: "/admin/clients",
    },
    {
      id: "coaching_waiting",
      label: "رسائل بانتظار الرد",
      value: coachingWaiting,
      hint: "صندوق التدريب",
      zeroHint: "لا توجد رسائل تحتاج ردًا الآن",
      tone: coachingWaiting > 0 ? "attention" : "neutral",
      icon: "messages",
      href: "/admin/messages",
    },
    {
      id: "subscription_attention",
      label: "اشتراكات تحتاج انتباه",
      value: snapshot.subscriptionAttention,
      hint: "past_due أو إيقاف تجديد",
      zeroHint: "لا اشتراكات تحتاج انتباه",
      tone: snapshot.subscriptionAttention > 0 ? "attention" : "neutral",
      icon: "subscriptions",
      href: "/admin/memberships",
    },
    {
      id: "payment_issues",
      label: "استثناءات الدفع",
      value: paymentIssues,
      hint: "تحويلات معلّقة + أحداث فاشلة",
      zeroHint: "لا استثناءات دفع مفتوحة",
      tone: paymentIssues > 0 ? "attention" : "neutral",
      icon: "payments",
      href: "/admin/payments",
    },
    {
      id: "needs_attention",
      label: "يحتاج تدخلك",
      value: needsAttention,
      hint: "مجموع الإشارات الحية",
      zeroHint: "كل شيء تحت السيطرة",
      tone: needsAttention > 0 ? "attention" : "positive",
      icon: "attention",
      href: "/admin#attention",
    },
  ];

  return KPI_ORDER.map((id) => metrics.find((metric) => metric.id === id)).filter(
    (metric): metric is DashboardQuickStatusMetric => Boolean(metric),
  );
}

export function isRecentClient(row: AdminClientListItem, now = new Date()): boolean {
  const created = new Date(row.createdAt).getTime();
  return Number.isFinite(created) && now.getTime() - created <= NEW_CLIENT_WINDOW_MS;
}
