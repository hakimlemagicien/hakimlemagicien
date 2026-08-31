import type { AdminPaymentExceptionRow } from "@/lib/admin/admin-billing-ops-api";
import type { AdminSubmittedLead } from "@/lib/admin-payments-api";
import type { AdminSupportTicketListItem } from "@/lib/admin/admin-ops-api";
import type { AdminPriority } from "@/lib/admin/admin-status";
import { formatRelativeAge, planLabel } from "@/lib/admin/admin-status";
import type { CoachingInboxRow } from "@/lib/platform/coaching-messaging";

export type AttentionCategory = "coaching" | "payment" | "support" | "billing";

export type AttentionType =
  | "coaching_reply"
  | "legacy_payment"
  | "support_ticket"
  | "payment_exception";

export type AttentionItem = {
  id: string;
  clientName: string;
  clientId?: string | null;
  category: AttentionCategory;
  type: AttentionType;
  reason: string;
  priority: AdminPriority;
  ageLabel: string;
  occurredAt: number;
  planLabel: string | null;
  href: string;
  actionLabel: string;
  statusLabel: string;
  vip: boolean;
};

const PRIORITY_RANK: Record<AdminPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };

export function attentionCategoryLabel(category: AttentionCategory): string {
  if (category === "coaching") return "تدريب";
  if (category === "payment") return "دفع";
  if (category === "support") return "دعم";
  if (category === "billing") return "فوترة";
  return category;
}

export function attentionTypeLabel(type: AttentionType): string {
  if (type === "coaching_reply") return "رد كوتش";
  if (type === "legacy_payment") return "تحويل بنكي";
  if (type === "support_ticket") return "تذكرة دعم";
  if (type === "payment_exception") return "استثناء دفع";
  return type;
}

/**
 * Daily queue order (no invented risk scores):
 * 1. Proven priority rank
 * 2. VIP within the same category
 * 3. Oldest waiting first
 */
export function compareAttentionItems(a: AttentionItem, b: AttentionItem): number {
  const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (byPriority !== 0) return byPriority;
  if (a.category !== b.category) {
    const cat: Record<AttentionCategory, number> = { coaching: 0, billing: 1, payment: 2, support: 3 };
    const byCat = cat[a.category] - cat[b.category];
    if (byCat !== 0) return byCat;
  }
  if (a.vip !== b.vip) return a.vip ? -1 : 1;
  return a.occurredAt - b.occurredAt;
}

export function sortCoachingInbox(rows: CoachingInboxRow[]): CoachingInboxRow[] {
  return [...rows].sort((a, b) => {
    const aWait = a.status === "waiting_for_reply" || a.unreadCount > 0;
    const bWait = b.status === "waiting_for_reply" || b.unreadCount > 0;
    if (aWait !== bWait) return aWait ? -1 : 1;
    const aVip = a.membershipTier?.toLowerCase() === "vip";
    const bVip = b.membershipTier?.toLowerCase() === "vip";
    if (aWait && aVip !== bVip) return aVip ? -1 : 1;
    const aAt = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bAt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    if (aWait) return aAt - bAt;
    return bAt - aAt;
  });
}

function exceptionPriority(priority: string): AdminPriority {
  if (priority === "critical") return "critical";
  if (priority === "high") return "high";
  return "normal";
}

/** Real-data queue only. No invented review/adherence rules. */
export function buildAttentionQueue(input: {
  inbox: CoachingInboxRow[];
  payments: AdminSubmittedLead[];
  support?: AdminSupportTicketListItem[];
  paymentExceptions?: AdminPaymentExceptionRow[];
  now?: Date;
}): AttentionItem[] {
  const now = input.now ?? new Date();
  const items: AttentionItem[] = [];

  for (const row of input.inbox) {
    const waiting = row.status === "waiting_for_reply" || row.unreadCount > 0;
    if (!waiting) continue;
    const vip = row.membershipTier?.toLowerCase() === "vip";
    items.push({
      id: `inbox:${row.id}`,
      clientName: row.memberName,
      clientId: row.memberId,
      category: "coaching",
      type: "coaching_reply",
      reason: row.unreadCount > 0 ? "رسالة تنتظر الرد" : "محادثة بانتظار رد",
      priority: vip ? "critical" : "high",
      ageLabel: formatRelativeAge(row.lastMessageAt, now),
      occurredAt: row.lastMessageAt ? new Date(row.lastMessageAt).getTime() : Number.MAX_SAFE_INTEGER,
      planLabel: planLabel(row.membershipTier),
      href: `/admin/messages/${row.id}`,
      actionLabel: "فتح الرسائل",
      statusLabel: row.unreadCount > 0 ? "غير مقروء" : "بانتظار الرد",
      vip,
    });
  }

  for (const lead of input.payments) {
    items.push({
      id: `payment:${lead.id}`,
      clientName: lead.full_name || lead.email || "طلب دفع",
      category: "payment",
      type: "legacy_payment",
      reason: "مدفوعة بانتظار المراجعة",
      priority: "high",
      ageLabel: formatRelativeAge(lead.created_at, now),
      occurredAt: lead.created_at ? new Date(lead.created_at).getTime() : Number.MAX_SAFE_INTEGER,
      planLabel: null,
      href: "/admin/payments?section=legacy",
      actionLabel: "مراجعة الدفع",
      statusLabel: "معلّق",
      vip: false,
    });
  }

  for (const ticket of input.support ?? []) {
    if (ticket.status !== "received" && ticket.status !== "in_review") continue;
    items.push({
      id: `support:${ticket.id}`,
      clientName: ticket.displayName || ticket.email || ticket.ticketCode,
      clientId: ticket.userId,
      category: "support",
      type: "support_ticket",
      reason: ticket.category === "privacy" ? "تذكرة خصوصية تحتاج مراجعة" : "تذكرة دعم مفتوحة",
      priority: ticket.category === "privacy" ? "critical" : "high",
      ageLabel: formatRelativeAge(ticket.createdAt, now),
      occurredAt: ticket.createdAt ? new Date(ticket.createdAt).getTime() : Number.MAX_SAFE_INTEGER,
      planLabel: null,
      href: `/admin/support?ticket=${encodeURIComponent(ticket.id)}`,
      actionLabel: "فتح الدعم",
      statusLabel: ticket.status === "received" ? "مستلمة" : "قيد المراجعة",
      vip: false,
    });
  }

  for (const exception of input.paymentExceptions ?? []) {
    items.push({
      id: `exception:${exception.exceptionId}`,
      clientName: exception.subjectLabel || "استثناء فوترة",
      category: "billing",
      type: "payment_exception",
      reason: exception.detail || "استثناء دفع يحتاج متابعة",
      priority: exceptionPriority(exception.priority),
      ageLabel: formatRelativeAge(exception.occurredAt, now),
      occurredAt: exception.occurredAt ? new Date(exception.occurredAt).getTime() : Number.MAX_SAFE_INTEGER,
      planLabel: null,
      href: exception.href || "/admin/payments?section=exceptions",
      actionLabel: "مراجعة",
      statusLabel: "مفتوح",
      vip: false,
    });
  }

  return items.sort(compareAttentionItems);
}
