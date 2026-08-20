import type { AdminSubmittedLead } from "@/lib/admin-payments-api";
import type { AdminSupportTicketListItem } from "@/lib/admin/admin-ops-api";
import type { AdminPriority } from "@/lib/admin/admin-status";
import { formatRelativeAge, planLabel } from "@/lib/admin/admin-status";
import type { CoachingInboxRow } from "@/lib/platform/coaching-messaging";

export type AttentionCategory = "coaching" | "payment" | "support";

export type AttentionItem = {
  id: string;
  clientName: string;
  category: AttentionCategory;
  reason: string;
  priority: AdminPriority;
  ageLabel: string;
  occurredAt: number;
  planLabel: string | null;
  href: string;
  actionLabel: string;
  vip: boolean;
};

const PRIORITY_RANK: Record<AdminPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };

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
    const cat: Record<AttentionCategory, number> = { coaching: 0, payment: 1, support: 2 };
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

/** Real-data queue only. No invented review/adherence rules. */
export function buildAttentionQueue(input: {
  inbox: CoachingInboxRow[];
  payments: AdminSubmittedLead[];
  support?: AdminSupportTicketListItem[];
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
      category: "coaching",
      reason: row.unreadCount > 0 ? "رسالة تنتظر الرد" : "محادثة بانتظار رد",
      priority: "high",
      ageLabel: formatRelativeAge(row.lastMessageAt, now),
      occurredAt: row.lastMessageAt ? new Date(row.lastMessageAt).getTime() : Number.MAX_SAFE_INTEGER,
      planLabel: planLabel(row.membershipTier),
      href: `/admin/messages/${row.id}`,
      actionLabel: "فتح المحادثة",
      vip,
    });
  }

  for (const lead of input.payments) {
    items.push({
      id: `payment:${lead.id}`,
      clientName: lead.full_name || lead.email || "طلب دفع",
      category: "payment",
      reason: "مدفوعة بانتظار المراجعة",
      priority: "high",
      ageLabel: formatRelativeAge(lead.created_at, now),
      occurredAt: lead.created_at ? new Date(lead.created_at).getTime() : Number.MAX_SAFE_INTEGER,
      planLabel: null,
      href: "/admin/payments",
      actionLabel: "مراجعة الدفع",
      vip: false,
    });
  }

  for (const ticket of input.support ?? []) {
    if (ticket.status !== "received" && ticket.status !== "in_review") continue;
    items.push({
      id: `support:${ticket.id}`,
      clientName: ticket.displayName || ticket.email || ticket.ticketCode,
      category: "support",
      reason: ticket.category === "privacy" ? "تذكرة خصوصية تحتاج مراجعة" : "تذكرة دعم مفتوحة",
      priority: "high",
      ageLabel: formatRelativeAge(ticket.createdAt, now),
      occurredAt: ticket.createdAt ? new Date(ticket.createdAt).getTime() : Number.MAX_SAFE_INTEGER,
      planLabel: null,
      href: `/admin/support?ticket=${encodeURIComponent(ticket.id)}`,
      actionLabel: "فتح التذكرة",
      vip: false,
    });
  }

  return items.sort(compareAttentionItems);
}
