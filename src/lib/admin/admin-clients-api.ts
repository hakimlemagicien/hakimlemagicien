import { supabase } from "@/integrations/supabase/client";

export const ADMIN_CLIENT_PAGE_SIZE = 25;
export const ADMIN_CLIENT_MIN_QUERY = 2;

export type AdminClientListItem = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatarPath: string | null;
  goal: string | null;
  city: string | null;
  membershipPlan: string | null;
  membershipActive: boolean | null;
  onboardingCompletedAt: string | null;
  lastActivityAt: string | null;
  unreadCoachingCount: number;
  waitingCoaching: boolean;
  createdAt: string;
  accountStatus?: string | null;
};

export type AdminClientSearchResult = {
  rows: AdminClientListItem[];
  truncated: boolean;
  totalCount: number;
  query: string;
};

export type AdminClientOverview = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_path: string | null;
  goal: string | null;
  city: string | null;
  training_type: string | null;
  program_start_date: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  membership: {
    tier: string;
    is_active: boolean;
    source: string;
    starts_at: string;
    ends_at: string | null;
    billing_period_months?: number | null;
    paid_period_end?: string | null;
    auto_renew?: boolean | null;
    cancel_at_period_end?: boolean | null;
    next_renewal_at?: string | null;
  } | null;
  coaching: {
    conversation_id: string;
    status: string;
    last_message_at: string | null;
    unread_count: number;
  } | null;
  assignment: {
    id: string;
    source_template_id: string;
    template_version: number;
    status: string;
    assigned_at: string;
    starts_on?: string | null;
    name_ar?: string | null;
    duration_weeks?: number | null;
    snapshot_complete?: boolean | null;
    progression_status?: string | null;
    progression_strategy?: string | null;
  } | null;
  last_workout_at: string | null;
  last_nutrition_at?: string | null;
  nutrition_assignment?: {
    id: string;
    status: string;
    name_ar: string | null;
    starts_on: string | null;
    assigned_at: string;
    snapshot_complete: boolean;
    allergen_conflict: boolean;
  } | null;
  notes_count: number;
  open_support_count?: number;
  account_status?: string | null;
  account_deleted_at?: string | null;
};

function mapListRow(row: {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_path: string | null;
  goal: string | null;
  city: string | null;
  membership_plan: string | null;
  membership_active: boolean | null;
  onboarding_completed_at: string | null;
  last_activity_at: string | null;
  unread_coaching_count: number;
  waiting_coaching: boolean;
  created_at: string;
  account_status?: string | null;
  total_count: number;
}): AdminClientListItem {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    avatarPath: row.avatar_path,
    goal: row.goal,
    city: row.city,
    membershipPlan: row.membership_plan,
    membershipActive: row.membership_active,
    onboardingCompletedAt: row.onboarding_completed_at,
    lastActivityAt: row.last_activity_at,
    unreadCoachingCount: row.unread_coaching_count,
    waitingCoaching: row.waiting_coaching,
    createdAt: row.created_at,
    accountStatus: row.account_status ?? "active",
  };
}

export function clampAdminClientLimit(limit: number): number {
  if (!Number.isFinite(limit)) return ADMIN_CLIENT_PAGE_SIZE;
  return Math.min(Math.max(Math.trunc(limit), 1), ADMIN_CLIENT_PAGE_SIZE);
}

export async function searchAdminClients(
  query: string,
  opts?: {
    plan?: string;
    onboarding?: "complete" | "incomplete";
    accountStatus?: "all" | "active" | "suspended" | "archived" | "deletion_pending";
    offset?: number;
  },
): Promise<AdminClientSearchResult> {
  const trimmed = query.trim();
  if (trimmed.length > 0 && trimmed.length < ADMIN_CLIENT_MIN_QUERY) {
    return { rows: [], truncated: false, totalCount: 0, query: trimmed };
  }

  const { data, error } = await supabase.rpc("admin_list_clients", {
    p_query: trimmed || null,
    p_plan: opts?.plan || null,
    p_onboarding: opts?.onboarding || null,
    p_limit: clampAdminClientLimit(ADMIN_CLIENT_PAGE_SIZE),
    p_offset: Math.max(opts?.offset ?? 0, 0),
    p_account_status: opts?.accountStatus ?? null,
  });

  if (error) throw error;

  const rows = (data ?? []).map(mapListRow);
  const totalCount = data?.[0]?.total_count ?? rows.length;
  return {
    query: trimmed,
    totalCount,
    truncated: totalCount > rows.length,
    rows,
  };
}

export async function fetchAdminClient(clientId: string): Promise<AdminClientListItem | null> {
  const overview = await fetchAdminClientOverview(clientId);
  if (!overview) return null;
  return {
    id: overview.id,
    fullName: overview.full_name,
    email: overview.email,
    phone: overview.phone,
    avatarPath: overview.avatar_path,
    goal: overview.goal,
    city: overview.city,
    membershipPlan: overview.membership?.tier ?? null,
    membershipActive: overview.membership?.is_active ?? null,
    onboardingCompletedAt: overview.onboarding_completed_at,
    lastActivityAt: overview.last_workout_at,
    unreadCoachingCount: overview.coaching?.unread_count ?? 0,
    waitingCoaching: overview.coaching?.status === "waiting_for_reply",
    createdAt: overview.created_at,
    accountStatus: overview.account_status ?? "active",
  };
}

export async function fetchAdminClientOverview(clientId: string): Promise<AdminClientOverview | null> {
  const { data, error } = await supabase.rpc("admin_get_client_overview", {
    p_client_id: clientId,
  });
  if (error) throw error;
  if (!data || typeof data !== "object") return null;
  return data as AdminClientOverview;
}

export async function setAdminClientTrainingGoal(input: {
  clientId: string;
  goal: string;
  reason: string;
}): Promise<{ goal: string; before: string | null }> {
  const { data, error } = await supabase.rpc("admin_set_client_training_goal", {
    p_client_id: input.clientId,
    p_goal: input.goal,
    p_reason: input.reason,
  });
  if (error) throw error;
  const row = (data ?? {}) as { goal?: string; before?: string | null };
  return {
    goal: String(row.goal ?? input.goal),
    before: row.before ?? null,
  };
}
