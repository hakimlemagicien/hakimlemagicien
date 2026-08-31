import type { AdminAuditEvent } from "@/lib/admin/admin-audit-api";
import type { AdminMemberSubscriptionRow } from "@/lib/admin/admin-billing-ops-api";
import { planLabel } from "@/lib/admin/admin-status";

const AUDIT_EVENT_LABELS: Record<string, string> = {
  coach_override_applied: "تم تطبيق تعديل تدريبي",
  coach_override_reviewed: "تمت مراجعة تعديل تدريبي",
  program_assigned: "تم تعيين برنامج تدريبي",
  program_assignment_updated: "تم تحديث برنامج العميل",
  nutrition_assignment_created: "تم تعيين خطة تغذية",
  nutrition_assignment_updated: "تم تحديث خطة تغذية",
  membership_updated: "تم تحديث حالة اشتراك",
  subscription_updated: "تم تحديث حالة اشتراك",
  payment_reviewed: "تمت مراجعة دفعة",
  payment_approved: "تمت الموافقة على دفعة",
  support_ticket_updated: "تم تحديث تذكرة دعم",
  client_note_added: "تمت إضافة ملاحظة داخلية",
};

const COMMERCIAL_TIERS = new Set(["free", "essential", "premium"]);

/** Human-readable audit label — no raw snake_case in UI. */
export function formatAuditEventLabel(event: AdminAuditEvent): string {
  const mapped = AUDIT_EVENT_LABELS[event.eventType];
  if (mapped) return mapped;
  const label = event.metadata?.label;
  if (typeof label === "string" && label.trim()) return label.trim();
  return "حدث تشغيلي مسجّل";
}

export function auditEventEntityLabel(event: AdminAuditEvent): string | null {
  const meta = event.metadata ?? {};
  for (const key of ["client_name", "member_name", "full_name", "subject_name"]) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  if (event.subjectUserId) return null;
  return null;
}

export type MembershipOperationalSnapshot = {
  active: number;
  needsAttention: number;
  paymentExceptions: number;
  pendingReview: number;
  tierCounts: { free: number; essential: number; premium: number };
};

export function buildMembershipOperationalSnapshot(input: {
  subscriptions: AdminMemberSubscriptionRow[];
  subscriptionAttention: number;
  paymentExceptions: number;
  pendingReview: number;
}): MembershipOperationalSnapshot {
  const tierCounts = { free: 0, essential: 0, premium: 0 };
  for (const row of input.subscriptions) {
    const tier = row.tier?.toLowerCase() ?? "";
    if (!COMMERCIAL_TIERS.has(tier)) continue;
    if (tier === "free") tierCounts.free += 1;
    if (tier === "essential") tierCounts.essential += 1;
    if (tier === "premium") tierCounts.premium += 1;
  }
  return {
    active: input.subscriptions.filter((row) => row.isActive).length,
    needsAttention: input.subscriptionAttention,
    paymentExceptions: input.paymentExceptions,
    pendingReview: input.pendingReview,
    tierCounts,
  };
}

export function commercialTierLabel(tier: "free" | "essential" | "premium"): string {
  return planLabel(tier);
}
