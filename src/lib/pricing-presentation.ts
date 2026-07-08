/**
 * Pricing & Activation Strategy — Hakim Coaching (CEO official)
 *
 * Philosophy: we do not sell a subscription — we activate a personal program
 * inside an Arabic digital coaching platform.
 *
 * - Official catalogs: Free → Essential → Premium → VIP
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
 */
export function formatIllustrativeDaily(totalUsd: number | string, days: number): string {
  const n = typeof totalUsd === "string" ? Number(totalUsd) : totalUsd;
  const daily = approxDailyRate(n, days);
  if (!daily) return "";

  if (daily < 1) {
    if (daily >= 0.9) return "أقل من 1 دولار يومياً";
    return `حوالي ${daily.toFixed(2)} دولار يومياً`;
  }

  const pretty = daily >= 10 ? daily.toFixed(0) : daily.toFixed(1).replace(/\.0$/, "");
  return `حوالي ${pretty} دولار يومياً`;
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
  name: "Free",
  tagline: "نقطة الدخول الرسمية — جرب المنصة وابني الثقة قبل التفعيل",
  role: "نقطة الدخول لجميع المستخدمين",
  features: [
    "إنشاء حساب مجاني",
    "الوصول للميزات الأساسية",
    "اكتشف شكل برنامجك الشخصي",
    "فعّل برنامجك في أي وقت يناسبك",
  ],
};

/**
 * Official paid catalog.
 * Core product = Essential. Premium/VIP add services on top.
 * Terms: 3 months | 6 months only (no monthly).
 *
 * Example economics (Essential) from CEO decision:
 * 87 / 90d ≈ 0.96/day · 156 / 180d ≈ 0.86/day · save 18 vs 2×3mo
 */
export const PAID_TIERS: PaidTierCatalog[] = [
  {
    id: "essential",
    name: "Essential",
    tagline: "المنتج الرئيسي — برنامجك الشخصي داخل المنصة",
    role: "المنتج الرئيسي للمنصة",
    features: [
      "برنامج تدريبي مخصص",
      "خطة غذائية أساسية",
      "متابعة التقدم داخل المنصة",
      "دعم عبر البريد الإلكتروني",
    ],
    popular: true,
    terms: [
      term(3, 87),
      term(6, 156, {
        bestValue: true,
        savingsUsd: 18,
      }),
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "كل مزايا Essential مع خدمات إضافية أقرب",
    role: "Essential + خدمات إضافية",
    features: [
      "كل مزايا Essential",
      "خطط غذائية متقدمة",
      "تعديلات أسبوعية",
      "دعم عبر الدردشة",
    ],
    terms: [
      term(3, 147),
      term(6, 258, {
        bestValue: true,
        savingsUsd: 36,
      }),
    ],
  },
  {
    id: "vip",
    name: "VIP",
    tagline: "أعلى مستوى من المتابعة الشخصية",
    role: "أعلى مستوى خدمة ومتابعة",
    features: [
      "كل مزايا Premium",
      "مدرب خاص",
      "خطة مخصصة بالكامل",
      "متابعة يومية وتعديلات فورية",
    ],
    terms: [
      term(3, 267),
      term(6, 468, {
        bestValue: true,
        savingsUsd: 66,
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
