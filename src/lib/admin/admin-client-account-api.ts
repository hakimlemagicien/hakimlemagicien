import { supabase } from "@/integrations/supabase/client";
import type { ClientAccountAction, ClientAccountStatus } from "@/lib/admin/admin-client-account";

export type ClientDeletionPreview = {
  clientId: string;
  email: string | null;
  fullName: string | null;
  accountStatus: ClientAccountStatus;
  alreadyExecuted: boolean;
  blocked: boolean;
  blockers: string[];
  impact: {
    will_process: string[];
    will_retain: string[];
    will_not: string[];
  };
};

export type ClientAccountMutationResult = {
  ok: boolean;
  blocked?: boolean;
  blockers?: string[];
  duplicate?: boolean;
  status?: string;
  previousStatus?: string;
  newStatus?: string;
  requestId?: string;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function setAdminClientAccountStatus(
  clientId: string,
  action: ClientAccountAction,
  reason: string,
): Promise<ClientAccountMutationResult> {
  const { data, error } = await supabase.rpc("admin_set_client_account_status", {
    p_client_id: clientId,
    p_action: action,
    p_reason: reason,
  });
  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    ok: row.ok === true,
    previousStatus: typeof row.previous_status === "string" ? row.previous_status : undefined,
    newStatus: typeof row.new_status === "string" ? row.new_status : undefined,
  };
}

export async function previewAdminClientAccountDeletion(clientId: string): Promise<ClientDeletionPreview> {
  const { data, error } = await supabase.rpc("admin_preview_client_account_deletion", {
    p_client_id: clientId,
  });
  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  const impact = (row.impact ?? {}) as Record<string, unknown>;
  return {
    clientId: typeof row.client_id === "string" ? row.client_id : clientId,
    email: typeof row.email === "string" ? row.email : null,
    fullName: typeof row.full_name === "string" ? row.full_name : null,
    accountStatus: (typeof row.account_status === "string" ? row.account_status : "active") as ClientAccountStatus,
    alreadyExecuted: row.already_executed === true,
    blocked: row.blocked === true,
    blockers: asStringArray(row.blockers),
    impact: {
      will_process: asStringArray(impact.will_process),
      will_retain: asStringArray(impact.will_retain),
      will_not: asStringArray(impact.will_not),
    },
  };
}

export async function executeAdminClientAccountDeletion(input: {
  clientId: string;
  reason: string;
  confirmationEmail: string;
  idempotencyKey: string;
}): Promise<ClientAccountMutationResult> {
  const { data, error } = await supabase.rpc("admin_execute_client_account_deletion", {
    p_client_id: input.clientId,
    p_reason: input.reason,
    p_confirmation_email: input.confirmationEmail,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    ok: row.ok === true,
    blocked: row.blocked === true,
    blockers: asStringArray(row.blockers),
    duplicate: row.duplicate === true,
    status: typeof row.status === "string" ? row.status : undefined,
    requestId: typeof row.request_id === "string" ? row.request_id : undefined,
  };
}
