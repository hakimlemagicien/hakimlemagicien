/**
 * Pricing & Activation Strategy — MAAKFIT (CEO official)
 *
 * Philosophy: we do not sell a subscription — we activate a personal program
 * inside an Arabic digital coaching platform.
 *
 * - Official catalogs: FREE → PLUS → PRO → VIP
 * - Internal IDs stay: free | essential | premium | vip (do not rename IDs)
 * - Paid terms only: 3 months | 6 months (no monthly core product)
 * - Total = official price; daily rate = illustrative value framing only
 * - Primary CTA copy: «فعّل برنامجك الآن»
 */

export const ACTIVATE_PROGRAM_CTA = "فعّل برنامجك الآن" as const;
export const CONTINUE_PAYMENT_CTA = "متابعة الدفع" as const;

export type PaidTierId = "essential" | "premium" | "vip";
export type MembershipCatalogId = "free" | PaidTierId;
export type SubscriptionTermMonths = 3 | 6;

export type PricingDuration = {
  label: string;
  days: number;
  months: SubscriptionTermMonths;
};

export type SubscriptionTermOffer = {
  months: SubscriptionTermMonths;
  duration: PricingDuration;
  /** Official total for this term (sale price) */
  totalPrice: number;
  /** Highlight longer term */
  bestValue?: boolean;
  /** Savings vs buying the 3-month term twice */
  savingsUsd?: number;
  savingsNote?: string;
};

export type PaidTierCatalog = {
  id: PaidTierId;
  name: string;
  tagline: string;
  /** Value-first bullets (plan screen — not price-first) */
  features: string[];
  /** Position in product story */
  role: string;
  popular?: boolean;
  terms: [SubscriptionTermOffer, SubscriptionTermOffer];
};

export type FreeTierCatalog = {
  id: "free";
  name: string;
  tagline: string;
  features: string[];
  role: string;
};

export function approxDailyRate(totalUsd: number, days: number): number {
  if (!Number.isFinite(totalUsd) || !Number.isFinite(days) || days <= 0) return 0;
  return totalUsd / days;
}

export function formatOfficialTotal(totalUsd: number | string, currency = "USD"): string {
  const n = typeof totalUsd === "string" ? Number(totalUsd) : totalUsd;
  if (!Number.isFinite(n)) return String(totalUsd);
  const rounded = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.00$/, "");
  return currency === "USD" ? `$${rounded}` : `${rounded} ${currency}`;
}

/**
 * Illustrative daily copy only — never the charged amount.
 * Under $1/day: ceil to the next cent, then +$0.01 so we can say «أقل من X.XX$».
 * Example: 87 ÷ 90 ≈ 0.966 → أقل من 0.98$ يومياً
 */
export function formatIllustrativeDaily(totalUsd: number | string, days: number): string {
  const n = typeof totalUsd === "string" ? Number(totalUsd) : totalUsd;
  const daily = approxDailyRate(n, days);
  if (!daily) return "";

  if (daily < 1) {
    const ceilingCent = Math.ceil(daily * 100 - 1e-9) / 100;
    const framed = Number((ceilingCent + 0.01).toFixed(2));
    return `أقل من ${framed.toFixed(2)}$ يومياً`;
  }

  const pretty = daily >= 10 ? daily.toFixed(0) : daily.toFixed(1).replace(/\.0$/, "");
  return `حوالي ${pretty}$ يومياً`;
}

/** Numeric daily rate string for compact UI chips (e.g. quiz tabs). */
export function illustrativeDailyAmount(totalUsd: number | string, days: number): string {
  const n = typeof totalUsd === "string" ? Number(totalUsd) : totalUsd;
  const daily = approxDailyRate(n, days);
  if (!daily) return "";
  if (daily < 1) {
    const ceilingCent = Math.ceil(daily * 100 - 1e-9) / 100;
    return Number((ceilingCent + 0.01).toFixed(2)).toFixed(2);
  }
  return daily >= 10 ? daily.toFixed(0) : daily.toFixed(2);
}

export function formatSavings(amountUsd: number, note?: string): string | null {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return null;
  const rounded = Number.isInteger(amountUsd)
    ? String(amountUsd)
    : amountUsd.toFixed(2).replace(/\.00$/, "");
  if (note) return `وفر ${rounded} دولار — ${note}`;
  return `وفر ${rounded} دولار`;
}

function term(
  months: SubscriptionTermMonths,
  totalPrice: number,
  opts?: { bestValue?: boolean; savingsUsd?: number },
): SubscriptionTermOffer {
  const days = months === 3 ? 90 : 180;
  const baselineTwice = months === 6 ? undefined : undefined;
  void baselineTwice;
  const savingsNote =
    months === 6 && opts?.savingsUsd
      ? "مقارنة بالاشتراك لمدة 3 أشهر مرتين"
      : undefined;

  return {
    months,
    duration: {
      months,
      days,
      label: months === 3 ? "3 أشهر" : "6 أشهر",
    },
    totalPrice,
    bestValue: opts?.bestValue,
    savingsUsd: opts?.savingsUsd,
    savingsNote,
  };
}

/** Official free entry point — all users start here. */
export const FREE_TIER: FreeTierCatalog = {
  id: "free",
  name: "FREE",
  tagline: "ابدأ رحلتك",
  role: "دخول مجاني دائم وتجربة حقيقية محدودة",
  features: [
    "دخول مجاني دائم للمنصة",
    "تجربة حقيقية محدودة للتدريب والتغذية",
    "اكتشف شكل برنامجك الشخصي",
    "فعّل خطتك الكاملة في أي وقت",
  ],
};

/** Adopted PLUS bullets (Sep 2026) — keep display name PLUS, internal id essential. */
export const PLUS_PLAN_FEATURES = [
  "برنامج تدريبي كامل مخصص",
  "خطة تغذية كاملة حسب هدفك",
  "إمكانية تغيير تمرين أو وجبة",
  "متابعة تقدمك داخل المنصة",
] as const;

/** Adopted PRO bullets (Sep 2026) — keep display name PRO, internal id premium. */
export const PRO_PLAN_FEATURES = [
  "كل مزايا PLUS",
  "مراجعة تقدم دورية كل أسبوعين",
  "تحسينات مناسبة على البرنامج حسب تقدمك",
  "خيارات غذائية أوسع",
  "بديل لأي تمرين",
  "الأولوية في الدعم",
  "تحكم كامل في برنامجك",
] as const;

export const VIP_PLAN_FEATURES = [
  "كل مزايا PRO",
  "دعم يومي بأولوية أعلى (ليس 24/7 وليس رداً فورياً مضموناً)",
  "متابعة أقرب مع Coach Hakim",
  "تعديلات أسرع عند الملاءمة",
] as const;

/**
 * Official paid catalog.
 * Core product = PLUS (id: essential). PRO/VIP add progression & services on top.
 * Terms: 3 months | 6 months only (no monthly).
 *
 * Official V1 economics (CEO 2026-08-20):
 * PLUS 87 / 149 · PRO 147 / 249 · VIP 397 / 647
 * 6-month savings vs buying the 3-month term twice.
 */
export const PAID_TIERS: PaidTierCatalog[] = [
  {
    id: "essential",
    name: "PLUS",
    tagline: "خطتك الكاملة",
    role: "التدريب والتغذية الشخصية الكاملة والمزايا الأساسية المدفوعة",
    features: [...PLUS_PLAN_FEATURES],
    terms: [
      term(3, 87),
      term(6, 149, {
        bestValue: true,
        savingsUsd: 25,
      }),
    ],
  },
  {
    id: "premium",
    name: "PRO",
    tagline: "خطتك التي تتطور معك",
    role: "أعلى مرونة ومتابعة داخل البرنامج",
    features: [...PRO_PLAN_FEATURES],
    popular: true,
    terms: [
      term(3, 147),
      term(6, 249, {
        bestValue: true,
        savingsUsd: 45,
      }),
    ],
  },
  {
    id: "vip",
    name: "VIP",
    tagline: "أعلى مستوى متابعة شخصية — ليست 24/7",
    role: "أعلى مستوى خدمة ومتابعة",
    features: [...VIP_PLAN_FEATURES],
    terms: [
      term(3, 397),
      term(6, 647, {
        bestValue: true,
        savingsUsd: 147,
      }),
    ],
  },
];

export function getPaidTier(id: PaidTierId): PaidTierCatalog {
  const tier = PAID_TIERS.find((t) => t.id === id);
  if (!tier) throw new Error(`Unknown paid tier: ${id}`);
  return tier;
}

export function getTermOffer(tierId: PaidTierId, months: SubscriptionTermMonths): SubscriptionTermOffer {
  const tier = getPaidTier(tierId);
  const offer = tier.terms.find((t) => t.months === months);
  if (!offer) throw new Error(`Missing term ${months} for ${tierId}`);
  return offer;
}

/** Legacy adapter for surfaces that still render a flat list of priced cards. */
export type PresentationPlan = {
  id: string;
  name: string;
  tagline: string;
  totalPrice: number;
  duration: PricingDuration;
  features: string[];
  popular?: boolean;
  bestValue?: boolean;
  savingsUsd?: number;
  savingsNote?: string;
  tierId: PaidTierId;
};

/** Flatten: each paid tier × preferred display term (6mo best-value first in UI). */
export const MEMBERSHIP_PRESENTATION_PLANS: PresentationPlan[] = PAID_TIERS.flatMap((tier) => {
  const preferred = tier.terms.find((t) => t.bestValue) ?? tier.terms[0];
  return [
    {
      id: `${tier.id}-${preferred.months}m`,
      tierId: tier.id,
      name: tier.name,
      tagline: tier.tagline,
      totalPrice: preferred.totalPrice,
      duration: preferred.duration,
      features: tier.features,
      popular: tier.popular,
      bestValue: preferred.bestValue,
      savingsUsd: preferred.savingsUsd,
      savingsNote: preferred.savingsNote,
    },
  ];
});
