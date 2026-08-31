import { supabase } from "@/integrations/supabase/client";
import { resolveAvatarDisplayUrl } from "@/lib/platform/profile-api";
import {
  FREE_ENTITLEMENTS,
  normalizeEntitlements,
  type EntitlementsSnapshot,
} from "@/lib/platform/entitlements";

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
  billing_period_months?: 3 | 6 | null;
  price_amount?: number | null;
  currency?: string | null;
  auto_renew?: boolean | null;
  cancel_at_period_end?: boolean | null;
  next_renewal_at?: string | null;
  paid_period_end?: string | null;
};

export type MembershipState = MembershipResponse & {
  displayName: string;
  avatarPath: string | null;
  avatarUrl: string | null;
  isVisitor: boolean;
  entitlements: EntitlementsSnapshot;
};

export const MEMBERSHIP_QUERY_KEY = ["membership", "current"] as const;

/** App-review founder account — VIP + admin (see supabase migration founder_review). */
export const FOUNDER_REVIEW_EMAIL = "hakimlemagicien@gmail.com";

export function isFounderReviewEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === FOUNDER_REVIEW_EMAIL;
}

export function resolveAuthEmail(
  user:
    | {
        email?: string | null;
        user_metadata?: Record<string, unknown> | null;
        identities?: Array<{ identity_data?: Record<string, unknown> | null }> | null;
      }
    | null
    | undefined,
): string | null {
  if (!user) return null;
  const metaEmail = user.user_metadata?.email;
  const identityEmail = user.identities
    ?.map((identity) => identity.identity_data?.email)
    .find((value) => typeof value === "string" && value.trim());
  const raw =
    user.email ||
    (typeof metaEmail === "string" ? metaEmail : null) ||
    (typeof identityEmail === "string" ? identityEmail : null);
  return raw?.trim() || null;
}

const VIP_FEATURES: MembershipFeatures = {
  platform_access: true,
  workout_program: true,
  nutrition_plan: true,
  progress_tracking: true,
  free_content: true,
  periodic_reviews: true,
  limited_coach_contact: true,
  personal_followup: true,
  program_adjustments: true,
  priority_contact: true,
};

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
  entitlements: FREE_ENTITLEMENTS,
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

/** Localhost preview: free-tier UI unless the member is paid (e.g. founder VIP review). */
function withLocalFreeOverride(state: MembershipState): MembershipState {
  if (!isLocalAppRuntime()) return state;
  if (state.is_paid || isPaidMembershipTier(state.tier)) return state;
  return {
    ...state,
    tier: "free",
    is_free: true,
    is_paid: false,
    is_active: true,
    features: LOCAL_FREE_FEATURES,
    entitlements: FREE_ENTITLEMENTS,
  };
}

function buildFounderReviewMembership(
  base: Omit<MembershipState, "tier" | "is_free" | "is_paid" | "is_active" | "features">,
): MembershipState {
  return {
    ...base,
    tier: "vip",
    is_free: false,
    is_paid: true,
    is_active: true,
    subscription_id: base.subscription_id ?? null,
    starts_at: base.starts_at ?? new Date().toISOString(),
    ends_at: base.ends_at,
    days_remaining: base.days_remaining ?? 3650,
    features: VIP_FEATURES,
    entitlements: normalizeEntitlements({
      tier: "vip",
      is_paid: true,
      subscription_status: "active",
      training: { full_session: true, allowed_exercises_per_session: 99, preview_exercises: false },
      nutrition: { full_day: true, daily_swap_limit: null, multiple_alternatives: true, unlocked_meal_strategy: "all_assigned" },
      coach_chat: true,
    }),
    isVisitor: false,
  };
}

function normalizeMembershipResponse(data: unknown): MembershipResponse & { entitlements: EntitlementsSnapshot } {
  const source = (data ?? {}) as Partial<MembershipResponse> & { entitlements?: unknown };
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
    paid_period_end: source.paid_period_end ?? source.ends_at ?? null,
    billing_period_months:
      source.billing_period_months === 3 || source.billing_period_months === 6
        ? source.billing_period_months
        : null,
    price_amount: source.price_amount ?? null,
    currency: source.currency ?? "USD",
    auto_renew: source.auto_renew ?? null,
    cancel_at_period_end: source.cancel_at_period_end ?? null,
    next_renewal_at: source.next_renewal_at ?? null,
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
    entitlements: normalizeEntitlements(source.entitlements),
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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) {
    return withLocalFreeOverride({ ...FREE_MEMBERSHIP_STATE, tier: "visitor", isVisitor: true });
  }

  try {
    const [membership, profile] = await Promise.all([
      getMyMembership(),
      resolveProfileSnapshot(user.id),
    ]);
    const avatarUrl = await resolveAvatarUrl(profile.avatarPath);

    const email = resolveAuthEmail(user);
    const resolved =
      isFounderReviewEmail(email) && membership.tier !== "vip"
        ? buildFounderReviewMembership({
            ...membership,
            displayName: profile.displayName,
            avatarPath: profile.avatarPath,
            avatarUrl,
          })
        : {
            ...membership,
            displayName: profile.displayName,
            avatarPath: profile.avatarPath,
            avatarUrl,
            isVisitor: false as const,
          };

    return withLocalFreeOverride(resolved);
  } catch (err) {
    // Keep the app usable: never crash / hang the platform home on RPC failure.
    console.error("[fetchMembershipState]", err);
    const profile = await resolveProfileSnapshot(user.id).catch(() => ({
      displayName: "بطل",
      avatarPath: null,
    }));
    const avatarUrl = await resolveAvatarUrl(profile.avatarPath);
    const email = resolveAuthEmail(user);
    const fallback = isFounderReviewEmail(email)
      ? buildFounderReviewMembership({
          ...FREE_MEMBERSHIP_STATE,
          displayName: profile.displayName,
          avatarPath: profile.avatarPath,
          avatarUrl,
        })
      : {
          ...FREE_MEMBERSHIP_STATE,
          displayName: profile.displayName,
          avatarPath: profile.avatarPath,
          avatarUrl,
          isVisitor: false as const,
        };
    return withLocalFreeOverride(fallback);
  }
}
