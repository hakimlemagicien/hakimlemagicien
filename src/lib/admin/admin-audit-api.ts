import { supabase } from "@/integrations/supabase/client";

export const ADMIN_AUDIT_PAGE_SIZE = 50;

export function clampAdminAuditLimit(limit: number): number {
  if (!Number.isFinite(limit)) return ADMIN_AUDIT_PAGE_SIZE;
  return Math.min(Math.max(Math.trunc(limit), 1), ADMIN_AUDIT_PAGE_SIZE);
}

export type AdminAuditEvent = {
  id: string;
  actorId: string | null;
  subjectUserId: string | null;
  eventType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export async function listAdminAuditEvents(opts?: {
  eventType?: string;
  offset?: number;
}): Promise<AdminAuditEvent[]> {
  const { data, error } = await supabase.rpc("admin_list_audit_events", {
    p_event_type: opts?.eventType?.trim() || null,
    p_limit: clampAdminAuditLimit(ADMIN_AUDIT_PAGE_SIZE),
    p_offset: Math.max(opts?.offset ?? 0, 0),
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    actorId: row.actor_id,
    subjectUserId: row.subject_user_id,
    eventType: row.event_type,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  }));
}
