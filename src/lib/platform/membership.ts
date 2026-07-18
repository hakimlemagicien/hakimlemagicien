import { supabase } from "@/integrations/supabase/client";
import { resolveAvatarDisplayUrl } from "@/lib/platform/profile-api";

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
  avatarPath: string | null;
  avatarUrl: string | null;
  isVisitor: boolean;
};

export const MEMBERSHIP_QUERY_KEY = ["membership", "current"] as const;

const MEMBERSHIP_TIER_LABELS_AR: Record<MembershipTier, string> = {
  visitor: "زائر",
  free: "مجاني",
  essential: "أساسي",
  premium: "بريميوم",
  vip: "VIP",
  admin: "أدمن",
};

export function getMembershipTierLabel(tier: MembershipTier): string {
  return MEMBERSHIP_TIER_LABELS_AR[tier];
}

export function isPaidMembershipTier(tier: MembershipTier): boolean {
  return tier === "essential" || tier === "premium" || tier === "vip" || tier === "admin";
}

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
  avatarPath: null,
  avatarUrl: null,
  isVisitor: false,
};

const LOCAL_FREE_FEATURES: MembershipFeatures = {
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

function isLocalAppRuntime() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  const isLocalHost = host === "127.0.0.1" || host === "localhost";
  const isAppPath = window.location.pathname.startsWith("/app");
  return isLocalHost && isAppPath;
}

/** Localhost preview: always show free-member UI (ignores paid DB tiers). */
function withLocalFreeOverride(state: MembershipState): MembershipState {
  if (!isLocalAppRuntime()) return state;
  return {
    ...state,
    tier: "free",
    is_free: true,
    is_paid: false,
    is_active: true,
    features: LOCAL_FREE_FEATURES,
  };
}

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

export async function resolveProfileSnapshot(userId: string): Promise<{
  displayName: string;
  avatarPath: string | null;
}> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_path")
    .eq("id", userId)
    .maybeSingle();

  return {
    displayName: data?.full_name?.trim() || data?.email?.split("@")[0] || "بطل",
    avatarPath: data?.avatar_path ?? null,
  };
}

function resolveAvatarUrl(avatarPath: string | null): Promise<string | null> {
  return resolveAvatarDisplayUrl(avatarPath);
}

export async function fetchMembershipState(): Promise<MembershipState> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return withLocalFreeOverride({ ...FREE_MEMBERSHIP_STATE, tier: "visitor", isVisitor: true });
  }

  try {
    const [membership, profile] = await Promise.all([
      getMyMembership(),
      resolveProfileSnapshot(data.user.id),
    ]);
    const avatarUrl = await resolveAvatarUrl(profile.avatarPath);

    return withLocalFreeOverride({
      ...membership,
      displayName: profile.displayName,
      avatarPath: profile.avatarPath,
      avatarUrl,
      isVisitor: false,
    });
  } catch (err) {
    // Keep the app usable: never crash / hang the platform home on RPC failure.
    console.error("[fetchMembershipState]", err);
    const profile = await resolveProfileSnapshot(data.user.id).catch(() => ({
      displayName: "بطل",
      avatarPath: null,
    }));
    const avatarUrl = await resolveAvatarUrl(profile.avatarPath);
    return withLocalFreeOverride({
      ...FREE_MEMBERSHIP_STATE,
      displayName: profile.displayName,
      avatarPath: profile.avatarPath,
      avatarUrl,
      isVisitor: false,
    });
  }
}
