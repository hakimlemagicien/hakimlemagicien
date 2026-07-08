import { supabase } from "@/integrations/supabase/client";

export type MembershipTier = "visitor" | "free" | "premium" | "admin";

export type MembershipState = {
  tier: MembershipTier;
  isPremium: boolean;
  isAdmin: boolean;
  displayName: string;
};

const PREMIUM_PAYMENT_STATUSES = new Set(["approved", "confirmed"]);

function isPremiumLead(lead: {
  status: string | null;
  payment_status: string | null;
} | null): boolean {
  if (!lead) return false;
  return lead.status === "active" && PREMIUM_PAYMENT_STATUSES.has(lead.payment_status ?? "");
}

export async function resolveMembership(userId: string): Promise<MembershipState> {
  const [{ data: roles }, { data: profile }, { data: lead }, { data: plan }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("profiles").select("full_name, email").eq("id", userId).maybeSingle(),
    supabase.from("leads").select("status, payment_status").eq("user_id", userId).maybeSingle(),
    supabase.from("plans").select("is_active").eq("user_id", userId).eq("is_active", true).maybeSingle(),
  ]);

  const isAdmin = roles?.some((row) => row.role === "admin") ?? false;
  const isPremium = isAdmin || isPremiumLead(lead) || Boolean(plan?.is_active);

  const displayName =
    profile?.full_name?.trim() ||
    profile?.email?.split("@")[0] ||
    "بطل";

  let tier: MembershipTier = "free";
  if (isAdmin) tier = "admin";
  else if (isPremium) tier = "premium";

  return {
    tier,
    isPremium,
    isAdmin,
    displayName,
  };
}
