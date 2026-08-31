import type { AdminClientListItem, AdminClientOverview } from "@/lib/admin/admin-clients-api";
import { isRecentClient } from "@/lib/admin/admin-dashboard";
import { formatAuditEventLabel } from "@/lib/admin/admin-dashboard-present";
import type { AdminAuditEvent } from "@/lib/admin/admin-audit-api";
import type { AdminPriority } from "@/lib/admin/admin-status";
import {
  assignmentStatusLabel,
  objectiveSignalLabel,
  objectiveTrainingSignals,
} from "@/lib/admin/admin-client-training";
import {
  nutritionAttentionSignals,
  nutritionSignalLabel,
  nutritionStatusLabel,
} from "@/lib/platform/nutrition-assignment";
import { planLabel } from "@/lib/admin/admin-status";

export type ClientDirectorySummary = {
  totalClients: number;
  newClients: number;
  activeClients: number;
  needsAttention: number;
  fromVisibleRows: boolean;
};

export type ClientAttentionAlert = {
  id: string;
  title: string;
  reason: string;
  actionLabel: string;
  href: string;
  priority: AdminPriority;
};

export function clientNeedsAttention(row: AdminClientListItem): boolean {
  return row.unreadCoachingCount > 0 || row.waitingCoaching;
}

export function buildClientDirectorySummary(
  rows: AdminClientListItem[],
  totalCount: number,
  now = new Date(),
): ClientDirectorySummary {
  return {
    totalClients: totalCount,
    newClients: rows.filter((row) => isRecentClient(row, now)).length,
    activeClients: rows.filter((row) => row.membershipActive === true).length,
    needsAttention: rows.filter(clientNeedsAttention).length,
    fromVisibleRows: rows.length < totalCount,
  };
}

export function trainingLocationLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const normalized = value.toLowerCase();
  if (normalized.includes("home")) return "منزل";
  if (normalized.includes("gym")) return "نادي";
  if (normalized.includes("both")) return "منزل + نادي";
  return value;
}

export function buildClientAttentionAlerts(
  overview: AdminClientOverview,
  clientId: string,
): ClientAttentionAlert[] {
  const alerts: ClientAttentionAlert[] = [];

  if ((overview.coaching?.unread_count ?? 0) > 0) {
    alerts.push({
      id: "coaching-unread",
      title: "رسائل بانتظار الرد",
      reason: `${overview.coaching?.unread_count} رسالة غير مقروءة في صندوق التدريب.`,
      actionLabel: "فتح الرسائل",
      href: overview.coaching?.conversation_id
        ? `/admin/messages/${overview.coaching.conversation_id}`
        : "/admin/messages",
      priority: "high",
    });
  } else if (overview.coaching?.status === "waiting_for_reply") {
    alerts.push({
      id: "coaching-waiting",
      title: "محادثة بانتظار رد",
      reason: "العميل ينتظر ردًا من الكوتش.",
      actionLabel: "فتح الرسائل",
      href: overview.coaching?.conversation_id
        ? `/admin/messages/${overview.coaching.conversation_id}`
        : "/admin/messages",
      priority: "high",
    });
  }

  if ((overview.open_support_count ?? 0) > 0) {
    alerts.push({
      id: "support-open",
      title: "تذاكر دعم مفتوحة",
      reason: `${overview.open_support_count} تذكرة دعم تحتاج متابعة.`,
      actionLabel: "فتح الدعم",
      href: `/admin/support?userId=${encodeURIComponent(clientId)}`,
      priority: "normal",
    });
  }

  for (const signal of objectiveTrainingSignals({
    status: overview.assignment?.status ?? null,
    startsOn: overview.assignment?.starts_on ?? null,
    durationWeeks: overview.assignment?.duration_weeks ?? null,
    snapshotComplete: overview.assignment?.snapshot_complete ?? null,
  })) {
    alerts.push({
      id: `training-${signal}`,
      title: "مراجعة تدريب",
      reason: objectiveSignalLabel(signal),
      actionLabel: "فتح التدريب",
      href: `/admin/clients/${clientId}?tab=training`,
      priority: "high",
    });
  }

  for (const signal of nutritionAttentionSignals({
    status: overview.nutrition_assignment?.status ?? null,
    startsOn: overview.nutrition_assignment?.starts_on ?? null,
    snapshotComplete: overview.nutrition_assignment?.snapshot_complete ?? null,
    allergenConflict: overview.nutrition_assignment?.allergen_conflict ?? null,
  })) {
    alerts.push({
      id: `nutrition-${signal}`,
      title: "تنبيه تغذية",
      reason: nutritionSignalLabel(signal),
      actionLabel: "فتح التغذية",
      href: `/admin/clients/${clientId}?tab=nutrition`,
      priority: signal === "allergen_conflict" ? "critical" : "high",
    });
  }

  if (overview.membership && !overview.membership.is_active) {
    alerts.push({
      id: "membership-inactive",
      title: "عضوية غير نشطة",
      reason: `الخطة ${planLabel(overview.membership.tier)} غير نشطة حاليًا.`,
      actionLabel: "مراجعة العضوية",
      href: `/admin/clients/${clientId}?tab=membership`,
      priority: "high",
    });
  }

  return alerts;
}

export function formatClientActivityEvent(event: AdminAuditEvent): {
  what: string;
  who: string | null;
  source: string | null;
} {
  const meta = event.metadata ?? {};
  const who =
    (typeof meta.client_name === "string" && meta.client_name) ||
    (typeof meta.member_name === "string" && meta.member_name) ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    null;
  const source =
    (typeof meta.source === "string" && meta.source) ||
    (typeof meta.origin === "string" && meta.origin) ||
    (event.actorId ? `مدير ${event.actorId.slice(0, 8)}` : null);
  return {
    what: formatAuditEventLabel(event),
    who,
    source,
  };
}

export function clientTrainingSummary(overview: AdminClientOverview): string {
  if (!overview.assignment) return "لا تعيين تدريب";
  return `${overview.assignment.name_ar ?? "برنامج"} · ${assignmentStatusLabel(overview.assignment.status)}`;
}

export function clientNutritionSummary(overview: AdminClientOverview): string {
  if (!overview.nutrition_assignment) return "لا تعيين تغذية";
  return `${overview.nutrition_assignment.name_ar ?? "خطة"} · ${nutritionStatusLabel(overview.nutrition_assignment.status)}`;
}

export function isInternalVipTier(tier: string | null | undefined): boolean {
  return tier?.toLowerCase() === "vip";
}
