import { supabase } from "@/integrations/supabase/client";

export const ADMIN_SUPPORT_PAGE_SIZE = 25;

export const SUPPORT_STATUSES = ["received", "in_review", "resolved", "closed"] as const;
export const SUPPORT_CATEGORIES = [
  "account",
  "subscription_billing",
  "refund",
  "technical",
  "privacy",
  "other",
] as const;

export type SupportTicketStatus = (typeof SUPPORT_STATUSES)[number];
export type SupportTicketCategory = (typeof SUPPORT_CATEGORIES)[number];

export type AdminSupportTicketListItem = {
  id: string;
  ticketCode: string;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  category: string;
  status: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminSupportTicketDetail = AdminSupportTicketListItem & {
  message: string;
};

export type AdminOperationsSnapshot = {
  unreadThreads: number;
  waitingThreads: number;
  pendingPayments: number;
  openSupport: number;
};

export const SUPPORT_TRANSITIONS: Record<SupportTicketStatus, SupportTicketStatus[]> = {
  received: ["in_review", "closed"],
  in_review: ["resolved", "closed"],
  resolved: ["closed"],
  closed: [],
};

export function allowedSupportTransitions(status: string): SupportTicketStatus[] {
  if (status === "received" || status === "in_review" || status === "resolved" || status === "closed") {
    return SUPPORT_TRANSITIONS[status];
  }
  return [];
}

export function isAllowedSupportTransition(from: string, to: string): boolean {
  return allowedSupportTransitions(from).includes(to as SupportTicketStatus);
}

export function supportCategoryLabel(category: string): string {
  if (category === "account") return "حساب";
  if (category === "subscription_billing") return "فوترة";
  if (category === "refund") return "استرداد";
  if (category === "technical") return "تقني";
  if (category === "privacy") return "خصوصية";
  if (category === "other") return "أخرى";
  return category;
}

export function supportStatusLabel(status: string): string {
  if (status === "received") return "مستلمة";
  if (status === "in_review") return "قيد المراجعة";
  if (status === "resolved") return "محلول";
  if (status === "closed") return "مغلقة";
  return status;
}

function mapListItem(row: {
  id: string;
  ticket_code: string;
  user_id: string | null;
  email: string | null;
  display_name: string | null;
  category: string;
  status: string;
  subject: string;
  created_at: string;
  updated_at: string;
}): AdminSupportTicketListItem {
  return {
    id: row.id,
    ticketCode: row.ticket_code,
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    category: row.category,
    status: row.status,
    subject: row.subject,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchAdminOperationsSnapshot(): Promise<AdminOperationsSnapshot> {
  const { data, error } = await supabase.rpc("admin_get_operations_snapshot");
  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    unreadThreads: Number(row.unread_threads ?? 0),
    waitingThreads: Number(row.waiting_threads ?? 0),
    pendingPayments: Number(row.pending_payments ?? 0),
    openSupport: Number(row.open_support ?? 0),
  };
}

export function snapshotAttentionCount(snapshot: AdminOperationsSnapshot): number {
  return snapshot.unreadThreads + snapshot.waitingThreads + snapshot.pendingPayments + snapshot.openSupport;
}

export async function listAdminSupportTickets(opts?: {
  status?: string;
  category?: string;
  userId?: string;
  offset?: number;
}): Promise<AdminSupportTicketListItem[]> {
  const { data, error } = await supabase.rpc("admin_list_support_tickets", {
    p_status: opts?.status || null,
    p_category: opts?.category || null,
    p_user_id: opts?.userId || null,
    p_limit: ADMIN_SUPPORT_PAGE_SIZE,
    p_offset: Math.max(opts?.offset ?? 0, 0),
  });
  if (error) throw error;
  return (data ?? []).map(mapListItem);
}

export async function fetchAdminSupportTicket(ticketId: string): Promise<AdminSupportTicketDetail | null> {
  const { data, error } = await supabase
    .from("support_tickets")
    .select(
      "id, ticket_code, user_id, email, display_name, category, status, subject, message, created_at, updated_at",
    )
    .eq("id", ticketId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...mapListItem(data),
    message: data.message,
  };
}

export async function setAdminSupportTicketStatus(ticketId: string, status: SupportTicketStatus): Promise<void> {
  const { error } = await supabase.rpc("admin_set_support_ticket_status", {
    p_ticket_id: ticketId,
    p_status: status,
  });
  if (error) throw error;
}
