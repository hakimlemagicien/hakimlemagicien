import { supabase } from "@/integrations/supabase/client";

export type MembershipTier = "visitor" | "free" | "essential" | "premium" | "vip" | "admin";

export type MembershipFeatures = {
  platform_access: boolean;
  workout_program: boolean;
  nutrition_plan: boolean;
  progress_tracking: boolean;
  free_content: boolean;
  periodic_reviews: boolean;
  limited_coach_contact: boolean;
  personal_followup: boolean;
  program_adjustments: boolean;
  priority_contact: boolean;
};

export type MembershipResponse = {
  tier: Exclude<MembershipTier, "visitor">;
  is_free: boolean;
  is_paid: boolean;
  is_active: boolean;
  subscription_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  days_remaining: number;
  features: MembershipFeatures;
};

export type MembershipState = MembershipResponse & {
  displayName: string;
  isVisitor: boolean;
};

export const MEMBERSHIP_QUERY_KEY = ["membership", "current"] as const;

const DEFAULT_FEATURES: MembershipFeatures = {
  platform_access: true,
  workout_program: false,
  nutrition_plan: false,
  progress_tracking: false,
  free_content: true,
  periodic_reviews: false,
  limited_coach_contact: false,
  personal_followup: false,
  program_adjustments: false,
  priority_contact: false,
};

export const FREE_MEMBERSHIP_STATE: MembershipState = {
  tier: "free",
  is_free: true,
  is_paid: false,
  is_active: true,
  subscription_id: null,
  starts_at: null,
  ends_at: null,
  days_remaining: 0,
  features: DEFAULT_FEATURES,
  displayName: "بطل",
  isVisitor: false,
};

function normalizeMembershipResponse(data: unknown): MembershipResponse {
  const source = (data ?? {}) as Partial<MembershipResponse>;
  const rawFeatures = (source.features ?? {}) as Partial<MembershipFeatures>;

  const tier = source.tier;
  const safeTier: MembershipResponse["tier"] =
    tier === "admin" || tier === "vip" || tier === "premium" || tier === "essential" || tier === "free"
      ? tier
      : "free";

  return {
    tier: safeTier,
    is_free: source.is_free ?? safeTier === "free",
    is_paid: source.is_paid ?? safeTier !== "free",
    is_active: source.is_active ?? true,
    subscription_id: source.subscription_id ?? null,
    starts_at: source.starts_at ?? null,
    ends_at: source.ends_at ?? null,
    days_remaining: source.days_remaining ?? 0,
    features: {
      platform_access: rawFeatures.platform_access ?? true,
      workout_program: rawFeatures.workout_program ?? false,
      nutrition_plan: rawFeatures.nutrition_plan ?? false,
      progress_tracking: rawFeatures.progress_tracking ?? false,
      free_content: rawFeatures.free_content ?? true,
      periodic_reviews: rawFeatures.periodic_reviews ?? false,
      limited_coach_contact: rawFeatures.limited_coach_contact ?? false,
      personal_followup: rawFeatures.personal_followup ?? false,
      program_adjustments: rawFeatures.program_adjustments ?? false,
      priority_contact: rawFeatures.priority_contact ?? false,
    },
  };
}

export async function getMyMembership(): Promise<MembershipResponse> {
  const { data, error } = await supabase.rpc("get_my_membership");
  if (error) throw error;
  return normalizeMembershipResponse(data);
}

export async function resolveDisplayName(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();

  return data?.full_name?.trim() || data?.email?.split("@")[0] || "بطل";
}

export async function fetchMembershipState(): Promise<MembershipState> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { ...FREE_MEMBERSHIP_STATE, tier: "visitor", isVisitor: true };
  }

  try {
    const [membership, displayName] = await Promise.all([
      getMyMembership(),
      resolveDisplayName(data.user.id),
    ]);

    return {
      ...membership,
      displayName,
      isVisitor: false,
    };
  } catch (err) {
    // Keep the app usable: never crash / hang the platform home on RPC failure.
    console.error("[fetchMembershipState]", err);
    const displayName = await resolveDisplayName(data.user.id).catch(() => "بطل");
    return {
      ...FREE_MEMBERSHIP_STATE,
      displayName,
      isVisitor: false,
    };
  }
}
