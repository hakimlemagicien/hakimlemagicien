import type { AdminAuditEvent } from "@/lib/admin/admin-audit-api";
import { clientNutritionSummary, clientTrainingSummary } from "@/lib/admin/admin-client-ops";
import type { AdminClientOverview } from "@/lib/admin/admin-clients-api";
import { formatAuditEventLabel } from "@/lib/admin/admin-dashboard-present";
import { objectiveSignalLabel, objectiveTrainingSignals } from "@/lib/admin/admin-client-training";
import type { AdminPriority } from "@/lib/admin/admin-status";
import {
  nutritionAttentionSignals,
  nutritionSignalLabel,
} from "@/lib/platform/nutrition-assignment";

export type OpsAttentionRow = {
  id: string;
  clientId: string;
  clientName: string;
  issue: string;
  currentPlan: string;
  severity: AdminPriority;
  reason: string;
  lastActivity: string | null;
  actionLabel: string;
  href: string;
};

export type TrainingQuickStatus = {
  activePrograms: number;
  needsReview: number;
  fromSample: boolean;
  sampleSize: number;
};

export type TrainingReviewRow = {
  id: string;
  what: string;
  clientId: string | null;
  clientName: string | null;
  when: string;
  source: string | null;
  href: string;
};

const TRAINING_SIGNAL_PREFIX = "training-";
const NUTRITION_SIGNAL_PREFIX = "nutrition-";

export const TRAINING_REVIEW_EVENT_TYPES = [
  "coach_override_applied",
  "coach_override_reviewed",
  "program_assigned",
  "program_assignment_updated",
] as const;

function signalPriority(signal: string): AdminPriority {
  if (signal === "allergen_conflict") return "critical";
  if (signal.includes("legacy") || signal.includes("ended")) return "normal";
  return "high";
}

export function buildTrainingAttentionFromOverview(overview: AdminClientOverview): OpsAttentionRow[] {
  const rows: OpsAttentionRow[] = [];
  const lastActivity =
    overview.last_workout_at || overview.coaching?.last_message_at || overview.created_at;

  for (const signal of objectiveTrainingSignals({
    status: overview.assignment?.status ?? null,
    startsOn: overview.assignment?.starts_on ?? null,
    durationWeeks: overview.assignment?.duration_weeks ?? null,
    snapshotComplete: overview.assignment?.snapshot_complete ?? null,
  })) {
    rows.push({
      id: `${overview.id}-${TRAINING_SIGNAL_PREFIX}${signal}`,
      clientId: overview.id,
      clientName: overview.full_name || "بدون اسم",
      issue: "مراجعة تدريب",
      currentPlan: clientTrainingSummary(overview),
      severity: signalPriority(signal),
      reason: objectiveSignalLabel(signal),
      lastActivity,
      actionLabel: "مراجعة العميل",
      href: `/admin/clients/${overview.id}?tab=training`,
    });
  }

  return rows;
}

export function buildNutritionAttentionFromOverview(overview: AdminClientOverview): OpsAttentionRow[] {
  const rows: OpsAttentionRow[] = [];
  const lastActivity = overview.last_nutrition_at || overview.coaching?.last_message_at || overview.created_at;

  for (const signal of nutritionAttentionSignals({
    status: overview.nutrition_assignment?.status ?? null,
    startsOn: overview.nutrition_assignment?.starts_on ?? null,
    snapshotComplete: overview.nutrition_assignment?.snapshot_complete ?? null,
    allergenConflict: overview.nutrition_assignment?.allergen_conflict ?? null,
  })) {
    rows.push({
      id: `${overview.id}-${NUTRITION_SIGNAL_PREFIX}${signal}`,
      clientId: overview.id,
      clientName: overview.full_name || "بدون اسم",
      issue: signal === "allergen_conflict" ? "تنبيه حساسية" : "مراجعة تغذية",
      currentPlan: clientNutritionSummary(overview),
      severity: signalPriority(signal),
      reason: nutritionSignalLabel(signal),
      lastActivity,
      actionLabel: signal === "allergen_conflict" ? "مراجعة التنبيه" : "فتح خطة التغذية",
      href: `/admin/clients/${overview.id}?tab=nutrition`,
    });
  }

  return rows;
}

export function buildTrainingQuickStatus(overviews: AdminClientOverview[]): TrainingQuickStatus {
  const activePrograms = overviews.filter((row) =>
    ["active", "scheduled"].includes(row.assignment?.status ?? ""),
  ).length;
  const needsReview = overviews.reduce(
    (sum, row) => sum + buildTrainingAttentionFromOverview(row).length,
    0,
  );
  return {
    activePrograms,
    needsReview,
    fromSample: true,
    sampleSize: overviews.length,
  };
}

export function buildNutritionQuickStatus(overviews: AdminClientOverview[]) {
  const activePlans = overviews.filter((row) =>
    ["active", "scheduled"].includes(row.nutrition_assignment?.status ?? ""),
  ).length;
  const needsAttention = overviews.reduce(
    (sum, row) => sum + buildNutritionAttentionFromOverview(row).length,
    0,
  );
  return { activePlans, needsAttention, fromSample: true, sampleSize: overviews.length };
}

export function buildTrainingReviewRows(events: AdminAuditEvent[]): TrainingReviewRow[] {
  return events
    .filter((event) =>
      (TRAINING_REVIEW_EVENT_TYPES as readonly string[]).includes(event.eventType),
    )
    .map((event) => {
      const meta = event.metadata ?? {};
      const clientId =
        (typeof meta.client_id === "string" && meta.client_id) ||
        event.subjectUserId ||
        null;
      const clientName =
        (typeof meta.client_name === "string" && meta.client_name) ||
        (typeof meta.full_name === "string" && meta.full_name) ||
        null;
      const source =
        (typeof meta.change_source === "string" && meta.change_source) ||
        (typeof meta.source === "string" && meta.source) ||
        (event.actorId ? `مدير ${event.actorId.slice(0, 8)}` : null);
      return {
        id: event.id,
        what: formatAuditEventLabel(event),
        clientId,
        clientName,
        when: event.createdAt,
        source,
        href: clientId ? `/admin/clients/${clientId}?tab=training` : "/admin/training/reviews",
      };
    });
}
