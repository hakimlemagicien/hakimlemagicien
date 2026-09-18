import { supabase } from "@/integrations/supabase/client";

type RpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

const rpc = supabase as unknown as RpcClient;

export type ClientProductNotification = {
  id: string;
  severity: "critical" | "important" | "info";
  title: string;
  body: string;
  deep_link: string | null;
  is_read: boolean;
  created_at: string;
};

export async function listMyProductNotifications(limit = 30) {
  const { data, error } = await rpc.rpc("client_list_product_notifications", { p_limit: limit });
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientProductNotification[];
}

export async function markMyProductNotificationRead(id: string) {
  const { error } = await rpc.rpc("client_mark_product_notification_read", { p_id: id });
  if (error) throw new Error(error.message);
}
