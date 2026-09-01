import { supabase } from "@/integrations/supabase/client";

export type MyAccountLifecycle = {
  status: string;
  blocked: boolean;
  deleted: boolean;
  staff: boolean;
};

export async function fetchMyAccountLifecycle(): Promise<MyAccountLifecycle> {
  const { data, error } = await supabase.rpc("get_my_account_lifecycle");
  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    status: typeof row.status === "string" ? row.status : "active",
    blocked: row.blocked === true,
    deleted: row.deleted === true,
    staff: row.staff === true,
  };
}
