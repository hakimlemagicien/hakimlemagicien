import { supabase } from "@/integrations/supabase/client";

type RpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

const rpc = supabase as unknown as RpcClient;

export type CommandCenterPrice = {
  id: string;
  plan: "essential" | "premium" | "vip";
  term_months: 3 | 6;
  currency: "USD";
  amount: number;
  status: "draft" | "published" | "archived";
  version: number;
  published_at: string | null;
};

export type CommandCenterPromotion = {
  id: string;
  name: string;
  plan: "essential" | "premium" | "vip";
  term_months: 3 | 6;
  promotional_price: number;
  starts_at: string;
  ends_at: string;
  status: "draft" | "active" | "paused" | "ended";
  published_at: string | null;
};

export type CommandCenterPromoCode = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  plans: string[];
  terms: number[];
  starts_at: string;
  expires_at: string | null;
  max_total_uses: number | null;
  one_use_per_client: boolean;
  new_clients_only: boolean;
  status: "draft" | "active" | "paused" | "ended";
  uses: number;
};

export type AutomationRule = {
  id: string;
  name: string;
  goal: "cut" | "bulk" | "recomp" | "fitness";
  gender: "male" | "female";
  level: "beginner" | "intermediate" | "advanced";
  training_days: number;
  training_template_id: string;
  training_template_name: string;
  training_template_version: number;
  nutrition_blueprint: Record<string, unknown>;
  priority: number;
  is_fallback: boolean;
  is_active: boolean;
};

export type RuntimeSettings = {
  first_app_preparation_minutes: number;
  missing_input_window_minutes: number;
  checkout_paused: boolean;
  signups_paused: boolean;
  promotions_paused: boolean;
  free_promo_video_url: string | null;
  primary_cta_text: string;
};

export type OperatorPreferences = {
  sound_enabled: boolean;
  critical_sound_enabled: boolean;
  important_sound_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
};

export type MobileCommandCenter = {
  prices: CommandCenterPrice[];
  promotions: CommandCenterPromotion[];
  promo_codes: CommandCenterPromoCode[];
  automation_rules: AutomationRule[];
  settings: RuntimeSettings;
  preferences: OperatorPreferences;
};

export type ProductNotification = {
  id: string;
  audience_type: "client" | "membership" | "all" | "admin";
  audience_value: string | null;
  severity: "critical" | "important" | "info";
  category: string;
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  deep_link: string | null;
  is_read: boolean;
  created_at: string;
};

export type OperationalAlert = {
  id: string;
  severity: "critical" | "important" | "info";
  category: string;
  client_id: string | null;
  client_name: string | null;
  title: string;
  deep_link: string;
  created_at: string;
};

export type AdminDashboardPulse = {
  new_clients_7d: number;
  missing_training: number;
  missing_nutrition: number;
  training_drafts: number;
  nutrition_drafts: number;
  memberships_expiring_14d: number;
  memberships_expired: number;
  active_promotions: number;
  operational_alerts: number;
};

export type ClientExperiencePreview = {
  client: {
    id: string;
    name: string | null;
    avatar_path: string | null;
    goal: string | null;
    gender: string | null;
    level: string | null;
    training_days: string | number | null;
  };
  membership: Record<string, unknown> | null;
  training: Record<string, unknown> | null;
  nutrition: Record<string, unknown> | null;
  locks: { training_locked: boolean; nutrition_locked: boolean };
};

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpc.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export function fetchMobileCommandCenter() {
  return call<MobileCommandCenter>("admin_get_mobile_command_center");
}

export function saveBasePrice(payload: Record<string, unknown>) {
  return call<CommandCenterPrice>("admin_save_base_price", { p_payload: payload });
}

export function savePromotion(payload: Record<string, unknown>) {
  return call<CommandCenterPromotion>("admin_save_promotion", { p_payload: payload });
}

export function savePromoCode(payload: Record<string, unknown>) {
  return call<CommandCenterPromoCode>("admin_save_promo_code", { p_payload: payload });
}

export function saveAutomationRule(payload: Record<string, unknown>) {
  return call<AutomationRule>("admin_save_automation_rule", { p_payload: payload });
}

export function saveRuntimeSettings(payload: Record<string, unknown>) {
  return call<RuntimeSettings>("admin_save_runtime_settings", { p_payload: payload });
}

export function saveOperatorPreferences(payload: Record<string, unknown>) {
  return call<OperatorPreferences>("admin_save_operator_preferences", { p_payload: payload });
}

export function sendProductNotification(payload: Record<string, unknown>) {
  return call<ProductNotification>("admin_send_product_notification", { p_payload: payload });
}

export function listProductNotifications(limit = 50) {
  return call<ProductNotification[]>("admin_list_product_notifications", { p_limit: limit });
}

export function markProductNotificationRead(id: string) {
  return call<void>("admin_mark_product_notification_read", { p_id: id });
}

export function listOperationalAlerts() {
  return call<OperationalAlert[]>("admin_list_operational_alerts");
}

export function fetchAdminDashboardPulse() {
  return call<AdminDashboardPulse>("admin_get_dashboard_pulse");
}

export function getClientExperiencePreview(clientId: string) {
  return call<ClientExperiencePreview | null>("admin_get_client_experience_preview", {
    p_client_id: clientId,
  });
}

export type ResolvedPublicOffer = {
  ok: boolean;
  code: string;
  plan?: string;
  term_months?: number;
  currency?: string;
  base_amount?: number;
  final_amount?: number;
  promotion?: { id: string; name: string; ends_at: string } | null;
  promo_code?: { id: string; code: string; discount_type: string; discount_value: number } | null;
  validated_at?: string;
};

export function resolvePublicOffer(plan: string, termMonths: number, code?: string | null) {
  return call<ResolvedPublicOffer>("resolve_public_offer", {
    p_plan: plan,
    p_term_months: termMonths,
    p_code: code ?? null,
  });
}
