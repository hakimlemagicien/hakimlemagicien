import type { AdminSubmittedLead } from "@/lib/admin-payments-api";
import type { AdminPriority } from "@/lib/admin/admin-status";
import { formatRelativeAge, planLabel } from "@/lib/admin/admin-status";
import type { CoachingInboxRow } from "@/lib/platform/coaching-messaging";

export type AttentionItem = {
  id: string;
  clientName: string;
  reason: string;
  priority: AdminPriority;
  ageLabel: string;
  occurredAt: number;
  planLabel: string | null;
  href: string;
  actionLabel: string;
  vip: boolean;
};

/** Real-data queue only. No invented review/adherence rules. */
export function buildAttentionQueue(input: {
  inbox: CoachingInboxRow[];
  payments: AdminSubmittedLead[];
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
      reason: row.unreadCount > 0 ? "رسالة تنتظر الرد" : "محادثة بانتظار رد",
      priority: "high",
      ageLabel: formatRelativeAge(row.lastMessageAt, now),
      occurredAt: row.lastMessageAt ? new Date(row.lastMessageAt).getTime() : 0,
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
      reason: "مدفوعة بانتظار المراجعة",
      priority: "high",
      ageLabel: formatRelativeAge(lead.created_at, now),
      occurredAt: lead.created_at ? new Date(lead.created_at).getTime() : 0,
      planLabel: null,
      href: "/admin/payments",
      actionLabel: "مراجعة الدفع",
      vip: false,
    });
  }

  const rank: Record<AdminPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };
  return items.sort((a, b) => {
    const byPriority = rank[a.priority] - rank[b.priority];
    if (byPriority !== 0) return byPriority;
    if (a.vip !== b.vip) return a.vip ? -1 : 1;
    return b.occurredAt - a.occurredAt;
  });
}
