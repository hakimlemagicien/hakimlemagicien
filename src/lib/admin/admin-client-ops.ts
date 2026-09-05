import type { AdminClientListItem, AdminClientOverview } from "@/lib/admin/admin-clients-api";
import { isRecentClient } from "@/lib/admin/admin-dashboard";
import { formatAuditEventLabel } from "@/lib/admin/admin-dashboard-present";
import type { AdminAuditEvent } from "@/lib/admin/admin-audit-api";
import { planLabel, type AdminPriority, type AdminStatusKind } from "@/lib/admin/admin-status";
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
import { presentClientTrainingGoal } from "@/lib/admin/admin-client-goal";
import { normalizeClientAccountStatus } from "@/lib/admin/admin-client-account";

export type ClientDirectorySummary = {
  totalClients: number;
  newClients: number;
  activeClients: number;
  needsAttention: number;
  incompleteOnboarding: number;
  pausedAccounts: number;
  fromVisibleRows: boolean;
};

export type DirectoryOperationalStatus = "active" | "attention" | "paused";

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
    activeClients: rows.filter((row) => directoryOperationalStatus(row) === "active").length,
    needsAttention: rows.filter(clientNeedsAttention).length,
    incompleteOnboarding: rows.filter((row) => !row.onboardingCompletedAt).length,
    pausedAccounts: rows.filter((row) => directoryOperationalStatus(row) === "paused").length,
    fromVisibleRows: rows.length < totalCount,
  };
}

export function directoryOperationalStatus(row: AdminClientListItem): DirectoryOperationalStatus {
  const account = normalizeClientAccountStatus(row.accountStatus);
  if (account === "suspended" || account === "archived" || account === "deletion_pending") {
    return "paused";
  }
  if (clientNeedsAttention(row)) return "attention";
  return "active";
}

export function directoryOperationalLabel(status: DirectoryOperationalStatus): string {
  if (status === "attention") return "يحتاج متابعة";
  if (status === "paused") return "متوقف";
  return "نشط";
}

export function directoryOperationalTone(status: DirectoryOperationalStatus): AdminStatusKind {
  if (status === "attention") return "waiting";
  if (status === "paused") return "neutral";
  return "active";
}

/** Presentation-only Arabic plan labels for the clients directory. Catalog IDs stay English. */
export function directoryPlanLabelAr(plan: string | null | undefined): string {
  const value = plan?.toLowerCase();
  if (value === "premium") return "احترافي";
  if (value === "essential") return "أساسي";
  if (value === "free") return "مجاني";
  if (value === "vip") return "VIP داخلي";
  return planLabel(plan);
}

export function directoryPlanTone(plan: string | null | undefined): AdminStatusKind {
  const value = plan?.toLowerCase();
  if (value === "premium" || value === "vip") return "active";
  if (value === "essential") return "waiting";
  if (value === "free") return "neutral";
  return "neutral";
}

export function paginationPages(current: number, total: number): Array<number | "gap"> {
  if (total <= 0) return [];
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const unique = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  const pages: Array<number | "gap"> = [];
  for (const page of unique) {
    const previous = pages[pages.length - 1];
    if (typeof previous === "number" && page - previous > 1) pages.push("gap");
    pages.push(page);
  }
  return pages;
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

  const goal = presentClientTrainingGoal(overview.goal);
  if (!goal.matrixReady) {
    alerts.push({
      id: "training-goal-unmapped",
      title: "هدف التدريب غير مربوط",
      reason:
        goal.status === "MISSING"
          ? "لا يوجد هدف تدريبي معتمد. Matrix لا تولّد برنامجًا حتى يُحدَّد هدف رسمي."
          : `الهدف الحالي «${goal.displayAr}» غير مربوط بالعقد الرسمي.`,
      actionLabel: "تعديل الهدف",
      href: `/admin/clients/${clientId}?tab=overview`,
      priority: "high",
    });
  }

  for (const signal of objectiveTrainingSignals({
    status: overview.assignment?.status ?? null,
    startsOn: overview.assignment?.starts_on ?? null,
    durationWeeks: overview.assignment?.duration_weeks ?? null,
    snapshotComplete: overview.assignment?.snapshot_complete ?? null,
  })) {
    const setup = signal === "no_active_program";
    alerts.push({
      id: `training-${signal}`,
      title: setup ? "برنامج التدريب غير مفعل" : "مراجعة تدريب",
      reason: objectiveSignalLabel(signal),
      actionLabel: setup ? "إعداد التدريب" : "فتح التدريب",
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
    const setup = signal === "no_active_nutrition";
    alerts.push({
      id: `nutrition-${signal}`,
      title: setup ? "لا توجد خطة تغذية" : "تنبيه تغذية",
      reason: nutritionSignalLabel(signal),
      actionLabel: setup ? "إعداد التغذية" : "فتح التغذية",
      href: `/admin/clients/${clientId}?tab=nutrition`,
      priority: signal === "allergen_conflict" ? "critical" : "high",
    });
  }

  if (overview.assignment?.progression_status === "REVIEW_REQUIRED") {
    alerts.push({
      id: "training-progression-review",
      title: "مراجعة تدريب",
      reason: "تمرين يحتاج مراجعة المدرب قبل أي تطور إضافي.",
      actionLabel: "فتح التدريب",
      href: `/admin/clients/${clientId}?tab=training`,
      priority: "high",
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
